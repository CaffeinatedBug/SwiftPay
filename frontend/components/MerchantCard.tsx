'use client';

import Link from 'next/link';

interface MerchantInfo {
  ensName: string;
  name: string;
  category: string;
  location: string;
  avatar: string;
  totalPayments: number;
  rating: number;
}

export function MerchantCard({ merchant }: { merchant: MerchantInfo }) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-yellow-400/50 transition">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl border border-yellow-400/30">
          {merchant.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{merchant.name}</p>
          <p className="text-yellow-400 text-xs truncate">{merchant.ensName}</p>
          <p className="text-gray-400 text-xs mt-1">📍 {merchant.location}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-yellow-400 text-xs">
              {'⭐'.repeat(merchant.rating)}
            </span>
            <span className="text-gray-500 text-xs">
              ({merchant.totalPayments} payments)
            </span>
          </div>
        </div>
      </div>
      <Link
        href={`/pay?merchant=${merchant.ensName}&amount=5.00`}
        className="block mt-3 w-full bg-yellow-400/10 text-yellow-400 text-center py-2 rounded-lg text-sm font-medium hover:bg-yellow-400/20 transition"
      >
        💳 Pay
      </Link>
    </div>
  );
}
