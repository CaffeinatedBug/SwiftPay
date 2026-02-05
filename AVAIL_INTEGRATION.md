# Avail Nexus Integration - Phase 5

## Overview

**Avail Nexus** is SwiftPay's **Cross-Chain Liquidity Layer**, enabling users to bridge USDC from any supported chain (Base, Arbitrum, Optimism, etc.) to Sepolia for Yellow Network payments.

This solves the "liquidity fragmentation" problem: users with funds on Base can instantly pay merchants on Sepolia without manual bridging.

---

## Architecture

### The "Top Up" Flow

```
User has USDC on Base
    ↓
Click "Top Up" in SwiftPay
    ↓
Avail Nexus Bridge (Base → Sepolia USDC)
    ↓
Deposit to Yellow Network
    ↓
Ready for instant payments
```

### Integration Points

1. **Frontend**: "Top Up" modal in UserPanel
2. **Avail SDK**: `@avail-project/nexus` for bridging
3. **Yellow Hub**: Receive bridged USDC, deposit to Yellow
4. **Settlement**: Can bridge back (Sepolia → Arc) for final settlement

---

## Installation

```bash
cd frontend
npm install @avail-project/nexus
```

---

## Implementation

### 1. Avail Bridge Service (`lib/avail-bridge.ts`)

```typescript
/**
 * Avail Nexus Bridge Service for SwiftPay
 * 
 * Enables cross-chain USDC transfers for Yellow Network liquidity
 */

import { NexusClient, type BridgeConfig } from '@avail-project/nexus';

const SUPPORTED_CHAINS = {
  base: { chainId: 8453, name: 'Base' },
  arbitrum: { chainId: 42161, name: 'Arbitrum' },
  optimism: { chainId: 10, name: 'Optimism' },
  sepolia: { chainId: 11155111, name: 'Sepolia' },
  arc: { chainId: 5042002, name: 'Arc Testnet' },
} as const;

const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  arc: '0x...', // To be deployed
} as const;

export class AvailBridgeService {
  private nexusClient: NexusClient;

  constructor(environment: 'testnet' | 'mainnet' = 'testnet') {
    this.nexusClient = new NexusClient({
      environment,
      apiUrl: environment === 'testnet' 
        ? 'https://api.testnet.avail.so'
        : 'https://api.avail.so',
    });
  }

  /**
   * Bridge USDC from source chain to Sepolia for Yellow Network
   */
  async bridgeToSepolia(params: {
    fromChain: keyof typeof SUPPORTED_CHAINS;
    amount: bigint;
    userAddress: string;
  }): Promise<{ txHash: string; estimatedTime: number }> {
    const { fromChain, amount, userAddress } = params;

    const bridgeConfig: BridgeConfig = {
      sourceChain: SUPPORTED_CHAINS[fromChain].chainId,
      destinationChain: SUPPORTED_CHAINS.sepolia.chainId,
      token: USDC_ADDRESSES[fromChain],
      amount: amount.toString(),
      recipient: userAddress,
    };

    const tx = await this.nexusClient.bridge(bridgeConfig);
    
    return {
      txHash: tx.hash,
      estimatedTime: tx.estimatedMinutes * 60, // Convert to seconds
    };
  }

  /**
   * Bridge from Sepolia to Arc for final settlement
   */
  async bridgeToArc(params: {
    amount: bigint;
    userAddress: string;
    vaultAddress: string;
  }): Promise<{ txHash: string }> {
    const { amount, vaultAddress } = params;

    const bridgeConfig: BridgeConfig = {
      sourceChain: SUPPORTED_CHAINS.sepolia.chainId,
      destinationChain: SUPPORTED_CHAINS.arc.chainId,
      token: USDC_ADDRESSES.sepolia,
      amount: amount.toString(),
      recipient: vaultAddress, // Send directly to Arc vault
    };

    const tx = await this.nexusClient.bridge(bridgeConfig);
    
    return { txHash: tx.hash };
  }

  /**
   * Get bridge status for tracking
   */
  async getBridgeStatus(txHash: string) {
    return await this.nexusClient.getTransferStatus(txHash);
  }

  /**
   * Get estimated bridge time
   */
  async getEstimatedTime(fromChain: keyof typeof SUPPORTED_CHAINS): Promise<number> {
    // Avail Nexus typically takes 5-15 minutes
    // This can be fetched from API in production
    const estimates = {
      base: 600, // 10 minutes
      arbitrum: 600,
      optimism: 600,
      sepolia: 300,
      arc: 300,
    };
    
    return estimates[fromChain] || 600;
  }

  /**
   * Get user's USDC balance on chain
   */
  async getUSDCBalance(params: {
    chain: keyof typeof SUPPORTED_CHAINS;
    userAddress: string;
  }): Promise<bigint> {
    // This would use viem to query ERC20 balance
    // Implementation depends on having RPC access to each chain
    throw new Error('Not implemented - use viem publicClient');
  }
}

export const availBridge = new AvailBridgeService(
  process.env.NEXT_PUBLIC_AVAIL_ENV as 'testnet' | 'mainnet' || 'testnet'
);
```

