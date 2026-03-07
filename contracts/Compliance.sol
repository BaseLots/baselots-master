// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @notice Interface for the Identity Registry contract
 */
interface IIdentityRegistry {
    function isVerified(address user) external view returns (bool);
    function isAccredited(address user) external view returns (bool);
}

/**
 * @title Compliance
 * @dev Modular compliance engine for BaseLotsToken
 * Enforces transfer rules, holding periods, and investment limits
 * @author BaseLots Team
 */
contract Compliance is AccessControl {
    
    /// @notice Role for compliance agents who can freeze addresses
    bytes32 public constant COMPLIANCE_AGENT = keccak256("COMPLIANCE_AGENT");
    /// @notice Role for rule administrators
    bytes32 public constant RULE_ADMIN = keccak256("RULE_ADMIN");
    
    /// @notice Identity registry contract
    IIdentityRegistry public identityRegistry;
    
    /**
     * @notice Rule configuration struct
     * @param active Whether rule is active
     * @param param1 Flexible parameter 1
     * @param param2 Flexible parameter 2
     */
    struct Rule {
        bool active;
        uint256 param1;
        uint256 param2;
    }
    
    /// @notice Rule types
    mapping(bytes32 => Rule) public rules;
    
    /// @notice Frozen addresses (compliance-level)
    mapping(address => bool) public frozen;
    
    /// @notice First investment time per investor
    mapping(address => uint256) public firstInvestmentTime;
    /// @notice Total invested per investor
    mapping(address => uint256) public totalInvested;
    
    /// @notice Maximum balance percentage rule
    bytes32 public constant MAX_BALANCE_RULE = keccak256("MAX_BALANCE");
    /// @notice Investor count limit rule
    bytes32 public constant INVESTOR_COUNT_RULE = keccak256("INVESTOR_COUNT");
    /// @notice Minimum investment rule
    bytes32 public constant MIN_INVESTMENT_RULE = keccak256("MIN_INVESTMENT");
    /// @notice Holding period rule
    bytes32 public constant HOLDING_PERIOD_RULE = keccak256("HOLDING_PERIOD");
    /// @notice Country restriction rule
    bytes32 public constant COUNTRY_RULE = keccak256("COUNTRY");
    
    /// @notice Maximum balance percentage (default 10%)
    uint256 public maxBalancePercentage = 10;
    /// @notice Maximum investors (Reg CF limit, default 500)
    uint256 public maxInvestors = 500;
    /// @notice Minimum investment (default $100 in token units)
    uint256 public minInvestment = 100 * 10**18;
    /// @notice Holding period (default 12 months)
    uint256 public holdingPeriod = 365 days;
    
    /// @notice Total investor count
    uint256 public totalInvestors;
    /// @notice Mapping of registered investors
    mapping(address => bool) public isInvestor;
    
    /// @notice Emitted when rule is updated
    event RuleUpdated(bytes32 indexed ruleType, bool active, uint256 param1, uint256 param2);
    /// @notice Emitted when address freeze status changes
    event AddressFrozen(address indexed user, bool frozen);
    /// @notice Emitted when investment is tracked
    event InvestmentTracked(address indexed investor, uint256 amount);
    
    /**
     * @notice Contract constructor
     * @param _identityRegistry Address of identity registry contract
     */
    constructor(address _identityRegistry) {
        require(_identityRegistry != address(0), "Invalid registry");
        identityRegistry = IIdentityRegistry(_identityRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(COMPLIANCE_AGENT, msg.sender);
        _grantRole(RULE_ADMIN, msg.sender);
        
        // Activate default rules
        rules[MAX_BALANCE_RULE] = Rule(true, 10, 0);      // 10% max
        rules[INVESTOR_COUNT_RULE] = Rule(true, 500, 0);  // 500 max
        rules[MIN_INVESTMENT_RULE] = Rule(true, 100 * 10**18, 0); // $100 min
        rules[HOLDING_PERIOD_RULE] = Rule(true, 365 days, 0); // 12 months
        rules[COUNTRY_RULE] = Rule(true, 0, 0);           // US only (param logic)
    }
    
    // ============ Transfer Validation ============
    
    /**
     * @notice Check if a transfer is compliant (view function, no state changes)
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return allowed Whether transfer is allowed
     */
    function canTransfer(address from, address to, uint256 amount) external view returns (bool) {
        // Skip checks for minting (from == address(0))
        if (from == address(0)) {
            return _canMintView(to, amount);
        }
        
        // Skip checks for burning (to == address(0))
        if (to == address(0)) {
            return !frozen[from];
        }
        
        // Standard transfer checks
        if (frozen[from] || frozen[to]) return false;
        if (!identityRegistry.isVerified(from) || !identityRegistry.isVerified(to)) return false;
        
        return true;
    }
    
    /**
     * @notice Track investment after mint (state-changing)
     * @param to Recipient address
     * @param amount Amount minted
     */
    function trackMint(address to, uint256 amount) external returns (bool) {
        if (frozen[to]) return false;
        if (!identityRegistry.isVerified(to)) return false;
        
        Rule storage minRule = rules[MIN_INVESTMENT_RULE];
        if (minRule.active && amount < minRule.param1) return false;
        
        Rule storage countRule = rules[INVESTOR_COUNT_RULE];
        if (countRule.active && !isInvestor[to]) {
            if (totalInvestors >= countRule.param1) return false;
        }
        
        // Track new investor
        if (!isInvestor[to]) {
            isInvestor[to] = true;
            totalInvestors++;
            firstInvestmentTime[to] = block.timestamp;
        }
        
        totalInvested[to] += amount;
        emit InvestmentTracked(to, amount);
        
        return true;
    }
    
    /**
     * @notice Internal view function for mint validation
     * @param to Recipient address
     * @param amount Amount to mint
     * @return allowed Whether mint is allowed
     */
    function _canMintView(address to, uint256 amount) internal view returns (bool) {
        if (frozen[to]) return false;
        if (!identityRegistry.isVerified(to)) return false;
        
        Rule storage minRule = rules[MIN_INVESTMENT_RULE];
        if (minRule.active && amount < minRule.param1) return false;
        
        Rule storage countRule = rules[INVESTOR_COUNT_RULE];
        if (countRule.active && !isInvestor[to]) {
            if (totalInvestors >= countRule.param1) return false;
        }
        
        return true;
    }
    
    // ============ Pre-Transfer Checks ============
    
    /**
     * @notice Check if user is within max balance limit
     * @param user User address
     * @param currentBalance Current balance
     * @param totalSupply Total token supply
     * @return withinLimit Whether within limit
     */
    function checkMaxBalance(address user, uint256 currentBalance, uint256 totalSupply) external view returns (bool) {
        Rule storage rule = rules[MAX_BALANCE_RULE];
        if (!rule.active) return true;
        
        uint256 maxBalance = (totalSupply * rule.param1) / 100;
        return currentBalance <= maxBalance;
    }
    
    /**
     * @notice Check if holding period has passed
     * @param user User address
     * @return canTransfer Whether holding period has passed
     */
    function checkHoldingPeriod(address user) external view returns (bool) {
        Rule storage rule = rules[HOLDING_PERIOD_RULE];
        if (!rule.active) return false;
        
        uint256 firstInvestment = firstInvestmentTime[user];
        if (firstInvestment == 0) return true;
        
        return block.timestamp >= firstInvestment + rule.param1;
    }
    
    // ============ Rule Management ============
    
    /**
     * @notice Set a rule configuration
     * @param ruleType Rule identifier
     * @param active Whether rule is active
     * @param param1 Parameter 1
     * @param param2 Parameter 2
     */
    function setRule(
        bytes32 ruleType,
        bool active,
        uint256 param1,
        uint256 param2
    ) external onlyRole(RULE_ADMIN) {
        rules[ruleType] = Rule(active, param1, param2);
        emit RuleUpdated(ruleType, active, param1, param2);
    }
    
    /**
     * @notice Set max balance percentage
     * @param percentage New percentage (0-100)
     */
    function setMaxBalancePercentage(uint256 percentage) external onlyRole(RULE_ADMIN) {
        require(percentage <= 100, "Invalid percentage");
        rules[MAX_BALANCE_RULE].param1 = percentage;
        emit RuleUpdated(MAX_BALANCE_RULE, rules[MAX_BALANCE_RULE].active, percentage, 0);
    }
    
    /**
     * @notice Set max investors
     * @param _max New maximum
     */
    function setMaxInvestors(uint256 _max) external onlyRole(RULE_ADMIN) {
        rules[INVESTOR_COUNT_RULE].param1 = _max;
        emit RuleUpdated(INVESTOR_COUNT_RULE, rules[INVESTOR_COUNT_RULE].active, _max, 0);
    }
    
    /**
     * @notice Set minimum investment
     * @param amount New minimum amount
     */
    function setMinInvestment(uint256 amount) external onlyRole(RULE_ADMIN) {
        rules[MIN_INVESTMENT_RULE].param1 = amount;
        emit RuleUpdated(MIN_INVESTMENT_RULE, rules[MIN_INVESTMENT_RULE].active, amount, 0);
    }
    
    /**
     * @notice Set holding period
     * @param period New period in seconds
     */
    function setHoldingPeriod(uint256 period) external onlyRole(RULE_ADMIN) {
        rules[HOLDING_PERIOD_RULE].param1 = period;
        emit RuleUpdated(HOLDING_PERIOD_RULE, rules[HOLDING_PERIOD_RULE].active, period, 0);
    }
    
    // ============ Freeze Functions ============
    
    /**
     * @notice Freeze or unfreeze an address
     * @param user Address to freeze/unfreeze
     * @param _frozen New freeze status
     */
    function setFrozen(address user, bool _frozen) external onlyRole(COMPLIANCE_AGENT) {
        frozen[user] = _frozen;
        emit AddressFrozen(user, _frozen);
    }
    
    /**
     * @notice Batch freeze/unfreeze addresses
     * @param users Array of addresses
     * @param _frozen New freeze status
     */
    function batchFreeze(address[] calldata users, bool _frozen) external onlyRole(COMPLIANCE_AGENT) {
        uint256 len = users.length;
        for (uint i = 0; i < len; i++) {
            frozen[users[i]] = _frozen;
            emit AddressFrozen(users[i], _frozen);
        }
    }
    
    /**
     * @notice Check if address is frozen
     * @param user Address to check
     * @return isFrozen Whether frozen
     */
    function isFrozen(address user) external view returns (bool) {
        return frozen[user];
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get rule configuration
     * @param ruleType Rule identifier
     * @return active Whether active
     * @return param1 Parameter 1
     * @return param2 Parameter 2
     */
    function getRule(bytes32 ruleType) external view returns (bool active, uint256 param1, uint256 param2) {
        Rule storage rule = rules[ruleType];
        return (rule.active, rule.param1, rule.param2);
    }
    
    /**
     * @notice Check if user can sell (holding period passed)
     * @param user User address
     * @return canSell Whether can sell
     */
    function canSell(address user) external view returns (bool) {
        return this.checkHoldingPeriod(user);
    }
    
    /**
     * @notice Get investment info for a user
     * @param user User address
     * @return firstInvestment First investment timestamp
     * @return totalAmount Total invested amount
     * @return canTransfer Whether can transfer (holding period passed)
     */
    function getInvestmentInfo(address user) external view returns (
        uint256 firstInvestment,
        uint256 totalAmount,
        bool canTransfer
    ) {
        return (
            firstInvestmentTime[user],
            totalInvested[user],
            this.checkHoldingPeriod(user)
        );
    }
}
