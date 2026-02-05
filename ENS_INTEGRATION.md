# ENS Integration for SwiftPay - Phase 4

## Overview

SwiftPay uses **Ethereum Name Service (ENS)** as the **Identity Layer** for merchant discovery. Instead of scanning QR codes or copying addresses, users can simply type a human-readable name like `coffee.swiftpay.eth` to find and pay merchants.

This integration qualifies for the **$5,000 ENS Prize** by using ENS text records to store SwiftPay merchant configuration.

---

## Architecture

### ENS Text Records

Each SwiftPay merchant registers 4 custom text records in their ENS name:

| Key | Description | Example |
|-----|-------------|---------|
| `swiftpay.endpoint` | Yellow Network endpoint or wallet address | `0x1234...5678` |
| `swiftpay.vault` | Arc vault address for settlements | `0xabcd...ef00` |
| `swiftpay.chain` | Preferred settlement chain | `arc`, `sepolia` |
| `swiftpay.schedule` | Settlement frequency | `instant`, `daily`, `weekly` |

### Resolution Flow

```
User Input: "coffee.swiftpay.eth"
    ↓
ENS Resolution (Mainnet/Sepolia)
    ↓
Fetch Text Records (swiftpay.*)
    ↓
Validate Merchant Configuration
    ↓
Return Merchant Info → Yellow Payment
```

---

## Implementation

### 1. ENS Service (`lib/ens.ts`)

```typescript
// Resolve SwiftPay merchant information
const merchant = await resolveSwiftPayMerchant('coffee.swiftpay.eth');
// → { endpoint, vault, chain, schedule }

// Standard ENS address resolution
const address = await getENSAddress('coffee.swiftpay.eth');
// → 0x1234...5678

// Reverse lookup (address → name)
const name = await reverseResolveENS('0x1234...5678');
// → 'coffee.swiftpay.eth'
```

**Key Features:**
- Uses `viem` for ENS interactions (no additional dependencies)
- Supports both Mainnet and Sepolia
- Parallel text record fetching for performance
- Validates SwiftPay merchant configuration

### 2. React Hook (`hooks/useSwiftPayENS.ts`)

```typescript
// In a React component
const { merchant, address, loading, error } = useSwiftPayENS('coffee.swiftpay.eth');

if (loading) return <Spinner />;
if (error) return <Error message={error} />;
if (merchant) {
  // Use merchant.endpoint for Yellow payment
  // Use merchant.vault for Arc settlement
}
```

**Features:**
- Automatic resolution when ENS name changes
- Loading/error states for UI
- Refetch capability
- TypeScript typed results

### 3. UI Component (`components/merchant/ENSMerchantInput.tsx`)

**Visual Flow:**
1. User types ENS name or address
2. Click search → resolves via ENS
3. Show merchant details (endpoint, vault, chain)
4. "Pay this Merchant" button → triggers Yellow payment

**Features:**
- Real-time validation (ENS format or 0x address)
- Loading spinner during resolution
- Success state with merchant info badges
- Fallback for non-SwiftPay ENS names
- Integration with Yellow Network payment flow

---

## Configuration

### Environment Variables

```bash
# Mainnet ENS (production merchant discovery)
NEXT_PUBLIC_ENS_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Sepolia ENS (testnet/demo)
NEXT_PUBLIC_ENS_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
```

### Network Selection

- **Demo/Testing**: Use Sepolia (test ENS names)
- **Production**: Use Mainnet (real merchant ENS names)

---

## Demo Setup

### Step 1: Register ENS Name (Sepolia)

**Option A: Use ENS App**
1. Go to https://app.ens.domains
2. Connect wallet (Sepolia)
3. Register `swiftpay-demo.eth` (or similar)

**Option B: Use ENS SDK**
```typescript
// Register via contract interaction
// See: https://docs.ens.domains/dapp-developer-guide/ens-enabling-your-dapp
```

### Step 2: Set Text Records

Using ENS App or contract calls, set these records:

```
swiftpay.endpoint → 0xd630a3599b23F8B3c10761003dB9b345663F344D (hub wallet)
swiftpay.vault → <ARC_VAULT_ADDRESS>
swiftpay.chain → sepolia
swiftpay.schedule → instant
```

### Step 3: Test Resolution

```bash
# In frontend dev console
import { resolveSwiftPayMerchant } from './lib/ens';
const merchant = await resolveSwiftPayMerchant('swiftpay-demo.eth', 'sepolia');
console.log(merchant);
```

Expected output:
```json
{
  "ensName": "swiftpay-demo.eth",
  "endpoint": "0xd630a3599b23F8B3c10761003dB9b345663F344D",
  "vault": "0x...",
  "chain": "sepolia",
  "schedule": "instant",
  "resolverAddress": "0x..."
}
```

### Step 4: Test Payment Flow

1. Open SwiftPay frontend
2. Go to "Pay" section
3. Enter `swiftpay-demo.eth`
4. Click search → see merchant info
5. Click "Pay this Merchant"
6. Enter amount → Yellow Network payment starts

