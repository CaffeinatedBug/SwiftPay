/**
 * useAvailNexus — main React hook for Avail Nexus cross-chain operations.
 *
 * Provides:
 *  • Unified bridge balances (aggregated across all chains)
 *  • bridge()          – move tokens to a destination chain
 *  • bridgeAndTransfer() – bridge + send to another address
 *  • simulateBridge()  – preview fees before executing
 *  • Step-by-step progress tracking via NEXUS_EVENTS
 *
 * Designed for the SwiftPay payment flow:
 *  User has USDC on Arbitrum → bridge to Sepolia → pay merchant via Yellow Network
 */
'use client';

import { useCallback, useState } from 'react';
import { useNexusContext, type UserAsset } from '@/lib/avail/NexusProvider';
import {
  bridgeTokens,
  bridgeAndTransfer,
  simulateBridge,
  simulateTransfer,
  toTokenAmount,
  isNexusInitialized,
  NEXUS_EVENTS,
  type BridgeOpts,
  type TransferOpts,
} from '@/lib/avail/nexus';

// ────────────────────────── Step types ─────────────────────────────

export type BridgeStepStatus = 'pending' | 'active' | 'complete' | 'error';

export interface BridgeStep {
  type: string;
  label: string;
  status: BridgeStepStatus;
  explorerUrl?: string;
}

export interface SimulationPreview {
  sources: Array<{
    chainName: string;
    chainId: number;
    amount: string;
  }>;
  destination: {
    chainName: string;
    chainId: number;
    amount: string;
  };
  fees: {
    total: string;
    protocol: string;
    solver: string;
    gas: string;
  };
  tokenSymbol: string;
}

// Step-type label mapping for the UI
function stepLabel(type: string): string {
  const labels: Record<string, string> = {
    INTENT_ACCEPTED: 'Intent accepted',
    INTENT_HASH_SIGNED: 'Intent signed',
    ALLOWANCE_APPROVAL_REQUEST: 'Approving allowance…',
    ALLOWANCE_APPROVAL_MINED: 'Allowance confirmed',
    ALLOWANCE_COMPLETE: 'Allowances ready',
    INTENT_DEPOSIT_REQUEST: 'Depositing tokens…',
    INTENT_SUBMITTED: 'Intent submitted',
    INTENT_DEPOSITS_CONFIRMED: 'Deposits confirmed',
    INTENT_COLLECTION: 'Solver collecting…',
    INTENT_COLLECTION_COMPLETE: 'Collection done',
    INTENT_FULFILLED: 'Intent fulfilled ✓',
    EXECUTE_APPROVAL_STEP: 'Execute approval',
    EXECUTE_TRANSACTION_SENT: 'Transaction sent',
    EXECUTE_TRANSACTION_CONFIRMED: 'Transaction confirmed',
  };
  return labels[type] ?? type;
}

// ──────────────────────────── Hook ─────────────────────────────────