### 2. React Hook (`hooks/useAvailBridge.ts`)

```typescript
/**
 * React Hook for Avail Nexus Bridge
 */

import { useState } from 'react';
import { availBridge } from '@/lib/avail-bridge';
import { useAccount } from 'wagmi';

export function useAvailBridge() {
  const { address } = useAccount();
  const [bridging, setBridging] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const bridgeToSepolia = async (fromChain: string, amount: bigint) => {
    if (!address) {
      setError('Wallet not connected');
      return null;
    }

    setBridging(true);
    setError(null);
    setTxHash(null);

    try {
      const result = await availBridge.bridgeToSepolia({
        fromChain: fromChain as any,
        amount,
        userAddress: address,
      });

      setTxHash(result.txHash);
      
      // Poll for completion
      await pollBridgeStatus(result.txHash);
      
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Bridge failed';
      setError(errorMsg);
      return null;
    } finally {
      setBridging(false);
    }
  };

  const pollBridgeStatus = async (hash: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 30 minutes (30 second intervals)

    while (attempts < maxAttempts) {
      const status = await availBridge.getBridgeStatus(hash);
      
      if (status.completed) {
        console.log('✅ Bridge complete:', status);
        return status;
      }
      
      if (status.failed) {
        throw new Error('Bridge failed');
      }

      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30s
      attempts++;
    }

    throw new Error('Bridge timeout');
  };

  return {
    bridgeToSepolia,
    bridging,
    txHash,
    error,
  };
}
```

### 3. Top Up Modal Component

```typescript
/**
 * components/merchant/TopUpModal.tsx
 * 
 * Modal for bridging USDC from other chains to Sepolia
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAvailBridge } from '@/hooks/useAvailBridge';
import { parseUnits } from 'viem';

const CHAINS = [
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
  { id: 'optimism', name: 'Optimism', icon: '🔴' },
];

export function TopUpModal({ 
  open, 
  onOpenChange,
  onSuccess 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [selectedChain, setSelectedChain] = useState('base');
  const [amount, setAmount] = useState('');
  const { bridgeToSepolia, bridging, error } = useAvailBridge();

  const handleBridge = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
    const result = await bridgeToSepolia(selectedChain, amountWei);

    if (result) {
      onSuccess?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top Up via Avail Nexus</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Chain Selection */}
          <div>
            <label className="text-sm font-medium">From Chain</label>
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHAINS.map(chain => (
                  <SelectItem key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="text-sm font-medium">Amount (USDC)</label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={bridging}
            />
          </div>

          {/* Error Display */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Bridge Info */}
          <div className="text-sm text-muted-foreground">
            <p>Estimated time: ~10 minutes</p>
            <p>Destination: Sepolia (Yellow Network)</p>
          </div>

          {/* Bridge Button */}
          <Button 
            onClick={handleBridge}
            disabled={!amount || bridging}
            className="w-full"
          >
            {bridging ? 'Bridging...' : 'Bridge USDC'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Frontend Integration

### Update UserPanel.tsx

```typescript
import { TopUpModal } from '@/components/merchant/TopUpModal';

