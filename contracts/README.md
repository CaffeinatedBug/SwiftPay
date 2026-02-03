# SwiftPay Smart Contracts

## Overview
This directory contains the SwiftPayVault smart contract and deployment scripts for the SwiftPay payment system.

---

## Contract: SwiftPayVault.sol

### Purpose
Secure vault for holding merchant settlements from the SwiftPay Hub. Receives USDC from cross-chain settlements and enables merchant withdrawals.

### Key Features
- **Multi-token support** - Handles USDC and other ERC20 tokens
- **Dual settlement modes** - Hub-submitted and direct deposits (LI.FI)
- **Merchant balance tracking** - Per-merchant, per-token balances
- **Withdrawal functions** - Flexible withdrawal options
- **Security** - ReentrancyGuard, Pausable, Ownable patterns
- **Event emissions** - Full audit trail

### Functions

#### Settlement Functions
- `receiveSettlement()` - Hub submits settlement (requires approval)
- `receiveDirectSettlement()` - Direct deposit settlement (for LI.FI)

#### Withdrawal Functions
- `withdraw()` - Withdraw specific amount
- `withdrawAll()` - Withdraw entire balance

#### View Functions
- `getBalance()` - Check merchant balance
- `isSettlementProcessed()` - Check if settlement ID used
- `hub()` - Get Hub address
- `owner()` - Get owner address
- `paused()` - Check if contract is paused

#### Admin Functions
- `setHub()` - Update Hub address
- `setTokenWhitelist()` - Whitelist tokens
- `pause()` / `unpause()` - Emergency controls
- `emergencyWithdraw()` - Recover stuck tokens

---

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Wallet with testnet funds

### Installation
```bash
npm install
```

### Configuration
1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your values:
   ```env
   DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   ARC_TESTNET_RPC_URL=https://rpc.arc.network
   CIRCLE_API_KEY=your_circle_api_key
   ```

---

## Usage

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Check Balance
```bash
npx hardhat run scripts/check-balance.ts --network arcTestnet
```

### Deploy to Arc Testnet
```bash
npm run deploy:arc
```

### Verify Contract
```bash
npm run verify:arc -- <CONTRACT_ADDRESS> "<HUB_ADDRESS>" "<OWNER_ADDRESS>"
```

### Test Deployed Contract
```bash
npx hardhat run scripts/test-vault.ts --network arcTestnet
```

---

## Networks

### Hardhat (Local)
```bash
npm run deploy:local
```

### Sepolia Testnet
```bash
npm run deploy:sepolia
npm run verify:sepolia -- <ADDRESS> "<HUB>" "<OWNER>"
```

### Arbitrum Sepolia
```bash
npm run deploy:arb-sepolia
npm run verify:arb-sepolia -- <ADDRESS> "<HUB>" "<OWNER>"
```

### Arc Testnet
```bash
npm run deploy:arc
npm run verify:arc -- <ADDRESS> "<HUB>" "<OWNER>"
```

---

## Project Structure

```
contracts/
├── src/
│   └── SwiftPayVault.sol       # Main vault contract
├── scripts/
│   ├── deploy.ts               # Deployment script
│   ├── check-balance.ts        # Balance checker
│   └── test-vault.ts           # Contract tester
├── test/
│   └── (tests to be added)
├── hardhat.config.ts           # Hardhat configuration
├── package.json                # Dependencies
├── .env.example                # Environment template
└── README.md                   # This file
```

---

## Security

### Patterns Used
- **ReentrancyGuard** - Prevents reentrancy attacks
- **Pausable** - Emergency pause capability
- **Ownable** - Owner-only admin functions
- **SafeERC20** - Safe token transfers
- **CEI Pattern** - Checks-Effects-Interactions

### Access Control
- **Hub** - Can submit settlements
- **Owner** - Can update Hub, pause, emergency withdraw
- **Merchants** - Can withdraw their own balances
- **Anyone** - Can view balances and settlement status

### Events
- `SettlementReceived` - Settlement processed
- `MerchantWithdrawal` - Merchant withdrew funds
- `HubUpdated` - Hub address changed
- `TokenWhitelisted` - Token whitelist updated
- `EmergencyWithdrawal` - Emergency withdrawal executed

---

## Testing

### Unit Tests (To be added)
```bash
npm run test
```

### Integration Tests
```bash
npx hardhat run scripts/test-vault.ts --network arcTestnet
```

### Coverage (To be added)
```bash
npm run coverage
```

---

## Deployment

### Deployment Process
1. Configure `.env` with private key and RPC URL
2. Get testnet funds from faucet
3. Run `npm run deploy:arc`
4. Save contract address
5. Verify contract with `npm run verify:arc`
6. Test with `npx hardhat run scripts/test-vault.ts`

### Constructor Arguments
- `_hub` - Address of SwiftPay Hub (can submit settlements)
- `_owner` - Address of contract owner (admin functions)

### Post-Deployment
1. Whitelist USDC token (if needed)
2. Test settlement submission
3. Test merchant withdrawal
4. Update frontend configuration

---

## Environment Variables

### Required
- `DEPLOYER_PRIVATE_KEY` - Private key for deployment
- `ARC_TESTNET_RPC_URL` - Arc testnet RPC endpoint

### Optional
- `HUB_ADDRESS` - Hub address (defaults to deployer)
- `CIRCLE_API_KEY` - Circle API key
- `ARC_API_KEY` - Arc explorer API key
- `ETHERSCAN_API_KEY` - Etherscan API key
- `ARBISCAN_API_KEY` - Arbiscan API key

---

## Gas Optimization

### Compiler Settings
- Solidity version: 0.8.28
- Optimizer enabled: Yes
- Optimizer runs: 200
- viaIR: Yes

### Gas Estimates (Approximate)
- Deployment: ~2,000,000 gas
- receiveSettlement: ~100,000 gas
- withdraw: ~50,000 gas
- getBalance: ~5,000 gas (view)

---

## Troubleshooting

### Deployment Issues

**Error: "insufficient funds"**
- Get more testnet tokens from faucet
- Check wallet balance with `check-balance.ts`

**Error: "network not found"**
- Verify RPC URL in `.env`
- Check network config in `hardhat.config.ts`

**Error: "nonce too low"**
- Reset MetaMask account
- Or specify nonce manually

### Verification Issues

**Error: "already verified"**
- Contract is already verified, skip this step

**Error: "verification failed"**
- Try manual verification on explorer
- Check compiler version matches (0.8.28)
- Check optimization settings match

### Contract Interaction Issues

**Error: "UnauthorizedHub"**
- Only Hub can call settlement functions
- Check Hub address is correct

**Error: "InsufficientBalance"**
- Merchant doesn't have enough balance
- Check balance with `getBalance()`

---

## Resources

### Documentation
- [Hardhat Docs](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Ethers.js Docs](https://docs.ethers.org/)

### Arc Resources
- [Arc Docs](https://docs.arc.network/)
- [Arc Faucet](https://faucet.circle.com/)
- [Arc Explorer](https://explorer.arc.network/)

### Circle Resources
- [Circle Console](https://console.circle.com/)
- [Circle Gateway Docs](https://developers.circle.com/gateway)
- [Circle Wallets Docs](https://developers.circle.com/wallets)

---

## License
MIT

---

## Support
For issues or questions, please refer to the main project documentation or create an issue on GitHub.
