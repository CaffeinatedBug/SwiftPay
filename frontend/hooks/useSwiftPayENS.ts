/**
 * React Hook for ENS Resolution in SwiftPay
 * 
 * Provides merchant discovery via ENS names
 * Usage: const { merchant, loading, error } = useSwiftPayENS('coffee.swiftpay.eth');
 */

import { useEffect, useState } from 'react';
import { resolveSwiftPayMerchant, getENSAddress, type SwiftPayENSRecord } from '@/lib/ens';

interface UseSwiftPayENSResult {
  merchant: SwiftPayENSRecord | null;
  address: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSwiftPayENS(
  ensName: string | null,
  network: 'mainnet' | 'sepolia' = 'sepolia' // Default to Sepolia for demo
): UseSwiftPayENSResult {
  const [merchant, setMerchant] = useState<SwiftPayENSRecord | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchENSData = async () => {
    if (!ensName || ensName.trim() === '') {
      setMerchant(null);
      setAddress(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch merchant record and address in parallel
      const [merchantRecord, ensAddress] = await Promise.all([
        resolveSwiftPayMerchant(ensName, network),
        getENSAddress(ensName, network),
      ]);

      setMerchant(merchantRecord);
      setAddress(ensAddress);

      if (!merchantRecord) {
        setError(`${ensName} is not registered as a SwiftPay merchant`);
      } else if (!ensAddress) {
        setError(`${ensName} has no address set`);
      }
    } catch (err) {
      console.error('❌ ENS resolution error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resolve ENS name');
      setMerchant(null);
      setAddress(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchENSData();
  }, [ensName, network]);

  return {
    merchant,
    address,
    loading,
    error,
    refetch: fetchENSData,
  };
}

/**
 * Hook for reverse ENS lookup (address → name)
 */
export function useReverseENS(
  address: string | null,
  network: 'mainnet' | 'sepolia' = 'sepolia'
): { ensName: string | null; loading: boolean } {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setEnsName(null);
      return;
    }

    setLoading(true);
    
    import('@/lib/ens')
      .then(({ reverseResolveENS }) => reverseResolveENS(address, network))
      .then(setEnsName)
      .catch((err) => {
        console.error('❌ Reverse ENS lookup failed:', err);
        setEnsName(null);
      })
      .finally(() => setLoading(false));
  }, [address, network]);

  return { ensName, loading };
}
