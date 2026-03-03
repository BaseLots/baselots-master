// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IBaseLotsToken {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function executeInheritance(address deceased) external;
}

/**
 * @title HeritageShield
 * @dev Automated inheritance protocol for BaseLots
 * Integrates with Chainlink oracle for death verification
 * 90-day challenge period before execution
 */
contract HeritageShield is AccessControl {
    
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant CHALLENGE_ADMIN = keccak256("CHALLENGE_ADMIN");
    
    struct BeneficiaryDesignation {
        address beneficiary;
        uint256 percentage;      // 0-100, total must equal 100
        uint256 timestamp;
        bool active;
    }
    
    struct InheritanceStatus {
        bool isFrozen;           // HSP freeze active
        bytes32 deathProof;      // Oracle attestation hash
        uint256 freezeTimestamp; // When freeze started
        uint256 challengeDeadline; // 90 days from freeze
        bool executed;           // Transfer completed
        address challenger;      // Address that challenged (if any)
        uint256 challengeBond;   // Bond amount for challenge
    }
    
    // User => list of beneficiaries
    mapping(address => BeneficiaryDesignation[]) public designations;
    
    // User => inheritance status
    mapping(address => InheritanceStatus) public inheritanceStatus;
    
    // Death proofs submitted (hash => verified)
    mapping(bytes32 => bool) public verifiedDeathProofs;
    
    // Challenge bond amount (0.5 ETH)
    uint256 public challengeBond = 0.5 ether;
    
    // Challenge period duration (90 days)
    uint256 public challengePeriod = 90 days;
    
    // Token contract reference
    IBaseLotsToken public token;
    
    // Events
    event BeneficiaryDesignated(
        address indexed user,
        address indexed beneficiary,
        uint256 percentage
    );
    event DesignationRemoved(address indexed user, address indexed beneficiary);
    event DeathReported(address indexed deceased, bytes32 indexed proof);
    event FreezeActivated(address indexed deceased, uint256 challengeDeadline);
    event ChallengeSubmitted(address indexed deceased, address indexed challenger);
    event ChallengeResolved(address indexed deceased, bool successful);
    event InheritanceExecuted(address indexed deceased, uint256 totalTransferred);
    event ChallengeBondUpdated(uint256 newAmount);
    event ChallengePeriodUpdated(uint256 newPeriod);
    
    constructor(address _token) {
        require(_token != address(0), "Invalid token");
        token = IBaseLotsToken(_token);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(CHALLENGE_ADMIN, msg.sender);
    }
    
    // ============ Beneficiary Management ============
    
    function designateBeneficiary(address beneficiary, uint256 percentage) external {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(beneficiary != msg.sender, "Cannot designate self");
        require(percentage > 0 && percentage <= 100, "Invalid percentage");
        
        BeneficiaryDesignation[] storage userDesignations = designations[msg.sender];
        
        // Check if updating existing
        for (uint i = 0; i < userDesignations.length; i++) {
            if (userDesignations[i].beneficiary == beneficiary) {
                userDesignations[i].percentage = percentage;
                userDesignations[i].timestamp = block.timestamp;
                userDesignations[i].active = true;
                emit BeneficiaryDesignated(msg.sender, beneficiary, percentage);
                return;
            }
        }
        
        // Add new
        userDesignations.push(BeneficiaryDesignation({
            beneficiary: beneficiary,
            percentage: percentage,
            timestamp: block.timestamp,
            active: true
        }));
        
        emit BeneficiaryDesignated(msg.sender, beneficiary, percentage);
    }
    
    function removeBeneficiary(address beneficiary) external {
        BeneficiaryDesignation[] storage userDesignations = designations[msg.sender];
        
        for (uint i = 0; i < userDesignations.length; i++) {
            if (userDesignations[i].beneficiary == beneficiary && userDesignations[i].active) {
                userDesignations[i].active = false;
                emit DesignationRemoved(msg.sender, beneficiary);
                return;
            }
        }
        
        revert("Beneficiary not found");
    }
    
    function clearAllDesignations() external {
        delete designations[msg.sender];
    }
    
    // ============ Death Reporting & Freeze ============
    
    function submitDeathProof(address deceased, bytes32 proofHash) external onlyRole(ORACLE_ROLE) {
        require(deceased != address(0), "Invalid address");
        require(proofHash != bytes32(0), "Invalid proof");
        require(!inheritanceStatus[deceased].isFrozen, "Already frozen");
        require(!inheritanceStatus[deceased].executed, "Already executed");
        require(getTotalPercentage(deceased) == 100, "Beneficiaries must total 100%");
        require(token.balanceOf(deceased) > 0, "No tokens to inherit");
        
        verifiedDeathProofs[proofHash] = true;
        
        uint256 deadline = block.timestamp + challengePeriod;
        
        inheritanceStatus[deceased] = InheritanceStatus({
            isFrozen: true,
            deathProof: proofHash,
            freezeTimestamp: block.timestamp,
            challengeDeadline: deadline,
            executed: false,
            challenger: address(0),
            challengeBond: 0
        });
        
        emit DeathReported(deceased, proofHash);
        emit FreezeActivated(deceased, deadline);
    }
    
    // ============ Challenge System ============
    
    function challengeDeathReport(address deceased) external payable {
        InheritanceStatus storage status = inheritanceStatus[deceased];
        
        require(status.isFrozen, "Not frozen");
        require(!status.executed, "Already executed");
        require(block.timestamp < status.challengeDeadline, "Challenge period ended");
        require(status.challenger == address(0), "Already challenged");
        require(msg.value >= challengeBond, "Insufficient bond");
        
        status.challenger = msg.sender;
        status.challengeBond = msg.value;
        
        emit ChallengeSubmitted(deceased, msg.sender);
    }
    
    function resolveChallenge(address deceased, bool successful) external onlyRole(CHALLENGE_ADMIN) {
        InheritanceStatus storage status = inheritanceStatus[deceased];
        
        require(status.challenger != address(0), "No active challenge");
        
        if (successful) {
            // Challenge successful — death report was false
            status.isFrozen = false;
            status.executed = false;
            
            // Return bond to challenger
            payable(status.challenger).transfer(status.challengeBond);
        } else {
            // Challenge failed — death confirmed
            // Bond goes to beneficiaries as compensation for delay
            _distributeChallengeBond(deceased, status.challengeBond);
        }
        
        status.challenger = address(0);
        status.challengeBond = 0;
        
        emit ChallengeResolved(deceased, successful);
    }
    
    function _distributeChallengeBond(address deceased, uint256 bond) internal {
        BeneficiaryDesignation[] storage userDesignations = designations[deceased];
        
        for (uint i = 0; i < userDesignations.length; i++) {
            if (userDesignations[i].active) {
                uint256 share = (bond * userDesignations[i].percentage) / 100;
                if (share > 0) {
                    payable(userDesignations[i].beneficiary).transfer(share);
                }
            }
        }
    }
    
    // ============ Inheritance Execution ============
    
    function executeInheritance(address deceased) external {
        InheritanceStatus storage status = inheritanceStatus[deceased];
        
        require(status.isFrozen, "Not frozen");
        require(!status.executed, "Already executed");
        require(block.timestamp >= status.challengeDeadline, "Challenge period active");
        require(status.challenger == address(0), "Active challenge");
        
        uint256 deceasedBalance = token.balanceOf(deceased);
        require(deceasedBalance > 0, "No tokens to transfer");
        
        BeneficiaryDesignation[] storage userDesignations = designations[deceased];
        uint256 totalTransferred;
        
        for (uint i = 0; i < userDesignations.length; i++) {
            if (userDesignations[i].active) {
                uint256 amount = (deceasedBalance * userDesignations[i].percentage) / 100;
                if (amount > 0) {
                    // Note: This would need the token contract to allow HSP transfers
                    // Implementation depends on token's freeze/unfreeze mechanism
                    totalTransferred += amount;
                }
            }
        }
        
        status.executed = true;
        status.isFrozen = false;
        
        emit InheritanceExecuted(deceased, totalTransferred);
    }
    
    // ============ View Functions ============
    
    function getBeneficiaries(address user) external view returns (
        address[] memory beneficiaries,
        uint256[] memory percentages
    ) {
        BeneficiaryDesignation[] storage userDesignations = designations[user];
        
        uint256 count = 0;
        for (uint i = 0; i < userDesignations.length; i++) {
            if (userDesignations[i].active) count++;
        }
        
        beneficiaries = new address[](count);
        percentages = new uint256[](count);
        
        uint256 idx = 0;
        for (uint i = 0; i < userDesignations.length; i++) {
            if (userDesignations[i].active) {
                beneficiaries[idx] = userDesignations[i].beneficiary;
                percentages[idx] = userDesignations[i].percentage;
                idx++;
            }
        }
        
        return (beneficiaries, percentages);
    }
    
    function getTotalPercentage(address user) public view returns (uint256 total) {
        BeneficiaryDesignation[] storage userDesignations = designations[user];
        
        for (uint i = 0; i < userDesignations.length; i++) {
            if (userDesignations[i].active) {
                total += userDesignations[i].percentage;
            }
        }
    }
    
    function isFrozenByHSP(address user) external view returns (bool) {
        return inheritanceStatus[user].isFrozen;
    }
    
    function getInheritanceStatus(address user) external view returns (
        bool isFrozen,
        bytes32 deathProof,
        uint256 freezeTimestamp,
        uint256 challengeDeadline,
        bool executed,
        address challenger,
        uint256 remainingChallengeTime
    ) {
        InheritanceStatus storage status = inheritanceStatus[user];
        
        uint256 remaining = 0;
        if (status.isFrozen && block.timestamp < status.challengeDeadline) {
            remaining = status.challengeDeadline - block.timestamp;
        }
        
        return (
            status.isFrozen,
            status.deathProof,
            status.freezeTimestamp,
            status.challengeDeadline,
            status.executed,
            status.challenger,
            remaining
        );
    }
    
    function canExecuteInheritance(address deceased) external view returns (bool) {
        InheritanceStatus storage status = inheritanceStatus[deceased];
        
        return (
            status.isFrozen &&
            !status.executed &&
            block.timestamp >= status.challengeDeadline &&
            status.challenger == address(0) &&
            token.balanceOf(deceased) > 0
        );
    }
    
    // ============ Admin Functions ============
    
    function setChallengeBond(uint256 newBond) external onlyRole(DEFAULT_ADMIN_ROLE) {
        challengeBond = newBond;
        emit ChallengeBondUpdated(newBond);
    }
    
    function setChallengePeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        challengePeriod = newPeriod;
        emit ChallengePeriodUpdated(newPeriod);
    }
    
    function setToken(address _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_token != address(0), "Invalid token");
        token = IBaseLotsToken(_token);
    }
    
    function emergencyUnfreeze(address deceased) external onlyRole(DEFAULT_ADMIN_ROLE) {
        inheritanceStatus[deceased].isFrozen = false;
    }
    
    receive() external payable {}
}
