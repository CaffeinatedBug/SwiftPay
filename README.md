# SwiftPay

A next-generation decentralized payment platform enabling instant, low-cost cross-chain transactions through a unified payment rail.

## Overview

SwiftPay combines multiple blockchain technologies to solve real-world payment challenges:

- **Instant Settlement**: Sub-200ms payment clearing via state channels
- **Human-Readable Discovery**: ENS-based merchant identification
- **Multi-Chain Support**: Seamless cross-chain liquidity and settlement
- **DeFi Integration**: Smart contract-based vault system

## Architecture

### Four-Layer Payment Stack

```
┌─────────────────────────────────────────────────────────┐
│  ENS Layer        → Merchant Discovery & Configuration  │
│  Yellow Network   → Instant Payment Clearing (<200ms)   │
│  Avail Nexus      → Cross-Chain Liquidity Bridging      │
│  Arc Blockchain   → Final Settlement & Vault Storage    │
└─────────────────────────────────────────────────────────┘
```

### Key Components

**ENS Integration**
- Custom text records for merchant payment configuration
- 7 fields: endpoint, vault, chain, schedule, minpay, maxpay, fees
- Human-readable names replace complex addresses

**Yellow Network State Channels**
- Nitrolite SDK integration
- Off-chain payment clearing
- On-chain security guarantees
- Real-time merchant notifications

**Arc Settlement**
- ERC-4626 compliant vault contract
- Batch settlement optimization
- Multi-merchant support
- Event-driven architecture

**Cross-Chain Bridge**
- Avail Nexus SDK integration (testnet)
- Unified cross-chain balance aggregation
- Bridge, transfer, and simulate operations
- USDC/USDT/ETH liquidity routing across Ethereum, Arbitrum, Base, Polygon, Optimism
- Live bridge step tracking with event hooks
- Quick top-up shortcuts for fast onboarding
- Gas optimization via automated source chain selection

## Features

- **Merchant Discovery**: Search and pay merchants by ENS name (e.g., `coffee.swiftpay.eth`)
- **Multi-Chain Wallets**: Support for Ethereum, Arbitrum, Base, Polygon, Optimism, Sepolia
- **Instant Payments**: State channel technology for sub-second clearing
- **Payment Preferences**: On-chain configuration via ENS text records
- **ENS Avatars**: Visual merchant profiles and branding
- **Smart Limits**: Min/max payment enforcement at protocol level
- **Fee Transparency**: Merchant fees stored and displayed on-chain
- **Cross-Chain Bridging**: Bridge tokens across 6+ chains via Avail Nexus with live step tracking

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with Turbopack
- **Language**: TypeScript + React 19
- **Web3**: wagmi, viem, RainbowKit
- **Cross-Chain**: Avail Nexus SDK (`@avail-project/nexus-core`)
- **UI**: Tailwind CSS, shadcn/ui
- **ENS**: Custom resolution hooks

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **WebSocket**: Real-time payment notifications
- **State Channels**: Yellow Network Nitrolite SDK

### Smart Contracts
- **Language**: Solidity 0.8.20
- **Framework**: Hardhat
- **Standards**: ERC-4626 (Vault)
- **Networks**: Arc Testnet, Sepolia

## Installation

### Prerequisites
- Node.js 20+
- npm or yarn
- MetaMask or compatible Web3 wallet

### Setup

```bash
# Clone repository
git clone https://github.com/yourusername/swiftpay.git
cd swiftpay

# Install dependencies
npm install --workspaces

# Configure environment variables
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env

# Update .env files with your API keys and configuration
```

### Environment Variables

**Frontend (.env.local)**
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8080
```

**Backend (.env)**
```env
YELLOW_WS_URL=wss://clearnet-sandbox.yellow.com/ws
YELLOW_NETWORK=sepolia
HUB_PRIVATE_KEY=your_private_key
SEPOLIA_USDC=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

## Development

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:3000`

### Start Backend

```bash
cd backend
npm run dev
```

Backend API: `http://localhost:3001`
WebSocket: `ws://localhost:8080`

### Deploy Contracts

```bash
cd contracts
npx hardhat compile
npx hardhat run scripts/deploy.ts --network sepolia
```

## Usage

### For Users

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred provider
2. **Find Merchant**: Enter merchant's ENS name (e.g., `merchant.swiftpay.eth`)
3. **Make Payment**: Enter amount and confirm transaction
4. **Instant Clearing**: Payment clears in <200ms via Yellow Network

