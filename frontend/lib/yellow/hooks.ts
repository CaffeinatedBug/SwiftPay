'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getYellowClient, SwiftPayYellowClient } from './client'
import { YellowSession, YellowNetworkMessage, YellowNetworkError } from './config'

/**
 * Hook for managing Yellow Network connection and authentication
 */
export function useYellowNetwork(useProduction: boolean = false) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [client, setClient] = useState<SwiftPayYellowClient | null>(null)

  const connect = useCallback(async () => {
    try {
      setIsConnecting(true)
      setError(null)

      const yellowClient = getYellowClient(useProduction)
      
      // Setup event listeners
      yellowClient.on('connected', () => {
        setIsConnected(true)
        setIsConnecting(false)
      })

      yellowClient.on('disconnected', () => {
        setIsConnected(false)
        setIsConnecting(false)
      })

      yellowClient.on('error', ({ error }) => {
        setError(error)
        setIsConnecting(false)
      })

      await yellowClient.connect()
      setClient(yellowClient)

    } catch (err) {
      const errorMessage = err instanceof YellowNetworkError 
        ? err.message 
        : 'Failed to connect to Yellow Network'
      setError(errorMessage)
      setIsConnecting(false)
    }
  }, [useProduction])

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect()
      setClient(null)
    }
    setIsConnected(false)
    setError(null)
  }, [client])

  return {
    client,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  }
}

/**
 * Hook for managing Yellow Network payment sessions
 */
export function useYellowSession(client: SwiftPayYellowClient | null) {
  const [session, setSession] = useState<YellowSession | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)

  useEffect(() => {
    if (!client) return

    const handleSessionCreated = ({ sessionId }: { sessionId: string }) => {
      setSession(client.getSession())
      setIsCreatingSession(false)
      setSessionError(null)
    }

    const handleSessionClosed = () => {
      setSession(null)
      setSessionError(null)
    }

    const handleError = ({ error }: { error: string }) => {
      setSessionError(error)
      setIsCreatingSession(false)
    }

    client.on('session_created', handleSessionCreated)
    client.on('session_closed', handleSessionClosed)
    client.on('error', handleError)

    return () => {
      client.off('session_created', handleSessionCreated)
      client.off('session_closed', handleSessionClosed) 
      client.off('error', handleError)
    }
  }, [client])

  const createSession = useCallback(async (partnerAddress?: string) => {
    if (!client) {
      setSessionError('Yellow Network client not connected')
      return
    }

    try {
      setIsCreatingSession(true)
      setSessionError(null)
      
      const sessionId = await client.createSession(partnerAddress)
      console.log('Session created:', sessionId)
      
    } catch (err) {
      const errorMessage = err instanceof YellowNetworkError 
        ? err.message 
        : 'Failed to create session'
      setSessionError(errorMessage)
      setIsCreatingSession(false)
    }
  }, [client])

  const closeSession = useCallback(async () => {
    if (!client || !session) return

    try {
      await client.closeSession()
    } catch (err) {
      const errorMessage = err instanceof YellowNetworkError 
        ? err.message 
        : 'Failed to close session'
      setSessionError(errorMessage)
    }
  }, [client, session])

  return {
    session,
    isCreatingSession,
    sessionError,
    createSession,
    closeSession
  }
}

/**
 * Hook for handling instant payments through Yellow Network
 */
