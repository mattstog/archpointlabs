// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'

const sql = neon(process.env.POSTGRES_URL!)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    // Fetch all conversations ordered by most recent first (by ID since created_at may not exist)
    const conversations = await sql`
      SELECT *
      FROM conversations
      ORDER BY id DESC
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
