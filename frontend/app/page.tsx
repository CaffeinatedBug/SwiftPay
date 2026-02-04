import { UserPanel } from "@/components/panels/UserPanel";
import { MerchantPanel } from "@/components/panels/MerchantPanel";

export default function Home() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Side - USER APP (50%) */}
      <div className="flex w-1/2 flex-col border-r border-border overflow-hidden">
        <div className="shrink-0 border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                User Application
              </h2>
              <h1 className="text-xl font-bold text-foreground">
                SwiftPay Wallet
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pay from any chain, instantly
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto">
          <UserPanel />
        </div>
      </div>

      {/* Right Side - MERCHANT DASHBOARD (50%) */}
      <div className="flex w-1/2 flex-col">
        <div className="border-b border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Merchant Dashboard
              </h2>
              <h1 className="text-xl font-bold text-foreground">
                Payment Operations
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time clearing • Settle to Arc
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <MerchantPanel />
        </div>
      </div>
    </div>
  );
}
