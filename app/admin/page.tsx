'use client'

import { useState, useEffect } from 'react'
import { Calendar, MessageSquare, User, Clock, Globe, ArrowUpDown, Trash2 } from 'lucide-react'

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

const LAST_VISITED_KEY = 'admin_last_visited'
const RED = '#ef382e'
const DARK = '#2e353e'

export default function AdminDashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [seenBefore, setSeenBefore] = useState<Date | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(LAST_VISITED_KEY)
    setSeenBefore(stored ? new Date(stored) : null)
    localStorage.setItem(LAST_VISITED_KEY, new Date().toISOString())
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversations')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const isUnread = (conv: Conversation) => {
    if (!seenBefore || !conv.ts) return false
    return new Date(conv.ts) > seenBefore
  }

  const unreadCount = conversations.filter(isUnread).length

  const deleteConversation = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    await fetch(`/api/conversations/${id}`, { method: 'PATCH' })
    setConversations(prev => prev.filter(c => c.id !== id))
    if (selectedConversation?.id === id) setSelectedConversation(null)
  }

  const filteredConversations = conversations
    .filter(conv => {
      if (!conv || !conv.ts) return false
      const matchesSearch =
        conv.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(conv.messages).toLowerCase().includes(searchTerm.toLowerCase())
      const convDate = new Date(conv.ts)
      const now = new Date()
      let matchesDate = true
      if (dateFilter === 'today') matchesDate = convDate.toDateString() === now.toDateString()
      else if (dateFilter === 'week') matchesDate = convDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      else if (dateFilter === 'month') matchesDate = convDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return matchesSearch && matchesDate
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.ts).getTime() - new Date(a.ts).getTime()
      if (sortBy === 'oldest') return new Date(a.ts).getTime() - new Date(b.ts).getTime()
      if (sortBy === 'most') return (b.message_count ?? 0) - (a.message_count ?? 0)
      if (sortBy === 'fewest') return (a.message_count ?? 0) - (b.message_count ?? 0)
      return 0
    })

  const formatDate = (conv: Conversation | null | undefined) => {
    if (!conv || !conv.ts) return 'Unknown date'
    try {
      return new Intl.DateTimeFormat('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      }).format(new Date(conv.ts))
    } catch { return 'Invalid date' }
  }

  const getConversationPreview = (messages: Message[]) => {
    if (!messages || messages.length === 0) return 'No messages'
    const userMessages = messages.filter(m => m?.role === 'user' && m?.content)
    if (userMessages.length === 0) return 'No messages'
    const content = userMessages[0].content || ''
    return content.slice(0, 100) + (content.length > 100 ? '...' : '')
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{ background: DARK }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: RED }}></div>
          <p className="text-white/50">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center" style={{ background: DARK }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: RED }}>Error: {error}</p>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 rounded-lg text-white transition hover:opacity-90"
            style={{ background: RED }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white" style={{ background: DARK }}>
      <div className="max-w-7xl mx-auto p-6">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              {/* Red accent bar */}
              <div className="w-1 h-8 rounded-full" style={{ background: RED }} />
              <h1 className="text-3xl font-bold text-white">Archpoint Labs</h1>
            </div>
            <p className="text-white/40 text-sm ml-4">
              Conversation Dashboard
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ background: 'rgba(239,56,46,0.15)', borderColor: 'rgba(239,56,46,0.3)', color: RED }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: RED }}></span>
                  {unreadCount} new
                </span>
              )}
            </p>
          </div>
          <button
            onClick={fetchConversations}
            className="text-sm text-white/40 hover:text-white transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/30"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => setDateFilter('all')}
            className="rounded-xl p-5 border transition-all text-left w-full"
            style={{
              background: dateFilter === 'all' ? 'rgba(239,56,46,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: dateFilter === 'all' ? 'rgba(239,56,46,0.5)' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Total</p>
                <p className="text-3xl font-bold">{conversations.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-white/20" />
            </div>
          </button>

          <button
            onClick={() => setDateFilter(dateFilter === 'today' ? 'all' : 'today')}
            className="rounded-xl p-5 border transition-all text-left w-full"
            style={{
              background: dateFilter === 'today' ? 'rgba(239,56,46,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: dateFilter === 'today' ? 'rgba(239,56,46,0.5)' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">Today</p>
                <p className="text-3xl font-bold">
                  {conversations.filter(c => c.ts && new Date(c.ts).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-white/20" />
            </div>
          </button>

          <button
            onClick={() => setDateFilter(dateFilter === 'week' ? 'all' : 'week')}
            className="rounded-xl p-5 border transition-all text-left w-full"
            style={{
              background: dateFilter === 'week' ? 'rgba(239,56,46,0.12)' : 'rgba(255,255,255,0.04)',
              borderColor: dateFilter === 'week' ? 'rgba(239,56,46,0.5)' : 'rgba(255,255,255,0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wide mb-1">This Week</p>
                <p className="text-3xl font-bold">
                  {conversations.filter(c => c.ts && new Date(c.ts) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-white/20" />
            </div>
          </button>
        </div>

        {/* Filters + Sort */}
        <div className="mb-5 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search conversations, IPs, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none border border-white/10 focus:border-white/30 transition text-sm"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-lg px-4 py-2.5 text-white border border-white/10 focus:outline-none focus:border-white/30 transition text-sm"
            style={{ background: '#2e353e' }}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 border border-white/10 text-sm" style={{ background: '#2e353e' }}>
            <ArrowUpDown className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="most">Most messages</option>
              <option value="fewest">Fewest messages</option>
            </select>
          </div>
        </div>

        {/* Conversations List / Detail */}
        {selectedConversation ? (
          <div className="rounded-xl p-6 border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setSelectedConversation(null)}
                className="text-sm transition hover:opacity-70 flex items-center gap-1"
                style={{ color: RED }}
              >
                ← Back to list
              </button>
              <button
                onClick={(e) => deleteConversation(selectedConversation.id, e)}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-500/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>

            <h2 className="text-lg font-semibold mb-4 text-white">Conversation Details</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-xs text-white/40">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {selectedConversation.session_id.slice(0, 10)}...
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                {selectedConversation.ip}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(selectedConversation)}
              </div>
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                {selectedConversation.message_count} messages
              </div>
            </div>

            {/* Chat bubbles */}
            <div className="flex flex-col gap-1.5">
              {[
                ...selectedConversation.messages,
                { role: 'assistant' as const, content: selectedConversation.ai_response },
              ].map((message, idx) => {
                const isUser = message.role === 'user'
                return (
                  <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[75%] px-3 py-2 rounded-2xl"
                      style={{
                        background: isUser ? 'rgba(239,56,46,0.2)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${isUser ? 'rgba(239,56,46,0.3)' : 'rgba(255,255,255,0.08)'}`,
                        borderBottomRightRadius: isUser ? 4 : undefined,
                        borderBottomLeftRadius: isUser ? undefined : 4,
                      }}
                    >
                      <p className="text-[10px] font-semibold mb-0.5" style={{ color: isUser ? RED : 'rgba(255,255,255,0.35)', textAlign: isUser ? 'right' : 'left' }}>
                        {isUser ? 'User' : 'Milo'}
                      </p>
                      <p className="text-white/80 whitespace-pre-wrap text-sm leading-snug">{message.content}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-white/30">No conversations found</div>
            ) : (
              filteredConversations.map((conversation) => {
                const unread = isUnread(conversation)
                return (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className="relative rounded-xl p-5 border cursor-pointer transition group"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderColor: unread ? 'rgba(239,56,46,0.35)' : 'rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = unread ? 'rgba(239,56,46,0.6)' : 'rgba(255,255,255,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = unread ? 'rgba(239,56,46,0.35)' : 'rgba(255,255,255,0.08)')}
                  >
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {unread && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ background: 'rgba(239,56,46,0.15)', borderColor: 'rgba(239,56,46,0.3)', color: RED }}>
                          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: RED }}></span>
                          New
                        </span>
                      )}
                      <button
                        onClick={(e) => deleteConversation(conversation.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="pr-16">
                      <h3 className="text-sm font-semibold mb-2 text-white/90 group-hover:text-white transition">
                        {getConversationPreview(conversation.messages)}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-xs text-white/30">
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {conversation.session_id.slice(0, 8)}...
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          {conversation.ip}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(conversation)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {conversation.message_count} messages
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
