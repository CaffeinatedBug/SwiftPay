'use client';

import React from 'react';

// Real-time WebSocket service for merchant dashboard updates
// Phase 5: Real-time payment notifications, balance updates, and channel status

export interface PaymentUpdate {
  type: 'payment_received' | 'payment_failed' | 'payment_pending';
  paymentId: string;
  amount: string;
  currency: string;
  customerAddress: string;
  timestamp: number;
  transactionHash?: string;
  channel: string;
}

export interface BalanceUpdate {
  type: 'balance_update';
  clearedBalance: string;
  pendingBalance: string;
  timestamp: number;
}

export interface ChannelUpdate {
  type: 'channel_status';
  channelId: string;
  status: 'connected' | 'disconnected' | 'degraded';
  latency: number;
  throughput: number;
  timestamp: number;
}

export type WebSocketMessage = PaymentUpdate | BalanceUpdate | ChannelUpdate;

export interface MerchantWebSocketConfig {
  merchantAddress: string;
  onPaymentUpdate?: (update: PaymentUpdate) => void;
  onBalanceUpdate?: (update: BalanceUpdate) => void;
  onChannelUpdate?: (update: ChannelUpdate) => void;
  onConnectionChange?: (connected: boolean) => void;
}

class MerchantWebSocketService {
  private ws: WebSocket | null = null;
  private config: MerchantWebSocketConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnected = false;

  connect(config: MerchantWebSocketConfig): void {
    this.config = config;
    this.attemptConnection();
  }

  private attemptConnection(): void {
    if (!this.config) return;

    try {
      // In production, this would be a real WebSocket URL
      // For demo, we'll simulate the connection
      this.simulateConnection();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  private simulateConnection(): void {
    // Simulate successful connection
    setTimeout(() => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.config?.onConnectionChange?.(true);
      console.log('🟢 Connected to SwiftPay merchant WebSocket');
      
      this.startHeartbeat();
      this.startSimulatedUpdates();
    }, 500);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        // Simulate heartbeat - in real implementation, send ping
        console.log('💓 WebSocket heartbeat');
      }
    }, 30000); // Every 30 seconds
  }

  private startSimulatedUpdates(): void {
    // Simulate periodic updates for demo
    setInterval(() => {
      if (!this.isConnected || !this.config) return;

      // Random payment simulation
      if (Math.random() < 0.1) { // 10% chance every interval
        this.simulatePaymentUpdate();
      }

      // Balance updates
      if (Math.random() < 0.2) { // 20% chance
        this.simulateBalanceUpdate();
      }

      // Channel status updates
      if (Math.random() < 0.15) { // 15% chance
        this.simulateChannelUpdate();
      }
    }, 10000); // Every 10 seconds
  }

  private simulatePaymentUpdate(): void {
    const mockPayment: PaymentUpdate = {
      type: 'payment_received',
      paymentId: `PAY-${Date.now().toString(36)}`,
      amount: (Math.random() * 200 + 10).toFixed(2),
      currency: 'USDC',
      customerAddress: `0x${Math.random().toString(16).substring(2, 10)}...`,
      timestamp: Date.now(),
      transactionHash: `0x${Math.random().toString(16).substring(2, 10)}...`,
      channel: `YN-CH-${Math.floor(Math.random() * 3) + 1}`
    };

    this.config?.onPaymentUpdate?.(mockPayment);
  }

  private simulateBalanceUpdate(): void {
    const clearedBalance = (Math.random() * 20000 + 10000).toFixed(2);
    const pendingBalance = (Math.random() * 5000 + 1000).toFixed(2);

    const update: BalanceUpdate = {
      type: 'balance_update',
      clearedBalance,
      pendingBalance,
      timestamp: Date.now()
    };

    this.config?.onBalanceUpdate?.(update);
  }

  private simulateChannelUpdate(): void {
    const channels = ['YN-CH-001', 'YN-CH-002', 'YN-CH-003'];
    const statuses: ChannelUpdate['status'][] = ['connected', 'degraded'];
    
    const update: ChannelUpdate = {
      type: 'channel_status',
      channelId: channels[Math.floor(Math.random() * channels.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      latency: Math.random() * 100 + 20,
      throughput: Math.random() * 800 + 200,
      timestamp: Date.now()
    };

    this.config?.onChannelUpdate?.(update);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.config?.onConnectionChange?.(false);
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.attemptConnection();
    }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1)); // Exponential backoff
  }

  disconnect(): void {
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.config?.onConnectionChange?.(false);
    console.log('🔴 Disconnected from SwiftPay merchant WebSocket');
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
let merchantWebSocket: MerchantWebSocketService | null = null;

export function getMerchantWebSocket(): MerchantWebSocketService {
  if (!merchantWebSocket) {
    merchantWebSocket = new MerchantWebSocketService();
  }
  return merchantWebSocket;
}

// React hook for using the WebSocket service
export function useMerchantWebSocket(config: MerchantWebSocketConfig) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState<WebSocketMessage | null>(null);

  React.useEffect(() => {
    const service = getMerchantWebSocket();
    
    const enhancedConfig: MerchantWebSocketConfig = {
      ...config,
      onConnectionChange: (connected) => {
        setIsConnected(connected);
        config.onConnectionChange?.(connected);
      },
      onPaymentUpdate: (update) => {
        setLastUpdate(update);
        config.onPaymentUpdate?.(update);
      },
      onBalanceUpdate: (update) => {
        setLastUpdate(update);
        config.onBalanceUpdate?.(update);
      },
      onChannelUpdate: (update) => {
        setLastUpdate(update);
        config.onChannelUpdate?.(update);
      }
    };

    service.connect(enhancedConfig);

    return () => {
      service.disconnect();
    };
  }, [config.merchantAddress]);

  return {
    isConnected,
    lastUpdate,
    disconnect: () => getMerchantWebSocket().disconnect()
  };
}

export default MerchantWebSocketService;