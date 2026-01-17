'use client'

import { useState, useEffect } from 'react'
import { Calendar, MessageSquare, User, Clock, Mail, Globe } from 'lucide-react'

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

export default function AdminDashboard() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('all')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/conversations')
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter(conv => {
    // Skip null/undefined conversations or those without timestamp
    if (!conv || !conv.ts) return false

    const matchesSearch =
      conv.session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.ip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(conv.messages).toLowerCase().includes(searchTerm.toLowerCase())

    const convDate = new Date(conv.ts)
    const now = new Date()
    let matchesDate = true

    if (dateFilter === 'today') {
      matchesDate = convDate.toDateString() === now.toDateString()
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      matchesDate = convDate >= weekAgo
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      matchesDate = convDate >= monthAgo
    }

    return matchesSearch && matchesDate
  })

  const formatDate = (conv: Conversation | null | undefined) => {
    if (!conv || !conv.ts) return 'Unknown date'
    try {
      const date = new Date(conv.ts)
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(date)
    } catch (error) {
      return 'Invalid date'
    }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Conversation Dashboard
          </h1>
          <p className="text-gray-400">Monitor and analyze chat interactions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Conversations</p>
                <p className="text-3xl font-bold">{conversations.length}</p>
              </div>
              <MessageSquare className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <button
            onClick={() => setDateFilter('today')}
            className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all text-left w-full ${
              dateFilter === 'today'
                ? 'border-green-500 ring-2 ring-green-500/50'
                : 'border-gray-700 hover:border-green-500/50 hover:bg-gray-800/70'
            }`}
            aria-label="Filter to show today's conversations"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Today</p>
                <p className="text-3xl font-bold">
                  {conversations.filter(c =>
                    c.ts && new Date(c.ts).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Calendar className={`w-12 h-12 transition-colors ${
                dateFilter === 'today' ? 'text-green-400' : 'text-green-500'
              }`} />
            </div>
          </button>

          <button
            onClick={() => setDateFilter('week')}
            className={`bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border transition-all text-left w-full ${
              dateFilter === 'week'
                ? 'border-purple-500 ring-2 ring-purple-500/50'
                : 'border-gray-700 hover:border-purple-500/50 hover:bg-gray-800/70'
            }`}
            aria-label="Filter to show this week's conversations"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">This Week</p>
                <p className="text-3xl font-bold">
                  {conversations.filter(c => {
                    if (!c.ts) return false
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    return new Date(c.ts) >= weekAgo
                  }).length}
                </p>
              </div>
              <Clock className={`w-12 h-12 transition-colors ${
                dateFilter === 'week' ? 'text-purple-400' : 'text-purple-500'
              }`} />
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search conversations, IPs, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>

        {/* Conversations List */}
        {selectedConversation ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <button
              onClick={() => setSelectedConversation(null)}
              className="mb-4 text-blue-400 hover:text-blue-300 transition"
            >
              ← Back to list
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Conversation Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2 text-gray-300">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">Session: {selectedConversation.session_id}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">IP: {selectedConversation.ip}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{formatDate(selectedConversation)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">{selectedConversation.message_count} messages</span>
                </div>
              </div>

              <div className="space-y-4">
                {selectedConversation.messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-900/30 border border-blue-700/50'
                        : 'bg-gray-700/30 border border-gray-600/50'
                    }`}
                  >
                    <p className="text-xs text-gray-400 mb-2 uppercase font-semibold">
                      {message.role}
                    </p>
                    <p className="text-gray-200 whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}

                <div className="p-4 rounded-lg bg-purple-900/30 border border-purple-700/50">
                  <p className="text-xs text-gray-400 mb-2 uppercase font-semibold">
                    AI Response
                  </p>
                  <p className="text-gray-200 whitespace-pre-wrap">{selectedConversation.ai_response}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No conversations found
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-blue-500 cursor-pointer transition group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2 group-hover:text-blue-400 transition">
                        {getConversationPreview(conversation.messages)}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {conversation.session_id.slice(0, 8)}...
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {conversation.ip}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(conversation)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {conversation.message_count} messages
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
