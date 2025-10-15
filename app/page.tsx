"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { ArrowUp } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Figtree } from "next/font/google"
import type { Components } from "react-markdown"
import PortfolioModal from "@/components/portfolio-modal"
import type { PortfolioItem } from "@/components/portfolio-grid"
import { ExternalLink } from "lucide-react"

const figtree = Figtree({ subsets: ["latin"] })

const SUBHEAD =
 "We develop custom software solutions, like apps, websites and AI agents that fully unlock the potential of your business. Chat with Milo, our AI Assistant, to discover what Archpoint Labs can do for you."

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

// Portfolio items configuration
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
  
  // for conversation
  const [messages, setMessages] = useState<Message[]>([])
  const userMessageCount = messages.filter(m => m.role === "user").length
  // --- chat limit config ---
  const CHAT_LIMIT = 50; 
  const remainingTurns = Math.max(0, CHAT_LIMIT - userMessageCount);
  const canChat = remainingTurns > 0;

  const [isLoading, setIsLoading] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [usedExamples, setUsedExamples] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  
  // Portfolio modal state
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

  function scrollToBottom(el: HTMLElement, behavior: ScrollBehavior = "auto") {
  el.scrollTo({ top: el.scrollHeight, behavior })
}

type AutoScrollMode = "bottom" | "anchor"

