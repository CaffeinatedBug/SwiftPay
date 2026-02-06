"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Wallet, QrCode, ArrowUpRight, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedBalance } from "@/components/ui/animated-balance";
import { ChainBadge } from "@/components/ui/chain-badge";
import { TokenSelectorModal, TokenAsset } from "@/components/ui/token-selector-modal";
import { PaymentConfirmationModal } from "@/components/ui/payment-confirmation-modal";
import { InlineQRScanner } from "@/components/ui/inline-qr-scanner";
import { UserProfileDropdown } from "@/components/layout/UserProfileDropdown";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useWallet } from "@/lib/web3/hooks";
import { useToast } from "@/hooks/use-toast";
import { useYellowNetwork } from "@/hooks/useYellowNetwork";
import { ENSMerchantInput } from "@/components/merchant/ENSMerchantInput";
import { AvailBridgePanel } from "@/components/avail/AvailBridgePanel";

// Chain configuration with colors
const chainConfig: Record<string, { color: string; logo: string }> = {
  Arbitrum: { color: "#28A0F0", logo: "◆" },
  "Arbitrum One": { color: "#28A0F0", logo: "◆" },
  Base: { color: "#0052FF", logo: "◉" },
  Polygon: { color: "#8247E5", logo: "⬡" },
  Ethereum: { color: "#627EEA", logo: "⟠" },
  Mainnet: { color: "#627EEA", logo: "⟠" },
  Optimism: { color: "#FF0420", logo: "◎" },
  "OP Mainnet": { color: "#FF0420", logo: "◎" },
  Sepolia: { color: "#627EEA", logo: "⟠" },
};

// Approximate ETH price for USD conversion (in production, fetch from API)
const ETH_PRICE_USD = 2500;

const mockTransactions = [
  { id: 1, merchant: "Coffee Shop", amount: "5.00", token: "USDC", time: "2 min ago", status: "cleared" },
  { id: 2, merchant: "Gas Station", amount: "45.00", token: "USDC", time: "1 hour ago", status: "settled" },
  { id: 3, merchant: "Restaurant", amount: "32.50", token: "USDC", time: "3 hours ago", status: "settled" },
];

// Payment data type for scanned QR or ENS-resolved merchant
interface ScannedPaymentData {
  merchantAddress: string;
  merchantName: string;
  amount: number;
  currency: string;
}

// Merchant info from ENS resolution
interface MerchantInfo {
  address: string;
  ensName?: string;
  endpoint: string;
  vault?: string;
  chain?: string;
  schedule?: string;
}

