const { ethers } = require("hardhat");

async function main() {
    try {
        // ✅ Validate environment variables
        if (!process.env.T1_CONTRACT_ADDRESS || !process.env.INTENT_ID || !process.env.EXPIRE_TIME) {
            throw new Error("❌ Missing environment variables: T1_CONTRACT_ADDRESS, INTENT_ID, or EXPIRE_TIME.");
        }

        const contractAddress = process.env.T1_CONTRACT_ADDRESS;
        const intentId = process.env.INTENT_ID;
        const waitTime = parseInt(process.env.EXPIRE_TIME, 10);

        console.log(`⏳ Waiting ${waitTime} seconds before closing expired intent ${intentId}...`);

        // ✅ Countdown display
        for (let i = waitTime; i > 0; i--) {
            process.stdout.write(`\r⏳ Time remaining: ${i} seconds...   `);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
        console.log("\n🚀 Closing expired intent now...");

        // ✅ Connect to contract
        const IntentVerification = await ethers.getContractAt("IntentVerification", contractAddress);

        // ✅ Send transaction
        const tx = await IntentVerification.closeExpiredIntent(intentId);
        const receipt = await tx.wait();

        console.log("✅ Intent successfully closed and refund processed!");
        console.log(`🔗 TxHash: ${tx.hash}`);
        console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    } catch (error) {
        console.error("❌ Error closing expired intent:", error);
        process.exit(1);
    }
}

main();
