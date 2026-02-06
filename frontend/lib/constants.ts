export const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:3001';
export const HUB_WS_URL = process.env.NEXT_PUBLIC_HUB_WS_URL || 'ws://localhost:8080';

export const ARC_TESTNET_CHAIN_ID = 5042002;
export const ARC_VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS || '0x';
export const ARC_USDC_ADDRESS = process.env.NEXT_PUBLIC_ARC_USDC_ADDRESS || '0x';

export const SUPPORTED_CHAINS = {
  84532: 'Base Sepolia',
  421614: 'Arbitrum Sepolia',
  80002: 'Polygon Amoy',
  5042002: 'Arc Testnet',
} as const;

export const SWIFTPAY_ENS_NAMESPACE = 'swiftpay';

export const ENS_TEXT_KEYS = {
  SETTLEMENT_SCHEDULE: 'swiftpay.settlement.schedule',
  SETTLEMENT_TIME: 'swiftpay.settlement.time',
  SETTLEMENT_CHAIN: 'swiftpay.settlement.chain',
  SETTLEMENT_TOKEN: 'swiftpay.settlement.token',
  PAYMENT_MINIMUM: 'swiftpay.payment.minimum',
  PAYMENT_CURRENCY: 'swiftpay.payment.currency',
  BUSINESS_CATEGORY: 'swiftpay.business.category',
  BUSINESS_LOCATION: 'swiftpay.business.location',
  STATS_TOTAL_PAYMENTS: 'swiftpay.stats.total_payments',
  STATS_TOTAL_VOLUME: 'swiftpay.stats.total_volume',
  STATS_LAST_SETTLEMENT: 'swiftpay.stats.last_settlement',
} as const;
