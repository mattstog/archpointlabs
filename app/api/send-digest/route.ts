// app/api/send-digest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendDailyDigest } from '@/lib/email'

export const runtime = 'nodejs'

/**
 * API endpoint to manually trigger or be called by a cron job
 * Can be secured with an API key for production use
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await sendDailyDigest()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        conversationCount: result.count,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 500 }
      )
    }
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
 * GET endpoint for manual testing
 */
export async function GET(req: NextRequest) {
  // Only allow in development or with secret
  const secret = req.nextUrl.searchParams.get('secret')
  const allowedSecret = process.env.CRON_SECRET

  if (process.env.NODE_ENV === 'production' && secret !== allowedSecret) {
    return NextResponse.json(
      { error: 'Not available in production without secret' },
      { status: 403 }
    )
  }

  try {
    const result = await sendDailyDigest()

    return NextResponse.json({
      success: result.success,
      message: result.message,
      conversationCount: result.count,
    })
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
