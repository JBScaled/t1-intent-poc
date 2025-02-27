
# t1 Intent Verification PoC

This project is a **Proof of Concept (PoC)** demonstrating how **t1 can verify transactions on Sepolia** and trigger payments based on intent fulfillment.

Here's what an Intent looks like for this example:

```solidity
struct Intent {
    address creator;     // The user who created the intent.
    address recipient;   // The recipient on the destination chain.
    uint256 amount;      // Amount expected to be received.
    uint256 fee;         // Fee offered to the filler.
    address filler;      // The address fulfilling the intent.
    uint256 deposit;     // Deposit made by the filler.
    uint256 claimTimestamp; // Timestamp when the intent was claimed.
    bool fulfilled;      // Whether the intent has been fulfilled.
}
```

## Assumptions

The project currently allows an Intent Creator to declare an `amount` of tokens that they would like sent to a `recipient` address. For the purposes of this PoC, it is assumed that the creator wants Ether sent on Sepolia.

By default, the Filler's reward is at least 1% of the `amount` set by the Intent Creator, but an additional `fee` can be included to further incentivize Fillers.

## Design Choices

To prevent multiple Fillers from competing to fulfill the same Intent—potentially resulting in duplicate payments to the `recipient`—the contract enforces a `claim` mechanism. Only the first Filler to successfully claim an Intent secures the right to fulfill it and receive the reward.

To prevent Fillers from exploiting the system by claiming an Intent without fulfilling it, they are required to place a `deposit` when claiming. If the Filler successfully completes the Intent within the `claimTimeout` window, they can reclaim their deposit along with any addition fee the Intent Creator set.

However, if the Intent remains unfulfilled beyond the `claimTimeout`, the Intent Creator has the right to close the Intent and retain the Filler’s deposit as compensation.

----------

## 📌 Intent Lifecycle

1.  **Intent Creation**
    
    -   A user (creator) calls `createIntent` on t1, specifying the `recipient`, `amount`, and `fee`.
    -   The contract emits an `IntentCreated` event.
2.  **Intent Claiming**
    
    -   A filler calls `claimIntent` and provides a deposit.
    -   The contract records the filler’s address and timestamp.
    -   The contract emits an `IntentClaimed` event.
3.  **Intent Fulfillment**
    
    -   The filler transfers the expected amount to the recipient on Sepolia.
    -   The `MockSepoliaPayment` contract emits an `IntentFulfilled` event.
    -   The relayer detects this event and submits proof to `t1`.
4.  **Verification & Payment**
    
    -   The contract verifies the fulfillment via `verifyFill`.
    -   The filler can call `claimPayment` to receive their reward.
    -   The contract emits a `FillerPaid` event.
5.  **Expiration & Refunds**
    
    -   If an intent is not fulfilled within the `claimTimeout` window, the creator can call `closeExpiredIntent`.
    -   The contract refunds the creator and emits an `IntentClosed` event.
    -   If the intent expires, the creator can reclaim their funds along with the Filler’s deposit as compensation.
6.  **Contract Shutdown**
    
    -   The owner can call `withdrawAndDisable` to remove all funds held by the contract.

----------

## 🛠 Setup & Installation

### 1️⃣ Install Dependencies

```sh
npm install
```

### 2️⃣ Set Up Environment Variables

Create a `.env` file and configure:

```sh
SEPOLIA_WSS_URL=wss://...
T1_URL=https://...
WALLET_PRIVATE_KEY=your_private_key
INTENT_CREATOR=0xYourAddress // Public key associated with the private key above
```
## **🚀 Running the Project**

### **Deploy Contracts & Start Relayer**
```sh
npm run deployContracts
```
Deploys the `IntentVerification` and `MockSepoliaPayment` contracts and starts the relayer in a new terminal.

