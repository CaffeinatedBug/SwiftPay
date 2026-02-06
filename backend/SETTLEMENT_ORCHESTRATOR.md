# Settlement Orchestrator - Complete Integration Guide

## Overview

The Settlement Orchestrator is the core component that connects all layers of SwiftPay's payment stack:

```
User Payment → Yellow Network (instant clearing) → Settlement Orchestrator → Avail Nexus (bridge) → Arc Blockchain (vault)
```

## Architecture

### Components

1. **ENSService** - Reads merchant settlement preferences from ENS text records
2. **AvailBridgeService** - Bridges USDC cross-chain via Avail Nexus SDK
3. **ArcVaultService** - Deposits settlements to SwiftPayVault on Arc Testnet
4. **SettlementOrchestrator** - Main coordinator that orchestrates the entire flow

### Settlement Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Read ENS Preferences                                     │
│    - Get merchant ENS name                                  │
│    - Read settlement schedule (instant/daily/weekly)        │
│    - Get vault address and chain preference                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Aggregate Cleared Payments                               │
│    - Get merchant channel from Yellow Network               │
│    - Calculate total balance to settle                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Close Yellow Channel                                     │
│    - Settle channel on-chain (Sepolia)                      │
│    - Release funds from state channel                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Bridge via Avail Nexus                                   │
│    - Bridge USDC from Sepolia to Arc Testnet               │
│    - Retry logic with exponential backoff                   │
│    - Track bridge transaction                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Deposit to Arc Vault                                     │
│    - Approve USDC for vault                                 │
│    - Call receiveSettlement on SwiftPayVault                │
│    - Confirm transaction                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Notify Merchant                                          │
│    - Emit settlement_complete event                         │
│    - Send WebSocket notification                            │
│    - Update job status                                      │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Trigger Settlement

```http
POST /api/settlement/merchant/:merchantId
Content-Type: application/json

{
  "force": false  // Optional: bypass schedule check
}
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "settlement_1234567890_0xabc123",
    "merchantId": "0xabc123...",
    "merchantENS": "merchant.swiftpay.eth",
    "status": "processing",
    "stage": "bridging",
    "totalAmount": "150.50",
    "paymentsCount": 25,
    "txHashes": {
      "yellowClose": "0x...",
      "availBridge": "0x...",
      "arcDeposit": "0x..."
    }
  }
}
```

### Get Job Status

```http
GET /api/settlement/jobs/:jobId
```

**Response:**
```json
{
  "success": true,
  "job": {
    "id": "settlement_1234567890_0xabc123",
    "merchantId": "0xabc123...",
    "status": "completed",
    "stage": "complete",
    "totalAmount": "150.50",
    "startTime": 1234567890,
    "endTime": 1234567920,
    "txHashes": {
      "yellowClose": "0x...",
      "availBridge": "0x...",
      "arcDeposit": "0x..."
    }
  }
}
```

### Get All Jobs

```http
GET /api/settlement/jobs
```

### Get Active Jobs

```http
GET /api/settlement/active
```

### Get Statistics

```http
GET /api/settlement/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalJobs": 150,
    "completed": 145,
    "failed": 3,
    "active": 2,
    "pending": 0,
    "totalSettled": "45250.75"
  }
}
```

### Check Settlement Eligibility

```http
GET /api/settlement/check/:merchantId
```

**Response:**
```json
{
  "success": true,
  "merchantId": "0xabc123...",
  "shouldSettle": true
}
```

### Settle All Due Merchants

```http
POST /api/settlement/settle-all
```

## WebSocket Events

Merchants receive real-time updates via WebSocket:

### Settlement Update

```json
{
  "type": "SETTLEMENT_UPDATE",
  "job": {
    "id": "settlement_1234567890_0xabc123",
    "status": "processing",
    "stage": "bridging",
    "totalAmount": "150.50"
  }
}
```

### Settlement Complete

```json
{
  "type": "SETTLEMENT_COMPLETE",
  "merchantId": "0xabc123...",
  "merchantENS": "merchant.swiftpay.eth",
  "amount": "150.50",
  "txHashes": {
    "yellowClose": "0x...",
    "availBridge": "0x...",
    "arcDeposit": "0x..."
  }
}
```

### Settlement Failed

```json
{
  "type": "SETTLEMENT_FAILED",
  "merchantId": "0xabc123...",
  "error": "Bridge failed: insufficient liquidity",
  "job": { ... }
}
```

## ENS Configuration

Merchants configure settlement preferences via ENS text records:

### Required Text Records

```
swiftpay.endpoint       → Payment endpoint URL
swiftpay.vault          → Vault address on Arc
swiftpay.chain          → Settlement chain (arc-testnet)
swiftpay.schedule       → instant | daily | weekly
```

### Optional Text Records

```
swiftpay.settlement.time    → HH:MM (UTC) for daily/weekly
swiftpay.payment.minimum    → Minimum payment amount
swiftpay.payment.maximum    → Maximum payment amount
```

### Example Configuration

```javascript
// Set via ENS Manager or ethers.js
await ensRegistry.setText(
  namehash('merchant.swiftpay.eth'),
  'swiftpay.schedule',
  'daily'
);

await ensRegistry.setText(
  namehash('merchant.swiftpay.eth'),
  'swiftpay.settlement.time',
  '00:00'  // Midnight UTC
);
```

## Automatic Settlement Scheduler

