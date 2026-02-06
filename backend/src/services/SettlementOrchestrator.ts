/**
 * Settlement Orchestrator
 * Coordinates the complete settlement flow:
 * 1. Read ENS preferences
 * 2. Aggregate cleared payments from Yellow
 * 3. Close Yellow channels
 * 4. Bridge USDC via Avail to Arc
 * 5. Deposit to SwiftPayVault
 * 6. Notify merchant
 */

import { EventEmitter } from 'events';
import { ENSService, type MerchantENSProfile } from './ENSService';
import { AvailBridgeService } from './AvailBridgeService';
import { ArcVaultService } from './ArcVaultService';
import type { YellowNetworkHub } from '../yellow/YellowNetworkHub';

export interface SettlementJob {
  id: string;
  merchantId: string;
  merchantENS?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  stage:
    | 'init'
    | 'reading_ens'
    | 'aggregating_payments'
    | 'closing_yellow'
    | 'bridging'
    | 'depositing'
    | 'notifying'
    | 'complete';
  totalAmount: string;
  paymentsCount: number;
  error?: string;
  startTime: number;
  endTime?: number;
  txHashes: {
    yellowClose?: string;
    availBridge?: string;
    arcDeposit?: string;
  };
}

export class SettlementOrchestrator extends EventEmitter {
  private ensService: ENSService;
  private availBridge: AvailBridgeService;
  private arcVault: ArcVaultService;
  private activeJobs: Map<string, SettlementJob> = new Map();
  private isInitialized = false;

