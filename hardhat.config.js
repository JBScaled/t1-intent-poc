require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

if (!process.env.SEPOLIA_URL || !process.env.T1_URL || !process.env.WALLET_PRIVATE_KEY) {
  throw new Error("🚨 Missing environment variables in .env file!");
}

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.WALLET_PRIVATE_KEY.trim()]
    },
    t1: {
      url: process.env.T1_URL,
      accounts: [process.env.WALLET_PRIVATE_KEY.trim()]
    },
  },
  sourcify: {
    enabled: true
  }
};