export function useYellowPayments(client: SwiftPayYellowClient | null) {
  const [balance, setBalance] = useState('0')
  const [isSendingPayment, setIsSendingPayment] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<any[]>([])
  const [paymentError, setPaymentError] = useState<string | null>(null)

  useEffect(() => {
    if (!client) return

    const updateBalance = async () => {
      try {
        const currentBalance = await client.getBalance()
        setBalance(currentBalance)
      } catch (error) {
        console.error('Failed to get balance:', error)
      }
    }

    const handleBalanceUpdate = ({ balance }: { balance: string }) => {
      setBalance(balance)
    }

    const handlePaymentReceived = (payment: any) => {
      setPaymentHistory(prev => [...prev, {
        ...payment,
        type: 'received',
        timestamp: Date.now()
      }])
      updateBalance()
    }

    const handlePaymentSent = (payment: any) => {
      setPaymentHistory(prev => [...prev, {
        ...payment,
        type: 'sent',
        timestamp: Date.now()
      }])
      updateBalance()
    }

    client.on('balance_update', handleBalanceUpdate)
    client.on('payment', handlePaymentReceived)
    client.on('payment_sent', handlePaymentSent)

    // Initial balance fetch
    updateBalance()

    return () => {
      client.off('balance_update', handleBalanceUpdate)
      client.off('payment', handlePaymentReceived)
      client.off('payment_sent', handlePaymentSent)
    }
  }, [client])

  const sendPayment = useCallback(async (amount: string, recipient: string) => {
    if (!client) {
      setPaymentError('Yellow Network client not connected')
      return false
    }

    try {
      setIsSendingPayment(true)
      setPaymentError(null)
      
      await client.sendPayment(amount, recipient)
      return true
      
    } catch (err) {
      const errorMessage = err instanceof YellowNetworkError 
        ? err.message 
        : 'Failed to send payment'
      setPaymentError(errorMessage)
      return false
    } finally {
      setIsSendingPayment(false)
    }
  }, [client])

  const clearPaymentHistory = useCallback(() => {
    setPaymentHistory([])
  }, [])

  return {
    balance,
    isSendingPayment,
    paymentHistory,
    paymentError,
    sendPayment,
    clearPaymentHistory
  }
}

/**
 * Hook for Yellow Network real-time updates and notifications
 */
export function useYellowNotifications(client: SwiftPayYellowClient | null) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!client) return

    const addNotification = (type: string, message: string, data?: any) => {
      const notification = {
        id: Date.now() + Math.random(),
        type,
        message,
        data,
        timestamp: Date.now(),
        read: false
      }
      
      setNotifications(prev => [notification, ...prev].slice(0, 50)) // Keep last 50
      setUnreadCount(prev => prev + 1)
    }

    const handlePayment = ({ amount, sender }: any) => {
      addNotification('payment', `Received ${amount} tokens from ${sender.slice(0, 8)}...`, { amount, sender })
    }

    const handleSessionCreated = ({ sessionId }: any) => {
      addNotification('session', `Payment session created: ${sessionId}`, { sessionId })
    }

    const handleChannelFunded = ({ balance }: any) => {
      addNotification('funding', `Channel funded with ${balance} tokens`, { balance })
    }

    const handleError = ({ error }: any) => {
      addNotification('error', `Yellow Network error: ${error}`, { error })
    }

    client.on('payment', handlePayment)
    client.on('session_created', handleSessionCreated)
    client.on('channel_funded', handleChannelFunded)
    client.on('error', handleError)

    return () => {
      client.off('payment', handlePayment)
      client.off('session_created', handleSessionCreated)
      client.off('channel_funded', handleChannelFunded)
      client.off('error', handleError)
    }
  }, [client])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    )
    setUnreadCount(0)
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications
  }
}

/**
 * Comprehensive hook that combines all Yellow Network functionality
 */
export function useSwiftPayYellow(useProduction: boolean = false) {
  const { client, isConnected, isConnecting, error, connect, disconnect } = useYellowNetwork(useProduction)
  const { session, isCreatingSession, sessionError, createSession, closeSession } = useYellowSession(client)
  const { balance, isSendingPayment, paymentHistory, paymentError, sendPayment, clearPaymentHistory } = useYellowPayments(client)
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useYellowNotifications(client)

  // Combined error state
  const combinedError = error || sessionError || paymentError

  // Combined loading state
  const isLoading = isConnecting || isCreatingSession || isSendingPayment

  // Session status
  const hasActiveSession = session?.isActive || false

  return {
    // Connection
    client,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    
    // Session
    session,
    hasActiveSession,
    isCreatingSession,
    createSession,
    closeSession,
    
    // Payments
    balance,
    isSendingPayment,
    paymentHistory,
    sendPayment,
    clearPaymentHistory,
    
    // Notifications
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    
    // Combined states
    error: combinedError,
    isLoading,
    
    // Utility functions
    isReady: isConnected && hasActiveSession,
    canSendPayments: isConnected && hasActiveSession && !isSendingPayment
  }
}