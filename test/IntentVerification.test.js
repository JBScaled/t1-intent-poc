const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("IntentVerification", function () {
    let contract, owner, user1, user2, user3

    beforeEach(async function () {
        ;[owner, user1, user2, user3] = await ethers.getSigners()

        const IntentVerification = await ethers.getContractFactory(
            "IntentVerification"
        )
        contract = await IntentVerification.deploy()
        await contract.waitForDeployment()
    })

    describe("1️⃣ Intent Creation", function () {
        it("Should create an intent", async function () {
            const tx = await contract
                .connect(user1)
                .createIntent(
                    user2.address,
                    ethers.parseEther("1"),
                    ethers.parseEther("0.05"),
                    { value: ethers.parseEther("0.05") }
                )
            await tx.wait()

            const intent = await contract.intents(0)
            expect(intent.creator).to.equal(user1.address)
            expect(intent.recipient).to.equal(user2.address)
            expect(intent.amount).to.equal(ethers.parseEther("1"))
        })

        it("Should revert if no fee is sent", async function () {
            await expect(
                contract
                    .connect(user1)
                    .createIntent(
                        user2.address,
                        ethers.parseEther("1"),
                        ethers.parseEther("0.05")
                    )
            ).to.be.revertedWith("Must send exact fee")
        })
    })

    describe("2️⃣ Claiming Intents", function () {
        beforeEach(async function () {
            await contract
                .connect(user1)
                .createIntent(
                    user2.address,
                    ethers.parseEther("1"),
                    ethers.parseEther("0.05"),
                    { value: ethers.parseEther("0.05") }
                )
        })

        it("Should allow a user to claim an intent", async function () {
            await contract
                .connect(user3)
                .claimIntent(0, { value: ethers.parseEther("0.005") })

            const intent = await contract.intents(0)
            expect(intent.filler).to.equal(user3.address)
        })

        it("Should revert if trying to claim an already claimed intent", async function () {
            await contract
                .connect(user3)
                .claimIntent(0, { value: ethers.parseEther("0.005") })

            await expect(
                contract
                    .connect(user2)
                    .claimIntent(0, { value: ethers.parseEther("0.005") })
            ).to.be.revertedWith("Intent already claimed")
        })

        it("Should revert if claiming with an insufficient deposit", async function () {
            await expect(
                contract
                    .connect(user3)
                    .claimIntent(0, { value: ethers.parseEther("0.004") })
            ).to.be.revertedWith("Deposit must be at least 0.005 ETH")
        })
    })

    describe("3️⃣ Verifying Fill", function () {
        beforeEach(async function () {
            await contract
                .connect(user1)
                .createIntent(
                    user2.address,
                    ethers.parseEther("1"),
                    ethers.parseEther("0.05"),
                    { value: ethers.parseEther("0.05") }
                )

            await contract
                .connect(user3)
                .claimIntent(0, { value: ethers.parseEther("0.005") })
        })

        it("Should allow the owner to verify an intent fill", async function () {
            await contract.verifyFill(0, ethers.parseEther("1"))

            const intent = await contract.intents(0)
            expect(intent.fulfilled).to.be.true
        })

        it("Should revert if trying to verify an unclaimed intent", async function () {
            await expect(
                contract.verifyFill(1, ethers.parseEther("1"))
            ).to.be.revertedWith("Intent not claimed yet")
        })

        it("Should revert if verifying an already fulfilled intent", async function () {
            await contract.verifyFill(0, ethers.parseEther("1"))

            await expect(
                contract.verifyFill(0, ethers.parseEther("1"))
            ).to.be.revertedWith("Intent already fulfilled")
        })
    })

    describe("4️⃣ Claiming Payment", function () {
        beforeEach(async function () {
            await contract
                .connect(user1)
                .createIntent(
                    user2.address,
                    ethers.parseEther("1"),
                    ethers.parseEther("0.05"),
                    { value: ethers.parseEther("0.05") }
                )

            await contract
                .connect(user3)
                .claimIntent(0, { value: ethers.parseEther("0.005") })
            await contract.verifyFill(0, ethers.parseEther("1"))
        })

        it("Should allow the filler to claim their payment", async function () {
            await contract.connect(user3).claimPayment(0)

            const intent = await contract.intents(0)
            expect(intent.amount).to.equal(0)
        })

        it("Should revert if claiming before verification", async function () {
            await expect(
                contract.connect(user3).claimPayment(1)
            ).to.be.revertedWith("Intent not fulfilled yet")
        })

        it("Should revert if someone other than the filler tries to claim payment", async function () {
            await expect(
                contract.connect(user2).claimPayment(0)
            ).to.be.revertedWith("Only filler can claim")
        })
    })

    describe("5️⃣ Closing Expired Intents", function () {
        beforeEach(async function () {
            await contract
                .connect(user1)
                .createIntent(
                    user2.address,
                    ethers.parseEther("1"),
                    ethers.parseEther("0.05"),
                    { value: ethers.parseEther("0.05") }
                )

            await contract
                .connect(user3)
                .claimIntent(0, { value: ethers.parseEther("0.005") })
        })

        it("Should allow the creator to close an expired intent and refund", async function () {
            // Simulate 31 minutes passing
            await ethers.provider.send("evm_increaseTime", [31 * 60])
            await ethers.provider.send("evm_mine")
           
            await expect(
                contract.connect(user1).closeExpiredIntent(0)
            ).to.changeEtherBalance(user1, ethers.parseEther("0.055")) // fee + deposit
        })

        it("Should revert if trying to close an intent before expiry", async function () {
            await expect(
                contract.connect(user1).closeExpiredIntent(0)
            ).to.be.revertedWith("Intent still active")
        })

        it("Should revert if a non-creator tries to close an expired intent", async function () {
            // Simulate 31 minutes passing
            await ethers.provider.send("evm_increaseTime", [31 * 60])
            await ethers.provider.send("evm_mine")

            await expect(
                contract.connect(user3).closeExpiredIntent(0)
            ).to.be.revertedWith("Only creator can close")
        })
    })

    describe("6️⃣ Contract Disabling", function () {
        it("Should allow the owner to withdraw funds and disable the contract", async function () {
            await contract
                .connect(user1)
                .createIntent(
                    user2.address,
                    ethers.parseEther("1"),
                    ethers.parseEther("0.05"),
                    { value: ethers.parseEther("0.05") }
                )

            const balanceBefore = await ethers.provider.getBalance(
                owner.address
            )
            await contract.withdrawAndDisable()
            const balanceAfter = await ethers.provider.getBalance(owner.address)

            expect(balanceAfter).to.be.gt(balanceBefore)
        })

        it("Should revert if a non-owner tries to disable the contract", async function () {
            await expect(
                contract.connect(user1).withdrawAndDisable()
            ).to.be.revertedWith("Only owner can call this")
        })
    })
})
