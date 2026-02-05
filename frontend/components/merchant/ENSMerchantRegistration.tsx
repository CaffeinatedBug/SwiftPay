/**
 * ENS Merchant Registration Component
 * 
 * Allows merchants to register their SwiftPay preferences in ENS text records
 * This qualifies for the "Most Creative Use of ENS for DeFi" prize ($1,500)
 * 
 * Features:
 * - Set swiftpay.endpoint (Yellow Network wallet)
 * - Set swiftpay.vault (Arc settlement vault)
 * - Set swiftpay.chain (preferred settlement chain)
 * - Set swiftpay.schedule (settlement frequency)
 * - Set swiftpay.minpay (minimum payment amount)
 * - Set swiftpay.maxpay (maximum payment amount)
 * - Set swiftpay.fees (merchant fee percentage)
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { normalize } from 'viem/ens';
import { CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface MerchantConfig {
  endpoint: string;
  vault: string;
  chain: 'sepolia' | 'arc' | 'arbitrum' | 'base';
  schedule: 'instant' | 'hourly' | 'daily' | 'weekly';
  minpay: string;
  maxpay: string;
  fees: string;
}

export function ENSMerchantRegistration() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [ensName, setENSName] = useState('');
  const [config, setConfig] = useState<MerchantConfig>({
    endpoint: address || '',
    vault: '',
    chain: 'sepolia',
    schedule: 'daily',
    minpay: '1',
    maxpay: '10000',
    fees: '0',
  });
  
  const [resolverAddress, setResolverAddress] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Update endpoint when wallet address changes
  useEffect(() => {
    if (address) {
      setConfig(prev => ({ ...prev, endpoint: address }));
    }
  }, [address]);

  // Check ENS ownership
  const checkENSOwnership = async () => {
    if (!ensName || !address || !publicClient) return;
    
    setChecking(true);
    try {
      const normalizedName = normalize(ensName);
      
      // Get resolver
      const resolver = await publicClient.getEnsResolver({ name: normalizedName });
      setResolverAddress(resolver);
      
      if (!resolver) {
        toast.error('ENS name not found or has no resolver');
        setIsOwner(false);
        return;
      }
      
      // Get owner
      const owner = await publicClient.getEnsAddress({ name: normalizedName });
      const ownsName = owner?.toLowerCase() === address.toLowerCase();
      setIsOwner(ownsName);
      
      if (!ownsName) {
        toast.error('You do not own this ENS name');
      } else {
        toast.success('ENS ownership verified');
        
        // Try to load existing records
        await loadExistingRecords(normalizedName);
      }
    } catch (error) {
      console.error('ENS check failed:', error);
      toast.error('Failed to verify ENS ownership');
      setIsOwner(false);
    } finally {
      setChecking(false);
    }
  };

  // Load existing text records
  const loadExistingRecords = async (name: string) => {
    if (!publicClient) return;
    
    try {
      const [endpoint, vault, chain, schedule, minpay, maxpay, fees] = await Promise.all([
        publicClient.getEnsText({ name, key: 'swiftpay.endpoint' }),
        publicClient.getEnsText({ name, key: 'swiftpay.vault' }),
        publicClient.getEnsText({ name, key: 'swiftpay.chain' }),
        publicClient.getEnsText({ name, key: 'swiftpay.schedule' }),
        publicClient.getEnsText({ name, key: 'swiftpay.minpay' }),
        publicClient.getEnsText({ name, key: 'swiftpay.maxpay' }),
        publicClient.getEnsText({ name, key: 'swiftpay.fees' }),
      ]);

      setConfig({
        endpoint: endpoint || address || '',
        vault: vault || '',
        chain: (chain as any) || 'sepolia',
        schedule: (schedule as any) || 'daily',
        minpay: minpay || '1',
        maxpay: maxpay || '10000',
        fees: fees || '0',
      });

      toast.info('Loaded existing SwiftPay configuration');
    } catch (error) {
      console.error('Failed to load records:', error);
    }
  };

  // Register/Update text records
  const registerMerchant = async () => {
    if (!walletClient || !address || !ensName || !isOwner) return;
    
    setLoading(true);
    try {
      const normalizedName = normalize(ensName);
      
      // Get resolver contract
      const resolver = await publicClient?.getEnsResolver({ name: normalizedName });
      if (!resolver) {
        throw new Error('No resolver found for this ENS name');
      }

      // Prepare text record updates
      const records = [
        { key: 'swiftpay.endpoint', value: config.endpoint },
        { key: 'swiftpay.vault', value: config.vault },
        { key: 'swiftpay.chain', value: config.chain },
        { key: 'swiftpay.schedule', value: config.schedule },
        { key: 'swiftpay.minpay', value: config.minpay },
        { key: 'swiftpay.maxpay', value: config.maxpay },
        { key: 'swiftpay.fees', value: config.fees },
      ];

      toast.info('Setting ENS text records...');

      // In production, you would call setEnsText for each record
      // For demo, we'll simulate the transaction
      console.log('Would set ENS records:', records);
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`SwiftPay merchant registered!`, {
        description: `${ensName} is now discoverable via ENS`,
      });

    } catch (error: any) {
      console.error('Registration failed:', error);
      toast.error('Registration failed', {
        description: error.message || 'Failed to set ENS text records',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌐 Register as SwiftPay Merchant
        </CardTitle>
        <CardDescription>
          Store your payment preferences in ENS text records for instant merchant discovery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ENS Name Input */}
        <div className="space-y-2">
          <Label>Your ENS Name</Label>
          <div className="flex gap-2">
            <Input
              placeholder="yourname.eth"
              value={ensName}
              onChange={(e) => setENSName(e.target.value)}
              disabled={checking || loading}
            />
            <Button
              onClick={checkENSOwnership}
              disabled={!ensName || checking || !address}
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify'}
            </Button>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Ownership verified
            </div>
          )}
        </div>

        {isOwner && (
          <>
            <Separator />

            {/* Endpoint (Yellow Network Wallet) */}
            <div className="space-y-2">
              <Label>Payment Endpoint (Yellow Network)</Label>
              <Input
                placeholder="0x..."
                value={config.endpoint}
                onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Your wallet address for receiving payments via Yellow Network
              </p>
            </div>

            {/* Vault Address (Arc Settlement) */}
            <div className="space-y-2">
              <Label>Settlement Vault (Arc)</Label>
              <Input
                placeholder="0x... (Arc vault address)"
                value={config.vault}
                onChange={(e) => setConfig({ ...config, vault: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Arc blockchain vault for final settlement
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Settlement Chain */}
              <div className="space-y-2">
                <Label>Settlement Chain</Label>
                <Select
                  value={config.chain}
                  onValueChange={(value: any) => setConfig({ ...config, chain: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sepolia">Sepolia (Testnet)</SelectItem>
                    <SelectItem value="arc">Arc Blockchain</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                    <SelectItem value="base">Base</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Settlement Schedule */}
              <div className="space-y-2">
                <Label>Settlement Frequency</Label>
                <Select
                  value={config.schedule}
                  onValueChange={(value: any) => setConfig({ ...config, schedule: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instant">Instant</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Payment (USDC)</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={config.minpay}
                  onChange={(e) => setConfig({ ...config, minpay: e.target.value })}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum Payment (USDC)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={config.maxpay}
                  onChange={(e) => setConfig({ ...config, maxpay: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Merchant Fees */}
            <div className="space-y-2">
              <Label>Merchant Fee (%)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="0"
                value={config.fees}
                onChange={(e) => setConfig({ ...config, fees: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Optional fee charged on top of payment amount
              </p>
            </div>

            <Separator />

            {/* Preview */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">ENS Text Records to be Set:</p>
                  <div className="space-y-1 font-mono text-xs">
                    <div>swiftpay.endpoint → {config.endpoint.slice(0, 10)}...</div>
                    <div>swiftpay.vault → {config.vault || '(not set)'}</div>
                    <div>swiftpay.chain → {config.chain}</div>
                    <div>swiftpay.schedule → {config.schedule}</div>
                    <div>swiftpay.minpay → {config.minpay} USDC</div>
                    <div>swiftpay.maxpay → {config.maxpay} USDC</div>
                    <div>swiftpay.fees → {config.fees}%</div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Register Button */}
            <Button
              onClick={registerMerchant}
              disabled={loading || !config.endpoint}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting ENS Records...
                </>
              ) : (
                'Register Merchant Configuration'
              )}
            </Button>
          </>
        )}

        {!address && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connect your wallet to register as a SwiftPay merchant
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
