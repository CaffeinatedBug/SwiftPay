"use client";

import { useState, useEffect } from "react";
import { Shield, Zap, Check, Loader2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChainBadge } from "@/components/ui/chain-badge";
import { cn } from "@/lib/utils";

interface PaymentDetails {
  merchantAddress: string;
  merchantName?: string;
  amount: number;
  currency: string;
  token: {
    symbol: string;
    name: string;
    chain: string;
    icon: string;
    balance: number;
  };
}

interface PaymentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentDetails | null;
  onConfirm: () => void;
}

// Chain colors
const chainColors: Record<string, string> = {
  Arbitrum: "#28A0F0",
  Base: "#0052FF",
  Polygon: "#8247E5",
  Ethereum: "#627EEA",
  Optimism: "#FF0420",
};

type PaymentState = "confirming" | "signing" | "processing" | "success";

export function PaymentConfirmationModal({ 
  open, 
  onOpenChange, 
  payment,
  onConfirm 
}: PaymentConfirmationModalProps) {
  const [state, setState] = useState<PaymentState>("confirming");
  const [countdown, setCountdown] = useState(3);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setState("confirming");
      setCountdown(3);
    }
  }, [open]);

  // Countdown after success
  useEffect(() => {
    if (state === "success" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (state === "success" && countdown === 0) {
      onOpenChange(false);
      onConfirm();
    }
  }, [state, countdown, onOpenChange, onConfirm]);

  const handlePay = async () => {
    setState("signing");
    // Simulate MetaMask signing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setState("processing");
    // Simulate Yellow Network clearing
    await new Promise(resolve => setTimeout(resolve, 800));
    setState("success");
  };

  if (!payment) return null;

  const shortenAddress = (addr: string) => 
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-0 bg-transparent p-0 shadow-none sm:max-w-md">
        <div className="relative rounded-xl border border-border/50 bg-[#0a0a0a] overflow-hidden">
          {/* Animated Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Scanning lines */}
            <div className="scan-line-vertical" />
            <div className="scan-line-horizontal" />
            
            {/* Corner accents */}
            <div className="absolute top-0 left-0 h-16 w-16 border-l-2 border-t-2 border-primary/30" />
            <div className="absolute top-0 right-0 h-16 w-16 border-r-2 border-t-2 border-primary/30" />
            <div className="absolute bottom-0 left-0 h-16 w-16 border-l-2 border-b-2 border-primary/30" />
            <div className="absolute bottom-0 right-0 h-16 w-16 border-r-2 border-b-2 border-primary/30" />
            
            {/* Subtle grid */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }} />
          </div>

          {/* Content */}
          <div className="relative z-10 p-6">
            {state === "success" ? (
              /* Success State */
              <div className="flex flex-col items-center py-8">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success/20 shadow-[0_0_40px_10px_rgba(34,197,94,0.3)]">
                  <Check className="h-12 w-12 text-success" />
                </div>
                <h2 className="mb-2 font-mono text-2xl font-bold text-success text-glow-green">
                  PAYMENT CLEARED
                </h2>
                <p className="mb-4 text-center font-mono text-3xl font-bold text-foreground">
                  ${payment.amount.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Verified via Yellow Network in &lt;200ms
                </p>
                <p className="mt-4 font-mono text-xs text-muted-foreground">
                  Closing in {countdown}...
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-6 text-center">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                    <Zap className="h-3 w-3 text-primary" />
                    <span className="font-mono text-xs uppercase tracking-wider text-primary">
                      Instant Payment
                    </span>
                  </div>
                  <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    Confirm Transaction
                  </h2>
                </div>

                {/* Payment Details Card */}
                <div className="mb-6 rounded-lg border border-border/30 bg-[#0c0c0c] p-4">
                  {/* Merchant */}
                  <div className="mb-4 flex items-center justify-between border-b border-border/20 pb-4">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      To
                    </span>
                    <div className="text-right">
                      {payment.merchantName && (
                        <p className="font-mono text-sm font-medium text-foreground">
                          {payment.merchantName}
                        </p>
                      )}
                      <p className="font-mono text-xs text-muted-foreground">
                        {shortenAddress(payment.merchantAddress)}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mb-4 flex flex-col items-center border-b border-border/20 pb-4">
                    <span className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                      Amount
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-4xl font-bold text-primary text-glow-yellow">
                        ${payment.amount.toFixed(2)}
                      </span>
                      <span className="font-mono text-lg text-muted-foreground">
                        {payment.currency}
                      </span>
                    </div>
                  </div>

                  {/* Token & Chain */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      Paying With
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-xl">
                          {payment.token.icon}
                        </div>
                        <ChainBadge chain={payment.token.chain} className="absolute -bottom-1 -right-1" />
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-semibold">
                          {payment.token.symbol}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ color: chainColors[payment.token.chain] }}
                        >
                          on {payment.token.chain}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="mb-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 text-success" />
                  <span>Secured by Yellow Network State Channels</span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handlePay}
                    disabled={state !== "confirming"}
                    className={cn(
                      "relative w-full py-6 font-mono text-lg font-bold transition-all",
                      state === "confirming" 
                        ? "glow-yellow-intense hover:scale-[1.02]" 
                        : "opacity-90"
                    )}
                  >
                    {state === "confirming" && (
                      <>
                        <Zap className="mr-2 h-5 w-5" />
                        Authorize Payment
                      </>
                    )}
                    {state === "signing" && (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Waiting for Signature...
                      </>
                    )}
                    {state === "processing" && (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Clearing via Yellow...
                      </>
                    )}
                    
                    {/* Animated border */}
                    {state === "confirming" && (
                      <span className="absolute inset-0 rounded-md animate-pulse-border" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={state !== "confirming"}
                    className="w-full font-mono text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </Button>
                </div>

                {/* Footer Note */}
                <p className="mt-4 text-center font-mono text-xs text-muted-foreground/50">
                  No gas fees • Instant clearing • Sign message only
                </p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
