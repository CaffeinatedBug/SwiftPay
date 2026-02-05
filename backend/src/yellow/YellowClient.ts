import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { ethers } from 'ethers';

export interface YellowChannel {
  channelId: string;
  userId: string;
  balance: string;
  status: 'opening' | 'active' | 'closing' | 'closed';
  nonce: number;
}

export interface YellowPayment {
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  signature: string;
}

export class YellowClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private channels: Map<string, YellowChannel> = new Map();
  private pendingRequests: Map<string, { resolve: Function; reject: Function }> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private sessionId: string | null = null;
  private isAuthenticated = false;

  constructor(
    private wsUrl: string = 'wss://clearnet.yellow.com/ws',
    private hubPrivateKey: string
  ) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
          console.log('✅ Connected to Yellow Network ClearNode');
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        });

        this.ws.on('message', (data: WebSocket.Data) => {
          this.handleMessage(data.toString());
        });

        this.ws.on('error', (error) => {
          console.error('❌ Yellow WebSocket error:', error);
          this.emit('error', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('⚠️  Yellow WebSocket closed');
          this.isAuthenticated = false;
          this.emit('disconnected');
          this.attemptReconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  private handleMessage(message: string): void {
    try {
      const response = JSON.parse(message);
      
      // Handle authentication challenge
      if (response.method === 'auth_challenge') {
        this.handleAuthChallenge(response.params);
        return;
      }

      // Handle authentication success
      if (response.method === 'auth_success') {
        this.isAuthenticated = true;
        this.sessionId = response.params?.sessionId;
        console.log('✅ Yellow authentication successful');
        this.emit('authenticated', response.params);
        return;
      }

      // Handle channel events
      if (response.method === 'channel_opened') {
        this.handleChannelOpened(response.params);
        return;
      }

      if (response.method === 'channel_updated') {
        this.handleChannelUpdated(response.params);
        return;
      }

      if (response.method === 'payment_received') {
        this.handlePaymentReceived(response.params);
        return;
      }

      // Handle RPC responses
      if (response.id && this.pendingRequests.has(response.id)) {
        const { resolve, reject } = this.pendingRequests.get(response.id)!;
        this.pendingRequests.delete(response.id);

        if (response.error) {
          reject(new Error(response.error.message || 'RPC Error'));
        } else {
          resolve(response.result);
        }
      }

      this.emit('message', response);
    } catch (error) {
      console.error('Failed to parse Yellow message:', error);
    }
  }

  private async handleAuthChallenge(params: any): Promise<void> {
    try {
      const wallet = new ethers.Wallet(this.hubPrivateKey);
      const message = params.challenge;
      
      // Sign the challenge
      const signature = await wallet.signMessage(message);
      
      // Send auth response
      this.sendRequest('auth_response', {
        address: wallet.address,
        signature,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Auth challenge failed:', error);
      this.emit('auth_error', error);
    }
  }

  private handleChannelOpened(params: any): void {
    const channel: YellowChannel = {
      channelId: params.channelId,
      userId: params.userId,
      balance: params.balance || '0',
      status: 'active',
      nonce: 0
    };
    
    this.channels.set(params.channelId, channel);
    console.log(`✅ Channel opened: ${params.channelId}`);
    this.emit('channel_opened', channel);
  }

  private handleChannelUpdated(params: any): void {
    const channel = this.channels.get(params.channelId);
    if (channel) {
      channel.balance = params.balance;
      channel.nonce = params.nonce;
      this.emit('channel_updated', channel);
    }
  }

  private handlePaymentReceived(params: any): void {
    console.log('💰 Payment received:', params);
    this.emit('payment', params);
  }

  async authenticate(userAddress: string): Promise<void> {
    if (this.isAuthenticated) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 30000);

      this.once('authenticated', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.once('auth_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Request authentication
      this.sendRequest('auth_request', {
        address: userAddress,
        timestamp: Date.now()
      });
    });
  }

  async createChannel(userId: string, initialDeposit: string): Promise<YellowChannel> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated with Yellow Network');
    }

    const result = await this.sendRequest('create_channel', {
      userId,
      deposit: initialDeposit,
      timestamp: Date.now()
    });

    return result;
  }

  async transfer(channelId: string, to: string, amount: string): Promise<any> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    // Create transfer message
    const wallet = new ethers.Wallet(this.hubPrivateKey);
    const message = JSON.stringify({
      channelId,
      to,
      amount,
      nonce: channel.nonce + 1,
      timestamp: Date.now()
    });

    const signature = await wallet.signMessage(message);

    const result = await this.sendRequest('transfer', {
      channelId,
      to,
      amount,
      nonce: channel.nonce + 1,
      signature,
      message
    });

    // Update local state
    channel.nonce++;
    
    return result;
  }

  async closeChannel(channelId: string): Promise<any> {
    const channel = this.channels.get(channelId);
    if (!channel) {
      throw new Error(`Channel ${channelId} not found`);
    }

    channel.status = 'closing';

    const result = await this.sendRequest('close_channel', {
      channelId,
      timestamp: Date.now()
    });

    channel.status = 'closed';
    this.channels.delete(channelId);

    return result;
  }

  async getChannelBalance(channelId: string): Promise<string> {
    const result = await this.sendRequest('get_balance', {
      channelId
    });

    return result.balance;
  }

  async getLedgerBalances(): Promise<any> {
    return this.sendRequest('get_ledger_balances', {});
  }

  private sendRequest(method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      this.pendingRequests.set(id, { resolve, reject });

      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout: ${method}`));
        }
      }, 30000);

      this.ws.send(JSON.stringify(request));
    });
  }

  getChannel(channelId: string): YellowChannel | undefined {
    return this.channels.get(channelId);
  }

  getAllChannels(): YellowChannel[] {
    return Array.from(this.channels.values());
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.channels.clear();
    this.pendingRequests.clear();
  }
}
