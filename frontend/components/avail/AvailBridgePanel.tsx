/**
 * AvailBridgePanel — Cross-chain bridge UI powered by Avail Nexus SDK.
 *
 * Features:
 *  • Unified balance view across all chains
 *  • Simulate bridge to preview fees
 *  • Execute bridge with live step tracker
 *  • Quick top-up shortcuts for payment chain (Sepolia)
 */
'use client';

import { useState, useMemo } from 'react';
import {
  ArrowDown,
  ArrowRightLeft,
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  RefreshCw,
  Wallet,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAvailNexus, type BridgeStep } from '@/hooks/useAvailNexus';

// ─────────────────── Supported destination chains ──────────────────

const DEST_CHAINS = [
  { id: 11155111, name: 'Sepolia', icon: '⟠', color: '#627EEA' },
  { id: 1, name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { id: 42161, name: 'Arbitrum', icon: '◆', color: '#28A0F0' },
  { id: 8453, name: 'Base', icon: '◉', color: '#0052FF' },
  { id: 137, name: 'Polygon', icon: '⬡', color: '#8247E5' },
  { id: 10, name: 'Optimism', icon: '◎', color: '#FF0420' },
] as const;

const SUPPORTED_TOKENS = ['USDC', 'USDT', 'ETH'] as const;

// ────────────────────────── Component ──────────────────────────────

export function AvailBridgePanel() {
  const {
    nexusReady,
    initLoading,
    initError,
    bridgeBalances,
    refetchBalances,
    simulate,
    isSimulating,
    simulation,
    bridge,
    isBridging,
    steps,
    bridgeError,
    reset,
  } = useAvailNexus();

  const [selectedToken, setSelectedToken] = useState<string>('USDC');
  const [amount, setAmount] = useState<string>('');
  const [destChainId, setDestChainId] = useState<number>(11155111); // Sepolia default
  const [showSteps, setShowSteps] = useState(false);

  // Find selected token's unified balance
  const tokenBalance = useMemo(
    () => bridgeBalances.find((b) => b.symbol === selectedToken),
    [bridgeBalances, selectedToken],
  );

  const destChain = DEST_CHAINS.find((c) => c.id === destChainId)!;

  // ── Handlers ──

  const handleSimulate = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    try {
      await simulate({ token: selectedToken, amount, toChainId: destChainId });
    } catch {
      // error is set in hook state
    }
  };

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setShowSteps(true);
    try {
      await bridge({ token: selectedToken, amount, toChainId: destChainId });
    } catch {
      // error is set in hook state
    }
  };

  const handleReset = () => {
    reset();
    setAmount('');
    setShowSteps(false);
  };

  // ────────────────────────── Render ──────────────────────────────

  // Loading / not-ready state
  if (initLoading) {
    return (
      <Card className="status-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="font-mono text-sm text-muted-foreground">
            Initialising Avail Nexus…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (initError) {
    return (
      <Card className="status-card border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="mb-3 h-8 w-8 text-destructive" />
          <p className="mb-1 font-mono text-sm text-destructive">Nexus Init Error</p>
          <p className="text-xs text-muted-foreground">{initError}</p>
        </CardContent>
      </Card>
    );
  }

  if (!nexusReady) {
    return (
      <Card className="status-card">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ArrowRightLeft className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-mono text-sm text-muted-foreground">
            Connect wallet to enable cross-chain bridge
          </p>
        </CardContent>
      </Card>
    );
  }

  // ── Active bridge in progress ──
  if (showSteps && steps.length > 0) {
    return (
      <Card className="status-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            BRIDGE_PROGRESS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step tracker */}
          <div className="space-y-1">
            {steps.map((step, i) => (
              <StepRow key={`${step.type}-${i}`} step={step} />
            ))}
          </div>

          {bridgeError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              {bridgeError}
            </div>
          )}

          {/* All complete */}
          {steps.length > 0 && steps.every((s) => s.status === 'complete') && (
            <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-500" />
              <p className="font-mono text-sm font-bold text-green-500">
                Bridge Complete
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {amount} {selectedToken} → {destChain.name}
              </p>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={handleReset}
            disabled={isBridging}
          >
            {isBridging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bridging…
              </>
            ) : (
              'New Bridge'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Main bridge form ──
  return (
    <Card className="status-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between font-mono text-sm">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            CROSS_CHAIN_BRIDGE
          </div>
          <Badge variant="outline" className="font-mono text-[10px]">
            Avail Nexus
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unified balances summary */}
        {bridgeBalances.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Unified Balances
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchBalances()}
                className="h-6 px-2"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {bridgeBalances.slice(0, 6).map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setSelectedToken(asset.symbol)}
                  className={cn(
                    'rounded-lg border p-2 text-left transition-all',
                    selectedToken === asset.symbol
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50',
                  )}
                >
                  <div className="font-mono text-xs font-bold">{asset.symbol}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {parseFloat(asset.balance).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ${asset.balanceInFiat.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>

            {/* Per-chain breakdown */}
            {tokenBalance && tokenBalance.breakdown.length > 0 && (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
                <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {selectedToken} across chains
                </div>
                <div className="space-y-1">
                  {tokenBalance.breakdown.map((b) => (
                    <div
                      key={b.chain.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="flex items-center gap-1">
                        {b.chain.logo && (
                          <img
                            src={b.chain.logo}
                            alt=""
                            className="h-3 w-3 rounded-full"
                          />
                        )}
                        {b.chain.name}
                      </span>
                      <span className="font-mono">
                        {parseFloat(b.balance).toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* From / To */}
        <div className="space-y-3">
          {/* Token selector */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Token
            </label>
            <div className="flex gap-2">
              {SUPPORTED_TOKENS.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedToken(t)}
                  className={cn(
                    'flex-1 rounded-lg border py-2 font-mono text-xs transition-all',
                    selectedToken === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/50 text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Amount
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-border bg-background p-3 font-mono text-lg focus:border-primary focus:outline-none"
            />
            {tokenBalance && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>
                  Available: {parseFloat(tokenBalance.balance).toFixed(4)} {selectedToken}
                </span>
                <button
                  onClick={() => setAmount(tokenBalance.balance)}
                  className="text-primary hover:underline"
                >
                  MAX
                </button>
              </div>
            )}
          </div>

          {/* Arrow divider */}
          <div className="flex justify-center">
            <div className="rounded-full border border-border bg-background p-2">
              <ArrowDown className="h-4 w-4 text-primary" />
            </div>
          </div>

          {/* Destination chain */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Destination Chain
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEST_CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => setDestChainId(chain.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border py-2 px-3 text-xs transition-all',
                    destChainId === chain.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-primary/50',
                  )}
                >
                  <span style={{ color: chain.color }}>{chain.icon}</span>
                  <span className="font-mono">{chain.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Simulation preview */}
        {simulation && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-primary">
              <Zap className="h-3 w-3" />
              Fee Preview
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">From</div>
                <div className="font-mono">
                  {simulation.sources.map((s) => s.chainName).join(', ')}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Receive</div>
                <div className="font-mono">
                  {simulation.destination.amount} {simulation.tokenSymbol}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Fee</div>
                <div className="font-mono">{simulation.fees.total}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Gas</div>
                <div className="font-mono">{simulation.fees.gas}</div>
              </div>
            </div>
          </div>
        )}

        {/* Error display */}
        {bridgeError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {bridgeError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSimulate}
            disabled={!amount || parseFloat(amount) <= 0 || isSimulating}
          >
            {isSimulating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="mr-2 h-4 w-4" />
            )}
            Preview
          </Button>
          <Button
            className="flex-1 glow-yellow"
            onClick={handleBridge}
            disabled={!amount || parseFloat(amount) <= 0 || isBridging}
          >
            {isBridging ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="mr-2 h-4 w-4" />
            )}
            Bridge
          </Button>
        </div>

        {/* Quick top-up shortcuts */}
        <div className="border-t border-border/50 pt-3">
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Quick Top-Up (USDC → Sepolia)
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['10', '25', '50', '100'].map((val) => (
              <Button
                key={val}
                variant="outline"
                size="sm"
                className="font-mono text-xs"
                onClick={() => {
                  setSelectedToken('USDC');
                  setAmount(val);
                  setDestChainId(11155111);
                }}
              >
                ${val}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────── Step Row sub-component ─────────────────────

function StepRow({ step }: { step: BridgeStep }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-secondary/20 p-2.5">
      {step.status === 'complete' && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
      )}
      {step.status === 'active' && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      )}
      {step.status === 'pending' && (
        <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
      )}
      {step.status === 'error' && (
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
      )}

      <span
        className={cn(
          'flex-1 font-mono text-xs',
          step.status === 'complete' && 'text-green-500',
          step.status === 'active' && 'text-primary',
          step.status === 'pending' && 'text-muted-foreground/60',
          step.status === 'error' && 'text-destructive',
        )}
      >
        {step.label}
      </span>

      {step.explorerUrl && (
        <a
          href={step.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
