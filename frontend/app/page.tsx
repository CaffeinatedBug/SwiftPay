import { MainLayout } from "@/components/layout/MainLayout";
import { UserPanel } from "@/components/panels/UserPanel";
import { MerchantPanel } from "@/components/panels/MerchantPanel";
import { MultiChainBalanceOverview } from "@/components/wallet/BalanceDisplay";
import { WalletButton } from "@/components/wallet/WalletButton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, Network, Zap, TestTube, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex h-full">
        {/* Left Panel - User App (50%) */}
        <div className="flex w-1/2 flex-col overflow-hidden border-r border-border">
          <div className="flex h-full flex-col overflow-auto p-6">
            {/* Header with merchant dashboard styling */}
            <div className="mb-6">
              <h2 className="terminal-header mb-1">USER_APPLICATION</h2>
              <h1 className="font-mono text-2xl font-bold text-foreground">
                SwiftPay
              </h1>
              <p className="text-sm text-muted-foreground">
                Multi-chain wallet integration
              </p>
            </div>

            {/* Wallet Connection Status */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Wallet className="h-5 w-5" />
                  Wallet Status
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8">
                <WalletButton size="lg" />
              </CardContent>
            </Card>

            {/* Multi-Chain Balance Overview */}
            <div className="mb-6">
              <MultiChainBalanceOverview />
            </div>

            {/* Integration Test */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <TestTube className="h-5 w-5" />
                  Integration Testing
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-4">
                  Test all wallet integration features and verify production readiness
                </p>
                <Link href="/test">
                  <Button className="flex items-center gap-2">
                    <TestTube className="h-4 w-4" />
                    Run Integration Tests
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Supported Networks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-mono">
                  <Network className="h-5 w-5" />
                  Supported Networks
                </CardTitle>
              </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Ethereum</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>Arbitrum</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>Base</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Polygon</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span>Optimism</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span>Arc Testnet</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            {/* Original User Panel */}
            <div className="border-t pt-6">
              <UserPanel />
            </div>
          </div>
        </div>

        {/* Vertical Separator with glow */}
        <Separator
          orientation="vertical"
          className="hidden w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent md:block"
        />

        {/* Right Panel - Merchant Dashboard (50%) */}
        <div className="hidden w-1/2 flex-col overflow-hidden md:flex">
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <MerchantPanel />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