export function UserPanel() {
  const [showTopUp, setShowTopUp] = useState(false);

  return (
    <>
      <Button onClick={() => setShowTopUp(true)}>
        Top Up via Avail Nexus
      </Button>

      <TopUpModal 
        open={showTopUp}
        onOpenChange={setShowTopUp}
        onSuccess={() => {
          // Refresh Yellow channel balance
          console.log('✅ Bridge complete - refresh balance');
        }}
      />
    </>
  );
}
```

---

## Backend Integration

### Receive Bridged USDC

```typescript
// backend/src/index.ts

// Webhook endpoint for Avail Nexus notifications
app.post('/api/avail/webhook', async (req, res) => {
  const { txHash, recipient, amount, token } = req.body;

  console.log('📨 Avail bridge complete:', { txHash, recipient, amount });

  // Auto-deposit bridged USDC to Yellow Network
  try {
    await yellowHub.depositFunds(BigInt(amount));
    console.log('✅ Auto-deposited bridged USDC to Yellow Network');
  } catch (error) {
    console.error('❌ Auto-deposit failed:', error);
  }

  res.json({ success: true });
});
```

---

## Demo Flow

### User Story: "Bridge from Base to Pay on Sepolia"

1. **User has 10 USDC on Base**
2. **Opens SwiftPay, clicks "Top Up"**
3. **Selects Base, enters 10 USDC**
4. **Clicks "Bridge USDC"**
   - Avail Nexus initiates bridge (Base → Sepolia)
   - Shows progress bar: "Bridging... ~10 minutes"
5. **Bridge completes**
   - Bridged USDC arrives on Sepolia
   - Backend auto-deposits to Yellow Network
   - User sees updated balance: "10 USDC available"
6. **User makes instant payment**
   - Uses Yellow Network for <200ms clearing
   - No manual bridging needed

---

## Prize Qualification

### How This Helps Win Prizes

**Yellow Network Prize ($15,000)**:
- Avail solves liquidity onboarding → more users can access Yellow
- "Universal Payment Rail" narrative: bring funds from any chain

**Arc Prize ($5,000)**:
- Can bridge directly to Arc for settlements (Sepolia → Arc)
- Reduces costs by batching cross-chain transfers

**Overall Impact**:
- Creates complete UX: Bridge → Pay → Settle
- Demonstrates real-world utility (multi-chain support)
- Differentiates from other submissions

---

## Testing Checklist

- [ ] Install `@avail-project/nexus` package
- [ ] Implement `lib/avail-bridge.ts` service
- [ ] Create `useAvailBridge` hook
- [ ] Build `TopUpModal` component
- [ ] Wire to UserPanel UI
- [ ] Test bridge (Base → Sepolia)
- [ ] Verify auto-deposit to Yellow Network
- [ ] Record demo: "Top Up from Base → Yellow Payment"

---

## Next Steps

1. **Install Avail SDK**: `npm install @avail-project/nexus`
2. **Implement Bridge Service**: Create `lib/avail-bridge.ts`
3. **Add Top Up UI**: Modal in UserPanel
4. **Test Cross-Chain Flow**: Base USDC → Sepolia → Yellow
5. **Record Demo Video**: Show all 4 layers working together

---

## Resources

- **Avail Docs**: https://docs.availproject.org/
- **Nexus SDK**: https://github.com/availproject/nexus
- **Avail Bridge UI**: https://bridge.availproject.org/
- **Testnet Faucet**: https://faucet.avail.so/

---

## Status

**Phase 5 (Avail Nexus): 📝 PLANNED**

- [ ] Install Avail SDK
- [ ] Bridge service implementation
- [ ] React hooks
- [ ] Top Up modal UI
- [ ] Backend webhook integration
- [ ] Demo testing

**Ready for**: Full system integration + Demo video
