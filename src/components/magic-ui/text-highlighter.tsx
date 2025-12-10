import React from "react";
import { cn } from "@/utils/cn";

interface TextHighlighterProps {
  children: React.ReactNode;
  className?: string;
  underlineColor?: string;
  underlineWidth?: string;
}

export function TextHighlighter({
  children,
  className,
  underlineColor = "#FEDFA0",
  underlineWidth = "3px",
}: TextHighlighterProps) {
  return (
    <span
      className={cn("relative inline-block", className)}
      style={
        {
          "--underline-color": underlineColor,
          "--underline-width": underlineWidth,
        } as React.CSSProperties
      }
    >
      <span className="relative z-10">{children}</span>
      <svg
        className="absolute bottom-0 left-0 w-full h-4 overflow-visible animate-underline"
        style={{
          transformOrigin: "left",
        }}
        viewBox="0 0 100 12"
        preserveAspectRatio="none"
      >
        <path
          d="M 0,8 Q 8,4 18,7 Q 25,9 35,5 Q 45,8 55,6 Q 65,9 75,4 Q 85,7 100,6"
          stroke={underlineColor}
          strokeWidth={underlineWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: "1000",
            strokeDashoffset: "1000",
            animation: "draw-underline 0.8s ease-out forwards",
          }}
        />
        <path
          d="M 0,10 Q 15,6 28,10 Q 38,7 50,9 Q 58,5 70,8 Q 78,6 88,10 Q 95,7 100,8"
          stroke={underlineColor}
          strokeWidth={underlineWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{
            strokeDasharray: "1000",
            strokeDashoffset: "1000",
            animation: "draw-underline 0.8s ease-out 0.1s forwards",
          }}
        />
      </svg>
    </span>
  );
}

