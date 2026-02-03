// QR Payment Utilities for SwiftPay
// Phase 4: QR Code Payment Flow

import QRCode from 'qrcode';
import {
  QRPaymentPayload,
  ParsedQRPayment,
  QRGeneratorConfig,
  DEFAULT_QR_CONFIG,
  PaymentCurrency,
  PaymentChain,
} from './types';

/**
 * Generate a unique payment ID
 */
export function generatePaymentId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `SP-${timestamp}-${random}`.toUpperCase();
}

/**
 * Create a QR payment payload
 */
export function createPaymentPayload(
  merchantAddress: `0x${string}`,
  merchantName: string,
  amount: string,
  currency: PaymentCurrency = 'USDC',
  options: {
    preferredChain?: PaymentChain;
    reference?: string;
    memo?: string;
    expiresIn?: number; // milliseconds
    callbackUrl?: string;
  } = {}
): QRPaymentPayload {
  const now = Date.now();
  
  return {
    version: 1,
    protocol: 'swiftpay',
    paymentId: generatePaymentId(),
    merchantAddress,
    merchantName,
    amount,
    currency,
    preferredChain: options.preferredChain,
    reference: options.reference,
    memo: options.memo,
    timestamp: now,
    expiresAt: options.expiresIn ? now + options.expiresIn : undefined,
    callbackUrl: options.callbackUrl,
  };
}

/**
 * Encode payment payload to string for QR code
 */
export function encodePayload(payload: QRPaymentPayload): string {
  // Use base64url encoding for compact representation
  const json = JSON.stringify(payload);
  const base64 = btoa(json);
  return `swiftpay://${base64}`;
}

/**
 * Decode payment payload from QR code string
 */
export function decodePayload(data: string): ParsedQRPayment {
  try {
    // Check for SwiftPay protocol
    if (!data.startsWith('swiftpay://')) {
      return {
        valid: false,
        error: 'Invalid QR code: Not a SwiftPay payment request',
      };
    }

    // Extract base64 data
    const base64 = data.replace('swiftpay://', '');
    const json = atob(base64);
    const payload = JSON.parse(json) as QRPaymentPayload;

    // Validate required fields
    if (!payload.version || payload.protocol !== 'swiftpay') {
      return {
        valid: false,
        error: 'Invalid QR code: Missing protocol information',
      };
    }

    if (!payload.paymentId || !payload.merchantAddress || !payload.amount) {
      return {
        valid: false,
        error: 'Invalid QR code: Missing required payment fields',
      };
    }

    // Check expiry
    if (payload.expiresAt && payload.expiresAt < Date.now()) {
      return {
        valid: false,
        error: 'QR code has expired',
        payload,
      };
    }

    // Validate merchant address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(payload.merchantAddress)) {
      return {
        valid: false,
        error: 'Invalid merchant address format',
      };
    }

    // Validate amount
    const amount = parseFloat(payload.amount);
    if (isNaN(amount) || amount <= 0) {
      return {
        valid: false,
        error: 'Invalid payment amount',
      };
    }

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to decode QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCodeDataURL(
  payload: QRPaymentPayload,
  config: Partial<QRGeneratorConfig> = {}
): Promise<string> {
  const fullConfig = { ...DEFAULT_QR_CONFIG, ...config };
  const encodedData = encodePayload(payload);

  const options: QRCode.QRCodeToDataURLOptions = {
    width: fullConfig.size,
    errorCorrectionLevel: fullConfig.errorCorrectionLevel,
    color: {
      dark: fullConfig.foregroundColor,
      light: fullConfig.backgroundColor,
    },
    margin: 2,
  };

  return QRCode.toDataURL(encodedData, options);
}

/**
 * Generate QR code as canvas element
 */
export async function generateQRCodeCanvas(
  payload: QRPaymentPayload,
  canvas: HTMLCanvasElement,
  config: Partial<QRGeneratorConfig> = {}
): Promise<void> {
  const fullConfig = { ...DEFAULT_QR_CONFIG, ...config };
  const encodedData = encodePayload(payload);

  const options: QRCode.QRCodeToDataURLOptions = {
    width: fullConfig.size,
    errorCorrectionLevel: fullConfig.errorCorrectionLevel,
    color: {
      dark: fullConfig.foregroundColor,
      light: fullConfig.backgroundColor,
    },
    margin: 2,
  };

  await QRCode.toCanvas(canvas, encodedData, options);
}

/**
 * Format amount for display
 */
export function formatPaymentAmount(amount: string, currency: PaymentCurrency): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `0 ${currency}`;
  
  return `${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  })} ${currency}`;
}

/**
 * Get chain display name
 */
export function getChainDisplayName(chain: PaymentChain): string {
  const names: Record<PaymentChain, string> = {
    ethereum: 'Ethereum',
    arbitrum: 'Arbitrum',
    base: 'Base',
    polygon: 'Polygon',
    optimism: 'Optimism',
    arc: 'Arc',
    sepolia: 'Sepolia',
  };
  return names[chain] || chain;
}

/**
 * Get chain color for UI
 */
export function getChainColor(chain: PaymentChain): string {
  const colors: Record<PaymentChain, string> = {
    ethereum: '#627EEA',
    arbitrum: '#28A0F0',
    base: '#0052FF',
    polygon: '#8247E5',
    optimism: '#FF0420',
    arc: '#00D4AA',
    sepolia: '#CFB991',
  };
  return colors[chain] || '#888888';
}

/**
 * Get currency icon/symbol
 */
export function getCurrencySymbol(currency: PaymentCurrency): string {
  const symbols: Record<PaymentCurrency, string> = {
    USDC: '$',
    USDT: '$',
    ETH: 'Ξ',
    DAI: '$',
  };
  return symbols[currency] || '$';
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address: string): address is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Calculate time remaining until expiry
 */
export function getTimeRemaining(expiresAt: number): {
  expired: boolean;
  minutes: number;
  seconds: number;
  display: string;
} {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) {
    return { expired: true, minutes: 0, seconds: 0, display: 'Expired' };
  }

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return {
    expired: false,
    minutes,
    seconds,
    display: `${minutes}:${seconds.toString().padStart(2, '0')}`,
  };
}

/**
 * Create a payment signature message for Yellow Network
 */
export function createPaymentMessage(
  paymentId: string,
  merchantAddress: string,
  amount: string,
  currency: PaymentCurrency,
  timestamp: number
): string {
  return [
    'SwiftPay Payment Authorization',
    '',
    `Payment ID: ${paymentId}`,
    `To: ${merchantAddress}`,
    `Amount: ${amount} ${currency}`,
    `Timestamp: ${new Date(timestamp).toISOString()}`,
    '',
    'By signing this message, you authorize this payment through SwiftPay.',
  ].join('\n');
}
