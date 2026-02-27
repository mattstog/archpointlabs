"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { ArrowUp } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"
import PortfolioModal from "@/components/portfolio-modal"
import type { PortfolioItem } from "@/components/portfolio-grid"
import { ExternalLink } from "lucide-react"

const SUBHEAD =
  "We develop custom software solutions, like apps, websites and AI agents that fully unlock the potential of your business. Chat with Milo, our AI Assistant, to discover what Archpoint Labs can do for you."

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

  useEffect(() => setMounted(true), [])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())

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
    if (input.trim() && !isLoading) { sendMessage(input); setInput("") }
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
  const examplesToUse = isMobile ? examplesForMobile : examples
  const MOBILE_SCROLL_BY_PX = 360
  const didMobileScrollRef = useRef(false)

  useEffect(() => {
    if (!mounted) return
    if (isMobile && hasMessages && !didMobileScrollRef.current) {
      didMobileScrollRef.current = true
      window.requestAnimationFrame(() => window.scrollBy({ top: MOBILE_SCROLL_BY_PX, behavior: "smooth" }))
    }
  }, [mounted, isMobile, hasMessages])

  return (
    <main className="min-h-screen w-full">

      {/* Clean brand background */}
      <div
        aria-hidden
        className="fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 0%, rgba(239,56,46,0.10) 0%, transparent 55%), " +
            "radial-gradient(ellipse at 85% 100%, rgba(239,56,46,0.06) 0%, transparent 45%), " +
            "#2e353e",
        }}
      />

      {/* Faint AP icon watermark — overflowing off bottom-left corner */}
      <div
        aria-hidden
        className="fixed pointer-events-none z-0"
        style={{
          bottom: "-110px",
          left: "-110px",
          width: "640px",
          height: "640px",
          opacity: 0.33,
          maskImage: "radial-gradient(ellipse at bottom left, black 0%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(ellipse at bottom left, black 0%, transparent 90%)",
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

      <div className="w-full min-h-screen relative">

        {/* Navigation */}
        <nav className="absolute top-0 inset-x-0 z-50 flex items-center justify-between px-6 pt-6 pb-4">
          <a href="https://archpointlabs.com" className="flex items-center">
            <img src="/logos/AP Logo -White.svg" alt="Archpoint Labs" className="h-28 w-auto" />
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
        <div className="absolute inset-x-0 lg:inset-x-auto top-24 lg:top-[30%] lg:left-24 lg:text-left text-center text-white max-w-xl pointer-events-none z-0 mx-auto lg:mx-0">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Creating <br /> What&apos;s Next.
          </h1>
          <div className="mt-3 mb-4 lg:ml-0 mx-auto w-12 h-[3px] rounded-full" style={{ background: "#ef382e" }} />
          <p className="text-base px-6 lg:px-0 leading-relaxed text-white/70">{SUBHEAD}</p>
        </div>

        {/* Chat wrapper */}
        <motion.div
          key={mounted && isMobile ? "m" : "d"}
          className={`absolute top-0 lg:top-[30%] left-1/2 -translate-x-1/2 isolate flex flex-col items-center justify-center ${!isMobile ? "ml-85" : ""} w-full max-w-[672px] px-4 ${(isMobile && hasMessages) ? "py-4" : ""}`}
          style={!isMobile ? { top: hasMessages ? "10%" : "30%", transition: "top 0.6s cubic-bezier(0.4,0,0.2,1)" } : undefined}
          initial={{ y: isMobile ? "120svh" : "-40dvh" }}
          animate={{ y: isMobile ? "55svh" : 0 }}
          transition={{
            y: isMobile ? { delay: 1.2, duration: 3, ease: "linear" } : { delay: 1.5, duration: 2, ease: "linear" },
            opacity: { delay: 1.5, duration: 0.4 },
          }}
          onAnimationComplete={() => setArrived(true)}
        >
          {/* Chat messages */}
          {hasMessages && (
            <motion.div
              ref={scrollContainerRef}
              className="scrollarea mb-8 w-full h-[50vh] rounded-2xl p-6 overflow-y-auto scroll-smooth border"
              style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.10)" }}
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
                          : "-ml-4 text-white rounded-2xl px-4 py-2 flex flex-col gap-1 items-start text-left whitespace-pre-wrap break-words max-w-[99%] bg-white/0"}
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

          {/* Milo label */}
          {!hasMessages && (
            <motion.div
              className="lg:min-w-[672px] md:w-full sm:w-full text-center -z-10 pointer-events-none font-bold text-2xl text-white"
              initial={false}
              animate={showLabel ? { opacity: 1, y: -12 } : { opacity: 0, y: 50 }}
              transition={{ type: "spring", bounce: 0.2, duration: 1 }}
            >
              Hey, I&apos;m Milo! What do you want to learn about Archpoint?
            </motion.div>
          )}

          {/* Input orb */}
          <motion.div
            className="relative z-10 mb-0 lg:mb-2 rounded-full shadow-2xl"
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            initial={false}
            animate={arrived ? { width: isMobile ? 380 : 672, height: 64 } : { width: 48, height: 48 }}
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

          {/* Example chips */}
          <motion.ul className="mt-5 flex flex-wrap gap-3 items-center justify-center w-full">
            {examplesToUse.filter(e => !usedExamples.includes(e)).map((t, i) => (
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
