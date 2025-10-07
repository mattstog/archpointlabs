// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'

const sql = neon(process.env.POSTGRES_URL!)

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

async function logConversation(sessionId: string, messages: Message[], response: string, userInfo?: UserInfo) {
  try {
    await sql`
      INSERT INTO conversations (session_id, ip, user_agent, message_count, messages, ai_response)
      VALUES (
        ${sessionId},
        ${userInfo?.ip ?? 'unknown'},
        ${userInfo?.userAgent ?? 'unknown'},
        ${messages.length},
        ${JSON.stringify(messages)}::jsonb,
        ${response}
      )
    `
    console.log(`💬 Conversation logged to Neon: ${sessionId}`)
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

    // OpenAI API call
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 1000,
        temperature: 0.7,
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
    const aiResponse = data?.choices?.[0]?.message?.content ?? ''

    if (!aiResponse) {
      console.error('Empty response from OpenAI')
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      )
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