# SwiftPay Settlement Orchestrator - Architecture Diagram

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                           SWIFTPAY PAYMENT SYSTEM                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              LAYER 1: USER LAYER                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐                   │
│  │   User   │         │ Merchant │         │ Frontend │                   │
│  │  Wallet  │────────▶│   ENS    │◀────────│   App    │                   │
│  └──────────┘         └──────────┘         └──────────┘                   │
│       │                     │                     │                         │
│       │                     │                     │                         │
│       └─────────────────────┴─────────────────────┘                         │
│                             │                                               │
└─────────────────────────────┼───────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LAYER 2: PAYMENT CLEARING                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                      ┌─────────────────────────┐                           │
│                      │   Yellow Network Hub    │                           │
│                      │   (Nitrolite SDK)       │                           │
│                      ├─────────────────────────┤                           │
│                      │ • State Channels        │                           │
│                      │ • Instant Clearing      │                           │
│                      │ • <200ms Settlement     │                           │
│                      │ • Off-chain Aggregation │                           │
│                      └─────────────────────────┘                           │
│                                │                                            │
│                                │ Cleared Payments                           │
│                                ▼                                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: SETTLEMENT ORCHESTRATION                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                  ┌────────────────────────────────┐                         │
│                  │  Settlement Orchestrator       │                         │
│                  │  (Main Coordinator)            │                         │
│                  └────────────────────────────────┘                         │
│                              │                                              │
│         ┌────────────────────┼────────────────────┐                         │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐                 │
│  │ ENSService  │      │   Avail     │     │    Arc      │                 │
│  │             │      │   Bridge    │     │   Vault     │                 │
│  ├─────────────┤      ├─────────────┤     ├─────────────┤                 │
│  │ • Read ENS  │      │ • Bridge    │     │ • Deposit   │                 │
│  │ • Schedule  │      │   USDC      │     │   to Vault  │                 │
│  │ • Prefs     │      │ • Retry     │     │ • Track     │                 │
│  │ • Resolve   │      │   Logic     │     │   Balance   │                 │
│  └─────────────┘      └─────────────┘     └─────────────┘                 │
│         │                    │                    │                         │
└─────────┼────────────────────┼────────────────────┼─────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      LAYER 4: BLOCKCHAIN LAYER                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│  │   Ethereum   │    │    Avail     │    │     Arc      │                 │
│  │   Sepolia    │───▶│    Nexus     │───▶│   Testnet    │                 │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤                 │
│  │ • ENS        │    │ • Cross-     │    │ • SwiftPay   │                 │
│  │   Records    │    │   Chain      │    │   Vault      │                 │
│  │ • Yellow     │    │   Bridge     │    │ • USDC       │                 │
│  │   Channels   │    │ • Liquidity  │    │   Deposits   │                 │
│  └──────────────┘    └──────────────┘    └──────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Settlement Flow Sequence

