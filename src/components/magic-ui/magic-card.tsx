import React, { useRef, useState } from "react";
import { cn } from "@/utils/cn";

export function MagicCard({
  children,
  className,
  gradientColor = "rgba(120, 119, 198, 0.3)",
  gradientSize = 200,
}: {
  children: React.ReactNode;
  className?: string;
  gradientColor?: string;
  gradientSize?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });
  };

  return (
    <div
      ref={cardRef}
      className={cn("relative group/card", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {isHovering && (
        <div
          className="absolute inset-0 rounded-3xl opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(${gradientSize}px circle at ${mousePosition.x}px ${mousePosition.y}px, ${gradientColor}, transparent 40%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