function useAutoScroll(
  ref: React.RefObject<HTMLDivElement | null>,
  deps: unknown[],
  opts?: {
    mode?: AutoScrollMode
    anchorEl?: () => HTMLElement | null // when mode === "anchor"
    pad?: number // px from top when anchored
  }
) {
  const mode = opts?.mode ?? "bottom"
  const pad = opts?.pad ?? 8

  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasQueuedNew, setHasQueuedNew] = useState(false)

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

    // Keep alignment on layout changes
    const ro = new ResizeObserver(() => {
      if (!ref.current) return
      const el = ref.current

      if (mode === "bottom") {
        if (isAtBottom) el.scrollTo({ top: el.scrollHeight })
      } else if (mode === "anchor" && opts?.anchorEl) {
        const anchor = opts.anchorEl()
        if (!anchor) return
        // Keep anchor at `pad` px from top of container
        const topNow =
          anchor.getBoundingClientRect().top - el.getBoundingClientRect().top
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

  // On deps change (new message / loading tick)
  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (mode === "bottom") {
      if (isAtBottom) {
        el.scrollTo({ top: el.scrollHeight })
      } else {
        setHasQueuedNew(true)
      }
    } else if (mode === "anchor" && opts?.anchorEl) {
      const anchor = opts.anchorEl()
      if (!anchor) return
      // Wait a frame for paint, then lock anchor to top with padding
      requestAnimationFrame(() => {
        if (!ref.current) return
        const el2 = ref.current
        const topNow =
          anchor.getBoundingClientRect().top - el2.getBoundingClientRect().top
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

  return { isAtBottom, hasQueuedNew, jumpToBottom }
}

  // figure out last msg + previous user msg
const last = messages[messages.length - 1]
let prevUserId: string | null = null
for (let i = messages.length - 2; i >= 0; i--) {
  if (messages[i].role === "user") { prevUserId = messages[i].id; break }
}

const mode: "bottom" | "anchor" =
  last?.role === "assistant" ? "anchor" : "bottom"

const { isAtBottom, hasQueuedNew, jumpToBottom } = useAutoScroll(
  scrollContainerRef,
  // trigger on any new message and loading state
  [messages.length, isLoading],
  {
    mode,
    pad: 8, // vertical padding from top when anchored
    anchorEl: () => (prevUserId ? messageRefs.current.get(prevUserId) ?? null : null),
  }
)

  function useIsMobile(breakpoint = 768) {
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
    if (!canChat) return; // hard stop if limit reached
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    requestAnimationFrame(() => {
      jumpToBottom(true)
    })
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

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      }

      setMessages([...newMessages, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }
      setMessages([...newMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!canChat) return; // stop if at limit
    if (input.trim() && !isLoading) {
      sendMessage(input)
      setInput("")
    }
  }

  const handleExampleClick = (text: string) => {
  if (!isLoading && canChat) {
      setUsedExamples([...usedExamples, text]);
      sendMessage(text);
    }
  };

  const handlePortfolioClick = (url: string) => {
    const item = portfolioItems.find(p => p.liveUrl === url)
    if (item) {
      setSelectedItem(item)
    }
  }

  const returnPortfolioModal = () => {
    setSelectedItem(null)
  }

  // Custom markdown components for portfolio links
  const markdownComponents: Components = {
    p: ({ children }) => <p className="m-0 inline">{children}</p>,
    a: ({ href, children }) => {
      const isPortfolioLink = href && portfolioItems.some(i => i.liveUrl === href)

      const base =
        "chat-link inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 " +
        "underline underline-offset-2 decoration-2 " +
        "bg-white/10 text-white hover:bg-white/20 " +
        "transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80"

      if (isPortfolioLink && href) {
        return (
          <button
            onClick={(e) => { e.preventDefault(); handlePortfolioClick(href) }}
            className={base + " cursor-pointer"}
          >
            {children}
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        )
      }

      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={base}
        >
          {children}
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      )
    },
  }

  const hasMessages = messages.length > 0

  const isMobile = useIsMobile()

  const examplesToUse = isMobile ? examplesForMobile : examples;

  const MOBILE_SCROLL_BY_PX = 360
  const didMobileScrollRef = useRef(false)
  // If you prefer to mirror the naming from your prompt:
  const isMessages = hasMessages

  useEffect(() => {
    if (!mounted) return
    if (isMobile && isMessages && !didMobileScrollRef.current) {
      didMobileScrollRef.current = true
      // small delay to ensure layout is stable before scrolling
      window.requestAnimationFrame(() => {
        window.scrollBy({ top: MOBILE_SCROLL_BY_PX, behavior: "smooth" })
      })
    }
  }, [mounted, isMobile, isMessages])

  return (
    <main className={`${figtree.className} min-h-screen w-full`}>

      <div aria-hidden className="fixed inset-0 z-0 bg-[url('/new-hero-bro.png')] bg-cover bg-center" />
      <div
        className="flex flex-col w-full min-h-screen py-24 px-12 mx-auto relative items-center text-left"
      >
        <a
          href="https://archpointlabs.com"
          className="absolute top-6 left-6 drop-shadow-lg z-50"
        >
          <img
            src="/logos/aidans-try-for-mobile-logo.svg"
            alt="Archpoint Labs Logo"
            className="h-10 w-auto"
          />
        </a>
        <a
          href="https://calendly.com/d/cshp-3n3-t4n/meet-with-archpoint-labs"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-6 right-6 text-xl font-bold text-white drop-shadow-lg"
        >
          Book a Call
        </a>

        {/** Headline & Subheadline */}
        <div
          className="absolute top-18 lg:top-32 inset-x-0 text-center lg:left-24 lg:text-left text-white drop-shadow-l max-w-xl pointer-events-none z-0"
        >
          <h1 className="text-4xl lg:text-6xl font-extrabold leading-tight">
            Creating <br/> What&apos;s Next.
          </h1>
          <p className="mt-3 text-lg sm:px-3 lg:px-0 leading-relaxed text-white/90">
            {SUBHEAD}
          </p>
        </div>

        {/* travel wrapper */}
        <motion.div
          key={mounted && isMobile ? "m" : "d"}
          className={`absolute top-0 lg:top-[19%] left-1/2 -translate-x-1/2 isolate flex flex-col items-center justify-center lg:ml-85 w-full max-w-[672px] px-4 ${(isMobile && hasMessages) ? "py-4" : ""}`}
          initial={{ y: isMobile ? "120svh" : "-40dvh" }}
          animate={{ y: isMobile ? "55svh" : 0 }}
          transition={{
            y: isMobile ? { delay: 1.2, duration: 3, ease: "linear" } : { delay: 1.5, duration: 2, ease: "linear" },
            opacity: { delay: 1.5, duration: 0.4 },
          }}
          onAnimationComplete={() => setArrived(true)}
        >
          {/** Our sick glass UI */}
          {hasMessages && (
            <motion.div
              ref={scrollContainerRef}
              className={`scrollarea mb-8 w-full h-[50vh] sm bg-gray-900/25 backdrop-blur-md border border-white/40 rounded-2xl p-6 overflow-y-auto scroll-smooth`}    
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
            >
              <div className="space-y-4">
                {messages.map((m) => {
                  const isUser = m.role === "user"
                  const content = isUser ? m.content : m.content.replace(/\n{2,}/g, "\n")
                  
                  return (
                    <div
                      key={m.id}
                      ref={(el) => {
                        if (el) messageRefs.current.set(m.id, el)
                        else messageRefs.current.delete(m.id)
                      }}
                      className={`flex ${isUser ? "justify-end text-left" : "justify-start text-left"}`}
                    >
                      <div
                        className={`${
                          isUser
                            // USER: keep centered pill
                            ? "mr-4 bg-blue-500 text-white rounded-2xl px-4 py-2 inline-flex items-center justify-center text-left whitespace-pre-wrap break-words max-w-[75%]"
                            // ASSISTANT: stack label + content vertically
                            : "ml-0 text-white rounded-2xl px-4 py-2 flex flex-col gap-1 items-start text-left whitespace-pre-wrap break-words max-w-[75%] bg-white/0"
                        }`}
                      >
                        {!isUser && (
                          <div className="font-semibold">Milo:</div>
                        )}
                        <div className="leading-relaxed w-full">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isLoading && (
                  <div className="flex justify-start text-left">
                    <div className="ml-0 text-white rounded-2xl px-4 py-2 flex flex-col gap-1 items-start text-left whitespace-pre-wrap break-words max-w-[75%] bg-white/0">
                      <div className="font-semibold">Milo:</div>
                      <div className="leading-relaxed w-full flex items-center">
                        <span>Thinking</span>
                        <span className="inline-flex ml-1">
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                          >
                            .
                          </motion.span>
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                          >
                            .
                          </motion.span>
                          <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                          >
                            .
                          </motion.span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/** Text label */}
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

          {/** Orb / Form */}
          <motion.div
            className="relative z-10 mb-0 lg:mb-2 rounded-full border border-zinc-300 shadow-xl text-black"
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
              <div className="absolute inset-0 rounded-full bg-white z-0 text-black">
                <motion.form
                  key="form"
                  className="absolute inset-0 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                >
                  <input
                    className={`h-full w-full rounded-full px-4 bg-transparent pr-20 focus:outline-none focus:ring-0 text-black ${
                      arrived ? "" : "pointer-events-none"
                    }`}
                    value={input}
                    placeholder={
                      arrived
                        ? (
                            canChat
                              ? remainingTurns <= 3
                                ? `Ask away... (${remainingTurns} left)`
                                : "Ask away..."
                              : "Chat limit reached for this session"
                          )
                        : ""
                    }
                    onChange={(e) => setInput(e.currentTarget.value)}
                    disabled={isLoading || !canChat}
                  />
                  {input && arrived && !isLoading && canChat && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-black hover:bg-gray-800 hover:cursor-pointer rounded-full flex items-center justify-center transition-colors"
                    >
                      <ArrowUp className="w-5 h-5 text-white" />
                    </button>
                  )}
                </motion.form>
              </div>
            </div>
          </motion.div>

          <motion.ul className="mt-5 flex flex-wrap gap-4 items-center justify-center w-full text-black">
            {examplesToUse
              .filter(example => !usedExamples.includes(example))
              .map((t, i) => (
                <motion.li
                  key={t}
                  initial={false}
                  animate={showExamples ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    bounce: 0.15,
                    duration: 0.5,
                    delay: i * 0.3,
                  }}
                  onClick={() => {
                    if (!isLoading && canChat) handleExampleClick(t)
                  }}
                  className={`px-3 py-1 rounded-full border border-zinc-300 bg-white text-sm shadow text-black ${
                    !canChat
                      ? "cursor-not-allowed opacity-50"
                      : isLoading
                      ? "cursor-wait opacity-70"
                      : "cursor-pointer hover:bg-zinc-100"
                  }`}
                  title={!canChat ? "Chat limit reached for this session" : undefined}
                >
                  {t}
                </motion.li>
              ))}
          </motion.ul>
        </motion.div>
      </div>

      {/* Portfolio Modal */}
      <PortfolioModal
        item={selectedItem}
        onClose={returnPortfolioModal}
        isMobile={isMobile}
      />
      <style jsx global>{`
        .scrollarea .chat-link:visited { color: #fff; }
        .scrollarea .chat-link svg {
          display: inline-block;
          vertical-align: middle;
        }
      `}</style>
    </main>
  )
}