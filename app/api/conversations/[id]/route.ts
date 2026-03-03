import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'nodejs'

const sql = neon(process.env.POSTGRES_URL!)

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const action = body.action ?? 'delete'

    if (action === 'save') {
      await sql`UPDATE conversations SET saved = true  WHERE id = ${id}`
    } else if (action === 'unsave') {
      await sql`UPDATE conversations SET saved = false WHERE id = ${id}`
    } else {
      // default: soft delete
      await sql`UPDATE conversations SET active = false WHERE id = ${id}`
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating conversation:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation' },
      { status: 500 }
    )
  }
}
