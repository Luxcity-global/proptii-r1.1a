import { cn } from "@/utils/cn";

export function AnimatedGradientText({
  children,
  className,
  speed = 1,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
}: {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  colorFrom?: string;
  colorTo?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-block",
        className
      )}
    >
      <span
        className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r animate-gradient"
        style={{
          backgroundImage: `linear-gradient(90deg, ${colorFrom}, ${colorTo})`,
          animation: `gradient ${3 / speed}s ease infinite`,
          backgroundSize: "200% 200%",
        }}
      >
        {children}
      </span>
    </span>
  );
}

