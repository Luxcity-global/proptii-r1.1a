import React from "react";
import { cn } from "@/utils/cn";

export function ShineBorder({
  className,
  duration = 3,
  shineColor = "#000000",
  borderWidth = 2,
  style,
}: {
  className?: string;
  duration?: number;
  shineColor?: string | string[];
  borderWidth?: number;
  style?: React.CSSProperties;
}) {
  const colors = Array.isArray(shineColor) ? shineColor : [shineColor];
  
  // Create a visible conic gradient
  let gradientString: string;
  if (colors.length > 1) {
    // Distribute colors evenly around the circle
    const colorStops: string[] = [];
    colors.forEach((color, index) => {
      const percent = (index / colors.length) * 100;
      colorStops.push(`${color} ${percent}%`);
    });
    // Complete the circle
    colorStops.push(`${colors[0]} 100%`);
    gradientString = `conic-gradient(from 0deg, ${colorStops.join(", ")})`;
  } else {
    // Single color with shine effect
    gradientString = `conic-gradient(from 0deg, ${colors[0]} 0%, ${colors[0]} 40%, transparent 60%, ${colors[0]} 100%)`;
  }

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        className
      )}
      style={
        {
          background: gradientString,
          padding: `${borderWidth}px`,
          WebkitMask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          WebkitMaskComposite: "xor",
          mask: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          animation: `shine-border-rotate ${duration}s linear infinite`,
          ...style,
        } as React.CSSProperties
      }
    />
  );
}

