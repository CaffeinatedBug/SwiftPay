// Test deployed SwiftPayVault contract
import { ethers } from "hardhat";

async function main() {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║                                                           ║");
    console.log("║   🧪 SwiftPay Vault Testing 🧪                            ║");
    console.log("║                                                           ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log("");

    // Get vault address from environment or command line
    const vaultAddress = process.env.VAULT_ADDRESS_ARC_TESTNET || process.argv[2];
    
    if (!vaultAddress) {
        console.error("❌ Error: Vault address not provided");
        console.log("Usage: npx hardhat run scripts/test-vault.ts --network arcTestnet");
        console.log("Or set VAULT_ADDRESS_ARC_TESTNET in .env");
        process.exit(1);
    }

    console.log("Vault Address:", vaultAddress);
    console.log("");

    // Get contract instance
    const vault = await ethers.getContractAt("SwiftPayVault", vaultAddress);

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "(Chain ID:", network.chainId.toString(), ")");
    console.log("");

    // Test 1: Get Hub address
    console.log("Test 1: Get Hub Address");
    try {
        const hub = await vault.hub();
        console.log("  ✅ Hub:", hub);
    } catch (error) {
        console.log("  ❌ Failed:", error);
    }
    console.log("");

    // Test 2: Get Owner address
    console.log("Test 2: Get Owner Address");
    try {
        const owner = await vault.owner();
        console.log("  ✅ Owner:", owner);
    } catch (error) {
        console.log("  ❌ Failed:", error);
    }
    console.log("");

    // Test 3: Check if contract is paused
    console.log("Test 3: Check Paused Status");
    try {
        const paused = await vault.paused();
        console.log("  ✅ Paused:", paused);
    } catch (error) {
        console.log("  ❌ Failed:", error);
    }
    console.log("");

    // Test 4: Check merchant balance (should be 0)
    console.log("Test 4: Check Merchant Balance");
    try {
        const [signer] = await ethers.getSigners();
        const testMerchant = signer.address;
        const testToken = ethers.ZeroAddress; // Use zero address for test
        
        const balance = await vault.getBalance(testMerchant, testToken);
        console.log("  ✅ Merchant:", testMerchant);
        console.log("  ✅ Token:", testToken);
        console.log("  ✅ Balance:", balance.toString());
    } catch (error) {
        console.log("  ❌ Failed:", error);
    }
    console.log("");

    // Test 5: Check settlement processed status
    console.log("Test 5: Check Settlement Status");
    try {
        const testSettlementId = ethers.id("test-settlement-1");
        const processed = await vault.isSettlementProcessed(testSettlementId);
        console.log("  ✅ Settlement ID:", testSettlementId);
        console.log("  ✅ Processed:", processed);
    } catch (error) {
        console.log("  ❌ Failed:", error);
    }
    console.log("");

    // Summary
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Testing complete!");
    console.log("═══════════════════════════════════════════════════════════");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Testing failed:", error);
        process.exit(1);
    });
