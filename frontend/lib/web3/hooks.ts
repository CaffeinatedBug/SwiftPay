'use client'

import { useAccount, useBalance, useReadContract, useReadContracts, useChainId, useSwitchChain } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { formatUnits, parseAbi } from 'viem'
import { getTokensForChain, type TokenConfiguration, chainMetadata, supportedChains } from './config'
import { useCallback, useEffect, useState } from 'react'

// ERC20 ABI for token operations
const ERC20_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
])

// Token balance type
export interface TokenBalance {
  token: TokenConfiguration
  balance: string
  formatted: string
  decimals: number
  isLoading: boolean
  error?: Error | null
}

// Chain balance type  
export interface ChainBalance {
  chainId: number
  chainName: string
  nativeBalance: {
    balance: string
    formatted: string
    symbol: string
    isLoading: boolean
    error?: Error | null
  }
  tokenBalances: TokenBalance[]
  metadata: {
    color: string
    shortName: string
    logoURI: string
  }
}

// Hook to get native token balance (ETH, MATIC, etc.)
export function useNativeBalance(chainId?: number) {
  const { address } = useAccount()
  const currentChainId = useChainId()
  const targetChainId = chainId || currentChainId
  
  const { data: balance, isLoading, error, refetch } = useBalance({
    address,
    chainId: targetChainId,
    query: {
      enabled: !!address,
      staleTime: 10_000, // 10 seconds
      refetchInterval: 30_000, // 30 seconds
    },
  })

  const formattedBalance = balance 
    ? formatUnits(balance.value, balance.decimals) 
    : '0'

  return {
    balance: balance?.value?.toString() || '0',
    formatted: formattedBalance,
    symbol: balance?.symbol || 'ETH',
    decimals: balance?.decimals || 18,
    isLoading,
    error,
    refetch,
  }
}

// Hook to get ERC20 token balance
export function useTokenBalance(tokenAddress: `0x${string}`, chainId?: number) {
  const { address } = useAccount()
  const currentChainId = useChainId()
  const targetChainId = chainId || currentChainId

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: targetChainId,
    query: {
      enabled: !!address && !!tokenAddress,
      staleTime: 10_000,
      refetchInterval: 30_000,
    },
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    chainId: targetChainId,
  })

  const balanceFormatted = balance && decimals 
    ? formatUnits(balance as bigint, decimals)
    : '0'

  return {
    balance: balance?.toString() || '0',
    formatted: balanceFormatted,
    decimals: decimals || 18,
    isLoading,
    error,
    refetch,
  }
}

// Hook to get all token balances for a specific chain
export function useChainTokenBalances(chainId: number): TokenBalance[] {
  const { address } = useAccount()
  const tokens = getTokensForChain(chainId)
  const tokenAddresses = Object.values(tokens).map(token => token.address)
  
  const contracts = tokenAddresses.map(tokenAddress => ({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf' as const,
    args: address ? [address] : undefined,
    chainId,
  }))

  const { data: balances, isLoading, error } = useReadContracts({
    contracts,
    query: {
      enabled: !!address && tokenAddresses.length > 0,
      staleTime: 10_000,
      refetchInterval: 30_000,
    },
  })

  return Object.entries(tokens).map(([symbol, token], index) => {
    const balanceData = balances?.[index]
    const balance = balanceData?.status === 'success' ? balanceData.result as bigint : BigInt(0)
    const formatted = formatUnits(balance, token.decimals)

    return {
      token,
      balance: balance.toString(),
      formatted,
      decimals: token.decimals,
      isLoading,
      error: balanceData?.status === 'failure' ? new Error(balanceData.error?.message) : null,
    }
  })
}

