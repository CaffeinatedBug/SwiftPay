# SwiftPay API Documentation

## REST Endpoints

### POST /api/payments
Create a new payment (triggers Yellow state channel update).

```json
{
  "userId": "0x...",
  "merchantENS": "coffeeshop.swiftpay.eth",
  "amount": 5.00,
  "currency": "USD"
}
```

### POST /api/settlements
Trigger manual settlement for a merchant.

```json
{
  "merchantENS": "coffeeshop.swiftpay.eth"
}
```

### GET /api/merchants/:ensName
Get merchant profile from ENS.

### PUT /api/merchants/:ensName/preferences
Update merchant settlement preferences (writes to ENS text records).

### GET /api/channels/:userId
Get Yellow state channel status for a user.

## WebSocket Events

### Client → Server
- `register_merchant` - Register as merchant for payment notifications
- `register_user` - Register as user

### Server → Client
- `payment_received` - New payment cleared
- `settlement_complete` - Settlement finalized on Arc
- `settlement_failed` - Settlement error
- `channel_update` - Yellow channel state change
