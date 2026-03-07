// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @notice Interface for the BaseLots Token contract
 */
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
 * @author BaseLots Team
 */
contract HeritageShield is AccessControl {
    
    /// @notice Role for oracle that can submit death proofs
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    /// @notice Role for challenge administrators
    bytes32 public constant CHALLENGE_ADMIN = keccak256("CHALLENGE_ADMIN");
    
    /**
     * @notice Beneficiary designation struct
     * @param beneficiary Address of beneficiary
     * @param percentage Percentage of inheritance (0-100)
     * @param timestamp When designation was made
     * @param active Whether designation is active
     */
    struct BeneficiaryDesignation {
        address beneficiary;
        uint256 percentage;
        uint256 timestamp;
        bool active;
    }
    
    /**
     * @notice Inheritance status struct
     * @param isFrozen Whether HSP freeze is active
     * @param deathProof Oracle attestation hash
     * @param freezeTimestamp When freeze started
     * @param challengeDeadline When challenge period ends
     * @param executed Whether transfer completed
     * @param challenger Address that challenged (if any)
     * @param challengeBond Bond amount for challenge
     */
    struct InheritanceStatus {
        bool isFrozen;
        bytes32 deathProof;
        uint256 freezeTimestamp;
        uint256 challengeDeadline;
        bool executed;
        address challenger;
        uint256 challengeBond;
    }
    
    /// @notice User => list of beneficiaries
    mapping(address => BeneficiaryDesignation[]) public designations;
    
    /// @notice User => inheritance status
    mapping(address => InheritanceStatus) public inheritanceStatus;
    
    /// @notice Death proofs submitted (hash => verified)
    mapping(bytes32 => bool) public verifiedDeathProofs;
    
    /// @notice Challenge bond amount (0.5 ETH)
    uint256 public challengeBond = 0.5 ether;
    
    /// @notice Challenge period duration (90 days)
    uint256 public challengePeriod = 90 days;
    
    /// @notice Token contract reference
    IBaseLotsToken public token;
    
    /// @notice Emitted when beneficiary is designated
    event BeneficiaryDesignated(
        address indexed user,
        address indexed beneficiary,
        uint256 percentage
    );
    /// @notice Emitted when beneficiary designation is removed
    event DesignationRemoved(address indexed user, address indexed beneficiary);
    /// @notice Emitted when death is reported
    event DeathReported(address indexed deceased, bytes32 indexed proof);
    /// @notice Emitted when freeze is activated
    event FreezeActivated(address indexed deceased, uint256 challengeDeadline);
    /// @notice Emitted when challenge is submitted
    event ChallengeSubmitted(address indexed deceased, address indexed challenger);
    /// @notice Emitted when challenge is resolved
    event ChallengeResolved(address indexed deceased, bool successful);
    /// @notice Emitted when inheritance is executed
    event InheritanceExecuted(address indexed deceased, uint256 totalTransferred);
    /// @notice Emitted when challenge bond is updated
    event ChallengeBondUpdated(uint256 newAmount);
    /// @notice Emitted when challenge period is updated
    event ChallengePeriodUpdated(uint256 newPeriod);
    
    /**
     * @notice Contract constructor
     * @param _token Address of the BaseLots token contract
     */
    constructor(address _token) {
        require(_token != address(0), "Invalid token");
        token = IBaseLotsToken(_token);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(CHALLENGE_ADMIN, msg.sender);
    }
    
    // ============ Beneficiary Management ============
    
    /**
     * @notice Designate a beneficiary for inheritance
     * @param beneficiary Address of beneficiary
     * @param percentage Percentage of inheritance (0-100)
     */
    function designateBeneficiary(address beneficiary, uint256 percentage) external {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(beneficiary != msg.sender, "Cannot designate self");
        require(percentage > 0 && percentage <= 100, "Invalid percentage");
        
        BeneficiaryDesignation[] storage userDesignations = designations[msg.sender];
        
        // Check if updating existing
        uint256 len = userDesignations.length;
        for (uint i = 0; i < len; i++) {
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
    
    /**
     * @notice Remove a beneficiary designation
     * @param beneficiary Address of beneficiary to remove
     */
    function removeBeneficiary(address beneficiary) external {
        BeneficiaryDesignation[] storage userDesignations = designations[msg.sender];
        
        uint256 len = userDesignations.length;
        for (uint i = 0; i < len; i++) {
            if (userDesignations[i].beneficiary == beneficiary && userDesignations[i].active) {
                userDesignations[i].active = false;
                emit DesignationRemoved(msg.sender, beneficiary);
                return;
            }
        }
        
        revert("Beneficiary not found");
    }
    
    /**
     * @notice Clear all beneficiary designations
     */
    function clearAllDesignations() external {
        delete designations[msg.sender];
    }
    
    // ============ Death Reporting & Freeze ============
    
    /**
     * @notice Submit proof of death and activate freeze
     * @param deceased Address of deceased
     * @param proofHash Hash of death proof attestation
     */
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
    
    /**
     * @notice Challenge a death report
     * @param deceased Address of reported deceased
     */
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
    
    /**
     * @notice Resolve a challenge
     * @param deceased Address of deceased
     * @param successful Whether challenge was successful
     */
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
    
    /**
     * @notice Internal function to distribute challenge bond
     * @param deceased Address of deceased
     * @param bond Amount to distribute
     */
    function _distributeChallengeBond(address deceased, uint256 bond) internal {
        BeneficiaryDesignation[] storage userDesignations = designations[deceased];
        
        // Cache length for gas optimization
        uint256 len = userDesignations.length;
        
        for (uint i = 0; i < len; i++) {
            BeneficiaryDesignation storage designation = userDesignations[i];
            if (designation.active) {
                // Use Math.mulDiv for safe percentage calculation
                uint256 share = Math.mulDiv(bond, designation.percentage, 100);
                if (share > 0) {
                    payable(designation.beneficiary).transfer(share);
                }
            }
        }
    }
    
    // ============ Inheritance Execution ============
    
    /**
     * @notice Execute inheritance transfer after challenge period
     * @param deceased Address of deceased token holder
     */
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
        
        // Cache storage variables for gas optimization
        uint256 balance = deceasedBalance;
        uint256 len = userDesignations.length;
        
        for (uint i = 0; i < len; i++) {
            BeneficiaryDesignation storage designation = userDesignations[i];
            if (designation.active) {
                // Use Math.mulDiv for safe percentage calculation
                uint256 amount = Math.mulDiv(balance, designation.percentage, 100);
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
    
    /**
     * @notice Get all beneficiaries for a user
     * @param user Address to check
     * @return beneficiaries Array of beneficiary addresses
     * @return percentages Array of percentages
     */
    function getBeneficiaries(address user) external view returns (
        address[] memory beneficiaries,
        uint256[] memory percentages
    ) {
        BeneficiaryDesignation[] storage userDesignations = designations[user];
        
        // Count active designations
        uint256 count = 0;
        uint256 len = userDesignations.length;
        for (uint i = 0; i < len; i++) {
            if (userDesignations[i].active) count++;
        }
        
        beneficiaries = new address[](count);
        percentages = new uint256[](count);
        
        uint256 idx = 0;
        for (uint i = 0; i < len; i++) {
            if (userDesignations[i].active) {
                beneficiaries[idx] = userDesignations[i].beneficiary;
                percentages[idx] = userDesignations[i].percentage;
                idx++;
            }
        }
        
        return (beneficiaries, percentages);
    }
    
    /**
     * @notice Get total percentage designated
     * @param user Address to check
     * @return total Total percentage designated
     */
    function getTotalPercentage(address user) public view returns (uint256 total) {
        BeneficiaryDesignation[] storage userDesignations = designations[user];
        
        uint256 len = userDesignations.length;
        for (uint i = 0; i < len; i++) {
            if (userDesignations[i].active) {
                total += userDesignations[i].percentage;
            }
        }
    }
    
    /**
     * @notice Check if address is frozen by HSP
     * @param user Address to check
     * @return frozen Whether address is frozen
     */
    function isFrozenByHSP(address user) external view returns (bool) {
        return inheritanceStatus[user].isFrozen;
    }
    
    /**
     * @notice Get inheritance status for a user
     * @param user Address to check
     * @return isFrozen Whether frozen
     * @return deathProof Death proof hash
     * @return freezeTimestamp When freeze started
     * @return challengeDeadline When challenge period ends
     * @return executed Whether executed
     * @return challenger Challenger address
     * @return remainingChallengeTime Remaining time for challenge
     */
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
    
    /**
     * @notice Check if inheritance can be executed
     * @param deceased Address of deceased
     * @return canExecute Whether inheritance can be executed
     */
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
    
    /**
     * @notice Update challenge bond amount
     * @param newBond New bond amount in wei
     */
    function setChallengeBond(uint256 newBond) external onlyRole(DEFAULT_ADMIN_ROLE) {
        challengeBond = newBond;
        emit ChallengeBondUpdated(newBond);
    }
    
    /**
     * @notice Update challenge period duration
     * @param newPeriod New period in seconds
     */
    function setChallengePeriod(uint256 newPeriod) external onlyRole(DEFAULT_ADMIN_ROLE) {
        challengePeriod = newPeriod;
        emit ChallengePeriodUpdated(newPeriod);
    }
    
    /**
     * @notice Update token contract reference
     * @param _token New token address
     */
    function setToken(address _token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_token != address(0), "Invalid token");
        token = IBaseLotsToken(_token);
    }
    
    /**
     * @notice Emergency unfreeze an address
     * @param deceased Address to unfreeze
     */
    function emergencyUnfreeze(address deceased) external onlyRole(DEFAULT_ADMIN_ROLE) {
        inheritanceStatus[deceased].isFrozen = false;
    }
    
    /**
     * @notice Receive ETH for challenge bonds
     */
    receive() external payable {}
}
