# Phase 1: Arc Integration Setup Guide

## Overview
This guide walks you through deploying SwiftPayVault to Arc testnet and integrating Circle tools.

---

## Prerequisites

### 1. Circle Developer Account
- [ ] Sign up at: https://console.circle.com/signup
- [ ] Verify your email
- [ ] Complete account setup
- [ ] Get API key from dashboard

### 2. Arc Network Information
- [ ] Get Arc testnet RPC URL from: https://docs.arc.network/
- [ ] Get Arc testnet chain ID
- [ ] Get Arc testnet explorer URL
- [ ] Get Arc testnet faucet URL

### 3. Wallet Setup
- [ ] Create a new wallet for deployment (or use existing)
- [ ] Get testnet ETH/gas tokens from Arc faucet
- [ ] Save private key securely (NEVER commit to git!)

---

## Step-by-Step Setup

### Step 1: Update Arc Network Configuration

1. **Get Arc Network Details**
   - Visit: https://docs.arc.network/arc/concepts/welcome-to-arc
   - Find testnet RPC URL
   - Find testnet chain ID
   - Find testnet explorer URL

2. **Update `contracts/hardhat.config.ts`**
   ```typescript
   arcTestnet: {
       url: "https://rpc.arc.network", // Replace with actual RPC
       accounts: [PRIVATE_KEY],
       chainId: 1234, // Replace with actual chain ID
   }
   ```

3. **Update explorer URLs in etherscan config**
   ```typescript
   {
       network: "arcTestnet",
       chainId: 1234, // Replace with actual chain ID
       urls: {
           apiURL: "https://explorer.arc.network/api", // Replace
           browserURL: "https://explorer.arc.network" // Replace
       }
   }
   ```

### Step 2: Configure Environment Variables

1. **Copy the example file**
   ```bash
   cd contracts
   cp .env.example .env
   ```

2. **Edit `.env` file**
   ```bash
   # Add your deployer private key (KEEP SECRET!)
   DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
   
   # Add Arc testnet RPC URL
   ARC_TESTNET_RPC_URL=https://rpc.arc.network
   
   # Add Circle API key
   CIRCLE_API_KEY=your_circle_api_key_here
   
   # Add Arc explorer API key (if required)
   ARC_API_KEY=your_arc_api_key_here
   ```

3. **Verify `.env` is in `.gitignore`**
   ```bash
   # Check that .env is ignored
   cat ../.gitignore | grep .env
   ```

### Step 3: Get Testnet Funds

1. **Visit Arc Faucet**
   - Go to: https://faucet.circle.com/
   - Connect your wallet
   - Request testnet gas tokens
   - Wait for confirmation

2. **Verify Balance**
   ```bash
   # Check your wallet balance
   npx hardhat run scripts/check-balance.ts --network arcTestnet
   ```

### Step 4: Compile Contracts

1. **Install dependencies**
   ```bash
   cd contracts
   npm install
   ```

2. **Compile contracts**
   ```bash
   npm run compile
   ```

3. **Verify compilation**
   - Check for `artifacts/` directory
   - Check for `typechain-types/` directory
   - No compilation errors

### Step 5: Deploy to Arc Testnet

1. **Run deployment script**
   ```bash
   npm run deploy:arc
   ```

2. **Save deployment info**
   - Copy the contract address
   - Copy the transaction hash
   - Save to `.env` file:
     ```
     VAULT_ADDRESS_ARC_TESTNET=0xYOUR_DEPLOYED_ADDRESS
     ```

3. **Verify deployment**
   - Check contract on Arc explorer
   - Verify Hub address is set correctly
   - Verify Owner address is set correctly

### Step 6: Verify Contract on Arc Explorer

1. **Automatic verification (if supported)**
   ```bash
   npm run verify:arc -- 0xYOUR_DEPLOYED_ADDRESS "0xHUB_ADDRESS" "0xOWNER_ADDRESS"
   ```

2. **Manual verification (if automatic fails)**
   - Go to Arc explorer
   - Find your contract
   - Click "Verify Contract"
   - Upload source code
   - Enter constructor arguments

### Step 7: Test Contract Functions

1. **Create test script**
   ```bash
   # Create contracts/scripts/test-vault.ts
   ```

2. **Test basic functions**
   ```typescript
   // Test getting hub address
   const hub = await vault.hub();
   console.log("Hub:", hub);
   
   // Test getting owner
   const owner = await vault.owner();
   console.log("Owner:", owner);
   
   // Test merchant balance (should be 0)
   const balance = await vault.getBalance(merchantAddress, usdcAddress);
   console.log("Balance:", balance);
   ```

3. **Run tests**
   ```bash
   npx hardhat run scripts/test-vault.ts --network arcTestnet
   ```

---

## Circle Tools Integration

### Circle Gateway Setup

