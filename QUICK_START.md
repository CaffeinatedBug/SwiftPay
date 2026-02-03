# SwiftPay - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide gets you up and running with Phase 1 as quickly as possible.

---

## Step 1: Circle Account (5 minutes)

1. Go to: https://console.circle.com/signup
2. Sign up with your email
3. Verify your email
4. Go to "API Keys" section
5. Click "Create API Key"
6. Copy and save the API key

**Save this for later:** `CIRCLE_API_KEY=your_key_here`

---

## Step 2: Arc Network Info (5 minutes)

1. Go to: https://docs.arc.network/
2. Find the testnet section
3. Copy these values:
   - RPC URL
   - Chain ID
   - Explorer URL
   - Faucet URL

**Example values to update:**
```
RPC URL: https://rpc.arc.network
Chain ID: 1234
Explorer: https://explorer.arc.network
Faucet: https://faucet.circle.com/
```

---

## Step 3: Get Testnet Funds (5 minutes)

1. Create a new wallet OR use existing
2. Go to Arc faucet: https://faucet.circle.com/
3. Connect your wallet
4. Request testnet tokens
5. Wait for confirmation (usually instant)

**Save your private key securely!**

---

## Step 4: Configure Environment (5 minutes)

1. **Copy environment file:**
   ```bash
   cd contracts
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```bash
   # Open in your editor
   code .env  # or nano .env
   ```

3. **Add these values:**
   ```env
   DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
   ARC_TESTNET_RPC_URL=https://rpc.testnet.arc.network
   CIRCLE_API_KEY=your_circle_api_key
   ```

4. **Save and close**

---

## Step 5: Update Hardhat Config (5 minutes)

1. **Open `contracts/hardhat.config.ts`**

2. **Find the `arcTestnet` section and update:**
   ```typescript
   arcTestnet: {
       url: "https://rpc.arc.network", // Your actual RPC URL
       accounts: [PRIVATE_KEY],
       chainId: 1234, // Your actual chain ID
   }
   ```

3. **Update the explorer URLs:**
   ```typescript
   {
       network: "arcTestnet",
       chainId: 1234, // Your actual chain ID
       urls: {
           apiURL: "https://explorer.arc.network/api",
           browserURL: "https://explorer.arc.network"
       }
   }
   ```

4. **Save the file**

---

## Step 6: Deploy Contract (5 minutes)

1. **Install dependencies:**
   ```bash
   cd contracts
   npm install
   ```

2. **Compile contracts:**
   ```bash
   npm run compile
   ```

3. **Check your balance:**
   ```bash
   npx hardhat run scripts/check-balance.ts --network arcTestnet
   ```

4. **Deploy to Arc:**
   ```bash
   npm run deploy:arc
   ```

5. **Save the contract address from output:**
   ```
   Contract Address: 0xABC...123
   ```

6. **Add to `.env`:**
   ```env
   VAULT_ADDRESS_ARC_TESTNET=0xABC...123
   ```

---

## Step 7: Verify Contract (5 minutes)

1. **Run verification:**
   ```bash
   npm run verify:arc -- 0xYOUR_CONTRACT_ADDRESS "0xHUB_ADDRESS" "0xOWNER_ADDRESS"
   ```

2. **If automatic verification fails, do manual:**
   - Go to Arc explorer
   - Find your contract
   - Click "Verify & Publish"
   - Upload source code
   - Enter constructor args

---

## Step 8: Test Contract (5 minutes)

1. **Run test script:**
   ```bash
   npx hardhat run scripts/test-vault.ts --network arcTestnet
   ```

2. **Verify all tests pass:**
   - ✅ Hub address correct
   - ✅ Owner address correct
   - ✅ Contract not paused
   - ✅ Balance queries work

---

## Step 9: Update Frontend Config (5 minutes)

1. **Create frontend environment file:**
   ```bash
   cd ../frontend
   cp .env.example .env.local
   ```

2. **Add contract info:**
   ```env
   NEXT_PUBLIC_VAULT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
   NEXT_PUBLIC_VAULT_CHAIN_ID=1234
   NEXT_PUBLIC_ARC_RPC_URL=https://rpc.arc.network
   NEXT_PUBLIC_CIRCLE_API_KEY=your_circle_api_key
   ```

3. **Save the file**

---

## Step 10: Commit Your Work (5 minutes)

1. **Check what changed:**
   ```bash
   cd ..
   git status
   ```

2. **Stage changes:**
   ```bash
   git add .
   ```

3. **Commit:**
   ```bash
   git commit -m "Phase 1: Deploy SwiftPayVault to Arc testnet"
   ```

4. **Push to GitHub:**
   ```bash
   git push origin main
   ```

---

## ✅ Phase 1 Complete!

You've successfully:
- ✅ Set up Circle Developer Account
- ✅ Configured Arc testnet
- ✅ Deployed SwiftPayVault to Arc
- ✅ Verified the contract
- ✅ Tested basic functions
- ✅ Configured frontend

---

## 🎯 What's Next?

### Phase 2: Wallet Integration
- Install wagmi + viem
- Connect MetaMask
- Fetch real token balances
- Multi-chain support

### Start Phase 2:
```bash
cd frontend
npm install wagmi viem @tanstack/react-query
```

---

## 📚 Reference

### Important Files
- `contracts/.env` - Your secrets (NEVER commit!)
- `contracts/hardhat.config.ts` - Network configuration
- `contracts/src/SwiftPayVault.sol` - Smart contract
- `frontend/.env.local` - Frontend config (NEVER commit!)

### Important Commands
```bash
# Contracts
cd contracts
npm run compile          # Compile contracts
npm run deploy:arc       # Deploy to Arc
npm run verify:arc       # Verify contract
npx hardhat run scripts/test-vault.ts --network arcTestnet

# Frontend
cd frontend
npm run dev              # Start dev server
npm run build            # Build for production
```

### Important Links
- Circle Console: https://console.circle.com/
- Arc Docs: https://docs.arc.network/
- Arc Faucet: https://faucet.circle.com/
- GitHub Repo: [Your repo URL]

---

## 🆘 Need Help?

### Common Issues

**Issue: "insufficient funds"**
- Get more tokens from Arc faucet
- Check wallet balance

**Issue: "network not found"**
- Verify RPC URL is correct
- Check chain ID matches

**Issue: "verification failed"**
- Try manual verification on explorer
- Check compiler version (0.8.28)

**Issue: "Circle API 401"**
- Verify API key is correct
- Check API key permissions

### Get Support
- Check `PHASE_1_SETUP.md` for detailed guide
- Check `PHASE_1_CHECKLIST.md` for complete checklist
- Review `ARC_INTEGRATION_GUIDE.md` for Arc details

---

## 🎉 Congratulations!

You've completed Phase 1 in under an hour! Your SwiftPay vault is now live on Arc testnet and ready for integration.

**Next:** Start Phase 2 to add wallet connectivity and enable users to connect their MetaMask wallets.

---

**Total Time:** ~50 minutes  
**Difficulty:** Easy  
**Status:** Phase 1 Complete ✅
