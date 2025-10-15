// components/portfolio-modal.tsx
"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import type { PortfolioItem } from "./portfolio-grid"

interface PortfolioModalProps {
  item: PortfolioItem | null
  onClose: () => void
  isMobile: boolean
}

export default function PortfolioModal({ item, onClose, isMobile }: PortfolioModalProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle Esc key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (item) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [item, onClose])

  if (!item) return null

  const screenshotUrl = isMobile ? item.screenshotUrlMobile : item.screenshotUrl

  return (
    <div
      ref={shellRef}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-300 pt-8 pb-8 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-[97vw] md:w-[96vw] lg:w-[95vw] bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col my-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 md:p-6  backdrop-blur-sm">
          <div className="text-white flex-1">
            <h2 className="lg:text-2xl md:text-3xl font-bold text-balance text-[#000000]">{item.title}</h2>
            <p className="text-sm mt-1 text-[#000000]">{item.description}</p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <a
              href={item.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex text-black hover:bg-white/20 rounded-lg px-4 py-2 transition-colors text-sm font-medium whitespace-nowrap"
            >
              Visit Live Site →
            </a>
            <button
              onClick={onClose}
              className="text-black hover:bg-white/20 rounded-full p-2 transition-colors flex-shrink-0"
              aria-label="Close modal"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Screenshot Preview */}
        <div ref={contentRef} className="relative w-full bg-gray-100 p-3 md:p-4">
          <div className="relative w-full bg-white rounded-lg overflow-hidden shadow-lg">
            <Image
              src={screenshotUrl}
              alt={`${item.title} preview`}
              width={1080}
              height={2000}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>

        {/* Footer CTA for Mobile */}
        <div className="sm:hidden p-4 bg-gradient-to-t from-white to-transparent border-t border-gray-200">
          <a
            href={item.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            Visit Live Site →
          </a>
        </div>
      </div>
    </div>
  )
}