import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, baseSepolia, arbitrumSepolia, polygonAmoy } from 'wagmi/chains';
import { http } from 'wagmi';

// Arc Testnet chain definition
const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ARC_RPC_URL || 'https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer.testnet.arc.network' },
  },
  testnet: true,
} as const;

export const config = getDefaultConfig({
  appName: 'SwiftPay',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [mainnet, baseSepolia, arbitrumSepolia, polygonAmoy, arcTestnet],
  transports: {
    [mainnet.id]: http(process.env.NEXT_PUBLIC_ENS_RPC_URL),
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [polygonAmoy.id]: http(),
    [arcTestnet.id]: http(process.env.NEXT_PUBLIC_ARC_RPC_URL),
  },
  ssr: true,
});
