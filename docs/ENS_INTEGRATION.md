# ENS Integration Guide

## Custom Text Record Schema

All SwiftPay merchant data is stored in ENS text records under the `swiftpay.*` namespace:

| Key | Example Value | Description |
|-----|---------------|-------------|
| `swiftpay.settlement.schedule` | `daily` | instant, daily, weekly |
| `swiftpay.settlement.time` | `18:00:00 UTC` | Preferred settlement time |
| `swiftpay.settlement.chain` | `arc-testnet` | Settlement destination |
| `swiftpay.settlement.token` | `USDC` | Settlement token |
| `swiftpay.payment.minimum` | `0.50` | Minimum payment amount |
| `swiftpay.business.category` | `food-beverage` | Business type |
| `swiftpay.business.location` | `San Francisco` | Location |
| `swiftpay.stats.total_payments` | `142` | Auto-updated counter |
| `swiftpay.stats.total_volume` | `7843.50` | Auto-updated volume |

## wagmi Hooks Used

- `useEnsName` - Reverse resolution (address → name)
- `useEnsAvatar` - Avatar resolution
- `useEnsAddress` - Forward resolution (name → address)
- Custom `getEnsText` calls via viem for text records

## Why Not Just RainbowKit?

RainbowKit provides basic ENS display (name + avatar in connect button). SwiftPay uses ENS as a **core product feature**:
- Custom text records for payment preferences
- Settlement automation driven by ENS data
- Merchant discovery via ENS profiles
- Portable identity across applications
