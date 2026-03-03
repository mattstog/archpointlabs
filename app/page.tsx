"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { ArrowUp, X, MessageCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import PortfolioModal from "@/components/portfolio-modal"
import type { PortfolioItem } from "@/components/portfolio-grid"
import { ExternalLink } from "lucide-react"

const SUBHEAD =
  "We develop custom software solutions, like apps, automations and AI agents that fully unlock the potential of your business. Chat with Milo, our AI Assistant, to discover what Archpoint Labs can do for you."

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

const portfolioItems: PortfolioItem[] = [
  {
    id: "1",
    title: "Classic Team Realty",
    description: "Modern marketing site for top realty company",
    posterUrl: "/ctr-hero.png",
    screenshotUrl: "/ctr-screenshot.png",
    screenshotUrlMobile: "/ctr-screenshot-mobile.png",
    liveUrl: "https://classicteamrealty.com",
  },
  {
    id: "2",
    title: "Mitch Harris",
    description: "Modern marketing site for MLB player",
    posterUrl: "/mitch-hero.png",
    screenshotUrl: "/mitch-harris-screenshot.png",
    screenshotUrlMobile: "/mitch-harris-screenshot-mobile.png",
    liveUrl: "https://mitchharris.com",
  },
  {
    id: "3",
    title: "Fromm Scratch",
    description: "Modern marketing site for top baking blog",
    posterUrl: "/fs-hero.png",
    screenshotUrl: "/fs-screenshot.png",
    screenshotUrlMobile: "/fs-screenshot-mobile-new.png",
    liveUrl: "https://frommscratch.com",
  },
]

