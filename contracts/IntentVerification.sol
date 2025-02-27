// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IntentVerification
 * @dev A smart contract for verifying and settling cross-chain intent-based payments. 
 */
contract IntentVerification {
    /// @notice Represents an intent created by a user.
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

    uint256 public intentIdCount; // Auto-incrementing intent ID
    mapping(uint256 => Intent) public intents; // Mapping of intentId to Intent

    address public owner; // Contract owner (deploying address)
    uint256 public claimTimeout = 1 * 60; // Time limit for Filler to complete
    uint256 public minDeposit = 0.005 ether; // Minimum deposit required to claim an intent. 

    /// @notice Events
    event IntentCreated(uint256 indexed intentId, address indexed creator, address recipient, uint256 amount, uint256 fee);
    event IntentClaimed(uint256 indexed intentId, address indexed filler, uint256 deposit);
    event IntentFulfilled(uint256 indexed intentId, address indexed filler, uint256 amount);
    event FillerPaid(uint256 indexed intentId, address indexed filler, uint256 totalPayout);
    event IntentClosed(uint256 indexed intentId, address indexed creator, uint256 refund);
    event ContractDisabled(address indexed owner, uint256 balanceWithdrawn);

    /// @dev Restricts function access to the contract owner.
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    /// @dev Contract constructor sets the deployer as the owner.
    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Creates a new intent.
     * @param recipient The recipient on the destination chain.
     * @param amount The expected amount to be received.
     * @param fee The fee offered to the filler.
     */
    function createIntent(address recipient, uint256 amount, uint256 fee) external payable {
        require(msg.value == fee, "Must send exact fee");

        uint256 intentId = intentIdCount;
        intents[intentId] = Intent({
            creator: msg.sender,
            recipient: recipient,
            amount: amount,
            fee: fee,
            filler: address(0),
            deposit: 0,
            claimTimestamp: 0,
            fulfilled: false
        });

        intentIdCount++;

        emit IntentCreated(intentId, msg.sender, recipient, amount, fee);
    }

    /**
     * @notice Claims an open intent by providing a deposit. Prevents protential for double fillers 
     * @param intentId The ID of the intent to claim.
     */
    function claimIntent(uint256 intentId) external payable {
        Intent storage intent = intents[intentId];

        require(intent.amount > 0, "Intent does not exist");
        require(intent.filler == address(0), "Intent already claimed");
        require(msg.value >= minDeposit, "Deposit must be at least 0.005 ETH");

        intent.filler = msg.sender;
        intent.deposit = msg.value;
        intent.claimTimestamp = block.timestamp;

        emit IntentClaimed(intentId, msg.sender, msg.value);
    }

    /**
     * @notice Verifies the fulfillment of an intent.
     * @dev This function must be called by an off-chain relayer or validator.
     * @param intentId The ID of the intent being verified.
     * @param amount The amount that was actually delivered to the recipient.
     */
    function verifyFill(uint256 intentId, uint256 amount) external onlyOwner {
        Intent storage intent = intents[intentId];

        require(intent.filler != address(0), "Intent not claimed yet");
        require(!intent.fulfilled, "Intent already fulfilled");
        require(amount >= (intent.amount * 99) / 100, "Amount too low");

        intent.fulfilled = true;

        emit IntentFulfilled(intentId, intent.filler, amount);
    }

    /**
     * @notice Allows the filler to claim their payment after successful fulfillment.
     * @param intentId The ID of the fulfilled intent.
     */
    function claimPayment(uint256 intentId) external {
        Intent storage intent = intents[intentId];

        require(intent.fulfilled, "Intent not fulfilled yet");
        require(msg.sender == intent.filler, "Only filler can claim");

        uint256 payout = intent.fee + intent.deposit;
        intent.amount = 0;

        payable(msg.sender).transfer(payout);

        emit FillerPaid(intentId, msg.sender, payout);
    }

    /**
     * @notice Allows the intent creator to close an expired intent and reclaim their funds.
     * @param intentId The ID of the expired intent.
     */
    function closeExpiredIntent(uint256 intentId) external {
        Intent storage intent = intents[intentId];

        require(msg.sender == intent.creator, "Only creator can close");
        require(intent.filler != address(0), "Intent not claimed yet");
        require(block.timestamp > intent.claimTimestamp + claimTimeout, "Intent still active");
        require(!intent.fulfilled, "Intent already fulfilled");

        uint256 refundAmount = intent.fee + intent.deposit;
        intent.amount = 0;

        payable(intent.creator).transfer(refundAmount);

        emit IntentClosed(intentId, msg.sender, refundAmount);
    }

    /**
     * @notice Disables the contract by withdrawing all funds to the owner.
     * @dev This replaces `selfdestruct` since it is deprecated.
     */
    function withdrawAndDisable() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);

        emit ContractDisabled(owner, balance);
    }

    /// @dev Allows the contract to receive ETH.
    receive() external payable {}
}
