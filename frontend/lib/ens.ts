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

import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { normalize } from 'viem/ens';
import { ENS_TEXT_KEYS } from './constants';

// SwiftPay ENS Record interface
export interface SwiftPayENSRecord {
  ensName: string;
  endpoint: string | null;
  vault: string | null;
  chain: string;
  schedule: string;
  resolverAddress: string | null;
}

// Create clients for mainnet and sepolia
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ENS_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
});

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.NEXT_PUBLIC_ENS_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
});

const publicClient = mainnetClient;

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
      client.getEnsText({ name: normalizedName, key: 'swiftpay.endpoint' }),
      client.getEnsText({ name: normalizedName, key: 'swiftpay.vault' }),
      client.getEnsText({ name: normalizedName, key: ENS_TEXT_KEYS.SETTLEMENT_CHAIN }),
      client.getEnsText({ name: normalizedName, key: ENS_TEXT_KEYS.SETTLEMENT_SCHEDULE }),
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

/**
 * Resolve ENS name to address
 * @param name ENS name
 * @returns Ethereum address or null
 */
export async function resolveENSName(name: string): Promise<string | null> {
  try {
    const address = await publicClient.getEnsAddress({
      name: normalize(name),
    });
    return address;
  } catch {
    return null;
  }
}

/**
 * Get ENS avatar
 * @param name ENS name
 * @returns ENS avatar or null
 */
export async function getENSAvatar(name: string): Promise<string | null> {
  try {
    const avatar = await publicClient.getEnsAvatar({
      name: normalize(name),
    });
    return avatar;
  } catch {
    return null;
  }
}

/**
 * Get ENS text record
 * @param name ENS name
 * @param key Text record key
 * @returns Text record value or null
 */
export async function getENSTextRecord(name: string, key: string): Promise<string | null> {
  try {
    const value = await publicClient.getEnsText({
      name: normalize(name),
      key,
    });
    return value;
  } catch {
    return null;
  }
}

/**
 * Get merchant profile
 * @param ensName ENS name
 * @returns Merchant profile object
 */
export async function getMerchantProfile(ensName: string) {
  const [address, avatar, ...textRecords] = await Promise.allSettled([
    resolveENSName(ensName),
    getENSAvatar(ensName),
    ...Object.values(ENS_TEXT_KEYS).map((key) => getENSTextRecord(ensName, key)),
  ]);

  const keys = Object.keys(ENS_TEXT_KEYS);
  const profile: Record<string, string | null> = {};

  textRecords.forEach((result, i) => {
    profile[keys[i]] = result.status === 'fulfilled' ? result.value : null;
  });

  return {
    ensName,
    address: address.status === 'fulfilled' ? address.value : null,
    avatar: avatar.status === 'fulfilled' ? avatar.value : null,
    ...profile,
  };
}
