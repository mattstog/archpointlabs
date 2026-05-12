import 'dotenv/config'

const baseUrl = process.env.CHAT_CACHE_BASE_URL || 'http://127.0.0.1:3000'

const prompts = [
  'Can you help with AI implementation?',
  'What makes Archpoint Labs different?',
  'Tell me about your recent projects',
  "I'm interested in custom software development",
]

for (const [index, prompt] of prompts.entries()) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: `cache-refresh-${Date.now()}-${index}`,
      refreshCache: true,
      skipLog: true,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Cache refresh failed for "${prompt}" with ${response.status}: ${body}`)
  }

  const data = await response.json()
  const preview = String(data.message || '').replace(/\s+/g, ' ').slice(0, 90)
  console.log(`${index + 1}. ${prompt} -> ${preview}`)
}
