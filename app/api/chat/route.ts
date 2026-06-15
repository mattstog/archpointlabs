// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'

const sql = neon(process.env.POSTGRES_URL!)

// Prompts that are eligible for caching — must match the chips in page.tsx exactly
const CACHEABLE_PROMPTS = new Set([
  "Can you help with AI implementation?",
  "What makes Archpoint Labs different?",
  "Tell me about your recent projects",
  "I'm interested in custom software development",
])

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.4-mini'
const CACHED_STREAM_INITIAL_DELAY_MS = 300
const CACHED_STREAM_CHUNK_DELAY_MS = 22
const CACHED_STREAM_CHUNK_SIZE = 18
const STREAM_ERROR_RESPONSE =
  "Sorry, I'm having trouble reaching the AI service right now. Please try again in a moment."

const CURATED_CACHE_RESPONSES: Record<string, string> = {
  "Can you help with AI implementation?": `Yes. Archpoint Labs helps businesses turn practical AI ideas into working software, not just demos.

That can mean adding AI to an existing workflow, building an internal assistant, automating document-heavy processes, connecting AI to your database or business systems, or creating a custom app where AI handles the repetitive analysis and your team stays in control.

A good first step is usually a short discovery call: what process is slow, what information the team relies on, where the data lives, and what a useful first version would need to do.

If you have a workflow in mind, what are you hoping AI could take off your team's plate?`,

  "What makes Archpoint Labs different?": `Archpoint Labs is led by Matt Stogner, the founder and principal technical lead. Matt works directly with clients to turn messy business workflows into practical software, automation, and AI systems.

The difference is that Archpoint Labs is not trying to force a generic tool into your process. The work starts with how your team actually operates: spreadsheets, manual reporting, disconnected systems, document-heavy review, and ideas that need to become real products.

From there, Archpoint designs and builds the custom app, automation, integration, data workflow, or AI agent that fits the job. The goal is practical: save time, reduce errors, improve visibility, and give the business a system it can actually use.

Milo is part of that philosophy. This chat is a small proof point of how Archpoint thinks about useful AI: integrated into the workflow, easy to use, and tied to a clear business purpose.`,

  "Tell me about your recent projects": `A few recent examples:

**School Psychologist Workflow Platform**

Archpoint Labs built custom software for an educational services company serving school psychologists. The platform replaced a manual reporting process that took about an hour per student with a workflow that now takes minutes, giving the team a cleaner interface and a backend built around their real caseload.

**AIcreage Mineral Rights Acquisition Platform**

Matt Stogner, the founder of Archpoint Labs, is currently CTO at AIcreage. AIcreage is applying AI to mineral rights acquisition and landman workflows, including courthouse record ingestion, deed parsing, ownership intelligence, and tract-level review. It is a good example of Matt leading an AI-native product in a complex, document-heavy industry. Public site: https://www.aicreage.com.

**Archpoint Claims**

Archpoint Claims started as a custom software build for one client and quickly grew into a broader claims processing platform. It helps teams move away from manual claims workflows and into purpose-built software that saves significant time and money. Public site: https://archpointclaims.com.

The common thread is custom software that replaces slow, manual operational work with focused tools built around the business.`,

  "I'm interested in custom software development": `That is exactly the kind of work Archpoint Labs focuses on.

Custom software is usually the right fit when your business has a process that is too specific for off-the-shelf tools: internal dashboards, client portals, workflow platforms, reporting systems, document processing, integrations, or AI-assisted tools that need to match how your team actually operates.

Archpoint Labs can help shape the idea, scope the first useful version, design the interface, build the app, connect the data, deploy it, and keep improving it after launch.

The fastest way to figure out fit is to start with the workflow. What are you trying to build, replace, or automate?`,
}

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type UserInfo = { 
  ip?: string | null
  userAgent?: string | null
  location?: UserLocation | null
  timestamp?: string 
}

type UserLocation = {
  city?: string
  region?: string
  country?: string
  latitude?: string
  longitude?: string
  timezone?: string
}

type ChatRequest = {
  messages: Message[]
  sessionId: string
  stream?: boolean
  skipCache?: boolean
  refreshCache?: boolean
  skipLog?: boolean
}

function getSystemPrompt(): string {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', 'system-prompt.md')
    const promptContent = fs.readFileSync(promptPath, 'utf8')
    return promptContent.trim()
  } catch (error) {
    console.warn('Could not load system prompt file, using default:', error)
    return `You are Milo, the AI sales assistant for Archpoint Labs.
    Help businesses understand how custom software, AI implementation, automation, and data tools can solve their operational problems.
    Be professional, concise, and consultative while guiding qualified prospects toward scheduling a call or sharing contact information.`
  }
}

