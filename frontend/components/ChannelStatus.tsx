'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface ChannelInfo {
  channelId: string;
  status: 'open' | 'closed' | 'none';
  balance: number;
  spent: number;
  paymentCount: number;
}

export function ChannelStatus() {
  const { address } = useAccount();
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;

    async function fetchChannel() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_HUB_API_URL}/api/channels/${address}`
        );
        if (res.ok) {
          setChannel(await res.json());
        }
      } catch {
        // No channel yet
      } finally {
        setLoading(false);
      }
    }
    fetchChannel();
  }, [address]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/2" />
      </div>
    );
  }

  if (!channel || channel.status === 'none') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-gray-400 text-sm">No active payment channel</p>
        <p className="text-gray-500 text-xs mt-1">
          A channel will open automatically on first payment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">Payment Channel</p>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            channel.status === 'open'
              ? 'bg-green-400/20 text-green-400'
              : 'bg-gray-600 text-gray-400'
          }`}
        >
          {channel.status}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div>
          <p className="text-yellow-400 font-bold">${channel.balance.toFixed(2)}</p>
          <p className="text-gray-500 text-xs">Balance</p>
        </div>
        <div>
          <p className="text-white font-bold">${channel.spent.toFixed(2)}</p>
          <p className="text-gray-500 text-xs">Spent</p>
        </div>
        <div>
          <p className="text-white font-bold">{channel.paymentCount}</p>
          <p className="text-gray-500 text-xs">Payments</p>
        </div>
      </div>
      <p className="text-gray-600 text-xs mt-2 font-mono truncate">
        {channel.channelId}
      </p>
    </div>
  );
}
