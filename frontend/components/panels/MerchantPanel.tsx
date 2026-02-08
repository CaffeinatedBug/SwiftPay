"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [isSettling, setIsSettling] = useState(false);

  // Use real balances from WebSocket state
  const pendingBalance = yellow.pendingTotal;
  const clearedBalance = yellow.settledTotal;

  // Track latest payment count to detect new payments
  const [lastPaymentCount, setLastPaymentCount] = useState(0);

  // Listen for real-time payment notifications
  useEffect(() => {
    const currentCount = yellow.pendingPayments.length + yellow.settledPayments.length;
    if (currentCount > lastPaymentCount && lastPaymentCount > 0) {
      // A new payment arrived
      const latestPayment = yellow.pendingPayments[yellow.pendingPayments.length - 1];
      if (latestPayment) {
        handlePaymentReceived({
          amount: latestPayment.amount,
          currency: latestPayment.currency || "USDC"
        });
      }
    }
    setLastPaymentCount(currentCount);
  }, [yellow.pendingPayments.length, yellow.settledPayments.length]);

  const handlePaymentReceived = (payment?: any) => {
    setPaymentStatus("success");
    setShowInlineQR(false);
    toast.success("Payment received!", {
      description: `$${payment?.amount || '25.00'} ${payment?.currency || 'USDC'} has been credited to your account.`,
    });
    setTimeout(() => setPaymentStatus("waiting"), 3000);
  };

  // Real settle handler - calls backend to move pending → settled
  const handleSettleNow = useCallback(async () => {
    if (parseFloat(pendingBalance) <= 0) {
      toast.info("No pending payments to settle");
      return;
    }

    setIsSettling(true);
    try {
      const result = await yellow.settleMerchantPayments();
      toast.success("Settlement complete!", {
        description: `$${result?.settledAmount || pendingBalance} settled to your Arc vault.`,
      });
    } catch (err: any) {
      toast.error("Settlement failed", {
        description: err.message || "Please try again",
      });
    } finally {
      setIsSettling(false);
    }
  }, [yellow, pendingBalance]);

  const handleSettlementComplete = () => {
    toast.success("Settlement complete", {
      description: "USDC has been credited to your Arc vault.",
    });
    setTimeout(() => setShowSettlement(false), 2000);
  };

  return (
    <div className="relative p-6" style={{ backgroundColor: 'rgba(31, 31, 31, 0.3)' }}>
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
          paymentsToday={yellow.pendingPayments.length + yellow.settledPayments.length}
          avgProcessingTime="<200ms"
          activeChannels={yellow.isConnected ? 1 : 0}
        />
      </div>

      {/* Settle Button - Instant settle, moves pending → cleared */}
      <div className="mb-6">
        <div className="relative cursor-pointer" onClick={handleSettleNow}>
          {/* Glow effect behind button */}
          <div className="absolute -inset-1 rounded-xl bg-yellow-400/20 blur-xl" />
          <Button
            size="lg"
            disabled={isSettling || parseFloat(pendingBalance) <= 0}
            className="relative w-full gap-3 bg-yellow-400 py-6 font-mono text-base font-bold text-black shadow-lg shadow-yellow-400/25 transition-all duration-300 hover:bg-yellow-300 hover:shadow-xl hover:shadow-yellow-400/30 glow-btn disabled:opacity-50"
          >
            {isSettling ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Settling...</span>
              </>
            ) : (
              <>
                <span>Settle Now</span>
                <span className="rounded-full bg-black/20 px-3 py-1">
                  ${pendingBalance} → Arc
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Active Pending Payments */}
      {yellow.pendingPayments.length > 0 && (
        <div className="mb-6">
          <Card className="border-yellow-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-mono text-sm text-yellow-400">
                <Clock className="h-4 w-4" />
                PENDING_CLEARING ({yellow.pendingPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {yellow.pendingPayments.map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span className="font-mono text-xs text-gray-400">
                        {p.userId ? `${p.userId.slice(0, 6)}...${p.userId.slice(-4)}` : 'Unknown'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-yellow-400">${p.amount}</span>
                      <span className="ml-1 text-xs text-gray-500">{p.currency || 'USDC'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recently Settled Payments */}
      {yellow.settledPayments.length > 0 && (
        <div className="mb-6">
          <Card className="border-green-400/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-mono text-sm text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                SETTLED ({yellow.settledPayments.length}) — ${clearedBalance}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {yellow.settledPayments.slice(-5).reverse().map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between rounded-lg border border-green-400/20 bg-green-400/5 p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-400" />
                      <span className="font-mono text-xs text-gray-400">
                        {p.userId ? `${p.userId.slice(0, 6)}...${p.userId.slice(-4)}` : 'Unknown'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-sm font-bold text-green-400">${p.amount}</span>
                      <span className="ml-1 text-xs text-gray-500">{p.currency || 'USDC'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced POS Terminal */}
      <div className="mb-6">
        <POSTerminal 
          onGenerateQR={() => setShowInlineQR(true)}
          onPaymentComplete={handlePaymentReceived}
          pendingPayments={yellow.pendingPayments}
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