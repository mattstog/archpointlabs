"use client"

import { useState } from "react"
import PortfolioCard from "./portfolio-card"
import PortfolioModal from "./portfolio-modal"

export interface PortfolioItem {
  id: string
  title: string
  description: string
  posterUrl: string
  screenshotUrl: string
  screenshotUrlMobile: string
  liveUrl: string
}

// dont need this code, only need PortfolioItem. Best practice would probably say to move PortfolioItem into its own file, but rules were made to be broken. Sic Parvis Magna.
// const portfolioItems: PortfolioItem[] = [
//   {
//     id: "1",
//     title: "Classic Team Realty",
//     description: "Modern marketing site for top realty company",
//     posterUrl: "/ctr-hero.png",
//     screenshotUrl: "/ctr-screenshot.png",
//     liveUrl: "https://classicteamrealty.com",
//   },
//   {
//     id: "2",
//     title: "Mitch Harris",
//     description: "Modern marketing site for MLB player",
//     posterUrl: "/mitch-hero.png",
//     screenshotUrl: "/mitch-harris-screenshot.png",
//     liveUrl: "https://mitchharris.com",
//   },
//   {
//     id: "3",
//     title: "Fromm Scratch",
//     description: "Modern marketing site for top baking blog",
//     posterUrl: "/fs-hero.png",
//     screenshotUrl: "/fs-screenshot.png",
//     liveUrl: "https://frommscratch.com",
//   },
// ]

// export default function PortfolioGrid() {
//   const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null)

//   const handleOpen = (item: PortfolioItem) => {
//     setSelectedItem(item)
//   }

//   const handleClose = () => {
//     setSelectedItem(null)
//   }

//   return (
//     <>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
//         {portfolioItems.map((item) => (
//           <PortfolioCard key={item.id} item={item} onClick={() => handleOpen(item)} />
//         ))}
//       </div>

//       <PortfolioModal item={selectedItem} onClose={handleClose} />
//     </>
//   )
// }

