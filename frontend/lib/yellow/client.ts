'use client'

// Extend Window interface for ethereum - using any to avoid conflicts with other libraries
declare global {
  interface Window {
    ethereum?: any;
  }
}

import { createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

import {
  YELLOW_CONFIG,
  YellowNetworkClient,
  YellowSession,
  YellowNetworkError,
} from './config'

/**
 * SwiftPay Yellow Network Integration Client
 * Provides instant payment clearing using Yellow Network's state channels
 */
export class SwiftPayYellowClient implements YellowNetworkClient {
  private ws: WebSocket | null = null
  private sessionPrivateKey: `0x${string}` | null = null
  private sessionAccount: any = null
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map()
  
  // Session state
  private session: YellowSession = {
    sessionId: null,
    channelId: null,
    isActive: false,
    balance: '0',
    allowance: '0',
    participants: []
  }

  // Wallet clients
  private publicClient: any = null
  private userAddress: string | null = null
  private _isConnected: boolean = false

  constructor(
    private rpcUrl?: string,
    private useProduction: boolean = false
  ) {
    this.rpcUrl = rpcUrl || process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL
  }

  /**
   * Initialize wallet clients and connect to Yellow Network
   */
  async connect(): Promise<void> {
    try {
      // Setup wallet clients if not provided externally
      await this.setupWalletClients()

      // Generate session key for Yellow Network
      this.sessionPrivateKey = generatePrivateKey()
      this.sessionAccount = privateKeyToAccount(this.sessionPrivateKey)

      // Connect to Yellow Network WebSocket
      const wsUrl = this.useProduction 
        ? YELLOW_CONFIG.PRODUCTION_WS 
        : YELLOW_CONFIG.SANDBOX_WS

      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('🟢 Connected to Yellow Network ClearNode')
        this._isConnected = true
        this.emit('connected', { userAddress: this.userAddress })
        
        // Initiate authentication
        this.initiateAuth()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleNetworkMessage(message)
        } catch (error) {
          console.error('Failed to parse Yellow Network message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('Yellow Network WebSocket error:', error)
        this.emit('error', { error: 'WebSocket connection error' })
      }

      this.ws.onclose = () => {
        console.log('🔴 Disconnected from Yellow Network')
        this._isConnected = false
        this.emit('disconnected', {})
      }

    } catch (error) {
      console.error('Failed to connect to Yellow Network:', error)
      throw new YellowNetworkError(
        'Failed to connect to Yellow Network',
        'CONNECTION_ERROR',
        error
      )
    }
  }

  /**
   * Setup wallet clients using window.ethereum or provided RPC
   */
  private async setupWalletClients(): Promise<void> {
    const ethereum = typeof window !== 'undefined' ? window.ethereum : undefined
    
    if (ethereum) {
      // Browser environment with MetaMask
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      })
      this.userAddress = accounts[0]

      // Create public client for browser
      this.publicClient = createPublicClient({
        chain: sepolia,
        transport: http(this.rpcUrl)
      })
    } else {
      // Server environment or with private key
      const privateKey = process.env.PRIVATE_KEY as `0x${string}`
      if (!privateKey) {
        throw new YellowNetworkError('Private key required for server environment')
      }

      const account = privateKeyToAccount(privateKey)
      this.userAddress = account.address

      this.publicClient = createPublicClient({
        chain: sepolia,
        transport: http(this.rpcUrl)
      })
    }
  }

  /**
   * Initiate authentication with Yellow Network
   */
  private async initiateAuth(): Promise<void> {
    try {
      // Create auth request message
      const authRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'auth_request',
        params: {
          participant: this.userAddress,
          app_name: YELLOW_CONFIG.APP_NAME,
          session_key: this.sessionAccount?.address
        }
      }

      this.ws?.send(JSON.stringify(authRequest))
    } catch (error) {
      console.error('Failed to initiate authentication:', error)
      this.emit('error', { error: 'Authentication initiation failed' })
    }
  }

  /**
   * Handle incoming network messages
   */
  private handleNetworkMessage(message: any): void {
    // Parse message type from JSON-RPC response
    const method = message.method || (message.result ? 'result' : 'error')
    
    switch (method) {
      case 'auth_challenge':
        this.handleAuthChallenge(message)
        break
      case 'auth_success':
      case 'result':
        if (message.result?.authenticated) {
          this.handleAuthSuccess(message)
        }
        break
      case 'channel_created':
        this.handleChannelCreated(message)
        break
      case 'state_update':
        this.handleStateUpdate(message)
        break
      case 'payment_received':
        this.handlePaymentReceived(message)
        break
      case 'error':
        this.handleError(message)
        break
      default:
        console.log('Unhandled Yellow Network message:', message)
    }
  }

  /**
   * Handle authentication challenge
   */
  private async handleAuthChallenge(response: any): Promise<void> {
    try {
      const challenge = response.params?.challenge
      if (!challenge) throw new Error('No challenge message received')

      const ethereum = typeof window !== 'undefined' ? window.ethereum : undefined
      if (!ethereum) throw new Error('No ethereum provider')

      // Sign the challenge with the user's wallet
      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [challenge, this.userAddress]
      })

      // Send verification response
      const verifyMsg = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'auth_verify',
        params: {
          signature,
          session_key: this.sessionAccount?.address,
          allowances: [{
            asset: 'ytest.usd',
            amount: YELLOW_CONFIG.DEFAULT_ALLOWANCE
          }],
          expires_at: Math.floor(Date.now() / 1000) + YELLOW_CONFIG.SESSION_EXPIRE_TIME
        }
      }

      this.ws?.send(JSON.stringify(verifyMsg))
    } catch (error) {
      console.error('Authentication challenge failed:', error)
      this.emit('error', { error: 'Authentication failed' })
    }
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(_response: any): void {
    console.log('✅ Authenticated with Yellow Network')
    this.session.isActive = true
    this.emit('authenticated', { sessionKey: this.sessionAccount?.address })
  }

  /**
   * Handle channel created
   */
  private handleChannelCreated(response: any): void {
    const channelId = response.params?.channel_id
    if (channelId) {
      this.session.channelId = channelId
      this.emit('channelCreated', { channelId })
    }
  }

  /**
   * Handle state updates
   */
  private handleStateUpdate(message: any): void {
    const balances = message.params?.balances
    if (balances && this.userAddress) {
      this.session.balance = balances[this.userAddress] || '0'
      this.emit('balanceUpdated', { balance: this.session.balance })
    }
  }

  /**
   * Handle incoming payments
   */
  private handlePaymentReceived(message: any): void {
    this.emit('paymentReceived', message.params)
  }

  /**
   * Handle errors
   */
  private handleError(message: any): void {
    console.error('Yellow Network error:', message)
    this.emit('error', { error: message.error?.message || 'Unknown error' })
  }

  /**
   * Disconnect from Yellow Network
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this._isConnected = false
    this.session = {
      sessionId: null,
      channelId: null,
      isActive: false,
      balance: '0',
      allowance: '0',
      participants: []
    }
  }

  /**
   * Create a new payment session
   */
  async createSession(
    participants: string[],
    initialBalance: string
  ): Promise<YellowSession> {
    if (!this._isConnected || !this.session.isActive) {
      throw new YellowNetworkError('Not connected to Yellow Network')
    }

    try {
      const sessionRequest = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'create_session',
        params: {
          participants: [this.userAddress, ...participants],
          initial_balance: initialBalance,
          app_definition: {
            name: YELLOW_CONFIG.APP_NAME,
            protocol: YELLOW_CONFIG.APP_PROTOCOL
          }
        }
      }

      this.ws?.send(JSON.stringify(sessionRequest))

      // Update local session
      this.session.participants = [this.userAddress!, ...participants]
      this.session.balance = initialBalance

      return this.session
    } catch (error) {
      throw new YellowNetworkError(
        'Failed to create session',
        'SESSION_ERROR',
        error
      )
    }
  }

  /**
   * Send instant payment through Yellow Network
   */
  async sendPayment(
    recipient: string,
    amount: string,
    token: string = 'ytest.usd'
  ): Promise<{ txId: string; stateHash: string }> {
    if (!this.session.isActive) {
      throw new YellowNetworkError('Session not active')
    }

    try {
      const txId = `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

      const paymentMsg = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'send_payment',
        params: {
          tx_id: txId,
          recipient,
          amount,
          token,
          sender: this.userAddress
        }
      }

      this.ws?.send(JSON.stringify(paymentMsg))

      // Update balance optimistically
      const newBalance = BigInt(this.session.balance) - BigInt(amount)
      this.session.balance = newBalance.toString()

      this.emit('paymentSent', { txId, recipient, amount, token })

      return {
        txId,
        stateHash: `0x${txId.slice(3)}` as `0x${string}`
      }
    } catch (error) {
      throw new YellowNetworkError(
        'Failed to send payment',
        'PAYMENT_ERROR',
        error
      )
    }
  }

  /**
   * Close session and settle on-chain
   */
  async closeSession(): Promise<void> {
    if (!this.session.isActive) return

    try {
      const closeMsg = {
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'close_session',
        params: {
          channel_id: this.session.channelId,
          cooperative: true
        }
      }

      this.ws?.send(JSON.stringify(closeMsg))
      this.session.isActive = false
      this.emit('sessionClosed', { channelId: this.session.channelId })
    } catch (error) {
      throw new YellowNetworkError(
        'Failed to close session',
        'CLOSE_ERROR',
        error
      )
    }
  }

  /**
   * Get current session state
   */
  getSession(): YellowSession {
    return { ...this.session }
  }

  /**
   * Get current balance
   */
  getBalance(): string {
    return this.session.balance
  }

  /**
   * Check if connected (interface method)
   */
  isConnected(): boolean {
    return this._isConnected && this.session.isActive
  }

  /**
   * Check if connected (internal method)
   */
  isNetworkConnected(): boolean {
    return this._isConnected && this.session.isActive
  }

  /**
   * Event emitter methods
   */
  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  /**
   * Request test tokens from faucet
   */
  async requestTestTokens(): Promise<{ success: boolean; txHash?: string }> {
    if (!this.userAddress) {
      throw new YellowNetworkError('No wallet connected')
    }

    try {
      const response = await fetch(YELLOW_CONFIG.FAUCET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: this.userAddress })
      })

      const data = await response.json()
      return {
        success: response.ok,
        txHash: data.txHash
      }
    } catch (error) {
      console.error('Failed to request test tokens:', error)
      return { success: false }
    }
  }
}

// Singleton instance management
let yellowClient: SwiftPayYellowClient | null = null

export function getYellowClient(useProduction: boolean = false): SwiftPayYellowClient {
  if (!yellowClient) {
    yellowClient = new SwiftPayYellowClient(undefined, useProduction)
  }
  return yellowClient
}

export function resetYellowClient(): void {
  if (yellowClient) {
    yellowClient.disconnect()
    yellowClient = null
  }
}
