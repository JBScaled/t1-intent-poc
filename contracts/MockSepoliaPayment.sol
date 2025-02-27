// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title MockSepoliaPayment
 * @dev Simulates a payment contract on Sepolia that logs intent fulfillment events.
 */
contract MockSepoliaPayment {
    /**
     * @dev Emitted when an intent is fulfilled on Sepolia.
     * @param intentId The unique ID of the fulfilled intent.
     * @param filler The address that fulfilled the intent.
     * @param recipient The address receiving the payment.
     * @param amount The amount of ETH sent.
     * @param timestamp The timestamp of the transaction.
     */
    event IntentFulfilled(
        uint256 indexed intentId,
        address indexed filler,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Fulfills an intent by sending ETH to the recipient.
     * @param intentId The ID of the intent being fulfilled.
     * @param recipient The address receiving the ETH.
     */
    function fulfillIntent(uint256 intentId,address recipient) external payable {
        require(msg.value > 0, "Must send ETH");
        require(recipient != address(0), "Invalid recipient");

        // Emit event to log the fulfillment on Sepolia
        emit IntentFulfilled(
            intentId,
            msg.sender,
            recipient,
            msg.value,
            block.timestamp
        );
    }
}
