/**
 * ENS Service for SwiftPay
 * 
 * Enables merchant discovery via ENS names (e.g., coffee.swiftpay.eth)
 * Text records stored in ENS:
 * - swiftpay.endpoint: Yellow Network endpoint or wallet address
 * - swiftpay.vault: Arc vault address for settlements
 * - swiftpay.chain: Preferred settlement chain (arc, sepolia, etc.)
 * - swiftpay.schedule: Settlement frequency (instant, daily, weekly)
 */

import { createPublicClient, http, normalize } from 'viem';
import { mainnet, sepolia } from 'viem/chains';

const ENS_TEXT_KEYS = {
  ENDPOINT: 'swiftpay.endpoint',
  VAULT: 'swiftpay.vault',
  CHAIN: 'swiftpay.chain',
  SCHEDULE: 'swiftpay.schedule',
} as const;

export interface SwiftPayENSRecord {
  ensName: string;
  endpoint: string | null;
  vault: string | null;
  chain: string | null;
  schedule: string | null;
  resolverAddress: string | null;
}

// Mainnet client for production ENS lookups
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ENS_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
});

// Sepolia client for testnet ENS
const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_ENS_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
});

/**
 * Resolve SwiftPay merchant information from ENS name
 * @param ensName ENS name (e.g., "coffee.swiftpay.eth" or "merchant.eth")
 * @param network "mainnet" or "sepolia"
 * @returns SwiftPay merchant record or null if not found
 */
export async function resolveSwiftPayMerchant(
  ensName: string,
  network: 'mainnet' | 'sepolia' = 'mainnet'
): Promise<SwiftPayENSRecord | null> {
  const client = network === 'mainnet' ? mainnetClient : sepoliaClient;
  
  try {
    const normalizedName = normalize(ensName);
    
    // Get resolver address
    const resolverAddress = await client.getEnsResolver({ name: normalizedName });
    
    if (!resolverAddress) {
      console.warn(`❌ No ENS resolver found for ${ensName}`);
      return null;
    }

    // Fetch all SwiftPay text records in parallel
    const [endpoint, vault, chain, schedule] = await Promise.all([
      client.getEnsText({ name: normalizedName, key: ENS_TEXT_KEYS.ENDPOINT }),
      client.getEnsText({ name: normalizedName, key: ENS_TEXT_KEYS.VAULT }),
      client.getEnsText({ name: normalizedName, key: ENS_TEXT_KEYS.CHAIN }),
      client.getEnsText({ name: normalizedName, key: ENS_TEXT_KEYS.SCHEDULE }),
    ]);

    // Validate that this is a SwiftPay merchant (must have endpoint)
    if (!endpoint) {
      console.warn(`⚠️ ENS name ${ensName} has no swiftpay.endpoint record`);
      return null;
    }

    return {
      ensName: normalizedName,
      endpoint,
      vault,
      chain: chain || 'sepolia', // Default to Sepolia
      schedule: schedule || 'daily', // Default to daily settlement
      resolverAddress,
    };
  } catch (error) {
    console.error(`❌ ENS resolution failed for ${ensName}:`, error);
    return null;
  }
}

/**
 * Get ENS address (standard resolution)
 * @param ensName ENS name
 * @param network "mainnet" or "sepolia"
 * @returns Ethereum address or null
 */
export async function getENSAddress(
  ensName: string,
  network: 'mainnet' | 'sepolia' = 'mainnet'
): Promise<string | null> {
  const client = network === 'mainnet' ? mainnetClient : sepoliaClient;
  
  try {
    const normalizedName = normalize(ensName);
    const address = await client.getEnsAddress({ name: normalizedName });
    return address;
  } catch (error) {
    console.error(`❌ ENS address resolution failed for ${ensName}:`, error);
    return null;
  }
}

/**
 * Reverse resolve: get ENS name from address
 * @param address Ethereum address
 * @param network "mainnet" or "sepolia"
 * @returns ENS name or null
 */
export async function reverseResolveENS(
  address: string,
  network: 'mainnet' | 'sepolia' = 'mainnet'
): Promise<string | null> {
  const client = network === 'mainnet' ? mainnetClient : sepoliaClient;
  
  try {
    const ensName = await client.getEnsName({ address: address as `0x${string}` });
    return ensName;
  } catch (error) {
    console.error(`❌ Reverse ENS resolution failed for ${address}:`, error);
    return null;
  }
}

/**
 * Validate if ENS name has valid SwiftPay configuration
 * @param ensName ENS name
 * @param network "mainnet" or "sepolia"
 * @returns true if valid SwiftPay merchant
 */
export async function isValidSwiftPayMerchant(
  ensName: string,
  network: 'mainnet' | 'sepolia' = 'mainnet'
): Promise<boolean> {
  const record = await resolveSwiftPayMerchant(ensName, network);
  return record !== null && !!record.endpoint;
}

/**
 * Format ENS name for display (shorten if needed)
 * @param ensName ENS name
 * @param maxLength Maximum length before truncation
 * @returns Formatted ENS name
 */
export function formatENSName(ensName: string, maxLength: number = 20): string {
  if (ensName.length <= maxLength) return ensName;
  
  const parts = ensName.split('.');
  if (parts.length === 2) {
    // For name.eth format
    const [name, tld] = parts;
    const availableLength = maxLength - tld.length - 4; // -4 for "..." and "."
    if (name.length > availableLength) {
      return `${name.slice(0, availableLength)}...${tld}`;
    }
  }
  
  // Generic truncation
  return `${ensName.slice(0, maxLength - 3)}...`;
}

/**
 * Check if string is valid ENS name format
 * @param input String to check
 * @returns true if valid ENS format
 */
export function isENSName(input: string): boolean {
  // Basic ENS validation: must end with .eth or other TLD, no spaces
  return /^[a-z0-9-]+\.[a-z]+$/i.test(input);
}
