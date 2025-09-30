"use client"
import { useChat } from "@ai-sdk/react"
import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion } from "motion/react"
import { ArrowUp } from "lucide-react"
import { Figtree } from "next/font/google"
const figtree = Figtree({ subsets: ["latin"] })

export default function Chat() {
  const [input, setInput] = useState("")
  const { messages, sendMessage } = useChat()
  const [arrived, setArrived] = useState(false)
  const [showLabel, setShowLabel] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const examples = ["Explain their past work", "I'd like an app", "I'd like a website"]

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (input.trim()) {
      sendMessage({ text: input })
      setInput("")
    }
  }

  const hasMessages = messages.length > 0

  return (
    <main className={figtree.className}>
      <div
        className="flex flex-col w-full min-w-screen min-h-screen py-24 px-12 mx-auto relative items-center text-left bg-cover bg-center bg-gray-900"
        style={{ backgroundImage: "url('/alright-here.png')" }}
      >
        <div className="absolute top-6 left-6 drop-shadow-lg flex flex-row items-center space-x-2">
          <img
            src="/archpoint-white.svg"
            alt="Archpoint Logo"
            className="h-8 w-auto"
          />
          <div className="text-xl font-bold text-white drop-shadow-lg">Archpoint Labs</div>
        </div>
        <div className="absolute top-6 right-6 text-xl font-bold text-white drop-shadow-lg">Book a Call</div>

        {/* travel wrapper */}
        <motion.div
          className="absolute top-1/6 left-1/2 -translate-x-1/2 isolate flex flex-col items-center justify-center ml-85"
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
              className="mb-8 w-[672px] h-80 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-6 overflow-y-auto scroll-smooth"
              ref={scrollContainerRef}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
            >
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className="text-white">
                    <div className="font-semibold mb-1">{m.role === "user" ? "Me:" : "Milo:"}</div>
                    <div className="text-white/90 leading-relaxed">
                      {m.parts.map((p, i) => (p.type === "text" ? <div key={`${m.id}-${i}`}>{p.text}</div> : null))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/** Text label */}
          {!hasMessages && (
            <motion.div
              className="min-w-[672px] -z-10 pointer-events-none font-bold text-2xl text-white"
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
            animate={arrived ? { width: 672, height: 64 } : { width: 48, height: 48 }} // open after arrival
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

          <motion.ul className="mt-5 flex gap-4 items-center justify-start w-full">
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
