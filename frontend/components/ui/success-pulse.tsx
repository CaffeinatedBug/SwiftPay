"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface SuccessPulseProps {
  show: boolean;
  onComplete?: () => void;
  message?: string;
  submessage?: string;
  className?: string;
  duration?: number;
}

export function SuccessPulse({
  show,
  onComplete,
  message = "SUCCESS",
  submessage,
  className,
  duration = 2000,
}: SuccessPulseProps) {
  const [phase, setPhase] = useState<"idle" | "pulse" | "stable">("idle");

  useEffect(() => {
    if (show) {
      setPhase("pulse");
      
      // Transition to stable after initial pulse
      const stabilizeTimer = setTimeout(() => {
        setPhase("stable");
      }, 600);

      // Call onComplete after full duration
      const completeTimer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => {
        clearTimeout(stabilizeTimer);
        clearTimeout(completeTimer);
      };
    } else {
      setPhase("idle");
    }
  }, [show, duration, onComplete]);

  if (!show && phase === "idle") return null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 transition-all",
        className
      )}
    >
      {/* Icon with controlled pulse */}
      <div
        className={cn(
          "relative flex items-center justify-center",
          phase === "pulse" && "animate-success-pulse"
        )}
      >
        {/* Outer glow ring - pulses then stabilizes */}
        <div
          className={cn(
            "absolute inset-0 rounded-full transition-all duration-500",
            phase === "pulse"
              ? "scale-150 bg-success/30 blur-xl"
              : "scale-100 bg-success/10 blur-lg"
          )}
          style={{ width: "80px", height: "80px", margin: "-16px" }}
        />

        {/* Inner glow */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-success/20 transition-all duration-300",
            phase === "pulse" ? "scale-125" : "scale-100"
          )}
          style={{ width: "64px", height: "64px", margin: "-8px" }}
        />

        {/* Icon container */}
        <div
          className={cn(
            "relative flex h-16 w-16 items-center justify-center rounded-full bg-success/20 transition-all duration-300",
            phase === "pulse" && "bg-success/30"
          )}
        >
          <CheckCircle2
            className={cn(
              "h-10 w-10 text-success transition-all duration-300",
              phase === "pulse" && "scale-110 drop-shadow-[0_0_8px_hsl(var(--success))]"
            )}
          />
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <h3
          className={cn(
            "font-mono text-xl font-bold text-success transition-all duration-300",
            phase === "pulse" && "text-glow-green scale-105"
          )}
        >
          {message}
        </h3>
        {submessage && (
          <p className="mt-1 font-mono text-lg text-foreground">{submessage}</p>
        )}
      </div>
    </div>
  );
}
