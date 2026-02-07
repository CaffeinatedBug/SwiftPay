# Cross-Chain Payment Guide

## Automatic Cross-Chain Support

SwiftPay **automatically handles cross-chain transactions** during the settlement process. Users can pay from any supported chain, and the system bridges funds to Arc Testnet behind the scenes.

### Supported Payment Chains

✅ **Sepolia Testnet** (11155111)  
✅ **Arbitrum Sepolia** (421614)  
✅ **Base Sepolia** (84532)  
✅ **Optimism Sepolia** (11155420)

### How It Works

1. **User makes payment** from any supported chain
2. **Yellow Network** clears the payment off-chain (instant)
3. **Settlement Orchestrator** batches merchant payments
4. **Avail Nexus** bridges USDC from source chain → Arc Testnet (automatic)
5. **Arc Vault** receives and stores merchant funds

### No Manual Bridging Required

The Avail Nexus bridge works **automatically in the background** during settlement. Users don't need to:
- Manually bridge funds
- Switch to Arc Testnet
- Interact with any cross-chain UI

### Settlement Flow

```
User Payment (Arbitrum/Base/Sepolia USDC)
    ↓
Yellow Network (off-chain clearing)
    ↓
Merchant accumulates payments
    ↓
Settlement trigger
    ↓
Avail Nexus Bridge (automatic)
    ↓
Arc Vault (final destination)
```

### Backend Implementation

The cross-chain bridging is handled by:
- `AvailBridgeService.ts` - Manages Avail Nexus SDK
- `SettlementOrchestrator.ts` - Coordinates settlement with bridging
- Automatic retry logic with exponential backoff

### Code Reference

```typescript
// backend/src/services/SettlementOrchestrator.ts
const bridgeResult = await this.availBridge.bridgeWithRetry({
  amount: merchantPayment.amount,
  fromChainId: merchantPayment.chainId, // Auto-detected
  token: 'USDC'
});
```

## Testing

Run the settlement test suite to verify cross-chain functionality:

```bash
cd backend
npm run test:settlement
```

All tests should pass (9/9 ✅).

## Production Readiness

For production deployment:
1. Update `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `.env.local`
2. Add real Alchemy API keys (optional - public RPCs work)
3. Ensure backend `.env` has correct chain IDs and contract addresses
4. Test settlement flow on testnets before mainnet

---

**Note:** The Avail Nexus UI component is hidden by default since bridging happens automatically during settlement. If you need manual bridging for testing, set the condition in `UserPanel.tsx` to `true`.
