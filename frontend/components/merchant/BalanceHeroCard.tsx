import { DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface BalanceHeroCardProps {
  clearedBalance: string;
  pendingBalance: string;
  percentChange?: string;
}

export function BalanceHeroCard({ 
  clearedBalance, 
  pendingBalance, 
  percentChange = "+12.5%" 
}: BalanceHeroCardProps) {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-secondary/80 via-background to-secondary/40">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="h-full w-full"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
          }}
        />
      </div>
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Total Cleared Balance
              </span>
            </div>
            
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-mono text-5xl font-bold tracking-tight text-foreground">
                ${clearedBalance}
              </span>
              <span className="font-mono text-lg text-muted-foreground">USDC</span>
            </div>
            
            <div className="mt-3 flex items-center gap-4">
              <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 ring-1 ring-success/20">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="font-mono text-xs font-medium text-success">
                  {percentChange}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">vs last 7 days</span>
            </div>
          </div>
          
          <div className="text-right">
            <div className="mb-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Pending
            </div>
            <div className="flex items-center gap-1">
              <span className="font-mono text-xl font-semibold text-primary">
                ${pendingBalance}
              </span>
              <ArrowUpRight className="h-4 w-4 text-primary animate-pulse" />
            </div>
            <span className="text-xs text-muted-foreground">awaiting settlement</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
