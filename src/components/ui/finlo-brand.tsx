import { cn } from "@/lib/utils";

interface VestaBrandProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
  inline?: boolean;
}

const sizeMap = {
  sm: { icon: 28, wordmark: "text-lg", sub: "text-[8px]" },
  md: { icon: 36, wordmark: "text-2xl", sub: "text-[9px]" },
  lg: { icon: 44, wordmark: "text-3xl", sub: "text-[10px]" },
  xl: { icon: 56, wordmark: "text-4xl", sub: "text-xs" },
};

export const VestaBrand = ({
  className,
  size = "md",
  variant = "light",
  inline = false,
}: VestaBrandProps) => {
  const Component = inline ? "span" : "div";
  const { icon, wordmark, sub } = sizeMap[size];
  const isDark = variant === "dark";

  return (
    <Component className={cn("flex items-center gap-3", className)}>
      {/* Icon mark */}
      <div
        className="flex items-center justify-center rounded-[10px] shrink-0"
        style={{
          width: icon,
          height: icon,
          background: isDark ? "#C8963E" : "#1B3A5C",
        }}
      >
        <svg
          width={icon * 0.55}
          height={icon * 0.55}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            stroke={isDark ? "#1B3A5C" : "#C8963E"}
            strokeWidth="1.5"
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d="M9 22V12h6v10"
            stroke={isDark ? "#1B3A5C" : "#C8963E"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 7.5l1 1 2-2"
            stroke={isDark ? "#1B3A5C" : "#C8963E"}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <span
          className={cn("font-display font-bold leading-none tracking-tight", wordmark)}
          style={{ color: isDark ? "#FFFFFF" : "#1B3A5C" }}
        >
          Vest<span style={{ color: "#C8963E" }}>a</span>
        </span>
        <span
          className={cn("font-mono tracking-widest uppercase", sub)}
          style={{ color: isDark ? "rgba(255,255,255,0.4)" : "#6B6B6B" }}
        >
          Financial Intelligence
        </span>
      </div>
    </Component>
  );
};

// Legacy export alias for old imports
export { VestaBrand as FinloBrand };
