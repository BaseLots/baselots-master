# BaseLots Smart Contracts

ERC-3643 style security token contracts for fractional real estate on Arbitrum.

## BLOCKS Model

BaseLots does **not** have a single generic token. Instead, each property has its own token:

- **BLOCKS-Austin-001** → $500K property, 10,000 BLOCKS at $50 each
- **BLOCKS-Phoenix-001** → $750K property, 15,000 BLOCKS at $50 each
- etc.

Each BLOCKS token represents fractional ownership in a **specific property**, not the platform.

## Contracts

| Contract | Purpose | Lines |
|----------|---------|-------|
| `BaseLotsToken.sol` | Property-specific BLOCKS token (ERC-3643) | ~350 |
| `IdentityRegistry.sol` | On-chain KYC/AML registry (shared) | ~200 |
| `Compliance.sol` | Transfer rules per property | ~250 |
| `HeritageShield.sol` | Automated inheritance (HSP) | ~350 |

## Architecture

```
        Each property deploys its own BaseLotsToken instance:
        
        ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
        │BLOCKS-Austin  │  │BLOCKS-Phoenix │  │BLOCKS-Denver  │
        │  -001         │  │  -001         │  │  -001         │
        │(BaseLotsToken)│  │(BaseLotsToken)│  │(BaseLotsToken)│
        │  ERC-3643     │  │  ERC-3643     │  │  ERC-3643     │
        └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                │                  │                  │
                └──────────────────┼──────────────────┘
                                   │
                      ┌────────────┼────────────┐
                      │            │            │
                      ▼            ▼            ▼
                ┌────────┐   ┌────────┐   ┌─────────────┐
                │Identity│   │Compliance│   │HeritageShield│
                │Registry│   │(per prop)│   │   (HSP)      │
                │(shared)│   └─────────┘    │  (shared)    │
                └────────┘                  └─────────────┘
```

## ERC-3643 vs ERC-20

These contracts implement **ERC-3643** (T-REX standard):
- ERC-20 compatible for wallet/exchange support
- Built-in compliance enforcement on every transfer
- On-chain identity verification
- Modular permission system

Unlike standard ERC-20, transfers will **fail** if:
- Sender/receiver is not KYC verified
- Transfer violates property-specific limits (max balance, investor cap, etc.)
- Tokens are frozen by compliance agent

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

### Deploy New Property Token
```javascript
// Deploy a new BaseLotsToken for each property
const BlocksToken = await ethers.getContractFactory("BaseLotsToken");
const blocksToken = await BlocksToken.deploy(
  "BLOCKS-Austin-001",     // token name
  "BA001",                  // symbol
  identityRegistryAddress,  // shared KYC registry
  complianceAddress,        // compliance module
  propertyValue,            // total property value in USD
  totalBlocks               // number of shares (e.g., 10000)
);
await blocksToken.deployed();
```

### Register Identity (KYC)
```javascript
await identityRegistry.registerIdentity(
  walletAddress,
  identityHash,      // keccak256 of verified docs
  isAccredited,      // true/false
  countryCode,       // 840 for US
  expiryDate         // unix timestamp
);
// One registration works for ALL BLOCKS properties
```

### Buy BLOCKS (Property-specific)
```javascript
const blocksToken = await factory.getPropertyToken(propertyId);
await blocksToken.buyBlocks(amount, { value: ethAmount });
```

### Designate Beneficiary (HSP)
```javascript
await hsp.designateBeneficiary(beneficiaryAddress, percentage);
// Applies to ALL BLOCKS holdings across all properties
```

## Roles

| Role | Capabilities |
|------|-------------|
| `DEFAULT_ADMIN` | All permissions, upgrade contracts |
| `MINTER_ROLE` | Mint BLOCKS for specific property |
| `KYC_AGENT` | Register/update identities (global) |
| `COMPLIANCE_AGENT` | Freeze/unfreeze addresses per property |
| `ORACLE_ROLE` | Submit death proofs (HSP) |

## Security

- OpenZeppelin AccessControl
- Pausable emergency stop per property
- Compliance-checked transfers
- 90-day HSP challenge period
- Multi-sig recommended for admin roles

## License

MIT
