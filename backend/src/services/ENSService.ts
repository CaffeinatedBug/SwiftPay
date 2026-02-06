/**
 * ENS Service for Backend
 * Reads merchant settlement preferences from ENS text records
 */

import { createPublicClient, http } from 'viem';
import { normalize } from 'viem/ens';
import { mainnet, sepolia } from 'viem/chains';

export interface MerchantENSProfile {
  ensName: string;
  address: string;
  endpoint: string | null;
  vault: string | null;
  chain: string | null;
  schedule: 'instant' | 'daily' | 'weekly';
  settlementTime?: string;
  minPayment?: string;
  maxPayment?: string;
}

export class ENSService {
  private mainnetClient;
  private sepoliaClient;

  constructor() {
    this.mainnetClient = createPublicClient({
      chain: mainnet,
      transport: http(process.env.ENS_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo'),
    });

    this.sepoliaClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.ENS_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo'),
    });
  }

  /**
   * Get merchant profile from ENS
   */
  async getMerchantProfile(
    ensName: string,
    network: 'mainnet' | 'sepolia' = 'sepolia'
  ): Promise<MerchantENSProfile | null> {
    const client = network === 'mainnet' ? this.mainnetClient : this.sepoliaClient;

    try {
      const normalizedName = normalize(ensName);

      // Get address
      const address = await client.getEnsAddress({ name: normalizedName });
      if (!address) {
        console.warn(`No address found for ${ensName}`);
        return null;
      }

      // Get text records in parallel
      const [endpoint, vault, chain, schedule, settlementTime, minPayment, maxPayment] =
        await Promise.all([
          client.getEnsText({ name: normalizedName, key: 'swiftpay.endpoint' }),
          client.getEnsText({ name: normalizedName, key: 'swiftpay.vault' }),
          client.getEnsText({ name: normalizedName, key: 'swiftpay.chain' }),
          client.getEnsText({ name: normalizedName, key: 'swiftpay.schedule' }),
          client.getEnsText({ name: normalizedName, key: 'swiftpay.settlement.time' }),
          client.getEnsText({ name: normalizedName, key: 'swiftpay.payment.minimum' }),
          client.getEnsText({ name: normalizedName, key: 'swiftpay.payment.maximum' }),
        ]);

      return {
        ensName: normalizedName,
        address,
        endpoint,
        vault,
        chain: chain || 'arc-testnet',
        schedule: (schedule as any) || 'daily',
        settlementTime,
        minPayment,
        maxPayment,
      };
    } catch (error) {
      console.error(`Failed to get ENS profile for ${ensName}:`, error);
      return null;
    }
  }

  /**
   * Check if it's time to settle based on ENS preferences
   */
  shouldSettleNow(profile: MerchantENSProfile): boolean {
    const { schedule, settlementTime } = profile;

    switch (schedule) {
      case 'instant':
        return true;

      case 'daily':
        if (!settlementTime) return false;
        const [hour, minute] = settlementTime.split(':').map(Number);
        const now = new Date();
        return now.getUTCHours() === hour && now.getUTCMinutes() === minute;

      case 'weekly':
        if (!settlementTime) return false;
        const [weekHour, weekMinute] = settlementTime.split(':').map(Number);
        const weekNow = new Date();
        return (
          weekNow.getUTCDay() === 0 && // Sunday
          weekNow.getUTCHours() === weekHour &&
          weekNow.getUTCMinutes() === weekMinute
        );

      default:
        return false;
    }
  }

  /**
   * Reverse resolve address to ENS name
   */
  async reverseResolve(
    address: string,
    network: 'mainnet' | 'sepolia' = 'sepolia'
  ): Promise<string | null> {
    const client = network === 'mainnet' ? this.mainnetClient : this.sepoliaClient;

    try {
      const ensName = await client.getEnsName({ address: address as `0x${string}` });
      return ensName;
    } catch (error) {
      console.error(`Failed to reverse resolve ${address}:`, error);
      return null;
    }
  }
}
