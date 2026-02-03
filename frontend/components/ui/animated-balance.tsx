"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBalanceProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  size?: "sm" | "md" | "lg";
}

export function AnimatedBalance({ 
  value, 
  duration = 1500, 
  className,
  prefix = "$",
  size = "lg"
}: AnimatedBalanceProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);
  const previousValueRef = useRef(value);

  useEffect(() => {
    if (previousValueRef.current === value) return;
    
    const startValue = displayValue;
    const diff = value - startValue;
    
    setIsAnimating(true);
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // Sharp easing - quick start, controlled finish (infrastructure-grade)
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      const currentValue = startValue + diff * easeOutExpo;
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        previousValueRef.current = value;
      }
    };
    
    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // Initialize on mount
  useEffect(() => {
    setDisplayValue(value);
    previousValueRef.current = value;
  }, []);

  // Format with animated decimal places - each digit ticks independently
  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  };

  return (
    <div className={cn("font-mono relative", className)}>
      {/* Glow effect when animating */}
      <div 
        className={cn(
          "absolute inset-0 blur-xl transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        style={{
          background: `radial-gradient(ellipse at center, hsl(var(--primary) / 0.3) 0%, transparent 70%)`,
        }}
      />
      
      <span className={cn(sizeClasses[size], "font-bold text-primary text-glow-yellow relative z-10")}>
        {prefix}
      </span>
      <span 
        className={cn(
          sizeClasses[size], 
          "font-bold text-foreground tabular-nums relative z-10 transition-all duration-200",
          isAnimating && "text-glow-yellow"
        )}
      >
        {formattedValue.split('').map((char, i) => (
          <span 
            key={i} 
            className={cn(
              "inline-block transition-transform duration-75",
              isAnimating && char !== ',' && char !== '.' && "animate-tick"
            )}
          >
            {char}
          </span>
        ))}
      </span>
    </div>
  );
}
