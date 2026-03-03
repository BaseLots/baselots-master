// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IdentityRegistry
 * @dev On-chain KYC/AML registry for BaseLots
 * Links wallet addresses to verified off-chain identities
 */
contract IdentityRegistry is AccessControl {
    
    bytes32 public constant KYC_AGENT = keccak256("KYC_AGENT");
    bytes32 public constant REGISTRY_ADMIN = keccak256("REGISTRY_ADMIN");
    
    struct Identity {
        bytes32 identityHash;      // Hash of verified identity docs
        bool isVerified;           // KYC/AML passed
        bool isAccredited;         // SEC accredited investor
        uint16 countryCode;        // ISO 3166-1 numeric
        uint64 expiryDate;         // KYC expiry timestamp
        address[] wallets;         // Linked wallets
    }
    
    // Mapping: wallet => identity data
    mapping(address => Identity) public identities;
    
    // Mapping: identityHash => primary wallet (for deduplication)
    mapping(bytes32 => address) public identityToWallet;
    
    // Country restrictions
    mapping(uint16 => bool) public blockedCountries;
    
    // Events
    event IdentityRegistered(
        address indexed wallet,
        bytes32 indexed identityHash,
        bool isAccredited,
        uint16 countryCode
    );
    event IdentityUpdated(address indexed wallet, bool isVerified, bool isAccredited);
    event WalletLinked(address indexed primary, address indexed linkedWallet);
    event CountryBlocked(uint16 countryCode, bool blocked);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_AGENT, msg.sender);
        _grantRole(REGISTRY_ADMIN, msg.sender);
    }
    
    // ============ Registration ============
    
    function registerIdentity(
        address wallet,
        bytes32 identityHash,
        bool isAccredited,
        uint16 countryCode,
        uint64 expiryDate
    ) external onlyRole(KYC_AGENT) {
        require(wallet != address(0), "Invalid wallet");
        require(identityHash != bytes32(0), "Invalid hash");
        require(!blockedCountries[countryCode], "Country blocked");
        require(expiryDate > block.timestamp, "Expiry must be future");
        
        // Check if identity already exists
        address existingWallet = identityToWallet[identityHash];
        if (existingWallet != address(0)) {
            // Link this wallet to existing identity
            _linkWallet(existingWallet, wallet);
            return;
        }
        
        Identity storage identity = identities[wallet];
        identity.identityHash = identityHash;
        identity.isVerified = true;
        identity.isAccredited = isAccredited;
        identity.countryCode = countryCode;
        identity.expiryDate = expiryDate;
        identity.wallets.push(wallet);
        
        identityToWallet[identityHash] = wallet;
        
        emit IdentityRegistered(wallet, identityHash, isAccredited, countryCode);
    }
    
    function updateVerification(
        address wallet,
        bool isVerified
    ) external onlyRole(KYC_AGENT) {
        require(identities[wallet].identityHash != bytes32(0), "Identity not found");
        identities[wallet].isVerified = isVerified;
        
        emit IdentityUpdated(wallet, isVerified, identities[wallet].isAccredited);
    }
    
    function updateAccreditation(
        address wallet,
        bool isAccredited
    ) external onlyRole(KYC_AGENT) {
        require(identities[wallet].identityHash != bytes32(0), "Identity not found");
        identities[wallet].isAccredited = isAccredited;
        
        emit IdentityUpdated(wallet, identities[wallet].isVerified, isAccredited);
    }
    
    function refreshExpiry(
        address wallet,
        uint64 newExpiryDate
    ) external onlyRole(KYC_AGENT) {
        require(identities[wallet].identityHash != bytes32(0), "Identity not found");
        require(newExpiryDate > block.timestamp, "Expiry must be future");
        
        identities[wallet].expiryDate = newExpiryDate;
    }
    
    // ============ Wallet Linking ============
    
    function _linkWallet(address primary, address linked) internal {
        Identity storage identity = identities[primary];
        
        // Check not already linked
        for (uint i = 0; i < identity.wallets.length; i++) {
            require(identity.wallets[i] != linked, "Already linked");
        }
        
        identity.wallets.push(linked);
        
        // Copy identity to linked wallet reference
        identities[linked] = Identity({
            identityHash: identity.identityHash,
            isVerified: identity.isVerified,
            isAccredited: identity.isAccredited,
            countryCode: identity.countryCode,
            expiryDate: identity.expiryDate,
            wallets: identity.wallets
        });
        
        emit WalletLinked(primary, linked);
    }
    
    // ============ View Functions ============
    
    function isVerified(address wallet) external view returns (bool) {
        Identity storage identity = identities[wallet];
        return identity.isVerified && identity.expiryDate > block.timestamp;
    }
    
    function isAccredited(address wallet) external view returns (bool) {
        return identities[wallet].isAccredited;
    }
    
    function getIdentity(address wallet) external view returns (
        bytes32 identityHash,
        bool verified,
        bool accredited,
        uint16 countryCode,
        uint64 expiry
    ) {
        Identity storage identity = identities[wallet];
        return (
            identity.identityHash,
            identity.isVerified && identity.expiryDate > block.timestamp,
            identity.isAccredited,
            identity.countryCode,
            identity.expiryDate
        );
    }
    
    function getLinkedWallets(address wallet) external view returns (address[] memory) {
        return identities[wallet].wallets;
    }
    
    function isCountryBlocked(uint16 countryCode) external view returns (bool) {
        return blockedCountries[countryCode];
    }
    
    // ============ Admin ============
    
    function setCountryBlocked(uint16 countryCode, bool blocked) external onlyRole(REGISTRY_ADMIN) {
        blockedCountries[countryCode] = blocked;
        emit CountryBlocked(countryCode, blocked);
    }
    
    function batchBlockCountries(uint16[] calldata countryCodes, bool blocked) external onlyRole(REGISTRY_ADMIN) {
        for (uint i = 0; i < countryCodes.length; i++) {
            blockedCountries[countryCodes[i]] = blocked;
            emit CountryBlocked(countryCodes[i], blocked);
        }
    }
}