function getCacheKey(prompt: string, systemPrompt: string): string {
  const promptVersion = createHash('sha256').update(systemPrompt).digest('hex').slice(0, 12)
  return `${promptVersion}:${prompt}`
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createTextStream(text: string) {
  const encoder = new TextEncoder()
  let offset = 0
  let started = false

  return new ReadableStream({
    async pull(controller) {
      if (!started) {
        started = true
        await sleep(CACHED_STREAM_INITIAL_DELAY_MS)
      }

      if (offset >= text.length) {
        controller.close()
        return
      }

      const nextOffset = Math.min(text.length, offset + CACHED_STREAM_CHUNK_SIZE)
      const chunk = text.slice(offset, nextOffset)
      offset = nextOffset
      controller.enqueue(encoder.encode(chunk))

      if (offset < text.length) {
        await sleep(CACHED_STREAM_CHUNK_DELAY_MS)
      }
    },
  })
}

function textResponse(text: string, stream: boolean) {
  if (stream) {
    return new Response(createTextStream(text), {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  }

  return NextResponse.json({ message: text })
}

function validateChatRequest(body: unknown): body is ChatRequest {
  if (!body || typeof body !== 'object') return false
  const candidate = body as Partial<ChatRequest>
  return (
    Array.isArray(candidate.messages) &&
    typeof candidate.sessionId === 'string' &&
    candidate.messages.every((m) => Boolean(m?.role && m?.content))
  )
}

function toResponsesInput(messages: Message[]) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))
}

function getResponseText(data: unknown): string {
  if (!data || typeof data !== 'object') return ''

  const response = data as {
    output_text?: string
    output?: Array<{
      type?: string
      content?: Array<{
        type?: string
        text?: string
      }>
    }>
  }

  if (typeof response.output_text === 'string') return response.output_text.trim()

  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((content) => content.type === 'output_text' && typeof content.text === 'string')
    .map((content) => content.text)
    .join('')
    .trim()
}

function getStreamError(data: unknown) {
  if (!data || typeof data !== 'object') return null
  const event = data as {
    error?: { code?: string; message?: string; type?: string }
    response?: { error?: { code?: string; message?: string } }
  }

  return event.error ?? event.response?.error ?? null
}

function createOpenAIRequestBody(systemPrompt: string, messages: Message[], stream = false) {
  return {
    model: OPENAI_MODEL,
    instructions: systemPrompt,
    input: toResponsesInput(messages),
    max_output_tokens: 1000,
    reasoning: { effort: 'low' },
    text: { verbosity: 'low' },
    stream,
  }
}

let locationColumnReady: Promise<void> | null = null

