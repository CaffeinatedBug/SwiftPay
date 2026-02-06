# ⚡ SwiftPay

> Pay coffeeshop.eth instantly from any chain. Settle in USDC. Zero friction.

## 🎯 What is SwiftPay?

SwiftPay is a crypto-native payment platform combining:
- **Yellow Network** — Instant off-chain payment clearing (<200ms)
- **ENS** — Human-readable merchant identities with custom text records
- **Avail Nexus** — Cross-chain USDC bridging
- **Arc Blockchain** — USDC settlement with sub-second finality

## 🏗️ Architecture

```
User (any chain) → ENS Resolution → Yellow State Channel → Hub
  → Avail Bridge → Arc Settlement → Merchant Withdrawal
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MetaMask wallet

### 1. Smart Contracts
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network arc-testnet
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env  # Fill in your keys
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # Fill in your keys
npm run dev
```

Open http://localhost:3000

## 📂 Project Structure

```
swiftpay/
├── frontend/          # Next.js 15 + wagmi + ENS
├── backend/           # Express + Yellow + Avail + Settlement
├── contracts/         # SwiftPayVault.sol on Arc
└── docs/              # Architecture, API, ENS docs
```

## 🏆 Prize Targets

| Partner | Amount | Integration |
|---------|--------|-------------|
| Yellow Network | $15,000 | Real Nitrolite SDK state channels |
| Arc (Circle) | $5,000 | USDC settlement on Arc testnet |
| ENS | $5,000 | Custom text records + wagmi hooks |

## 📄 License

MIT
