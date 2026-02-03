# SwiftPay

Lightning-fast payment rails on blockchain with instant settlement.

## Project Structure

```
SwiftPay/
├── contracts/          # Smart Contracts (Hardhat)
│   ├── src/           # Solidity contracts
│   ├── scripts/       # Deployment scripts
│   └── test/          # Contract tests
│
└── frontend/          # Next.js Frontend
    ├── app/           # Next.js app directory
    ├── components/    # React components
    │   ├── layout/    # Layout components
    │   ├── merchant/  # Merchant dashboard components
    │   ├── panels/    # Main panel components
    │   └── ui/        # UI components (shadcn/ui)
    └── hooks/         # Custom React hooks
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MetaMask or compatible Web3 wallet

### Smart Contracts

```bash
cd contracts
npm install
npm run compile
npm run deploy
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Features

### User App
- Multi-chain wallet connection
- QR code payment scanning
- Real-time balance tracking
- Transaction history

### Merchant Dashboard
- Payment operations
- Real-time clearing
- Settlement to Arc vault
- Payment analytics

### Admin Panel
- System configuration
- Channel management
- Monitoring and analytics

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS, shadcn/ui
- **State**: TanStack Query
- **Web3**: (To be integrated)

### Smart Contracts
- **Framework**: Hardhat
- **Language**: Solidity
- **Libraries**: OpenZeppelin

## Development

### Frontend Development
```bash
cd frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run linter
```

### Contract Development
```bash
cd contracts
npm run compile  # Compile contracts
npm run test     # Run tests
npm run deploy   # Deploy contracts
```

## Migration Notes

This project was recently migrated from Vite to Next.js for improved performance and SEO capabilities. The old Vite frontend (`instant-rail`) has been removed.

## License

[Your License Here]
