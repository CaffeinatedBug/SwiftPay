'use client';

import { useState, useEffect } from 'react';

interface Settlement {
  id: string;
  amount: number;
  txHash: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
}

interface SettlementHistoryProps {
  merchantENS: string;
}

export function SettlementHistory({ merchantENS }: SettlementHistoryProps) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_HUB_API_URL}/api/merchants/${merchantENS}/settlements`
        );
        if (res.ok) {
          setSettlements(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch settlement history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [merchantENS]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-gray-400 text-sm mb-3">📜 Settlement History</h3>
      {settlements.length === 0 ? (
        <p className="text-gray-500 text-center py-4 text-sm">No settlements yet</p>
      ) : (
        <div className="space-y-2">
          {settlements.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0"
            >
              <div>
                <p className="text-white text-sm">
                  ${s.amount.toFixed(2)} USDC
                </p>
                <p className="text-gray-500 text-xs">
                  {new Date(s.timestamp).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.txHash && (
                  <a
                    href={`https://explorer.testnet.arc.network/tx/${s.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-yellow-400 text-xs hover:underline"
                  >
                    View Tx
                  </a>
                )}
                <span
                  className={`text-xs ${
                    s.status === 'success'
                      ? 'text-green-400'
                      : s.status === 'pending'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {s.status === 'success' ? '✅' : s.status === 'pending' ? '⏳' : '❌'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
