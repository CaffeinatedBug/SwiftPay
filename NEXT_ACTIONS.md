# 🚀 IMMEDIATE ACTION PLAN

## Current Status: 75% Complete - Ready for Final Push

Your backend is **LIVE** and connected to real Yellow Network! Here's what to do next:

---

## ⚡ STEP 1: Fund the Hub Wallet (10 minutes)

**Hub Address:** `0xd630a3599b23F8B3c10761003dB9b345663F344D`

### Get $DUCKIES (Yellow Network Authorization)
```
1. Go to: https://clearnet-sandbox.yellow.com/faucet/requestTokens
2. Enter hub address: 0xd630a3599b23F8B3c10761003dB9b345663F344D
3. Request $DUCKIES tokens
4. Wait for confirmation
```

### Get Sepolia ETH (Gas)
```
1. Go to: https://sepoliafaucet.com
2. Enter hub address: 0xd630a3599b23F8B3c10761003dB9b345663F344D
3. Request 0.5 ETH
4. Repeat with other faucets if needed:
   - https://faucet.quicknode.com/ethereum/sepolia
   - https://www.alchemy.com/faucets/ethereum-sepolia
```

### Get Sepolia USDC (Testing)
```
1. Get Sepolia USDC contract: 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
2. Use Etherscan Sepolia to call `mint()` function
3. Or use this terminal command:

cd backend
npm run dev
# Then in another terminal:
curl -X POST http://localhost:3001/api/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": "10000000"}'
```

---

## 🧪 STEP 2: Test Yellow Network (15 minutes)

### Start Backend (Already Running?)
```bash
cd D:\Projects\SwiftPay\backend
npm run dev

# Should see:
# ✅ Connected to Yellow Network Sandbox
# ✅ Yellow Network Hub connected (Sepolia Sandbox)
# ✅ Hub: 0xd630a3599b23F8B3c10761003dB9b345663F344D
```

### Test API Endpoints

**1. Health Check**
```bash
curl http://localhost:3001/health
# Expected: { "status": "ok", "hub": "0xd630...", ... }
```

**2. Deposit USDC to Yellow**
```bash
curl -X POST http://localhost:3001/api/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": "10000000"}'

# Amount is in USDC smallest units (6 decimals)
# 10000000 = 10 USDC
```

**3. Open User Channel**
```bash
curl -X POST http://localhost:3001/api/channels/user \
  -H "Content-Type: application/json" \
  -d '{"userId": "0xYOUR_WALLET_ADDRESS", "initialBalance": "5000000"}'

# 5000000 = 5 USDC initial channel balance
```

**4. Open Merchant Channel**
```bash
curl -X POST http://localhost:3001/api/channels/merchant \
  -H "Content-Type: application/json" \
  -d '{"merchantId": "0xMERCHANT_WALLET_ADDRESS"}'
```

**5. Clear Payment (Instant!)**
```bash
# This requires a signature from the user
# See frontend integration for full flow
```

---

## 🎨 STEP 3: Wire Frontend to Backend (30 minutes)

### Start Frontend
```bash
cd D:\Projects\SwiftPay\frontend
npm run dev

# Opens: http://localhost:3000
```

### Update UserPanel to Use ENS

**File:** `frontend/components/panels/UserPanel.tsx`

Add ENS merchant search:
```typescript
import { ENSMerchantInput } from '@/components/merchant/ENSMerchantInput';

export function UserPanel() {
  const [selectedMerchant, setSelectedMerchant] = useState<{
    address: string;
    ensName?: string;
    endpoint: string;
  } | null>(null);

  return (
    <div>
      {/* Replace address input with ENS search */}
      <ENSMerchantInput 
        onMerchantSelected={setSelectedMerchant}
        network="sepolia"
      />

      {selectedMerchant && (
        <div>
          <p>Paying: {selectedMerchant.ensName || selectedMerchant.address}</p>
          {/* Payment UI here */}
        </div>
      )}
    </div>
  );
}
```

### Test Payment Flow

1. **Connect Wallet** (MetaMask)
2. **Enter Merchant** (for now, use direct address)
3. **Click "Open Channel"** → calls `/api/channels/user`
4. **Enter Amount** (e.g., 5 USDC)
5. **Click "Pay"** → calls `/api/payments/clear`
6. **See Merchant Panel Update** (via WebSocket)

---

## 🏷️ STEP 4: Register Demo ENS (20 minutes)

### Option A: Sepolia ENS (Testnet)

```
1. Go to: https://sepolia.app.ens.domains
2. Connect wallet (Sepolia network)
3. Search for: swiftpay-demo.eth
4. Click "Register"
5. Follow registration flow (requires Sepolia ETH)
6. After registration, click "Set Records"
7. Add text records:
   - Key: swiftpay.endpoint
     Value: 0xd630a3599b23F8B3c10761003dB9b345663F344D
   
   - Key: swiftpay.vault
     Value: <YOUR_ARC_VAULT_ADDRESS>
   
   - Key: swiftpay.chain
     Value: sepolia
   
   - Key: swiftpay.schedule
     Value: instant
```

### Option B: Test Without ENS

You can test the full payment flow using direct addresses first:
- User: Your MetaMask wallet
- Merchant: Hub wallet (0xd630a3599b23F8B3c10761003dB9b345663F344D)

---

## 🌉 STEP 5: Add Avail Integration (1 hour)

### Install Avail SDK
```bash
cd frontend
npm install @avail-project/nexus
```

### Create Bridge Service

**File:** `frontend/lib/avail-bridge.ts`

Copy the implementation from `AVAIL_INTEGRATION.md`

### Create Top Up Modal

**File:** `frontend/components/merchant/TopUpModal.tsx`

Copy the component from `AVAIL_INTEGRATION.md`

