// Yellow Network Integration Hook
import { useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080';

interface YellowChannel {
  channelId: string;
  balance: string;
  status: 'opening' | 'active' | 'closing' | 'closed';
}

interface ClearedPayment {
  userId: string;
  amount: string;
  timestamp: number;
  channelBalance: string;
}

export function useYellowNetwork() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [userChannel, setUserChannel] = useState<YellowChannel | null>(null);
  const [merchantChannel, setMerchantChannel] = useState<YellowChannel | null>(null);
  const [clearedPayments, setClearedPayments] = useState<ClearedPayment[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WebSocket connection for real-time merchant notifications
  useEffect(() => {
    if (!address) return;

    const websocket = new WebSocket(WS_URL);
    
    websocket.onopen = () => {
      console.log('✅ Connected to Yellow Hub WebSocket');
      websocket.send(JSON.stringify({
        type: 'REGISTER',
        merchantId: address
      }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 WebSocket message:', data);
      
      if (data.type === 'PAYMENT_CLEARED') {
        setClearedPayments(prev => [...prev, data.payment]);
      } else if (data.type === 'SETTLEMENT_COMPLETE') {
        console.log('✅ Settlement complete:', data);
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('⚠️ WebSocket closed');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [address]);

  // Open user payment channel
  const openUserChannel = async (initialBalance: string) => {
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
      console.log('✅ User channel opened:', data.channel);
      return data.channel;
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error opening user channel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Open merchant receiving channel
  const openMerchantChannel = async () => {
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
      console.log('✅ Merchant channel opened:', data.channel);
      return data.channel;
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Error opening merchant channel:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear payment instantly via Yellow Network (<200ms)
  const clearPayment = async (merchantId: string, amount: string) => {
    if (!address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sign payment message with MetaMask
      const message = `Pay ${amount} USDC to ${merchantId} via Yellow Network`;
      const signature = await signMessageAsync({ message });

      const response = await fetch(`${BACKEND_URL}/api/payments/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: address,
          merchantId,
          amount,
          signature
        })
      });

      if (!response.ok) {
        throw new Error(`Payment failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Payment cleared instantly:', data);
      
      // Update user channel balance
      if (data.userChannelBalance) {
        setUserChannel(prev => prev ? { ...prev, balance: data.userChannelBalance } : null);
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Payment error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Settle merchant payments on-chain
  const settleMerchantPayments = async () => {
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
        throw new Error(`Settlement failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Settlement initiated:', data);
      
      // Clear local cleared payments after settlement
      setClearedPayments([]);

      return data;
    } catch (err: any) {
      setError(err.message);
      console.error('❌ Settlement error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get user channel balance
  const getUserBalance = async () => {
    if (!address) return null;

    try {
      const response = await fetch(`${BACKEND_URL}/api/balance/user/${address}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return data.balance;
    } catch (err) {
      console.error('Error fetching user balance:', err);
      return null;
    }
  };

  // Get cleared payments for merchant
  const getClearedPayments = async () => {
    if (!address) return [];

    try {
      const response = await fetch(`${BACKEND_URL}/api/payments/cleared/${address}`);
      if (!response.ok) return [];
      
      const data = await response.json();
      setClearedPayments(data.payments || []);
      return data.payments || [];
    } catch (err) {
      console.error('Error fetching cleared payments:', err);
      return [];
    }
  };

  return {
    // State
    userChannel,
    merchantChannel,
    clearedPayments,
    loading,
    error,
    isConnected: !!ws && ws.readyState === WebSocket.OPEN,

    // Actions
    openUserChannel,
    openMerchantChannel,
    clearPayment,
    settleMerchantPayments,
    getUserBalance,
    getClearedPayments
  };
}
