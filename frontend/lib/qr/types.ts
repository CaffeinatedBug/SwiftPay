// QR Payment Types for SwiftPay
// Phase 4: QR Code Payment Flow

/**
 * Supported currencies for QR payments
 */
export type PaymentCurrency = 'USDC' | 'USDT' | 'ETH' | 'DAI';

/**
 * Supported blockchain networks
 */
export type PaymentChain = 
  | 'ethereum'
  | 'arbitrum'
  | 'base'
  | 'polygon'
  | 'optimism'
  | 'arc'
  | 'sepolia';

/**
 * Chain ID mapping
 */
export const CHAIN_IDS: Record<PaymentChain, number> = {
  ethereum: 1,
  arbitrum: 42161,
  base: 8453,
  polygon: 137,
  optimism: 10,
  arc: 1270, // Arc testnet
  sepolia: 11155111,
};

/**
 * QR Code payload structure for payment requests
 * This is what gets encoded into the QR code
 */
export interface QRPaymentPayload {
  /** Version for backward compatibility */
  version: 1;
  /** SwiftPay protocol identifier */
  protocol: 'swiftpay';
  /** Unique payment request ID */
  paymentId: string;
  /** Merchant's wallet address */
  merchantAddress: `0x${string}`;
  /** Merchant display name */
  merchantName: string;
  /** Payment amount in human-readable format (e.g., "10.50") */
  amount: string;
  /** Preferred currency (user can override) */
  currency: PaymentCurrency;
  /** Preferred chain (user can override) */
  preferredChain?: PaymentChain;
  /** Optional order/invoice reference */
  reference?: string;
  /** Optional memo/description */
  memo?: string;
  /** Timestamp when QR was generated */
  timestamp: number;
  /** Expiry timestamp (optional) */
  expiresAt?: number;
  /** Callback URL for payment notification (optional) */
  callbackUrl?: string;
}

/**
 * Parsed QR payment data with validation status
 */
export interface ParsedQRPayment {
  valid: boolean;
  payload?: QRPaymentPayload;
  error?: string;
}

/**
 * Payment confirmation state
 */
export type PaymentStatus = 
  | 'pending'      // Waiting for user action
  | 'confirming'   // User is reviewing payment
  | 'signing'      // Waiting for wallet signature
  | 'processing'   // Yellow Network processing
  | 'completed'    // Payment successful
  | 'failed'       // Payment failed
  | 'expired'      // QR code expired
  | 'cancelled';   // User cancelled

/**
 * Complete payment transaction record
 */
export interface QRPaymentTransaction {
  /** Unique transaction ID */
  id: string;
  /** Original QR payment payload */
  payload: QRPaymentPayload;
  /** User's wallet address */
  payerAddress: `0x${string}`;
  /** Selected chain for payment */
  selectedChain: PaymentChain;
  /** Selected token for payment */
  selectedToken: PaymentCurrency;
  /** Actual amount paid (after conversion if any) */
  amountPaid: string;
  /** Current payment status */
  status: PaymentStatus;
  /** Yellow Network channel ID (if applicable) */
  yellowChannelId?: string;
  /** Yellow Network state hash (if applicable) */
  yellowStateHash?: string;
  /** Signature from user's wallet */
  signature?: `0x${string}`;
  /** Transaction hash (if on-chain) */
  txHash?: `0x${string}`;
  /** Timestamp when payment was initiated */
  initiatedAt: number;
  /** Timestamp when payment was completed */
  completedAt?: number;
  /** Error message if failed */
  errorMessage?: string;
}

/**
 * QR Generator configuration
 */
export interface QRGeneratorConfig {
  /** QR code size in pixels */
  size: number;
  /** Error correction level */
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  /** Include logo in center */
  includeLogo: boolean;
  /** Logo URL */
  logoUrl?: string;
  /** Background color */
  backgroundColor: string;
  /** Foreground color */
  foregroundColor: string;
}

/**
 * QR Scanner configuration
 */
export interface QRScannerConfig {
  /** Camera facing mode */
  facingMode: 'environment' | 'user';
  /** Scan interval in milliseconds */
  scanInterval: number;
  /** Enable torch/flashlight */
  enableTorch: boolean;
  /** Show scan area overlay */
  showOverlay: boolean;
}

/**
 * Merchant notification payload
 */
export interface MerchantNotification {
  type: 'payment_received' | 'payment_pending' | 'payment_failed';
  paymentId: string;
  merchantAddress: `0x${string}`;
  amount: string;
  currency: PaymentCurrency;
  payerAddress: `0x${string}`;
  timestamp: number;
  status: PaymentStatus;
  reference?: string;
}

/**
 * WebSocket message types for real-time updates
 */
export type WSMessageType = 
  | 'subscribe'
  | 'unsubscribe'
  | 'payment_initiated'
  | 'payment_confirmed'
  | 'payment_completed'
  | 'payment_failed'
  | 'heartbeat';

export interface WSMessage {
  type: WSMessageType;
  payload: unknown;
  timestamp: number;
}

/**
 * Default QR generator configuration
 */
export const DEFAULT_QR_CONFIG: QRGeneratorConfig = {
  size: 256,
  errorCorrectionLevel: 'M',
  includeLogo: true,
  backgroundColor: '#ffffff',
  foregroundColor: '#000000',
};

/**
 * Default QR scanner configuration
 */
export const DEFAULT_SCANNER_CONFIG: QRScannerConfig = {
  facingMode: 'environment',
  scanInterval: 500,
  enableTorch: false,
  showOverlay: true,
};
