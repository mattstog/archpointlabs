import PortfolioGrid from "@/components/portfolio-grid"
import { Figtree } from "next/font/google"
const figtree = Figtree({ subsets: ["latin"] })

export default function Home() {
  return (
    <main className={`${figtree.className} min-h-screen bg-gradient-to-b from-[#4884d3] to-[#76a4e5]`}>
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="absolute top-6 left-6 drop-shadow-lg flex flex-row items-center space-x-2">
          <img
            src="/archpoint-white.svg"
            alt="Archpoint Logo"
            className="h-8 w-auto"
          />
          <div className="text-xl font-bold text-white drop-shadow-lg">Archpoint Labs</div>
        </div>
        <div className="absolute top-6 right-6 text-xl font-bold text-white drop-shadow-lg">Book a Call</div>
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white text-center mb-16 md:mb-24 text-balance">
          Our Work
        </h1>
        <PortfolioGrid />
      </div>
    </main>
  )
}