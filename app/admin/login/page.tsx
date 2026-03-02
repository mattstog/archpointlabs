'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/admin'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        router.push(from)
      } else {
        setError('Incorrect password')
        setPassword('')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white flex items-center justify-center" style={{ background: '#2e353e' }}>
      <div className="w-full max-w-sm px-4">

        {/* Logo mark */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-1 h-7 rounded-full" style={{ background: '#ef382e' }} />
            <span className="text-xl font-bold tracking-tight">Archpoint Labs</span>
          </div>
          <p className="text-white/40 text-sm">Admin Dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-8 space-y-4 border border-white/10"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <div>
            <label className="block text-xs text-white/40 uppercase tracking-wide mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
              className="w-full rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none border border-white/10 focus:border-white/30 transition text-sm"
              style={{ background: 'rgba(255,255,255,0.06)' }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#ef382e' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: '#ef382e' }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
