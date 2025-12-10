import React from "react";
import { cn } from "@/utils/cn";

export function BorderBeam({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}: {
  className?: string;
  size?: number;
  duration?: number;
  anchor?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}) {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--anchor": anchor,
          "--border-width": borderWidth,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        // mask styles
        "[background:linear-gradient(transparent,transparent),conic-gradient(from_calc((var(--anchor)*1deg)-45deg),transparent,transparent,var(--color-from)),linear-gradient(transparent,transparent)] [background-clip:padding-box,border-box,border-box] [background-origin:border-box]",
        // border gradient
        "[border-image:conic-gradient(from_calc((var(--anchor)*1deg)-180deg),transparent,var(--color-from),var(--color-to),var(--color-from),transparent,transparent)_1]",
        // animation
        "animate-border-beam",
        className
      )}
    />
  );
}

