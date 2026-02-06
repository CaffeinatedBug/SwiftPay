# Settlement Orchestrator - Quick Start Guide

Get the complete settlement orchestration running in 5 minutes.

## Prerequisites

- Node.js 20+
- npm or yarn
- Private key with testnet funds (Sepolia ETH + USDC, Arc testnet tokens)
- Alchemy API key (for ENS)

## Step 1: Install Dependencies

```bash
cd backend
npm install
```

## Step 2: Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Required values:**
```bash
HUB_PRIVATE_KEY=0xYourPrivateKey
ENS_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
ENS_SEPOLIA_RPC=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
```

**Optional (for full flow):**
```bash
VAULT_ADDRESS=0xYourDeployedVaultAddress
ARC_USDC_ADDRESS=0xArcUSDCAddress
```

## Step 3: Deploy Vault (Optional)

If you want to test the complete flow including Arc deposits:

```bash
cd contracts

# Install dependencies
npm install

# Deploy to Arc Testnet
npx hardhat run scripts/deploy-arc.ts --network arcTestnet

# Copy VAULT_ADDRESS from output and add to backend/.env
```

## Step 4: Start Backend

```bash
cd backend
npm run dev
```

Expected output:
```
✅ HTTP Server running on http://localhost:3001
✅ WebSocket Server running on ws://localhost:8080
✅ Yellow Network Hub: 0x...
✅ Settlement Orchestrator: Active
```

## Step 5: Test Settlement Flow

### Option A: Automated Test

```bash
# In a new terminal
cd backend

# Set test addresses
export TEST_MERCHANT_ID=0xYourMerchantAddress
export TEST_USER_ID=0xYourUserAddress

# Run test
npm run test:settlement
```

### Option B: Manual Test

```bash
# 1. Create merchant channel
curl -X POST http://localhost:3001/api/channels/merchant \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "0xYourMerchantAddress"}'

# 2. Create user channel with 100 USDC
curl -X POST http://localhost:3001/api/channels/user \
  -H "Content-Type: application/json" \
  -d '{"userId": "0xYourUserAddress", "initialBalance": "100000000"}'

# 3. Clear a payment (10 USDC)
curl -X POST http://localhost:3001/api/payments/clear \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "0xYourUserAddress",
    "merchantId": "0xYourMerchantAddress",
    "amount": "10000000",
    "message": "Test payment",
    "signature": "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
  }'

# 4. Trigger settlement
curl -X POST http://localhost:3001/api/settlement/merchant/0xYourMerchantAddress \
  -H "Content-Type: application/json" \
  -d '{"force": true}'

# 5. Check job status (use jobId from step 4)
curl http://localhost:3001/api/settlement/jobs/settlement_...

# 6. Get statistics
curl http://localhost:3001/api/settlement/stats
```

## Step 6: Monitor Settlement

### Via API

```bash
# Get all jobs
curl http://localhost:3001/api/settlement/jobs

# Get active jobs
curl http://localhost:3001/api/settlement/active

# Get stats
curl http://localhost:3001/api/settlement/stats

# Health check
curl http://localhost:3001/health
```