// Hook to get balances across all supported chains
export function useMultiChainBalances(): ChainBalance[] {
  const { address } = useAccount()
  const chainId = useChainId()

  // Query balances for all supported chains
  const { data: multiChainData, isLoading } = useQuery({
    queryKey: ['multiChainBalances', address],
    queryFn: async () => {
      if (!address) return []

      const chainBalances: ChainBalance[] = []

      for (const chain of supportedChains) {
        try {
          const tokens = getTokensForChain(chain.id)
          const metadata = chainMetadata[chain.id as keyof typeof chainMetadata]

          // This is a simplified version - in production you'd want to batch these calls
          chainBalances.push({
            chainId: chain.id,
            chainName: chain.name,
            nativeBalance: {
              balance: '0',
              formatted: '0',
              symbol: chain.nativeCurrency.symbol,
              isLoading: true,
            },
            tokenBalances: Object.entries(tokens).map(([symbol, token]) => ({
              token,
              balance: '0',
              formatted: '0',
              decimals: token.decimals,
              isLoading: true,
            })),
            metadata: metadata || {
              color: '#627EEA',
              shortName: 'ETH',
              logoURI: '/ethereum-logo.png',
            },
          })
        } catch (error) {
          console.error(`Error fetching balances for chain ${chain.id}:`, error)
        }
      }

      return chainBalances
    },
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 60_000,
  })

  return multiChainData || []
}

// Hook for chain switching
export function useChainSwitcher() {
  const { switchChain, isPending, error } = useSwitchChain()
  const chainId = useChainId()

  const switchToChain = useCallback(
    (targetChainId: number) => {
      if (targetChainId === chainId) return
      
      switchChain({ chainId: targetChainId })
    },
    [switchChain, chainId]
  )

  const switchToArc = useCallback(() => {
    switchToChain(5042002) // Arc testnet
  }, [switchToChain])

  return {
    switchToChain,
    switchToArc,
    currentChainId: chainId,
    isPending,
    error,
  }
}

// Hook for wallet connection state
export function useWalletConnection() {
  const { address, isConnected, isConnecting, isDisconnected, connector, chain } = useAccount()
  const [isReconnecting, setIsReconnecting] = useState(false)

  // Handle reconnection on app load
  useEffect(() => {
    if (isConnecting) {
      setIsReconnecting(true)
      const timer = setTimeout(() => setIsReconnecting(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isConnecting])

  const connectionStatus = isConnecting || isReconnecting ? 'connecting' : 
                          isConnected ? 'connected' : 
                          'disconnected'

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isReconnecting,
    isDisconnected,
    connector,
    chain,
    connectionStatus,
  }
}

// Hook for comprehensive wallet state (main hook for components)
export function useWallet() {
  const connection = useWalletConnection()
  const chainSwitcher = useChainSwitcher()
  const nativeBalance = useNativeBalance()
  const multiChainBalances = useMultiChainBalances()
  
  // Get current chain data
  const currentChain = supportedChains.find(chain => chain.id === chainSwitcher.currentChainId)
  const currentChainTokens = useChainTokenBalances(chainSwitcher.currentChainId)
  const currentChainMetadata = chainMetadata[chainSwitcher.currentChainId as keyof typeof chainMetadata]

  return {
    // Connection state
    ...connection,
    
    // Chain management
    ...chainSwitcher,
    currentChain,
    currentChainMetadata,
    
    // Balance data
    nativeBalance,
    currentChainTokens,
    multiChainBalances,
    
    // Utility functions
    isChainSupported: (chainId: number) => 
      supportedChains.some(chain => chain.id === chainId),
    
    // Formatted address for display
    shortAddress: connection.address 
      ? `${connection.address.slice(0, 6)}...${connection.address.slice(-4)}`
      : undefined,
  }
}

// Hook for token selection and management
export function useTokenSelector(chainId?: number) {
  const currentChainId = useChainId()
  const targetChainId = chainId || currentChainId
  const [selectedToken, setSelectedToken] = useState<string>('USDC')

  const availableTokens = getTokensForChain(targetChainId)
  const selectedTokenConfig = availableTokens[selectedToken]

  const selectToken = useCallback((symbol: string) => {
    if (symbol in availableTokens) {
      setSelectedToken(symbol)
    }
  }, [availableTokens])

  // Auto-select USDC if available, otherwise first token
  useEffect(() => {
    if (!selectedTokenConfig) {
      const tokenSymbols = Object.keys(availableTokens)
      if (tokenSymbols.includes('USDC')) {
        setSelectedToken('USDC')
      } else if (tokenSymbols.length > 0) {
        setSelectedToken(tokenSymbols[0])
      }
    }
  }, [targetChainId, availableTokens, selectedTokenConfig])

  return {
    selectedToken,
    selectedTokenConfig,
    availableTokens,
    selectToken,
    chainId: targetChainId,
  }
}