"use client";

import { useState, useEffect } from "react";
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
import { useYellowNetwork } from "@/hooks/useYellowNetwork";
import { useReverseENS } from "@/hooks/useSwiftPayENS";
import { useAccount } from "wagmi";
import { toast } from "sonner";

type PaymentStatus = "waiting" | "success";

export function MerchantPanel() {
  const yellow = useYellowNetwork();
  const { address } = useAccount();
  const { ensName, loading: ensLoading } = useReverseENS(address || null, 'sepolia');
  const [showInlineQR, setShowInlineQR] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("waiting");
  const [showSettlement, setShowSettlement] = useState(false);

  // Calculate balances from Yellow Network cleared payments
  const pendingBalance = yellow.clearedPayments
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)
    .toFixed(2);
  const clearedBalance = yellow.clearedPayments.length > 0 ? "12,847.50" : "0.00";

  // Listen for real-time payment notifications
  useEffect(() => {
    if (yellow.clearedPayments.length > 0) {
      const latestPayment = yellow.clearedPayments[yellow.clearedPayments.length - 1];
      handlePaymentReceived({
        amount: latestPayment.amount,
        currency: "USDC"
      });
    }
  }, [yellow.clearedPayments.length]);

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
    <div className="flex h-full flex-col overflow-auto p-6" style={{ backgroundColor: 'rgba(31, 31, 31, 0.3)' }}>
      {/* Admin Button - Top Right */}
      <div className="mb-6 flex items-center justify-between">
        {/* Merchant ENS Identity */}
        {ensName && (
          <div className="glass flex items-center gap-2 rounded-lg border border-yellow-400/30 px-3 py-2">
            <span className="text-xs text-gray-400">Identity:</span>
            <span className="font-mono text-sm font-semibold text-yellow-400">{ensName}</span>
            <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs text-yellow-400">ENS Verified</span>
          </div>
        )}
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 rounded-full border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/10 text-white">
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-auto border-yellow-400/20" style={{ backgroundColor: '#1f1f1f' }}>
            <DialogHeader>
              <DialogTitle className="font-semibold text-white">Admin Panel</DialogTitle>
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
              <div className="absolute -inset-1 rounded-xl bg-yellow-400/20 blur-xl" />
              <Button
                size="lg"
                className="relative w-full gap-3 bg-yellow-400 py-6 font-mono text-base font-bold text-black shadow-lg shadow-yellow-400/25 transition-all duration-300 hover:bg-yellow-300 hover:shadow-xl hover:shadow-yellow-400/30 glow-btn"
              >
                <span>Settle Now</span>
                <span className="rounded-full bg-black/20 px-3 py-1">
                  ${pendingBalance} → Arc
                </span>
              </Button>
            </div>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto border-yellow-400/30 p-0" style={{ backgroundColor: '#1f1f1f' }}>
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