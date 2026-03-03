# BaseLots Smart Contracts

ERC-3643 style security token contracts for fractional real estate on Arbitrum.

## Contracts

| Contract | Purpose | Lines |
|----------|---------|-------|
| `BaseLotsToken.sol` | Main security token (ERC-20 + compliance hooks) | ~350 |
| `IdentityRegistry.sol` | On-chain KYC/AML registry | ~200 |
| `Compliance.sol` | Transfer rules & investment limits | ~250 |
| `HeritageShield.sol` | Automated inheritance (HSP) | ~350 |

## Architecture

```
┌─────────────────────────────────────────┐
│         BaseLotsToken                   │
│  (ERC-20 + compliance-enforced)         │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌─────────────┐
│Identity│ │Compliance│ │ HeritageShield│
│Registry│ │          │ │    (HSP)      │
└────────┘ └────────┘ └─────────────┘
```

## Features

- **KYC/AML**: IdentityRegistry enforces verified investors only
- **Compliance**: Modular rules (max balance, holding periods, investor counts)
- **HSP**: 90-day challenge period inheritance with oracle integration
- **Reg CF Ready**: 500 investor limit, accredited tracking

## Quick Start

```bash
cd contracts
npm install
npx hardhat compile
```

### Local Testing

```bash
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run deploy.js --network localhost
```

### Arbitrum Sepolia Deploy

```bash
export PRIVATE_KEY="your-key"
export ARBITRUM_SEPOLIA_RPC="https://sepolia-rollup.arbitrum.io/rpc"
npx hardhat run deploy.js --network arbitrumSepolia
```

## Contract Interactions

### Register Identity (KYC)
```javascript
await identityRegistry.registerIdentity(
  walletAddress,
  identityHash,      // keccak256 of verified docs
  isAccredited,      // true/false
  countryCode,       // 840 for US
  expiryDate         // unix timestamp
);
```

### Mint Tokens
```javascript
await token.mint(to, amount);  // MINTER_ROLE only
```

### Designate Beneficiary (HSP)
```javascript
await hsp.designateBeneficiary(beneficiaryAddress, percentage);
// Call multiple times to reach 100% total
```

## Roles

| Role | Capabilities |
|------|-------------|
| `DEFAULT_ADMIN` | All permissions, upgrade contracts |
| `MINTER_ROLE` | Mint tokens, distribute dividends |
| `KYC_AGENT` | Register/update identities |
| `COMPLIANCE_AGENT` | Freeze/unfreeze addresses |
| `ORACLE_ROLE` | Submit death proofs (HSP) |

## Security

- OpenZeppelin AccessControl
- Pausable emergency stop
- Compliance-checked transfers
- 90-day HSP challenge period
- Multi-sig recommended for admin

## License

MIT
