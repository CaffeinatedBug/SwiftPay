# SwiftPay Architecture Diagram
## Arc as Liquidity Hub - Multi-Chain USDC Settlement System

```
                                    SwiftPay Architecture
                                Arc as Central Liquidity Hub
     ┌─────────────────────────────────────────────────────────────────────────────────────┐
     │                          PHASE 1: ARC INTEGRATION (COMPLETE)                        │
     └─────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│     Ethereum        │    │     Arbitrum        │    │      Polygon        │    │      Base           │
│   ┌─────────────┐   │    │   ┌─────────────┐   │    │   ┌─────────────┐   │    │   ┌─────────────┐   │
│   │ User Wallet │   │    │   │ User Wallet │   │    │   │ User Wallet │   │    │   │ User Wallet │   │
│   │             │   │    │   │             │   │    │   │             │   │    │   │             │   │
│   │ ETH, USDC,  │   │    │   │ ETH, USDC,  │   │    │   │ MATIC, USDC │   │    │   │ ETH, USDC,  │   │
│   │ USDT, etc.  │   │    │   │ USDT, etc.  │   │    │   │ USDT, etc.  │   │    │   │ USDT, etc.  │   │
│   └─────────────┘   │    │   └─────────────┘   │    │   └─────────────┘   │    │   └─────────────┘   │
└─────────────────────┘    └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
          │                           │                           │                           │
          │                           │                           │                           │
          ▼ QR Payment               ▼ QR Payment               ▼ QR Payment               ▼ QR Payment
    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
    │                             YELLOW NETWORK (Phase 3)                                         │
    │                           Off-Chain State Channels                                           │
    │   ┌─────────────────────────────────────────────────────────────────────────────────────┐    │
    │   │                      SwiftPay Hub (Node.js Backend)                                 │    │
    │   │                                                                                     │    │
    │   │  • Instant Payment Clearing (<200ms)                                               │    │
    │   │  • No On-Chain Transactions During Payment                                         │    │
    │   │  • Message Signing via MetaMask                                                    │    │
    │   │  • Session Management with Nitrolite SDK                                           │    │
    │   │  • WebSocket Real-time Updates                                                     │    │
    │   │                                                                                     │    │
    │   │  Circle Integration:                                                               │    │
    │   │  ├─ Circle Gateway (USDC operations)                                              │    │
    │   │  ├─ Circle Wallets (merchant payouts)                                             │    │
    │   │  └─ Webhook endpoints                                                             │    │
    │   └─────────────────────────────────────────────────────────────────────────────────────┘    │
    └──────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼ Batch Settlement
    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
    │                               LI.FI INTEGRATION (Phase 6)                                    │
    │                            Cross-Chain Settlement Router                                     │
    │                                                                                              │
    │  Multi-Token → USDC Conversion → Bridge to Arc → Settlement                                  │
    │                                                                                              │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                      │
    │  │ Token Swap  │→ │Bridge Route │→ │  Arc Bridge │→ │ USDC on Arc │                      │
    │  │ (if needed) │  │ Optimization│  │  Execution  │  │ Destination │                      │
    │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                      │
    │                                                                                              │
    │  • Intelligent Routing (30%+ fee savings)                                                   │
    │  • Batch Settlement Processing                                                               │
    │  • Cross-Chain Aggregation                                                                  │
    │  • Webhook Integration                                                                       │
    └──────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼ Final Settlement
    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
    │                                   ARC BLOCKCHAIN                                             │
    │                                Central Liquidity Hub                                        │
    │                                                                                              │
    │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
    │  │                          SwiftPayVault.sol Contract                                 │   │
    │  │                                                                                     │   │
    │  │  Contract Address: 0x... (Arc Testnet)                                             │   │
    │  │  Chain ID: 5042002                                                                 │   │
    │  │                                                                                     │   │
    │  │  Functions:                                                                         │   │
    │  │  ├─ receiveSettlement(settlementId, merchant, token, amount)                      │   │
    │  │  ├─ receiveDirectSettlement() [for LI.FI integration]                             │   │
    │  │  ├─ withdraw(token, amount, recipient)                                             │   │
    │  │  ├─ withdrawAll(token, recipient)                                                  │   │
    │  │  └─ getBalance(merchant, token)                                                    │   │
    │  │                                                                                     │   │
    │  │  Security Features:                                                                 │   │
    │  │  ├─ ReentrancyGuard                                                                │   │
    │  │  ├─ Pausable (emergency)                                                           │   │
    │  │  ├─ Ownable (admin functions)                                                      │   │
    │  │  └─ SafeERC20 (secure transfers)                                                   │   │
    │  └─────────────────────────────────────────────────────────────────────────────────────┘   │
    │                                           │                                                  │
    │                                           │                                                  │
    │  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
    │  │                              USDC Token (Arc)                                      │   │
    │  │                                                                                     │   │
    │  │  • Native USDC on Arc blockchain                                                   │   │
    │  │  • 6 decimal precision                                                             │   │
    │  │  • Circle-issued stablecoin                                                        │   │
    │  │  • Primary settlement currency                                                     │   │
    │  └─────────────────────────────────────────────────────────────────────────────────────┘   │
    └──────────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           ▼ Merchant Payouts
    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
    │                              CIRCLE WALLETS INTEGRATION                                      │
    │                               Automated Merchant Payouts                                    │
    │                                                                                              │
    │  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐                 │
    │  │   Merchant A        │  │   Merchant B        │  │   Merchant C        │                 │
    │  │                     │  │                     │  │                     │                 │
    │  │  Circle Wallet:     │  │  Circle Wallet:     │  │  Circle Wallet:     │                 │
    │  │  0x...ABC           │  │  0x...DEF           │  │  0x...GHI           │                 │
    │  │                     │  │                     │  │                     │                 │
    │  │  USDC Balance:      │  │  USDC Balance:      │  │  USDC Balance:      │                 │
    │  │  $1,250.00          │  │  $850.00            │  │  $2,100.00          │                 │
    │  │                     │  │                     │  │                     │                 │
    │  │  Auto-Settlement    │  │  Auto-Settlement    │  │  Auto-Settlement    │                 │
    │  │  ✅ Enabled         │  │  ✅ Enabled         │  │  ✅ Enabled         │                 │
    │  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘                 │
    └──────────────────────────────────────────────────────────────────────────────────────────────┘


    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
    │                               PAYMENT FLOW SUMMARY                                           │
    │                                                                                              │
    │  1. USER PAYMENT                                                                             │
    │     • User scans QR code on any chain (ETH, ARB, POLY, BASE)                               │
    │     • Pays with any token (ETH, USDC, USDT, etc.)                                          │
    │     • Signs message via MetaMask (no transaction yet)                                       │
    │                                                                                              │
    │  2. INSTANT CLEARING (Yellow Network)                                                        │
    │     • Payment cleared off-chain in <200ms                                                   │
    │     • State channel update with Hub                                                         │
    │     • Merchant POS immediately shows GREEN ✅                                               │
    │                                                                                              │
    │  3. BATCH SETTLEMENT (LI.FI + Arc)                                                          │
    │     • Hub aggregates multiple payments                                                       │
    │     • LI.FI finds optimal cross-chain route                                                │
    │     • Tokens converted to USDC and bridged to Arc                                          │
    │     • SwiftPayVault.sol receives settlement on Arc                                         │
    │                                                                                              │
    │  4. MERCHANT PAYOUT (Circle Wallets)                                                        │
    │     • Automatic USDC transfer to merchant Circle Wallet                                     │
    │     • Real-time balance updates                                                             │
    │     • Webhook notifications                                                                 │
    │                                                                                              │
    │  KEY BENEFITS:                                                                               │
    │  ✅ Cross-chain payments without user friction                                              │
    │  ✅ Instant payment confirmation (<200ms)                                                   │
    │  ✅ Arc as unified liquidity settlement layer                                               │
    │  ✅ No chain lock-in - payments from anywhere                                               │
    │  ✅ Capital efficiency through settlement batching                                          │
    │  ✅ USDC as universal settlement currency                                                   │
    └──────────────────────────────────────────────────────────────────────────────────────────────┘


    ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
    │                              CIRCLE TOOLS INTEGRATION                                        │
    │                                                                                              │
    │  🎯 Arc (Target Chain)                                                                      │
    │     • Central liquidity hub for all settlements                                             │
    │     • SwiftPayVault.sol deployed on Arc testnet                                            │
    │     • Chain ID: 5042002                                                                     │
    │                                                                                              │
    │  🎯 Circle Gateway                                                                          │
    │     • USDC balance queries and transfers                                                    │
    │     • Webhook integration for settlement notifications                                      │
    │     • API integration in SwiftPay Hub backend                                              │
    │                                                                                              │
    │  🎯 USDC Token                                                                              │
    │     • Primary settlement currency on Arc                                                    │
    │     • All cross-chain payments converted to USDC                                           │
    │     • Unified liquidity across all merchant settlements                                     │
    │                                                                                              │
    │  🎯 Circle Wallets                                                                          │
    │     • Merchant payout wallet creation                                                       │
    │     • Automated settlement distribution                                                     │
    │     • Real-time balance management                                                          │
    │                                                                                              │
    │  COMPLIANCE WITH ARC BOUNTY REQUIREMENTS:                                                   │
    │  ✅ Multi-chain payment sourcing (not locked to single chain)                              │
    │  ✅ Arc as central liquidity hub                                                            │
    │  ✅ Seamless UX despite cross-chain complexity                                             │
    │  ✅ All required Circle tools integrated                                                    │
    │  ✅ Capital sourcing from multiple chains, settled on Arc                                   │
    └──────────────────────────────────────────────────────────────────────────────────────────────┘
```

