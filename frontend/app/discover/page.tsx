'use client';

import { useState } from 'react';
import { MerchantCard } from '@/components/MerchantCard';
import Link from 'next/link';

const DEMO_MERCHANTS = [
  {
    ensName: 'coffeeshop.swiftpay.eth',
    name: "Joe's Coffee Shop",
    category: 'food-beverage',
    location: 'San Francisco, CA',
    avatar: '☕',
    totalPayments: 142,
    rating: 5,
  },
  {
    ensName: 'bookstore.swiftpay.eth',
    name: 'City Books',
    category: 'retail',
    location: 'San Francisco, CA',
    avatar: '📚',
    totalPayments: 89,
    rating: 5,
  },
  {
    ensName: 'restaurant.swiftpay.eth',
    name: 'Thai Kitchen',
    category: 'food-beverage',
    location: 'San Francisco, CA',
    avatar: '🍜',
    totalPayments: 234,
    rating: 5,
  },
  {
    ensName: 'bikeshop.swiftpay.eth',
    name: 'Spoke & Wheel',
    category: 'retail',
    location: 'Oakland, CA',
    avatar: '🚲',
    totalPayments: 56,
    rating: 4,
  },
];

const CATEGORIES = [
  { id: 'all', label: '🏪 All', },
  { id: 'food-beverage', label: '☕ Food & Beverage' },
  { id: 'retail', label: '📚 Retail' },
  { id: 'services', label: '🏨 Services' },
  { id: 'travel', label: '✈️ Travel' },
];

export default function DiscoverPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filtered = selectedCategory === 'all'
    ? DEMO_MERCHANTS
    : DEMO_MERCHANTS.filter((m) => m.category === selectedCategory);

  return (
    <main className="min-h-screen bg-gray-900 p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          Discover <span className="text-yellow-400">Merchants</span>
        </h1>
        <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-yellow-400 text-gray-900 font-bold'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Merchant grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((merchant) => (
          <MerchantCard key={merchant.ensName} merchant={merchant} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center py-12">No merchants in this category yet.</p>
      )}
    </main>
  );
}