### For Merchants

1. **Register ENS**: Set up your ENS name with SwiftPay text records
2. **Configure Preferences**: 
   - Payment endpoint
   - Settlement vault address
   - Settlement chain and frequency
   - Payment limits and fees
3. **Receive Payments**: Connect wallet to merchant panel
4. **Settle Funds**: Batch settle to your vault on preferred chain

## API Reference

### Backend Endpoints

```
POST   /api/deposit              - Deposit USDC to Yellow Network
POST   /api/channels/user        - Open user payment channel
POST   /api/channels/merchant    - Open merchant receiving channel
POST   /api/payments/clear       - Clear instant payment
POST   /api/settle               - Settle merchant channel
GET    /health                   - Service health check
```

### WebSocket Events

```javascript
// Merchant notifications
{
  type: "PAYMENT_CLEARED",
  payment: {
    userId: "0x...",
    amount: "10.00",
    timestamp: 1234567890
  }
}
```

## Smart Contract

### SwiftPayVault.sol

ERC-4626 compliant vault for merchant settlement:

```solidity
function deposit(uint256 assets, address receiver) external returns (uint256);
function settleMerchant(address merchant, uint256 amount) external;
function withdraw(uint256 assets, address receiver, address owner) external returns (uint256);
```

**Deployed Addresses:**
- Sepolia Testnet: TBD
- Arc Testnet: TBD

## Security

- Private keys stored in environment variables only
- No API keys committed to repository
- Smart contracts audited for common vulnerabilities
- State channel cryptographic verification
- ENS text records validated before use

## Testing

```bash
# Frontend tests
cd frontend
npm test

# Smart contract tests
cd contracts
npx hardhat test

# Backend tests
cd backend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Yellow Network for state channel infrastructure
- ENS for decentralized naming
- Arc for settlement layer
- Avail for cross-chain bridging

## Contact

- Website: [swiftpay.eth](https://swiftpay.eth)
- Twitter: [@SwiftPayWeb3](https://twitter.com/SwiftPayWeb3)
- Discord: [Join our community](https://discord.gg/swiftpay)

---

Built with ❤️ for the decentralized web

# Run backend server (separate terminal)
cd backend
npm run dev
```

**Application URLs:**
- Main App: http://localhost:3000
- Integration Tests: http://localhost:3000/test
- Admin Panel: http://localhost:3000/admin
- Merchant Dashboard: http://localhost:3000/merchant

## 🧪 Testing

```bash
# Run smart contract tests
cd contracts
npm test

# Run integration tests
cd frontend
npm run test

# Check wallet integration
open http://localhost:3000/test
```

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_key  
```

**Backend** (`.env`):
```
CIRCLE_API_KEY=your_circle_api_key
ARC_RPC_URL=https://rpc.testnet.arc.network
PORT=3001
```

### Supported Networks

- **Ethereum** (Chain ID: 1)
- **Arbitrum** (Chain ID: 42161)  
- **Base** (Chain ID: 8453)
- **Polygon** (Chain ID: 137)
- **Optimism** (Chain ID: 10)
- **Arc Testnet** (Chain ID: 5042002)

## 📱 Usage

1. **Connect Wallet**: Use RainbowKit to connect your Web3 wallet
2. **View Balances**: See real-time balances across all supported chains
3. **Switch Networks**: Seamlessly switch between different blockchains
4. **Make Payments**: Use merchant dashboard for payment processing
5. **Test Integration**: Run comprehensive tests via test interface

## 🔐 Smart Contract

**SwiftPayVault.sol** - Deployed on Arc Testnet
- Secure multi-signature vault
- Access control with role management  
- Emergency pause functionality
- Comprehensive test coverage (32 tests)

## 🌐 Phase 3 Roadmap

**Yellow Network Integration**
- [ ] Nitrolite SDK implementation
- [ ] State channel infrastructure  
- [ ] Cross-chain bridge setup
- [ ] Instant payment clearing
- [ ] Sub-second transaction finality

## 📄 Documentation

- [Phase 1 Completion Report](PHASE_1_COMPLETION_REPORT.md)
- [Phase 2 Completion Report](PHASE_2_COMPLETION.md)
- [Implementation Plan](IMPLEMENTATION_PLAN.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes  
4. Add comprehensive tests
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for the future of cross-chain payments**