export default function Chat() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const userMessageCount = messages.filter(m => m.role === "user").length
  const CHAT_LIMIT = 50
  const remainingTurns = Math.max(0, CHAT_LIMIT - userMessageCount)
  const canChat = remainingTurns > 0

  const [isLoading, setIsLoading] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [usedExamples, setUsedExamples] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [mobileOverlayOpen, setMobileOverlayOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const desktopTextareaRef = useRef<HTMLTextAreaElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const [desktopInputHeight, setDesktopInputHeight] = useState(64)
  const hasAutoFocused = useRef(false)
  const [fullyArrived, setFullyArrived] = useState(false)

  const examples = [
    "Can you help with AI implementation?",
    "What makes Archpoint Labs different?",
    "Tell me about your recent projects",
    "I'm interested in custom software development"
  ]

  const examplesForMobile = [
    "What makes Archpoint Labs different?",
    "I'm interested in custom software development"
  ]

  type AutoScrollMode = "bottom" | "anchor"

  function useAutoScroll(
    ref: React.RefObject<HTMLDivElement | null>,
    deps: unknown[],
    opts?: {
      mode?: AutoScrollMode
      anchorEl?: () => HTMLElement | null
      pad?: number
    }
  ) {
    const mode = opts?.mode ?? "bottom"
    const pad = opts?.pad ?? 8

    const [_isAtBottom, setIsAtBottom] = useState(true)
    const [_hasQueuedNew, setHasQueuedNew] = useState(false)

    useEffect(() => {
      const el = ref.current
      if (!el) return
      const THRESHOLD = 32

      const onScroll = () => {
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
        const atBottom = distanceFromBottom <= THRESHOLD
        setIsAtBottom(atBottom)
        if (atBottom) setHasQueuedNew(false)
      }

      el.addEventListener("scroll", onScroll, { passive: true })
      onScroll()

      const ro = new ResizeObserver(() => {
        if (!ref.current) return
        const el = ref.current
        if (mode === "bottom") {
          if (_isAtBottom) el.scrollTo({ top: el.scrollHeight })
        } else if (mode === "anchor" && opts?.anchorEl) {
          const anchor = opts.anchorEl()
          if (!anchor) return
          const topNow = anchor.getBoundingClientRect().top - el.getBoundingClientRect().top
          const delta = topNow - pad
          if (delta !== 0) el.scrollTop += delta
        }
      })
      ro.observe(el)

      return () => {
        el.removeEventListener("scroll", onScroll)
        ro.disconnect()
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref, mode, pad])

    useEffect(() => {
      const el = ref.current
      if (!el) return

      if (mode === "bottom") {
        if (_isAtBottom) {
          el.scrollTo({ top: el.scrollHeight })
        } else {
          setHasQueuedNew(true)
        }
      } else if (mode === "anchor" && opts?.anchorEl) {
        const anchor = opts.anchorEl()
        if (!anchor) return
        requestAnimationFrame(() => {
          if (!ref.current) return
          const el2 = ref.current
          const topNow = anchor.getBoundingClientRect().top - el2.getBoundingClientRect().top
          const delta = topNow - pad
          if (delta !== 0) el2.scrollTop += delta
        })
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps.concat([mode, pad]))

    const jumpToBottom = (smooth = true) => {
      const el = ref.current
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" })
      setHasQueuedNew(false)
    }

    return { isAtBottom: _isAtBottom, hasQueuedNew: _hasQueuedNew, jumpToBottom }
  }

  const last = messages[messages.length - 1]
  let prevUserId: string | null = null
  for (let i = messages.length - 2; i >= 0; i--) {
    if (messages[i].role === "user") { prevUserId = messages[i].id; break }
  }

  const mode: "bottom" | "anchor" = last?.role === "assistant" ? "anchor" : "bottom"

  const { jumpToBottom } = useAutoScroll(
    scrollContainerRef,
    [messages.length, isLoading],
    {
      mode,
      pad: 8,
      anchorEl: () => (prevUserId ? messageRefs.current.get(prevUserId) ?? null : null),
    }
  )

  function useIsMobile(breakpoint = 1200) {
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < breakpoint)
      check()
      window.addEventListener("resize", check)
      return () => window.removeEventListener("resize", check)
    }, [breakpoint])
    return isMobile
  }

  function useIsTablet() {
    const [isTablet, setIsTablet] = useState(false)
    useEffect(() => {
      const check = () => { const w = window.innerWidth; setIsTablet(w >= 768 && w < 1200) }
      check()
      window.addEventListener("resize", check)
      return () => window.removeEventListener("resize", check)
    }, [])
    return isTablet
  }

  const sendMessage = async (text: string) => {
    if (!canChat) return
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: text }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    requestAnimationFrame(() => jumpToBottom(true))
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      if (!response.ok) throw new Error("Failed to get response")
      const data = await response.json()
      setMessages([...newMessages, { id: (Date.now() + 1).toString(), role: "assistant", content: data.message }])
    } catch {
      setMessages([...newMessages, { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, I encountered an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!canChat) return
    if (input.trim() && !isLoading) {
      sendMessage(input)
      setInput("")
      // Reset desktop textarea height
      if (desktopTextareaRef.current) desktopTextareaRef.current.style.height = '24px'
      setDesktopInputHeight(64)
      // Restore focus after send
      setTimeout(() => {
        if (isMobile) mobileInputRef.current?.focus()
        else desktopTextareaRef.current?.focus()
      }, 10)
      if (isMobile) setMobileOverlayOpen(true)
    }
  }

  const handleDesktopInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = '0px'
    const scrollH = Math.min(ta.scrollHeight, 96) // cap at ~4 lines
    ta.style.height = scrollH + 'px'
    setDesktopInputHeight(Math.max(64, scrollH + 24))
  }

  const handleExampleClick = (text: string) => {
    if (!isLoading && canChat) { setUsedExamples([...usedExamples, text]); sendMessage(text) }
  }

  const handlePortfolioClick = (url: string) => {
    const item = portfolioItems.find(p => p.liveUrl === url)
    if (item) setSelectedItem(item)
  }

  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
    ol: ({ children, start }) => <ol className="list-decimal pl-5 my-2 space-y-1.5" start={start}>{children}</ol>,
    ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>,
    li: ({ children }) => <li className="leading-relaxed [&>p]:mb-0">{children}</li>,
    a: ({ href, children }) => {
      const isPortfolioLink = href && portfolioItems.some(i => i.liveUrl === href)
      const base =
        "chat-link inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 " +
        "underline underline-offset-2 decoration-2 " +
        "bg-white/10 text-white hover:bg-white/20 " +
        "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"
      if (isPortfolioLink && href) {
        return (
          <button onClick={(e) => { e.preventDefault(); handlePortfolioClick(href) }} className={base + " cursor-pointer"}>
            {children}<ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        )
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
          {children}<ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      )
    },
  }

  const hasMessages = messages.length > 0
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const examplesToUse = isMobile ? examplesForMobile : examples

  // Auto-open overlay when chat starts on mobile; stays open by default
  useEffect(() => {
    if (isMobile && hasMessages) setMobileOverlayOpen(true)
  }, [isMobile, hasMessages])

  return (
    <main className="min-h-screen w-full overflow-x-hidden">

      {/* Clean brand background */}
      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            `radial-gradient(ellipse at 20% 0%, rgba(239,56,46,${isMobile ? "0.09" : "0.14"}) 0%, transparent 55%), ` +
            `radial-gradient(ellipse at 85% 100%, rgba(239,56,46,${isMobile ? "0.18" : "0.33"}) 0%, transparent 45%), ` +
            "#2e353e",
        }}
      />

      {/* Faint AP icon watermark — overflowing off bottom-left corner */}
      <div
        aria-hidden
        className="fixed pointer-events-none z-0"
        style={{
          bottom: (isMobile && !isTablet) ? "-40px" : "-60px",
          left: (isMobile && !isTablet) ? "-40px" : "-60px",
          width: (isMobile && !isTablet) ? "200px" : "260px",
          height: (isMobile && !isTablet) ? "200px" : "260px",
          opacity: (isMobile && !isTablet) ? 0.2 : 0.25,
          maskImage: "radial-gradient(ellipse at bottom left, black 0%, transparent 92%)",
          WebkitMaskImage: "radial-gradient(ellipse at bottom left, black 0%, transparent 92%)",
        }}
      >
        <img src="/logos/AP Icon -White.svg" alt="" className="w-full h-full object-contain" />
      </div>

      {/* Subtle top accent line */}
      <div
        aria-hidden
        className="fixed top-0 inset-x-0 z-10 h-[3px]"
        style={{ background: "linear-gradient(to right, transparent, #ef382e 40%, #ef382e 60%, transparent)" }}
      />

      {/* ══ MOBILE CHAT OVERLAY ══
          Full-screen panel that appears once the user starts chatting.
          Covers the hero entirely — chat + fixed input at bottom. */}
      {isMobile && hasMessages && mobileOverlayOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{ background: "#2e353e" }}
        >
          {/* Background gradient (same brand feel) */}
          <div
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 20% 0%, rgba(239,56,46,0.14) 0%, transparent 55%), " +
                "radial-gradient(ellipse at 85% 100%, rgba(239,56,46,0.20) 0%, transparent 45%)",
            }}
          />

          {/* Mini nav */}
          <div className="relative z-10 flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/10">
            <a href="https://archpointlabs.com" className="flex items-center">
              <img src="/logos/AP Logo -White.svg" alt="Archpoint Labs" className="h-14 w-auto" />
            </a>
            <div className="flex items-center gap-2">
              <a
                href="https://calendar.app.google/Y7DRMz8GjakjuGf79"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90"
                style={{ background: "#ef382e", letterSpacing: "0.01em" }}
              >
                Book a Call
              </a>
              <button
                onClick={() => setMobileOverlayOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable messages */}
          <div
            ref={scrollContainerRef}
            className="relative z-10 flex-1 overflow-y-auto px-4 pt-4 pb-2 scrollarea"
          >
            <div className="space-y-4 pb-2">
              {messages.map((m) => {
                const isUser = m.role === "user"
                return (
                  <div
                    key={m.id}
                    ref={(el) => { if (el) messageRefs.current.set(m.id, el); else messageRefs.current.delete(m.id) }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"} text-left`}
                  >
                    <div
                      className={isUser
                        ? "text-white rounded-2xl px-4 py-2 inline-flex items-center justify-center text-left whitespace-pre-wrap break-words max-w-[80%]"
                        : "text-white rounded-2xl px-4 py-2 flex flex-col gap-1 items-start text-left break-words w-full bg-white/0"}
                      style={isUser ? { background: "#ef382e" } : {}}
                    >
                      {!isUser && <div className="font-semibold text-white/60 text-sm">Milo</div>}
                      <div className="leading-relaxed w-full">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )
              })}
              {isLoading && (
                <div className="flex justify-start text-left">
                  <div className="text-white rounded-2xl px-4 py-2 flex flex-col gap-1 items-start">
                    <div className="font-semibold text-white/60 text-sm">Milo</div>
                    <div className="flex items-center text-white/80">
                      <span>Thinking</span>
                      <span className="inline-flex ml-1">
                        {[0, 0.3, 0.6].map((delay) => (
                          <motion.span key={delay} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay }}>.</motion.span>
                        ))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fixed input at bottom */}
          <div
            className="relative z-10 flex-shrink-0 px-4 pt-2"
            style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 12px) + 12px)" }}
          >
            {!canChat && (
              <p className="text-center text-white/40 text-xs mb-2">Chat limit reached for this session</p>
            )}
            <form
              onSubmit={handleSubmit}
              className="flex items-center rounded-full overflow-hidden shadow-lg"
              style={{ background: "#ffffff", height: 52 }}
            >
              <input
                ref={mobileInputRef}
                className="flex-1 h-full px-5 bg-transparent focus:outline-none text-[#2e353e] placeholder:text-[#2e353e]/40 text-base"
                value={input}
                placeholder={canChat ? (remainingTurns <= 3 ? `Ask away... (${remainingTurns} left)` : "Ask away...") : ""}
                onChange={(e) => setInput(e.currentTarget.value)}
                disabled={!canChat}
              />
              {input && !isLoading && canChat && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  onMouseDown={(e) => e.preventDefault()}
                  className="mr-2 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:opacity-90"
                  style={{ background: "#ef382e" }}
                >
                  <ArrowUp className="w-4 h-4 text-white" />
                </button>
              )}
            </form>
          </div>
        </motion.div>
      )}

      <div className="w-full min-h-screen relative">

        {/* Navigation */}
        <nav className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 pt-6 pb-4">
          <a href="https://archpointlabs.com" className="flex items-center">
            <img src="/logos/AP Logo -White.svg" alt="Archpoint Labs" className="h-14 xl:h-20 w-auto" />
          </a>
          <a
            href="https://calendar.app.google/Y7DRMz8GjakjuGf79"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#ef382e", letterSpacing: "0.01em" }}
          >
            Book a Call
          </a>
        </nav>

        {/* Headline & Subheadline */}
        <div
          className="absolute inset-x-0 xl:inset-x-auto xl:top-[30%] xl:left-24 xl:text-left text-center text-white max-w-xl pointer-events-none z-0 mx-auto xl:mx-0"
          style={{
            top: isMobile ? (isTablet ? "18svh" : "22svh") : undefined,
            opacity: !isMobile && hasMessages ? 0 : 1,
            transition: 'opacity 0.4s ease',
          }}
        >
          <h1 className="text-4xl md:text-5xl xl:text-5xl 2xl:text-6xl font-extrabold leading-tight tracking-tight">
            Creating <br /> What&apos;s Next.
          </h1>
          <div className="mt-3 mb-4 xl:ml-0 mx-auto w-12 h-[3px] rounded-full" style={{ background: "#ef382e" }} />
          {(!isMobile || isTablet) && (
            <p className="text-base px-6 lg:px-0 leading-relaxed text-white/70">{SUBHEAD}</p>
          )}
        </div>

        {/* Chat wrapper */}
        <motion.div
          key={mounted && isMobile ? "m" : "d"}
          className="absolute top-0 xl:top-[30%] left-1/2 isolate flex flex-col items-center justify-center w-full max-w-[672px] px-4"
          style={!isMobile ? { top: hasMessages ? "13%" : "30%", marginLeft: "clamp(8vw, 21.25rem, calc(50vw - 376px))", transition: "top 0.6s cubic-bezier(0.4,0,0.2,1)" } : undefined}
          initial={{ y: isMobile ? (isTablet ? "47svh" : "40svh") : "-40dvh", x: "-50%", opacity: isMobile ? 1 : 0 }}
          animate={{ y: isMobile ? (isTablet ? "47svh" : "40svh") : 0, x: "-50%", opacity: 1 }}
          transition={{
            y: isMobile ? { duration: 0 } : { delay: 1.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] },
            opacity: isMobile ? { duration: 0 } : { delay: 1.5, duration: 0.4 },
          }}
          onAnimationComplete={() => { if (!isMobile) setArrived(true) }}
        >
          {/* Chat messages — desktop only; mobile uses the full-screen overlay */}
          {hasMessages && !isMobile && (
            <motion.div
              ref={scrollContainerRef}
              className="scrollarea mb-6 w-full rounded-2xl p-6 overflow-y-auto scroll-smooth border"
              style={{ height: 'calc(100vh - 320px)', maxHeight: '65vh', minHeight: '280px', background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.10)" }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
            >
              <div className="space-y-4">
                {messages.map((m) => {
                  const isUser = m.role === "user"
                  return (
                    <div
                      key={m.id}
                      ref={(el) => { if (el) messageRefs.current.set(m.id, el); else messageRefs.current.delete(m.id) }}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} text-left`}
                    >
                      <div
                        className={isUser
                          ? "-mr-2 text-white rounded-2xl px-4 py-2 inline-flex items-center justify-center text-left whitespace-pre-wrap break-words max-w-[75%]"
                          : "-ml-4 text-white rounded-2xl px-4 py-2 flex flex-col gap-1 items-start text-left break-words max-w-[99%] bg-white/0"}
                        style={isUser ? { background: "#ef382e" } : {}}
                      >
                        {!isUser && <div className="font-semibold text-white/60 text-sm">Milo</div>}
                        <div className="leading-relaxed w-full">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isLoading && (
                  <div className="flex justify-start text-left">
                    <div className="-ml-4 text-white rounded-2xl px-4 py-2 flex flex-col gap-1 items-start">
                      <div className="font-semibold text-white/60 text-sm">Milo</div>
                      <div className="flex items-center text-white/80">
                        <span>Thinking</span>
                        <span className="inline-flex ml-1">
                          {[0, 0.3, 0.6].map((delay) => (
                            <motion.span key={delay} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay }}>.</motion.span>
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── MOBILE: resume chat button when overlay is minimized ── */}
          {isMobile && hasMessages && !mobileOverlayOpen && (
            <motion.button
              className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold shadow-xl"
              style={{ background: "#ef382e" }}
              onClick={() => setMobileOverlayOpen(true)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <MessageCircle className="w-4 h-4" />
              Continue chatting
            </motion.button>
          )}

          {/* ── MOBILE INTRO: label + orb + chips rise together from below ── */}
          {/* Hidden once chat starts (the overlay takes over). */}
          {isMobile && !hasMessages && (
            <motion.div
              className="flex flex-col items-center w-full"
              initial={{ y: "80vh" }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              onAnimationComplete={() => setArrived(true)}
            >
              {!hasMessages && (
                <motion.div
                  className="w-full text-center -z-10 pointer-events-none font-bold text-2xl text-white px-6"
                  initial={false}
                  animate={showLabel ? { opacity: 1, y: -12 } : { opacity: 0, y: 50 }}
                  transition={{ type: "spring", bounce: 0.2, duration: 1 }}
                >
                  I&apos;m Milo. Let&apos;s talk about what Archpoint can do for you.
                </motion.div>
              )}

              {/* Orb */}
              <motion.div
                className="relative z-10 mb-0 rounded-full shadow-2xl"
                style={{ border: "1px solid rgba(255,255,255,0.15)" }}
                initial={false}
                animate={arrived ? { width: isTablet ? "min(600px, calc(100vw - 80px))" : "calc(100vw - 56px)", height: 56 } : { width: 48, height: 48 }}
                transition={{
                  width: { type: "spring", bounce: 0.2, duration: 1.3 },
                  height: { type: "spring", bounce: 0.2, duration: 1.3 },
                }}
                onAnimationComplete={() => {
                  setTimeout(() => setShowLabel(true), 200)
                  setTimeout(() => setShowExamples(true), 1200)
                }}
              >
                <div className="relative h-full w-full">
                  <div className="absolute inset-0 rounded-full z-0" style={{ background: "#ffffff" }}>
                    <motion.form className="absolute inset-0 z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit}>
                      <input
                        className={`h-full w-full rounded-full px-5 bg-transparent pr-20 focus:outline-none focus:ring-0 text-[#2e353e] placeholder:text-[#2e353e]/40 ${arrived ? "" : "pointer-events-none"}`}
                        value={input}
                        placeholder={arrived ? (canChat ? (remainingTurns <= 3 ? `Ask away... (${remainingTurns} left)` : "Ask away...") : "Chat limit reached for this session") : ""}
                        onChange={(e) => setInput(e.currentTarget.value)}
                        disabled={isLoading || !canChat}
                      />
                      {input && arrived && !isLoading && canChat && (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-90 hover:cursor-pointer"
                          style={{ background: "#ef382e" }}
                        >
                          <ArrowUp className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </motion.form>
                  </div>
                </div>
              </motion.div>

              {/* Chips (mobile) */}
              {!hasMessages && (
                <motion.ul className="mt-5 flex flex-wrap gap-3 items-center justify-center w-full">
                  {examplesForMobile.filter(e => !usedExamples.includes(e)).map((t, i) => (
                    <motion.li
                      key={t}
                      initial={false}
                      animate={showExamples ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5, delay: i * 0.3 }}
                      onClick={() => { if (!isLoading && canChat) handleExampleClick(t) }}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium text-white/80 transition-colors ${!canChat ? "cursor-not-allowed opacity-40" : isLoading ? "cursor-wait opacity-60" : "cursor-pointer hover:text-white"}`}
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                      title={!canChat ? "Chat limit reached for this session" : undefined}
                    >
                      {t}
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </motion.div>
          )}

          {/* ── DESKTOP: label + orb + chips (no rise wrapper needed) ── */}
          {!isMobile && !hasMessages && (
            <motion.div
              className="w-full text-center -z-10 pointer-events-none font-bold text-2xl text-white px-6"
              initial={false}
              animate={showLabel ? { opacity: 1, y: -12 } : { opacity: 0, y: 50 }}
              transition={{ type: "spring", bounce: 0.2, duration: 1 }}
            >
              Hey, I&apos;m Milo! What do you want to learn about Archpoint?
            </motion.div>
          )}

          {!isMobile && (
            <motion.div
              className="relative z-10 mb-0 xl:mb-2 shadow-2xl"
              style={{ border: "1px solid rgba(255,255,255,0.15)" }}
              initial={false}
              animate={arrived
                ? { width: 672, height: desktopInputHeight, borderRadius: desktopInputHeight > 64 ? 16 : 9999 }
                : { width: 48, height: 48, borderRadius: 9999 }
              }
              transition={{
                width: { type: "spring", bounce: 0.2, duration: 1.3 },
                height: { type: "spring", bounce: 0.2, duration: 0.3 },
                borderRadius: { duration: 0.2 },
              }}
              onAnimationComplete={() => {
                setTimeout(() => setShowLabel(true), 200)
                setTimeout(() => {
                  setShowExamples(true)
                  // Chips stagger: last chip (i=3) has 0.9s delay + 0.5s duration = ~1.4s
                  setTimeout(() => {
                    if (!hasAutoFocused.current) {
                      hasAutoFocused.current = true
                      setFullyArrived(true)
                      desktopTextareaRef.current?.focus()
                    }
                  }, 1500)
                }, 1200)
              }}
            >
              <div className="relative h-full w-full">
                <div className="absolute inset-0 z-0" style={{ background: "#ffffff", borderRadius: desktopInputHeight > 64 ? 16 : 9999 }}>
                  <motion.form className="absolute inset-0 z-10 flex items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit}>
                    <textarea
                      ref={desktopTextareaRef}
                      rows={1}
                      className={`flex-1 px-5 bg-transparent focus:outline-none focus:ring-0 text-[#2e353e] placeholder:text-[#2e353e]/40 resize-none leading-normal ${fullyArrived ? "" : "pointer-events-none"}`}
                      style={{ height: '24px', maxHeight: '96px', overflowY: 'auto', scrollbarWidth: 'none' }}
                      value={input}
                      placeholder={fullyArrived ? (canChat ? (remainingTurns <= 3 ? `Ask away... (${remainingTurns} left)` : "Ask away...") : "Chat limit reached for this session") : ""}
                      onChange={handleDesktopInputChange}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
                      disabled={!canChat}
                    />
                    {input && fullyArrived && !isLoading && canChat && (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        onMouseDown={(e) => e.preventDefault()}
                        className="mr-2 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-90 hover:cursor-pointer"
                        style={{ background: "#ef382e" }}
                      >
                        <ArrowUp className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </motion.form>
                </div>
              </div>
            </motion.div>
          )}

          {!isMobile && examples.filter(e => !usedExamples.includes(e)).length > 0 && (
            <motion.ul className="mt-5 flex flex-wrap gap-3 items-center justify-center w-full">
              {examples.filter(e => !usedExamples.includes(e)).map((t, i) => (
                <motion.li
                  key={t}
                  initial={false}
                  animate={showExamples ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5, delay: i * 0.3 }}
                  onClick={() => { if (!isLoading && canChat) handleExampleClick(t) }}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium text-white/80 transition-colors ${!canChat ? "cursor-not-allowed opacity-40" : isLoading ? "cursor-wait opacity-60" : "cursor-pointer hover:text-white"}`}
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
                  title={!canChat ? "Chat limit reached for this session" : undefined}
                >
                  {t}
                </motion.li>
              ))}
            </motion.ul>
          )}

        </motion.div>
      </div>

      <PortfolioModal item={selectedItem} onClose={() => setSelectedItem(null)} isMobile={isMobile} />
      <style jsx global>{`
        .scrollarea .chat-link:visited { color: #fff; }
        .scrollarea .chat-link svg { display: inline-block; vertical-align: middle; }
      `}</style>
    </main>
  )
}
