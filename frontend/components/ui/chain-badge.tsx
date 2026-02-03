import { cn } from "@/lib/utils";

interface ChainBadgeProps {
  chain: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

// Chain configuration with colors and logos (both lowercase and capitalized for flexibility)
const chainConfig: Record<string, { color: string; logo: string; bgColor: string }> = {
  arbitrum: { color: "#28A0F0", logo: "◆", bgColor: "rgba(40, 160, 240, 0.9)" },
  Arbitrum: { color: "#28A0F0", logo: "◆", bgColor: "rgba(40, 160, 240, 0.9)" },
  base: { color: "#0052FF", logo: "◉", bgColor: "rgba(0, 82, 255, 0.9)" },
  Base: { color: "#0052FF", logo: "◉", bgColor: "rgba(0, 82, 255, 0.9)" },
  polygon: { color: "#8247E5", logo: "⬡", bgColor: "rgba(130, 71, 229, 0.9)" },
  Polygon: { color: "#8247E5", logo: "⬡", bgColor: "rgba(130, 71, 229, 0.9)" },
  ethereum: { color: "#627EEA", logo: "⟠", bgColor: "rgba(98, 126, 234, 0.9)" },
  Ethereum: { color: "#627EEA", logo: "⟠", bgColor: "rgba(98, 126, 234, 0.9)" },
  optimism: { color: "#FF0420", logo: "◎", bgColor: "rgba(255, 4, 32, 0.9)" },
  Optimism: { color: "#FF0420", logo: "◎", bgColor: "rgba(255, 4, 32, 0.9)" },
};

const sizeClasses = {
  sm: "h-5 w-5 text-[9px]",
  md: "h-6 w-6 text-[10px]",
  lg: "h-7 w-7 text-xs",
};

export function ChainBadge({ chain, className, size = "md" }: ChainBadgeProps) {
  const config = chainConfig[chain] || { color: "#666", logo: "●", bgColor: "rgba(102, 102, 102, 0.9)" };
  
  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full border border-background font-bold shadow-sm",
        sizeClasses[size],
        className
      )}
      style={{ 
        backgroundColor: config.bgColor,
        color: "white",
      }}
      title={chain}
    >
      {config.logo}
    </div>
  );
}
