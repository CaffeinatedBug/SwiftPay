# SwiftPay Demo Script

## Pre-Demo Setup
1. Deploy SwiftPayVault to Arc Testnet
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
4. Have MetaMask ready with two accounts (user + merchant)

## Demo Flow (2-3 minutes)

### Scene 1: The Problem (15s)
- Show a traditional crypto payment with `0x742d35Cc6634...`
- Ask: "Would you pay this address?"

### Scene 2: Merchant Setup (20s)
- Open merchant dashboard
- Show ENS name: `coffeeshop.swiftpay.eth`
- Show QR code with $5.00 amount

### Scene 3: User Payment (30s)
- Switch to user app
- Scan QR (or paste manual input for demo)
- Show ENS resolution: avatar, name, location
- Click "Confirm Pay"
- Sign in MetaMask (personal_sign)
- Show ✅ confirmation with clearing time (<200ms)

### Scene 4: Merchant Receives (10s)
- Switch to merchant tab
- Show green payment notification
- Show payment in recent list

### Scene 5: ENS Deep Dive (20s)
- Open merchant settings
- Show settlement preferences stored in ENS text records
- Explain: "Any app can read these. No vendor lock-in."

### Scene 6: Settlement (30s)
- Click "Settle Now" on admin tab
- Show Avail bridge progress (cross-chain)
- Show USDC arriving in Vault on Arc
- Show transaction on Arc block explorer

### Scene 7: Architecture (15s)
- Show architecture diagram
- Highlight: Yellow → ENS → Avail → Arc

### Closing (10s)
- Show GitHub link
- "Pay humans, not hexadecimals."

## Key Phrases to Say
- "Real Nitrolite SDK, not mocked"
- "Custom wagmi hooks, not just RainbowKit"
- "Cross-chain via Avail Nexus"
- "Real USDC on Arc testnet"
- "Under 200 milliseconds"
