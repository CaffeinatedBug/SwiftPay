/**
 * Arc Vault Service
 * Handles deposits to SwiftPayVault on Arc Testnet
 */

import { createPublicClient, createWalletClient, http, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';

// Define Arc Testnet chain
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Arc',
    symbol: 'ARC',
  },
  rpcUrls: {
    default: {
      http: [process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'],
    },
    public: {
      http: [process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Arc Explorer',
      url: 'https://testnet-explorer.arc.network',
    },
  },
  testnet: true,
});

// SwiftPayVault ABI (minimal for deposits)
const VAULT_ABI = [
  {
    inputs: [
      { name: 'settlementId', type: 'bytes32' },
      { name: 'merchant', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'receiveSettlement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'settlementId', type: 'bytes32' },
      { name: 'merchant', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'receiveDirectSettlement',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'merchant', type: 'address' },
      { name: 'token', type: 'address' },
    ],
    name: 'getBalance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// ERC20 ABI (minimal for approve)
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface SettlementResult {
  success: boolean;
  txHash?: string;
  settlementId: string;
  merchant: string;
  amount: string;
  error?: string;
}

export class ArcVaultService {
  private publicClient;
  private walletClient;
  private account;
  private vaultAddress: string;
  private usdcAddress: string;

  constructor(private hubPrivateKey: string) {
    this.account = privateKeyToAccount(hubPrivateKey as `0x${string}`);

    this.publicClient = createPublicClient({
      chain: arcTestnet,
      transport: http(),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: arcTestnet,
      transport: http(),
    });

    this.vaultAddress = process.env.VAULT_ADDRESS || '';
    this.usdcAddress = process.env.ARC_USDC_ADDRESS || '';

    if (!this.vaultAddress) {
      console.warn('⚠️ VAULT_ADDRESS not set in environment');
    }
    if (!this.usdcAddress) {
      console.warn('⚠️ ARC_USDC_ADDRESS not set in environment');
    }
  }

  /**
   * Deposit settlement to vault
   */
  async depositSettlement(params: {
    settlementId: string;
    merchant: string;
    amount: string; // Human readable amount
  }): Promise<SettlementResult> {
    const { settlementId, merchant, amount } = params;

    try {
      console.log(`💰 Depositing ${amount} USDC to vault for merchant ${merchant}`);

      if (!this.vaultAddress) {
        throw new Error('Vault address not configured');
      }

      // Convert amount to bigint (USDC has 6 decimals)
      const amountBigInt = parseUnits(amount, 6);

      // Generate settlement ID hash
      const settlementIdHash = `0x${Buffer.from(settlementId).toString('hex').padEnd(64, '0')}` as `0x${string}`;

      // Check and approve USDC if needed
      console.log('📝 Checking USDC allowance...');
      const allowance = await this.publicClient.readContract({
        address: this.usdcAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [this.account.address, this.vaultAddress as `0x${string}`],
      });

      if (allowance < amountBigInt) {
        console.log('📝 Approving USDC...');
        const approveTx = await this.walletClient.writeContract({
          address: this.usdcAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [this.vaultAddress as `0x${string}`, amountBigInt],
        });

        console.log('⏳ Waiting for approval confirmation...');
        await this.publicClient.waitForTransactionReceipt({ hash: approveTx });
        console.log('✅ USDC approved');
      }

      // Deposit to vault
      console.log('💎 Depositing to vault...');
      const txHash = await this.walletClient.writeContract({
        address: this.vaultAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'receiveSettlement',
        args: [settlementIdHash, merchant as `0x${string}`, this.usdcAddress as `0x${string}`, amountBigInt],
      });

      console.log('⏳ Waiting for settlement confirmation...');
      await this.publicClient.waitForTransactionReceipt({ hash: txHash });

      console.log('✅ Settlement deposited to vault!');

      return {
        success: true,
        txHash,
        settlementId,
        merchant,
        amount,
      };
    } catch (error: any) {
      console.error('❌ Vault deposit failed:', error.message);
      return {
        success: false,
        settlementId,
        merchant,
        amount,
        error: error.message,
      };
    }
  }

  /**
   * Get merchant balance in vault
   */
  async getMerchantBalance(merchant: string): Promise<string> {
    try {
      const balance = await this.publicClient.readContract({
        address: this.vaultAddress as `0x${string}`,
        abi: VAULT_ABI,
        functionName: 'getBalance',
        args: [merchant as `0x${string}`, this.usdcAddress as `0x${string}`],
      });

      // Convert from bigint to human readable
      return (Number(balance) / 1e6).toFixed(2);
    } catch (error: any) {
      console.error('Failed to get merchant balance:', error.message);
      return '0';
    }
  }

  /**
   * Check if vault is configured
   */
  isConfigured(): boolean {
    return !!this.vaultAddress && !!this.usdcAddress;
  }
}
