// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title IdentityRegistry
 * @dev On-chain KYC/AML registry for BaseLots
 * Links wallet addresses to verified off-chain identities
 * @author BaseLots Team
 */
contract IdentityRegistry is AccessControl {
    
    /// @notice Role for KYC agents who can register identities
    bytes32 public constant KYC_AGENT = keccak256("KYC_AGENT");
    /// @notice Role for registry administrators
    bytes32 public constant REGISTRY_ADMIN = keccak256("REGISTRY_ADMIN");
    
    /**
     * @notice Identity data struct
     * @param identityHash Hash of verified identity documents
     * @param isVerified Whether KYC/AML passed
     * @param isAccredited Whether SEC accredited investor
     * @param countryCode ISO 3166-1 numeric country code
     * @param expiryDate KYC expiry timestamp
     * @param wallets Array of linked wallets
     */
    struct Identity {
        bytes32 identityHash;
        bool isVerified;
        bool isAccredited;
        uint16 countryCode;
        uint64 expiryDate;
        address[] wallets;
    }
    
    /// @notice Mapping: wallet => identity data
    mapping(address => Identity) public identities;
    
    /// @notice Mapping: identityHash => primary wallet (for deduplication)
    mapping(bytes32 => address) public identityToWallet;
    
    /// @notice Blocked country codes
    mapping(uint16 => bool) public blockedCountries;
    
    /// @notice Emitted when identity is registered
    event IdentityRegistered(
        address indexed wallet,
        bytes32 indexed identityHash,
        bool isAccredited,
        uint16 countryCode
    );
    /// @notice Emitted when identity is updated
    event IdentityUpdated(address indexed wallet, bool isVerified, bool isAccredited);
    /// @notice Emitted when wallet is linked
    event WalletLinked(address indexed primary, address indexed linkedWallet);
    /// @notice Emitted when country block status changes
    event CountryBlocked(uint16 countryCode, bool blocked);
    
    /**
     * @notice Contract constructor
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KYC_AGENT, msg.sender);
        _grantRole(REGISTRY_ADMIN, msg.sender);
    }
    
    // ============ Registration ============
    
    /**
     * @notice Register a new identity
     * @param wallet Primary wallet address
     * @param identityHash Hash of verified identity documents
     * @param isAccredited Whether accredited investor
     * @param countryCode ISO 3166-1 numeric country code
     * @param expiryDate KYC expiry timestamp
     */
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
    
    /**
     * @notice Update verification status
     * @param wallet Wallet address
     * @param isVerified New verification status
     */
    function updateVerification(
        address wallet,
        bool isVerified
    ) external onlyRole(KYC_AGENT) {
        require(identities[wallet].identityHash != bytes32(0), "Identity not found");
        identities[wallet].isVerified = isVerified;
        
        emit IdentityUpdated(wallet, isVerified, identities[wallet].isAccredited);
    }
    
    /**
     * @notice Update accreditation status
     * @param wallet Wallet address
     * @param isAccredited New accreditation status
     */
    function updateAccreditation(
        address wallet,
        bool isAccredited
    ) external onlyRole(KYC_AGENT) {
        require(identities[wallet].identityHash != bytes32(0), "Identity not found");
        identities[wallet].isAccredited = isAccredited;
        
        emit IdentityUpdated(wallet, identities[wallet].isVerified, isAccredited);
    }
    
    /**
     * @notice Refresh KYC expiry date
     * @param wallet Wallet address
     * @param newExpiryDate New expiry timestamp
     */
    function refreshExpiry(
        address wallet,
        uint64 newExpiryDate
    ) external onlyRole(KYC_AGENT) {
        require(identities[wallet].identityHash != bytes32(0), "Identity not found");
        require(newExpiryDate > block.timestamp, "Expiry must be future");
        
        identities[wallet].expiryDate = newExpiryDate;
    }
    
    // ============ Wallet Linking ============
    
    /**
     * @notice Internal function to link a wallet to existing identity
     * @param primary Primary wallet address
     * @param linked Wallet to link
     */
    function _linkWallet(address primary, address linked) internal {
        Identity storage identity = identities[primary];
        
        // Cache length for gas optimization
        address[] storage wallets = identity.wallets;
        uint256 len = wallets.length;
        
        // Check not already linked
        for (uint i = 0; i < len; i++) {
            require(wallets[i] != linked, "Already linked");
        }
        
        wallets.push(linked);
        
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
    
    /**
     * @notice Check if wallet is verified and not expired
     * @param wallet Wallet address
     * @return verified Whether verified
     */
    function isVerified(address wallet) external view returns (bool) {
        Identity storage identity = identities[wallet];
        return identity.isVerified && identity.expiryDate > block.timestamp;
    }
    
    /**
     * @notice Check if wallet is accredited
     * @param wallet Wallet address
     * @return accredited Whether accredited
     */
    function isAccredited(address wallet) external view returns (bool) {
        return identities[wallet].isAccredited;
    }
    
    /**
     * @notice Get identity data for a wallet
     * @param wallet Wallet address
     * @return identityHash Identity hash
     * @return verified Whether verified (and not expired)
     * @return accredited Whether accredited
     * @return countryCode Country code
     * @return expiry Expiry timestamp
     */
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
    
    /**
     * @notice Get linked wallets for an identity
     * @param wallet Any wallet in the identity
     * @return wallets Array of linked wallets
     */
    function getLinkedWallets(address wallet) external view returns (address[] memory) {
        return identities[wallet].wallets;
    }
    
    /**
     * @notice Check if country is blocked
     * @param countryCode Country code
     * @return blocked Whether blocked
     */
    function isCountryBlocked(uint16 countryCode) external view returns (bool) {
        return blockedCountries[countryCode];
    }
    
    // ============ Admin ============
    
    /**
     * @notice Block or unblock a country
     * @param countryCode Country code
     * @param blocked New block status
     */
    function setCountryBlocked(uint16 countryCode, bool blocked) external onlyRole(REGISTRY_ADMIN) {
        blockedCountries[countryCode] = blocked;
        emit CountryBlocked(countryCode, blocked);
    }
    
    /**
     * @notice Batch block/unblock countries
     * @param countryCodes Array of country codes
     * @param blocked New block status
     */
    function batchBlockCountries(uint16[] calldata countryCodes, bool blocked) external onlyRole(REGISTRY_ADMIN) {
        uint256 len = countryCodes.length;
        for (uint i = 0; i < len; i++) {
            blockedCountries[countryCodes[i]] = blocked;
            emit CountryBlocked(countryCodes[i], blocked);
        }
    }
}
