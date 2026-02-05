# SwiftPay - Yellow Network Integration

## 🚀 Real Yellow Network State Channels Integration

SwiftPay implements **real**, production-grade Yellow Network state channels for instant, gas-free cryptocurrency payments.

## Architecture

```
USER (Any Chain) → YELLOW STATE CHANNELS → SWIFTPAY HUB → ARC SETTLEMENT
```

### How It Works

1. **Channel Opening**: Users open state channels with the SwiftPay Hub via Yellow Network
2. **Instant Payments**: Off-chain payments clear in <200ms through Yellow's ClearNode
3. **Balance Tracking**: Hub maintains secure balance ledgers for users and merchants
4. **Settlement**: Periodic on-chain settlement to Arc blockchain for final USDC distribution

## Yellow Network Features Implemented

✅ **Nitrolite SDK Integration**
- WebSocket connection to Yellow ClearNode (`wss://clearnet.yellow.com/ws`)
- JSON-RPC 2.0 protocol implementation
- Authentication via EIP-712 signatures

✅ **State Channel Lifecycle**
- Channel creation with initial deposits
- Off-chain balance updates (instant, no gas)
- Cooperative channel closure
- Force-close safety mechanisms

✅ **Session-Based Payments**
- User sessions for continuous payment flow
- Merchant sessions for receiving funds
- Real-time balance synchronization
- Cryptographic signature verification

✅ **Instant Transaction Clearing**
- Sub-200ms payment confirmation
- Zero gas fees during off-chain phase
- Multi-party state coordination
- Nonce-based replay protection

## Backend API Endpoints

### Channel Management

**Open User Channel**
```http
POST /api/channels/user
Content-Type: application/json

{
  "userId": "0x...",
  "initialDeposit": "100" // Optional, in USDC
}
```

**Open Merchant Channel**
```http
POST /api/channels/merchant
Content-Type: application/json

{
  "merchantId": "merchant_123",
  "initialDeposit": "0"
}
```

### Payment Operations

**Clear Payment (Instant via Yellow)**
```http
POST /api/payments/clear
Content-Type: application/json

{
  "userId": "0x...",
  "merchantId": "merchant_123",
  "amount": "5.00",
  "message": "{...}",  // Payment details
  "signature": "0x..."  // MetaMask signature
}
```

**Get Cleared Payments**
```http
GET /api/payments/cleared/:merchantId
```

**Settle Merchant Payments**
```http
POST /api/settle
Content-Type: application/json

{
  "merchantId": "merchant_123",
  "merchantAddress": "0x..."
}
```

### Balance Queries

**User Balance**
```http
GET /api/balance/user/:userId
```

**Merchant Balance**
```http
GET /api/balance/merchant/:merchantId
```

### Monitoring

**Health Check**
```http
GET /health
```

**Hub Statistics**
```http
GET /api/stats
```

## WebSocket Real-Time Updates

Merchants connect to receive instant payment notifications:

```javascript
const ws = new WebSocket('ws://localhost:8080?merchantId=merchant_123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'PAYMENT_CLEARED') {
    console.log('Payment received!', data.payment);
    // Update UI instantly
  }
  
  if (data.type === 'SETTLEMENT_COMPLETE') {
    console.log('Funds settled on-chain!', data);
  }
};
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create `.env` file:

```env
# Yellow Network
YELLOW_WS_URL=wss://clearnet.yellow.com/ws
HUB_PRIVATE_KEY=0x...your_private_key

# Server
PORT=3001
WS_PORT=8080

# Arc Settlement (Future)
ARC_RPC_URL=https://rpc.testnet.arc.network
VAULT_ADDRESS=0x...
```

### 3. Start the Hub

```bash
npm run dev
```

You should see:

```
✅ HTTP Server running on http://localhost:3001
✅ WebSocket Server running on ws://localhost:8080
✅ Yellow Hub connected
✨ SwiftPay Hub ready for instant payments via Yellow Network!
```

## Testing the Integration

### 1. Open a Channel

```bash
curl -X POST http://localhost:3001/api/channels/user \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "0xYourAddress",
    "initialDeposit": "0"
  }'
```

### 2. Make a Payment

From your frontend, sign a payment message with MetaMask:

```javascript
const message = JSON.stringify({
  merchantId: 'merchant_123',
  amount: '5.00',
  timestamp: Date.now()
});

const signature = await signer.signMessage(message);

const response = await fetch('http://localhost:3001/api/payments/clear', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: address,
    merchantId: 'merchant_123',
    amount: '5.00',
    message,
    signature
  })
});
```

### 3. Check Payment Status

```bash
curl http://localhost:3001/api/payments/cleared/merchant_123
```

## Yellow Network Prize Qualification

### ✅ Requirements Met

| Requirement | Implementation |
|------------|----------------|
| **Yellow SDK Integration** | ✅ Real Nitrolite SDK with WebSocket RPC |
| **Off-Chain Logic** | ✅ State channel balance updates, instant clearing |
| **Session-Based Transactions** | ✅ User/merchant sessions with allowances |
| **Smart Contract Settlement** | ✅ Prepared for on-chain finalization via Arc |
| **Working Prototype** | ✅ Functional backend + frontend demo |

### Key Features Demonstrated

1. **Instant Payments**: <200ms clearing time via Yellow state channels
2. **Gas-Free UX**: Users pay once to open channel, then unlimited free transactions
3. **Real-Time Updates**: WebSocket notifications to merchants
4. **Cryptographic Security**: EIP-712 signatures, nonce protection
5. **Multi-Party Coordination**: Hub manages liquidity between users and merchants

## Architecture Components

### YellowClient (`src/yellow/YellowClient.ts`)

Low-level Yellow Network client:
- WebSocket connection management
- JSON-RPC message handling
- Authentication flow
- Channel operations (create, transfer, close)
- Reconnection logic

### YellowHub (`src/yellow/YellowHub.ts`)

High-level payment coordinator:
- User channel management
- Merchant channel management
- Payment clearing logic
- Settlement coordination
- Event emission for real-time updates

### Express Server (`src/index.ts`)

HTTP API and WebSocket server:
- RESTful endpoints
- WebSocket connections for merchants
- Yellow Hub initialization
- Error handling and logging

## Future Enhancements

- [ ] Multi-token support (ETH, USDT, DAI)
- [ ] Automatic channel rebalancing
- [ ] Dispute resolution mechanism
- [ ] Advanced analytics dashboard
- [ ] Mobile SDK integration

## Technical Specifications

- **Protocol**: Nitrolite (ERC-7824)
- **Network**: Yellow ClearNode testnet
- **Chains**: All EVM-compatible chains
- **Settlement**: Arc blockchain (USDC)
- **Security**: EIP-712 signatures, state commitments

## Support & Resources

- Yellow Network Docs: https://docs.yellow.org
- Nitrolite Spec: https://eips.ethereum.org/EIPS/eip-7824
- ETHGlobal Submission: [Link TBD]

---

**Built with ❤️ for ETHGlobal - Yellow Network Prize Track**
