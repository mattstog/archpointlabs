import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const repo = process.env.GITHUB_REPOSITORY || 'Archpoint-Labs/archpointlabs'
const prodUrl = process.env.CHAT_PROD_BASE_URL || 'https://www.archpointlabs.com'
const vercelProject = process.env.VERCEL_PROJECT_NAME || 'archpointlabs'

async function getCurrentSha() {
  if (process.env.GIT_SHA) return process.env.GIT_SHA
  const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'])
  return stdout.trim()
}

async function requireVercelStatus(sha) {
  const response = await fetch(`https://api.github.com/repos/${repo}/commits/${sha}/status`)
  if (!response.ok) {
    throw new Error(`GitHub status check failed with ${response.status}: ${await response.text()}`)
  }

  const data = await response.json()
  const vercelStatus = data.statuses?.find((status) => status.context?.startsWith('Vercel'))

  if (!vercelStatus) {
    throw new Error(`No Vercel status found for ${sha.slice(0, 7)}`)
  }

  if (vercelStatus.state !== 'success') {
    throw new Error(`Vercel deployment is ${vercelStatus.state}: ${vercelStatus.description}`)
  }

  return {
    description: vercelStatus.description,
    targetUrl: vercelStatus.target_url,
  }
}

async function smokeChat() {
  const response = await fetch(`${prodUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: `prod-verify-${Date.now()}`,
      skipCache: true,
      skipLog: true,
      stream: true,
      messages: [
        {
          role: 'user',
          content: 'In one short sentence, say what Milo helps with.',
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Production chat smoke failed with ${response.status}: ${await response.text()}`)
  }

  const message = (await response.text()).trim()
  if (!message) throw new Error('Production chat smoke returned an empty response')
  return message
}

async function scanVercelErrorLogs() {
  if (!process.env.VERCEL_TOKEN) {
    return {
      skipped: true,
      reason: 'VERCEL_TOKEN is not set',
    }
  }

  const args = [
    '--yes',
    'vercel',
    'logs',
    '--project',
    vercelProject,
    '--environment',
    'production',
    '--level',
    'error',
    '--since',
    '1h',
    '--json',
    '--limit',
    '20',
    '--no-color',
    '--token',
    process.env.VERCEL_TOKEN,
  ]

  if (process.env.VERCEL_SCOPE) {
    args.push('--scope', process.env.VERCEL_SCOPE)
  }

  const { stdout } = await execFileAsync('npx', args, {
    maxBuffer: 1024 * 1024,
  })

  const entries = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  return {
    skipped: false,
    count: entries.length,
    entries,
  }
}

const sha = await getCurrentSha()
const vercel = await requireVercelStatus(sha)
const smoke = await smokeChat()
const logs = await scanVercelErrorLogs()

console.log(`Commit: ${sha.slice(0, 7)}`)
console.log(`Vercel: ${vercel.description}`)
console.log(`Deployment: ${vercel.targetUrl}`)
console.log(`Chat smoke: ${smoke}`)

if (logs.skipped) {
  console.log(`Error scan: skipped (${logs.reason})`)
} else if (logs.count === 0) {
  console.log('Error scan: clean (0 error logs in the last hour)')
} else {
  console.error(`Error scan: found ${logs.count} error log(s) in the last hour`)
  for (const entry of logs.entries) console.error(entry)
  process.exitCode = 1
}
