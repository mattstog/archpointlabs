// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
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

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type UserInfo = { 
  ip?: string | null
  userAgent?: string | null
  timestamp?: string 
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

async function logConversation(sessionId: string, messages: Message[], response: string, userInfo?: UserInfo) {
  try {
    // Update existing row for this session if it exists, otherwise insert a new one.
    // This prevents duplicate rows from being created for each message in a conversation.
    const updated = await sql`
      UPDATE conversations
      SET
        message_count = ${messages.length + 1},
        messages      = ${JSON.stringify(messages)}::jsonb,
        ai_response   = ${response},
        ts            = NOW()
      WHERE session_id = ${sessionId}
      RETURNING id
    `

    if (updated.length === 0) {
      await sql`
        INSERT INTO conversations (session_id, ip, user_agent, message_count, messages, ai_response)
        VALUES (
          ${sessionId},
          ${userInfo?.ip ?? 'unknown'},
          ${userInfo?.userAgent ?? 'unknown'},
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
      timestamp: new Date().toISOString(),
    }

    // Cache check: only applies when it's the very first message and matches a chip
    const firstMessage = messages[0].content
    const isPromptCacheable = messages.length === 1 && CACHEABLE_PROMPTS.has(firstMessage)
    const shouldReadCache = isPromptCacheable && !skipCache && !refreshCache
    const shouldWriteCache = isPromptCacheable && !skipCache

    if (shouldReadCache) {
      const cached = await sql`
        SELECT response FROM response_cache WHERE prompt = ${firstMessage} LIMIT 1
      `
      if (cached.length > 0) {
        const cachedResponse = cached[0].response
        console.log(`⚡ Cache hit for: "${firstMessage}"`)
        if (!skipLog) logConversation(sessionId, messages, cachedResponse, userInfo).catch(console.error)
        if (stream) {
          return new Response(cachedResponse, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
            },
          })
        }
        return NextResponse.json({ message: cachedResponse })
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

      const streamBody = new ReadableStream({
        async pull(controller) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              if (shouldWriteCache && aiResponse) {
                upsertCachedResponse(firstMessage, aiResponse)
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
                  controller.enqueue(encoder.encode(event.delta))
                } else if (event.type === 'response.completed' && !aiResponse) {
                  aiResponse = getResponseText(event.response)
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
      upsertCachedResponse(firstMessage, aiResponse).catch(err => console.error('Failed to cache response:', err))
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