export function useAvailNexus() {
  const { nexusReady, loading: initLoading, error: initError, bridgeBalances, refetchBalances } =
    useNexusContext();

  const [steps, setSteps] = useState<BridgeStep[]>([]);
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [simulation, setSimulation] = useState<SimulationPreview | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // ── Event handler that builds the live step tracker ──

  const handleEvent = useCallback((event: any) => {
    if (event.name === NEXUS_EVENTS.STEPS_LIST) {
      // Initial list of planned steps
      const planned: BridgeStep[] = (event.args as any[]).map((s: any, i: number) => ({
        type: s.type ?? `step_${i}`,
        label: stepLabel(s.type ?? `step_${i}`),
        status: 'pending' as const,
      }));
      setSteps(planned);
    } else if (event.name === NEXUS_EVENTS.STEP_COMPLETE) {
      const completed = event.args as any;
      setSteps((prev) => {
        const idx = prev.findIndex(
          (s) => s.type === completed.type && s.status !== 'complete',
        );
        if (idx === -1) {
          // Step not in our list — append
          return [
            ...prev,
            {
              type: completed.type,
              label: stepLabel(completed.type),
              status: 'complete',
              explorerUrl: completed.data?.explorerURL,
            },
          ];
        }
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          status: 'complete',
          explorerUrl: completed.data?.explorerURL,
        };
        // Mark next pending step as active
        const nextIdx = updated.findIndex((s) => s.status === 'pending');
        if (nextIdx !== -1) updated[nextIdx] = { ...updated[nextIdx], status: 'active' };
        return updated;
      });
    }
  }, []);

  // ── Simulate ──

  const simulate = useCallback(
    async (opts: { token: string; amount: string; toChainId: number; sourceChains?: number[] }) => {
      if (!isNexusInitialized()) throw new Error('Nexus not initialised');
      setIsSimulating(true);
      setSimulation(null);
      try {
        const amountBigInt = toTokenAmount(opts.amount, opts.token, opts.toChainId);
        const res = await simulateBridge({
          token: opts.token,
          amount: amountBigInt,
          toChainId: opts.toChainId,
          sourceChains: opts.sourceChains,
        });
        const preview: SimulationPreview = {
          sources: res.intent.sources.map((s: any) => ({
            chainName: s.chainName,
            chainId: s.chainID,
            amount: s.amount,
          })),
          destination: {
            chainName: res.intent.destination.chainName,
            chainId: res.intent.destination.chainID,
            amount: res.intent.destination.amount,
          },
          fees: {
            total: res.intent.fees.total,
            protocol: res.intent.fees.protocol,
            solver: res.intent.fees.solver,
            gas: res.intent.fees.caGas,
          },
          tokenSymbol: res.token.symbol,
        };
        setSimulation(preview);
        return preview;
      } catch (e: any) {
        setBridgeError(e?.message ?? 'Simulation failed');
        throw e;
      } finally {
        setIsSimulating(false);
      }
    },
    [],
  );

  // ── Bridge ──

  const bridge = useCallback(
    async (opts: {
      token: string;
      amount: string;
      toChainId: number;
      sourceChains?: number[];
      recipient?: `0x${string}`;
    }) => {
      if (!isNexusInitialized()) throw new Error('Nexus not initialised');
      setIsBridging(true);
      setBridgeError(null);
      setSteps([]);
      try {
        // Use readable → bigint conversion
        const amountParsed = toTokenAmount(opts.amount, opts.token, opts.toChainId);
        const result = await bridgeTokens(
          {
            token: opts.token,
            amount: amountParsed,
            toChainId: opts.toChainId,
            sourceChains: opts.sourceChains,
            recipient: opts.recipient,
          },
          handleEvent,
        );
        // Refresh balances after successful bridge
        await refetchBalances();
        return result;
      } catch (e: any) {
        setBridgeError(e?.message ?? 'Bridge failed');
        throw e;
      } finally {
        setIsBridging(false);
      }
    },
    [handleEvent, refetchBalances],
  );

  // ── Bridge & Transfer (to another address) ──

  const transfer = useCallback(
    async (opts: {
      token: string;
      amount: string;
      toChainId: number;
      recipient: `0x${string}`;
      sourceChains?: number[];
    }) => {
      if (!isNexusInitialized()) throw new Error('Nexus not initialised');
      setIsBridging(true);
      setBridgeError(null);
      setSteps([]);
      try {
        const amountParsed = toTokenAmount(opts.amount, opts.token, opts.toChainId);
        const result = await bridgeAndTransfer(
          {
            token: opts.token,
            amount: amountParsed,
            toChainId: opts.toChainId,
            recipient: opts.recipient,
            sourceChains: opts.sourceChains,
          },
          handleEvent,
        );
        await refetchBalances();
        return result;
      } catch (e: any) {
        setBridgeError(e?.message ?? 'Transfer failed');
        throw e;
      } finally {
        setIsBridging(false);
      }
    },
    [handleEvent, refetchBalances],
  );

  // ── Reset ──

  const reset = useCallback(() => {
    setSteps([]);
    setBridgeError(null);
    setSimulation(null);
  }, []);

  return {
    // Initialisation
    nexusReady,
    initLoading,
    initError,

    // Balances
    bridgeBalances,
    refetchBalances,

    // Operations
    simulate,
    isSimulating,
    simulation,

    bridge,
    transfer,
    isBridging,
    steps,
    bridgeError,

    // Utility
    reset,
  };
}
