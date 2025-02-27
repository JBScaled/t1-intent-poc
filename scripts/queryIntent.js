require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    try {
        // ✅ Validate environment variables
        if (!process.env.T1_CONTRACT_ADDRESS || !process.env.INTENT_ID) {
            throw new Error("❌ Missing environment variables: T1_CONTRACT_ADDRESS or INTENT_ID.");
        }

        const contractAddress = process.env.T1_CONTRACT_ADDRESS;
        const intentId = process.env.INTENT_ID;

        console.log(`🔍 Querying intent ${intentId} on t1...`);

        // ✅ Connect to contract
        const IntentVerification = await ethers.getContractAt("IntentVerification", contractAddress);
        const intent = await IntentVerification.intents(intentId);

        // ✅ Check if intent exists
        if (!intent.creator) {
            console.log(`❌ No intent found with ID ${intentId}.`);
            process.exit(0);
        }

        // ✅ Log intent details in a cleaner format
        console.log("\n📜 Intent Details:");
        console.log(`🔹 Creator:   ${intent.creator}`);
        console.log(`🔹 Recipient: ${intent.recipient}`);
        console.log(`🔹 Amount:    ${ethers.formatEther(intent.amount)} ETH`);
        console.log(`🔹 Fee:       ${ethers.formatEther(intent.fee)} ETH`);
        console.log(`🔹 Filler:    ${intent.filler === ethers.ZeroAddress ? "❌ Not claimed" : intent.filler}`);
        console.log(`🔹 Deposit:   ${ethers.formatEther(intent.deposit)} ETH`);
        console.log(`🔹 Fulfilled: ${intent.fulfilled ? "✅ Yes" : "❌ No"}`);
    } catch (error) {
        console.error("❌ Error querying intent:", error);
        process.exit(1);
    }
}

main();
