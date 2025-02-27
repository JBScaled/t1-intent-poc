require("dotenv").config();
const { ethers } = require("ethers");

// ✅ Validate Environment Variables
const requiredEnvVars = [
    "SEPOLIA_WSS_URL",
    "T1_URL",
    "WALLET_PRIVATE_KEY",
    "INTENT_CREATOR",
    "SEPOLIA_CONTRACT_ADDRESS",
    "T1_CONTRACT_ADDRESS"
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing environment variable: ${envVar}`);
        process.exit(1);
    }
}

// ✅ Sepolia & t1 RPC URLs
const SEPOLIA_RPC = process.env.SEPOLIA_WSS_URL;
const T1_RPC = process.env.T1_URL;

// ✅ Wallet & Private Key
const PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;
const aliceAddress = process.env.INTENT_CREATOR;

// ✅ Smart contract addresses
const SEPOLIA_MOCK_CONTRACT = process.env.SEPOLIA_CONTRACT_ADDRESS;
const T1_CONTRACT = process.env.T1_CONTRACT_ADDRESS;

// ✅ ABIs
const MOCK_PAYMENT_ABI = [
    "event IntentFulfilled(uint256 indexed intentId, address indexed filler, address indexed recipient, uint256 amount, uint256 timestamp)"
];

const T1_CONTRACT_ABI = [
    "function verifyFill(uint256 intentId, uint256 amount) external"
];

// ✅ Create WebSocket Provider with Auto-Reconnect
const createWebSocketProvider = (url) => {
    let provider = new ethers.WebSocketProvider(url);

    provider._websocket.on("close", () => {
        console.error("❌ WebSocket closed. Attempting to reconnect...");
        setTimeout(() => {
            provider = createWebSocketProvider(url);
        }, 5000);
    });

    return provider;
};

const sepoliaProvider = createWebSocketProvider(SEPOLIA_RPC);
const t1Provider = new ethers.JsonRpcProvider(T1_RPC);

// ✅ Create Signer for t1 contract interaction
const wallet = new ethers.Wallet(PRIVATE_KEY, t1Provider);
const t1Contract = new ethers.Contract(T1_CONTRACT, T1_CONTRACT_ABI, wallet);

// ✅ Connect to Sepolia contract
const sepoliaMockContract = new ethers.Contract(SEPOLIA_MOCK_CONTRACT, MOCK_PAYMENT_ABI, sepoliaProvider);

async function startRelayer() {
    console.log("🔄 Relayer is listening for Sepolia transactions...");

    sepoliaMockContract.on("IntentFulfilled", async (intentId, filler, recipient, amount, timestamp, event) => {
        console.log(`🔍 Detected intent fulfillment on Sepolia!`);
        console.log(`🔹 Intent ID: ${intentId}`);
        console.log(`🔹 Filler: ${filler}`);
        console.log(`🔹 Recipient: ${recipient}`);
        console.log(`🔹 Amount: ${ethers.formatEther(amount)} ETH`);

        try {
            console.log("🚀 Submitting proof to t1 contract...");
            
            // ✅ Send transaction with explicit gas limit
            // const tx = await t1Contract.verifyFill(intentId, amount, { gasLimit: 500000 });
            const tx = await t1Contract.verifyFill(intentId, amount);
            const receipt = await tx.wait();

            console.log("✅ Proof successfully submitted to t1!");
            console.log(`🔗 TxHash: ${receipt.transactionHash}`);
            console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
        } catch (error) {
            console.error("❌ Error submitting proof to t1:", error);
        }
    });
}

// ✅ Start listening for events
startRelayer();
