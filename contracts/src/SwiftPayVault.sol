// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title SwiftPayVault
 * @author SwiftPay Team
 * @notice Secure vault for holding merchant settlements from SwiftPay Hub
 * @dev Implements OpenZeppelin security patterns:
 *      - ReentrancyGuard: Prevents reentrancy attacks
 *      - Ownable: Owner-only admin functions
 *      - SafeERC20: Safe token transfers
 *      - Pausable: Emergency pause capability
 */

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract SwiftPayVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // ERRORS
    // ============================================

    error ZeroAddress();
    error ZeroAmount();
    error InsufficientBalance();
    error InvalidSettlement();
    error SettlementAlreadyProcessed();
    error UnauthorizedHub();
    error WithdrawalFailed();

    // ============================================
    // EVENTS
    // ============================================

    event HubUpdated(address indexed oldHub, address indexed newHub);
    event TokenWhitelisted(address indexed token, bool status);
    event SettlementReceived(
        bytes32 indexed settlementId,
        address indexed merchant,
        address indexed token,
        uint256 amount
    );
    event MerchantWithdrawal(
        address indexed merchant,
        address indexed token,
        uint256 amount,
        address recipient
    );
    event EmergencyWithdrawal(
        address indexed token,
        uint256 amount,
        address indexed recipient
    );

    // ============================================
    // STATE VARIABLES
    // ============================================

    /// @notice The Hub address authorized to submit settlements
    address public hub;

    /// @notice Mapping of merchant address => token address => balance
    mapping(address => mapping(address => uint256)) public merchantBalances;

    /// @notice Mapping of settlement ID => processed status
    mapping(bytes32 => bool) public processedSettlements;

    /// @notice Mapping of whitelisted tokens
    mapping(address => bool) public whitelistedTokens;

    /// @notice Total deposits per token (for accounting)
    mapping(address => uint256) public totalDeposits;

    // ============================================
    // CONSTRUCTOR
    // ============================================

    /**
     * @notice Initialize the vault with Hub address and owner
     * @param _hub The SwiftPay Hub address authorized to submit settlements
     * @param _owner The owner address for admin functions
     */
    constructor(address _hub, address _owner) Ownable(_owner) {
        if (_hub == address(0)) revert ZeroAddress();
        if (_owner == address(0)) revert ZeroAddress();

        hub = _hub;
        emit HubUpdated(address(0), _hub);
    }

    // ============================================
    // MODIFIERS
    // ============================================

    /// @notice Ensures only the Hub can call this function
    modifier onlyHub() {
        if (msg.sender != hub) revert UnauthorizedHub();
        _;
    }

    /// @notice Ensures amount is not zero
    modifier nonZeroAmount(uint256 amount) {
        if (amount == 0) revert ZeroAmount();
        _;
    }

    /// @notice Ensures address is not zero
    modifier nonZeroAddress(address addr) {
        if (addr == address(0)) revert ZeroAddress();
        _;
    }

    // ============================================
    // SETTLEMENT FUNCTIONS
    // ============================================

    /**
     * @notice Receive a settlement from the Hub and credit merchant balance
     * @dev Can only be called by the authorized Hub address
     * @param settlementId Unique identifier for this settlement (prevents replay)
     * @param merchant The merchant address to credit
     * @param token The ERC20 token address being deposited
     * @param amount The amount of tokens being deposited
     */
    function receiveSettlement(
        bytes32 settlementId,
        address merchant,
        address token,
        uint256 amount
    )
        external
        onlyHub
        nonReentrant
        whenNotPaused
        nonZeroAddress(merchant)
        nonZeroAddress(token)
        nonZeroAmount(amount)
    {
        // Check settlement hasn't been processed
        if (processedSettlements[settlementId]) {
            revert SettlementAlreadyProcessed();
        }

        // Mark settlement as processed BEFORE external calls (CEI pattern)
        processedSettlements[settlementId] = true;

        // Transfer tokens from Hub to Vault
        // Hub must have approved this contract first
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        // Credit merchant balance
        merchantBalances[merchant][token] += amount;
        totalDeposits[token] += amount;

        emit SettlementReceived(settlementId, merchant, token, amount);
    }

    /**
     * @notice Receive settlement with direct deposit (tokens sent directly to vault)
     * @dev For use with LI.FI or other aggregators that send tokens directly
     * @param settlementId Unique identifier for this settlement
     * @param merchant The merchant address to credit
     * @param token The ERC20 token address
     * @param amount The expected amount (verified against actual balance change)
     */
    function receiveDirectSettlement(
        bytes32 settlementId,
        address merchant,
        address token,
        uint256 amount
    )
        external
        onlyHub
        nonReentrant
        whenNotPaused
        nonZeroAddress(merchant)
        nonZeroAddress(token)
        nonZeroAmount(amount)
    {
        // Check settlement hasn't been processed
        if (processedSettlements[settlementId]) {
            revert SettlementAlreadyProcessed();
        }

        // Mark settlement as processed
        processedSettlements[settlementId] = true;

        // Verify the vault actually has enough tokens
        // This is for settlements where tokens are sent directly (e.g., LI.FI callback)
        uint256 vaultBalance = IERC20(token).balanceOf(address(this));
        uint256 expectedMinBalance = totalDeposits[token] + amount;

        if (vaultBalance < expectedMinBalance) {
            revert InsufficientBalance();
        }

        // Credit merchant balance
        merchantBalances[merchant][token] += amount;
        totalDeposits[token] += amount;

        emit SettlementReceived(settlementId, merchant, token, amount);
    }

    // ============================================
    // WITHDRAWAL FUNCTIONS
    // ============================================

    /**
     * @notice Allow merchant to withdraw their balance
     * @param token The token address to withdraw
     * @param amount The amount to withdraw
     * @param recipient The address to receive the tokens
     */
    function withdraw(
        address token,
        uint256 amount,
        address recipient
    )
        external
        nonReentrant
        whenNotPaused
        nonZeroAddress(token)
        nonZeroAddress(recipient)
        nonZeroAmount(amount)
    {
        address merchant = msg.sender;

        // Check merchant has sufficient balance
        uint256 balance = merchantBalances[merchant][token];
        if (balance < amount) {
            revert InsufficientBalance();
        }

        // Update state BEFORE external call (CEI pattern)
        merchantBalances[merchant][token] = balance - amount;
        totalDeposits[token] -= amount;

        // Transfer tokens to recipient
        IERC20(token).safeTransfer(recipient, amount);

        emit MerchantWithdrawal(merchant, token, amount, recipient);
    }

    /**
     * @notice Withdraw entire balance of a token
     * @param token The token address to withdraw
     * @param recipient The address to receive the tokens
     */
    function withdrawAll(
        address token,
        address recipient
    )
        external
        nonReentrant
        whenNotPaused
        nonZeroAddress(token)
        nonZeroAddress(recipient)
    {
        address merchant = msg.sender;
        uint256 balance = merchantBalances[merchant][token];
        if (balance == 0) revert ZeroAmount();

        // Update state BEFORE external call (CEI pattern)
        merchantBalances[merchant][token] = 0;
        totalDeposits[token] -= balance;

        // Transfer tokens to recipient
        IERC20(token).safeTransfer(recipient, balance);

        emit MerchantWithdrawal(merchant, token, balance, recipient);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    /**
     * @notice Get merchant's balance for a specific token
     * @param merchant The merchant address
     * @param token The token address
     * @return The balance amount
     */
    function getBalance(
        address merchant,
        address token
    ) external view returns (uint256) {
        return merchantBalances[merchant][token];
    }

    /**
     * @notice Check if a settlement has been processed
     * @param settlementId The settlement ID to check
     * @return True if already processed
     */
    function isSettlementProcessed(
        bytes32 settlementId
    ) external view returns (bool) {
        return processedSettlements[settlementId];
    }

    // ============================================
    // ADMIN FUNCTIONS
    // ============================================

    /**
     * @notice Update the Hub address
     * @param newHub The new Hub address
     */
    function setHub(address newHub) external onlyOwner nonZeroAddress(newHub) {
        address oldHub = hub;
        hub = newHub;
        emit HubUpdated(oldHub, newHub);
    }

    /**
     * @notice Add or remove a token from the whitelist
     * @param token The token address
     * @param status True to whitelist, false to remove
     */
    function setTokenWhitelist(
        address token,
        bool status
    ) external onlyOwner nonZeroAddress(token) {
        whitelistedTokens[token] = status;
        emit TokenWhitelisted(token, status);
    }

    /**
     * @notice Pause the contract in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal by owner (only for stuck tokens)
     * @dev Should only be used if tokens are stuck and not accounted for
     * @param token The token to withdraw
     * @param amount The amount to withdraw
     * @param recipient The recipient address
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address recipient
    )
        external
        onlyOwner
        nonReentrant
        nonZeroAddress(token)
        nonZeroAddress(recipient)
        nonZeroAmount(amount)
    {
        // Transfer tokens
        IERC20(token).safeTransfer(recipient, amount);

        emit EmergencyWithdrawal(token, amount, recipient);
    }

    // ============================================
    // RECEIVE FUNCTION
    // ============================================

    /**
     * @notice Reject direct ETH transfers
     * @dev This vault only handles ERC20 tokens
     */
    receive() external payable {
        revert("ETH not accepted");
    }
}
