import { expect } from "chai";
import { ethers } from "hardhat";
import { SwiftPayVault, MockUSDC } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SwiftPayVault", function () {
    let vault: SwiftPayVault;
    let usdc: MockUSDC;
    let owner: SignerWithAddress;
    let merchant1: SignerWithAddress;
    let merchant2: SignerWithAddress;
    let nonOwner: SignerWithAddress;

    beforeEach(async function () {
        [owner, merchant1, merchant2, nonOwner] = await ethers.getSigners();

        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        usdc = await MockUSDC.deploy();
        await usdc.waitForDeployment();

        const Vault = await ethers.getContractFactory("SwiftPayVault");
        vault = await Vault.deploy(await usdc.getAddress());
        await vault.waitForDeployment();

        // Mint USDC to owner for deposits
        await usdc.mint(owner.address, ethers.parseUnits("10000", 6));
        // Approve vault to spend USDC
        await usdc.approve(await vault.getAddress(), ethers.parseUnits("10000", 6));
    });

    describe("Deployment", function () {
        it("should set correct USDC address", async function () {
            expect(await vault.usdc()).to.equal(await usdc.getAddress());
        });

        it("should set correct owner", async function () {
            expect(await vault.owner()).to.equal(owner.address);
        });
    });

    describe("Deposits", function () {
        it("should allow owner to deposit for merchant", async function () {
            await vault.deposit(merchant1.address, ethers.parseUnits("100", 6));
            expect(await vault.balanceOf(merchant1.address)).to.equal(ethers.parseUnits("100", 6));
        });

        it("should emit Deposited event", async function () {
            await expect(vault.deposit(merchant1.address, ethers.parseUnits("50", 6)))
                .to.emit(vault, "Deposited")
                .withArgs(merchant1.address, ethers.parseUnits("50", 6));
        });

        it("should accumulate multiple deposits", async function () {
            await vault.deposit(merchant1.address, ethers.parseUnits("30", 6));
            await vault.deposit(merchant1.address, ethers.parseUnits("20", 6));
            expect(await vault.balanceOf(merchant1.address)).to.equal(ethers.parseUnits("50", 6));
        });

        it("should reject deposits from non-owner", async function () {
            await expect(
                vault.connect(nonOwner).deposit(merchant1.address, ethers.parseUnits("100", 6))
            ).to.be.reverted;
        });

        it("should transfer USDC from owner to vault", async function () {
            const vaultAddress = await vault.getAddress();
            const balanceBefore = await usdc.balanceOf(vaultAddress);
            await vault.deposit(merchant1.address, ethers.parseUnits("100", 6));
            const balanceAfter = await usdc.balanceOf(vaultAddress);
            expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("100", 6));
        });
    });

    describe("Withdrawals", function () {
        beforeEach(async function () {
            await vault.deposit(merchant1.address, ethers.parseUnits("100", 6));
        });

        it("should allow merchant to withdraw full balance", async function () {
            const balanceBefore = await usdc.balanceOf(merchant1.address);
            await vault.connect(merchant1).withdraw();
            const balanceAfter = await usdc.balanceOf(merchant1.address);
            expect(balanceAfter - balanceBefore).to.equal(ethers.parseUnits("100", 6));
        });

        it("should reset merchant balance to 0 after withdrawal", async function () {
            await vault.connect(merchant1).withdraw();
            expect(await vault.balanceOf(merchant1.address)).to.equal(0);
        });

        it("should emit Withdrawn event", async function () {
            await expect(vault.connect(merchant1).withdraw())
                .to.emit(vault, "Withdrawn")
                .withArgs(merchant1.address, ethers.parseUnits("100", 6));
        });

        it("should revert if merchant has no balance", async function () {
            await expect(vault.connect(merchant2).withdraw()).to.be.revertedWith("No balance");
        });

        it("should handle multiple merchants independently", async function () {
            await vault.deposit(merchant2.address, ethers.parseUnits("200", 6));

            await vault.connect(merchant1).withdraw();
            expect(await vault.balanceOf(merchant1.address)).to.equal(0);
            expect(await vault.balanceOf(merchant2.address)).to.equal(ethers.parseUnits("200", 6));
        });
    });

    describe("Balance queries", function () {
        it("should return 0 for unknown merchant", async function () {
            expect(await vault.balanceOf(nonOwner.address)).to.equal(0);
        });
    });
});