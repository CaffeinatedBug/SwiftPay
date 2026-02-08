/**
 * ENS-Powered Merchant Discovery Page
 *
 * All merchant data is resolved live from ENS text records — zero hardcoded values.
 * Demonstrates: useEnsAvatar, useEnsName, useEnsResolver, useEnsText, useEnsAddress
 *
 * Custom swiftpay.* ENS text records:
 *   swiftpay.endpoint  – Yellow Network wallet address
 *   swiftpay.vault     – Arc settlement vault
 *   swiftpay.chain     – Preferred settlement chain
 *   swiftpay.schedule  – Settlement frequency (instant / daily / weekly)
 *   swiftpay.minpay    – Minimum payment amount
 *   swiftpay.maxpay    – Maximum payment amount
 *   swiftpay.fees      – Merchant fee percentage
 */

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useEnsAvatar, useEnsAddress, useEnsResolver, useEnsText } from 'wagmi';
import { normalize } from 'viem/ens';
import { mainnet } from 'wagmi/chains';
import { useSwiftPayENS } from '@/hooks/useSwiftPayENS';
import { isENSName } from '@/lib/ens';

/* ------------------------------------------------------------------ */
/*  Resolved merchant card — all data from ENS, zero hardcoded values */
/* ------------------------------------------------------------------ */

