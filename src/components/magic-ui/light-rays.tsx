"use client"

import React from "react"
import { cn } from "@/utils/cn"

interface LightRaysProps {
  className?: string
  numRays?: number
  color?: string
  opacity?: number
}

export function LightRays({
  className,
  numRays = 8,
  color = "#ffffff",
  opacity = 0.1,
}: LightRaysProps) {
  const rays = Array.from({ length: numRays }, (_, i) => {
    const angle = (360 / numRays) * i
    const delay = i * 0.1
    return { angle, delay }
  })

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {rays.map((ray, i) => (
        <div
          key={i}
          className="absolute inset-0 origin-center"
          style={{
            "--angle": `${ray.angle}deg`,
            transform: `rotate(${ray.angle}deg)`,
            animation: `light-ray-rotate 20s linear infinite`,
            animationDelay: `${ray.delay}s`,
          } as React.CSSProperties}
        >
          <div
            className="absolute top-1/2 left-1/2 h-full w-1 -translate-x-1/2 -translate-y-1/2"
            style={{
              background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
              opacity: opacity,
            }}
          />
        </div>
      ))}
    </div>
  )
}

