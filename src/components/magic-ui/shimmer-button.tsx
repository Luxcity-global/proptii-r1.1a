import React from "react";
import { cn } from "@/utils/cn";

export function ShimmerButton({
  children,
  className,
  shimmerColor = "#ffffff",
  shimmerSize = "0.05em",
  borderRadius = "100px",
  shimmerDuration = "3s",
  background = "rgba(0, 0, 0, 1)",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "relative z-10 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]",
        className
      )}
      style={
        {
          borderRadius,
          background,
        } as React.CSSProperties
      }
      {...props}
    >
      <div
        className="absolute inset-0 -z-10 translate-x-[150%] rounded-[inherit] opacity-60 animate-shimmer"
        style={
          {
            background: `linear-gradient(110deg, transparent, ${shimmerColor}40, ${shimmerColor}60, ${shimmerColor}40, transparent)`,
            backgroundSize: "200% 100%",
            animationDuration: shimmerDuration,
          } as React.CSSProperties
        }
      />
      {children}
    </button>
  );
}