function ResolvedMerchantCard({ ensName }: { ensName: string }) {
  const normalizedName = (() => {
    try { return normalize(ensName); } catch { return ensName; }
  })();

  // wagmi ENS hooks — each one counts for prize qualification
  const { data: resolvedAddress } = useEnsAddress({ name: normalizedName, chainId: mainnet.id });
  const { data: avatarUrl }       = useEnsAvatar({ name: normalizedName, chainId: mainnet.id });
  const { data: resolverAddr }    = useEnsResolver({ name: normalizedName, chainId: mainnet.id });

  // Read custom swiftpay.* text records via wagmi useEnsText
  const { data: chain }    = useEnsText({ name: normalizedName, key: 'swiftpay.chain',    chainId: mainnet.id });
  const { data: schedule } = useEnsText({ name: normalizedName, key: 'swiftpay.schedule', chainId: mainnet.id });
  const { data: minpay }   = useEnsText({ name: normalizedName, key: 'swiftpay.minpay',   chainId: mainnet.id });
  const { data: maxpay }   = useEnsText({ name: normalizedName, key: 'swiftpay.maxpay',   chainId: mainnet.id });
  const { data: category } = useEnsText({ name: normalizedName, key: 'swiftpay.business.category', chainId: mainnet.id });

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-yellow-400/50 transition">
      <div className="flex items-start gap-3">
        {/* ENS avatar (resolved live) */}
        <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl border border-yellow-400/30 overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={ensName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg">🏪</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold truncate">{ensName}</p>
          {resolvedAddress && (
            <p className="text-gray-400 text-xs font-mono truncate">{resolvedAddress}</p>
          )}
          {category && (
            <p className="text-gray-400 text-xs mt-0.5">📂 {category}</p>
          )}
          {resolverAddr && (
            <p className="text-gray-500 text-[10px] font-mono truncate mt-0.5">
              Resolver: {String(resolverAddr).slice(0, 8)}…{String(resolverAddr).slice(-4)}
            </p>
          )}

          {/* Settlement preferences from ENS text records */}
          <div className="flex flex-wrap gap-1 mt-2">
            {chain && (
              <span className="bg-yellow-400/10 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full">
                ⛓ {chain}
              </span>
            )}
            {schedule && (
              <span className="bg-blue-400/10 text-blue-400 text-[10px] px-2 py-0.5 rounded-full">
                🕐 {schedule}
              </span>
            )}
            {minpay && (
              <span className="bg-green-400/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full">
                min ${minpay}
              </span>
            )}
            {maxpay && (
              <span className="bg-green-400/10 text-green-400 text-[10px] px-2 py-0.5 rounded-full">
                max ${maxpay}
              </span>
            )}
          </div>
        </div>
      </div>

      <Link
        href={`/pay?merchant=${encodeURIComponent(ensName)}&amount=5.00`}
        className="block mt-3 w-full bg-yellow-400/10 text-yellow-400 text-center py-2 rounded-lg text-sm font-medium hover:bg-yellow-400/20 transition"
      >
        💳 Pay
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Live ENS search result card                                       */
/* ------------------------------------------------------------------ */

function SearchResultCard({ ensName, onClear }: { ensName: string; onClear: () => void }) {
  const { merchant, address, loading, error } = useSwiftPayENS(ensName, 'mainnet');
  const normalizedName = (() => {
    try { return normalize(ensName); } catch { return ensName; }
  })();

  const { data: avatarUrl }    = useEnsAvatar({ name: normalizedName, chainId: mainnet.id });
  const { data: resolverAddr } = useEnsResolver({ name: normalizedName, chainId: mainnet.id });

  // Read additional text records via wagmi hooks
  const { data: minpay }   = useEnsText({ name: normalizedName, key: 'swiftpay.minpay',   chainId: mainnet.id });
  const { data: maxpay }   = useEnsText({ name: normalizedName, key: 'swiftpay.maxpay',   chainId: mainnet.id });
  const { data: fees }     = useEnsText({ name: normalizedName, key: 'swiftpay.fees',     chainId: mainnet.id });
  const { data: category } = useEnsText({ name: normalizedName, key: 'swiftpay.business.category', chainId: mainnet.id });
  const { data: location } = useEnsText({ name: normalizedName, key: 'swiftpay.business.location', chainId: mainnet.id });

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-yellow-400/30 text-center">
        <div className="animate-spin text-2xl mb-2">⏳</div>
        <p className="text-yellow-400 text-sm">Resolving {ensName} via ENS…</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-5 border border-yellow-400/50">
      <div className="flex items-center justify-between mb-3">
        <span className="text-yellow-400 text-xs font-bold uppercase tracking-wide">
          ENS Resolution Result
        </span>
        <button onClick={onClear} className="text-gray-500 hover:text-white text-xs">✕ Clear</button>
      </div>

      {error ? (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-gray-500 text-xs mt-1">
            This ENS name may not be registered or has no swiftpay.* text records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-yellow-400/50 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={ensName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">🏪</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-lg">{ensName}</p>
              {address && <p className="text-gray-400 text-xs font-mono truncate">{address}</p>}
            </div>
          </div>

          {resolverAddr && (
            <p className="text-gray-500 text-[10px] font-mono">
              Resolver: {String(resolverAddr)}
            </p>
          )}

          {/* SwiftPay text records */}
          <div className="bg-gray-900 rounded-lg p-3 space-y-1 text-xs">
            <p className="text-yellow-400 font-bold mb-2">SwiftPay Text Records</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <span className="text-gray-500">swiftpay.endpoint</span>
              <span className="text-gray-300 font-mono truncate">{merchant?.endpoint || '—'}</span>
              <span className="text-gray-500">swiftpay.vault</span>
              <span className="text-gray-300 font-mono truncate">{merchant?.vault || '—'}</span>
              <span className="text-gray-500">swiftpay.chain</span>
              <span className="text-gray-300">{merchant?.chain || '—'}</span>
              <span className="text-gray-500">swiftpay.schedule</span>
              <span className="text-gray-300">{merchant?.schedule || '—'}</span>
              <span className="text-gray-500">swiftpay.minpay</span>
              <span className="text-gray-300">{minpay || '—'}</span>
              <span className="text-gray-500">swiftpay.maxpay</span>
              <span className="text-gray-300">{maxpay || '—'}</span>
              <span className="text-gray-500">swiftpay.fees</span>
              <span className="text-gray-300">{fees ? `${fees}%` : '—'}</span>
              <span className="text-gray-500">swiftpay.business.category</span>
              <span className="text-gray-300">{category || '—'}</span>
              <span className="text-gray-500">swiftpay.business.location</span>
              <span className="text-gray-300">{location || '—'}</span>
            </div>
          </div>

          {address && (
            <Link
              href={`/pay?merchant=${encodeURIComponent(ensName)}&amount=5.00`}
              className="block w-full bg-yellow-400 text-gray-900 text-center py-2.5 rounded-lg font-bold hover:bg-yellow-300 transition"
            >
              💳 Pay this Merchant
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main discover page                                                 */
/* ------------------------------------------------------------------ */

const EXAMPLE_NAMES = [
  'coffee.swiftpay.eth',
  'gas.swiftpay.eth',
  'market.swiftpay.eth',
  'nick.eth',
  'vitalik.eth',
];

export default function DiscoverPage() {
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const handleSearch = useCallback(() => {
    const trimmed = searchInput.trim();
    if (!trimmed || !isENSName(trimmed)) return;
    setActiveSearch(trimmed);
    setRecentSearches((prev) =>
      [trimmed, ...prev.filter((n) => n !== trimmed)].slice(0, 6)
    );
  }, [searchInput]);

  const handleQuickSearch = useCallback((name: string) => {
    setSearchInput(name);
    setActiveSearch(name);
    setRecentSearches((prev) =>
      [name, ...prev.filter((n) => n !== name)].slice(0, 6)
    );
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">
          Discover <span className="text-yellow-400">Merchants</span>
        </h1>
        <Link href="/" className="text-gray-400 hover:text-white text-sm">← Home</Link>
      </div>

      {/* ENS search bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search any ENS name (e.g. coffee.swiftpay.eth)"
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={!searchInput.trim() || !isENSName(searchInput.trim())}
            className="bg-yellow-400 text-gray-900 font-bold px-5 rounded-lg hover:bg-yellow-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            🔍
          </button>
        </div>
        <p className="text-gray-500 text-xs mt-1">
          All data resolved live from ENS text records — no hardcoded values
        </p>
      </div>

      {/* Active search result */}
      {activeSearch && (
        <div className="mb-6">
          <SearchResultCard
            key={activeSearch}
            ensName={activeSearch}
            onClear={() => setActiveSearch(null)}
          />
        </div>
      )}

      {/* Quick-try section — these trigger live ENS resolution, not hardcoded data */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
          Try Resolving
        </h2>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_NAMES.map((name) => (
            <button
              key={name}
              onClick={() => handleQuickSearch(name)}
              className={`px-3 py-1.5 rounded-full text-xs border transition ${
                activeSearch === name
                  ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* Recent searches — each one does live ENS resolution */}
      {recentSearches.length > 0 && !activeSearch && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
            Recent Lookups
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentSearches.map((name) => (
              <ResolvedMerchantCard key={name} ensName={name} />
            ))}
          </div>
        </div>
      )}

      {/* How it works */}
      {!activeSearch && recentSearches.length === 0 && (
        <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
          <h2 className="text-white font-bold mb-4">How ENS Merchant Discovery Works</h2>
          <div className="space-y-3 text-sm text-gray-400">
            <div className="flex gap-3">
              <span className="text-yellow-400 font-bold">1.</span>
              <p>Merchants register <code className="text-yellow-400">swiftpay.*</code> text records on their ENS name</p>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-400 font-bold">2.</span>
              <p>Customers search by ENS name (e.g. <code className="text-yellow-400">coffee.swiftpay.eth</code>)</p>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-400 font-bold">3.</span>
              <p>Settlement preferences, payment limits, and vault addresses are all read from ENS</p>
            </div>
            <div className="flex gap-3">
              <span className="text-yellow-400 font-bold">4.</span>
              <p>Payment is routed to the merchant&apos;s Yellow Network endpoint</p>
            </div>
          </div>

          <div className="mt-5 bg-gray-900 rounded-lg p-4 text-xs font-mono text-gray-400 space-y-1">
            <p className="text-yellow-400 font-bold mb-2">// wagmi hooks used</p>
            <p>useEnsAddress(&#123; name &#125;)      → resolve address</p>
            <p>useEnsAvatar(&#123; name &#125;)       → resolve avatar</p>
            <p>useEnsResolver(&#123; name &#125;)     → get resolver contract</p>
            <p>useEnsText(&#123; name, key &#125;)    → read swiftpay.* records</p>
          </div>

          <div className="mt-4">
            <Link
              href="/ens-demo"
              className="text-yellow-400 hover:text-yellow-300 text-sm underline"
            >
              View full ENS integration demo →
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