  constructor(
    private yellowHub: YellowNetworkHub,
    private hubPrivateKey: string
  ) {
    super();
    this.ensService = new ENSService();
    this.availBridge = new AvailBridgeService(hubPrivateKey);
    this.arcVault = new ArcVaultService(hubPrivateKey);
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initializing Settlement Orchestrator...');

      // Initialize Avail Bridge
      await this.availBridge.initialize();

      this.isInitialized = true;
      console.log('✅ Settlement Orchestrator initialized');
    } catch (error: any) {
      console.error('❌ Failed to initialize Settlement Orchestrator:', error.message);
      throw error;
    }
  }

  /**
   * Check if merchant should be settled based on ENS preferences
   */
  async shouldSettleMerchant(merchantId: string): Promise<boolean> {
    try {
      // Try to get ENS name for merchant
      const ensName = await this.ensService.reverseResolve(merchantId, 'sepolia');

      if (!ensName) {
        // No ENS name, check if there are cleared payments
        const merchantChannel = this.yellowHub.getMerchantChannel(merchantId);
        return merchantChannel ? merchantChannel.balance > 0n : false;
      }

      // Get ENS profile
      const profile = await this.ensService.getMerchantProfile(ensName, 'sepolia');
      if (!profile) return false;

      // Check schedule
      return this.ensService.shouldSettleNow(profile);
    } catch (error) {
      console.error(`Error checking settlement for ${merchantId}:`, error);
      return false;
    }
  }

  /**
   * Settle a merchant (main orchestration function)
   */
  async settleMerchant(merchantId: string, forceSettle = false): Promise<SettlementJob> {
    const jobId = `settlement_${Date.now()}_${merchantId.slice(0, 8)}`;

    const job: SettlementJob = {
      id: jobId,
      merchantId,
      status: 'pending',
      stage: 'init',
      totalAmount: '0',
      paymentsCount: 0,
      startTime: Date.now(),
      txHashes: {},
    };

    this.activeJobs.set(jobId, job);
    this.emit('job_created', job);

    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      job.status = 'processing';
      this.updateJob(job);

      // Stage 1: Read ENS preferences
      job.stage = 'reading_ens';
      this.updateJob(job);

      const ensName = await this.ensService.reverseResolve(merchantId, 'sepolia');
      if (ensName) {
        job.merchantENS = ensName;
        console.log(`📛 Merchant ENS: ${ensName}`);

        const profile = await this.ensService.getMerchantProfile(ensName, 'sepolia');
        if (profile && !forceSettle) {
          if (!this.ensService.shouldSettleNow(profile)) {
            throw new Error(`Not time to settle. Schedule: ${profile.schedule}`);
          }
        }
      }

      // Stage 2: Aggregate cleared payments from Yellow
      job.stage = 'aggregating_payments';
      this.updateJob(job);

      const merchantChannel = this.yellowHub.getMerchantChannel(merchantId);
      if (!merchantChannel) {
        throw new Error('No merchant channel found');
      }

      if (merchantChannel.balance === 0n) {
        throw new Error('No balance to settle');
      }

      job.totalAmount = (Number(merchantChannel.balance) / 1e6).toFixed(2);
      job.paymentsCount = 1; // Simplified for now
      console.log(`💰 Total to settle: ${job.totalAmount} USDC`);

      // Stage 3: Close Yellow channel (settle on-chain)
      job.stage = 'closing_yellow';
      this.updateJob(job);

      console.log('🔒 Settling Yellow channel...');
      const yellowTxHash = await this.yellowHub.settleMerchantChannel(merchantId);
      job.txHashes.yellowClose = yellowTxHash;
      console.log(`✅ Yellow channel settled: ${yellowTxHash}`);

      // Stage 4: Bridge USDC to Arc via Avail
      job.stage = 'bridging';
      this.updateJob(job);

      console.log('🌉 Bridging USDC to Arc...');
      const bridgeResult = await this.availBridge.bridgeWithRetry({
        amount: job.totalAmount,
        fromChainId: 11155111, // Sepolia
        token: 'USDC',
      });

      if (!bridgeResult.success) {
        throw new Error(`Bridge failed: ${bridgeResult.error}`);
      }

      job.txHashes.availBridge = bridgeResult.txHash;
      console.log(`✅ Bridge successful: ${bridgeResult.txHash}`);

      // Stage 5: Deposit to Arc Vault
      job.stage = 'depositing';
      this.updateJob(job);

      if (this.arcVault.isConfigured()) {
        console.log('💎 Depositing to Arc Vault...');
        const depositResult = await this.arcVault.depositSettlement({
          settlementId: jobId,
          merchant: merchantId,
          amount: job.totalAmount,
        });

        if (!depositResult.success) {
          console.warn(`⚠️ Vault deposit failed: ${depositResult.error}`);
          // Don't fail the whole job, just log it
        } else {
          job.txHashes.arcDeposit = depositResult.txHash;
          console.log(`✅ Vault deposit successful: ${depositResult.txHash}`);
        }
      } else {
        console.warn('⚠️ Arc Vault not configured, skipping deposit');
      }

      // Stage 6: Notify merchant
      job.stage = 'notifying';
      this.updateJob(job);

      this.emit('settlement_complete', {
        merchantId,
        merchantENS: job.merchantENS,
        amount: job.totalAmount,
        txHashes: job.txHashes,
      });

      // Complete
      job.stage = 'complete';
      job.status = 'completed';
      job.endTime = Date.now();
      this.updateJob(job);

      console.log(`✅ Settlement complete for ${merchantId}`);
      console.log(`   Amount: ${job.totalAmount} USDC`);
      console.log(`   Duration: ${((job.endTime - job.startTime) / 1000).toFixed(2)}s`);

      return job;
    } catch (error: any) {
      console.error(`❌ Settlement failed for ${merchantId}:`, error.message);

      job.status = 'failed';
      job.error = error.message;
      job.endTime = Date.now();
      this.updateJob(job);

      this.emit('settlement_failed', {
        merchantId,
        error: error.message,
        job,
      });

      throw error;
    }
  }

  /**
   * Settle all merchants that are due
   */
  async settleAllDue(): Promise<SettlementJob[]> {
    console.log('🔍 Checking all merchants for settlement...');

    const results: SettlementJob[] = [];

    // Get all merchant channels from Yellow Hub
    // Note: This is a simplified version. In production, you'd track all merchants
    const stats = this.yellowHub.getStats();
    console.log(`Found ${stats.activeMerchantChannels} active merchant channels`);

    // For now, we'll need to track merchants separately
    // This is a placeholder for the actual implementation
    console.log('⚠️ Auto-settlement requires merchant tracking system');

    return results;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): SettlementJob | undefined {
    return this.activeJobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs(): SettlementJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get active jobs
   */
  getActiveJobs(): SettlementJob[] {
    return Array.from(this.activeJobs.values()).filter(
      (job) => job.status === 'pending' || job.status === 'processing'
    );
  }

  /**
   * Update job and emit event
   */
  private updateJob(job: SettlementJob): void {
    this.activeJobs.set(job.id, job);
    this.emit('job_updated', job);
  }

  /**
   * Get statistics
   */
  getStats() {
    const jobs = Array.from(this.activeJobs.values());
    return {
      totalJobs: jobs.length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
      active: jobs.filter((j) => j.status === 'processing').length,
      pending: jobs.filter((j) => j.status === 'pending').length,
      totalSettled: jobs
        .filter((j) => j.status === 'completed')
        .reduce((sum, j) => sum + parseFloat(j.totalAmount), 0)
        .toFixed(2),
    };
  }
}