### **Run the Full Intent Claim Flow**
***Note: Be sure to adjust the `INTENT_ID` in the `.env` when running this script multiple times on the same test contract.***
This command executes the full process resulting in a sucessfull Intent fulfillment and payment claim:
```sh
npm run intentClaimFlow
```
This automatically runs the following commands sequentially:
1.  `npm run createIntent` - Creates an intent on t1.
2.  `npm run queryIntent` - Queries the created intent.
3.  `npm run claimIntent` - A filler claims the intent.
4.  `npm run fulfillIntent` - The filler transfers funds on Sepolia.
5.  `npm run queryIntent` - Queries the intent again to verify fulfillment.
6.  `npm run claimPayment` - The filler claims their reward.

### **Run the Full Intent Expiration Flow**
***Note: Be sure to adjust the `INTENT_ID` in the `.env` when running this script multiple times on the same test contract.***
Simulates the full Intent lifecyle in the case that an Intent was claimed by a Filler but not completed in time
```sh
npm run intentExpireFlow
```
This automatically runs the following commands sequentially:
1.  `npm run createIntent` - Creates an intent on t1.
2.  `npm run queryIntent` - Queries the created intent.
3.  `npm run claimIntent` - A filler claims the intent.
4.  `npm run queryIntent` - Queries the intent.
5.  `npm run closeExpiredIntent` - Waits for expiration and closes the intent.

### **Run Tests for the Full Claim Path**
***Note: Be sure to adjust the `INTENT_ID` in the `.env` when running this script multiple times on the same test contract.***
This command deploys contracts, starts the relayer and runs the full intent claim flow:
```sh
npm run testClaimPath
```
This automatically runs the following commands sequentially:
1.  `npm run deployContracts` - Deploy Contracts & Start Relayer (see above)
2.  `npm run intentClaimFlow` - Run the Full Intent Claim Flow (see above)

### **Run Tests for the Expired Intent Path**
***Note: Be sure to adjust the `INTENT_ID` in the `.env` when running this script multiple times on the same test contract.***
This command deploys contracts, starts the relayer and runs the expiration flow:
```sh
npm run testExpirePath
```
This automatically runs the following commands sequentially:
1.  `npm run deployContracts` - Deploy Contracts & Start Relayer (see above)
2.  `npm run intentExpireFlow` - Run the Full Intent Claim Flow (see above)

### **Individual Script Explanations**

-   `startRelayer`: Runs the relayer script.
-   `startRelayerDetached`: Starts the relayer in a new terminal.
-   `deployContracts`: Deploys all contracts and starts the relayer.
-   `deployIntentVerification`: Deploys `IntentVerification` contract.
-   `deployMockSepolia`: Deploys `MockSepoliaPayment` contract.
-   `createIntent`: Creates an intent on t1.
-   `claimIntent`: Claims an intent by a filler.
-   `fulfillIntent`: Fulfills an intent on Sepolia.
-   `queryIntent`: Fetches details of an intent.
-   `claimPayment`: Claims the filler’s payment once verified.
-   `closeExpiredIntent`: Closes an expired intent and refunds.
-   `withdrawAndDisable`: Withdraws funds and disables the contract.

### **🧪 Running Tests**
Run full suite of Hardhat Tests:
```sh
npx hardhat test
```
----------

## 📌 Future Improvements

### Storage & Gas Optimization

-   Remove fulfilled or expired intents to free storage.
-   Use event-based tracking (The Graph) instead of on-chain queries.
-   Implement pagination for fetching multiple intents efficiently.

### Execution Cost Scaling

-   Avoid looping through large datasets to prevent high gas costs.
-   Move Intent data off-chain where possible.
-   Cap the number of active intents per user to prevent overuse.

### ETH Balance Management

-   Enforce a small mandatory Filler fee to prevent spam.

### Spam Prevention & Security

-   Batch-close expired intents in a single transaction.
-   Use Chainlink Keepers or bots to automatically close expired intents.

### Event Verification

-   Use cross-chain messaging instead of a centralized relayer.

----------