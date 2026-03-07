// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @notice Interface for the Identity Registry contract
 * @dev Handles KYC/AML verification and accreditation status
 */
interface IIdentityRegistry {
    function isVerified(address user) external view returns (bool);
    function isAccredited(address user) external view returns (bool);
}

/**
 * @notice Interface for the Compliance contract
 * @dev Enforces transfer rules and investment limits
 */
interface ICompliance {
    function canTransfer(address from, address to, uint256 amount) external view returns (bool);
    function isFrozen(address user) external view returns (bool);
}

/**
 * @notice Interface for the Heritage Shield Protocol
 * @dev Handles automated inheritance and death verification
 */
interface IHeritageShield {
    function isFrozenByHSP(address user) external view returns (bool);
    function getBeneficiaries(address user) external view returns (address[] memory, uint256[] memory);
}

/**
 * @title BaseLotsToken
 * @dev ERC-3643 style security token for fractional real estate
 * Built for Arbitrum — compliance-first with HSP integration
 * @author BaseLots Team
 */
contract BaseLotsToken is ERC20, AccessControl, Pausable {
    
    /// @notice Role allowed to mint tokens
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    /// @notice Role allowed to burn tokens
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    /// @notice Role allowed to freeze/unfreeze addresses
    bytes32 public constant COMPLIANCE_AGENT = keccak256("COMPLIANCE_AGENT");
    /// @notice Role allowed to pause/unpause contract
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    /// @notice Property identifier
    uint256 public propertyId;
    /// @notice URI for property metadata
    string public propertyURI;
    /// @notice Maximum token supply (immutable)
    uint256 public immutable maxSupply;
    
    /// @notice Identity registry contract
    IIdentityRegistry public identityRegistry;
    /// @notice Compliance engine contract
    ICompliance public compliance;
    /// @notice Heritage Shield Protocol contract
    IHeritageShield public heritageShield;
    
    /// @notice Addresses frozen by compliance
    mapping(address => bool) public frozen;
    /// @notice Last block number for transfer tracking
    mapping(address => uint256) public lastTransferBlock;
    
    /// @notice Maximum non-accredited investors (Reg CF)
    uint256 public constant MAX_NON_ACCREDITED = 500;
    /// @notice Total number of unique investors
    uint256 public investorCount;
    /// @notice Mapping of investor addresses
    mapping(address => bool) public isInvestor;
    
    /// @notice Emitted when property is initialized
    event PropertyInitialized(uint256 indexed propertyId, uint256 maxSupply);
    /// @notice Emitted when tokens are minted
    event TokensMinted(address indexed to, uint256 amount);
    /// @notice Emitted when tokens are burned
    event TokensBurned(address indexed from, uint256 amount);
    /// @notice Emitted when address freeze status changes
    event AddressFrozen(address indexed user, bool frozen);
    /// @notice Emitted when compliance contract is updated
    event ComplianceUpdated(address indexed compliance);
    /// @notice Emitted when identity registry is updated
    event IdentityRegistryUpdated(address indexed registry);
    /// @notice Emitted when Heritage Shield is updated
    event HeritageShieldUpdated(address indexed hsp);
    /// @notice Emitted when dividend is distributed
    event DividendDistributed(uint256 indexed dividendId, uint256 totalAmount);
    
    /**
     * @notice Contract constructor
     * @param name Token name
     * @param symbol Token symbol
     * @param _propertyId Property identifier
     * @param _maxSupply Maximum token supply
     * @param _identityRegistry Address of identity registry contract
     * @param _compliance Address of compliance contract
     */
    constructor(
        string memory name,
        string memory symbol,
        uint256 _propertyId,
        uint256 _maxSupply,
        address _identityRegistry,
        address _compliance
    ) ERC20(name, symbol) {
        require(_identityRegistry != address(0), "Invalid registry");
        require(_compliance != address(0), "Invalid compliance");
        
        propertyId = _propertyId;
        maxSupply = _maxSupply;
        identityRegistry = IIdentityRegistry(_identityRegistry);
        compliance = ICompliance(_compliance);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(COMPLIANCE_AGENT, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        emit PropertyInitialized(_propertyId, _maxSupply);
    }
    
    // ============ Modifiers ============
    
    /**
     * @notice Ensures user is KYC verified
     */
    modifier onlyVerified(address user) {
        require(identityRegistry.isVerified(user), "User not KYC verified");
        _;
    }
    
    /**
     * @notice Ensures user is not frozen by compliance or HSP
     */
    modifier notFrozen(address user) {
        require(!frozen[user], "Address frozen by compliance");
        require(address(heritageShield) == address(0) || !heritageShield.isFrozenByHSP(user), "Address frozen by HSP");
        _;
    }
    
    // ============ Minting ============
    
    /**
     * @notice Mint tokens to a verified address
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        onlyVerified(to)
        notFrozen(to)
        whenNotPaused 
    {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        require(compliance.canTransfer(address(0), to, amount), "Transfer not compliant");
        
        _mint(to, amount);
        
        if (!isInvestor[to]) {
            isInvestor[to] = true;
            investorCount++;
        }
        
        emit TokensMinted(to, amount);
    }
    
    /**
     * @notice Internal mint function for batch operations
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function _internalMint(address to, uint256 amount) internal {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        require(identityRegistry.isVerified(to), "User not KYC verified");
        require(!frozen[to], "Address frozen by compliance");
        require(address(heritageShield) == address(0) || !heritageShield.isFrozenByHSP(to), "Address frozen by HSP");
        require(compliance.canTransfer(address(0), to, amount), "Transfer not compliant");
        
        _mint(to, amount);
        
        if (!isInvestor[to]) {
            isInvestor[to] = true;
            investorCount++;
        }
        
        emit TokensMinted(to, amount);
    }
    
    /**
     * @notice Batch mint tokens to multiple addresses
     * @param to Array of recipient addresses
     * @param amounts Array of amounts to mint
     */
    function batchMint(address[] calldata to, uint256[] calldata amounts) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(to.length == amounts.length, "Length mismatch");
        require(to.length > 0, "Empty batch");
        
        for (uint i = 0; i < to.length; i++) {
            _internalMint(to[i], amounts[i]);
        }
    }
    
    // ============ Burning ============
    
    /**
     * @notice Burn own tokens
     * @param amount Amount to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @notice Burn tokens from an address (requires BURNER_ROLE)
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    // ============ Transfers (Compliance-Enforced) ============
    
    /**
     * @notice Transfer tokens with compliance checks
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether transfer succeeded
     */
    function transfer(address to, uint256 amount) 
        public 
        override 
        onlyVerified(msg.sender)
        onlyVerified(to)
        notFrozen(msg.sender)
        notFrozen(to)
        whenNotPaused 
        returns (bool) 
    {
        require(compliance.canTransfer(msg.sender, to, amount), "Transfer not compliant");
        
        lastTransferBlock[msg.sender] = block.number;
        
        if (!isInvestor[to] && balanceOf(to) == 0) {
            isInvestor[to] = true;
            investorCount++;
        }
        
        return super.transfer(to, amount);
    }
    
    /**
     * @notice Transfer tokens from an address with compliance checks
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success Whether transfer succeeded
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        onlyVerified(from)
        onlyVerified(to)
        notFrozen(from)
        notFrozen(to)
        whenNotPaused 
        returns (bool) 
    {
        require(compliance.canTransfer(from, to, amount), "Transfer not compliant");
        
        lastTransferBlock[from] = block.number;
        
        if (!isInvestor[to] && balanceOf(to) == 0) {
            isInvestor[to] = true;
            investorCount++;
        }
        
        return super.transferFrom(from, to, amount);
    }
    
    // ============ Batch Operations ============
    
    /**
     * @notice Batch transfer tokens to multiple addresses
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts
     */
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        whenNotPaused 
    {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "Empty batch");
        
        for (uint i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @notice Distribute dividends to multiple recipients
     * @param recipients Array of recipient addresses
     * @param amounts Array of dividend amounts
     */
    function distributeDividend(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyRole(MINTER_ROLE)
        whenNotPaused 
    {
        require(recipients.length == amounts.length, "Length mismatch");
        require(recipients.length > 0, "Empty batch");
        
        uint256 total;
        for (uint i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        
        // USDC or USDT transfer logic would go here
        // For now, emit event for off-chain processing
        emit DividendDistributed(block.timestamp, total);
    }
    
    // ============ HSP Integration ============
    
    /**
     * @notice Execute inheritance transfer for a deceased holder
     * @param deceased Address of deceased token holder
     */
    function executeInheritance(address deceased) external onlyRole(COMPLIANCE_AGENT) {
        require(address(heritageShield) != address(0), "HSP not set");
        require(heritageShield.isFrozenByHSP(deceased), "HSP freeze not active");
        
        (address[] memory beneficiaries, uint256[] memory percentages) = heritageShield.getBeneficiaries(deceased);
        require(beneficiaries.length > 0, "No beneficiaries set");
        
        uint256 deceasedBalance = balanceOf(deceased);
        require(deceasedBalance > 0, "No tokens to transfer");
        
        uint256 totalTransferred;
        
        // Cache storage variables for gas optimization
        uint256 balance = deceasedBalance;
        
        for (uint i = 0; i < beneficiaries.length; i++) {
            // Use Math.mulDiv for safe percentage calculation
            uint256 amount = Math.mulDiv(balance, percentages[i], 100);
            if (amount > 0) {
                _transfer(deceased, beneficiaries[i], amount);
                totalTransferred += amount;
            }
        }
        
        // Mark as executed in HSP (would call heritageShield.executeTransfer())
    }
    
    // ============ Admin Functions ============
    
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
     * @notice Update identity registry contract
     * @param _registry New registry address
     */
    function setIdentityRegistry(address _registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_registry != address(0), "Invalid address");
        identityRegistry = IIdentityRegistry(_registry);
        emit IdentityRegistryUpdated(_registry);
    }
    
    /**
     * @notice Update compliance contract
     * @param _compliance New compliance address
     */
    function setCompliance(address _compliance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_compliance != address(0), "Invalid address");
        compliance = ICompliance(_compliance);
        emit ComplianceUpdated(_compliance);
    }
    
    /**
     * @notice Update Heritage Shield contract
     * @param _hsp New HSP address
     */
    function setHeritageShield(address _hsp) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_hsp != address(0), "Invalid address");
        heritageShield = IHeritageShield(_hsp);
        emit HeritageShieldUpdated(_hsp);
    }
    
    /**
     * @notice Set property metadata URI
     * @param _uri New URI string
     */
    function setPropertyURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        propertyURI = _uri;
    }
    
    /**
     * @notice Pause all transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Check if a transfer would be allowed
     * @param from Sender address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return allowed Whether transfer is allowed
     */
    function canTransfer(address from, address to, uint256 amount) external view returns (bool) {
        if (frozen[from] || frozen[to]) return false;
        if (address(heritageShield) != address(0)) {
            if (heritageShield.isFrozenByHSP(from) || heritageShield.isFrozenByHSP(to)) return false;
        }
        return compliance.canTransfer(from, to, amount);
    }
    
    /**
     * @notice Get total investor count
     * @return count Number of unique investors
     */
    function getInvestorCount() external view returns (uint256) {
        return investorCount;
    }
    
    /**
     * @notice Get remaining supply that can be minted
     * @return remaining Remaining supply
     */
    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalSupply();
    }
}
