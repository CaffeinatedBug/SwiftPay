'use client'

import { 
  createAppSessionMessage, 
  parseRPCResponse,
  NitroliteClient,
  WalletStateSigner,
  createECDSAMessageSigner,
  createAuthRequestMessage,
  createEIP712AuthMessageSigner,
  createAuthVerifyMessageFromChallenge,
  createCreateChannelMessage,
  createResizeChannelMessage,
  createCloseChannelMessage
} from '@erc7824/nitrolite'
import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { generatePrivateKey } from 'viem/accounts'

// Yellow Network Configuration
export const YELLOW_CONFIG = {
  // ClearNode endpoints
  SANDBOX_WS: 'wss://clearnet-sandbox.yellow.com/ws',
  PRODUCTION_WS: 'wss://clearnet.yellow.com/ws',
  
  // Faucet endpoint for test tokens
  FAUCET_URL: 'https://clearnet-sandbox.yellow.com/faucet/requestTokens',
  
  // Contract addresses on Sepolia testnet
  SEPOLIA_CONTRACTS: {
    custody: '0x019B65A265EB3363822f2752141b3dF16131b262',
    adjudicator: '0x7c7ccbc98469190849BCC6c926307794fDfB11F2',
    token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' // ytest.usd
  },
  
  // Channel configuration
  CHALLENGE_DURATION: 3600n, // 1 hour in seconds
  CHAIN_ID: sepolia.id,
  
  // Session configuration  
  SESSION_EXPIRE_TIME: 3600, // 1 hour in seconds
  DEFAULT_ALLOWANCE: '1000000000', // 1000 ytest.usd tokens
  
  // App configuration
  APP_NAME: 'SwiftPay',
  APP_PROTOCOL: 'swiftpay-v1'
}

// Yellow Network client interface
export interface YellowNetworkClient {
  connect(): Promise<void>
  disconnect(): void
  createSession(partnerAddress?: string): Promise<string>
  sendPayment(amount: string, recipient: string): Promise<void>
  getBalance(): Promise<string>
  closeSession(): Promise<void>
  isConnected(): boolean
  on(event: string, callback: (data: any) => void): void
}

// Yellow Network session state
export interface YellowSession {
  sessionId: string | null
  channelId: string | null
  isActive: boolean
  balance: string
  allowance: string
  participants: string[]
}

// Payment application definition
export interface PaymentAppDefinition {
  protocol: string
  participants: string[]
  weights: number[]
  quorum: number
  challenge: number
  nonce: number
}

// Session allocation for participants
export interface SessionAllocation {
  participant: string
  asset: string
  amount: string
}

// Message types for Yellow Network communication
export type YellowNetworkMessage = 
  | { type: 'session_created'; sessionId: string; data: any }
  | { type: 'payment'; amount: string; sender: string; recipient: string }
  | { type: 'channel_created'; channelId: string; data: any }
  | { type: 'channel_funded'; channelId: string; balance: string }
  | { type: 'channel_closed'; channelId: string; finalBalance: string }
  | { type: 'balance_update'; balance: string }
  | { type: 'error'; error: string; details?: any }
  | { type: 'auth_challenge'; challenge: any }
  | { type: 'auth_success'; sessionKey: string }

// Yellow Network error types
export class YellowNetworkError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'YellowNetworkError'
  }
}

// Utility functions
export const YellowUtils = {
  /**
   * Format amount for Yellow Network (handles decimal conversion)
   */
  formatAmount: (amount: string | number, decimals: number = 6): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return Math.floor(num * Math.pow(10, decimals)).toString()
  },

  /**
   * Parse amount from Yellow Network format
   */
  parseAmount: (amount: string, decimals: number = 6): string => {
    const num = parseInt(amount)
    return (num / Math.pow(10, decimals)).toFixed(decimals)
  },

  /**
   * Generate session nonce
   */
  generateNonce: (): number => {
    return Date.now() + Math.floor(Math.random() * 1000)
  },

  /**
   * Create payment application definition
   */
  createPaymentApp: (participants: string[]): PaymentAppDefinition => ({
    protocol: YELLOW_CONFIG.APP_PROTOCOL,
    participants,
    weights: participants.map(() => 100 / participants.length), // Equal weights
    quorum: 100, // All participants must agree
    challenge: 0,
    nonce: YellowUtils.generateNonce()
  }),

  /**
   * Create session allocations
   */
  createAllocations: (
    participants: string[], 
    amounts: string[], 
    asset: string = 'ytest.usd'
  ): SessionAllocation[] => {
    return participants.map((participant, index) => ({
      participant,
      asset,
      amount: amounts[index] || '0'
    }))
  },

  /**
   * Request test tokens from faucet
   */
  requestTestTokens: async (userAddress: string): Promise<boolean> => {
    try {
      const response = await fetch(YELLOW_CONFIG.FAUCET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userAddress
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('Failed to request test tokens:', error)
      return false
    }
  },

  /**
   * Validate Ethereum address
   */
  isValidAddress: (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  },

  /**
   * Create Nitrolite client configuration
   */
  createNitroliteConfig: (
    publicClient: any,
    walletClient: any
  ) => ({
    publicClient,
    walletClient,
    stateSigner: new WalletStateSigner(walletClient),
    addresses: YELLOW_CONFIG.SEPOLIA_CONTRACTS,
    chainId: YELLOW_CONFIG.CHAIN_ID,
    challengeDuration: YELLOW_CONFIG.CHALLENGE_DURATION,
  })
}

// Export main types and utilities
export type {
  PaymentAppDefinition,
  SessionAllocation,
  YellowNetworkMessage,
  YellowSession
}

export {
  YellowNetworkError,
  YellowUtils
}