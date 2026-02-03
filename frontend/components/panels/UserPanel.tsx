"use client";

import { useState, useEffect } from "react";
import { Wallet, QrCode, ArrowUpRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBalance } from "@/components/ui/animated-balance";
import { ChainBadge } from "@/components/ui/chain-badge";
import { TokenSelectorModal, TokenAsset } from "@/components/ui/token-selector-modal";
import { PaymentConfirmationModal } from "@/components/ui/payment-confirmation-modal";
import { useToast } from "@/hooks/use-toast";

// Chain configuration with colors
const chainConfig: Record<string, { color: string; logo: string }> = {
  Arbitrum: { color: "#28A0F0", logo: "◆" },
  Base: { color: "#0052FF", logo: "◉" },
  Polygon: { color: "#8247E5", logo: "⬡" },
  Ethereum: { color: "#627EEA", logo: "⟠" },
  Optimism: { color: "#FF0420", logo: "◎" },
};

// Mock wallet data fetched from MetaMask
const mockWalletAssets: TokenAsset[] = [
  { symbol: "ETH", name: "Ethereum", chain: "Arbitrum", balance: 2.4521, usdValue: 4521.89, icon: "⟠" },
  { symbol: "USDC", name: "USD Coin", chain: "Base", balance: 1250.0, usdValue: 1250.0, icon: "◈" },
  { symbol: "USDT", name: "Tether", chain: "Polygon", balance: 890.5, usdValue: 890.5, icon: "₮" },
  { symbol: "WETH", name: "Wrapped ETH", chain: "Optimism", balance: 0.8432, usdValue: 1554.78, icon: "⟠" },
  { symbol: "DAI", name: "Dai", chain: "Ethereum", balance: 425.0, usdValue: 425.0, icon: "◇" },
];

const mockTransactions = [
  { id: 1, merchant: "Coffee Shop", amount: "5.00", token: "USDC", time: "2 min ago", status: "cleared" },
  { id: 2, merchant: "Gas Station", amount: "45.00", token: "USDC", time: "1 hour ago", status: "settled" },
  { id: 3, merchant: "Restaurant", amount: "32.50", token: "USDC", time: "3 hours ago", status: "settled" },
];

// Mock scanned payment data
const mockScannedPayment = {
  merchantAddress: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  merchantName: "Demo Coffee Shop",
  amount: 12.50,
  currency: "USDC",
};

export function UserPanel() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(mockWalletAssets[1]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();

  // Calculate total balance on mount/connection
  useEffect(() => {
    if (isConnected) {
      const total = mockWalletAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
      setTotalBalance(total);
    }
  }, [isConnected]);

  const handlePaymentConfirm = () => {
    toast({
      title: "Payment Successful",
      description: `Paid $${mockScannedPayment.amount} to ${mockScannedPayment.merchantName}`,
    });
  };

  return (
    <div className="flex h-full flex-col overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="terminal-header mb-1">USER_APP</h2>
        <h1 className="font-mono text-2xl font-bold text-foreground">
          Payment Terminal
        </h1>
        <p className="text-sm text-muted-foreground">
          Scan QR codes and pay instantly from any chain
        </p>
      </div>

      {/* Wallet Connection / Balance Card */}
      <Card className="status-card mb-6 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between font-mono text-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              WALLET_STATUS
            </div>
            {isConnected && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="font-mono text-xs text-muted-foreground">
                  0x7a2...4f3e
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-6">
              {/* Primary Balance Display */}
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 glow-yellow">
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Available Balance
                </p>
                <AnimatedBalance value={totalBalance} className="mb-1" />
                <p className="text-sm text-muted-foreground">
                  Across {mockWalletAssets.length} assets on {new Set(mockWalletAssets.map(a => a.chain)).size} chains
                </p>
              </div>

              {/* Token Selector */}
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Select Asset to Pay
                </span>
                
                <TokenSelectorModal
                  assets={mockWalletAssets}
                  selectedAsset={selectedAsset}
                  onSelect={setSelectedAsset}
                  trigger={
                    <button className="group flex w-full items-center justify-between rounded-lg border border-primary/30 bg-secondary/30 p-4 transition-all hover:border-primary hover:bg-secondary/50 glow-yellow">
                      <div className="flex items-center gap-3">
                        {/* Token Icon with Chain Badge */}
                        <div className="relative">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-xl shadow-[0_0_12px_2px_hsl(var(--primary)/0.3)]">
                            {selectedAsset.icon}
                          </div>
                          <ChainBadge chain={selectedAsset.chain} className="absolute -bottom-1 -right-1" />
                        </div>
                        
                        {/* Token Info */}
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-semibold text-primary">
                              {selectedAsset.symbol}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {selectedAsset.name}
                            </span>
                          </div>
                          <div 
                            className="flex items-center gap-1 text-xs"
                            style={{ color: chainConfig[selectedAsset.chain]?.color }}
                          >
                            <span>{chainConfig[selectedAsset.chain]?.logo}</span>
                            <span>{selectedAsset.chain}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Balance & Chevron */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-mono text-sm font-bold">
                            {selectedAsset.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            ${selectedAsset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <ChevronDown className="h-5 w-5 text-primary transition-transform group-hover:translate-y-0.5" />
                      </div>
                    </button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Connect your wallet to view balances<br />and start paying
              </p>
              <Button
                onClick={() => setIsConnected(true)}
                className="w-full glow-yellow font-mono"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Connect MetaMask
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan & Pay Button */}
      {isConnected && (
        <Card className="status-card mb-6 scanner-line">
          <CardContent className="flex flex-col items-center py-8">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10 pulse-ready">
              <QrCode className="h-10 w-10 text-primary" />
            </div>
            <Button
              size="lg"
              onClick={() => setShowPaymentModal(true)}
              className="glow-yellow-intense font-mono text-lg"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Scan QR & Pay
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Paying with {selectedAsset.balance} {selectedAsset.symbol} on {selectedAsset.chain}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        payment={{
          ...mockScannedPayment,
          token: selectedAsset,
        }}
        onConfirm={handlePaymentConfirm}
      />

      {/* Recent Transactions */}
      {isConnected && (
        <Card className="status-card flex-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <ArrowUpRight className="h-4 w-4 text-primary" />
              RECENT_PAYMENTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        tx.status === "cleared" ? "bg-primary animate-pulse" : "bg-success"
                      }`}
                    />
                    <div>
                      <div className="font-mono text-sm">{tx.merchant}</div>
                      <div className="text-xs text-muted-foreground">{tx.time}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold">
                      ${tx.amount}
                    </div>
                    <div className="text-xs text-muted-foreground">{tx.token}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