1. **Install Circle SDK**
   ```bash
   cd ..
   npm install @circle-fin/circle-sdk
   ```

2. **Create Circle client**
   ```typescript
   import { Circle } from '@circle-fin/circle-sdk';
   
   const circle = new Circle({
     apiKey: process.env.CIRCLE_API_KEY!,
     environment: 'sandbox' // or 'production'
   });
   ```

3. **Test USDC balance query**
   ```typescript
   const balance = await circle.wallets.getBalance({
     walletId: 'your-wallet-id',
     currency: 'USDC'
   });
   ```

### Circle Wallets Setup

1. **Enable Circle Wallets**
   - Go to Circle Console
   - Navigate to Wallets section
   - Enable Wallets API
   - Get Wallet API credentials

2. **Create merchant wallet**
   ```typescript
   const wallet = await circle.wallets.create({
     idempotencyKey: uuidv4(),
     description: 'Merchant Wallet'
   });
   ```

3. **Test wallet operations**
   ```typescript
   // Get wallet details
   const walletDetails = await circle.wallets.get(wallet.id);
   
   // Get wallet balance
   const balance = await circle.wallets.getBalance({
     walletId: wallet.id,
     currency: 'USDC'
   });
   ```

---

## Verification Checklist

### Contract Deployment
- [ ] SwiftPayVault deployed to Arc testnet
- [ ] Contract address saved to `.env`
- [ ] Contract verified on Arc explorer
- [ ] Hub address set correctly
- [ ] Owner address set correctly

### Circle Integration
- [ ] Circle Developer Account created
- [ ] API key obtained and saved
- [ ] Circle Gateway SDK installed
- [ ] Circle Wallets enabled
- [ ] Test USDC operations working

### Documentation
- [ ] Deployment transaction hash recorded
- [ ] Contract address documented
- [ ] Network configuration documented
- [ ] Circle credentials secured

### Testing
- [ ] Contract functions tested
- [ ] Hub can call receiveSettlement
- [ ] Merchants can withdraw
- [ ] Balance tracking works
- [ ] Events emitted correctly

---

## Troubleshooting

### Issue: Deployment fails with "insufficient funds"
**Solution:** Get more testnet gas tokens from Arc faucet

### Issue: Contract verification fails
**Solution:** 
1. Check compiler version matches (0.8.28)
2. Check optimization settings match
3. Try manual verification on explorer

### Issue: Circle API returns 401 Unauthorized
**Solution:**
1. Verify API key is correct
2. Check API key has correct permissions
3. Ensure using correct environment (sandbox vs production)

### Issue: Can't connect to Arc RPC
**Solution:**
1. Verify RPC URL is correct
2. Check network is not down
3. Try alternative RPC endpoint

### Issue: Transaction stuck/pending
**Solution:**
1. Check gas price is sufficient
2. Wait for network confirmation
3. Check transaction on explorer

---

## Next Steps

After completing Phase 1:

1. **Update frontend configuration**
   ```bash
   # Add to frontend/.env.local
   NEXT_PUBLIC_VAULT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
   NEXT_PUBLIC_VAULT_CHAIN_ID=1234
   NEXT_PUBLIC_ARC_RPC_URL=https://rpc.arc.network
   ```

2. **Create architecture diagram**
   - Show multi-chain payment flow
   - Highlight Arc as liquidity hub
   - Include Circle tools

3. **Document Circle integration**
   - How Gateway is used
   - How Wallets are used
   - USDC operations

4. **Prepare for Phase 2**
   - Install wagmi + viem
   - Set up wallet connection
   - Test MetaMask integration

---

## Resources

### Arc Resources
- Arc Docs: https://docs.arc.network/arc/concepts/welcome-to-arc
- Arc Quickstart: https://docs.arc.network/arc/tutorials/transfer-usdc-or-eurc
- Arc Faucet: https://faucet.circle.com/

### Circle Resources
- Circle Console: https://console.circle.com/
- Circle Gateway Docs: https://developers.circle.com/gateway
- Circle Wallets Docs: https://developers.circle.com/wallets

### Development Tools
- Hardhat Docs: https://hardhat.org/docs
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
- Ethers.js Docs: https://docs.ethers.org/

---

## Success Criteria

Phase 1 is complete when:

✅ SwiftPayVault deployed to Arc testnet  
✅ Contract verified on Arc explorer  
✅ Circle Developer Account set up  
✅ Circle Gateway integrated  
✅ Circle Wallets enabled  
✅ USDC operations tested  
✅ Documentation updated  
✅ Ready for Phase 2 (Wallet Integration)

---

## Estimated Time

- **Setup & Configuration:** 1-2 hours
- **Deployment & Verification:** 1 hour
- **Circle Integration:** 2-3 hours
- **Testing & Documentation:** 1-2 hours

**Total:** 5-8 hours
