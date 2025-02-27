const hre = require("hardhat");
const fs = require("fs");

async function main() {
    try {
        console.log("🚀 Deploying IntentVerification contract...");

        // ✅ Deploy contract
        const IntentVerification = await hre.ethers.deployContract("IntentVerification");
        const contract = await IntentVerification.waitForDeployment();
        const deploymentAddress = await contract.getAddress();

        console.log(`✅ Contract successfully deployed to: ${deploymentAddress}`);

        // ✅ Get gas used for deployment
        const tx = await contract.deploymentTransaction();
        const receipt = await tx.wait();
        console.log(`⛽ Deployment Gas Used: ${receipt.gasUsed.toString()}`);

        // ✅ Append new contract address to .env file
        console.log("📂 Saving t1 contract address to .env...");
        fs.appendFileSync(".env", `\nT1_CONTRACT_ADDRESS=${deploymentAddress}\n`);

        console.log("✅ .env file updated successfully!");
    } catch (error) {
        console.error("❌ Error deploying contract:", error);
        process.exit(1);
    }
}

main();
