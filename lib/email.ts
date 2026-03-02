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
  id: string
  session_id: string
  ip: string
  user_agent: string
  message_count: number
  messages: Message[]
  ai_response: string
  ts: string
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
        ts
      FROM conversations
      WHERE ts >= ${oneDayAgo}
      ORDER BY ts DESC
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
  const date = new Date(conversation.ts).toLocaleString('en-US', {
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
    <div style="border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 18px; margin-bottom: 20px; background: rgba(255,255,255,0.04);">
      <div style="margin-bottom: 14px; font-size: 12px; color: rgba(255,255,255,0.35); display: flex; flex-wrap: wrap; gap: 12px;">
        <span>🕐 ${date}</span>
        <span>💬 ${conversation.message_count} messages</span>
        <span>🌐 ${conversation.ip}</span>
        <span>🔑 ${conversation.session_id.slice(0, 12)}...</span>
      </div>
      <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 14px;">
  `

  userMessages.forEach((msg, idx) => {
    html += `
      <div style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
        <div style="max-width: 80%; background: rgba(239,56,46,0.15); border: 1px solid rgba(239,56,46,0.25); padding: 10px 14px; border-radius: 14px; border-bottom-right-radius: 3px;">
          <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 600; color: #ef382e; text-align: right; text-transform: uppercase; letter-spacing: 0.5px;">User ${userMessages.length > 1 ? idx + 1 : ''}</p>
          <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 13px; white-space: pre-wrap;">${escapeHtml(msg.content)}</p>
        </div>
      </div>
    `
  })

  assistantMessages.forEach((msg, idx) => {
    html += `
      <div style="margin-bottom: 10px; display: flex; justify-content: flex-start;">
        <div style="max-width: 80%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); padding: 10px 14px; border-radius: 14px; border-bottom-left-radius: 3px;">
          <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.5px;">Milo ${assistantMessages.length > 1 ? idx + 1 : ''}</p>
          <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 13px; white-space: pre-wrap;">${escapeHtml(msg.content)}</p>
        </div>
      </div>
    `
  })

  html += `</div></div>`

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
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #ffffff; background-color: #2e353e; margin: 0; padding: 0;">
        <div style="max-width: 680px; margin: 0 auto; padding: 32px 24px;">

          <!-- Header -->
          <div style="margin-bottom: 32px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
              <div style="width: 4px; height: 28px; background: #ef382e; border-radius: 4px; display: inline-block;"></div>
              <span style="font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">Archpoint Labs</span>
            </div>
            <p style="margin: 0 0 0 14px; font-size: 13px; color: rgba(255,255,255,0.4);">Daily Conversation Digest</p>
          </div>

          <!-- Summary pill -->
          <div style="background: rgba(239,56,46,0.12); border: 1px solid rgba(239,56,46,0.3); border-radius: 8px; padding: 14px 18px; margin-bottom: 28px;">
            <p style="margin: 0; font-size: 15px; color: #ffffff;">
              <strong style="color: #ef382e;">${conversations.length}</strong> new conversation${conversations.length !== 1 ? 's' : ''} in the last 24 hours
            </p>
          </div>

          <!-- Conversations -->
          ${conversations.map((conv) => formatConversationForEmail(conv)).join('')}

          <!-- Footer -->
          <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://archpointlabs.com'}/admin"
               style="display: inline-block; background: #ef382e; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 20px;">
              View Dashboard →
            </a>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.25);">Automated daily digest · Archpoint Labs</p>
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
