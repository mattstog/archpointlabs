// components/portfolio-grid.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import PortfolioCard from "./portfolio-card"
import PortfolioModal from "./portfolio-modal"

export interface PortfolioItem {
  id: string
  title: string
  description: string
  posterUrl: string
  iframeUrl: string
}

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

export default function PortfolioGrid() {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)
  const [activeIframe, setActiveIframe] = useState<HTMLIFrameElement | null>(null)

  // Off-screen pool to host preloaded iframes
  const poolRef = useRef<HTMLDivElement>(null)
  const iframeMapRef = useRef<Map<string, HTMLIFrameElement>>(new Map())

  // Create each iframe once and keep it loading in the pool
  useEffect(() => {
    if (!poolRef.current) return

    // Create iframes that don't exist yet
    for (const item of portfolioItems) {
      if (!iframeMapRef.current.has(item.id)) {
        const el = document.createElement("iframe")
        el.src = item.iframeUrl
        el.title = item.title
        el.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        )
        // Keep off-screen but mounted so it fully initializes
        Object.assign(el.style, {
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "800px", // give it a real size to encourage full load/layout
          height: "600px",
          border: "0",
          visibility: "hidden",
        } as CSSStyleDeclaration)

        // Track load state so the modal can show/hide a spinner instantly
        const handleLoad = () => {
          el.dataset.loaded = "true"
        }
        el.addEventListener("load", handleLoad)

        poolRef.current.appendChild(el)
        iframeMapRef.current.set(item.id, el)
      }
    }

    return () => {
      // (Optional) cleanup on page unmount
      iframeMapRef.current.forEach((el) => {
        el.remove()
      })
      iframeMapRef.current.clear()
    }
  }, [])

  // When a card is clicked, pick up the already-created iframe and pass it to the modal
  const handleOpen = (item: PortfolioItem) => {
    const el = iframeMapRef.current.get(item.id) || null
    setActiveIframe(el)
    setSelectedItem(item)
  }

  // When modal closes, return the iframe to the pool so it stays warm
  const returnIframeToPool = () => {
    if (activeIframe && poolRef.current) {
      poolRef.current.appendChild(activeIframe)
      // keep it off-screen again
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

  return (
    <>
      {/* Hidden pool host */}
      <div
        ref={poolRef}
        aria-hidden="true"
        style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {portfolioItems.map((item) => (
          <PortfolioCard key={item.id} item={item} onClick={() => handleOpen(item)} />
        ))}
      </div>

      <PortfolioModal
        item={selectedItem}
        iframeEl={activeIframe}
        onClose={returnIframeToPool}
      />
    </>
  )
}

