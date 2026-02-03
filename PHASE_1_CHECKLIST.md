# Phase 1: Arc Integration - Checklist

## Pre-Deployment Setup

### Circle Account Setup
- [ ] Sign up at https://console.circle.com/signup
- [ ] Verify email address
- [ ] Complete account profile
- [ ] Navigate to API Keys section
- [ ] Generate new API key
- [ ] Save API key securely
- [ ] Enable Circle Gateway
- [ ] Enable Circle Wallets
- [ ] Review Circle documentation

### Arc Network Research
- [ ] Visit https://docs.arc.network/
- [ ] Find Arc testnet RPC URL
- [ ] Find Arc testnet chain ID
- [ ] Find Arc testnet explorer URL
- [ ] Find Arc testnet faucet URL
- [ ] Bookmark Arc documentation
- [ ] Join Arc community (Discord/Telegram)

### Wallet Preparation
- [ ] Create new wallet OR use existing
- [ ] Save private key securely (encrypted)
- [ ] Add wallet to MetaMask
- [ ] Add Arc testnet to MetaMask
- [ ] Visit Arc faucet
- [ ] Request testnet gas tokens
- [ ] Verify tokens received
- [ ] Check wallet balance

### Environment Configuration
- [ ] Copy `contracts/.env.example` to `contracts/.env`
- [ ] Add `DEPLOYER_PRIVATE_KEY` to `.env`
- [ ] Add `ARC_TESTNET_RPC_URL` to `.env`
- [ ] Add `CIRCLE_API_KEY` to `.env`
- [ ] Add `ARC_API_KEY` to `.env` (if needed)
- [ ] Verify `.env` is in `.gitignore`
- [ ] Test environment variables load correctly

---

## Contract Configuration

### Hardhat Config Updates
- [ ] Update `ARC_TESTNET_RPC_URL` with actual URL
- [ ] Update Arc testnet `chainId` with actual ID
- [ ] Update Arc explorer `apiURL`
- [ ] Update Arc explorer `browserURL`
- [ ] Verify all network configs are correct
- [ ] Test Hardhat can connect to Arc

### Contract Review
- [ ] Review `SwiftPayVault.sol` code
- [ ] Understand `receiveSettlement` function
- [ ] Understand `receiveDirectSettlement` function
- [ ] Understand `withdraw` functions
- [ ] Review security features (ReentrancyGuard, Pausable)
- [ ] Review events emitted
- [ ] Understand Hub role
- [ ] Understand Owner role

---

## Deployment Process

### Pre-Deployment Checks
- [ ] Install dependencies: `npm install`
- [ ] Compile contracts: `npm run compile`
- [ ] Verify compilation successful
- [ ] Check `artifacts/` directory created
- [ ] Check `typechain-types/` directory created
- [ ] Run balance check: `npx hardhat run scripts/check-balance.ts --network arcTestnet`
- [ ] Verify sufficient gas balance

### Deployment Execution
- [ ] Run deployment: `npm run deploy:arc`
- [ ] Wait for deployment confirmation
- [ ] Copy deployed contract address
- [ ] Copy deployment transaction hash
- [ ] Save to `VAULT_ADDRESS_ARC_TESTNET` in `.env`
- [ ] Verify deployment on Arc explorer
- [ ] Check Hub address is correct
- [ ] Check Owner address is correct

### Post-Deployment Verification
- [ ] Run test script: `npx hardhat run scripts/test-vault.ts --network arcTestnet`
- [ ] Verify Hub address matches
- [ ] Verify Owner address matches
- [ ] Verify contract is not paused
- [ ] Verify merchant balances are 0
- [ ] Verify settlement tracking works
- [ ] Check all tests pass

---

## Contract Verification

### Automatic Verification
- [ ] Run: `npm run verify:arc -- <CONTRACT_ADDRESS> "<HUB_ADDRESS>" "<OWNER_ADDRESS>"`
- [ ] Wait for verification
- [ ] Check verification status
- [ ] View verified contract on explorer

### Manual Verification (if automatic fails)
- [ ] Go to Arc explorer
- [ ] Find deployed contract
- [ ] Click "Verify & Publish"
- [ ] Select compiler version: 0.8.28
- [ ] Select optimization: Yes (200 runs)
- [ ] Enable viaIR: Yes
- [ ] Upload contract source
- [ ] Enter constructor arguments
- [ ] Submit verification
- [ ] Wait for confirmation

---

## Circle Integration

### Circle Gateway Setup
- [ ] Install Circle SDK: `npm install @circle-fin/circle-sdk`
- [ ] Create Circle client in code
- [ ] Test API connection
- [ ] Test USDC balance query
- [ ] Test transaction verification
- [ ] Document Gateway integration
- [ ] Create helper functions

### Circle Wallets Setup
- [ ] Enable Wallets in Circle Console
- [ ] Get Wallet API credentials
- [ ] Test wallet creation
- [ ] Test wallet balance query
- [ ] Test wallet operations
- [ ] Document Wallets integration
- [ ] Create merchant wallet helper

### USDC Configuration
- [ ] Find USDC contract address on Arc
- [ ] Add to `.env` as `USDC_ARC_TESTNET`
- [ ] Get testnet USDC from faucet
- [ ] Test USDC transfer
- [ ] Test USDC balance query
- [ ] Whitelist USDC in vault (if needed)

---

## Testing & Validation

