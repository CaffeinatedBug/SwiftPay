import { YellowClient, YellowChannel, YellowPayment } from './YellowClient';
import { EventEmitter } from 'events';

export interface ClearedPayment {
  id: string;
  userId: string;
  merchantId: string;
  amount: string;
  channelId: string;
  timestamp: number;
  status: 'cleared' | 'settling' | 'settled';
}

export class YellowHub extends EventEmitter {
  private client: YellowClient;
  private userChannels: Map<string, string> = new Map(); // userId -> channelId
  private merchantChannels: Map<string, string> = new Map(); // merchantId -> channelId
  private clearedPayments: Map<string, ClearedPayment[]> = new Map(); // merchantId -> payments[]
  private isInitialized = false;

  constructor(wsUrl: string, hubPrivateKey: string) {
    super();
    this.client = new YellowClient(wsUrl, hubPrivateKey);

    // Forward client events
    this.client.on('connected', () => this.emit('connected'));
    this.client.on('disconnected', () => this.emit('disconnected'));
    this.client.on('error', (error) => this.emit('error', error));
    this.client.on('payment', (payment) => this.handleIncomingPayment(payment));
    this.client.on('channel_opened', (channel) => this.emit('channel_opened', channel));
    this.client.on('channel_updated', (channel) => this.emit('channel_updated', channel));
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Yellow Hub...');
      
      await this.client.connect();
      
      // Authenticate hub
      const wallet = new (await import('ethers')).Wallet(
        process.env.HUB_PRIVATE_KEY!
      );
      await this.client.authenticate(wallet.address);

      this.isInitialized = true;
      console.log('✅ Yellow Hub initialized successfully');
      
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Yellow Hub:', error);
      throw error;
    }
  }

  async openUserChannel(userId: string, initialDeposit: string = '0'): Promise<YellowChannel> {
    if (!this.isInitialized) {
      throw new Error('Yellow Hub not initialized');
    }

    // Check if user already has a channel
    const existingChannelId = this.userChannels.get(userId);
    if (existingChannelId) {
      const channel = this.client.getChannel(existingChannelId);
      if (channel && channel.status === 'active') {
        console.log(`User ${userId} already has active channel: ${existingChannelId}`);
        return channel;
      }
    }

    console.log(`📖 Opening Yellow channel for user ${userId}...`);
    
    const channel = await this.client.createChannel(userId, initialDeposit);
    this.userChannels.set(userId, channel.channelId);

    console.log(`✅ Channel opened for ${userId}: ${channel.channelId}`);
    
    return channel;
  }

  async openMerchantChannel(merchantId: string, initialDeposit: string = '0'): Promise<YellowChannel> {
    if (!this.isInitialized) {
      throw new Error('Yellow Hub not initialized');
    }

    const existingChannelId = this.merchantChannels.get(merchantId);
    if (existingChannelId) {
      const channel = this.client.getChannel(existingChannelId);
      if (channel && channel.status === 'active') {
        console.log(`Merchant ${merchantId} already has active channel: ${existingChannelId}`);
        return channel;
      }
    }

    console.log(`📖 Opening Yellow channel for merchant ${merchantId}...`);
    
    const channel = await this.client.createChannel(merchantId, initialDeposit);
    this.merchantChannels.set(merchantId, channel.channelId);

    console.log(`✅ Merchant channel opened: ${channel.channelId}`);
    
    return channel;
  }

  async clearPayment(
    userId: string,
    merchantId: string,
    amount: string,
    signature: string
  ): Promise<ClearedPayment> {
    if (!this.isInitialized) {
      throw new Error('Yellow Hub not initialized');
    }

    // Get user's channel
    const userChannelId = this.userChannels.get(userId);
    if (!userChannelId) {
      throw new Error(`No active channel for user ${userId}. Please open a channel first.`);
    }

    // Ensure merchant has a channel
    let merchantChannelId = this.merchantChannels.get(merchantId);
    if (!merchantChannelId) {
      const merchantChannel = await this.openMerchantChannel(merchantId);
      merchantChannelId = merchantChannel.channelId;
    }

    console.log(`💳 Clearing payment: ${userId} -> ${merchantId}, amount: ${amount}`);

    // Execute off-chain transfer via Yellow Network
    const transferResult = await this.client.transfer(
      userChannelId,
      merchantId,
      amount
    );

    // Create cleared payment record
    const payment: ClearedPayment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      merchantId,
      amount,
      channelId: userChannelId,
      timestamp: Date.now(),
      status: 'cleared'
    };

    // Store in merchant's cleared payments
    const merchantPayments = this.clearedPayments.get(merchantId) || [];
    merchantPayments.push(payment);
    this.clearedPayments.set(merchantId, merchantPayments);

    console.log(`✅ Payment cleared instantly: ${payment.id}`);

    // Emit payment cleared event
    this.emit('payment_cleared', payment);

    return payment;
  }

  getClearedPayments(merchantId: string): ClearedPayment[] {
    return this.clearedPayments.get(merchantId) || [];
  }

  getTotalCleared(merchantId: string): number {
    const payments = this.getClearedPayments(merchantId);
    return payments.reduce((sum, p) => {
      return sum + parseFloat(p.amount);
    }, 0);
  }

  async settleMerchantPayments(merchantId: string): Promise<ClearedPayment[]> {
    const payments = this.getClearedPayments(merchantId);
    
    if (payments.length === 0) {
      throw new Error(`No cleared payments for merchant ${merchantId}`);
    }

    console.log(`💰 Settling ${payments.length} payments for merchant ${merchantId}...`);

    // Mark all as settling
    payments.forEach(p => p.status = 'settling');

    // Get merchant channel
    const merchantChannelId = this.merchantChannels.get(merchantId);
    if (!merchantChannelId) {
      throw new Error(`No channel found for merchant ${merchantId}`);
    }

    // Get final balance from Yellow
    const finalBalance = await this.client.getChannelBalance(merchantChannelId);
    
    console.log(`Final merchant balance in Yellow: ${finalBalance}`);

    // Clear the settled payments
    this.clearedPayments.delete(merchantId);

    // Mark as settled
    payments.forEach(p => p.status = 'settled');

    this.emit('payments_settled', {
      merchantId,
      payments,
      totalAmount: this.sumPayments(payments)
    });

    return payments;
  }

  private handleIncomingPayment(payment: any): void {
    console.log('💰 Incoming payment detected:', payment);
    this.emit('incoming_payment', payment);
  }

  private sumPayments(payments: ClearedPayment[]): string {
    const total = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return total.toFixed(2);
  }

  async getUserChannelBalance(userId: string): Promise<string> {
    const channelId = this.userChannels.get(userId);
    if (!channelId) {
      throw new Error(`No channel for user ${userId}`);
    }

    return await this.client.getChannelBalance(channelId);
  }

  async getMerchantChannelBalance(merchantId: string): Promise<string> {
    const channelId = this.merchantChannels.get(merchantId);
    if (!channelId) {
      throw new Error(`No channel for merchant ${merchantId}`);
    }

    return await this.client.getChannelBalance(channelId);
  }

  async closeUserChannel(userId: string): Promise<void> {
    const channelId = this.userChannels.get(userId);
    if (!channelId) {
      throw new Error(`No channel for user ${userId}`);
    }

    await this.client.closeChannel(channelId);
    this.userChannels.delete(userId);
    
    console.log(`✅ Closed channel for user ${userId}`);
  }

  async closeMerchantChannel(merchantId: string): Promise<void> {
    const channelId = this.merchantChannels.get(merchantId);
    if (!channelId) {
      throw new Error(`No channel for merchant ${merchantId}`);
    }

    await this.client.closeChannel(channelId);
    this.merchantChannels.delete(merchantId);
    
    console.log(`✅ Closed channel for merchant ${merchantId}`);
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      isConnected: this.client.isConnected(),
      activeUserChannels: this.userChannels.size,
      activeMerchantChannels: this.merchantChannels.size,
      totalClearedPayments: Array.from(this.clearedPayments.values())
        .reduce((sum, payments) => sum + payments.length, 0),
      merchants: Array.from(this.clearedPayments.keys()).map(merchantId => ({
        merchantId,
        paymentsCount: this.clearedPayments.get(merchantId)?.length || 0,
        totalCleared: this.getTotalCleared(merchantId)
      }))
    };
  }

  disconnect(): void {
    this.client.disconnect();
    this.isInitialized = false;
    this.userChannels.clear();
    this.merchantChannels.clear();
    this.clearedPayments.clear();
  }
}
