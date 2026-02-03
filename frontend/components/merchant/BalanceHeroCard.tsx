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
      {/* Enhanced grid pattern overlay */}
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
        <div className="grid gap-6 md:grid-cols-2">
          {/* Cleared Balance Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 ring-1 ring-success/30">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Cleared Balance
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl font-bold tracking-tight text-success">
                ${clearedBalance}
              </span>
              <span className="font-mono text-lg text-muted-foreground">USDC</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 ring-1 ring-success/20">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="font-mono text-xs font-medium text-success">
                  {percentChange}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">vs last 7 days</span>
            </div>
            
            <div className="text-xs text-success/80">
              ✓ Ready for settlement to Arc
            </div>
          </div>
          
          {/* Vertical Separator */}
          <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-border to-transparent" />
          
          {/* Pending Balance Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10 ring-1 ring-yellow-500/30">
                <ArrowUpRight className="h-4 w-4 text-yellow-600 animate-pulse" />
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Pending Clearing
              </span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-4xl font-bold tracking-tight text-yellow-600">
                ${pendingBalance}
              </span>
              <span className="font-mono text-lg text-muted-foreground">USDC</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-1 ring-1 ring-yellow-500/20">
                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="font-mono text-xs font-medium text-yellow-600">
                  In Progress
                </span>
              </div>
            </div>
            
            <div className="text-xs text-yellow-600/80">
              ⏳ Processing via Yellow Network
            </div>
          </div>
        </div>
        
        {/* Bottom Summary */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Total Outstanding: ${(parseFloat(clearedBalance.replace(/,/g, '')) + parseFloat(pendingBalance.replace(/,/g, ''))).toLocaleString()}</span>
            <span>Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
