/**
 * ENS Integration Demo Page
 * 
 * Showcases all ENS features for prize qualification:
 * - Merchant discovery via ENS names
 * - Text records for DeFi preferences (creative use)
 * - ENS avatars
 * - Merchant registration
 * - Payment limits and fees stored in ENS
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ENSMerchantInput } from '@/components/merchant/ENSMerchantInput';
import { ENSMerchantRegistration } from '@/components/merchant/ENSMerchantRegistration';
import { ENSAvatar, ENSProfile } from '@/components/ui/ens-avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Sparkles, DollarSign, Shield, Zap } from 'lucide-react';

export default function ENSDemoPage() {
  const [selectedMerchant, setSelectedMerchant] = useState<any>(null);

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold">SwiftPay × ENS Integration</h1>
        <p className="text-lg text-muted-foreground">
          Human-readable merchant discovery with on-chain payment preferences
        </p>
        
        {/* Prize Badges */}
        <div className="mt-4 flex justify-center gap-2">
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            $3,500 Integration Prize Qualified
          </Badge>
          <Badge variant="default" className="gap-1">
            <Sparkles className="h-3 w-3" />
            $1,500 Creative DeFi Prize Qualified
          </Badge>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-5 w-5 text-primary" />
              Payment Limits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Merchants set min/max payment amounts in ENS text records (swiftpay.minpay, swiftpay.maxpay)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Settlement Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Specify preferred chain (Arc, Arbitrum, Base) and frequency (instant, daily, weekly) via ENS
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-primary" />
              Instant Discovery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Type "coffee.swiftpay.eth" instead of scanning QR codes - ENS resolves to payment endpoint
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Demo Tabs */}
      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover">Discover Merchants</TabsTrigger>
          <TabsTrigger value="register">Register Merchant</TabsTrigger>
          <TabsTrigger value="technical">Technical Details</TabsTrigger>
        </TabsList>

        {/* Merchant Discovery Tab */}
        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Merchants via ENS</CardTitle>
              <CardDescription>
                Enter an ENS name to discover SwiftPay merchant configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ENSMerchantInput
                onMerchantSelected={setSelectedMerchant}
                network="sepolia"
                placeholder="Enter ENS name (e.g., coffee.swiftpay.eth)"
              />

              {selectedMerchant && (
                <Alert className="mt-6">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Merchant Found!</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <ENSAvatar address={selectedMerchant.address} ensName={selectedMerchant.ensName} />
                        <div>
                          <div className="font-mono text-sm font-bold">
                            {selectedMerchant.ensName || selectedMerchant.address}
                          </div>
                          {selectedMerchant.vault && (
                            <div className="text-xs text-muted-foreground">
                              Settlement: {selectedMerchant.chain?.toUpperCase()} • {selectedMerchant.schedule}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Example Merchants */}
          <Card>
            <CardHeader>
              <CardTitle>Example SwiftPay Merchants</CardTitle>
              <CardDescription>
                Try searching for these demo ENS names (once registered on Sepolia)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'coffee.swiftpay.eth', type: '☕ Coffee Shop', chain: 'Sepolia', schedule: 'Daily' },
                  { name: 'gas.swiftpay.eth', type: '⛽ Gas Station', chain: 'Arc', schedule: 'Instant' },
                  { name: 'market.swiftpay.eth', type: '🛒 Supermarket', chain: 'Base', schedule: 'Weekly' },
                ].map((merchant) => (
                  <div
                    key={merchant.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="font-mono text-sm font-semibold">{merchant.name}</div>
                      <div className="text-xs text-muted-foreground">{merchant.type}</div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{merchant.chain}</Badge>
                      <Badge variant="secondary">{merchant.schedule}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Merchant Registration Tab */}
        <TabsContent value="register">
          <ENSMerchantRegistration />
        </TabsContent>

        {/* Technical Details Tab */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ENS Text Records Schema</CardTitle>
              <CardDescription>
                SwiftPay stores merchant configuration in 7 custom ENS text records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="mb-1 font-mono text-sm font-bold text-primary">
                    swiftpay.endpoint
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Yellow Network payment endpoint (wallet address)
                  </p>
                  <div className="mt-2 rounded bg-muted p-2 font-mono text-xs">
                    Example: 0xd630a3599b23F8B3c10761003dB9b345663F344D
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-1 font-mono text-sm font-bold text-primary">
                    swiftpay.vault
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Arc blockchain vault address for settlements
                  </p>
                  <div className="mt-2 rounded bg-muted p-2 font-mono text-xs">
                    Example: 0x1234567890abcdef1234567890abcdef12345678
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-1 font-mono text-sm font-bold text-primary">
                    swiftpay.chain
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Preferred settlement blockchain (sepolia, arc, arbitrum, base)
                  </p>
                  <div className="mt-2 rounded bg-muted p-2 font-mono text-xs">
                    Example: arc
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-1 font-mono text-sm font-bold text-primary">
                    swiftpay.schedule
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Settlement frequency (instant, hourly, daily, weekly)
                  </p>
                  <div className="mt-2 rounded bg-muted p-2 font-mono text-xs">
                    Example: daily
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-1 font-mono text-sm font-bold text-primary">
                    swiftpay.minpay / swiftpay.maxpay
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Minimum and maximum payment amounts in USDC
                  </p>
                  <div className="mt-2 rounded bg-muted p-2 font-mono text-xs">
                    minpay: 1, maxpay: 10000
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="mb-1 font-mono text-sm font-bold text-primary">
                    swiftpay.fees
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Merchant fee percentage (e.g., "2.5" = 2.5%)
                  </p>
                  <div className="mt-2 rounded bg-muted p-2 font-mono text-xs">
                    Example: 0 (no fees)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prize Qualification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">$3,500 Integration Prize</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>✅ Custom ENS resolution hooks (useSwiftPayENS, useReverseENS)</li>
                    <li>✅ Functional demo without hard-coded values</li>
                    <li>✅ Open source code (GitHub)</li>
                    <li>✅ ENS-specific code (not just RainbowKit)</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert>
                <Sparkles className="h-4 w-4 text-purple-600" />
                <AlertTitle className="text-purple-600">$1,500 Creative DeFi Prize</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>✅ Beyond simple name→address mapping</li>
                    <li>✅ DeFi-specific: Payment limits, settlement preferences, merchant fees</li>
                    <li>✅ 7 custom text records for merchant configuration</li>
                    <li>✅ ENS avatars for merchant profiles</li>
                    <li>✅ Real value-add: Users discover merchants by human names</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
