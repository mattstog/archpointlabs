// components/portfolio-modal.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import type { PortfolioItem } from "./portfolio-grid"

interface PortfolioModalProps {
  item: PortfolioItem | null
  iframeEl: HTMLIFrameElement | null
  onClose: () => void
}

export default function PortfolioModal({ item, iframeEl, onClose }: PortfolioModalProps) {
  const shellRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)

  // Handle Esc + body scroll lock
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

  // Reparent the already-loaded iframe into the modal, then return it on unmount
  useEffect(() => {
    if (!item || !iframeEl || !mountRef.current) return
    const el = iframeEl

    // Prepare it for visible display
    Object.assign(el.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "100%",
      height: "100%",
      border: "0",
      visibility: "visible",
    } as CSSStyleDeclaration)

    // Show spinner until the iframe reported it finished loading at least once
    const markLoaded = () => setLoading(false)
    setLoading(el.dataset.loaded === "true" ? false : true)
    el.addEventListener("load", markLoaded)

    mountRef.current.appendChild(el)

    return () => {
      el.removeEventListener("load", markLoaded)
      // Hand control back to parent (which will put it into the pool)
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, iframeEl])

  if (!item) return null

  return (
    <div
      ref={shellRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-[95vw] h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="text-white">
            <h2 className="text-2xl font-bold text-balance">{item.title}</h2>
            <p className="text-sm text-white/80 mt-1">{item.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
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
            <span className="sr-only">Close modal</span>
          </button>
        </div>

        {/* Iframe mount point */}
        <div ref={mountRef} className="relative w-full h-full bg-black">
          {loading && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-white/80 text-sm">Loading…</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

