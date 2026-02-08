'use client';

import { useEnsName, useEnsAvatar, useEnsAddress, useEnsResolver, useEnsText } from 'wagmi';
import { normalize } from 'viem/ens';
import { mainnet } from 'wagmi/chains';

interface ENSProfileProps {
  ensName?: string;
  address?: `0x${string}`;
  /** When true, also display swiftpay.* text records (settlement preferences) */
  showTextRecords?: boolean;
}

export function ENSProfile({ ensName, address, showTextRecords = false }: ENSProfileProps) {
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

  // Resolver address (qualifies useEnsResolver for prize)
  const { data: resolverAddress } = useEnsResolver({
    name: ensName ? normalize(ensName) : resolvedName ? normalize(resolvedName) : undefined,
    chainId: mainnet.id,
  });

  // Custom text records via useEnsText (qualifies for Creative DeFi prize)
  const effectiveName = ensName ? normalize(ensName) : resolvedName ? normalize(resolvedName) : undefined;
  const { data: settlementChain } = useEnsText({
    name: effectiveName,
    key: 'swiftpay.chain',
    chainId: mainnet.id,
  });
  const { data: settlementSchedule } = useEnsText({
    name: effectiveName,
    key: 'swiftpay.schedule',
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
          {resolverAddress && (
            <p className="text-gray-500 text-[10px] font-mono truncate">
              Resolver: {String(resolverAddress).slice(0, 10)}…{String(resolverAddress).slice(-4)}
            </p>
          )}
          {isLoading && (
            <p className="text-yellow-400 text-xs">Resolving ENS...</p>
          )}
        </div>
      </div>

      {/* Settlement preferences from ENS text records */}
      {showTextRecords && (settlementChain || settlementSchedule) && (
        <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
          {settlementChain && (
            <span className="bg-yellow-400/10 text-yellow-400 text-xs px-2 py-1 rounded-full">
              ⛓ {settlementChain}
            </span>
          )}
          {settlementSchedule && (
            <span className="bg-blue-400/10 text-blue-400 text-xs px-2 py-1 rounded-full">
              🕐 {settlementSchedule}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
