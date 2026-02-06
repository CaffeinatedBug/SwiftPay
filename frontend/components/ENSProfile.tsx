'use client';

import { useEnsName, useEnsAvatar, useEnsAddress } from 'wagmi';
import { normalize } from 'viem/ens';
import { mainnet } from 'wagmi/chains';

interface ENSProfileProps {
  ensName?: string;
  address?: `0x${string}`;
}

export function ENSProfile({ ensName, address }: ENSProfileProps) {
  // Forward resolution: name → address
  const { data: resolvedAddress, isLoading: addressLoading } = useEnsAddress({
    name: ensName ? normalize(ensName) : undefined,
    chainId: mainnet.id,
  });

  // Reverse resolution: address → name
  const { data: resolvedName, isLoading: nameLoading } = useEnsName({
    address: address || (resolvedAddress as `0x${string}` | undefined),
    chainId: mainnet.id,
  });

  // Avatar resolution
  const { data: avatarUrl, isLoading: avatarLoading } = useEnsAvatar({
    name: ensName ? normalize(ensName) : resolvedName ? normalize(resolvedName) : undefined,
    chainId: mainnet.id,
  });

  const displayName = ensName || resolvedName || 'Unknown';
  const displayAddress = resolvedAddress || address;
  const isLoading = addressLoading || nameLoading || avatarLoading;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-yellow-400/50">
          {avatarLoading ? (
            <div className="animate-pulse bg-gray-600 w-full h-full" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">🏪</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-lg truncate">{displayName}</p>
          {displayAddress && (
            <p className="text-gray-400 text-xs font-mono truncate">
              {displayAddress}
            </p>
          )}
          {isLoading && (
            <p className="text-yellow-400 text-xs">Resolving ENS...</p>
          )}
        </div>
      </div>
    </div>
  );
}
