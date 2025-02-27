const { ethers } = require("hardhat");

async function main() {
    // ✅ Hardcoded contract addresses (Update these when running)
    const CONTRACTS_TO_DESTROY = [
        "0x123...", // Replace with actual contract addresses
        "0x456...",
        "0x789..."
    ];

    // ✅ Get signer
    const signer = (await ethers.getSigners())[0];
    console.log("👤 Using signer:", signer.address);

    if (CONTRACTS_TO_DESTROY.length === 0) {
        console.error("❌ No contract addresses provided. Update `CONTRACTS_TO_DESTROY` before running.");
        process.exit(1);
    }

    console.log("⚠️ WARNING: This will permanently disable and withdraw funds from the following contracts:");
    CONTRACTS_TO_DESTROY.forEach((address, index) => console.log(`  ${index + 1}. ${address}`));

    const confirm = await askForConfirmation("Are you sure you want to proceed? (yes/no): ");
    if (!confirm) {
        console.log("❌ Operation aborted.");
        process.exit(0);
    }

    for (const contractAddress of CONTRACTS_TO_DESTROY) {
        try {
            const contract = await ethers.getContractAt("IntentVerification", contractAddress, signer);
            console.log(`💀 Calling withdrawAndDisable() on contract: ${contractAddress}...`);

            const tx = await contract.withdrawAndDisable();
            const receipt = await tx.wait();

            console.log(`✅ Contract ${contractAddress} successfully disabled.`);
            console.log(`🔗 TxHash: ${receipt.transactionHash}`);
            console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
        } catch (error) {
            console.error(`❌ Failed to disable contract ${contractAddress}:`, error);
        }
    }

    console.log("🎉 All requested contracts have been processed.");
}

// ✅ Helper function for user confirmation
async function askForConfirmation(question) {
    process.stdout.write(question);
    return new Promise((resolve) => {
        process.stdin.once("data", (data) => {
            resolve(data.toString().trim().toLowerCase() === "yes");
        });
    });
}

main().catch((error) => {
    console.error("❌ Error in withdrawAndDisable.js:", error);
    process.exit(1);
});
