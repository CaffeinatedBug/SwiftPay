"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Copy, Check, X } from "lucide-react";
import { ChainBadge } from "@/components/ui/chain-badge";

interface QRPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  currency?: string;
  chain?: string;
  onPaymentReceived?: () => void;
}

export function QRPaymentModal({
  open,
  onOpenChange,
  amount,
  currency = "USDC",
  chain = "arbitrum",
  onPaymentReceived,
}: QRPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrSeed] = useState(() => Math.random());

  // Generate deterministic QR pattern based on seed
  const generateQRPattern = () => {
    const size = 21;
    const pattern: boolean[][] = [];
    const random = (x: number, y: number) => {
      const n = Math.sin(qrSeed * 9999 + x * 127 + y * 311) * 43758.5453;
      return n - Math.floor(n);
    };

    for (let y = 0; y < size; y++) {
      pattern[y] = [];
      for (let x = 0; x < size; x++) {
        // Position detection patterns (corners)
        const isTopLeft = x < 7 && y < 7;
        const isTopRight = x >= size - 7 && y < 7;
        const isBottomLeft = x < 7 && y >= size - 7;
        
        if (isTopLeft || isTopRight || isBottomLeft) {
          // Finder patterns
          const localX = isTopRight ? x - (size - 7) : x;
          const localY = isBottomLeft ? y - (size - 7) : y;
          const isOuter = localX === 0 || localX === 6 || localY === 0 || localY === 6;
          const isInner = localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4;
          pattern[y][x] = isOuter || isInner;
        } else {
          pattern[y][x] = random(x, y) > 0.5;
        }
      }
    }
    return pattern;
  };

  const qrPattern = generateQRPattern();

  const handleCopyAddress = () => {
    navigator.clipboard.writeText("0x742d...8f3E");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none">
        {/* Outer glow container */}
        <div className="relative">
          {/* Ambient glow effects */}
          <div className="absolute -inset-4 rounded-3xl bg-primary/20 blur-2xl" />
          <div className="absolute -inset-2 rounded-2xl bg-primary/10 blur-xl" />
          
          {/* Main modal */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl">
            {/* Scan lines overlay */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="scan-line-horizontal" style={{ animationDelay: "0s" }} />
              <div className="scan-line-horizontal" style={{ animationDelay: "1.5s", opacity: 0.5 }} />
            </div>
            
            {/* Corner accents */}
            <div className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-primary" />
            <div className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-primary" />
            <div className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-primary" />
            <div className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-primary" />

            {/* Close button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-secondary/80 p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6">
              {/* Header */}
              <DialogHeader className="mb-6">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Shield className="h-4 w-4" />
                  <span className="font-mono text-xs uppercase tracking-widest">
                    Secure Payment Request
                  </span>
                  <Shield className="h-4 w-4" />
                </div>
                <DialogTitle className="sr-only">Payment QR Code</DialogTitle>
              </DialogHeader>

              {/* QR Code Container */}
              <div className="relative mx-auto mb-6 w-fit">
                {/* QR glow effect */}
                <div className="absolute -inset-3 rounded-xl bg-primary/20 blur-lg" />
                
                {/* QR frame */}
                <div className="relative rounded-xl border-2 border-primary/50 bg-white p-4 shadow-lg shadow-primary/20">
                  {/* Animated corner scanners */}
                  <div className="absolute -left-1 -top-1 h-4 w-4 animate-pulse border-l-2 border-t-2 border-primary" />
                  <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse border-r-2 border-t-2 border-primary" style={{ animationDelay: "0.25s" }} />
                  <div className="absolute -bottom-1 -left-1 h-4 w-4 animate-pulse border-b-2 border-l-2 border-primary" style={{ animationDelay: "0.5s" }} />
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 animate-pulse border-b-2 border-r-2 border-primary" style={{ animationDelay: "0.75s" }} />
                  
                  {/* QR Code */}
                  <div className="relative">
                    <div 
                      className="grid gap-0"
                      style={{ 
                        gridTemplateColumns: `repeat(21, 1fr)`,
                        width: "180px",
                        height: "180px"
                      }}
                    >
                      {qrPattern.flat().map((filled, i) => (
                        <div
                          key={i}
                          className={`aspect-square ${
                            filled ? "bg-black" : "bg-white"
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Center logo overlay */}
                    <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-lg bg-primary shadow-lg">
                      <Zap className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount display */}
              <div className="mb-4 text-center">
                <div className="mb-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Amount Due
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-4xl font-bold text-foreground">
                    ${amount}
                  </span>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-mono text-lg font-semibold text-primary">
                      {currency}
                    </span>
                    <ChainBadge chain={chain} size="sm" />
                  </div>
                </div>
              </div>

              {/* Wallet address */}
              <div className="mb-6">
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-4 py-3">
                  <div>
                    <div className="font-mono text-xs text-muted-foreground">
                      Merchant Address
                    </div>
                    <div className="font-mono text-sm text-foreground">
                      0x742d...8f3E
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span className="text-xs">Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Status indicator */}
              <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
                <div className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-primary">
                  Awaiting Payment
                </span>
              </div>

              {/* Security badge */}
              <div className="mt-4 flex items-center justify-center gap-1.5 text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span className="text-xs">End-to-end encrypted • Gasless for customer</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
