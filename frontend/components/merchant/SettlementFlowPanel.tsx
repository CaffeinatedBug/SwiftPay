"use client";

import { useState, useEffect } from "react";
import { 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Circle,
  Wallet,
  RefreshCw,
  ArrowRightLeft,
  Landmark,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChainBadge } from "@/components/ui/chain-badge";
import { cn } from "@/lib/utils";

type SettlementStatus = "idle" | "routing" | "swapping" | "bridging" | "finalized";

interface FlowStep {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "pending" | "active" | "complete";
}

interface SettlementFlowPanelProps {
  onComplete?: () => void;
  sourceChain?: string;
  sourceToken?: string;
  amount?: string;
}

export function SettlementFlowPanel({ 
  onComplete,
  sourceChain = "arbitrum",
  sourceToken = "ETH",
  amount = "2,450.00"
}: SettlementFlowPanelProps) {
  const [status, setStatus] = useState<SettlementStatus>("idle");
  const [currentStep, setCurrentStep] = useState(0);

  const steps: FlowStep[] = [
    { 
      id: "source", 
      label: "Source", 
      sublabel: `${sourceToken} on ${sourceChain}`,
      icon: Wallet,
      status: currentStep > 0 ? "complete" : currentStep === 0 && status !== "idle" ? "active" : "pending"
    },
    { 
      id: "swap", 
      label: "Swap", 
      sublabel: `${sourceToken} → USDC`,
      icon: RefreshCw,
      status: currentStep > 1 ? "complete" : currentStep === 1 ? "active" : "pending"
    },
    { 
      id: "bridge", 
      label: "Bridge", 
      sublabel: "LI.FI Protocol",
      icon: ArrowRightLeft,
      status: currentStep > 2 ? "complete" : currentStep === 2 ? "active" : "pending"
    },
    { 
      id: "destination", 
      label: "Arc Vault", 
      sublabel: "USDC Finalized",
      icon: Landmark,
      status: currentStep > 3 ? "complete" : currentStep === 3 ? "active" : "pending"
    },
  ];

  const startSettlement = () => {
    setStatus("routing");
    setCurrentStep(0);
    
    // Simulate settlement flow
    setTimeout(() => {
      setCurrentStep(1);
      setStatus("swapping");
    }, 1500);
    
    setTimeout(() => {
      setCurrentStep(2);
      setStatus("bridging");
    }, 3500);
    
    setTimeout(() => {
      setCurrentStep(3);
      setStatus("finalized");
    }, 6000);
    
    setTimeout(() => {
      setCurrentStep(4);
      onComplete?.();
    }, 7500);
  };

  const getStatusLabel = () => {
    switch (status) {
      case "routing": return "ROUTING LIQUIDITY";
      case "swapping": return "EXECUTING SWAP";
      case "bridging": return "BRIDGING CROSS-CHAIN";
      case "finalized": return "SETTLEMENT COMPLETE";
      default: return "READY TO SETTLE";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "finalized": return "text-success";
      case "idle": return "text-muted-foreground";
      default: return "text-primary";
    }
  };

  return (
    <Card className="border-border/50 bg-gradient-to-b from-secondary/40 to-background overflow-hidden">
      {/* Header with Status */}
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 font-mono text-sm">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              status === "finalized" ? "bg-success/20" : "bg-primary/20"
            )}>
              {status === "idle" ? (
                <Zap className="h-4 w-4 text-primary" />
              ) : status === "finalized" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              )}
            </div>
            <div>
              <div className={cn("font-mono text-xs uppercase tracking-wider", getStatusColor())}>
                {getStatusLabel()}
              </div>
              <div className="text-lg font-bold text-foreground">
                ${amount} USDC
              </div>
            </div>
          </CardTitle>
          
          {status === "idle" && (
            <Button onClick={startSettlement} className="gap-2 font-mono">
              <Zap className="h-4 w-4" />
              Execute Settlement
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Flow Diagram */}
        <div className="relative">
          {/* Background Grid */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="h-full w-full"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }}
            />
          </div>

          {/* Flow Steps */}
          <div className="relative flex items-center justify-between py-8">
            {steps.map((step, index) => (
              <div key={step.id} className="relative flex flex-1 items-center">
                {/* Step Node */}
                <div className="relative z-10 flex flex-col items-center">
                  {/* Node Circle */}
                  <div className={cn(
                    "relative flex h-16 w-16 items-center justify-center rounded-2xl border-2 transition-all duration-500",
                    step.status === "complete" 
                      ? "border-success bg-success/20 shadow-lg shadow-success/20" 
                      : step.status === "active"
                      ? "border-primary bg-primary/20 shadow-lg shadow-primary/30 animate-pulse"
                      : "border-border/50 bg-secondary/50"
                  )}>
                    {step.status === "complete" ? (
                      <CheckCircle2 className="h-7 w-7 text-success" />
                    ) : step.status === "active" ? (
                      <Loader2 className="h-7 w-7 text-primary animate-spin" />
                    ) : (
                      <step.icon className="h-7 w-7 text-muted-foreground" />
                    )}
                    
                    {/* Pulse ring for active */}
                    {step.status === "active" && (
                      <div className="absolute inset-0 rounded-2xl border-2 border-primary animate-ping opacity-30" />
                    )}
                  </div>
                  
                  {/* Chain Badge for source */}
                  {step.id === "source" && (
                    <div className="absolute -right-1 -top-1">
                      <ChainBadge chain={sourceChain} size="sm" />
                    </div>
                  )}
                  
                  {/* Arc badge for destination */}
                  {step.id === "destination" && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-success text-[9px] font-bold text-white">
                      A
                    </div>
                  )}

                  {/* Labels */}
                  <div className="mt-3 text-center">
                    <div className={cn(
                      "font-mono text-sm font-semibold transition-colors",
                      step.status === "complete" ? "text-success" 
                        : step.status === "active" ? "text-primary" 
                        : "text-foreground"
                    )}>
                      {step.label}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {step.sublabel}
                    </div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {index < steps.length - 1 && (
                  <div className="relative mx-2 flex-1">
                    {/* Base Line */}
                    <div className="h-0.5 w-full bg-border/50" />
                    
                    {/* Animated Flow Line */}
                    <div 
                      className={cn(
                        "absolute left-0 top-0 h-0.5 transition-all duration-1000",
                        step.status === "complete" 
                          ? "w-full bg-success" 
                          : step.status === "active"
                          ? "w-1/2 bg-gradient-to-r from-primary to-transparent"
                          : "w-0"
                      )}
                    />
                    
                    {/* Flow Particles */}
                    {step.status === "active" && (
                      <>
                        <div className="flow-particle" style={{ animationDelay: "0s" }} />
                        <div className="flow-particle" style={{ animationDelay: "0.3s" }} />
                        <div className="flow-particle" style={{ animationDelay: "0.6s" }} />
                      </>
                    )}
                    
                    {/* Arrow Head */}
                    <ArrowRight className={cn(
                      "absolute -right-1 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors",
                      step.status === "complete" ? "text-success" 
                        : step.status === "active" ? "text-primary"
                        : "text-muted-foreground/50"
                    )} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Details */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg border border-border/50 bg-secondary/30 p-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Route
            </div>
            <div className="mt-1 font-mono text-sm font-medium text-foreground">
              LI.FI Optimal
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Est. Time
            </div>
            <div className="mt-1 font-mono text-sm font-medium text-foreground">
              ~45 seconds
            </div>
          </div>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Network Fee
            </div>
            <div className="mt-1 font-mono text-sm font-medium text-foreground">
              $2.45
            </div>
          </div>
        </div>

        {/* Live Log Feed */}
        {status !== "idle" && (
          <div className="mt-4 rounded-lg border border-border/50 bg-black/50 p-3 font-mono text-xs">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              LIVE EXECUTION LOG
            </div>
            <div className="space-y-1 text-muted-foreground">
              <div className="flex gap-2">
                <span className="text-primary">[{new Date().toLocaleTimeString()}]</span>
                <span>Initiating settlement for ${amount}...</span>
              </div>
              {(currentStep >= 1) && (
                <div className="flex gap-2">
                  <span className="text-primary">[{new Date().toLocaleTimeString()}]</span>
                  <span>Quote received: {sourceToken} → USDC via Uniswap V3</span>
                </div>
              )}
              {(currentStep >= 2) && (
                <div className="flex gap-2">
                  <span className="text-primary">[{new Date().toLocaleTimeString()}]</span>
                  <span>Bridge initiated: {sourceChain} → Arc (Stargate)</span>
                </div>
              )}
              {(currentStep >= 3) && (
                <div className="flex gap-2 text-success">
                  <span>[{new Date().toLocaleTimeString()}]</span>
                  <span>✓ Settlement finalized. USDC credited to vault.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
