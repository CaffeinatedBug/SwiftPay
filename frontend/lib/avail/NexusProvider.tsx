/**
 * NexusProvider — React context that ties the Avail Nexus SDK lifecycle
 * to the wagmi wallet connection.
 *
 * • Auto-initialises when the wallet connects
 * • De-initialises when the wallet disconnects
 * • Exposes `nexusReady` flag + `bridgeBalances` to the tree via context
 * • Registers intent + allowance hooks with auto-accept (can be overridden)
 */
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAccount } from 'wagmi';
import {
  initializeNexus,
  deinitializeNexus,
  isNexusInitialized,
  getUnifiedBalances,
  setOnIntentHook,
  setOnAllowanceHook,
} from '@/lib/avail/nexus';
import type { EthereumProvider } from '@avail-project/nexus-core';

// ───────────────────────────── Types ──────────────────────────────

export interface ChainBreakdown {
  balance: string;
  balanceInFiat: number;
  chain: { id: number; logo: string; name: string };
  contractAddress: `0x${string}`;
  decimals: number;
  isNative?: boolean;
}

export interface UserAsset {
  abstracted?: boolean;
  balance: string;
  balanceInFiat: number;
  breakdown: ChainBreakdown[];
  decimals: number;
  icon?: string;
  symbol: string;
}

interface NexusCtx {
  nexusReady: boolean;
  loading: boolean;
  error: string | null;
  bridgeBalances: UserAsset[];
  refetchBalances: () => Promise<void>;
}

const NexusContext = createContext<NexusCtx>({
  nexusReady: false,
  loading: false,
  error: null,
  bridgeBalances: [],
  refetchBalances: async () => {},
});

// ──────────────────────────── Provider ─────────────────────────────

export function NexusProvider({ children }: { children: ReactNode }) {
  const { connector, isConnected } = useAccount();
  const [nexusReady, setNexusReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bridgeBalances, setBridgeBalances] = useState<UserAsset[]>([]);
  const initAttempted = useRef(false);

  // ── Register hooks (auto-accept intent + min-allowance) ──

  useEffect(() => {
    setOnIntentHook(({ allow }) => {
      // In production, prompt user; for demo we auto-allow
      allow();
    });

    setOnAllowanceHook(({ allow, sources }) => {
      // Auto-approve minimum allowances
      allow(sources.map(() => 'min' as const));
    });
  }, []);

  // ── Init / deinit keyed to wallet connection ──

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isConnected || !connector) return;

      // Skip if already initialised (avoids double-init on HMR)
      if (isNexusInitialized()) {
        setNexusReady(true);
        return;
      }

      // Don't retry failed init within the same render cycle
      if (initAttempted.current) return;
      initAttempted.current = true;

      setLoading(true);
      setError(null);

      try {
        const provider = await connector.getProvider() as EthereumProvider;
        if (cancelled) return;

        await initializeNexus(provider);
        if (cancelled) return;

        setNexusReady(true);

        // Fetch balances in background after init
        try {
          const balances = await getUnifiedBalances();
          if (!cancelled) setBridgeBalances(balances as UserAsset[]);
        } catch {
          // Non-critical: balances can be fetched later
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error('[Nexus] init failed:', e);
          setError(e?.message ?? 'Nexus initialisation failed');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isConnected, connector]);

  // Cleanup when wallet disconnects
  useEffect(() => {
    if (!isConnected && nexusReady) {
      deinitializeNexus().catch(console.error);
      setNexusReady(false);
      setBridgeBalances([]);
      initAttempted.current = false;
    }
  }, [isConnected, nexusReady]);

  // ── Public refetch ──

  const refetchBalances = useCallback(async () => {
    if (!isNexusInitialized()) return;
    try {
      const balances = await getUnifiedBalances();
      setBridgeBalances(balances as UserAsset[]);
    } catch (e: any) {
      console.error('[Nexus] balance fetch error:', e);
    }
  }, []);

  return (
    <NexusContext.Provider
      value={{ nexusReady, loading, error, bridgeBalances, refetchBalances }}
    >
      {children}
    </NexusContext.Provider>
  );
}

// ──────────────────────────── Hook ─────────────────────────────────

export function useNexusContext() {
  return useContext(NexusContext);
}
