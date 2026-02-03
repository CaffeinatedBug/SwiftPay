import { CircleGatewayService, CircleWallet } from './CircleGatewayService';
import { logger } from '../utils/logger';

export interface MerchantWallet {
  merchantId: string;
  walletId: string;
  address: string;
  blockchain: string;
  createdAt: Date;
  isActive: boolean;
}

export interface PayoutRequest {
  merchantId: string;
  amount: string;
  currency: 'USDC';
  settlementId: string;
  blockchain?: string;
}

export interface PayoutResult {
  payoutId: string;
  transferId: string;
  status: 'pending' | 'completed' | 'failed';
  amount: string;
  merchantWallet: MerchantWallet;
  createdAt: Date;
}

/**
 * Circle Wallets Integration for SwiftPay
 * Manages merchant wallets and automated settlement payouts
 */
export class CircleWalletsService {
  private circleGateway: CircleGatewayService;
  private merchantWallets: Map<string, MerchantWallet> = new Map();

  constructor(circleGateway: CircleGatewayService) {
    this.circleGateway = circleGateway;
    logger.info('Circle Wallets Service initialized');
  }

  /**
   * Create or retrieve merchant wallet
   * @param merchantId - Unique merchant identifier
   * @param blockchain - Target blockchain (default: arc-sepolia)
   */
  async getOrCreateMerchantWallet(
    merchantId: string, 
    blockchain: string = 'arc-sepolia'
  ): Promise<MerchantWallet> {
    try {
      // Check if merchant already has a wallet
      const existingWallet = this.merchantWallets.get(merchantId);
      if (existingWallet && existingWallet.isActive) {
        logger.debug('Using existing merchant wallet', { 
          merchantId, 
          walletId: existingWallet.walletId 
        });
        return existingWallet;
      }

      logger.info('Creating new merchant wallet', { merchantId, blockchain });

      // Create new wallet via Circle Gateway
      const circleWallet: CircleWallet = await this.circleGateway.createMerchantWallet(
        merchantId, 
        blockchain
      );

      // Create merchant wallet record
      const merchantWallet: MerchantWallet = {
        merchantId,
        walletId: circleWallet.id,
        address: circleWallet.address,
        blockchain: circleWallet.blockchain,
        createdAt: new Date(),
        isActive: true
      };

      // Store in memory (in production, this would be stored in a database)
      this.merchantWallets.set(merchantId, merchantWallet);

      logger.info('Merchant wallet created successfully', {
        merchantId,
        walletId: merchantWallet.walletId,
        address: merchantWallet.address
      });

      return merchantWallet;
    } catch (error) {
      logger.error('Failed to get or create merchant wallet', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId,
        blockchain
      });
      throw error;
    }
  }

  /**
   * Execute automated payout to merchant
   * @param payoutRequest - Payout details
   */
  async executePayout(payoutRequest: PayoutRequest): Promise<PayoutResult> {
    try {
      const { merchantId, amount, settlementId } = payoutRequest;
      
      logger.info('Executing merchant payout', {
        merchantId,
        amount,
        settlementId
      });

      // Get or create merchant wallet
      const merchantWallet = await this.getOrCreateMerchantWallet(
        merchantId,
        payoutRequest.blockchain
      );

      // Execute USDC transfer via Circle Gateway
      const transferId = await this.circleGateway.transferUSDC({
        walletId: merchantWallet.walletId,
        amount,
        destinationAddress: merchantWallet.address,
        tokenId: 'USDC'
      });

      // Create payout result
      const payoutResult: PayoutResult = {
        payoutId: `payout-${settlementId}-${Date.now()}`,
        transferId,
        status: 'pending',
        amount,
        merchantWallet,
        createdAt: new Date()
      };

      logger.info('Payout initiated successfully', {
        payoutId: payoutResult.payoutId,
        transferId,
        merchantId,
        amount
      });

      // In a real implementation, you would:
      // 1. Store payout record in database
      // 2. Set up monitoring for transfer completion
      // 3. Update merchant notification system

      return payoutResult;
    } catch (error) {
      logger.error('Failed to execute payout', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payoutRequest
      });
      throw error;
    }
  }

  /**
   * Check payout status
   * @param payoutId - Payout ID to check
   */
  async getPayoutStatus(payoutId: string): Promise<PayoutResult | null> {
    try {
      // In a real implementation, this would query the database
      // For now, we'll demonstrate the structure
      
      logger.debug('Checking payout status', { payoutId });

      // This would be retrieved from your database
      return null;
    } catch (error) {
      logger.error('Failed to get payout status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payoutId
      });
      return null;
    }
  }

  /**
   * Get merchant wallet balance
   * @param merchantId - Merchant ID
   */
  async getMerchantBalance(merchantId: string): Promise<string> {
    try {
      const merchantWallet = this.merchantWallets.get(merchantId);
      
      if (!merchantWallet) {
        logger.warn('No wallet found for merchant', { merchantId });
        return '0';
      }

      const balance = await this.circleGateway.getUSDCBalance(merchantWallet.walletId);
      
      logger.debug('Merchant balance retrieved', {
        merchantId,
        balance: balance.amount
      });

      return balance.amount;
    } catch (error) {
      logger.error('Failed to get merchant balance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });
      return '0';
    }
  }

  /**
   * List all merchant wallets
   */
  async listMerchantWallets(): Promise<MerchantWallet[]> {
    try {
      const wallets = Array.from(this.merchantWallets.values());
      
      logger.debug('Listed merchant wallets', { count: wallets.length });
      
      return wallets.filter(wallet => wallet.isActive);
    } catch (error) {
      logger.error('Failed to list merchant wallets', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  /**
   * Deactivate merchant wallet
   * @param merchantId - Merchant ID
   */
  async deactivateMerchantWallet(merchantId: string): Promise<boolean> {
    try {
      const merchantWallet = this.merchantWallets.get(merchantId);
      
      if (!merchantWallet) {
        logger.warn('No wallet found to deactivate', { merchantId });
        return false;
      }

      merchantWallet.isActive = false;
      this.merchantWallets.set(merchantId, merchantWallet);

      logger.info('Merchant wallet deactivated', {
        merchantId,
        walletId: merchantWallet.walletId
      });

      return true;
    } catch (error) {
      logger.error('Failed to deactivate merchant wallet', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId
      });
      return false;
    }
  }

  /**
   * Process settlement completion callback
   * This is called when a settlement is completed on Arc
   */
  async processSettlementCompletion(
    settlementId: string,
    merchantId: string,
    amount: string
  ): Promise<PayoutResult> {
    try {
      logger.info('Processing settlement completion for payout', {
        settlementId,
        merchantId,
        amount
      });

      // Execute immediate payout to merchant wallet
      const payoutRequest: PayoutRequest = {
        merchantId,
        amount,
        currency: 'USDC',
        settlementId,
        blockchain: 'arc-sepolia'
      };

      const payoutResult = await this.executePayout(payoutRequest);

      logger.info('Settlement payout processed successfully', {
        settlementId,
        payoutId: payoutResult.payoutId,
        merchantId
      });

      return payoutResult;
    } catch (error) {
      logger.error('Failed to process settlement completion', {
        error: error instanceof Error ? error.message : 'Unknown error',
        settlementId,
        merchantId,
        amount
      });
      throw error;
    }
  }

  /**
   * Get merchant wallet info by merchant ID
   * @param merchantId - Merchant ID
   */
  getMerchantWallet(merchantId: string): MerchantWallet | null {
    return this.merchantWallets.get(merchantId) || null;
  }

  /**
   * Update merchant wallet
   * @param merchantId - Merchant ID
   * @param updates - Partial wallet updates
   */
  updateMerchantWallet(
    merchantId: string, 
    updates: Partial<MerchantWallet>
  ): boolean {
    try {
      const existingWallet = this.merchantWallets.get(merchantId);
      
      if (!existingWallet) {
        logger.warn('Cannot update non-existent merchant wallet', { merchantId });
        return false;
      }

      const updatedWallet = { ...existingWallet, ...updates };
      this.merchantWallets.set(merchantId, updatedWallet);

      logger.debug('Merchant wallet updated', {
        merchantId,
        updates: Object.keys(updates)
      });

      return true;
    } catch (error) {
      logger.error('Failed to update merchant wallet', {
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId,
        updates
      });
      return false;
    }
  }
}