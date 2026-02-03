# Deploy SwiftPayVault to Arc Testnet - Action Required

## ✅ Configuration Complete!

I've updated your Hardhat config with the correct Arc testnet details:
- **Chain ID:** 5042002
- **RPC URL:** https://rpc.testnet.arc.network
- **Explorer:** https://testnet.arcscan.app
- **Faucet:** https://faucet.circle.com

---

## 🚨 Action Required: Deploy the Contract

Please follow these steps in your terminal:

### Step 1: Get Testnet Funds (if you haven't already)

1. Go to: https://faucet.circle.com
2. Connect your wallet: `0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac`
3. Request testnet USDC (this will also give you gas tokens)
4. Wait for confirmation

### Step 2: Check Your Balance

Open a terminal in the `contracts` folder and run:

```bash
npx hardhat run scripts/check-balance.ts --network arcTestnet
```

**Expected output:**
```
Checking wallet balance...

Wallet address: 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac
Balance: X.XXX ETH
Network: arcTestnet
Chain ID: 5042002

✅ Balance is sufficient for deployment.
```

If balance is 0, go back to Step 1.

### Step 3: Compile Contracts

```bash
npm run compile
```

**Expected output:**
```
Compiled 1 Solidity file successfully
```

### Step 4: Deploy to Arc Testnet

```bash
npm run deploy:arc
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ⚡ SwiftPay Vault Deployment ⚡                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Deployer address: 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac
Deployer balance: X.XXX ETH
Network: arcTestnet (Chain ID: 5042002)

Configuration:
  Hub Address: 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac
  Owner Address: 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac

Deploying SwiftPayVault...

✅ SwiftPayVault deployed successfully!
   Contract Address: 0xABC...123

Verifying deployment...
  Hub (from contract): 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac
  Owner (from contract): 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac

═══════════════════════════════════════════════════════════
Add to frontend/.env.local:

NEXT_PUBLIC_VAULT_ADDRESS=0xABC...123
NEXT_PUBLIC_VAULT_CHAIN_ID=5042002
═══════════════════════════════════════════════════════════
```

### Step 5: Save the Contract Address

**IMPORTANT:** Copy the contract address from the output and:

1. Add it to `contracts/.env`:
   ```
   VAULT_ADDRESS_ARC_TESTNET=0xYOUR_CONTRACT_ADDRESS
   ```

2. Create `frontend/.env.local` and add:
   ```
   NEXT_PUBLIC_VAULT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
   NEXT_PUBLIC_VAULT_CHAIN_ID=5042002
   NEXT_PUBLIC_ARC_RPC_URL=https://rpc.testnet.arc.network
   NEXT_PUBLIC_CIRCLE_API_KEY=e4438d566ec6899e7a88d2f2cf2c1904:7c464d57f62638a8d854b55abacc5b16
   ```

### Step 6: Verify Contract (Optional but Recommended)

```bash
npm run verify:arc -- 0xYOUR_CONTRACT_ADDRESS "0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac" "0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac"
```

Replace `0xYOUR_CONTRACT_ADDRESS` with the actual deployed address.

### Step 7: Test the Deployed Contract

```bash
npx hardhat run scripts/test-vault.ts --network arcTestnet
```

**Expected output:**
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🧪 SwiftPay Vault Testing 🧪                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Vault Address: 0xYOUR_CONTRACT_ADDRESS

Network: arcTestnet (Chain ID: 5042002)

Test 1: Get Hub Address
  ✅ Hub: 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac

Test 2: Get Owner Address
  ✅ Owner: 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac

Test 3: Check Paused Status
  ✅ Paused: false

Test 4: Check Merchant Balance
  ✅ Merchant: 0x27B0DCCfc82B98FA069Af2CC7bC3810594eB1dac
  ✅ Token: 0x0000000000000000000000000000000000000000
  ✅ Balance: 0

Test 5: Check Settlement Status
  ✅ Settlement ID: 0x...
  ✅ Processed: false

═══════════════════════════════════════════════════════════
Testing complete!
═══════════════════════════════════════════════════════════
```

---

## 📋 After Deployment Checklist

Once deployment is successful, please provide me with:

- [ ] Deployed contract address
- [ ] Deployment transaction hash
- [ ] Did verification succeed? (yes/no)
- [ ] Did all tests pass? (yes/no)

Then I can continue with the next steps!

---

## 🆘 Troubleshooting

### Error: "insufficient funds"
- Go to https://faucet.circle.com and request more tokens
- Make sure you're using the correct wallet address

### Error: "network not found"
- The Hardhat config has been updated, try again
- Make sure you're in the `contracts` folder

### Error: "cannot find module"
- Run `npm install` first
- Then try the command again

### Error: "nonce too low"
- Wait a few seconds and try again
- Or reset your MetaMask account

---

## 📞 Let Me Know

Once you've completed these steps, please share:

1. The deployed contract address
2. Any errors you encountered
3. Whether verification succeeded

Then I'll continue with Phase 1 completion tasks!
