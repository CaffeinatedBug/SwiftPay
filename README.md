# SwiftPay - Multi-Chain Payment Platform

SwiftPay is a next-generation payment platform that enables instant cross-chain transactions using state channels and multi-chain wallet integration.

## 🚀 Features

- **Multi-Chain Support**: Ethereum, Arbitrum, Base, Polygon, Optimism, Arc Testnet
- **Real-Time Balances**: Live balance tracking across all supported networks  
- **Smart Contracts**: Secure vault system on Arc blockchain
- **State Channels**: Lightning-fast payment clearing (Phase 3)
- **Production Grade**: Enterprise-ready wallet integration

## 🏗️ Architecture

### Phase 1 ✅ - Blockchain Infrastructure
- Arc testnet integration with RPC endpoints
- SwiftPayVault.sol smart contract deployment
- Circle Gateway & Wallets API integration
- Backend with Express + WebSocket support

### Phase 2 ✅ - Wallet Integration  
- wagmi + viem + RainbowKit implementation
- Multi-chain balance tracking
- Real-time updates and notifications
- Production-grade error handling

### Phase 3 🚧 - Yellow Network Integration
- Nitrolite SDK for instant payments
- State channel implementation
- Cross-chain bridge setup

## 🛠️ Tech Stack

**Frontend**
- Next.js 16 with Turbopack
- React 19 + TypeScript
- wagmi + viem for Web3
- RainbowKit for wallet UI
- Tailwind CSS + shadcn/ui

**Backend** 
- Node.js + TypeScript
- Express.js with WebSocket
- Circle API integration
- Multi-chain RPC management

**Blockchain**
- Solidity smart contracts
- Hardhat development framework
- Arc testnet deployment
- Cross-chain token support

## 📦 Installation

```bash
# Install frontend dependencies
cd frontend
npm install --legacy-peer-deps

# Install smart contract dependencies  
cd ../contracts
npm install

# Install backend dependencies
cd ../backend
npm install
```

## 🚀 Quick Start

```bash
# Start frontend development server
cd frontend
npm run dev

# Deploy smart contracts (separate terminal)
cd contracts  
npm run deploy

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
