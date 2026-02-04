'use client';

import { ChainBadge } from '@/components/ui/chain-badge';

const SUPPORTED_NETWORKS = [
  { chain: 'arbitrum' as const, label: 'Arbitrum' },
  { chain: 'optimism' as const, label: 'Optimism' },
  { chain: 'base' as const, label: 'Base' },
  { chain: 'polygon' as const, label: 'Polygon' },
  { chain: 'bsc' as const, label: 'BSC' },
  { chain: 'avalanche' as const, label: 'Avalanche' },
];

export function NetworkTicker() {
  const networks = [...SUPPORTED_NETWORKS, ...SUPPORTED_NETWORKS];

  return (
    <div className="relative w-full overflow-hidden border-y border-yellow-500/20 bg-gray-900 py-2">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-gray-900 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-gray-900 to-transparent" />
      
      <div className="flex animate-scroll-x gap-6">
        {networks.map((network, index) => (
          <div key={`${network.chain}-${index}`} className="flex items-center gap-2 whitespace-nowrap">
            <ChainBadge chain={network.chain} />
            <span className="text-xs font-medium text-gray-400">{network.label}</span>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @keyframes scroll-x {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-x {
          animation: scroll-x 25s linear infinite;
        }
        .animate-scroll-x:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
