// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'

const sql = neon(process.env.POSTGRES_URL!)

export async function GET(req: NextRequest) {
  try {
    // Fetch all conversations ordered by most recent first
    const conversations = await sql`
      SELECT
        id,
        session_id,
        ip,
        user_agent,
        message_count,
        messages,
        ai_response,
        created_at
      FROM conversations
      ORDER BY created_at DESC
      LIMIT 1000
    `

    return NextResponse.json({
      conversations,
      count: conversations.length
    })

  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
