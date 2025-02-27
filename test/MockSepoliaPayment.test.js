const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MockSepoliaPayment", function () {
    let MockSepoliaPayment, contract, deployer, filler, recipient;

    beforeEach(async function () {
        [deployer, filler, recipient] = await ethers.getSigners();

        MockSepoliaPayment = await ethers.getContractFactory("MockSepoliaPayment");
        contract = await MockSepoliaPayment.deploy();
        await contract.waitForDeployment();
    });

    it("Should allow a user to fulfill an intent and emit an event", async function () {
        const intentId = 1;
        const fulfillAmount = ethers.parseEther("0.5");

        const tx = await contract.connect(filler).fulfillIntent(intentId, recipient.address, { value: fulfillAmount });
        const receipt = await tx.wait(); 

        const event = receipt.logs.find((log) => log.address === contract.target);
        const emittedTimestamp = event.args[4];

        await expect(tx)
            .to.emit(contract, "IntentFulfilled")
            .withArgs(intentId, filler.address, recipient.address, fulfillAmount, emittedTimestamp);
    });

    it("Should revert if no ETH is sent", async function () {
        const intentId = 2;

        await expect(
            contract.connect(filler).fulfillIntent(intentId, recipient.address, { value: 0 })
        ).to.be.revertedWith("Must send ETH");
    });

    it("Should revert if recipient is the zero address", async function () {
        const intentId = 3;
        const fulfillAmount = ethers.parseEther("0.1");

        await expect(
            contract.connect(filler).fulfillIntent(intentId, ethers.ZeroAddress, { value: fulfillAmount })
        ).to.be.revertedWith("Invalid recipient");
    });
});
