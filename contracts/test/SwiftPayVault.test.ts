import { expect } from "chai";
import { ethers } from "hardhat";
import type { SwiftPayVault, MockERC20 } from "../typechain-types";
import { SwiftPayVault__factory, MockERC20__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SwiftPayVault", function () {
    let vault: SwiftPayVault;
    let usdc: MockERC20;
    let owner: SignerWithAddress;
    let hub: SignerWithAddress;
    let merchant1: SignerWithAddress;
    let merchant2: SignerWithAddress;
    let nonOwner: SignerWithAddress;

    beforeEach(async function () {
        [owner, hub, merchant1, merchant2, nonOwner] = await ethers.getSigners();

        // Deploy MockERC20 as USDC (6 decimals)
        usdc = await new MockERC20__factory(owner).deploy("USD Coin", "USDC", 6);
        await usdc.waitForDeployment();

        // Deploy SwiftPayVault with hub and owner
        vault = await new SwiftPayVault__factory(owner).deploy(hub.address, owner.address);
        await vault.waitForDeployment();

        // Mint USDC to hub for settlement deposits
        await usdc.mint(hub.address, ethers.parseUnits("10000", 6));
        // Approve vault to pull USDC from hub
        await usdc.connect(hub).approve(await vault.getAddress(), ethers.parseUnits("10000", 6));
    });

    describe("Deployment", function () {
        it("should set correct hub address", async function () {
            expect(await vault.hub()).to.equal(hub.address);
        });

        it("should set correct owner", async function () {
            expect(await vault.owner()).to.equal(owner.address);
        });

        it("should revert if hub is zero address", async function () {
            await expect(
                new SwiftPayVault__factory(owner).deploy(ethers.ZeroAddress, owner.address)
            ).to.be.revertedWithCustomError(vault, "ZeroAddress");
        });

        it("should revert if owner is zero address", async function () {
            await expect(
                new SwiftPayVault__factory(owner).deploy(hub.address, ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(vault, "OwnableInvalidOwner");
        });
    });

    describe("Settlements", function () {
        it("should allow hub to submit a settlement", async function () {
            const settlementId = ethers.id("settlement-001");
            const amount = ethers.parseUnits("100", 6);
            const usdcAddr = await usdc.getAddress();

            await vault.connect(hub).receiveSettlement(
                settlementId, merchant1.address, usdcAddr, amount
            );

            expect(await vault.getBalance(merchant1.address, usdcAddr)).to.equal(amount);
        });

        it("should emit SettlementReceived event", async function () {
            const settlementId = ethers.id("settlement-002");
            const amount = ethers.parseUnits("50", 6);
            const usdcAddr = await usdc.getAddress();

            await expect(
                vault.connect(hub).receiveSettlement(
                    settlementId, merchant1.address, usdcAddr, amount
                )
            )
                .to.emit(vault, "SettlementReceived")
                .withArgs(settlementId, merchant1.address, usdcAddr, amount);
        });

        it("should accumulate multiple settlements", async function () {
            const usdcAddr = await usdc.getAddress();

            await vault.connect(hub).receiveSettlement(
                ethers.id("s1"), merchant1.address, usdcAddr, ethers.parseUnits("30", 6)
            );
            await vault.connect(hub).receiveSettlement(
                ethers.id("s2"), merchant1.address, usdcAddr, ethers.parseUnits("20", 6)
            );

            expect(await vault.getBalance(merchant1.address, usdcAddr))
                .to.equal(ethers.parseUnits("50", 6));
        });

        it("should reject duplicate settlement IDs", async function () {
            const settlementId = ethers.id("settlement-dup");
            const usdcAddr = await usdc.getAddress();
            const amount = ethers.parseUnits("100", 6);

            await vault.connect(hub).receiveSettlement(
                settlementId, merchant1.address, usdcAddr, amount
            );

            await expect(
                vault.connect(hub).receiveSettlement(
                    settlementId, merchant1.address, usdcAddr, amount
                )
            ).to.be.revertedWithCustomError(vault, "SettlementAlreadyProcessed");
        });

        it("should reject settlements from non-hub", async function () {
            const usdcAddr = await usdc.getAddress();
            await expect(
                vault.connect(nonOwner).receiveSettlement(
                    ethers.id("bad"), merchant1.address, usdcAddr, ethers.parseUnits("10", 6)
                )
            ).to.be.revertedWithCustomError(vault, "UnauthorizedHub");
        });

        it("should reject zero amount settlement", async function () {
            const usdcAddr = await usdc.getAddress();
            await expect(
                vault.connect(hub).receiveSettlement(
                    ethers.id("zero"), merchant1.address, usdcAddr, 0
                )
            ).to.be.revertedWithCustomError(vault, "ZeroAmount");
        });

        it("should mark settlement as processed", async function () {
            const settlementId = ethers.id("settlement-check");
            const usdcAddr = await usdc.getAddress();

            expect(await vault.isSettlementProcessed(settlementId)).to.be.false;

            await vault.connect(hub).receiveSettlement(
                settlementId, merchant1.address, usdcAddr, ethers.parseUnits("10", 6)
            );

            expect(await vault.isSettlementProcessed(settlementId)).to.be.true;
        });

        it("should transfer USDC from hub to vault", async function () {
            const usdcAddr = await usdc.getAddress();
            const vaultAddr = await vault.getAddress();
            const amount = ethers.parseUnits("100", 6);

            const balanceBefore = await usdc.balanceOf(vaultAddr);
            await vault.connect(hub).receiveSettlement(
                ethers.id("transfer-check"), merchant1.address, usdcAddr, amount
            );
            const balanceAfter = await usdc.balanceOf(vaultAddr);

            expect(balanceAfter - balanceBefore).to.equal(amount);
        });
    });

    describe("Withdrawals", function () {
        const depositAmount = ethers.parseUnits("100", 6);

        beforeEach(async function () {
            const usdcAddr = await usdc.getAddress();
            await vault.connect(hub).receiveSettlement(
                ethers.id("pre-withdraw"), merchant1.address, usdcAddr, depositAmount
            );
        });

        it("should allow merchant to withdraw specific amount", async function () {
            const usdcAddr = await usdc.getAddress();
            const withdrawAmount = ethers.parseUnits("60", 6);
            const balanceBefore = await usdc.balanceOf(merchant1.address);

            await vault.connect(merchant1).withdraw(usdcAddr, withdrawAmount, merchant1.address);

            const balanceAfter = await usdc.balanceOf(merchant1.address);
            expect(balanceAfter - balanceBefore).to.equal(withdrawAmount);
            expect(await vault.getBalance(merchant1.address, usdcAddr))
                .to.equal(depositAmount - withdrawAmount);
        });

        it("should allow merchant to withdraw all", async function () {
            const usdcAddr = await usdc.getAddress();
            const balanceBefore = await usdc.balanceOf(merchant1.address);

            await vault.connect(merchant1).withdrawAll(usdcAddr, merchant1.address);

            const balanceAfter = await usdc.balanceOf(merchant1.address);
            expect(balanceAfter - balanceBefore).to.equal(depositAmount);
            expect(await vault.getBalance(merchant1.address, usdcAddr)).to.equal(0);
        });

        it("should emit MerchantWithdrawal event", async function () {
            const usdcAddr = await usdc.getAddress();
            await expect(
                vault.connect(merchant1).withdraw(usdcAddr, depositAmount, merchant1.address)
            )
                .to.emit(vault, "MerchantWithdrawal")
                .withArgs(merchant1.address, usdcAddr, depositAmount, merchant1.address);
        });

        it("should revert withdrawal if insufficient balance", async function () {
            const usdcAddr = await usdc.getAddress();
            const tooMuch = ethers.parseUnits("200", 6);
            await expect(
                vault.connect(merchant1).withdraw(usdcAddr, tooMuch, merchant1.address)
            ).to.be.revertedWithCustomError(vault, "InsufficientBalance");
        });

        it("should revert withdrawAll if balance is zero", async function () {
            const usdcAddr = await usdc.getAddress();
            await expect(
                vault.connect(merchant2).withdrawAll(usdcAddr, merchant2.address)
            ).to.be.revertedWithCustomError(vault, "ZeroAmount");
        });

        it("should handle multiple merchants independently", async function () {
            const usdcAddr = await usdc.getAddress();
            const m2Amount = ethers.parseUnits("200", 6);

            await vault.connect(hub).receiveSettlement(
                ethers.id("m2-deposit"), merchant2.address, usdcAddr, m2Amount
            );

            await vault.connect(merchant1).withdrawAll(usdcAddr, merchant1.address);

            expect(await vault.getBalance(merchant1.address, usdcAddr)).to.equal(0);
            expect(await vault.getBalance(merchant2.address, usdcAddr)).to.equal(m2Amount);
        });
    });

    describe("Balance queries", function () {
        it("should return 0 for unknown merchant", async function () {
            const usdcAddr = await usdc.getAddress();
            expect(await vault.getBalance(nonOwner.address, usdcAddr)).to.equal(0);
        });
    });

    describe("Admin functions", function () {
        it("should allow owner to update hub", async function () {
            await expect(vault.connect(owner).setHub(nonOwner.address))
                .to.emit(vault, "HubUpdated")
                .withArgs(hub.address, nonOwner.address);

            expect(await vault.hub()).to.equal(nonOwner.address);
        });

        it("should reject setHub from non-owner", async function () {
            await expect(
                vault.connect(nonOwner).setHub(nonOwner.address)
            ).to.be.reverted;
        });

        it("should allow owner to pause and unpause", async function () {
            await vault.connect(owner).pause();
            const usdcAddr = await usdc.getAddress();

            await expect(
                vault.connect(hub).receiveSettlement(
                    ethers.id("paused"), merchant1.address, usdcAddr, ethers.parseUnits("10", 6)
                )
            ).to.be.reverted;

            await vault.connect(owner).unpause();

            await vault.connect(hub).receiveSettlement(
                ethers.id("unpaused"), merchant1.address, usdcAddr, ethers.parseUnits("10", 6)
            );
            expect(await vault.getBalance(merchant1.address, usdcAddr))
                .to.equal(ethers.parseUnits("10", 6));
        });

        it("should allow emergency withdrawal by owner", async function () {
            const usdcAddr = await usdc.getAddress();
            const amount = ethers.parseUnits("100", 6);

            await vault.connect(hub).receiveSettlement(
                ethers.id("emergency-test"), merchant1.address, usdcAddr, amount
            );

            const ownerBalBefore = await usdc.balanceOf(owner.address);
            await vault.connect(owner).emergencyWithdraw(usdcAddr, amount, owner.address);
            const ownerBalAfter = await usdc.balanceOf(owner.address);

            expect(ownerBalAfter - ownerBalBefore).to.equal(amount);
        });

        it("should reject emergency withdrawal from non-owner", async function () {
            const usdcAddr = await usdc.getAddress();
            await expect(
                vault.connect(nonOwner).emergencyWithdraw(
                    usdcAddr, ethers.parseUnits("1", 6), nonOwner.address
                )
            ).to.be.reverted;
        });
    });

    describe("ETH rejection", function () {
        it("should reject direct ETH transfers", async function () {
            await expect(
                owner.sendTransaction({
                    to: await vault.getAddress(),
                    value: ethers.parseEther("1"),
                })
            ).to.be.reverted;
        });
    });
});