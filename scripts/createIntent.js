const { ethers } = require("hardhat");

async function main() {
    try {
        // ✅ Validate required environment variables
        if (!process.env.T1_CONTRACT_ADDRESS || !process.env.INTENT_CREATOR || !process.env.INTENT_AMOUNT || !process.env.INTENT_FEE) {
            throw new Error("❌ Missing environment variables: T1_CONTRACT_ADDRESS, INTENT_CREATOR, INTENT_AMOUNT, or INTENT_FEE.");
        }

        const contractAddress = process.env.T1_CONTRACT_ADDRESS;
        const recipient = process.env.INTENT_CREATOR;
        const amount = ethers.parseEther(process.env.INTENT_AMOUNT);
        const fee = ethers.parseEther(process.env.INTENT_FEE);

        console.log(`🔄 Creating intent: ${ethers.formatEther(amount)} ETH for ${recipient} with a fee of ${ethers.formatEther(fee)} ETH...`);

        // ✅ Connect to contract
        const IntentVerification = await ethers.getContractAt("IntentVerification", contractAddress);

        // ✅ Send transaction
        const tx = await IntentVerification.createIntent(recipient, amount, fee, { value: fee });
        const receipt = await tx.wait();

        console.log("✅ Intent successfully created!");
        console.log(`🔗 TxHash: ${tx.hash}`);
        console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
    } catch (error) {
        console.error("❌ Error creating intent:", error);
        process.exit(1);
    }
}

main();
