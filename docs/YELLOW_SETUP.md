# Yellow Network Setup Guide

## Prerequisites
- Node.js 20+
- A funded Ethereum wallet (testnet)

## Installation

```bash
cd backend
npm install @erc7824/nitrolite
```

## Configuration

Set in `.env`:
```
YELLOW_WS_URL=wss://testnet.clearnet.yellow.com/ws
YELLOW_NETWORK=testnet
HUB_PRIVATE_KEY=0x...
```

## State Channel Lifecycle

### 1. Channel Creation
- Hub opens a channel with the user
- Initial deposit defines max spend
- Channel ID is deterministic

### 2. Payment (Off-chain)
- User signs a state update allocating funds to merchant
- Hub countersigns the update
- No on-chain transaction — instant (<200ms)
- State version increments each payment

### 3. Channel Close
- Cooperative: Both parties sign final state → on-chain close
- Unilateral: Either party submits latest signed state on-chain
- Challenge period prevents fraud

## Security
- User holds latest signed state as receipt
- Hub cannot modify allocations without user signature
- On-chain smart contract enforces final state
- Version numbers prevent replay attacks

## Testing

```bash
cd backend
npx ts-node src/yellow-integration.ts
```

Watch logs for:
- `Connected to Yellow Network`
- `Channel opened: <channelId>`
- `State update signed: version <n>`
