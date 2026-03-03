// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IIdentityRegistry {
    function isVerified(address user) external view returns (bool);
    function isAccredited(address user) external view returns (bool);
}

interface ICompliance {
    function canTransfer(address from, address to, uint256 amount) external view returns (bool);
    function isFrozen(address user) external view returns (bool);
}

interface IHeritageShield {
    function isFrozenByHSP(address user) external view returns (bool);
    function getBeneficiaries(address user) external view returns (address[] memory, uint256[] memory);
}

/**
 * @title BaseLotsToken
 * @dev ERC-3643 style security token for fractional real estate
 * Built for Arbitrum — compliance-first with HSP integration
 */
contract BaseLotsToken is ERC20, AccessControl, Pausable {
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant COMPLIANCE_AGENT = keccak256("COMPLIANCE_AGENT");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // Property metadata
    uint256 public propertyId;
    string public propertyURI;
    uint256 public immutable maxSupply;
    
    // External contracts
    IIdentityRegistry public identityRegistry;
    ICompliance public compliance;
    IHeritageShield public heritageShield;
    
    // Tracking
    mapping(address => bool) public frozen;
    mapping(address => uint256) public lastTransferBlock;
    
    // Reg CF compliance
    uint256 public constant MAX_NON_ACCREDITED = 500;
    uint256 public investorCount;
    mapping(address => bool) public isInvestor;
    
    // Events
    event PropertyInitialized(uint256 indexed propertyId, uint256 maxSupply);
    event TokensMinted(address indexed to, uint256 amount);
    event TokensBurned(address indexed from, uint256 amount);
    event AddressFrozen(address indexed user, bool frozen);
    event ComplianceUpdated(address indexed compliance);
    event IdentityRegistryUpdated(address indexed registry);
    event HeritageShieldUpdated(address indexed hsp);
    event DividendDistributed(uint256 indexed dividendId, uint256 totalAmount);
    
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
    
    modifier onlyVerified(address user) {
        require(identityRegistry.isVerified(user), "User not KYC verified");
        _;
    }
    
    modifier notFrozen(address user) {
        require(!frozen[user], "Address frozen by compliance");
        require(address(heritageShield) == address(0) || !heritageShield.isFrozenByHSP(user), "Address frozen by HSP");
        _;
    }
    
    // ============ Minting ============
    
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
    
    function batchMint(address[] calldata to, uint256[] calldata amounts) 
        external 
        onlyRole(MINTER_ROLE) 
        whenNotPaused 
    {
        require(to.length == amounts.length, "Length mismatch");
        
        for (uint i = 0; i < to.length; i++) {
            mint(to[i], amounts[i]);
        }
    }
    
    // ============ Burning ============
    
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    function burnFrom(address from, uint256 amount) external onlyRole(BURNER_ROLE) {
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    // ============ Transfers (Compliance-Enforced) ============
    
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
    
    function batchTransfer(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        whenNotPaused 
    {
        require(recipients.length == amounts.length, "Length mismatch");
        
        for (uint i = 0; i < recipients.length; i++) {
            transfer(recipients[i], amounts[i]);
        }
    }
    
    function distributeDividend(address[] calldata recipients, uint256[] calldata amounts) 
        external 
        onlyRole(MINTER_ROLE)
        whenNotPaused 
    {
        require(recipients.length == amounts.length, "Length mismatch");
        
        uint256 total;
        for (uint i = 0; i < amounts.length; i++) {
            total += amounts[i];
        }
        
        // USDC or USDT transfer logic would go here
        // For now, emit event for off-chain processing
        emit DividendDistributed(block.timestamp, total);
    }
    
    // ============ HSP Integration ============
    
    function executeInheritance(address deceased) external onlyRole(COMPLIANCE_AGENT) {
        require(address(heritageShield) != address(0), "HSP not set");
        require(heritageShield.isFrozenByHSP(deceased), "HSP freeze not active");
        
        (address[] memory beneficiaries, uint256[] memory percentages) = heritageShield.getBeneficiaries(deceased);
        require(beneficiaries.length > 0, "No beneficiaries set");
        
        uint256 deceasedBalance = balanceOf(deceased);
        require(deceasedBalance > 0, "No tokens to transfer");
        
        uint256 totalTransferred;
        
        for (uint i = 0; i < beneficiaries.length; i++) {
            uint256 amount = (deceasedBalance * percentages[i]) / 100;
            if (amount > 0) {
                _transfer(deceased, beneficiaries[i], amount);
                totalTransferred += amount;
            }
        }
        
        // Mark as executed in HSP (would call heritageShield.executeTransfer())
    }
    
    // ============ Admin Functions ============
    
    function setFrozen(address user, bool _frozen) external onlyRole(COMPLIANCE_AGENT) {
        frozen[user] = _frozen;
        emit AddressFrozen(user, _frozen);
    }
    
    function setIdentityRegistry(address _registry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_registry != address(0), "Invalid address");
        identityRegistry = IIdentityRegistry(_registry);
        emit IdentityRegistryUpdated(_registry);
    }
    
    function setCompliance(address _compliance) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_compliance != address(0), "Invalid address");
        compliance = ICompliance(_compliance);
        emit ComplianceUpdated(_compliance);
    }
    
    function setHeritageShield(address _hsp) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_hsp != address(0), "Invalid address");
        heritageShield = IHeritageShield(_hsp);
        emit HeritageShieldUpdated(_hsp);
    }
    
    function setPropertyURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        propertyURI = _uri;
    }
    
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // ============ View Functions ============
    
    function canTransfer(address from, address to, uint256 amount) external view returns (bool) {
        if (frozen[from] || frozen[to]) return false;
        if (address(heritageShield) != address(0)) {
            if (heritageShield.isFrozenByHSP(from) || heritageShield.isFrozenByHSP(to)) return false;
        }
        return compliance.canTransfer(from, to, amount);
    }
    
    function getInvestorCount() external view returns (uint256) {
        return investorCount;
    }
    
    function remainingSupply() external view returns (uint256) {
        return maxSupply - totalSupply();
    }
}
