// app/api/send-digest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDigest } from '@/lib/email'

export const runtime = 'nodejs'

function isAuthorized(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return true

  const authHeader = req.headers.get('authorization')
  const querySecret = req.nextUrl.searchParams.get('secret')

  return authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret
}

async function runDigest() {
  const result = await sendDailyDigest()

  if (result.success) {
    return NextResponse.json({
      success: true,
      message: result.message,
      conversationCount: result.count,
    })
  }

  return NextResponse.json(
    {
      success: false,
      error: result.message,
    },
    { status: 500 }
  )
}

/**
 * API endpoint to manually trigger or be called by a cron job
 * Can be secured with an API key for production use
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return runDigest()
  } catch (error) {
    console.error('Error in send-digest endpoint:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for Vercel Cron and manual testing.
 */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    return runDigest()
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
