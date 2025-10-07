"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { ArrowUp } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Figtree } from "next/font/google"

const figtree = Figtree({ subsets: ["latin"] })

const SUBHEAD =
 "We develop custom software solutions, like apps, websites and AI agents that fully unlock the potential of your business. Chat with Milo, our AI Assistant, to discover what Archpoint Labs can do for you."

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function Chat() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [arrived, setArrived] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [sessionId] = useState(() => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const examples = ["Explain their past work", "I'd like an app", "I'd like a website", "I'd like an automation"]

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
  const handleLinkClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      const anchor = target as HTMLAnchorElement;
      if (anchor.href.startsWith('http')) {
        e.preventDefault();
        window.open(anchor.href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  document.addEventListener('click', handleLinkClick);

  // Cleanup
  return () => {
    document.removeEventListener('click', handleLinkClick);
  };
}, []);

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

  const hasMessages = messages.length > 0

  const isMobile = useIsMobile()

  return (
    <main className={`${figtree.className} min-h-screen w-full`}>
      <div aria-hidden className="fixed inset-0 z-0 bg-[url('/new-hero-bro.png')] bg-cover bg-center" />
      <div
        className="flex flex-col w-full min-h-screen py-24 px-12 mx-auto relative items-center text-left"
      >
        <div className="absolute top-6 left-6 drop-shadow-lg">
          <img
            src="/logos/AP Side By Side All White Transparent.svg"
            alt="Archpoint Labs Logo"
            className="h-10 w-auto"
          />
        </div>
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
              className={`scrollarea mb-8 w-full h-[50vh] sm bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 overflow-y-auto scroll-smooth ${isMobile && hasMessages ? "-mt-72 lg:mt-0" : ""}`}
              ref={scrollContainerRef}
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
                      className={`flex ${isUser ? "justify-end text-left" : "justify-start text-left"}`}
                    >
                      <div
                        className={`text-white/90 ${
                          isUser ? "mr-4 bg-blue-500 px-4 py-2 rounded-full flex items-center" : ""
                        }`}
                      >
                        {!isUser && (
                          <div className="font-semibold mb-1">
                            Milo:
                          </div>
                        )}
                        <div className="prose prose-inherit max-w-none leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
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
            {examples.map((t, i) => (
              <motion.li
                key={t}
                initial={false}
                animate={showExamples ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                transition={{
                  type: "spring",
                  bounce: 0.15,
                  duration: 0.5,
                  delay: i * 0.3,
                }}
                onClick={() => !isLoading && setInput(t)}
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
    </main>
  )
}