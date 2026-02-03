'use client'

import { 
  createAppSessionMessage, 
  parseRPCResponse,
  NitroliteClient,
  createAuthRequestMessage,
  createEIP712AuthMessageSigner,
  createAuthVerifyMessageFromChallenge,
  createCreateChannelMessage,
  createResizeChannelMessage,
  createCloseChannelMessage,
  createECDSAMessageSigner
} from '@erc7824/nitrolite'
import { createPublicClient, createWalletClient, http } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'

import {
  YELLOW_CONFIG,
  YellowNetworkClient,
  YellowSession,
  YellowNetworkMessage,
  YellowNetworkError,
  YellowUtils,
  PaymentAppDefinition,
  SessionAllocation
} from './config'

/**
 * SwiftPay Yellow Network Integration Client
 * Provides instant payment clearing using Yellow Network's state channels
 */
export class SwiftPayYellowClient implements YellowNetworkClient {
  private ws: WebSocket | null = null
  private nitroliteClient: NitroliteClient | null = null
  private sessionPrivateKey: `0x${string}` | null = null
  private sessionSigner: any = null
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
  private walletClient: any = null
  private userAddress: string | null = null

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
      if (!this.publicClient || !this.walletClient) {
        await this.setupWalletClients()
      }

      // Generate session key
      this.sessionPrivateKey = generatePrivateKey()
      this.sessionSigner = createECDSAMessageSigner(this.sessionPrivateKey)
      this.sessionAccount = privateKeyToAccount(this.sessionPrivateKey)

      // Initialize Nitrolite client
      this.nitroliteClient = new NitroliteClient(
        YellowUtils.createNitroliteConfig(this.publicClient, this.walletClient)
      )

      // Connect to Yellow Network WebSocket
      const wsUrl = this.useProduction 
        ? YELLOW_CONFIG.PRODUCTION_WS 
        : YELLOW_CONFIG.SANDBOX_WS

      this.ws = new WebSocket(wsUrl)
      
      await this.setupWebSocketHandlers()
      await this.waitForConnection()

      // Request test tokens if in sandbox mode
      if (!this.useProduction && this.userAddress) {
        await YellowUtils.requestTestTokens(this.userAddress)
      }

