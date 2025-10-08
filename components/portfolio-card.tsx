// components/portfolio-card.tsx
"use client"

import Image from "next/image"
import type { PortfolioItem } from "./portfolio-grid"

interface PortfolioCardProps {
  item: PortfolioItem
  onClick: () => void
}

export default function PortfolioCard({ item, onClick }: PortfolioCardProps) {
  return (
    <div
      className="group cursor-pointer overflow-hidden bg-white rounded-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
      onClick={onClick}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        <Image
          src={item.posterUrl || "/placeholder.svg"}
          alt={item.title}
          fill
          className="object-cover"
          priority={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
      </div>
    </div>
  )
}
