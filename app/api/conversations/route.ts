// app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'

const sql = neon(process.env.POSTGRES_URL!)

export async function GET(req: NextRequest) {
  try {
    const view = req.nextUrl.searchParams.get('view')
    const saved = view === 'saved'

    const conversations = await sql`
      SELECT *
      FROM conversations
      WHERE active IS NOT FALSE
        AND (saved = ${saved} OR (${!saved} AND saved IS NULL))
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
