import { CircleApi, Configuration } from '@circle-fin/core';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';

export interface CircleWallet {
  id: string;
  address: string;
  blockchain: string;
  entityId?: string;
}

export interface TransferRequest {
  amount: string;
  destinationAddress: string;
  tokenId?: string;
  walletId: string;
}

export interface USDCBalance {
  walletId: string;
  amount: string;
  blockchain: string;
}

/**
 * Circle Gateway Integration for SwiftPay
 * Handles USDC operations, wallet management, and settlement flows
 */
export class CircleGatewayService {
  private circleApi: CircleApi;
  private apiKey: string;
  private environment: 'sandbox' | 'production';

  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.apiKey = apiKey;
    this.environment = environment;

    const configuration = new Configuration({
      apiKey: this.apiKey,
      basePath: environment === 'production' 
        ? 'https://api.circle.com'
        : 'https://api-sandbox.circle.com'
    });

    this.circleApi = new CircleApi(configuration);
    logger.info('Circle Gateway Service initialized', { environment });
  }

  /**
   * Create a new wallet for a merchant
   * @param merchantId - Unique merchant identifier
   * @param blockchain - Blockchain for the wallet (default: arc-sepolia)
   */
  async createMerchantWallet(merchantId: string, blockchain: string = 'arc-sepolia'): Promise<CircleWallet> {
    try {
      logger.info('Creating merchant wallet', { merchantId, blockchain });

      const walletRequest = {
        idempotencyKey: `merchant-${merchantId}-${Date.now()}`,
        description: `SwiftPay merchant wallet for ${merchantId}`,
        blockchain: blockchain
      };

      const response = await this.circleApi.createWallet(walletRequest);
      const wallet = response.data?.data;

      if (!wallet) {
        throw new Error('Failed to create wallet - no wallet data returned');
      }

      const circleWallet: CircleWallet = {
        id: wallet.walletId || '',
        address: wallet.address || '',
        blockchain: wallet.blockchain || blockchain,
        entityId: wallet.entityId
      };

      logger.info('Merchant wallet created successfully', { 
        walletId: circleWallet.id,
        address: circleWallet.address,
        merchantId 
      });

      return circleWallet;
    } catch (error) {
      logger.error('Failed to create merchant wallet', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        merchantId,
        blockchain 
      });
      throw error;
    }
  }

  /**
   * Get USDC balance for a wallet
   * @param walletId - Circle wallet ID
   */
  async getUSDCBalance(walletId: string): Promise<USDCBalance> {
    try {
      logger.debug('Fetching USDC balance', { walletId });

      const response = await this.circleApi.getWalletBalance(walletId);
      const balances = response.data?.data?.tokenBalances || [];

      // Find USDC balance (tokenId varies by network)
      const usdcBalance = balances.find(balance => 
        balance.token?.symbol === 'USDC' || 
        balance.token?.name?.includes('USDC')
      );

      const balance: USDCBalance = {
        walletId,
        amount: usdcBalance?.amount || '0',
        blockchain: usdcBalance?.token?.blockchain || 'unknown'
      };

      logger.debug('USDC balance retrieved', balance);
      return balance;
    } catch (error) {
      logger.error('Failed to get USDC balance', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId 
      });
      throw error;
    }
  }

  /**
   * Transfer USDC from vault to merchant wallet
   * @param transferRequest - Transfer details
   */
  async transferUSDC(transferRequest: TransferRequest): Promise<string> {
    try {
      logger.info('Initiating USDC transfer', {
        walletId: transferRequest.walletId,
        amount: transferRequest.amount,
        destination: transferRequest.destinationAddress
      });

      const transfer = {
        idempotencyKey: `transfer-${Date.now()}-${Math.random()}`,
        source: {
          type: 'wallet' as const,
          id: transferRequest.walletId
        },
        destination: {
          type: 'blockchain' as const,
          address: transferRequest.destinationAddress,
          chain: 'ETH' // This will need to be adjusted based on the blockchain
        },
        amount: {
          amount: transferRequest.amount,
          currency: 'USD'
        }
      };

      const response = await this.circleApi.createTransfer(transfer);
      const transferId = response.data?.data?.id;

      if (!transferId) {
        throw new Error('Failed to initiate transfer - no transfer ID returned');
      }

      logger.info('USDC transfer initiated', {
        transferId,
        amount: transferRequest.amount,
        destination: transferRequest.destinationAddress
      });

      return transferId;
    } catch (error) {
      logger.error('Failed to transfer USDC', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transferRequest
      });
      throw error;
    }
  }

  /**
   * Get transfer status
   * @param transferId - Circle transfer ID
   */
  async getTransferStatus(transferId: string) {
    try {
      const response = await this.circleApi.getTransfer(transferId);
      const transfer = response.data?.data;

      logger.debug('Transfer status retrieved', {
        transferId,
        status: transfer?.status,
        amount: transfer?.amount?.amount
      });

      return transfer;
    } catch (error) {
      logger.error('Failed to get transfer status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transferId
      });
      throw error;
    }
  }

  /**
   * List all wallets for the account
   */
  async listWallets(): Promise<CircleWallet[]> {
    try {
      const response = await this.circleApi.listWallets();
      const wallets = response.data?.data || [];

      const circleWallets: CircleWallet[] = wallets.map(wallet => ({
        id: wallet.walletId || '',
        address: wallet.address || '',
        blockchain: wallet.blockchain || 'unknown',
        entityId: wallet.entityId
      }));

      logger.debug('Wallets listed', { count: circleWallets.length });
      return circleWallets;
    } catch (error) {
      logger.error('Failed to list wallets', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get wallet by ID
   * @param walletId - Circle wallet ID
   */
  async getWallet(walletId: string): Promise<CircleWallet | null> {
    try {
      const response = await this.circleApi.getWallet(walletId);
      const wallet = response.data?.data;

      if (!wallet) {
        return null;
      }

      const circleWallet: CircleWallet = {
        id: wallet.walletId || '',
        address: wallet.address || '',
        blockchain: wallet.blockchain || 'unknown',
        entityId: wallet.entityId
      };

      logger.debug('Wallet retrieved', { walletId, address: circleWallet.address });
      return circleWallet;
    } catch (error) {
      logger.error('Failed to get wallet', {
        error: error instanceof Error ? error.message : 'Unknown error',
        walletId
      });
      return null;
    }
  }

  /**
   * Webhook handler for Circle events
   * @param payload - Webhook payload from Circle
   */
  handleWebhook(payload: any): void {
    try {
      const { eventType, data } = payload;
      
      logger.info('Circle webhook received', { 
        eventType,
        id: data?.id,
        status: data?.status 
      });

      switch (eventType) {
        case 'transfers':
          this.handleTransferWebhook(data);
          break;
        case 'wallets':
          this.handleWalletWebhook(data);
          break;
        default:
          logger.warn('Unknown webhook event type', { eventType });
      }
    } catch (error) {
      logger.error('Failed to handle Circle webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
        payload
      });
    }
  }

  private handleTransferWebhook(data: any): void {
    const { id, status, amount, destination } = data;
    
    logger.info('Transfer webhook processed', {
      transferId: id,
      status,
      amount: amount?.amount,
      currency: amount?.currency,
      destination: destination?.address
    });

    // Emit event for settlement completion
    // This would integrate with your event system
  }

  private handleWalletWebhook(data: any): void {
    const { walletId, address, blockchain } = data;
    
    logger.info('Wallet webhook processed', {
      walletId,
      address,
      blockchain
    });
  }

  /**
   * Generate a settlement transaction for Arc
   * This integrates with the SwiftPayVault contract
   */
  async generateSettlementTransaction(
    vaultAddress: string,
    merchantAddress: string,
    amount: string,
    settlementId: string
  ): Promise<ethers.TransactionRequest> {
    try {
      // SwiftPayVault ABI fragment for receiveSettlement function
      const vaultInterface = new ethers.Interface([
        'function receiveSettlement(bytes32 settlementId, address merchant, address token, uint256 amount) external'
      ]);

      // USDC contract address on Arc (this would be from config)
      const USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238'; // Example USDC address on Arc

      const txData = vaultInterface.encodeFunctionData('receiveSettlement', [
        settlementId,
        merchantAddress,
        USDC_ADDRESS,
        ethers.parseUnits(amount, 6) // USDC has 6 decimals
      ]);

      const transaction: ethers.TransactionRequest = {
        to: vaultAddress,
        data: txData,
        gasLimit: 100000 // This should be estimated properly
      };

      logger.info('Settlement transaction generated', {
        vaultAddress,
        merchantAddress,
        amount,
        settlementId
      });

      return transaction;
    } catch (error) {
      logger.error('Failed to generate settlement transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        vaultAddress,
        merchantAddress,
        amount,
        settlementId
      });
      throw error;
    }
  }
}