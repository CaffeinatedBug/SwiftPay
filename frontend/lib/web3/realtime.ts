'use client'

import { useEffect, useCallback, useState } from 'react'
import { useWallet } from '@/lib/web3/hooks'
import { useQueryClient } from '@tanstack/react-query'

// Real-time balance update service
export function useRealTimeBalances() {
  const wallet = useWallet()
  const queryClient = useQueryClient()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30000) // 30 seconds default

  // Manual refresh function
  const refreshBalances = useCallback(async () => {
    if (!wallet.isConnected) return

    try {
      // Refresh native balance
      await wallet.nativeBalance.refetch()
      
      // Invalidate all balance-related queries
      await queryClient.invalidateQueries({
        queryKey: ['balance'],
      })
      
      await queryClient.invalidateQueries({
        queryKey: ['tokenBalance'],
      })
      
      await queryClient.invalidateQueries({
        queryKey: ['multiChainBalances'],
      })

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to refresh balances:', error)
    }
  }, [wallet.isConnected, wallet.nativeBalance, queryClient])

  // Auto-refresh effect
  useEffect(() => {
    if (!isAutoRefresh || !wallet.isConnected) return

    const interval = setInterval(() => {
      refreshBalances()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isAutoRefresh, refreshInterval, wallet.isConnected, refreshBalances])

  // Refresh when chain changes
  useEffect(() => {
    if (wallet.isConnected) {
      refreshBalances()
    }
  }, [wallet.currentChainId, refreshBalances])

  // Refresh when connection status changes
  useEffect(() => {
    if (wallet.connectionStatus === 'connected') {
      refreshBalances()
    }
  }, [wallet.connectionStatus, refreshBalances])

  // Page visibility API - refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wallet.isConnected) {
        refreshBalances()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [wallet.isConnected, refreshBalances])

  return {
    refreshBalances,
    lastUpdate,
    isAutoRefresh,
    setIsAutoRefresh,
    refreshInterval,
    setRefreshInterval,
  }
}

// Balance update notification hook
export function useBalanceNotifications() {
  const wallet = useWallet()
  const [previousBalances, setPreviousBalances] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!wallet.isConnected || !wallet.address) return

    const currentBalances = {
      native: wallet.nativeBalance.balance,
      ...wallet.currentChainTokens.reduce((acc, token) => {
        acc[token.token.symbol] = token.balance
        return acc
      }, {} as Record<string, string>)
    }

    // Check for balance changes
    Object.entries(currentBalances).forEach(([key, balance]) => {
      const previous = previousBalances[key]
      if (previous && previous !== balance) {
        const isIncrease = BigInt(balance || '0') > BigInt(previous)
        
        // You could emit notifications here
        console.log(`Balance ${key}: ${isIncrease ? 'increased' : 'decreased'}`, {
          previous,
          current: balance,
          symbol: key === 'native' ? wallet.nativeBalance.symbol : key
        })
      }
    })

    setPreviousBalances(currentBalances)
  }, [
    wallet.isConnected,
    wallet.address,
    wallet.nativeBalance.balance,
    wallet.currentChainTokens,
    wallet.nativeBalance.symbol,
    previousBalances
  ])
}

// WebSocket connection for real-time updates (for future implementation)
export function useWebSocketUpdates() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL
    if (!wsUrl) return

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
      console.log('WebSocket connected for real-time updates')
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        
        // Handle different message types
        switch (data.type) {
          case 'balance_update':
            // Trigger balance refresh
            break
          case 'transaction_confirmed':
            // Show notification
            break
          case 'network_status':
            // Update network status
            break
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      console.log('WebSocket disconnected')
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return () => {
      ws.close()
    }
  }, [])

  return {
    isConnected,
    lastMessage,
  }
}

// Combined real-time system provider
export function RealTimeBalanceProvider({ children }: { children: React.ReactNode }) {
  useRealTimeBalances()
  useBalanceNotifications()
  useWebSocketUpdates()

  return <>{children}</>
}