import { http, createConfig } from 'wagmi'
import { 
  mainnet, 
  sepolia, 
  arbitrum, 
  arbitrumSepolia, 
  base, 
  baseSepolia, 
  polygon, 
  polygonAmoy, 
  optimism, 
  optimismSepolia 
} from 'wagmi/chains'
import { 
  coinbaseWallet, 
  injected, 
  walletConnect 
} from 'wagmi/connectors'

// Custom chain configuration for Arc testnet
export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://rpc.testnet.arc.network'] },
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    etherscan: { 
      name: 'Arc Explorer', 
      url: 'https://testnet-explorer.arc.network' 
    },
    default: { 
      name: 'Arc Explorer', 
      url: 'https://testnet-explorer.arc.network' 
    },
  },
  contracts: {
    // Add contract addresses when available
    swiftPayVault: {
      address: '0x...' as `0x${string}`, // Will be updated after deployment
    },
  },
} as const

// Environment-based chain selection
const isProduction = process.env.NODE_ENV === 'production'
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Production chains (mainnets)
const productionChains = [
  mainnet,
  arbitrum,
  base,
  polygon,
  optimism,
  arcTestnet, // Arc testnet for now
] as const

// Development chains (testnets + mainnets)
const developmentChains = [
  mainnet,
  sepolia,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  polygon,
  polygonAmoy,
  optimism,
  optimismSepolia,
  arcTestnet,
] as const

export const supportedChains = isProduction ? productionChains : developmentChains

// Wagmi configuration
export const config = createConfig({
  chains: supportedChains,
  connectors: [
    injected(),
    coinbaseWallet({
      appName: 'SwiftPay',
      appLogoUrl: '/logo.png',
    }),
    walletConnect({
      projectId,
      metadata: {
        name: 'SwiftPay',
        description: 'Cross-chain payment system with instant settlement',
        url: 'https://swiftpay.app', // Update with actual domain
        icons: ['/logo.png'],
      },
    }),
  ],
  transports: {
    // Mainnet
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    
    // Arbitrum
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
    
    // Base
    [base.id]: http(),
    [baseSepolia.id]: http(),
    
    // Polygon
    [polygon.id]: http(),
    [polygonAmoy.id]: http(),
    
    // Optimism
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    
    // Arc
    [arcTestnet.id]: http(),
  },
})

// Token configurations for different chains
export const tokenConfigurations = {
  // Ethereum Mainnet
  [mainnet.id]: {
    USDC: {
      address: '0xA0b86a33E6417c4d73f6b4BeB9b3d402A6f3A4C0' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    USDT: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`,
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
  },
  
  // Sepolia Testnet
  [sepolia.id]: {
    USDC: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Testnet)',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
  },
  
  // Arbitrum
  [arbitrum.id]: {
    USDC: {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    USDT: {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' as `0x${string}`,
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
  },
  
  // Arbitrum Sepolia
  [arbitrumSepolia.id]: {
    USDC: {
      address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Testnet)',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
  },
  
  // Base
  [base.id]: {
    USDC: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
  },
  
  // Base Sepolia
  [baseSepolia.id]: {
    USDC: {
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Testnet)',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
  },
  
  // Polygon
  [polygon.id]: {
    USDC: {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    USDT: {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`,
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
  },
  
  // Polygon Amoy (Testnet)
  [polygonAmoy.id]: {
    USDC: {
      address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Testnet)',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
  },
  
  // Optimism
  [optimism.id]: {
    USDC: {
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
    USDT: {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' as `0x${string}`,
      decimals: 6,
      symbol: 'USDT',
      name: 'Tether USD',
      logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
    },
  },
  
  // Optimism Sepolia
  [optimismSepolia.id]: {
    USDC: {
      address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Testnet)',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
  },
  
  // Arc Testnet
  [arcTestnet.id]: {
    USDC: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' as `0x${string}`,
      decimals: 6,
      symbol: 'USDC',
      name: 'USD Coin (Arc)',
      logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
    },
  },
} as const

export type TokenConfiguration = {
  address: `0x${string}`
  decimals: number
  symbol: string
  name: string
  logoURI: string
}

export type SupportedChainId = keyof typeof tokenConfigurations

// Helper functions
export function getTokensForChain(chainId: number): Record<string, TokenConfiguration> {
  return tokenConfigurations[chainId as SupportedChainId] || {}
}

export function getChainById(chainId: number) {
  return supportedChains.find(chain => chain.id === chainId)
}

export function isChainSupported(chainId: number): chainId is SupportedChainId {
  return chainId in tokenConfigurations
}

// Chain metadata for UI
export const chainMetadata = {
  [mainnet.id]: {
    color: '#627EEA',
    shortName: 'ETH',
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  [sepolia.id]: {
    color: '#627EEA',
    shortName: 'SEP',
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  [arbitrum.id]: {
    color: '#28A0F0',
    shortName: 'ARB',
    logoURI: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
  },
  [arbitrumSepolia.id]: {
    color: '#28A0F0',
    shortName: 'ARB',
    logoURI: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
  },
  [base.id]: {
    color: '#0052FF',
    shortName: 'BASE',
    logoURI: 'https://avatars.githubusercontent.com/u/108554348',
  },
  [baseSepolia.id]: {
    color: '#0052FF',
    shortName: 'BASE',
    logoURI: 'https://avatars.githubusercontent.com/u/108554348',
  },
  [polygon.id]: {
    color: '#8247E5',
    shortName: 'MATIC',
    logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
  [polygonAmoy.id]: {
    color: '#8247E5',
    shortName: 'MATIC',
    logoURI: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
  [optimism.id]: {
    color: '#FF0420',
    shortName: 'OP',
    logoURI: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
  },
  [optimismSepolia.id]: {
    color: '#FF0420',
    shortName: 'OP',
    logoURI: 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
  },
  [arcTestnet.id]: {
    color: '#00D4FF',
    shortName: 'ARC',
    logoURI: '/arc-logo.png', // Add Arc logo to public folder
  },
} as const