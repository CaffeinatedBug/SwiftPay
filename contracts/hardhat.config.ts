import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
const ARBITRUM_SEPOLIA_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://arbitrum-sepolia-rpc.publicnode.com";
const ARC_TESTNET_RPC_URL = process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "GVV2RDE3DR1FTHR8BRV97XYCJ34HNKUE2G";
const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY || "";
const ARC_API_KEY = process.env.ARC_API_KEY || "";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true,
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
        },
        arbitrumSepolia: {
            url: ARBITRUM_SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 421614,
        },
        arcTestnet: {
            url: ARC_TESTNET_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5042002, // Arc testnet chain ID
        },
    },
    etherscan: {
        apiKey: {
            sepolia: ETHERSCAN_API_KEY,
            arbitrumSepolia: ARBISCAN_API_KEY,
            arcTestnet: ARC_API_KEY,
        },
        customChains: [
            {
                network: "arbitrumSepolia",
                chainId: 421614,
                urls: {
                    apiURL: "https://api-sepolia.arbiscan.io/api",
                    browserURL: "https://sepolia.arbiscan.io"
                }
            },
            {
                network: "arcTestnet",
                chainId: 5042002, // Arc testnet chain ID
                urls: {
                    apiURL: "https://testnet-explorer.arc.network/api", // Arc testnet explorer API (updated)
                    browserURL: "https://testnet-explorer.arc.network" // Arc testnet explorer (updated)
                }
            }
        ]
    },
    paths: {
        sources: "./src",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};

export default config;