## Technical Architecture Details

### Smart Contract Layer (Arc)
- **SwiftPayVault.sol**: Central settlement contract on Arc
- **Chain ID**: 5042002 (Arc Testnet)
- **Functions**: Settlement receiving, merchant balance tracking, secure withdrawals
- **Security**: ReentrancyGuard, Pausable, Ownable, SafeERC20

### Backend Hub Layer
- **Node.js + TypeScript**: Core backend infrastructure
- **Circle Gateway Integration**: USDC operations and webhook handling  
- **Circle Wallets Integration**: Merchant wallet creation and payouts
- **WebSocket Server**: Real-time merchant notifications
- **Yellow Network**: Off-chain state channel clearing (Phase 3)
- **LI.FI Integration**: Cross-chain routing and settlement (Phase 6)

### Frontend Layer (Phase 2+)
- **Next.js 16**: User and merchant interfaces
- **Wallet Integration**: MetaMask, WalletConnect for multi-chain
- **QR Code System**: Payment initiation flow
- **Real-time Updates**: WebSocket integration for live status

### Cross-Chain Settlement Flow
1. **Payment Initiation**: User pays from any chain with any token
2. **Instant Clearing**: Yellow Network provides <200ms confirmation
3. **Settlement Batching**: Hub aggregates payments for efficiency
4. **Cross-Chain Routing**: LI.FI optimizes route to Arc + USDC conversion
5. **Arc Settlement**: SwiftPayVault.sol receives USDC on Arc
6. **Merchant Payout**: Circle Wallets automatically distribute to merchants

### Key Differentiators
- **Chain Abstraction**: Users unaware of final Arc settlement
- **Instant Confirmation**: Payment clearing vs settlement separation
- **Capital Efficiency**: Batched cross-chain settlements
- **Universal Currency**: All settlements in USDC on Arc
- **No Lock-in**: Accept payments from any supported chain