---

## Integration with Other Layers

### Yellow Network (Phase 3)
```typescript
// After ENS resolution
const merchant = await resolveSwiftPayMerchant(ensName);
// Use merchant.endpoint for Yellow payment
await yellowHub.clearPayment(userId, merchant.endpoint, amount, signature);
```

### Arc Settlement (Phase 2)
```typescript
// Use merchant.vault for settlement destination
await settleFunds({
  vaultAddress: merchant.vault,
  chain: merchant.chain // 'arc' or 'sepolia'
});
```

### Avail Nexus (Phase 5)
```typescript
// Merchant's preferred chain determines bridge target
if (merchant.chain === 'arc') {
  await availBridge.transfer({
    from: 'sepolia',
    to: 'arc',
    token: 'USDC'
  });
}
```

---

## Prize Qualification Checklist

### ENS Prize Requirements ($5,000)

- [x] **ENS Resolution**: `lib/ens.ts` resolves ENS names on Mainnet/Sepolia
- [x] **Text Records**: Reads custom `swiftpay.*` text records
- [x] **UI Integration**: `ENSMerchantInput.tsx` component for user input
- [x] **Reverse Lookup**: `reverseResolveENS()` for address → name
- [x] **Validation**: `isValidSwiftPayMerchant()` checks configuration
- [ ] **Demo ENS**: Register `swiftpay-demo.eth` on Sepolia
- [ ] **Video Demo**: Show ENS resolution → Yellow payment in action

---

## Testing Guide

### Unit Tests (Recommended)

```typescript
// lib/ens.test.ts
describe('ENS Service', () => {
  it('resolves SwiftPay merchant', async () => {
    const merchant = await resolveSwiftPayMerchant('test.eth', 'sepolia');
    expect(merchant).toHaveProperty('endpoint');
  });

  it('returns null for invalid ENS', async () => {
    const merchant = await resolveSwiftPayMerchant('invalid.eth', 'sepolia');
    expect(merchant).toBeNull();
  });
});
```

### Manual Testing

1. **Valid SwiftPay ENS:**
   - Input: `swiftpay-demo.eth`
   - Expected: Green checkmark, merchant details displayed
   
2. **Standard ENS (no SwiftPay records):**
   - Input: `vitalik.eth`
   - Expected: Blue checkmark, "Not registered as SwiftPay merchant"
   
3. **Direct Address:**
   - Input: `0x1234...5678`
   - Expected: "Pay Anyway (Manual)" button
   
4. **Invalid Input:**
   - Input: `random text`
   - Expected: Red error message

---

## Performance Optimizations

### 1. Parallel Fetching
```typescript
// Fetch all text records at once
const [endpoint, vault, chain, schedule] = await Promise.all([...]);
```

### 2. Caching (Future Enhancement)
```typescript
// Cache resolved merchants for 5 minutes
const cache = new Map<string, { merchant: SwiftPayENSRecord, timestamp: number }>();
```

### 3. RPC Fallbacks
```typescript
// Use multiple RPC providers
const mainnetClient = createPublicClient({
  transport: fallback([
    http(ALCHEMY_RPC),
    http(INFURA_RPC),
    http(PUBLIC_RPC),
  ]),
});
```

---

## Security Considerations

### 1. ENS Spoofing
- **Risk**: Malicious actor registers similar ENS name (e.g., `c0ffee.swiftpay.eth` instead of `coffee.swiftpay.eth`)
- **Mitigation**: Display full ENS name clearly before payment confirmation

### 2. Text Record Tampering
- **Risk**: Merchant changes `swiftpay.vault` to steal settlements
- **Mitigation**: Re-resolve ENS before each settlement, show old vs new values

### 3. Resolver Vulnerabilities
- **Risk**: Compromised ENS resolver returns malicious data
- **Mitigation**: Use only official ENS resolvers, validate addresses

---

## Next Steps

1. **Register Demo ENS**: `swiftpay-demo.eth` on Sepolia with all text records
2. **Wire to UserPanel**: Replace address input with ENS merchant search
3. **Test Full Flow**: ENS lookup → Yellow payment → Arc settlement
4. **Record Video**: Show ENS merchant discovery in action
5. **Deploy to Mainnet**: Register production ENS names for real merchants

---

## Resources

- **ENS Docs**: https://docs.ens.domains
- **Viem ENS Guide**: https://viem.sh/docs/ens/actions/getEnsAddress.html
- **ENS App**: https://app.ens.domains
- **Sepolia ENS**: https://sepolia.app.ens.domains
- **Prize Info**: Yellow Network + ENS Prize Pool Documentation

---

## Status

**Phase 4 (ENS Integration): ✅ COMPLETE**

- [x] ENS service implementation
- [x] React hooks for merchant discovery
- [x] UI component for ENS input
- [x] Documentation complete
- [ ] Demo ENS registration (requires manual setup)
- [ ] Frontend wiring to payment flow

**Ready for**: Phase 5 (Avail Nexus) + Demo Recording
