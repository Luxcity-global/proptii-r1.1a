"use client"

import { useState } from "react"
import { HeroToggle } from "./hero-toggle"
import { Camera, Mic, Sparkles } from "lucide-react"

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <section className="relative flex min-h-screen flex-col items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-K96WGX1LoeDmsPZ2gbh9zgZj3cxkJ0.png"
          alt="Proptii hero background showing a joyful moment"
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(10, 10, 15, 0.65) 0%, rgba(10, 10, 15, 0.75) 50%, rgba(10, 10, 15, 0.85) 100%)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-4 pt-20">
        {/* Toggle Pills */}
        <div className="mb-10">
          <HeroToggle />
        </div>

        {/* Heading */}
        <h1
          className="text-balance text-center text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl"
          style={{
            textShadow: "0 2px 24px rgba(0, 0, 0, 0.4)",
          }}
        >
          Search. Verify. Move in.
          <br />
          <span className="text-white/90">One platform, zero hassle.</span>
        </h1>

        {/* Subtitle */}
        <p
          className="mt-5 max-w-xl text-pretty text-center text-base leading-relaxed md:text-lg"
          style={{ color: "rgba(255, 255, 255, 0.7)" }}
        >
          Search properties, book viewings, complete referencing and sign
          contracts in one place. Free for tenants.
        </p>

        {/* Search Bar */}
        <div className="mt-10 w-full max-w-2xl">
          <div
            className="relative overflow-hidden rounded-2xl border border-white/[0.1]"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              boxShadow:
                "0 20px 50px rgba(0, 0, 0, 0.3), 0 8px 20px rgba(0, 0, 0, 0.15)",
            }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="AI-assisted property search..."
              className="w-full bg-transparent px-6 pt-5 pb-14 text-base text-gray-800 placeholder-gray-400 focus:outline-none"
            />

            {/* Bottom toolbar */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Camera search"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Voice search"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <div className="h-5 w-px bg-gray-200" />
                <span className="text-xs font-semibold tracking-wide text-gray-500">
                  proptii
                </span>
                <span className="rounded border border-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
                  OnTheMarket
                </span>
              </div>

              <button
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all hover:scale-105"
                style={{
                  background:
                    "linear-gradient(135deg, #E8713A 0%, #D4622F 100%)",
                  boxShadow: "0 4px 12px rgba(232, 113, 58, 0.3)",
                  color: "#FFFFFF",
                }}
                aria-label="Submit search"
              >
                <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Suggestion */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.45)" }}>
            Try asking:
          </p>
          <button
            className="rounded-full border px-4 py-2 text-sm transition-all hover:border-white/20 hover:bg-white/5"
            style={{
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "rgba(232, 113, 58, 0.85)",
            }}
          >
            2 bedroom flats to rent in Leeds for 1200pcm
          </button>
        </div>
      </div>
    </section>
  )
}
