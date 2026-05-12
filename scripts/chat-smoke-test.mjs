import 'dotenv/config'

const baseUrl = process.env.CHAT_SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const sessionId = `chat-smoke-${Date.now()}`

const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId,
    skipCache: true,
    skipLog: true,
    messages: [
      {
        role: 'user',
        content: 'In one short sentence, introduce Milo from Archpoint Labs.',
      },
    ],
  }),
})

if (!response.ok) {
  const body = await response.text().catch(() => '')
  throw new Error(`Chat smoke test failed with ${response.status}: ${body}`)
}

const data = await response.json()

if (!data?.message || typeof data.message !== 'string') {
  throw new Error(`Chat smoke test returned no message: ${JSON.stringify(data)}`)
}

console.log(data.message)
