const { ethers } = require("hardhat");

async function main() {
    try {
        // ✅ Validate environment variables before proceeding
        if (!process.env.T1_CONTRACT_ADDRESS || !process.env.INTENT_ID || !process.env.FILLER_DEPOSIT) {
            throw new Error("❌ Missing environment variables: T1_CONTRACT_ADDRESS, INTENT_ID, or FILLER_DEPOSIT.");
        }

        const contractAddress = process.env.T1_CONTRACT_ADDRESS;
        const intentId = process.env.INTENT_ID;
        const deposit = ethers.parseEther(process.env.FILLER_DEPOSIT);

        console.log(`🔄 Claiming intent ${intentId} on contract ${contractAddress} with a deposit of ${ethers.formatEther(deposit)} ETH...`);

        // ✅ Connect to the contract
        const IntentVerification = await ethers.getContractAt("IntentVerification", contractAddress);

        // ✅ Call the contract function
        const tx = await IntentVerification.claimIntent(intentId, { value: deposit });
        const receipt = await tx.wait();

        console.log("✅ Intent successfully claimed!");
        console.log(`🔗 TxHash: ${tx.hash}`);
        console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    } catch (error) {
        console.error("❌ Error claiming intent:", error);
        process.exit(1);
    }
}

main();
