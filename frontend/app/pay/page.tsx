'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAccount, useConnect } from 'wagmi';
import { useEnsName, useEnsAvatar } from 'wagmi';
import { normalize } from 'viem/ens';
import { QRScanner } from '@/components/QRScanner';
import { PaymentCard } from '@/components/PaymentCard';
import { ENSProfile } from '@/components/ENSProfile';
import { ConnectButton } from '@/components/ConnectButton';
import { ChannelStatus } from '@/components/ChannelStatus';

interface PaymentRequest {
  merchantENS: string;
  amount: number;
  currency: string;
}

function PayContent() {
  const { address, isConnected } = useAccount();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'confirming' | 'signing' | 'success' | 'error'>('idle');
  const [clearingTime, setClearingTime] = useState<number | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const merchant = searchParams.get('merchant');
    const amt = searchParams.get('amount');
    if (merchant && amt) {
      setPaymentRequest({
        merchantENS: merchant,
        amount: parseFloat(amt),
        currency: 'USD',
      });
      setStatus('confirming');
    }
  }, [searchParams]);

  const handleQRScan = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      setPaymentRequest({
        merchantENS: parsed.merchantENS || parsed.merchant,
        amount: parsed.amount,
        currency: parsed.currency || 'USD',
      });
      setStatus('confirming');
    } catch {
      // Try simple format: "merchantENS:amount"
      const parts = data.split(':');
      if (parts.length >= 2) {
        setPaymentRequest({
          merchantENS: parts[0],
          amount: parseFloat(parts[1]),
          currency: 'USD',
        });
        setStatus('confirming');
      }
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentRequest || !address) return;
    setStatus('signing');
    const startTime = Date.now();

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_HUB_API_URL + '/api/payments',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: address,
            merchantENS: paymentRequest.merchantENS,
            amount: paymentRequest.amount,
            currency: paymentRequest.currency,
          }),
        }
      );

      if (!response.ok) throw new Error('Payment failed');

      setClearingTime(Date.now() - startTime);
      setStatus('success');
    } catch (err) {
      console.error('Payment error:', err);
      setStatus('error');
    }
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-white">
            Swift<span className="text-yellow-400">Pay</span>
          </h1>
          <p className="text-gray-400">Connect your wallet to make payments</p>
          <ConnectButton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">
        Swift<span className="text-yellow-400">Pay</span>
      </h1>

      {/* Channel status always visible */}
      <div className="mb-4">
        <ChannelStatus />
      </div>

      {status === 'idle' && (
        <div className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
            <p className="text-gray-300 mb-4">Scan a merchant QR code to pay</p>
            <button
              onClick={() => setStatus('scanning')}
              className="bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-lg hover:bg-yellow-300 transition w-full"
            >
              📷 Scan QR Code
            </button>
          </div>
        </div>
      )}

      {status === 'scanning' && (
        <div className="space-y-4">
          <QRScanner onScan={handleQRScan} />
          <button
            onClick={() => setStatus('idle')}
            className="text-gray-400 hover:text-white transition w-full text-center"
          >
            ← Cancel
          </button>
        </div>
      )}

      {status === 'confirming' && paymentRequest && (
        <div className="space-y-4">
          <ENSProfile ensName={paymentRequest.merchantENS} />
          <PaymentCard
            merchantENS={paymentRequest.merchantENS}
            amount={paymentRequest.amount}
            currency={paymentRequest.currency}
            onConfirm={handleConfirmPayment}
            onCancel={() => {
              setPaymentRequest(null);
              setStatus('idle');
            }}
          />
        </div>
      )}

      {status === 'signing' && (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-yellow-400/50">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-yellow-400 font-bold">Processing Payment...</p>
          <p className="text-gray-400 text-sm mt-2">Confirm in your wallet</p>
        </div>
      )}

      {status === 'success' && (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-green-500/50">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-green-400 font-bold text-xl">Payment Successful!</p>
          {clearingTime && (
            <p className="text-gray-300 mt-2">
              Cleared in <span className="text-yellow-400 font-bold">{clearingTime}ms</span>
            </p>
          )}
          <p className="text-gray-400 text-sm mt-2">
            {paymentRequest?.merchantENS} received ${paymentRequest?.amount.toFixed(2)}
          </p>
          <button
            onClick={() => {
              setStatus('idle');
              setPaymentRequest(null);
              setClearingTime(null);
            }}
            className="mt-6 bg-yellow-400 text-gray-900 font-bold px-6 py-2 rounded-lg hover:bg-yellow-300 transition"
          >
            Done
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-gray-800 rounded-lg p-8 text-center border border-red-500/50">
          <div className="text-5xl mb-4">❌</div>
          <p className="text-red-400 font-bold">Payment Failed</p>
          <p className="text-gray-400 text-sm mt-2">Please try again</p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 border border-yellow-400 text-yellow-400 px-6 py-2 rounded-lg hover:bg-yellow-400/10 transition"
          >
            Try Again
          </button>
        </div>
      )}
    </main>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </main>
    }>
      <PayContent />
    </Suspense>
  );
}