      this.emit('connected', { address: this.userAddress })
      
    } catch (error) {
      throw new YellowNetworkError(
        'Failed to connect to Yellow Network',
        'CONNECTION_FAILED',
        error
      )
    }
  }

  /**
   * Setup wallet clients using window.ethereum or provided RPC
   */
  private async setupWalletClients(): Promise<void> {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Browser environment with MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })
      this.userAddress = accounts[0]

      // Create wallet client for browser
      this.publicClient = createPublicClient({
        chain: sepolia,
        transport: http(this.rpcUrl)
      })

      // For browser, we'll use a different approach
      this.walletClient = {
        account: { address: this.userAddress },
        signMessage: async ({ message }: { message: string }) => {
          return await window.ethereum.request({
            method: 'personal_sign',
            params: [message, this.userAddress]
          })
        }
      }
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

      this.walletClient = createWalletClient({
        chain: sepolia,
        transport: http(this.rpcUrl),
        account
      })
    }
  }

  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('🟢 Connected to Yellow Network ClearNode')
    }

    this.ws.onmessage = (event) => {
      try {
        const message = parseRPCResponse(event.data)
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
      this.emit('disconnected', {})
    }
  }

  /**
   * Handle messages from Yellow Network
   */
  private handleNetworkMessage(message: any): void {
    const { type, response } = message

    switch (type) {
      case 'auth_challenge':
        this.handleAuthChallenge(response)
        break
        
      case 'auth_success':
        this.handleAuthSuccess(response)
        break
        
      case 'create_channel':
        this.handleChannelCreated(response)
        break
        
      case 'resize_channel':
        this.handleChannelFunded(response)
        break
        
      case 'session_created':
        this.handleSessionCreated(response)
        break
        
      case 'payment':
        this.handlePaymentReceived(response)
        break
        
      case 'balance_update':
        this.handleBalanceUpdate(response)
        break
        
      case 'error':
        this.handleError(response)
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
      const challenge = response[2]?.challenge_message
      if (!challenge) throw new Error('No challenge message received')

      // Create EIP-712 signer with main wallet
      const signer = createEIP712AuthMessageSigner(
        this.walletClient,
        {
          address: this.userAddress!,
          application: YELLOW_CONFIG.APP_NAME,
          session_key: this.sessionAccount.address,
          allowances: [{
            asset: 'ytest.usd',
            amount: YELLOW_CONFIG.DEFAULT_ALLOWANCE
          }],
          expires_at: BigInt(Math.floor(Date.now() / 1000) + YELLOW_CONFIG.SESSION_EXPIRE_TIME),
          scope: 'swiftpay.app'
        },
        { name: YELLOW_CONFIG.APP_NAME }
      )

      // Verify with challenge
      const verifyMsg = await createAuthVerifyMessageFromChallenge(signer, challenge)
      this.ws?.send(verifyMsg)

    } catch (error) {
      console.error('Authentication challenge failed:', error)
      this.emit('error', { error: 'Authentication failed' })
    }
  }

  /**
   * Handle successful authentication
   */
  private handleAuthSuccess(response: any): void {
    console.log('✅ Authenticated with Yellow Network')
    this.emit('authenticated', { sessionKey: this.sessionAccount?.address })
  }

  /**
   * Handle channel created
   */
  private handleChannelCreated(response: any): void {
    const channelId = response?.channel_id
    if (channelId) {
      this.session.channelId = channelId
      this.emit('channel_created', { channelId })
    }
  }

  /**
   * Handle channel funded
   */
  private handleChannelFunded(response: any): void {
    const balance = response?.balance || '0'
    this.session.balance = balance
    this.emit('channel_funded', { balance })
  }

  /**
   * Handle session created
   */
  private handleSessionCreated(response: any): void {
    const sessionId = response?.sessionId || response?.session_id
    if (sessionId) {
      this.session.sessionId = sessionId
      this.session.isActive = true
      this.emit('session_created', { sessionId })
    }
  }

  /**
   * Handle payment received
   */
  private handlePaymentReceived(response: any): void {
    const { amount, sender, recipient } = response
    this.emit('payment', { amount, sender, recipient })
    
    // Update balance if this payment affects us
    if (recipient === this.userAddress) {
      const currentBalance = parseFloat(this.session.balance)
      const paymentAmount = parseFloat(amount)
      this.session.balance = (currentBalance + paymentAmount).toString()
      this.emit('balance_update', { balance: this.session.balance })
    }
  }

  /**
   * Handle balance update
   */
  private handleBalanceUpdate(response: any): void {
    const balance = response?.balance || '0'
    this.session.balance = balance
    this.emit('balance_update', { balance })
  }

  /**
   * Handle error message
   */
  private handleError(response: any): void {
    const error = response?.error || 'Unknown error'
    console.error('Yellow Network error:', error)
    this.emit('error', { error, details: response })
  }

  /**
   * Wait for WebSocket connection to be established
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject(new Error('WebSocket not initialized'))
        return
      }

      if (this.ws.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, 10000)

      this.ws.onopen = () => {
        clearTimeout(timeout)
        resolve()
      }
    })
  }

  /**
   * Create payment session with optional partner
   */
  async createSession(partnerAddress?: string): Promise<string> {
    try {
      if (!this.ws || !this.sessionSigner || !this.userAddress) {
        throw new Error('Not connected to Yellow Network')
      }

      // First authenticate if not already done
      await this.authenticate()

      // Create participants list
      const participants = partnerAddress 
        ? [this.userAddress, partnerAddress]
        : [this.userAddress]

      // Create application definition
      const appDefinition = YellowUtils.createPaymentApp(participants)
      
      // Create allocations - equal split or full amount to user
      const amounts = partnerAddress 
        ? ['500000000', '500000000'] // 500 tokens each
        : ['1000000000'] // 1000 tokens to user
        
      const allocations = YellowUtils.createAllocations(participants, amounts)

      // Create session message
      const sessionMessage = await createAppSessionMessage(
        this.sessionSigner,
        [{ definition: appDefinition, allocations }]
      )

      // Send to Yellow Network
      this.ws.send(sessionMessage)
      
      // Store session info
      this.session.participants = participants
      this.session.allowance = YELLOW_CONFIG.DEFAULT_ALLOWANCE

      console.log('✅ Payment session creation requested')
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Session creation timeout'))
        }, 30000)

        this.once('session_created', ({ sessionId }) => {
          clearTimeout(timeout)
          resolve(sessionId)
        })

        this.once('error', ({ error }) => {
          clearTimeout(timeout)
          reject(new Error(error))
        })
      })

    } catch (error) {
      throw new YellowNetworkError(
        'Failed to create session',
        'SESSION_CREATION_FAILED',
        error
      )
    }
  }

  /**
   * Authenticate with Yellow Network
   */
  private async authenticate(): Promise<void> {
    if (!this.ws || !this.userAddress || !this.sessionAccount) {
      throw new Error('Required components not initialized')
    }

    const authRequestMsg = await createAuthRequestMessage({
      address: this.userAddress,
      application: YELLOW_CONFIG.APP_NAME,
      session_key: this.sessionAccount.address,
      allowances: [{
        asset: 'ytest.usd',
        amount: YELLOW_CONFIG.DEFAULT_ALLOWANCE
      }],
      expires_at: BigInt(Math.floor(Date.now() / 1000) + YELLOW_CONFIG.SESSION_EXPIRE_TIME),
      scope: 'swiftpay.app'
    })

    this.ws.send(authRequestMsg)
  }

  /**
   * Send instant payment through state channel
   */
  async sendPayment(amount: string, recipient: string): Promise<void> {
    try {
      if (!this.session.isActive || !this.ws) {
        throw new Error('No active session')
      }

      if (!YellowUtils.isValidAddress(recipient)) {
        throw new Error('Invalid recipient address')
      }

      // Create payment data
      const paymentData = {
        type: 'payment',
        amount: YellowUtils.formatAmount(amount),
        recipient,
        timestamp: Date.now(),
        sessionId: this.session.sessionId
      }

      // Sign payment with session key
      const signature = await this.sessionSigner(JSON.stringify(paymentData))

      const signedPayment = {
        ...paymentData,
        signature,
        sender: this.userAddress
      }

      // Send through Yellow Network
      this.ws.send(JSON.stringify(signedPayment))
      
      console.log(`💸 Sent ${amount} tokens instantly to ${recipient}`)
      
      // Update local balance optimistically
      const currentBalance = parseFloat(this.session.balance)
      const paymentAmount = parseFloat(amount)
      this.session.balance = Math.max(0, currentBalance - paymentAmount).toString()
      
      this.emit('payment_sent', { amount, recipient })

    } catch (error) {
      throw new YellowNetworkError(
        'Failed to send payment',
        'PAYMENT_FAILED',
        error
      )
    }
  }

  /**
   * Get current session balance
   */
  async getBalance(): Promise<string> {
    return YellowUtils.parseAmount(this.session.balance)
  }

  /**
   * Close current session and settle on-chain
   */
  async closeSession(): Promise<void> {
    try {
      if (!this.session.isActive || !this.session.channelId || !this.ws) {
        throw new Error('No active session to close')
      }

      const closeMsg = await createCloseChannelMessage(
        this.sessionSigner,
        this.session.channelId,
        this.userAddress!
      )

      this.ws.send(closeMsg)
      
      // Reset session state
      this.session = {
        sessionId: null,
        channelId: null,
        isActive: false,
        balance: '0',
        allowance: '0',
        participants: []
      }

      this.emit('session_closed', {})
      console.log('✅ Session closed and settled on-chain')

    } catch (error) {
      throw new YellowNetworkError(
        'Failed to close session',
        'SESSION_CLOSE_FAILED',
        error
      )
    }
  }

  /**
   * Disconnect from Yellow Network
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.session = {
      sessionId: null,
      channelId: null,
      isActive: false,
      balance: '0',
      allowance: '0',
      participants: []
    }

    this.emit('disconnected', {})
  }

  /**
   * Check if connected to Yellow Network
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get current session info
   */
  getSession(): YellowSession {
    return { ...this.session }
  }

  /**
   * Event handling
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(callback)
  }

  /**
   * One-time event handling
   */
  once(event: string, callback: (data: any) => void): void {
    const onceWrapper = (data: any) => {
      callback(data)
      this.off(event, onceWrapper)
    }
    this.on(event, onceWrapper)
  }

  /**
   * Remove event handler
   */
  off(event: string, callback: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(callback)
      if (index !== -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to handlers
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in ${event} handler:`, error)
        }
      })
    }
  }
}

// Singleton instance for global use
let yellowClient: SwiftPayYellowClient | null = null

/**
 * Get or create Yellow Network client instance
 */
export function getYellowClient(useProduction: boolean = false): SwiftPayYellowClient {
  if (!yellowClient) {
    yellowClient = new SwiftPayYellowClient(undefined, useProduction)
  }
  return yellowClient
}

/**
 * Reset Yellow Network client (useful for testing)
 */
export function resetYellowClient(): void {
  if (yellowClient) {
    yellowClient.disconnect()
    yellowClient = null
  }
}

export { SwiftPayYellowClient }