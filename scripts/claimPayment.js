const { ethers } = require("hardhat");

async function main() {
    try {
        // ✅ Validate environment variables
        if (!process.env.T1_CONTRACT_ADDRESS || !process.env.INTENT_ID) {
            throw new Error("❌ Missing environment variables: T1_CONTRACT_ADDRESS or INTENT_ID.");
        }

        const contractAddress = process.env.T1_CONTRACT_ADDRESS;
        const intentId = process.env.INTENT_ID;

        console.log(`🔄 Claiming payment for intent ${intentId} from contract ${contractAddress}...`);

        // ✅ Connect to contract
        const IntentVerification = await ethers.getContractAt("IntentVerification", contractAddress);

        // ✅ Send transaction with a gas limit
        const tx = await IntentVerification.claimPayment(intentId, { gasLimit: 500000 });
        const receipt = await tx.wait();

        console.log("✅ Payment successfully claimed!");
        console.log(`🔗 TxHash: ${tx.hash}`);
        console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    } catch (error) {
        console.error("❌ Error claiming payment:", error);
        process.exit(1);
    }
}

main();
