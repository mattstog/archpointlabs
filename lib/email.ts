// lib/email.ts
import { Resend } from 'resend'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.POSTGRES_URL!)
const resend = new Resend(process.env.RESEND_API_KEY!)

type Message = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type Conversation = {
  id: number
  session_id: string
  ip: string
  user_agent: string
  message_count: number
  messages: Message[]
  ai_response: string
  created_at: string
}

/**
 * Get conversations from the last 24 hours
 */
export async function getRecentConversations(): Promise<Conversation[]> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

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
      WHERE created_at >= ${oneDayAgo}
      ORDER BY created_at DESC
    `

    return conversations as Conversation[]
  } catch (error) {
    console.error('Error fetching recent conversations:', error)
    throw error
  }
}

/**
 * Format conversation for email display
 */
function formatConversationForEmail(conversation: Conversation): string {
  const date = new Date(conversation.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const userMessages = conversation.messages.filter((m) => m.role === 'user')
  const assistantMessages = conversation.messages.filter((m) => m.role === 'assistant')

  let html = `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; background-color: #f9fafb;">
      <div style="margin-bottom: 12px;">
        <strong style="color: #1f2937;">Session:</strong> <code style="background: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${conversation.session_id.slice(0, 16)}...</code><br>
        <strong style="color: #1f2937;">IP:</strong> ${conversation.ip}<br>
        <strong style="color: #1f2937;">Time:</strong> ${date}<br>
        <strong style="color: #1f2937;">Messages:</strong> ${conversation.message_count}
      </div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">
  `

  userMessages.forEach((msg, idx) => {
    html += `
      <div style="margin-bottom: 12px; background: #eff6ff; padding: 12px; border-radius: 6px; border-left: 3px solid #3b82f6;">
        <strong style="color: #1e40af; font-size: 12px; text-transform: uppercase;">User Message ${idx + 1}:</strong>
        <p style="margin: 8px 0 0 0; color: #1f2937; white-space: pre-wrap;">${escapeHtml(msg.content)}</p>
      </div>
    `
  })

  assistantMessages.forEach((msg, idx) => {
    html += `
      <div style="margin-bottom: 12px; background: #f3f4f6; padding: 12px; border-radius: 6px; border-left: 3px solid #6b7280;">
        <strong style="color: #374151; font-size: 12px; text-transform: uppercase;">AI Response ${idx + 1}:</strong>
        <p style="margin: 8px 0 0 0; color: #1f2937; white-space: pre-wrap;">${escapeHtml(msg.content)}</p>
      </div>
    `
  })

  html += `</div>`

  return html
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Send daily digest email
 */
export async function sendDailyDigest(): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const conversations = await getRecentConversations()

    // If no new conversations, don't send email
    if (conversations.length === 0) {
      console.log('No new conversations in the last 24 hours. Skipping email.')
      return {
        success: true,
        message: 'No new conversations to report',
        count: 0,
      }
    }

    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; background-color: #ffffff; margin: 0; padding: 0;">
        <div style="max-width: 800px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📊 Daily Conversation Digest</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Archpoint Labs Chat Analytics</p>
          </div>

          <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <div style="background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 18px; color: #1e40af;">
                <strong>${conversations.length}</strong> new conversation${conversations.length !== 1 ? 's' : ''} in the last 24 hours
              </p>
            </div>

            ${conversations.map((conv) => formatConversationForEmail(conv)).join('')}

            <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 24px 0;">

            <div style="text-align: center; color: #6b7280; font-size: 14px;">
              <p>This is an automated daily digest from your Archpoint Labs website.</p>
              <p style="margin-top: 8px;">
                <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://archpointlabs.com'}/admin"
                   style="color: #3b82f6; text-decoration: none;">
                  View Admin Dashboard →
                </a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'Archpoint Labs <notifications@archpointlabs.com>',
      to: ['matt@archpointlabs.com'],
      subject: `📊 Daily Digest: ${conversations.length} New Conversation${conversations.length !== 1 ? 's' : ''}`,
      html: emailBody,
    })

    if (error) {
      throw new Error(`Resend error: ${error.message}`)
    }

    console.log('✅ Daily digest email sent:', data?.id)

    return {
      success: true,
      message: `Email sent successfully with ${conversations.length} conversation(s)`,
      count: conversations.length,
    }
  } catch (error) {
    console.error('❌ Error sending daily digest:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      count: 0,
    }
  }
}