export function UserPanel() {
  const wallet = useWallet();
  const yellow = useYellowNetwork();
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showENSSearch, setShowENSSearch] = useState(false);
  const [showBridge, setShowBridge] = useState(false);
  const [scannedPayment, setScannedPayment] = useState<ScannedPaymentData | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantInfo | null>(null);
  const { toast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);

  // Build real wallet assets from connected wallet
  const walletAssets: TokenAsset[] = useMemo(() => {
    if (!wallet.isConnected || !wallet.currentChain) return [];
    
    const assets: TokenAsset[] = [];
    const chainName = wallet.currentChain.name || "Ethereum";
    
    // Add native token (ETH/MATIC etc)
    const nativeBalance = parseFloat(wallet.nativeBalance.formatted || "0");
    if (nativeBalance > 0 || wallet.isConnected) {
      assets.push({
        symbol: wallet.nativeBalance.symbol || "ETH",
        name: wallet.currentChain.nativeCurrency?.name || "Ether",
        chain: chainName,
        balance: nativeBalance,
        usdValue: nativeBalance * ETH_PRICE_USD,
        icon: "⟠",
      });
    }
    
    // Add ERC20 tokens from current chain
    wallet.currentChainTokens.forEach((tokenBalance) => {
      const balance = parseFloat(tokenBalance.formatted || "0");
      if (balance > 0) {
        // For stablecoins, use 1:1 USD value
        const isStablecoin = ["USDC", "USDT", "DAI"].includes(tokenBalance.token.symbol);
        const usdValue = isStablecoin ? balance : balance * ETH_PRICE_USD;
        
        assets.push({
          symbol: tokenBalance.token.symbol,
          name: tokenBalance.token.name,
          chain: chainName,
          balance: balance,
          usdValue: usdValue,
          icon: tokenBalance.token.symbol === "USDC" ? "◈" : 
                tokenBalance.token.symbol === "USDT" ? "₮" : 
                tokenBalance.token.symbol === "DAI" ? "◇" : "●",
        });
      }
    });
    
    return assets;
  }, [wallet.isConnected, wallet.currentChain, wallet.nativeBalance, wallet.currentChainTokens]);

  // Selected asset state
  const [selectedAsset, setSelectedAsset] = useState<TokenAsset | null>(null);
  
  // Auto-select first asset when wallet connects
  useEffect(() => {
    if (walletAssets.length > 0 && !selectedAsset) {
      setSelectedAsset(walletAssets[0]);
    }
  }, [walletAssets, selectedAsset]);

  // Calculate total balance from real assets
  const totalBalance = useMemo(() => {
    return walletAssets.reduce((sum, asset) => sum + asset.usdValue, 0);
  }, [walletAssets]);

  // Handle QR scan success - chain to payment modal
  const handleScanSuccess = (data: ScannedPaymentData) => {
    setScannedPayment(data);
    setShowScannerModal(false);
    // Small delay to let scanner close, then open payment modal
    setTimeout(() => {
      setShowPaymentModal(true);
    }, 300);
  };

  const handlePaymentConfirm = async () => {
    if (!scannedPayment) return;
    
    try {
      // Clear payment via Yellow Network (<200ms instant)
      await yellow.clearPayment(
        scannedPayment.merchantAddress,
        scannedPayment.amount.toString()
      );
      
      toast({
        title: "⚡ Payment Cleared Instantly",
        description: `Paid $${scannedPayment.amount} to ${scannedPayment.merchantName} via Yellow Network`,
      });
      
      setScannedPayment(null);
      setShowPaymentModal(false);
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment",
        variant: "destructive"
      });
    }
  };

  // Handle ENS merchant selection
  const handleMerchantSelected = (merchantInfo: MerchantInfo) => {
    setSelectedMerchant(merchantInfo);
    setShowENSSearch(false);
    
    toast({
      title: "✅ Merchant Found via ENS",
      description: `${merchantInfo.ensName || merchantInfo.address} - Settlement: ${merchantInfo.chain?.toUpperCase() || 'SEPOLIA'}`,
    });
  };

  return (
    <div ref={panelRef} className="relative flex h-full flex-col p-6">
      {/* Wallet Connection & Profile */}
      <div className="mb-6 flex items-center justify-end">
        <UserProfileDropdown />
      </div>

      {/* Wallet Connection / Balance Card */}
      <Card className="status-card mb-6 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between font-mono text-sm">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              WALLET_STATUS
            </div>
            {wallet.isConnected && wallet.address && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="font-mono text-xs text-muted-foreground">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wallet.isConnected ? (
            <div className="space-y-6">
              {/* Primary Balance Display */}
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6 glow-yellow">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Available Balance
                  </p>
                  {wallet.nativeBalance.isLoading && (
                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  )}
                </div>
                <AnimatedBalance value={totalBalance} className="mb-1" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {wallet.currentChain && (
                    <>
                      <span 
                        className="inline-flex items-center gap-1"
                        style={{ color: chainConfig[wallet.currentChain.name]?.color || "#627EEA" }}
                      >
                        {chainConfig[wallet.currentChain.name]?.logo || "⟠"}
                        {wallet.currentChain.name}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span>{wallet.nativeBalance.formatted ? parseFloat(wallet.nativeBalance.formatted).toFixed(4) : "0"} {wallet.nativeBalance.symbol}</span>
                </div>
              </div>

              {/* Token Selector */}
              {walletAssets.length > 0 && selectedAsset && (
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Select Asset to Pay
                  </span>
                  
                  <TokenSelectorModal
                    assets={walletAssets}
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
              )}
              
              {/* Empty state when no tokens */}
              {walletAssets.length === 0 && (
                <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No tokens found on {wallet.currentChain?.name || "this chain"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="mb-4 text-sm text-muted-foreground">Connect your wallet to start paying</p>
              <WalletButton />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ENS Merchant Search */}
      {wallet.isConnected && selectedAsset && !selectedMerchant && (
        <Card className="status-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              🌐 FIND_MERCHANT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ENSMerchantInput 
              onMerchantSelected={handleMerchantSelected}
              network="sepolia"
              placeholder="Enter ENS name (e.g., coffee.swiftpay.eth)"
            />
            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScannerModal(true)}
                className="flex-1"
              >
                <QrCode className="mr-2 h-4 w-4" />
                Or Scan QR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Merchant Payment */}
      {wallet.isConnected && selectedAsset && selectedMerchant && (
        <Card className="status-card mb-6 glow-yellow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between font-mono text-sm">
              <span>💳 READY_TO_PAY</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMerchant(null)}
                className="h-6 text-xs"
              >
                Change Merchant
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Merchant Info */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Merchant</span>
                {selectedMerchant.ensName && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 font-mono text-xs text-primary">
                    ENS Verified
                  </span>
                )}
              </div>
              <div className="mb-1 font-mono text-lg font-bold">
                {selectedMerchant.ensName || `${selectedMerchant.address.slice(0, 6)}...${selectedMerchant.address.slice(-4)}`}
              </div>
              {selectedMerchant.vault && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Settlement: {selectedMerchant.chain?.toUpperCase()} • {selectedMerchant.schedule || 'instant'}
                </div>
              )}
            </div>

            {/* Payment Amount Input */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Amount ({selectedAsset.symbol})</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full rounded-lg border border-primary/30 bg-background p-3 font-mono text-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const amount = parseFloat((e.target as HTMLInputElement).value);
                    if (amount > 0) {
                      setScannedPayment({
                        merchantAddress: selectedMerchant.address,
                        merchantName: selectedMerchant.ensName || 'Merchant',
                        amount,
                        currency: selectedAsset.symbol,
                      });
                      setShowPaymentModal(true);
                    }
                  }
                }}
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 25, 50].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setScannedPayment({
                      merchantAddress: selectedMerchant.address,
                      merchantName: selectedMerchant.ensName || 'Merchant',
                      amount,
                      currency: selectedAsset.symbol,
                    });
                    setShowPaymentModal(true);
                  }}
                  className="font-mono"
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Scan QR to Pay */}
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10 pulse-ready">
              <QrCode className="h-10 w-10 text-primary" />
            </div>
            <Button
              size="lg"
              onClick={() => setShowScannerModal(true)}
              className="glow-yellow-intense font-mono text-lg"
            >
              <QrCode className="mr-2 h-5 w-5" />
              Scan QR & Pay
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Paying with {selectedAsset.balance.toFixed(4)} {selectedAsset.symbol} on {selectedAsset.chain}
            </p>
          </CardContent>
        </Card>
      )}

      {/* QR Scanner Modal - contained within this panel */}
      <InlineQRScanner
        open={showScannerModal}
        onOpenChange={setShowScannerModal}
        onScanSuccess={handleScanSuccess}
        containerRef={panelRef}
      />

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        payment={scannedPayment && selectedAsset ? {
          ...scannedPayment,
          token: selectedAsset,
        } : null}
        onConfirm={handlePaymentConfirm}
      />

      {/* Cross-Chain Top-Up via Avail Nexus */}
      {wallet.isConnected && (
        <div className="mb-6">
          <Button
            variant={showBridge ? "default" : "outline"}
            size="sm"
            className="mb-3 w-full font-mono text-xs"
            onClick={() => setShowBridge(!showBridge)}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            {showBridge ? 'Hide Bridge' : '⚡ Cross-Chain Top-Up (Avail Nexus)'}
          </Button>
          {showBridge && <AvailBridgePanel />}
        </div>
      )}

      {/* Recent Transactions */}
      {wallet.isConnected && (
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
