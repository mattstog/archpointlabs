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

function getSystemPrompt(): string {
  try {
    const promptPath = path.join(process.cwd(), 'prompts', 'system-prompt.md')
    const promptContent = fs.readFileSync(promptPath, 'utf8')
    const lines = promptContent.split('\n')
    const contentStart = lines.findIndex(line => line.startsWith('You are the AI'))
    return lines.slice(contentStart).join('\n').replace(/#+\s*/g, '').replace(/\*\*/g, '')
  } catch (error) {
    console.warn('Could not load system prompt file, using default:', error)
    return `You are Milo, an AI consultant for Archpoint Labs, a cutting-edge consulting firm specializing in AI transformation. 
    You help businesses understand how AI can solve their challenges through strategy, implementation, automation, and training. 
    Be professional, helpful, and solution-oriented while guiding potential clients toward deeper engagement with our services.`
  }
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request body
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      )
    }

    if (!body.sessionId || typeof body.sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: sessionId required' },
        { status: 400 }
      )
    }

    const { messages, sessionId } = body as { messages: Message[], sessionId: string }
    
    // Validate messages format
    if (messages.some(m => !m.role || !m.content)) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      )
    }

    const systemPrompt = getSystemPrompt()

    const userInfo: UserInfo = {
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      userAgent: req.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    }

    // Cache check: only applies when it's the very first message and matches a chip
    const firstMessage = messages[0].content
    const isCacheable = messages.length === 1 && CACHEABLE_PROMPTS.has(firstMessage)

    if (isCacheable) {
      const cached = await sql`
        SELECT response FROM response_cache WHERE prompt = ${firstMessage} LIMIT 1
      `
      if (cached.length > 0) {
        console.log(`⚡ Cache hit for: "${firstMessage}"`)
        logConversation(sessionId, messages, cached[0].response, userInfo).catch(console.error)
        return NextResponse.json({ message: cached[0].response })
      }
    }

    const openaiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        instructions: systemPrompt,
        input: toResponsesInput(messages),
        max_output_tokens: 1000,
        reasoning: { effort: 'low' },
        text: { verbosity: 'low' },
      }),
    })

    if (!openaiRes.ok) {
      const errorData = await openaiRes.json().catch(() => ({}))
      console.error('OpenAI API error:', errorData)
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      )
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
    if (isCacheable) {
      sql`
        INSERT INTO response_cache (prompt, response)
        VALUES (${firstMessage}, ${aiResponse})
        ON CONFLICT (prompt) DO NOTHING
      `.catch(err => console.error('Failed to cache response:', err))
      console.log(`💾 Cached response for: "${firstMessage}"`)
    }

    // Log conversation asynchronously (don't await to speed up response)
    logConversation(sessionId, messages, aiResponse, userInfo).catch(err =>
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
