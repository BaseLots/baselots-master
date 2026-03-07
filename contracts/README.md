# BaseLots Smart Contracts

Security token contracts for fractional real estate on Arbitrum.

## Architecture

```
BaseLotsToken (ERC-3643 Security Token)
    │
    ├── IdentityRegistry (KYC/AML)
    │
    ├── Compliance (Transfer Rules)
    │
    └── HeritageShield (Auto-Inheritance)
```

## Contracts

### BaseLotsToken.sol
ERC-3643 style security token with compliance hooks.
- Max supply enforcement
- KYC verification required
- Transfer compliance checks
- Batch mint/transfer operations
- HSP integration for inheritance

### IdentityRegistry.sol
On-chain KYC/AML registry.
- Identity verification tracking
- Wallet linking for multi-account users
- Accreditation status (SEC)
- Country blocking for sanctions

### Compliance.sol
Modular compliance engine.
- Max balance rules (anti-concentration)
- Investor count limits (Reg CF)
- Minimum investment thresholds
- Holding period enforcement
- Address freezing

### HeritageShield.sol
Automated inheritance protocol ("Death Oracle").
- Beneficiary designation
- Oracle-triggered death verification
- 90-day challenge period
- Challenge bond mechanism
- Automated distribution

## Deployment

Arbitrum Sepolia:
- BaseLotsToken: `0x073E644868590F62cCd402A5c06A1501478DEd5C`
- IdentityRegistry: `0x6838e1541059D51Ec7E63A3333c56d8198EC1bC4`
- Compliance: `0xF9F65D2Fbf8932E818cadd657D7B0a5D03B94020`
- HeritageShield: `0x9E747a2F949b0D54B8b8940e0EA146F4b4A81bbc`

## Security Features

- OpenZeppelin AccessControl for role management
- Pausable for emergency stops
- Comprehensive NatSpec documentation
- Gas-optimized storage patterns
- Safe percentage calculations with mulDiv

## License

MIT
