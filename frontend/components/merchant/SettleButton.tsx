import { ArrowDownToLine, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettleButtonProps {
  pendingAmount: string;
  onSettle?: () => void;
}

export function SettleButton({ pendingAmount, onSettle }: SettleButtonProps) {
  return (
    <div className="relative">
      {/* Glow effect behind button */}
      <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-xl" />
      
      <Button
        size="lg"
        onClick={onSettle}
        className="relative w-full gap-3 bg-primary py-6 font-mono text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-foreground/20">
            <ArrowDownToLine className="h-4 w-4" />
          </div>
          <span>Settle Now</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary-foreground/20 px-3 py-1">
          <Zap className="h-3 w-3" />
          <span>${pendingAmount} → Arc</span>
        </div>
      </Button>
    </div>
  );
}
