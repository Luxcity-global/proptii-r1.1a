import { cn } from "@/utils/cn";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoCard = ({
  className,
  name,
  description,
  href,
  cta,
  icon: Icon,
  background,
  rowSpan,
  columnSpan,
  onClick,
}: {
  className?: string;
  name?: string;
  description?: string;
  href?: string;
  cta?: string;
  icon?: React.ElementType;
  background?: React.ReactNode;
  rowSpan?: number;
  columnSpan?: number;
  onClick?: () => void;
}) => {
  const isGradient = className?.includes('bg-gradient');
  const isDark = className?.includes('text-white');

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative col-span-1 row-span-1 flex flex-col justify-between overflow-hidden rounded-xl border border-transparent bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.05),0_2px_4px_rgba(0,0,0,.1)] dark:border-white/[0.2] dark:bg-black",
        "transform-gpu dark:[border-color:rgba(255,255,255,.1)] [background-color:rgb(255,255,255)] dark:[background-color:rgb(0,0,0)]",
        "transition-all duration-300 ease-in-out",
        "hover:shadow-xl hover:[box-shadow:0_0_0_1px_rgba(0,0,0,.06),0_8px_16px_rgba(0,0,0,.15)]",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        gridRow: rowSpan ? `span ${rowSpan} / span ${rowSpan}` : undefined,
        gridColumn: columnSpan ? `span ${columnSpan} / span ${columnSpan}` : undefined,
      }}
    >
      {background}
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-1">
        {Icon && (
          <div className={cn(
            "flex size-12 origin-left transform-gpu items-center justify-center overflow-hidden rounded-lg transition-all duration-300 group-hover:scale-110",
            isGradient || isDark 
              ? "bg-white/20 text-white" 
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          )}>
            <Icon />
          </div>
        )}
        {name && (
          <h3 className={cn(
            "text-xl font-semibold",
            isGradient || isDark ? "text-white" : "text-neutral-700 dark:text-neutral-300"
          )}>
            {name}
          </h3>
        )}
        {description && (
          <div className={cn(
            "max-w-lg",
            isGradient || isDark ? "text-white/90" : "text-neutral-600 dark:text-neutral-400"
          )}>
            {description}
          </div>
        )}
        {href && cta && (
          <div className="mt-4 flex items-center gap-2">
            <a
              href={href}
              className="pointer-events-auto z-10 flex items-center gap-2 text-sm font-medium text-neutral-700 transition-all duration-300 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-neutral-100"
            >
              {cta}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path
                  d="M5.75 3.5l4.5 4.5-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>
        )}
        {onClick && cta && (
          <div className="mt-4 flex items-center gap-2">
            <div
              className={cn(
                "pointer-events-auto z-10 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-all duration-300",
                isGradient || isDark
                  ? "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                  : "bg-[#E76F51] text-white hover:bg-opacity-90"
              )}
            >
              {cta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