### Via WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080?merchantId=0xYourAddress');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Settlement update:', data);
};
```

### Via Logs

Watch the backend console for detailed logs:
```
🚀 Triggering full settlement for merchant: 0xabc123...
📛 Merchant ENS: merchant.swiftpay.eth
💰 Total to settle: 10.00 USDC
🔒 Settling Yellow channel...
✅ Yellow channel settled: 0x...
🌉 Bridging USDC to Arc...
✅ Bridge successful: 0x...
💎 Depositing to Arc Vault...
✅ Vault deposit successful: 0x...
✅ Settlement complete!
```

## API Endpoints Reference

### Settlement Orchestration

```
POST   /api/settlement/merchant/:merchantId  - Trigger settlement
GET    /api/settlement/jobs/:jobId           - Get job status
GET    /api/settlement/jobs                  - Get all jobs
GET    /api/settlement/active                - Get active jobs
GET    /api/settlement/stats                 - Get statistics
GET    /api/settlement/check/:merchantId     - Check eligibility
POST   /api/settlement/settle-all            - Settle all due
```

### Yellow Network

```
POST   /api/deposit                          - Deposit to Yellow
POST   /api/channels/user                    - Create user channel
POST   /api/channels/merchant                - Create merchant channel
GET    /api/channels/user/:userId            - Get user channel
GET    /api/channels/merchant/:merchantId    - Get merchant channel
POST   /api/payments/clear                   - Clear payment
POST   /api/settle                           - Settle Yellow only
```

### System

```
GET    /health                               - Health check
```

## Troubleshooting

### Backend won't start

**Error**: `Cannot find module '@avail-project/nexus-core'`
```bash
cd backend
npm install
```

**Error**: `HUB_PRIVATE_KEY not set`
```bash
# Add to backend/.env
HUB_PRIVATE_KEY=0xYourPrivateKey
```

### Settlement fails

**Error**: `Not connected to Yellow Network`
```bash
# Check Yellow Network connection in logs
# Ensure HUB_PRIVATE_KEY is valid
```

**Error**: `Bridge failed: insufficient liquidity`
```bash
# Wait for Avail Nexus liquidity
# Or try different source chain
```

**Error**: `Vault deposit failed`
```bash
# Ensure VAULT_ADDRESS is set
# Ensure ARC_USDC_ADDRESS is set
# Check hub wallet has USDC on Arc
```

### ENS resolution fails

**Error**: `No address found for ENS name`
```bash
# Ensure ENS name exists on correct network
# Check ENS_RPC_URL is set correctly
```

## Next Steps

1. **Configure ENS** - Set up merchant ENS names with settlement preferences
2. **Deploy to Production** - Deploy vault and configure production environment
3. **Integrate Frontend** - Connect frontend to settlement API
4. **Monitor Performance** - Set up monitoring and alerts
5. **Test at Scale** - Run load tests with multiple merchants

## Getting Help

- **Documentation**: See `SETTLEMENT_ORCHESTRATOR.md` for complete API reference
- **Integration Guide**: See `SETTLEMENT_INTEGRATION_COMPLETE.md` for architecture details
- **Logs**: Check backend console for detailed error messages
- **Health Check**: Use `/health` endpoint to verify system status

## Common Use Cases

### Instant Settlement

```bash
# Merchant wants to settle immediately
curl -X POST http://localhost:3001/api/settlement/merchant/0xMerchant \
  -d '{"force": true}'
```

### Scheduled Settlement

```bash
# Check if merchant should settle based on ENS schedule
curl http://localhost:3001/api/settlement/check/0xMerchant

# Settle if eligible
curl -X POST http://localhost:3001/api/settlement/merchant/0xMerchant
```

### Batch Settlement

```bash
# Settle all merchants that are due
curl -X POST http://localhost:3001/api/settlement/settle-all
```

### Monitor Progress

```bash
# Get job status
curl http://localhost:3001/api/settlement/jobs/settlement_123

# Get all active settlements
curl http://localhost:3001/api/settlement/active

# Get statistics
curl http://localhost:3001/api/settlement/stats
```

## Success Criteria

You'll know it's working when:

✅ Backend starts without errors
✅ Health check shows `"status": "ok"`
✅ Yellow Hub shows `"connected": true`
✅ Settlement Orchestrator shows stats
✅ You can create channels
✅ You can clear payments
✅ You can trigger settlements
✅ Jobs complete successfully
✅ WebSocket notifications work

## Production Checklist

Before deploying to production:

- [ ] Deploy SwiftPayVault to Arc Testnet
- [ ] Fund hub wallet with USDC on Sepolia
- [ ] Fund hub wallet with ARC for gas
- [ ] Configure ENS text records for merchants
- [ ] Set all environment variables
- [ ] Test complete settlement flow
- [ ] Set up monitoring and alerts
- [ ] Configure WebSocket reconnection
- [ ] Set up error logging
- [ ] Test automatic scheduler
- [ ] Verify WebSocket notifications
- [ ] Load test with multiple merchants

---

**Ready to build the future of payments! 🚀**