```
┌──────┐         ┌──────┐         ┌──────┐         ┌──────┐         ┌──────┐
│ User │         │Yellow│         │ Orch │         │Avail │         │ Arc  │
└──┬───┘         └──┬───┘         └──┬───┘         └──┬───┘         └──┬───┘
   │                │                │                │                │
   │ 1. Payment     │                │                │                │
   ├───────────────▶│                │                │                │
   │                │                │                │                │
   │                │ 2. Clear       │                │                │
   │                │   (<200ms)     │                │                │
   │                ├────────────────┤                │                │
   │                │                │                │                │
   │                │ 3. Aggregate   │                │                │
   │                │   Payments     │                │                │
   │                ├───────────────▶│                │                │
   │                │                │                │                │
   │                │ 4. Close       │                │                │
   │                │   Channel      │                │                │
   │                │◀───────────────┤                │                │
   │                │                │                │                │
   │                │                │ 5. Bridge      │                │
   │                │                │   USDC         │                │
   │                │                ├───────────────▶│                │
   │                │                │                │                │
   │                │                │                │ 6. Deposit     │
   │                │                │                │   to Vault     │
   │                │                │                ├───────────────▶│
   │                │                │                │                │
   │                │                │ 7. Notify      │                │
   │                │◀───────────────┤                │                │
   │                │   Complete     │                │                │
   │◀───────────────┤                │                │                │
   │                │                │                │                │
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVER (Express)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         HTTP API Layer                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  POST /api/settlement/merchant/:id  ──┐                            │   │
│  │  GET  /api/settlement/jobs/:id        │                            │   │
│  │  GET  /api/settlement/stats           │                            │   │
│  │  POST /api/settlement/settle-all      │                            │   │
│  │                                       │                            │   │
│  └───────────────────────────────────────┼─────────────────────────────┘   │
│                                          │                                  │
│  ┌───────────────────────────────────────▼─────────────────────────────┐   │
│  │                    Settlement Orchestrator                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  • Job Tracking (Map<jobId, SettlementJob>)                        │   │
│  │  • Event Emitter (job_created, job_updated, etc.)                  │   │
│  │  • Stage Management (6 stages)                                     │   │
│  │  • Error Handling & Retry Logic                                    │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                │                │                │                          │
│                ▼                ▼                ▼                          │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐           │
│  │   ENSService     │ │ AvailBridge      │ │  ArcVault        │           │
│  │                  │ │ Service          │ │  Service         │           │
│  ├──────────────────┤ ├──────────────────┤ ├──────────────────┤           │
│  │ • viem client    │ │ • NexusSDK       │ │ • viem client    │           │
│  │ • ENS resolver   │ │ • Wallet client  │ │ • Wallet client  │           │
│  │ • Text records   │ │ • Bridge logic   │ │ • Vault ABI      │           │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      WebSocket Server (ws)                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  • Merchant Connections (Map<merchantId, WebSocket>)               │   │
│  │  • Real-time Notifications                                         │   │
│  │  • Settlement Progress Updates                                     │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    Automatic Scheduler                              │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  • setInterval (5 minutes)                                         │   │
│  │  • Check all merchants                                             │   │
│  │  • Trigger settlements based on ENS schedule                       │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SETTLEMENT JOB                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  {                                                                          │
│    id: "settlement_1234567890_0xabc123",                                   │
│    merchantId: "0xabc123...",                                              │
│    merchantENS: "merchant.swiftpay.eth",                                   │
│    status: "pending" | "processing" | "completed" | "failed",              │
│    stage: "init" | "reading_ens" | "aggregating_payments" |               │
│           "closing_yellow" | "bridging" | "depositing" | "complete",       │
│    totalAmount: "150.50",                                                  │
│    paymentsCount: 25,                                                      │
│    startTime: 1234567890,                                                  │
│    endTime: 1234567920,                                                    │
│    txHashes: {                                                             │
│      yellowClose: "0x...",                                                 │
│      availBridge: "0x...",                                                 │
│      arcDeposit: "0x..."                                                   │
│    },                                                                      │
│    error?: "Error message if failed"                                       │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                          EVENT EMISSIONS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  job_created        ──▶  Broadcast to all WebSocket clients                │
│  job_updated        ──▶  Broadcast to all WebSocket clients                │
│  settlement_complete ──▶ Send to specific merchant WebSocket               │
│  settlement_failed  ──▶  Send to specific merchant WebSocket               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                                    │
                                    ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│                        WEBSOCKET MESSAGES                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  {                                                                          │
│    type: "SETTLEMENT_UPDATE",                                              │
│    job: { ... }                                                            │
│  }                                                                          │
│                                                                             │
│  {                                                                          │
│    type: "SETTLEMENT_COMPLETE",                                            │
│    merchantId: "0x...",                                                    │
│    amount: "150.50",                                                       │
│    txHashes: { ... }                                                       │
│  }                                                                          │
│                                                                             │
│  {                                                                          │
│    type: "SETTLEMENT_FAILED",                                              │
│    merchantId: "0x...",                                                    │
│    error: "Bridge failed"                                                  │
│  }                                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ENS Integration Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ENS TEXT RECORDS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  merchant.swiftpay.eth                                                     │
│  ├─ swiftpay.endpoint       = "https://api.merchant.com/payments"         │
│  ├─ swiftpay.vault          = "0xVaultAddress"                            │
│  ├─ swiftpay.chain          = "arc-testnet"                               │
│  ├─ swiftpay.schedule       = "daily"                                     │
│  ├─ swiftpay.settlement.time = "00:00"                                    │
│  ├─ swiftpay.payment.minimum = "1.00"                                     │
│  └─ swiftpay.payment.maximum = "10000.00"                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENS SERVICE READS                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Reverse Resolve: 0xMerchant → merchant.swiftpay.eth                   │
│  2. Get Text Records: Read all swiftpay.* fields                          │
│  3. Parse Schedule: Check if settlement is due                            │
│  4. Return Profile: MerchantENSProfile object                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SETTLEMENT DECISION                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  if (schedule === "instant") → Settle immediately                          │
│  if (schedule === "daily") → Check time matches                           │
│  if (schedule === "weekly") → Check day + time matches                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ERROR HANDLING                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Try Settlement                                                            │
│       │                                                                     │
│       ├─ Stage 1: Read ENS                                                 │
│       │    └─ Error → Log, set job.error, emit settlement_failed          │
│       │                                                                     │
│       ├─ Stage 2: Aggregate Payments                                       │
│       │    └─ Error → Log, set job.error, emit settlement_failed          │
│       │                                                                     │
│       ├─ Stage 3: Close Yellow Channel                                     │
│       │    └─ Error → Log, set job.error, emit settlement_failed          │
│       │                                                                     │
│       ├─ Stage 4: Bridge to Arc                                            │
│       │    ├─ Attempt 1 → Fail                                             │
│       │    ├─ Wait 2s                                                      │
│       │    ├─ Attempt 2 → Fail                                             │
│       │    ├─ Wait 4s                                                      │
│       │    ├─ Attempt 3 → Fail                                             │
│       │    └─ Error → Log, set job.error, emit settlement_failed          │
│       │                                                                     │
│       ├─ Stage 5: Deposit to Vault                                         │
│       │    └─ Error → Log warning, continue (don't fail job)              │
│       │                                                                     │
│       └─ Stage 6: Notify                                                   │
│            └─ Success → emit settlement_complete                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION DEPLOYMENT                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Frontend (Next.js)                             │   │
│  │                   https://swiftpay.app                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Backend (Node.js + Express)                       │   │
│  │                   https://api.swiftpay.app                          │   │
│  │                   wss://ws.swiftpay.app                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐               │
│  │   Ethereum   │     │    Avail     │     │     Arc      │               │
│  │   Sepolia    │     │    Nexus     │     │   Testnet    │               │
│  │              │     │   Testnet    │     │              │               │
│  │ • ENS        │     │ • Bridge     │     │ • Vault      │               │
│  │ • Yellow     │     │              │     │              │               │
│  └──────────────┘     └──────────────┘     └──────────────┘               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

**Visual representation of the complete SwiftPay Settlement Orchestrator architecture**
