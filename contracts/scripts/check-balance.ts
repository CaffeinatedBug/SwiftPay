// Check wallet balance on specified network
import { ethers } from "hardhat";

async function main() {
    console.log("Checking wallet balance...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Wallet address:", deployer.address);

    // Get balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "ETH");

    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());

    // Check if balance is sufficient
    const minBalance = ethers.parseEther("0.01"); // 0.01 ETH minimum
    if (balance < minBalance) {
        console.log("\n⚠️  WARNING: Balance is low!");
        console.log("   Get testnet tokens from a faucet.");
    } else {
        console.log("\n✅ Balance is sufficient for deployment.");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
