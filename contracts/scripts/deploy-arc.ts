// SwiftPay Vault Deployment Script for Arc Testnet
// Deploys SwiftPayVault to Arc Testnet with proper configuration

import { ethers } from "hardhat";

async function main() {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║                                                           ║");
    console.log("║   ⚡ SwiftPay Vault - Arc Testnet Deployment ⚡           ║");
    console.log("║                                                           ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log("");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "ARC");

    if (balance === 0n) {
        console.error("❌ Deployer has no ARC! Get testnet ARC from Arc faucet.");
        console.error("   Faucet: https://faucet.testnet.arc.network");
        process.exit(1);
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network: Arc Testnet (Chain ID:", network.chainId.toString(), ")");
    console.log("");

    // Configuration
    // Hub address - this is the backend hub that will submit settlements
    const HUB_ADDRESS = process.env.HUB_ADDRESS || deployer.address;
    const OWNER_ADDRESS = deployer.address;

    console.log("Configuration:");
    console.log("  Hub Address (Settlement Submitter):", HUB_ADDRESS);
    console.log("  Owner Address (Admin):", OWNER_ADDRESS);
    console.log("");

    // Deploy SwiftPayVault
    console.log("Deploying SwiftPayVault to Arc Testnet...");
    
    const SwiftPayVault = await ethers.getContractFactory("SwiftPayVault");
    const vault = await SwiftPayVault.deploy(HUB_ADDRESS, OWNER_ADDRESS);
    
    console.log("⏳ Waiting for deployment confirmation...");
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    console.log("");
    console.log("✅ SwiftPayVault deployed successfully!");
    console.log("   Contract Address:", vaultAddress);
    console.log("   Explorer:", `https://testnet-explorer.arc.network/address/${vaultAddress}`);
    console.log("");

    // Verify deployment
    console.log("Verifying deployment...");
    const hubFromContract = await vault.hub();
    const ownerFromContract = await vault.owner();
    
    console.log("  Hub (from contract):", hubFromContract);
    console.log("  Owner (from contract):", ownerFromContract);
    console.log("");

    // Output for backend configuration
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Add to backend/.env:");
    console.log("");
    console.log(`VAULT_ADDRESS=${vaultAddress}`);
    console.log(`ARC_USDC_ADDRESS=<USDC_ADDRESS_ON_ARC>`);
    console.log(`ARC_RPC_URL=https://rpc.testnet.arc.network`);
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    // Output for frontend configuration
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Add to frontend/.env.local:");
    console.log("");
    console.log(`NEXT_PUBLIC_VAULT_ADDRESS=${vaultAddress}`);
    console.log(`NEXT_PUBLIC_VAULT_CHAIN_ID=5042002`);
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    // Next steps
    console.log("📋 Next Steps:");
    console.log("");
    console.log("1. Get USDC address on Arc Testnet");
    console.log("   - Check Arc documentation for testnet USDC");
    console.log("   - Or deploy MockERC20 for testing");
    console.log("");
    console.log("2. Update backend/.env with VAULT_ADDRESS and ARC_USDC_ADDRESS");
    console.log("");
    console.log("3. Fund hub wallet with USDC on Arc for settlements");
    console.log("");
    console.log("4. Test settlement flow:");
    console.log("   - Create merchant channel on Yellow");
    console.log("   - Clear payments");
    console.log("   - Trigger settlement via API");
    console.log("");

    return {
        vault: vaultAddress,
        hub: HUB_ADDRESS,
        owner: OWNER_ADDRESS,
        chainId: network.chainId.toString(),
        explorer: `https://testnet-explorer.arc.network/address/${vaultAddress}`,
    };
}

main()
    .then((result) => {
        console.log("✅ Deployment complete!");
        console.log("");
        console.log("Deployment Summary:");
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
