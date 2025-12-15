import React from "react";
import { cn } from "@/utils/cn";

export function AnimatedGridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  repeatDelay = 0,
}: {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: number;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}) {
  const id = React.useId();
  const patternId = `${id}-grid-pattern`;
  const squares = Array.from({ length: numSquares }, (_, i) => i);

  return (
    <svg
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-gray-400/30 stroke-gray-400/30",
        className
      )}
    >
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path
            d={`M.5 ${height}V.5H${width}`}
            fill="none"
            strokeDasharray={strokeDasharray}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <svg x={x} y={y} className="overflow-visible">
        {squares.map((_, i) => (
          <rect
            key={`${i}-${i}`}
            width={width - 1}
            height={height - 1}
            x={i % Math.floor(Math.sqrt(numSquares))}
            y={Math.floor(i / Math.floor(Math.sqrt(numSquares)))}
            fill="currentColor"
            strokeWidth="0"
            className="animate-grid-pattern"
            style={{
              animationDelay: `${i * 0.05}s`,
              animationDuration: `${duration}s`,
            }}
          />
        ))}
      </svg>
    </svg>
  );
}






