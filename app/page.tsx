"use client"
import { useChat } from "@ai-sdk/react"
import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { ArrowUp } from "lucide-react"
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Figtree } from "next/font/google"

const figtree = Figtree({ subsets: ["latin"] })

const SUBHEAD =
  "Custom apps, websites, and automations that lift your business above the rest. Chat with our AI Assistant, Milo, to discover how Archpoint Labs can help your business grow."

export default function Chat() {
  const [input, setInput] = useState("")
  const { messages, sendMessage } = useChat()
  const [arrived, setArrived] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const examples = ["Explain their past work", "I'd like an app", "I'd like a website", "I'd like an automation"]

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput("")
    }
  }

  const hasMessages = messages.length > 0

  const isMobile = useIsMobile()

  return (
    <main className={`${figtree.className} min-h-screen w-full`}>
      <div
        className="flex flex-col w-full min-h-screen py-24 px-12 mx-auto relative items-center text-left bg-cover bg-center bg-fixed"
        style={{ backgroundImage: "url('/new-hero-bro.png')" }}
      >
        <div className="absolute top-6 left-6 drop-shadow-lg flex flex-row items-center space-x-2">
          <img
            src="/apl-logo.svg"
            alt="Archpoint Logo"
            className="h-8 w-auto"
          />
          <div className="text-xl font-bold text-white drop-shadow-lg">Archpoint Labs</div>
        </div>
        <div className="absolute top-6 right-6 text-xl font-bold text-white drop-shadow-lg">Book a Call</div>

        {/** Headline & Subheadline */}
        <div
          className="absolute left-24 top-32 text-white drop-shadow-l max-w-xl pointer-events-none z-0 hidden lg:block"
        >
          <h1 className="text-6xl font-extrabold leading-tight">
            Building <br/> What's Next.
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-white/90">
            {SUBHEAD}
          </p>
        </div>

        {/* travel wrapper */}
        <motion.div
          className="absolute top-1/6 left-1/2 -translate-x-1/2 isolate flex flex-col items-center justify-center lg:ml-85 w-full max-w-[672px] px-4"
          initial={{ y: "-40dvh" }}
          animate={{ y: 0 }} 
          transition={{
            y: { duration: 3.5, ease: "linear" },
            opacity: { duration: 0.4 },
          }}
          onAnimationComplete={() => setArrived(true)}
        >
          {/** Our sick glass UI */}
          {hasMessages && (
            <motion.div
              className="scrollarea mb-8 w-full h-[50vh] sm bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 overflow-y-auto scroll-smooth"
              ref={scrollContainerRef}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
            >
              <div className="space-y-4">
                {messages.map((m) => {
                  const content = m.parts
                    .filter((p) => p.type === "text")
                    .map((p) => p.text)
                    .join("");

                  const isUser = m.role === "user";
                  
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
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
            className="relative z-10 mb-2 rounded-full border border-zinc-300 shadow-xl"
            initial={false}
            animate={arrived ? { width: isMobile ? 380 : 672, height: 64 } : { width: 48, height: 48 }} // open after arrival
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
              <div className="absolute inset-0 rounded-full bg-white dark:bg-zinc-900 z-0">
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
                  />
                  {input && arrived && (
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
                onClick={() => setInput(t)}
                className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm shadow cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
