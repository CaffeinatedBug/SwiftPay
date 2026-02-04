"use client";

import { useState } from "react";
import { QrCode, CheckCircle2, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminPanel } from "./AdminPanel";
import { BalanceHeroCard } from "@/components/merchant/BalanceHeroCard";
import { PaymentsTable } from "@/components/merchant/PaymentsTable";
import { SettlementFlowPanel } from "@/components/merchant/SettlementFlowPanel";
import { QuickStats } from "@/components/merchant/QuickStats";
import { InlineQRDisplay } from "@/components/merchant/InlineQRDisplay";
import { POSTerminal } from "@/components/merchant/POSTerminal";
import { ChannelHealthMonitor } from "@/components/merchant/ChannelHealthMonitor";
import { toast } from "sonner";

type PaymentStatus = "waiting" | "success";

export function MerchantPanel() {
  const [showInlineQR, setShowInlineQR] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("waiting");
  const [showSettlement, setShowSettlement] = useState(false);
  const [pendingBalance] = useState("2,450.00");
  const [clearedBalance] = useState("12,847.50");

  const handlePaymentReceived = (payment?: any) => {
    setPaymentStatus("success");
    setShowInlineQR(false);
    toast.success("Payment received!", {
      description: `$${payment?.amount || '25.00'} ${payment?.currency || 'USDC'} has been credited to your account.`,
    });
    setTimeout(() => setPaymentStatus("waiting"), 3000);
  };

  const handleSettlementComplete = () => {
    toast.success("Settlement complete", {
      description: "USDC has been credited to your Arc vault.",
    });
    setTimeout(() => setShowSettlement(false), 2000);
  };

  return (
    <div className="flex h-full flex-col overflow-auto p-6">
      {/* Admin Button - Top Right */}
      <div className="mb-6 flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full border-gray-300 hover:border-gray-400 hover:bg-gray-50">
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto bg-white">
            <DialogHeader>
              <DialogTitle className="font-semibold">Admin Panel</DialogTitle>
            </DialogHeader>
            <AdminPanel embedded />
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Hero */}
      <div className="mb-6">
        <BalanceHeroCard 
          clearedBalance={clearedBalance} 
          pendingBalance={pendingBalance} 
        />
      </div>

      {/* Quick Stats */}
      <div className="mb-6">
        <QuickStats 
          paymentsToday={47}
          avgProcessingTime="1.2s"
          activeChannels={3}
        />
      </div>

      {/* Settle Button - Opens Settlement Flow */}
      <div className="mb-6">
        <Dialog open={showSettlement} onOpenChange={setShowSettlement}>
          <DialogTrigger asChild>
            <div className="relative cursor-pointer">
              {/* Glow effect behind button */}
              <div className="absolute -inset-1 rounded-xl bg-primary/20 blur-xl" />
              <Button
                size="lg"
                className="relative w-full gap-3 bg-primary py-6 font-mono text-base font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                <span>Settle Now</span>
                <span className="rounded-full bg-primary-foreground/20 px-3 py-1">
                  ${pendingBalance} → Arc
                </span>
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto border-primary/30 bg-background p-0">
            <SettlementFlowPanel 
              amount={pendingBalance}
              sourceChain="arbitrum"
              sourceToken="Mixed"
              onComplete={handleSettlementComplete}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced POS Terminal */}
      <div className="mb-6">
        <POSTerminal 
          onGenerateQR={() => setShowInlineQR(true)}
          onPaymentComplete={handlePaymentReceived}
        />
      </div>

      {/* Inline QR Display */}
      {showInlineQR && (
        <div className="mb-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <InlineQRDisplay 
            onClose={() => setShowInlineQR(false)}
            onPaymentReceived={handlePaymentReceived}
          />
        </div>
      )}

      {/* Channel Health Monitor */}
      <div className="mb-6">
        <ChannelHealthMonitor />
      </div>

      {/* Payments Table */}
      <div className="flex-1">
        <PaymentsTable />
      </div>
    </div>
  );
}