// SwiftPay Vault Deployment Script
// Deploys SwiftPayVault to the specified network

import { ethers } from "hardhat";

async function main() {
    console.log("╔═══════════════════════════════════════════════════════════╗");
    console.log("║                                                           ║");
    console.log("║   ⚡ SwiftPay Vault Deployment ⚡                          ║");
    console.log("║                                                           ║");
    console.log("╚═══════════════════════════════════════════════════════════╝");
    console.log("");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);

    // Check balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

    if (balance === 0n) {
        console.error("❌ Deployer has no ETH! Get testnet ETH from a faucet.");
        process.exit(1);
    }

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "(Chain ID:", network.chainId.toString(), ")");
    console.log("");

    // Configuration
    // Hub address - this is the address that can submit settlements
    // For demo, we use the Hub's signing wallet (Hardhat account #0)
    const HUB_ADDRESS = process.env.HUB_ADDRESS || deployer.address;
    const OWNER_ADDRESS = deployer.address;

    console.log("Configuration:");
    console.log("  Hub Address:", HUB_ADDRESS);
    console.log("  Owner Address:", OWNER_ADDRESS);
    console.log("");

    // Deploy SwiftPayVault
    console.log("Deploying SwiftPayVault...");
    
    const SwiftPayVault = await ethers.getContractFactory("SwiftPayVault");
    const vault = await SwiftPayVault.deploy(HUB_ADDRESS, OWNER_ADDRESS);
    
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();

    console.log("");
    console.log("✅ SwiftPayVault deployed successfully!");
    console.log("   Contract Address:", vaultAddress);
    console.log("");

    // Verify deployment
    console.log("Verifying deployment...");
    const hubFromContract = await vault.hub();
    const ownerFromContract = await vault.owner();
    
    console.log("  Hub (from contract):", hubFromContract);
    console.log("  Owner (from contract):", ownerFromContract);
    console.log("");

    // Output for frontend configuration
    console.log("═══════════════════════════════════════════════════════════");
    console.log("Add to frontend/.env.local:");
    console.log("");
    console.log(`NEXT_PUBLIC_VAULT_ADDRESS=${vaultAddress}`);
    console.log(`NEXT_PUBLIC_VAULT_CHAIN_ID=${network.chainId.toString()}`);
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");

    // Output verification command
    console.log("To verify on Etherscan:");
    console.log(`npx hardhat verify --network ${network.name === "unknown" ? "sepolia" : network.name} ${vaultAddress} "${HUB_ADDRESS}" "${OWNER_ADDRESS}"`);
    console.log("");

    return {
        vault: vaultAddress,
        hub: HUB_ADDRESS,
        owner: OWNER_ADDRESS,
        chainId: network.chainId.toString(),
    };
}

main()
    .then((result) => {
        console.log("Deployment complete!");
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
