// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IIdentityRegistry {
    function isVerified(address user) external view returns (bool);
    function isAccredited(address user) external view returns (bool);
}

/**
 * @title Compliance
 * @dev Modular compliance engine for BaseLotsToken
 * Enforces transfer rules, holding periods, and investment limits
 */
contract Compliance is AccessControl {
    
    bytes32 public constant COMPLIANCE_AGENT = keccak256("COMPLIANCE_AGENT");
    bytes32 public constant RULE_ADMIN = keccak256("RULE_ADMIN");
    
    IIdentityRegistry public identityRegistry;
    
    // Transfer rules
    struct Rule {
        bool active;
        uint256 param1;  // Flexible param (e.g., max balance)
        uint256 param2;  // Flexible param (e.g., holding period)
    }
    
    // Rule types
    mapping(bytes32 => Rule) public rules;
    
    // Frozen addresses (compliance-level)
    mapping(address => bool) public frozen;
    
    // Investor tracking for Reg CF
    mapping(address => uint256) public firstInvestmentTime;
    mapping(address => uint256) public totalInvested;
    
    // Rule identifiers
    bytes32 public constant MAX_BALANCE_RULE = keccak256("MAX_BALANCE");
    bytes32 public constant INVESTOR_COUNT_RULE = keccak256("INVESTOR_COUNT");
    bytes32 public constant MIN_INVESTMENT_RULE = keccak256("MIN_INVESTMENT");
    bytes32 public constant HOLDING_PERIOD_RULE = keccak256("HOLDING_PERIOD");
    bytes32 public constant COUNTRY_RULE = keccak256("COUNTRY");
    
    // Default params
    uint256 public maxBalancePercentage = 10;  // 10% max per wallet
    uint256 public maxInvestors = 500;         // Reg CF limit
    uint256 public minInvestment = 100 * 10**18; // $100 in token units
    uint256 public holdingPeriod = 365 days;   // 12 month lockup
    
    uint256 public totalInvestors;
    mapping(address => bool) public isInvestor;
    
    // Events
    event RuleUpdated(bytes32 indexed ruleType, bool active, uint256 param1, uint256 param2);
    event AddressFrozen(address indexed user, bool frozen);
    event InvestmentTracked(address indexed investor, uint256 amount);
    
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
    
    function canTransfer(address from, address to, uint256 amount) external returns (bool) {
        // Skip checks for minting (from == address(0))
        if (from == address(0)) {
            return _canMint(to, amount);
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
    
    function _canMint(address to, uint256 amount) internal returns (bool) {
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
    
    // ============ Pre-Transfer Checks ============
    
    function checkMaxBalance(address user, uint256 currentBalance, uint256 totalSupply) external view returns (bool) {
        Rule storage rule = rules[MAX_BALANCE_RULE];
        if (!rule.active) return true;
        
        uint256 maxBalance = (totalSupply * rule.param1) / 100;
        return currentBalance <= maxBalance;
    }
    
    function checkHoldingPeriod(address user) external view returns (bool) {
        Rule storage rule = rules[HOLDING_PERIOD_RULE];
        if (!rule.active) return false; // Default to restrictive if active but no investment
        
        uint256 firstInvestment = firstInvestmentTime[user];
        if (firstInvestment == 0) return true; // No investment yet
        
        return block.timestamp >= firstInvestment + rule.param1;
    }
    
    // ============ Rule Management ============
    
    function setRule(
        bytes32 ruleType,
        bool active,
        uint256 param1,
        uint256 param2
    ) external onlyRole(RULE_ADMIN) {
        rules[ruleType] = Rule(active, param1, param2);
        emit RuleUpdated(ruleType, active, param1, param2);
    }
    
    function setMaxBalancePercentage(uint256 percentage) external onlyRole(RULE_ADMIN) {
        require(percentage <= 100, "Invalid percentage");
        rules[MAX_BALANCE_RULE].param1 = percentage;
        emit RuleUpdated(MAX_BALANCE_RULE, rules[MAX_BALANCE_RULE].active, percentage, 0);
    }
    
    function setMaxInvestors(uint256 _max) external onlyRole(RULE_ADMIN) {
        rules[INVESTOR_COUNT_RULE].param1 = _max;
        emit RuleUpdated(INVESTOR_COUNT_RULE, rules[INVESTOR_COUNT_RULE].active, _max, 0);
    }
    
    function setMinInvestment(uint256 amount) external onlyRole(RULE_ADMIN) {
        rules[MIN_INVESTMENT_RULE].param1 = amount;
        emit RuleUpdated(MIN_INVESTMENT_RULE, rules[MIN_INVESTMENT_RULE].active, amount, 0);
    }
    
    function setHoldingPeriod(uint256 period) external onlyRole(RULE_ADMIN) {
        rules[HOLDING_PERIOD_RULE].param1 = period;
        emit RuleUpdated(HOLDING_PERIOD_RULE, rules[HOLDING_PERIOD_RULE].active, period, 0);
    }
    
    // ============ Freeze Functions ============
    
    function setFrozen(address user, bool _frozen) external onlyRole(COMPLIANCE_AGENT) {
        frozen[user] = _frozen;
        emit AddressFrozen(user, _frozen);
    }
    
    function batchFreeze(address[] calldata users, bool _frozen) external onlyRole(COMPLIANCE_AGENT) {
        for (uint i = 0; i < users.length; i++) {
            frozen[users[i]] = _frozen;
            emit AddressFrozen(users[i], _frozen);
        }
    }
    
    function isFrozen(address user) external view returns (bool) {
        return frozen[user];
    }
    
    // ============ View Functions ============
    
    function getRule(bytes32 ruleType) external view returns (bool active, uint256 param1, uint256 param2) {
        Rule storage rule = rules[ruleType];
        return (rule.active, rule.param1, rule.param2);
    }
    
    function canSell(address user) external view returns (bool) {
        return this.checkHoldingPeriod(user);
    }
    
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