### Wire to UserPanel

```typescript
import { TopUpModal } from '@/components/merchant/TopUpModal';

export function UserPanel() {
  const [showTopUp, setShowTopUp] = useState(false);

  return (
    <>
      <Button onClick={() => setShowTopUp(true)}>
        Top Up via Avail
      </Button>

      <TopUpModal 
        open={showTopUp}
        onOpenChange={setShowTopUp}
      />
    </>
  );
}
```

---

## 🎬 STEP 6: Record Demo Video (1 hour)

### Setup
- Install OBS Studio: https://obsproject.com/
- Configure 1920x1080 screen capture
- Enable microphone audio

### Script (Follow PROJECT_STATUS.md)

**Act 1: Problem** (15s)
- Show traditional payment pain points
- "The Coffee Problem in Web3"

**Act 2: Top Up** (30s)
- Click "Top Up via Avail"
- Bridge USDC from Base → Sepolia
- Show balance update

**Act 3: Discovery** (30s)
- Enter `swiftpay-demo.eth`
- Show ENS resolution
- Merchant details appear

**Act 4: Payment** (60s)
- Open Yellow channel
- Make 5 USDC payment
- Show <200ms clearing
- Merchant receives notification

**Act 5: Settlement** (30s)
- Merchant clicks "Settle"
- Close Yellow channel
- Settle to Arc blockchain
- Show final transaction

**Closing** (15s)
- "Avail → ENS → Yellow → Arc"
- "The Universal Payment Rail"

### Upload
- YouTube (unlisted)
- Include in prize submissions

---

## 📋 Pre-Demo Checklist

### Backend
- [ ] Backend running: `npm run dev` in `backend/`
- [ ] Hub funded with $DUCKIES
- [ ] Hub funded with Sepolia ETH
- [ ] Hub funded with Sepolia USDC
- [ ] Health check returns 200 OK
- [ ] WebSocket server on port 8080

### Frontend
- [ ] Frontend running: `npm run dev` in `frontend/`
- [ ] RainbowKit wallet connection works
- [ ] User can connect MetaMask
- [ ] Split-screen UI displays
- [ ] ENS merchant input component visible

### Contracts
- [ ] SwiftPayVault.sol deployed to Arc Testnet
- [ ] Vault address saved in `.env.local`
- [ ] Can call `deposit()` on Arc

### ENS
- [ ] Demo ENS registered on Sepolia
- [ ] Text records set (swiftpay.*)
- [ ] ENS resolution works in frontend
- [ ] Can search by ENS name

### Avail
- [ ] SDK installed: `@avail-project/nexus`
- [ ] Bridge service implemented
- [ ] Top Up modal created
- [ ] Can bridge from Base → Sepolia

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <PID> /F

# Restart backend
npm run dev
```

### TypeScript Errors
```bash
# The backend uses tsx, not tsc
# These errors are expected in dependencies
# Just run: npm run dev
```

### WebSocket Not Connecting
```bash
# Check if port 8080 is available
netstat -ano | findstr :8080

# Check backend logs for:
# "✅ WebSocket Server running on ws://localhost:8080"
```

### Yellow Network Errors
```bash
# Most common: Hub not authorized
# Solution: Get $DUCKIES from faucet

# Second most common: Insufficient gas
# Solution: Get Sepolia ETH from faucet
```

### ENS Not Resolving
```bash
# Check network: Must be on Sepolia for test ENS
# Check RPC: Alchemy API key must be valid
# Check name: Must be registered on Sepolia ENS
```

---

## 📞 Quick Reference

### Endpoints
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket: ws://localhost:8080
- Yellow Sandbox: wss://clearnet-sandbox.yellow.com/ws

### Wallets
- Hub: `0xd630a3599b23F8B3c10761003dB9b345663F344D`
- Your wallet: (MetaMask)

### Contracts
- Sepolia USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
- Yellow Custody: `0x019B65A265EB3363822f2752141b3dF16131b262`
- Yellow Adjudicator: `0x7c7ccbc98469190849BCC6c926307794fDfB11F2`
- Arc Vault: (Deploy pending)

### Documentation
- `YELLOW_PRODUCTION.md` - Yellow integration guide
- `ENS_INTEGRATION.md` - ENS setup and usage
- `AVAIL_INTEGRATION.md` - Cross-chain bridging
- `PROJECT_STATUS.md` - Complete status overview

---

## 🎯 Success Criteria

### You'll know it's working when:

1. **Backend logs show:**
   ```
   ✅ Connected to Yellow Network Sandbox
   ✅ Yellow Network Hub connected (Sepolia Sandbox)
   ✅ Hub: 0xd630a3599b23F8B3c10761003dB9b345663F344D
   ```

2. **Frontend shows:**
   - Wallet connected
   - ENS merchant search works
   - Payment button enabled
   - Real-time balance updates

3. **Payment flow completes in <1 second:**
   - User clicks "Pay"
   - Yellow clears off-chain
   - Merchant sees notification immediately

4. **Settlement works:**
   - Merchant clicks "Settle"
   - Yellow channel closes
   - Funds arrive on Arc blockchain

---

## 🚀 You're Ready!

Your backend is **LIVE** with real Yellow Network integration. Just need to:
1. Fund the hub (10 min)
2. Test the API (15 min)
3. Wire frontend (30 min)
4. Register ENS (20 min)
5. Add Avail (1 hour)
6. Record demo (1 hour)

**Total: ~3-4 hours to complete the entire project!**

---

## 💬 Need Help?

- Check `PROJECT_STATUS.md` for detailed status
- Read `YELLOW_PRODUCTION.md` for Yellow API docs
- See `ENS_INTEGRATION.md` for ENS setup
- Review `AVAIL_INTEGRATION.md` for bridging

**You've got this! 🎉**
