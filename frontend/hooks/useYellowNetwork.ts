// Yellow Network Integration Hook
import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080';

interface YellowChannel {
  channelId: string;
  balance: string;
  status: 'opening' | 'active' | 'closing' | 'closed';
}

interface TrackedPayment {
  id: string;
  userId: string;
  merchantId: string;
  amount: string;
  currency: string;
  timestamp: number;
  status: 'pending' | 'settled';
}

export function useYellowNetwork() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [userChannel, setUserChannel] = useState<YellowChannel | null>(null);
  const [merchantChannel, setMerchantChannel] = useState<YellowChannel | null>(null);
  const [pendingPayments, setPendingPayments] = useState<TrackedPayment[]>([]);
  const [settledPayments, setSettledPayments] = useState<TrackedPayment[]>([]);
  const [pendingTotal, setPendingTotal] = useState('0.00');
  const [settledTotal, setSettledTotal] = useState('0.00');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket connection for real-time merchant notifications
  useEffect(() => {
    if (!address) return;

    function connect() {
      const websocket = new WebSocket(`${WS_URL}?merchantId=${address}`);
      
      websocket.onopen = () => {
        console.log('✅ Connected to Yellow Hub WebSocket');
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data.type, data);
          
          switch (data.type) {
            case 'INITIAL_STATE':
              setPendingPayments(data.pendingPayments || []);
              setSettledPayments(data.settledPayments || []);
              setPendingTotal(data.pendingTotal || '0.00');
              setSettledTotal(data.settledTotal || '0.00');
              break;
              
            case 'PAYMENT_CLEARED':
              setPendingPayments(data.pendingPayments || []);
              setSettledPayments(data.settledPayments || []);
              setPendingTotal(data.pendingTotal || '0.00');
              setSettledTotal(data.settledTotal || '0.00');
              break;
              
            case 'SETTLEMENT_COMPLETE':
              setPendingPayments(data.pendingPayments || []);
              setSettledPayments(data.settledPayments || []);
              setPendingTotal(data.pendingTotal || '0.00');
              setSettledTotal(data.settledTotal || '0.00');
              break;
              
            case 'SETTLEMENT_FAILED':
              console.error('❌ Settlement failed:', data);
              break;

            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      websocket.onclose = () => {
        console.log('⚠️ WebSocket closed, reconnecting in 3s...');
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      wsRef.current = websocket;
      setWs(websocket);
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on cleanup
        wsRef.current.close();
      }
    };
  }, [address]);

  // Open user payment channel
  const openUserChannel = useCallback(async (initialBalance: string) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/channels/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: address,
          initialBalance
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to open channel: ${response.statusText}`);
      }

      const data = await response.json();
      setUserChannel(data.channel);
      return data.channel;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Open merchant receiving channel
  const openMerchantChannel = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/channels/merchant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: address
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to open merchant channel: ${response.statusText}`);
      }

      const data = await response.json();
      setMerchantChannel(data.channel);
      return data.channel;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Clear payment instantly via Yellow Network (<200ms)
  const clearPayment = useCallback(async (merchantId: string, amount: string, currency: string = 'USDC') => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign payment message with wallet
      const message = `Pay ${amount} ${currency} to ${merchantId} via Yellow Network`;
      const signature = await signMessageAsync({ message });

      const response = await fetch(`${BACKEND_URL}/api/payments/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: address,
          merchantId,
          amount,
          currency,
          message,
          signature
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Payment failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Payment cleared instantly:', data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address, signMessageAsync]);

  // Settle merchant payments - move pending → settled
  const settleMerchantPayments = useCallback(async () => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: address
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Settlement failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Settlement complete:', data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Get user channel balance
  const getUserBalance = useCallback(async () => {
    if (!address) return null;

    try {
      const response = await fetch(`${BACKEND_URL}/api/balance/user/${address}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.balance;
    } catch {
      return null;
    }
  }, [address]);

  return {
    // State
    userChannel,
    merchantChannel,
    pendingPayments,
    settledPayments,
    pendingTotal,
    settledTotal,
    // Legacy compat - clearedPayments = pendingPayments for backward compat
    clearedPayments: pendingPayments,
    loading,
    error,
    isConnected: !!ws && ws.readyState === WebSocket.OPEN,

    // Actions
    openUserChannel,
    openMerchantChannel,
    clearPayment,
    settleMerchantPayments,
    getUserBalance,
  };
}
