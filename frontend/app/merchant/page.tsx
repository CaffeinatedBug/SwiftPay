'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@/components/ConnectButton';
import { MerchantQR } from '@/components/MerchantQR';
import { SettlementHistory } from '@/components/SettlementHistory';

interface Payment {
  id: string;
  from: string;
  amount: number;
  timestamp: number;
}

type Tab = 'pos' | 'admin' | 'settings';

export default function MerchantPage() {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>('pos');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState<string>('5.00');
  const [merchantENS] = useState('coffeeshop.swiftpay.eth');
  const [pendingTotal, setPendingTotal] = useState(0);
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Settlement preferences state
  const [schedule, setSchedule] = useState<'instant' | 'daily' | 'weekly'>('daily');
  const [settlementTime, setSettlementTime] = useState('18:00');

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_HUB_WS_URL || 'ws://localhost:8080';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'register_merchant',
        merchantENS,
        address,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'payment_received') {
        const payment: Payment = {
          id: data.id || Date.now().toString(),
          from: data.from,
          amount: data.amount,
          timestamp: Date.now(),
        };
        setPayments((prev) => [payment, ...prev]);
        setPendingTotal((prev) => prev + data.amount);
        setLastPayment(payment);

        // Auto-clear notification after 3s
        setTimeout(() => setLastPayment(null), 3000);
      }
      if (data.type === 'settlement_complete') {
        setPendingTotal(0);
      }
    };

    return () => ws.close();
  }, [merchantENS, address]);

  const handleSettle = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_HUB_API_URL}/api/settlements`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantENS }),
        }
      );
    } catch (err) {
      console.error('Settlement error:', err);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_HUB_API_URL}/api/merchants/${merchantENS}/preferences`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schedule,
            time: settlementTime + ':00 UTC',
            chain: 'arc-testnet',
            token: 'USDC',
          }),
        }
      );
      alert('Preferences saved to ENS!');
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-white">
            Merchant <span className="text-yellow-400">Dashboard</span>
          </h1>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">
          Swift<span className="text-yellow-400">Pay</span> Merchant
        </h1>
        <p className="text-yellow-400 text-sm">{merchantENS}</p>
      </div>

      {/* Payment notification overlay */}
      {lastPayment && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-green-500 rounded-xl p-8 text-center animate-pulse">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-green-400 font-bold text-2xl">PAYMENT RECEIVED!</p>
            <p className="text-white text-xl mt-2">${lastPayment.amount.toFixed(2)}</p>
            <p className="text-gray-400 text-sm mt-1">from {lastPayment.from}</p>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-6">
        {(['pos', 'admin', 'settings'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
              tab === t
                ? 'bg-yellow-400 text-gray-900'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'pos' ? '📱 POS' : t === 'admin' ? '📊 Admin' : '⚙️ Settings'}
          </button>
        ))}
      </div>

      {/* POS Tab */}
      {tab === 'pos' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <label className="text-gray-400 text-sm">Payment Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-700 text-white text-2xl font-bold p-3 rounded-lg mt-1 border border-gray-600 focus:border-yellow-400 outline-none"
              step="0.01"
              min="0.50"
            />
          </div>

          <MerchantQR merchantENS={merchantENS} amount={parseFloat(amount)} />

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-gray-400 text-sm mb-3">Recent Payments</h3>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Waiting for payments...</p>
            ) : (
              <div className="space-y-2">
                {payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-0">
                    <div>
                      <p className="text-white text-sm">{p.from}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(p.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <p className="text-green-400 font-bold">${p.amount.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Tab */}
      {tab === 'admin' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <p className="text-yellow-400 text-2xl font-bold">{payments.length}</p>
              <p className="text-gray-400 text-xs">Payments</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <p className="text-yellow-400 text-2xl font-bold">
                ${payments.reduce((s, p) => s + p.amount, 0).toFixed(0)}
              </p>
              <p className="text-gray-400 text-xs">Volume</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center border border-gray-700">
              <p className="text-green-400 text-2xl font-bold">✅</p>
              <p className="text-gray-400 text-xs">Active</p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-yellow-400/30">
            <h3 className="text-yellow-400 font-bold mb-2">💰 Pending Settlement</h3>
            <p className="text-white text-2xl font-bold">${pendingTotal.toFixed(2)}</p>
            <p className="text-gray-400 text-sm">{payments.length} cleared payments</p>
            <p className="text-gray-500 text-xs mt-2">
              Next auto-settle: Today at {settlementTime} UTC
            </p>
            <button
              onClick={handleSettle}
              className="w-full mt-4 bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 transition"
            >
              💵 Settle Now
            </button>
          </div>

          <SettlementHistory merchantENS={merchantENS} />
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-yellow-400 font-bold mb-4">⚙️ Settlement Preferences</h3>

            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-sm">Schedule</label>
                <div className="space-y-2 mt-1">
                  {(['instant', 'daily', 'weekly'] as const).map((s) => (
                    <label key={s} className="flex items-center gap-2 text-white cursor-pointer">
                      <input
                        type="radio"
                        name="schedule"
                        value={s}
                        checked={schedule === s}
                        onChange={() => setSchedule(s)}
                        className="accent-yellow-400"
                      />
                      {s === 'instant' ? 'Instant' : s === 'daily' ? 'Daily' : 'Weekly (Sundays)'}
                    </label>
                  ))}
                </div>
              </div>

              {schedule !== 'instant' && (
                <div>
                  <label className="text-gray-400 text-sm">Settlement Time (UTC)</label>
                  <input
                    type="time"
                    value={settlementTime}
                    onChange={(e) => setSettlementTime(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg mt-1 border border-gray-600 focus:border-yellow-400 outline-none"
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleSavePreferences}
                  className="w-full bg-yellow-400 text-gray-900 font-bold py-2 rounded-lg hover:bg-yellow-300 transition"
                >
                  Save to ENS
                </button>
                <p className="text-gray-500 text-xs text-center mt-2">
                  These preferences are stored in your ENS profile
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