The orchestrator includes an automatic scheduler that runs every 5 minutes:

```typescript
// Checks all merchants for settlement eligibility
// Settles merchants based on ENS schedule preferences
// Runs in background, non-blocking
```

### Schedule Types

1. **Instant** - Settles immediately when requested
2. **Daily** - Settles once per day at specified time (UTC)
3. **Weekly** - Settles once per week on Sunday at specified time (UTC)

## Error Handling

### Retry Logic

- **Bridge operations**: 3 retries with exponential backoff
- **Vault deposits**: Single attempt (logged if fails, doesn't block settlement)

### Error States

Jobs can fail at any stage:

```typescript
{
  "status": "failed",
  "stage": "bridging",  // Stage where failure occurred
  "error": "Bridge failed: insufficient liquidity"
}
```

### Recovery

Failed jobs remain in the system for debugging. To retry:

```http
POST /api/settlement/merchant/:merchantId
{
  "force": true
}
```

## Environment Configuration

Required environment variables:

```bash
# Yellow Network
HUB_PRIVATE_KEY=0x...

# ENS
ENS_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
ENS_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# Avail Nexus
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Arc Blockchain
ARC_RPC_URL=https://rpc.testnet.arc.network
VAULT_ADDRESS=0x...  # Deployed SwiftPayVault address
ARC_USDC_ADDRESS=0x...  # USDC on Arc Testnet
```

## Testing

### Manual Settlement Test

```bash
# 1. Create merchant channel
curl -X POST http://localhost:3001/api/channels/merchant \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "0xYourMerchantAddress"}'

# 2. Clear some payments
curl -X POST http://localhost:3001/api/payments/clear \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "0xUserAddress",
    "merchantId": "0xMerchantAddress",
    "amount": "10000000",
    "message": "Payment for order #123",
    "signature": "0x..."
  }'

# 3. Trigger settlement
curl -X POST http://localhost:3001/api/settlement/merchant/0xMerchantAddress \
  -H "Content-Type: application/json" \
  -d '{"force": true}'

# 4. Check job status
curl http://localhost:3001/api/settlement/jobs/settlement_...
```

### WebSocket Test

```javascript
const ws = new WebSocket('ws://localhost:8080?merchantId=0xYourAddress');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Settlement update:', data);
};
```

## Monitoring

### Health Check

```http
GET /health
```

Returns orchestrator status:

```json
{
  "status": "ok",
  "yellowHub": {
    "connected": true,
    "hubAddress": "0x..."
  },
  "settlementOrchestrator": {
    "stats": {
      "totalJobs": 150,
      "completed": 145,
      "failed": 3,
      "active": 2
    },
    "activeJobs": 2
  }
}
```

### Logs

The orchestrator provides detailed console logging:

```
🔄 Initializing Settlement Orchestrator...
✅ Settlement Orchestrator initialized
⏰ Starting settlement scheduler (checks every 5 minutes)...
✅ Settlement scheduler started

🚀 Triggering full settlement for merchant: 0xabc123...
📛 Merchant ENS: merchant.swiftpay.eth
💰 Total to settle: 150.50 USDC
🔒 Settling Yellow channel...
✅ Yellow channel settled: 0x...
🌉 Bridging USDC to Arc...
✅ Bridge successful: 0x...
💎 Depositing to Arc Vault...
✅ Vault deposit successful: 0x...
✅ Settlement complete for 0xabc123...
   Amount: 150.50 USDC
   Duration: 45.23s
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Deploy SwiftPayVault to Arc Testnet
- [ ] Fund hub wallet with USDC on Sepolia
- [ ] Configure ENS text records for test merchants
- [ ] Set all environment variables
- [ ] Test Yellow Network connection
- [ ] Test Avail Nexus bridge
- [ ] Test Arc Vault deposits
- [ ] Verify WebSocket notifications

### Deployment Steps

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Build TypeScript
npm run build

# 3. Start production server
npm start
```

### Monitoring in Production

- Monitor `/health` endpoint
- Track settlement success rate via `/api/settlement/stats`
- Set up alerts for failed settlements
- Monitor WebSocket connection count
- Track bridge transaction times

## Troubleshooting

### Common Issues

**Issue**: Settlement fails at bridge stage
- **Cause**: Insufficient liquidity on Avail Nexus
- **Solution**: Wait for liquidity or use different source chain

**Issue**: Vault deposit fails
- **Cause**: USDC not approved or insufficient balance
- **Solution**: Check USDC balance on Arc, verify approval

**Issue**: ENS resolution fails
- **Cause**: Invalid ENS name or network mismatch
- **Solution**: Verify ENS name exists and is on correct network

**Issue**: Scheduler not running
- **Cause**: Server restart or crash
- **Solution**: Check logs, restart server

## Future Enhancements

- [ ] Multi-chain source support (not just Sepolia)
- [ ] Batch settlements for multiple merchants
- [ ] Gas optimization strategies
- [ ] Settlement cost estimation
- [ ] Merchant settlement history API
- [ ] Settlement analytics dashboard
- [ ] Email/SMS notifications
- [ ] Configurable scheduler intervals
- [ ] Settlement fee distribution
- [ ] Merchant-specific retry policies

## Support

For issues or questions:
- Check logs in console
- Review job status via API
- Contact SwiftPay team
- Submit GitHub issue

---

**Built for SwiftPay Hackathon - Production-Grade Settlement Orchestration**
