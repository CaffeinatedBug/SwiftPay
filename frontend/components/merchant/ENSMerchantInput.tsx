/**
 * ENS Merchant Input Component
 * 
 * Allows users to enter ENS names or Ethereum addresses
 * Validates and resolves SwiftPay merchant information
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSwiftPayENS } from '@/hooks/useSwiftPayENS';
import { isENSName } from '@/lib/ens';
import { Search, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ENSMerchantInputProps {
  onMerchantSelected: (merchantInfo: {
    address: string;
    ensName?: string;
    endpoint: string;
    vault?: string;
    chain?: string;
  }) => void;
  network?: 'mainnet' | 'sepolia';
  placeholder?: string;
}

export function ENSMerchantInput({ 
  onMerchantSelected, 
  network = 'sepolia',
  placeholder = 'Enter ENS name (e.g., coffee.swiftpay.eth) or address'
}: ENSMerchantInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [searchValue, setSearchValue] = useState<string | null>(null);
  
  const { merchant, address, loading, error } = useSwiftPayENS(searchValue, network);

  const handleSearch = () => {
    if (!inputValue.trim()) return;
    setSearchValue(inputValue.trim());
  };

  const handleSelect = () => {
    if (!address) return;

    onMerchantSelected({
      address,
      ensName: merchant?.ensName,
      endpoint: merchant?.endpoint || address,
      vault: merchant?.vault || undefined,
      chain: merchant?.chain || 'sepolia',
    });
  };

  const isValidInput = isENSName(inputValue) || /^0x[a-fA-F0-9]{40}$/.test(inputValue);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch} 
          disabled={!isValidInput || loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Validation Message */}
      {inputValue && !isValidInput && (
        <p className="text-sm text-destructive">
          Please enter a valid ENS name (name.eth) or Ethereum address (0x...)
        </p>
      )}

      {/* Resolution Result */}
      {searchValue && !loading && (
        <Card className="p-4">
          {error ? (
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Resolution Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          ) : merchant && address ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">SwiftPay Merchant Found</p>
                  {merchant.ensName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {merchant.ensName}
                    </p>
                  )}
                </div>
              </div>

              {/* Merchant Details */}
              <div className="space-y-2 pl-8">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Address:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </code>
                </div>

                {merchant.endpoint && merchant.endpoint !== address && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Endpoint:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {merchant.endpoint.slice(0, 10)}...
                    </code>
                  </div>
                )}

                {merchant.vault && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Vault:</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {merchant.vault.slice(0, 6)}...{merchant.vault.slice(-4)}
                    </code>
                  </div>
                )}

                {merchant.chain && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Settlement:</span>
                    <Badge variant="outline" className="text-xs">
                      {merchant.chain.toUpperCase()}
                    </Badge>
                    {merchant.schedule && (
                      <Badge variant="secondary" className="text-xs">
                        {merchant.schedule}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Select Button */}
              <Button 
                onClick={handleSelect}
                className="w-full mt-2"
              >
                Pay this Merchant
              </Button>
            </div>
          ) : address ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Address Resolved</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Not registered as SwiftPay merchant
                  </p>
                </div>
              </div>

              <div className="pl-8">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {address}
                </code>
              </div>

              <Button 
                onClick={() => onMerchantSelected({
                  address,
                  endpoint: address,
                  chain: 'sepolia',
                })}
                variant="secondary"
                className="w-full mt-2"
              >
                Pay Anyway (Manual)
              </Button>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