function getHeader(req: NextRequest, name: string) {
  const value = req.headers.get(name)
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function getUserLocation(req: NextRequest): UserLocation | null {
  const location: UserLocation = {
    city: getHeader(req, 'x-vercel-ip-city'),
    region: getHeader(req, 'x-vercel-ip-country-region'),
    country: getHeader(req, 'x-vercel-ip-country'),
    latitude: getHeader(req, 'x-vercel-ip-latitude'),
    longitude: getHeader(req, 'x-vercel-ip-longitude'),
    timezone: getHeader(req, 'x-vercel-ip-timezone'),
  }

  const knownEntries = Object.entries(location).filter(([, value]) => Boolean(value))
  if (knownEntries.length === 0) return null

  return Object.fromEntries(knownEntries) as UserLocation
}

async function ensureConversationLocationColumn() {
  locationColumnReady ??= sql`
    ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS location JSONB
  `
    .then(() => undefined)
    .catch((error) => {
      locationColumnReady = null
      throw error
    })

  return locationColumnReady
}

async function logConversation(sessionId: string, messages: Message[], response: string, userInfo?: UserInfo) {
  try {
    await ensureConversationLocationColumn()
    const locationJson = userInfo?.location ? JSON.stringify(userInfo.location) : null

    // Update existing row for this session if it exists, otherwise insert a new one.
    // This prevents duplicate rows from being created for each message in a conversation.
    const updated = await sql`
      UPDATE conversations
      SET
        message_count = ${messages.length + 1},
        messages      = ${JSON.stringify(messages)}::jsonb,
        ai_response   = ${response},
        location      = COALESCE(${locationJson}::jsonb, location),
        ts            = NOW()
      WHERE session_id = ${sessionId}
      RETURNING id
    `

    if (updated.length === 0) {
      await sql`
        INSERT INTO conversations (session_id, ip, user_agent, location, message_count, messages, ai_response)
        VALUES (
          ${sessionId},
          ${userInfo?.ip ?? 'unknown'},
          ${userInfo?.userAgent ?? 'unknown'},
          ${locationJson}::jsonb,
          ${messages.length + 1},
          ${JSON.stringify(messages)}::jsonb,
          ${response}
        )
      `
    }

    console.log(`💬 Conversation upserted to Neon: ${sessionId}`)
  } catch (err) {
    console.error('Error logging conversation:', err)
  }
}

async function upsertCachedResponse(prompt: string, response: string) {
  await sql`
    INSERT INTO response_cache (prompt, response)
    VALUES (${prompt}, ${response})
    ON CONFLICT (prompt) DO UPDATE SET response = EXCLUDED.response
  `
}

async function callOpenAI(systemPrompt: string, messages: Message[], stream = false) {
  return fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createOpenAIRequestBody(systemPrompt, messages, stream)),
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    if (!validateChatRequest(body)) {
      return NextResponse.json(
        { error: 'Invalid request: messages and sessionId required' },
        { status: 400 }
      )
    }

    const { messages, sessionId, stream = false, skipCache = false, refreshCache = false, skipLog = false } = body

    const systemPrompt = getSystemPrompt()

    const userInfo: UserInfo = {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
      location: getUserLocation(req),
      timestamp: new Date().toISOString(),
    }

    // Cache check: only applies when it's the very first message and matches a chip
    const firstMessage = messages[0].content
    const isPromptCacheable = messages.length === 1 && CACHEABLE_PROMPTS.has(firstMessage)
    const cacheKey = isPromptCacheable ? getCacheKey(firstMessage, systemPrompt) : firstMessage
    const curatedResponse = isPromptCacheable ? CURATED_CACHE_RESPONSES[firstMessage] : undefined
    const shouldReadCache = isPromptCacheable && !skipCache && !refreshCache
    const shouldWriteCache = isPromptCacheable && !skipCache

    if (refreshCache && curatedResponse) {
      await upsertCachedResponse(cacheKey, curatedResponse)
      console.log(`💾 Cached curated response for: "${firstMessage}"`)
      return textResponse(curatedResponse, stream)
    }

    if (shouldReadCache) {
      const cached = await sql`
        SELECT response FROM response_cache WHERE prompt = ${cacheKey} LIMIT 1
      `
      if (cached.length > 0) {
        const cachedResponse = cached[0].response
        console.log(`⚡ Cache hit for: "${firstMessage}"`)
        if (!skipLog) logConversation(sessionId, messages, cachedResponse, userInfo).catch(console.error)
        return textResponse(cachedResponse, stream)
      }
    }

    const openaiRes = await callOpenAI(systemPrompt, messages, stream)

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      )
    }

    if (stream) {
      if (!openaiRes.body) {
        return NextResponse.json(
          { error: 'Failed to stream response' },
          { status: 500 }
        )
      }

      const decoder = new TextDecoder()
      const encoder = new TextEncoder()
      const reader = openaiRes.body.getReader()
      let buffer = ''
      let aiResponse = ''
      let streamedOutput = false

      const streamBody = new ReadableStream({
        async pull(controller) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              if (shouldWriteCache && aiResponse) {
                upsertCachedResponse(cacheKey, aiResponse)
                  .then(() => console.log(`💾 Cached response for: "${firstMessage}"`))
                  .catch(err => console.error('Failed to cache response:', err))
              }
              if (!skipLog && aiResponse) {
                logConversation(sessionId, messages, aiResponse, userInfo).catch(err =>
                  console.error('Failed to log conversation:', err)
                )
              }
              controller.close()
              return
            }

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const payload = line.slice(6).trim()
              if (!payload || payload === '[DONE]') continue

              try {
                const event = JSON.parse(payload) as { type?: string; delta?: string; text?: string; response?: unknown }
                if (event.type === 'response.output_text.delta' && typeof event.delta === 'string') {
                  aiResponse += event.delta
                  streamedOutput = true
                  controller.enqueue(encoder.encode(event.delta))
                } else if (event.type === 'response.output_text.done' && typeof event.text === 'string' && !aiResponse) {
                  aiResponse = event.text
                  if (!streamedOutput) {
                    streamedOutput = true
                    controller.enqueue(encoder.encode(event.text))
                  }
                } else if (event.type === 'response.completed' && !aiResponse) {
                  const completedText = getResponseText(event.response)
                  if (completedText) {
                    aiResponse = completedText
                    if (!streamedOutput) {
                      streamedOutput = true
                      controller.enqueue(encoder.encode(completedText))
                    }
                  }
                } else if (event.type === 'error' || event.type === 'response.failed') {
                  console.error('OpenAI stream error:', getStreamError(event) ?? event)
                  if (!streamedOutput) {
                    aiResponse = STREAM_ERROR_RESPONSE
                    streamedOutput = true
                    controller.enqueue(encoder.encode(STREAM_ERROR_RESPONSE))
                  }
                  controller.close()
                  reader.cancel().catch(console.error)
                  return
                }
              } catch (error) {
                console.error('Failed to parse OpenAI stream event:', error)
              }
            }
          }
        },
        cancel() {
          reader.cancel().catch(console.error)
        },
      })

      return new Response(streamBody, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
        },
      })
    }

    const data = await openaiRes.json()
    const aiResponse = getResponseText(data)

    if (!aiResponse) {
      console.error('Empty response from OpenAI')
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
    }

    // Store in cache if this was a cacheable first message (fire and forget)
    if (shouldWriteCache) {
      upsertCachedResponse(cacheKey, aiResponse).catch(err => console.error('Failed to cache response:', err))
      console.log(`💾 Cached response for: "${firstMessage}"`)
    }

    // Log conversation asynchronously (don't await to speed up response)
    if (!skipLog) logConversation(sessionId, messages, aiResponse, userInfo).catch(err =>
      console.error('Failed to log conversation:', err)
    )

    return NextResponse.json({ message: aiResponse })
    
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
