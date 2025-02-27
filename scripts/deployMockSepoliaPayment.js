const hre = require("hardhat");
const fs = require("fs");

async function main() {
    try {
        console.log("🚀 Deploying MockSepoliaPayment contract...");

        // ✅ Deploy contract
        const MockSepoliaPayment = await hre.ethers.deployContract("MockSepoliaPayment");
        const contract = await MockSepoliaPayment.waitForDeployment();
        const deploymentAddress = await contract.getAddress();

        console.log(`✅ Contract successfully deployed to: ${deploymentAddress}`);

        // ✅ Get gas used for deployment
        const tx = await contract.deploymentTransaction();
        const receipt = await tx.wait();
        console.log(`⛽ Deployment Gas Used: ${receipt.gasUsed.toString()}`);

        // ✅ Append contract address to .env file
        console.log("📂 Saving Sepolia contract address to .env...");
        fs.appendFileSync(".env", `\nSEPOLIA_CONTRACT_ADDRESS=${deploymentAddress}\n`);
        console.log("✅ .env file updated successfully!");
    } catch (error) {
        console.error("❌ Error deploying contract:", error);
        process.exit(1);
    }
}

main();
