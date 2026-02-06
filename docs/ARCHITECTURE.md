# SwiftPay Architecture

## Overview

SwiftPay uses four core technologies:

1. **Yellow Network** - Instant off-chain payment clearing via state channels (<200ms)
2. **ENS** - Human-readable merchant identities with custom text records
3. **Avail Nexus** - Cross-chain USDC bridging from any chain to Arc
4. **Arc Blockchain** - Final USDC settlement via SwiftPayVault smart contract

## Data Flow

```
User (any chain) → ENS Resolution → Yellow State Channel → SwiftPay Hub
    → Avail Bridge (cross-chain) → Arc Settlement (USDC) → Merchant Withdrawal
```

## Key Design Decisions

- **No backend database**: ENS text records + blockchain = source of truth
- **Clear first, settle later**: Yellow channels for instant UX, Arc for finality
- **Merchant-controlled preferences**: Settlement schedule stored in ENS
- **Cross-chain agnostic**: Users pay from any supported chain
