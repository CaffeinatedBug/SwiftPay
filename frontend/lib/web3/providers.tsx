'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider, getDefaultConfig, Theme } from '@rainbow-me/rainbowkit'
import { ReactNode, useState } from 'react'
import { config } from './config'

// RainbowKit theme customization for SwiftPay
const swiftPayTheme: Theme = {
  blurs: {
    modalOverlay: 'blur(4px)',
  },
  colors: {
    accentColor: '#00D4FF',
    accentColorForeground: '#000000',
    actionButtonBorder: 'transparent',
    actionButtonBorderMobile: 'transparent',
    actionButtonSecondaryBackground: '#1a1a1a',
    closeButton: '#ffffff',
    closeButtonBackground: 'rgba(255, 255, 255, 0.1)',
    connectButtonBackground: '#00D4FF',
    connectButtonBackgroundError: '#ff4444',
    connectButtonInnerBackground: '#000000',
    connectButtonText: '#000000',
    connectButtonTextError: '#ffffff',
    connectionIndicator: '#00ff88',
    downloadBottomCardBackground: 'linear-gradient(126deg, rgba(0, 212, 255, 0.2) 9.49%, rgba(0, 212, 255, 0.1) 71.04%)',
    downloadTopCardBackground: 'linear-gradient(126deg, rgba(0, 212, 255, 0.2) 9.49%, rgba(0, 212, 255, 0.1) 71.04%)',
    error: '#ff4444',
    generalBorder: 'rgba(255, 255, 255, 0.1)',
    generalBorderDim: 'rgba(255, 255, 255, 0.05)',
    menuItemBackground: 'rgba(255, 255, 255, 0.05)',
    modalBackdrop: 'rgba(0, 0, 0, 0.8)',
    modalBackground: '#1a1a1a',
    modalBorder: 'rgba(255, 255, 255, 0.1)',
    modalText: '#ffffff',
    modalTextDim: 'rgba(255, 255, 255, 0.7)',
    modalTextSecondary: 'rgba(255, 255, 255, 0.6)',
    profileAction: 'rgba(255, 255, 255, 0.1)',
    profileActionHover: 'rgba(255, 255, 255, 0.2)',
    profileForeground: '#1a1a1a',
    selectedOptionBorder: '#00D4FF',
    standby: '#ffd700',
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif',
  },
  radii: {
    actionButton: '8px',
    connectButton: '8px',
    menuButton: '8px',
    modal: '12px',
    modalMobile: '12px',
  },
  shadows: {
    connectButton: '0px 4px 12px rgba(0, 212, 255, 0.3)',
    dialog: '0px 20px 40px rgba(0, 0, 0, 0.5)',
    profileDetailsAction: '0px 2px 8px rgba(0, 0, 0, 0.2)',
    selectedOption: '0px 0px 0px 2px rgba(0, 212, 255, 0.5)',
    selectedWallet: '0px 0px 0px 2px rgba(0, 212, 255, 0.5)',
    walletLogo: '0px 2px 8px rgba(0, 0, 0, 0.2)',
  },
}

interface Web3ProviderProps {
  children: ReactNode
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
    },
  }))

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={swiftPayTheme}
          appInfo={{
            appName: 'SwiftPay',
            disclaimer: ({ Text, Link }) => (
              <Text>
                By connecting your wallet, you agree to SwiftPay&apos;s{' '}
                <Link href="/terms">Terms of Service</Link> and{' '}
                <Link href="/privacy">Privacy Policy</Link>.
              </Text>
            ),
          }}
          modalSize="compact"
          coolMode
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

// Hook for accessing query client
export function useQueryClient() {
  const [queryClient] = useState(() => new QueryClient())
  return queryClient
}