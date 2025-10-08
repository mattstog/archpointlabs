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
    iframeUrl: "https://classicteamrealty.com",
  },
  {
    id: "2",
    title: "Mitch Harris",
    description: "Modern marketing site for MLB player",
    posterUrl: "/mitch-hero.png",
    iframeUrl: "https://mitchharris.com",
  },
  {
    id: "3",
    title: "Fromm Scratch",
    description: "Modern marketing site for top baking blog",
    posterUrl: "/fs-hero.png",
    iframeUrl: "https://frommscratch.com",
  },
]

export default function Chat() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [usedExamples, setUsedExamples] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)
  
  // Portfolio modal state
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [activeIframe, setActiveIframe] = useState<HTMLIFrameElement | null>(null)
  const poolRef = useRef<HTMLDivElement>(null)
  const iframeMapRef = useRef<Map<string, HTMLIFrameElement>>(new Map())

  useEffect(() => setMounted(true), [])

  const scrollContainerRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Initialize iframe pool for portfolio items
  useEffect(() => {
    if (!poolRef.current) return

    for (const item of portfolioItems) {
      if (!iframeMapRef.current.has(item.id)) {
        const el = document.createElement("iframe")
        el.src = item.iframeUrl
        el.title = item.title
        el.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        )
        Object.assign(el.style, {
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "800px",
          height: "600px",
          border: "0",
          visibility: "hidden",
        } as CSSStyleDeclaration)

        const handleLoad = () => {
          el.dataset.loaded = "true"
        }
        el.addEventListener("load", handleLoad)

        poolRef.current.appendChild(el)
        iframeMapRef.current.set(item.id, el)
      }
    }

    return () => {
      iframeMapRef.current.forEach((el) => {
        el.remove()
      })
      iframeMapRef.current.clear()
    }
  }, [])

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
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setIsLoading(true)

    // Add this setTimeout to scroll after state updates
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    }, 0)

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
    if (input.trim() && !isLoading) {
      sendMessage(input)
      setInput("")
    }
  }

  const handleExampleClick = (text: string) => {
    if (!isLoading) {
      setUsedExamples([...usedExamples, text])
      sendMessage(text)
    }
  }

  // Handle portfolio link clicks
  const handlePortfolioClick = (url: string) => {
    const item = portfolioItems.find(p => p.iframeUrl === url)
    if (item) {
      const el = iframeMapRef.current.get(item.id) || null
      setActiveIframe(el)
      setSelectedItem(item)
    }
  }

  // Return iframe to pool when modal closes
  const returnIframeToPool = () => {
    if (activeIframe && poolRef.current) {
      poolRef.current.appendChild(activeIframe)
      Object.assign(activeIframe.style, {
        position: "absolute",
        left: "-9999px",
        top: "0",
        width: "800px",
        height: "600px",
        border: "0",
        visibility: "hidden",
      } as CSSStyleDeclaration)
    }
    setActiveIframe(null)
    setSelectedItem(null)
  }

  // Custom markdown components for portfolio links
  const markdownComponents: Components = {
    p: ({ children }) => <p className="mb-2">{children}</p>,
    a: ({ node, href, children }) => {
      // Check if this is a portfolio URL
      const isPortfolioLink = portfolioItems.some(item => item.iframeUrl === href)
      
      if (isPortfolioLink && href) {
        return (
          <button
            onClick={(e) => {
              e.preventDefault()
              handlePortfolioClick(href)
            }}
            className="text-blue-700 hover:text-blue-900 underline cursor-pointer bg-transparent border-none p-0 font-inherit"
          >
            {children}
          </button>
        )
      }
      
      // Regular external link
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:text-blue-900 underline"
        >
          {children}
        </a>
      )
    }
  }

  const hasMessages = messages.length > 0

  const isMobile = useIsMobile()

  const examplesToUse = isMobile ? examplesForMobile : examples;

  return (
    <main className={`${figtree.className} min-h-screen w-full`}>
      {/* Hidden iframe pool */}
      <div
        ref={poolRef}
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      />

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
        {!(isMobile && hasMessages) && (
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
        )}

        {/* travel wrapper */}
        <motion.div
          key={mounted && isMobile ? "m" : "d"}
          className="absolute top-0 lg:top-[19%] left-1/2 -translate-x-1/2 isolate flex flex-col items-center justify-center lg:ml-85 w-full max-w-[672px] px-4"
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
              className={`scrollarea mb-8 w-full h-[50vh] sm bg-gray-900/25 backdrop-blur-md border border-white/40 rounded-2xl p-6 overflow-y-auto scroll-smooth ${isMobile && hasMessages ? "-mt-72 lg:mt-0" : ""}`}              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
            >
              <div className="space-y-4">
                {messages.map((m) => {
                  const isUser = m.role === "user"
                  
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isUser ? "justify-end text-left" : "justify-start text-left"}`}
                    >
                      <div
                        className={`${
                          isUser ? "mr-4 bg-blue-500 px-4 py-2 rounded-full flex items-center text-white" : "text-white"
                        }`}
                      >
                        {!isUser && (
                          <div className="font-semibold mb-1 text-white">
                            Milo:
                          </div>
                        )}
                        <div className="prose prose-inherit max-w-none leading-relaxed">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={markdownComponents}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {isLoading && (
                  <div className="flex justify-start text-left">
                    <div className="text-white/90">
                      <div className="font-semibold mb-1">Milo:</div>
                      <div className="prose prose-inherit max-w-none leading-relaxed flex items-center">
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
            className="relative z-10 mb-0 lg:mb-2 rounded-full border border-zinc-300 shadow-xl"
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
              <div className="absolute inset-0 rounded-full bg-white z-0">
                <motion.form
                  key="form"
                  className="absolute inset-0 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit}
                >
                  <input
                    className={`h-full w-full rounded-full px-4 bg-transparent pr-20 focus:outline-none focus:ring-0 ${
                      arrived ? "" : "pointer-events-none"
                    }`}
                    value={input}
                    placeholder={arrived ? "Ask away..." : ""}
                    onChange={(e) => setInput(e.currentTarget.value)}
                    disabled={isLoading}
                  />
                  {input && arrived && !isLoading && (
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

          <motion.ul className="mt-5 flex flex-wrap gap-4 items-center justify-center w-full">
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
                  onClick={() => handleExampleClick(t)}
                  className={`px-3 py-1 rounded-full border border-zinc-300 bg-white text-sm shadow ${
                    isLoading ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-zinc-100"
                  }`}
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
        iframeEl={activeIframe}
        onClose={returnIframeToPool}
      />
    </main>
  )
}