### Contract Function Tests
- [ ] Test `hub()` getter
- [ ] Test `owner()` getter
- [ ] Test `paused()` getter
- [ ] Test `getBalance()` function
- [ ] Test `isSettlementProcessed()` function
- [ ] Test `whitelistedTokens()` mapping
- [ ] Test `totalDeposits()` mapping

### Integration Tests
- [ ] Test Hub can call `receiveSettlement`
- [ ] Test Hub can call `receiveDirectSettlement`
- [ ] Test merchant can call `withdraw`
- [ ] Test merchant can call `withdrawAll`
- [ ] Test owner can call `setHub`
- [ ] Test owner can call `pause`/`unpause`
- [ ] Test events are emitted correctly

### Security Tests
- [ ] Test non-Hub cannot call `receiveSettlement`
- [ ] Test non-owner cannot call admin functions
- [ ] Test reentrancy protection works
- [ ] Test pause functionality works
- [ ] Test zero address checks work
- [ ] Test zero amount checks work

---

## Documentation

### Technical Documentation
- [ ] Document deployed contract address
- [ ] Document deployment transaction hash
- [ ] Document Hub address
- [ ] Document Owner address
- [ ] Document Arc network details
- [ ] Document USDC token address
- [ ] Create ABI documentation

### Integration Documentation
- [ ] Document Circle Gateway usage
- [ ] Document Circle Wallets usage
- [ ] Document USDC operations
- [ ] Create code examples
- [ ] Create API reference
- [ ] Document error handling

### Architecture Documentation
- [ ] Create architecture diagram
- [ ] Show multi-chain flow
- [ ] Highlight Arc as liquidity hub
- [ ] Show Circle tools integration
- [ ] Document data flow
- [ ] Document security model

---

## Frontend Configuration

### Environment Variables
- [ ] Create `frontend/.env.local`
- [ ] Add `NEXT_PUBLIC_VAULT_ADDRESS`
- [ ] Add `NEXT_PUBLIC_VAULT_CHAIN_ID`
- [ ] Add `NEXT_PUBLIC_ARC_RPC_URL`
- [ ] Add `NEXT_PUBLIC_USDC_ARC_ADDRESS`
- [ ] Add `NEXT_PUBLIC_CIRCLE_API_KEY`
- [ ] Verify variables load correctly

### Contract ABI
- [ ] Copy ABI from `artifacts/`
- [ ] Create `frontend/contracts/SwiftPayVault.json`
- [ ] Include contract address
- [ ] Include ABI
- [ ] Test ABI import in frontend

---

## Bounty Preparation

### Arc Bounty Requirements
- [ ] Functional MVP (frontend + backend)
- [ ] Architecture diagram created
- [ ] Product feedback document written
- [ ] Video demonstration recorded
- [ ] GitHub repo with documentation
- [ ] All Circle tools integrated
- [ ] Multi-chain support demonstrated

### Evidence Collection
- [ ] Screenshot of deployed contract
- [ ] Screenshot of verified contract
- [ ] Screenshot of Circle Console
- [ ] Screenshot of successful transactions
- [ ] Export transaction hashes
- [ ] Export contract addresses
- [ ] Create demo video script

---

## Phase 1 Completion Criteria

### Must Have ✅
- [x] SwiftPayVault deployed to Arc testnet
- [ ] Contract verified on Arc explorer
- [ ] Circle Developer Account created
- [ ] Circle Gateway integrated
- [ ] Circle Wallets enabled
- [ ] USDC operations tested
- [ ] Basic tests passing
- [ ] Documentation updated

### Should Have 📝
- [ ] Architecture diagram created
- [ ] Integration tests written
- [ ] Helper scripts created
- [ ] Error handling implemented
- [ ] Monitoring setup
- [ ] Product feedback drafted

### Nice to Have 🎁
- [ ] Advanced tests written
- [ ] Performance benchmarks
- [ ] Gas optimization analysis
- [ ] Security audit checklist
- [ ] Video demo recorded

---

## Next Phase Preparation

### Phase 2 Preview (Wallet Integration)
- [ ] Review wagmi documentation
- [ ] Review viem documentation
- [ ] Plan wallet connection flow
- [ ] Plan multi-chain support
- [ ] Plan token selector UI
- [ ] Prepare for MetaMask integration

### Blockers & Risks
- [ ] List any blockers encountered
- [ ] Document workarounds used
- [ ] Note any Arc-specific issues
- [ ] Note any Circle-specific issues
- [ ] Plan mitigation strategies

---

## Time Tracking

| Task | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| Circle Account Setup | 30 min | | |
| Arc Network Research | 1 hour | | |
| Wallet Preparation | 30 min | | |
| Environment Config | 30 min | | |
| Contract Review | 1 hour | | |
| Deployment | 1 hour | | |
| Verification | 30 min | | |
| Circle Integration | 2 hours | | |
| Testing | 2 hours | | |
| Documentation | 1 hour | | |
| **Total** | **~10 hours** | | |

---

## Notes & Observations

### What Went Well
- 

### Challenges Faced
- 

### Lessons Learned
- 

### Improvements for Next Phase
- 

---

## Sign-Off

Phase 1 is complete when all "Must Have" items are checked and the contract is successfully deployed and verified on Arc testnet with Circle tools integrated.

**Completed by:** _______________  
**Date:** _______________  
**Contract Address:** _______________  
**Transaction Hash:** _______________
