/**
 * Avail Nexus SDK — Singleton wrapper
 *
 * Initialises NexusSDK once with `testnet`, exposes thin helpers for
 * bridge / transfer / swap / balances used by `useAvailNexus` hook.
 *
 * IMPORTANT: The SDK must be initialised with an EIP-1193 provider
 * AFTER the user has connected their wallet.
 */

import { NexusSDK, type EthereumProvider } from '@avail-project/nexus-core';

// ──────────────────────────── Singleton ────────────────────────────

export const nexusSdk = new NexusSDK({ network: 'testnet' });

// ──────────────────────────── Lifecycle ────────────────────────────

export function isNexusInitialized(): boolean {
  return nexusSdk.isInitialized();
}

/**
 * Initialise the SDK with an EIP-1193 wallet provider obtained from
 * the wagmi connector (e.g. `connector.getProvider()`).
 *
 * Idempotent – calling when already initialised is a no-op.
 */
export async function initializeNexus(provider: EthereumProvider): Promise<void> {
  if (!provider) throw new Error('No EIP-1193 provider supplied');
  if (nexusSdk.isInitialized()) return;
  await nexusSdk.initialize(provider);
}

export async function deinitializeNexus(): Promise<void> {
  if (!nexusSdk.isInitialized()) return;
  await nexusSdk.deinit();
}

// ────────────────────────── Bridge helpers ─────────────────────────

export async function getUnifiedBalances() {
  return nexusSdk.getBalancesForBridge();
}

export async function getSwapBalances() {
  return nexusSdk.getBalancesForSwap();
}

/**
 * Bridge a token to a destination chain.
 *
 * Example:
 *   bridgeTokens({ token: 'USDC', amount: 10_000_000n, toChainId: 11155111 })
 */
export interface BridgeOpts {
  token: string;
  amount: bigint;
  toChainId: number;
  recipient?: `0x${string}`;
  sourceChains?: number[];
}

export async function bridgeTokens(
  params: BridgeOpts,
  onEvent?: (event: any) => void,
) {
  return nexusSdk.bridge(params as any, onEvent ? { onEvent } : undefined);
}

export async function simulateBridge(params: BridgeOpts) {
  return nexusSdk.simulateBridge(params as any);
}

/**
 * Bridge & Transfer — bridge + send to a different recipient on the
 * destination chain in a single intent.
 */
export interface TransferOpts {
  token: string;
  amount: bigint;
  toChainId: number;
  recipient: `0x${string}`;
  sourceChains?: number[];
}

export async function bridgeAndTransfer(
  params: TransferOpts,
  onEvent?: (event: any) => void,
) {
  return nexusSdk.bridgeAndTransfer(params as any, onEvent ? { onEvent } : undefined);
}

export async function simulateTransfer(params: TransferOpts) {
  return nexusSdk.simulateBridgeAndTransfer(params as any);
}

// ────────────────────────── Utility ────────────────────────────────

/**
 * Convert a human-readable amount (e.g. "10.5") to the correct bigint
 * representation for a given token+chain.
 */
export function toTokenAmount(
  readable: string,
  token: string,
  chainId: number,
): bigint {
  return nexusSdk.convertTokenReadableAmountToBigInt(readable, token, chainId);
}

// ────────────────────────── Hook registrations ─────────────────────

/**
 * Register the onIntentHook — called before an intent is submitted so the
 * user can accept or deny.  If not registered the SDK auto-accepts.
 */
export function setOnIntentHook(
  handler: (data: { intent: any; allow: () => void; deny: () => void; refresh: (s?: number[]) => Promise<any> }) => void,
) {
  nexusSdk.setOnIntentHook(handler);
}

/**
 * Register the onAllowanceHook — called when the SDK needs ERC-20
 * approvals before it can move tokens.
 */
export function setOnAllowanceHook(
  handler: (data: {
    allow: (values: Array<'max' | 'min' | bigint | string>) => void;
    deny: () => void;
    sources: any[];
  }) => void,
) {
  nexusSdk.setOnAllowanceHook(handler);
}

// Re-export NEXUS_EVENTS so consumers don't need to import from SDK directly
export { NEXUS_EVENTS } from '@avail-project/nexus-core';
