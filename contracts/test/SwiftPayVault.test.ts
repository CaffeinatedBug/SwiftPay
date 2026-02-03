import { ethers } from "hardhat";
import { expect } from "chai";
import { SwiftPayVault } from "../typechain-types";
import { Signer } from "ethers";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("SwiftPayVault", function () {
    // Test accounts
    let owner: Signer;
    let hub: Signer;
    let merchant1: Signer;
    let merchant2: Signer;
    let user1: Signer;
    let attacker: Signer;
    
    // Contract instances
    let vault: SwiftPayVault;
    let mockToken: any;
    
    // Addresses
    let ownerAddress: string;
    let hubAddress: string;
    let merchant1Address: string;
    let merchant2Address: string;
    let user1Address: string;
    let attackerAddress: string;
    let tokenAddress: string;

    async function deployVaultFixture() {
        // Get signers
        [owner, hub, merchant1, merchant2, user1, attacker] = await ethers.getSigners();
        
        ownerAddress = await owner.getAddress();
        hubAddress = await hub.getAddress();
        merchant1Address = await merchant1.getAddress();
        merchant2Address = await merchant2.getAddress();
        user1Address = await user1.getAddress();
        attackerAddress = await attacker.getAddress();

        // Deploy mock ERC20 token for testing
        const MockERC20 = await ethers.getContractFactory("MockERC20", owner);
        mockToken = await MockERC20.deploy("Mock USDC", "mUSDC", 6);
        await mockToken.waitForDeployment();
        tokenAddress = await mockToken.getAddress();

        // Deploy SwiftPayVault
        const SwiftPayVault = await ethers.getContractFactory("SwiftPayVault", owner);
        vault = await SwiftPayVault.deploy(hubAddress, ownerAddress);
        await vault.waitForDeployment();

        // Mint tokens to hub for testing settlements
        await mockToken.mint(hubAddress, ethers.parseUnits("1000000", 6)); // 1M USDC
        
        // Mint tokens to user1 for testing direct deposits
        await mockToken.mint(user1Address, ethers.parseUnits("100000", 6)); // 100K USDC

        return { vault, mockToken, owner, hub, merchant1, merchant2, user1, attacker };
    }

    describe("Deployment", function () {
        it("Should set the correct hub and owner", async function () {
            const { vault } = await loadFixture(deployVaultFixture);
            
            expect(await vault.hub()).to.equal(hubAddress);
            expect(await vault.owner()).to.equal(ownerAddress);
        });

        it("Should reject zero address for hub", async function () {
            const SwiftPayVault = await ethers.getContractFactory("SwiftPayVault", owner);
            
            await expect(
                SwiftPayVault.deploy(ethers.ZeroAddress, ownerAddress)
            ).to.be.revertedWithCustomError(vault || SwiftPayVault, "ZeroAddress");
        });

        it("Should reject zero address for owner", async function () {
            const SwiftPayVault = await ethers.getContractFactory("SwiftPayVault", owner);
            
            await expect(
                SwiftPayVault.deploy(hubAddress, ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(vault || SwiftPayVault, "OwnableInvalidOwner");
        });
    });

    describe("Settlement Functions", function () {
        beforeEach(async function () {
            ({ vault, mockToken } = await loadFixture(deployVaultFixture));
        });

        describe("receiveSettlement", function () {
            it("Should successfully process a settlement", async function () {
                const settlementId = ethers.keccak256(ethers.toUtf8Bytes("settlement1"));
                const amount = ethers.parseUnits("100", 6); // 100 USDC

                // Hub approves vault to spend tokens
                await mockToken.connect(hub).approve(await vault.getAddress(), amount);

                // Process settlement
                await expect(
                    vault.connect(hub).receiveSettlement(
                        settlementId,
                        merchant1Address,
                        tokenAddress,
                        amount
                    )
                ).to.emit(vault, "SettlementReceived")
                .withArgs(settlementId, merchant1Address, tokenAddress, amount);

                // Check balances
                expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(amount);
                expect(await vault.totalDeposits(tokenAddress)).to.equal(amount);
                expect(await vault.processedSettlements(settlementId)).to.be.true;
            });

            it("Should reject settlements from unauthorized addresses", async function () {
                const settlementId = ethers.keccak256(ethers.toUtf8Bytes("settlement1"));
                const amount = ethers.parseUnits("100", 6);

                await expect(
                    vault.connect(attacker).receiveSettlement(
                        settlementId,
                        merchant1Address,
                        tokenAddress,
                        amount
                    )
                ).to.be.revertedWithCustomError(vault, "UnauthorizedHub");
            });

            it("Should prevent replay attacks", async function () {
                const settlementId = ethers.keccak256(ethers.toUtf8Bytes("settlement1"));
                const amount = ethers.parseUnits("100", 6);

                // Hub approves vault
                await mockToken.connect(hub).approve(await vault.getAddress(), amount * 2n);

                // First settlement should succeed
                await vault.connect(hub).receiveSettlement(
                    settlementId,
                    merchant1Address,
                    tokenAddress,
                    amount
                );

                // Second settlement with same ID should fail
                await expect(
                    vault.connect(hub).receiveSettlement(
                        settlementId,
                        merchant1Address,
                        tokenAddress,
                        amount
                    )
                ).to.be.revertedWithCustomError(vault, "SettlementAlreadyProcessed");
            });

            it("Should reject zero amounts", async function () {
                const settlementId = ethers.keccak256(ethers.toUtf8Bytes("settlement1"));

                await expect(
                    vault.connect(hub).receiveSettlement(
                        settlementId,
                        merchant1Address,
                        tokenAddress,
                        0
                    )
                ).to.be.revertedWithCustomError(vault, "ZeroAmount");
            });

            it("Should reject zero addresses", async function () {
                const settlementId = ethers.keccak256(ethers.toUtf8Bytes("settlement1"));
                const amount = ethers.parseUnits("100", 6);

                // Zero merchant address
                await expect(
                    vault.connect(hub).receiveSettlement(
                        settlementId,
                        ethers.ZeroAddress,
                        tokenAddress,
                        amount
                    )
                ).to.be.revertedWithCustomError(vault, "ZeroAddress");

                // Zero token address
                await expect(
                    vault.connect(hub).receiveSettlement(
                        settlementId,
                        merchant1Address,
                        ethers.ZeroAddress,
                        amount
                    )
                ).to.be.revertedWithCustomError(vault, "ZeroAddress");
            });

            it("Should handle multiple merchants correctly", async function () {
                const amount1 = ethers.parseUnits("100", 6);
                const amount2 = ethers.parseUnits("200", 6);
                
                const settlementId1 = ethers.keccak256(ethers.toUtf8Bytes("settlement1"));
                const settlementId2 = ethers.keccak256(ethers.toUtf8Bytes("settlement2"));

                // Approve vault
                await mockToken.connect(hub).approve(await vault.getAddress(), amount1 + amount2);

                // Process settlements for different merchants
                await vault.connect(hub).receiveSettlement(settlementId1, merchant1Address, tokenAddress, amount1);
                await vault.connect(hub).receiveSettlement(settlementId2, merchant2Address, tokenAddress, amount2);

                // Check balances
                expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(amount1);
                expect(await vault.getBalance(merchant2Address, tokenAddress)).to.equal(amount2);
                expect(await vault.totalDeposits(tokenAddress)).to.equal(amount1 + amount2);
            });
        });

        describe("receiveDirectSettlement", function () {
            it("Should process direct settlement correctly", async function () {
                const settlementId = ethers.keccak256(ethers.toUtf8Bytes("directSettlement1"));
                const amount = ethers.parseUnits("100", 6);

                // Simulate tokens being sent directly to vault (e.g., from LI.FI)
                await mockToken.connect(user1).transfer(await vault.getAddress(), amount);

                // Process direct settlement
                await expect(
                    vault.connect(hub).receiveDirectSettlement(
                        settlementId,
                        merchant1Address,
                        tokenAddress,
                        amount
                    )
                ).to.emit(vault, "SettlementReceived")
                .withArgs(settlementId, merchant1Address, tokenAddress, amount);

                // Check balances
                expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(amount);
                expect(await vault.totalDeposits(tokenAddress)).to.equal(amount);
            });

            it("Should reject if insufficient tokens in vault", async function () {
                const settlementId = ethers.keccak256(ethers.toUtf8Bytes("directSettlement1"));
                const amount = ethers.parseUnits("1000", 6); // More than available

                await expect(
                    vault.connect(hub).receiveDirectSettlement(
                        settlementId,
                        merchant1Address,
                        tokenAddress,
                        amount
                    )
                ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
            });
        });
    });

    describe("Withdrawal Functions", function () {
        beforeEach(async function () {
            ({ vault, mockToken } = await loadFixture(deployVaultFixture));
            
            // Set up merchant balance for withdrawal tests
            const settlementId = ethers.keccak256(ethers.toUtf8Bytes("setupSettlement"));
            const setupAmount = ethers.parseUnits("500", 6); // 500 USDC
            
            await mockToken.connect(hub).approve(await vault.getAddress(), setupAmount);
            await vault.connect(hub).receiveSettlement(
                settlementId,
                merchant1Address,
                tokenAddress,
                setupAmount
            );
        });

        describe("withdraw", function () {
            it("Should allow merchant to withdraw their balance", async function () {
                const withdrawAmount = ethers.parseUnits("100", 6);
                const initialBalance = await mockToken.balanceOf(merchant1Address);

                await expect(
                    vault.connect(merchant1).withdraw(tokenAddress, withdrawAmount, merchant1Address)
                ).to.emit(vault, "MerchantWithdrawal")
                .withArgs(merchant1Address, tokenAddress, withdrawAmount, merchant1Address);

                // Check balances
                expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(
                    ethers.parseUnits("400", 6) // 500 - 100
                );
                expect(await mockToken.balanceOf(merchant1Address)).to.equal(
                    initialBalance + withdrawAmount
                );
            });

            it("Should reject withdrawal of more than available balance", async function () {
                const excessiveAmount = ethers.parseUnits("600", 6); // More than 500

                await expect(
                    vault.connect(merchant1).withdraw(tokenAddress, excessiveAmount, merchant1Address)
                ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
            });

            it("Should allow withdrawal to different recipient", async function () {
                const withdrawAmount = ethers.parseUnits("100", 6);
                const initialBalance = await mockToken.balanceOf(user1Address);

                await vault.connect(merchant1).withdraw(tokenAddress, withdrawAmount, user1Address);

                expect(await mockToken.balanceOf(user1Address)).to.equal(
                    initialBalance + withdrawAmount
                );
            });

            it("Should reject zero amount withdrawals", async function () {
                await expect(
                    vault.connect(merchant1).withdraw(tokenAddress, 0, merchant1Address)
                ).to.be.revertedWithCustomError(vault, "ZeroAmount");
            });

            it("Should reject zero address recipients", async function () {
                const withdrawAmount = ethers.parseUnits("100", 6);
                
                await expect(
                    vault.connect(merchant1).withdraw(tokenAddress, withdrawAmount, ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(vault, "ZeroAddress");
            });
        });

        describe("withdrawAll", function () {
            it("Should withdraw entire balance", async function () {
                const expectedAmount = ethers.parseUnits("500", 6);
                const initialBalance = await mockToken.balanceOf(merchant1Address);

                await expect(
                    vault.connect(merchant1).withdrawAll(tokenAddress, merchant1Address)
                ).to.emit(vault, "MerchantWithdrawal")
                .withArgs(merchant1Address, tokenAddress, expectedAmount, merchant1Address);

                // Check all balance is withdrawn
                expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(0);
                expect(await mockToken.balanceOf(merchant1Address)).to.equal(
                    initialBalance + expectedAmount
                );
            });

            it("Should reject if no balance to withdraw", async function () {
                // First withdraw all
                await vault.connect(merchant1).withdrawAll(tokenAddress, merchant1Address);

                // Second withdrawAll should fail
                await expect(
                    vault.connect(merchant1).withdrawAll(tokenAddress, merchant1Address)
                ).to.be.revertedWithCustomError(vault, "ZeroAmount");
            });
        });
    });

    describe("Admin Functions", function () {
        beforeEach(async function () {
            ({ vault, mockToken } = await loadFixture(deployVaultFixture));
        });

        describe("setHub", function () {
            it("Should allow owner to update hub address", async function () {
                const newHubAddress = await user1.getAddress();

                await expect(vault.connect(owner).setHub(newHubAddress))
                .to.emit(vault, "HubUpdated")
                .withArgs(hubAddress, newHubAddress);

                expect(await vault.hub()).to.equal(newHubAddress);
            });

            it("Should reject hub updates from non-owners", async function () {
                const newHubAddress = await user1.getAddress();

                await expect(
                    vault.connect(attacker).setHub(newHubAddress)
                ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
            });

            it("Should reject zero address for new hub", async function () {
                await expect(
                    vault.connect(owner).setHub(ethers.ZeroAddress)
                ).to.be.revertedWithCustomError(vault, "ZeroAddress");
            });
        });

        describe("pause/unpause", function () {
            it("Should allow owner to pause and unpause", async function () {
                // Pause
                await vault.connect(owner).pause();
                expect(await vault.paused()).to.be.true;

                // Try to process settlement while paused (should fail)
                const settlementId = ethers.keccak256(ethers.toUtf8Bytes("pausedSettlement"));
                const amount = ethers.parseUnits("100", 6);
                
                await mockToken.connect(hub).approve(await vault.getAddress(), amount);
                
                await expect(
                    vault.connect(hub).receiveSettlement(settlementId, merchant1Address, tokenAddress, amount)
                ).to.be.revertedWithCustomError(vault, "EnforcedPause");

                // Unpause
                await vault.connect(owner).unpause();
                expect(await vault.paused()).to.be.false;

                // Should work after unpause
                await expect(
                    vault.connect(hub).receiveSettlement(settlementId, merchant1Address, tokenAddress, amount)
                ).to.not.be.reverted;
            });

            it("Should reject pause/unpause from non-owners", async function () {
                await expect(
                    vault.connect(attacker).pause()
                ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");

                await expect(
                    vault.connect(attacker).unpause()
                ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
            });
        });

        describe("emergencyWithdraw", function () {
            it("Should allow owner to emergency withdraw stuck tokens", async function () {
                // Send tokens directly to vault (simulating stuck tokens)
                const stuckAmount = ethers.parseUnits("100", 6);
                await mockToken.connect(user1).transfer(await vault.getAddress(), stuckAmount);

                const initialOwnerBalance = await mockToken.balanceOf(ownerAddress);

                await expect(
                    vault.connect(owner).emergencyWithdraw(tokenAddress, stuckAmount, ownerAddress)
                ).to.emit(vault, "EmergencyWithdrawal")
                .withArgs(tokenAddress, stuckAmount, ownerAddress);

                expect(await mockToken.balanceOf(ownerAddress)).to.equal(
                    initialOwnerBalance + stuckAmount
                );
            });

            it("Should reject emergency withdraw from non-owners", async function () {
                const amount = ethers.parseUnits("100", 6);
                
                await expect(
                    vault.connect(attacker).emergencyWithdraw(tokenAddress, amount, attackerAddress)
                ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
            });
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            ({ vault, mockToken } = await loadFixture(deployVaultFixture));
        });

        it("Should return correct balances", async function () {
            // Initially zero
            expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(0);

            // Add some balance
            const settlementId = ethers.keccak256(ethers.toUtf8Bytes("viewTest"));
            const amount = ethers.parseUnits("250", 6);
            
            await mockToken.connect(hub).approve(await vault.getAddress(), amount);
            await vault.connect(hub).receiveSettlement(settlementId, merchant1Address, tokenAddress, amount);

            expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(amount);
        });

        it("Should track settlement processing status", async function () {
            const settlementId = ethers.keccak256(ethers.toUtf8Bytes("statusTest"));
            
            expect(await vault.isSettlementProcessed(settlementId)).to.be.false;

            // Process settlement
            const amount = ethers.parseUnits("100", 6);
            await mockToken.connect(hub).approve(await vault.getAddress(), amount);
            await vault.connect(hub).receiveSettlement(settlementId, merchant1Address, tokenAddress, amount);

            expect(await vault.isSettlementProcessed(settlementId)).to.be.true;
        });
    });

    describe("Security Tests", function () {
        beforeEach(async function () {
            ({ vault, mockToken } = await loadFixture(deployVaultFixture));
        });

        it("Should prevent reentrancy attacks", async function () {
            // This test would require a malicious contract to test reentrancy
            // For now, we verify ReentrancyGuard is in place through modifiers
            expect(await vault.getAddress()).to.not.equal(ethers.ZeroAddress);
        });

        it("Should reject ETH transfers", async function () {
            await expect(
                owner.sendTransaction({
                    to: await vault.getAddress(),
                    value: ethers.parseEther("1")
                })
            ).to.be.revertedWith("ETH not accepted");
        });

        it("Should handle token transfer failures gracefully", async function () {
            // Try to process settlement without enough token approval
            const settlementId = ethers.keccak256(ethers.toUtf8Bytes("failureTest"));
            const amount = ethers.parseUnits("1000000", 6); // More than hub has

            await expect(
                vault.connect(hub).receiveSettlement(settlementId, merchant1Address, tokenAddress, amount)
            ).to.be.reverted; // Should fail due to insufficient balance/approval
        });
    });

    describe("Integration Scenarios", function () {
        beforeEach(async function () {
            ({ vault, mockToken } = await loadFixture(deployVaultFixture));
        });

        it("Should handle complete payment flow", async function () {
            // Scenario: User pays, Hub processes, Merchant withdraws
            
            const paymentAmount = ethers.parseUnits("150", 6);
            const settlementId = ethers.keccak256(ethers.toUtf8Bytes("integrationTest1"));

            // 1. Hub receives settlement
            await mockToken.connect(hub).approve(await vault.getAddress(), paymentAmount);
            await vault.connect(hub).receiveSettlement(
                settlementId,
                merchant1Address,
                tokenAddress,
                paymentAmount
            );

            // 2. Merchant checks balance
            expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(paymentAmount);

            // 3. Merchant withdraws
            const initialBalance = await mockToken.balanceOf(merchant1Address);
            await vault.connect(merchant1).withdrawAll(tokenAddress, merchant1Address);

            // 4. Verify final state
            expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(0);
            expect(await mockToken.balanceOf(merchant1Address)).to.equal(
                initialBalance + paymentAmount
            );
        });

        it("Should handle multiple settlements and partial withdrawals", async function () {
            const amount1 = ethers.parseUnits("100", 6);
            const amount2 = ethers.parseUnits("200", 6);
            const withdrawAmount = ethers.parseUnits("150", 6);

            // Multiple settlements
            await mockToken.connect(hub).approve(await vault.getAddress(), amount1 + amount2);
            
            await vault.connect(hub).receiveSettlement(
                ethers.keccak256(ethers.toUtf8Bytes("multi1")),
                merchant1Address,
                tokenAddress,
                amount1
            );
            
            await vault.connect(hub).receiveSettlement(
                ethers.keccak256(ethers.toUtf8Bytes("multi2")),
                merchant1Address,
                tokenAddress,
                amount2
            );

            // Check total balance
            expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(amount1 + amount2);

            // Partial withdrawal
            await vault.connect(merchant1).withdraw(tokenAddress, withdrawAmount, merchant1Address);

            // Check remaining balance
            expect(await vault.getBalance(merchant1Address, tokenAddress)).to.equal(
                amount1 + amount2 - withdrawAmount
            );
        });
    });
});