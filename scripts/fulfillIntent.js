const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    try {
        // ✅ Validate environment variables
        if (
            !process.env.SEPOLIA_CONTRACT_ADDRESS ||
            !process.env.INTENT_ID ||
            !process.env.INTENT_CREATOR ||
            !process.env.INTENT_AMOUNT
        ) {
            throw new Error(
                "❌ Missing environment variables: SEPOLIA_CONTRACT_ADDRESS, INTENT_ID, INTENT_CREATOR, or INTENT_AMOUNT."
            )
        }

        const contractAddress = process.env.SEPOLIA_CONTRACT_ADDRESS;
        const intentId = process.env.INTENT_ID;
        const recipient = process.env.INTENT_CREATOR;
        const amount = ethers.parseEther(process.env.INTENT_AMOUNT);

        console.log(`🔄 Fulfilling intent ${intentId} on Sepolia for ${recipient} with ${ethers.formatEther(amount)} ETH...`);

        // ✅ Connect to the contract
        const MockSepoliaPayment = await ethers.getContractAt("MockSepoliaPayment", contractAddress);

        // ✅ Send transaction
        const tx = await MockSepoliaPayment.fulfillIntent(intentId, recipient, { value: amount });
        const receipt = await tx.wait();

        console.log("✅ Intent successfully fulfilled on Sepolia!");
        console.log(`🔗 TxHash: ${tx.hash}`);
        console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    } catch (error) {
        console.error("❌ Error fulfilling intent:", error);
        process.exit(1);
    }
}

main();
