/**
 * ENS Avatar Component
 * 
 * Displays ENS avatars for merchants and users
 * Uses ENS avatar text records or NFT avatars
 */

'use client';

import { useEffect, useState } from 'react';
import { useEnsAvatar, useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ENSAvatarProps {
  address?: string;
  ensName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ENSAvatar({ address, ensName: providedName, size = 'md', className }: ENSAvatarProps) {
  const { data: resolvedName } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: mainnet.id,
  });

  const nameToUse = providedName || resolvedName;

  const { data: avatarUrl } = useEnsAvatar({
    name: nameToUse as string | undefined,
    chainId: mainnet.id,
  });

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const getInitials = () => {
    if (nameToUse) {
      const parts = nameToUse.split('.');
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (address) {
      return address.slice(2, 4).toUpperCase();
    }
    return '??';
  };

  const getFallbackGradient = () => {
    // Generate consistent gradient based on address or name
    const seed = nameToUse || address || '';
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${(hue + 60) % 360}, 70%, 60%))`;
  };

  return (
    <div className={className}>
      <Avatar className={sizeClasses[size]}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={nameToUse || address} />}
        <AvatarFallback
          style={{
            background: getFallbackGradient(),
          }}
          className="text-white font-bold"
        >
          {getInitials()}
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

/**
 * ENS Name Display with Avatar
 */
interface ENSProfileProps {
  address: string;
  ensName?: string;
  showAddress?: boolean;
}

export function ENSProfile({ address, ensName: providedName, showAddress = true }: ENSProfileProps) {
  const { data: resolvedName } = useEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id,
  });

  const nameToUse = providedName || resolvedName;

  return (
    <div className="flex items-center gap-3">
      <ENSAvatar address={address} ensName={nameToUse || undefined} size="md" />
      <div className="flex-1">
        {nameToUse ? (
          <>
            <div className="font-mono text-sm font-semibold">{nameToUse}</div>
            {showAddress && (
              <div className="font-mono text-xs text-muted-foreground">
                {address.slice(0, 6)}...{address.slice(-4)}
              </div>
            )}
          </>
        ) : (
          <div className="font-mono text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}
