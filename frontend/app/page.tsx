"use client";

import { UserPanel } from "@/components/panels/UserPanel";
import { MerchantPanel } from "@/components/panels/MerchantPanel";
import { GlowCursor } from "@/components/ui/GlowCursor";

export default function Home() {
  return (
    <div className="gooey-cursor flex h-screen w-full overflow-hidden cyber-grid-animated" style={{ backgroundColor: '#1f1f1f' }}>
      <GlowCursor />
      
      {/* Left Side - USER APP (50%) */}
      <div className="flex w-1/2 flex-col border-r border-yellow-400/20">
        <div className="glass-panel border-b border-yellow-400/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-yellow-400/60 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full pulse-dot"></span>
                User Application
              </h2>
              <h1 className="text-xl font-bold text-gradient-yellow">
                SwiftPay Wallet
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Pay from any chain, instantly
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin bg-black/50">
          <UserPanel />
        </div>
      </div>

      {/* Right Side - MERCHANT DASHBOARD (50%) */}
      <div className="flex w-1/2 flex-col">
        <div className="glass-panel border-b border-yellow-400/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono uppercase tracking-wider text-yellow-400/60 mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full pulse-dot"></span>
                Merchant Dashboard
              </h2>
              <h1 className="text-xl font-bold text-gradient-yellow">
                Payment Operations
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time clearing • Settle to Arc
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin bg-black/50">
          <MerchantPanel />
        </div>
      </div>
    </div>
  );
}
