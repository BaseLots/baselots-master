const { ethers } = require('hardhat');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying with account:', deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log('Account balance:', ethers.formatEther(balance));

  // 1. Deploy IdentityRegistry
  console.log('\n1. Deploying IdentityRegistry...');
  const IdentityRegistry = await ethers.getContractFactory('IdentityRegistry');
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  console.log('IdentityRegistry deployed to:', await identityRegistry.getAddress());

  // 2. Deploy Compliance
  console.log('\n2. Deploying Compliance...');
  const Compliance = await ethers.getContractFactory('Compliance');
  const compliance = await Compliance.deploy(await identityRegistry.getAddress());
  await compliance.waitForDeployment();
  console.log('Compliance deployed to:', await compliance.getAddress());

  // 3. Deploy BaseLotsToken
  console.log('\n3. Deploying BaseLotsToken...');
  const BaseLotsToken = await ethers.getContractFactory('BaseLotsToken');
  
  const propertyId = 1;
  const maxSupply = ethers.parseEther('1000000'); // 1M tokens
  const tokenName = 'BaseLots Property #1';
  const tokenSymbol = 'BLP1';
  
  const token = await BaseLotsToken.deploy(
    tokenName,
    tokenSymbol,
    propertyId,
    maxSupply,
    await identityRegistry.getAddress(),
    await compliance.getAddress()
  );
  await token.waitForDeployment();
  console.log('BaseLotsToken deployed to:', await token.getAddress());

  // 4. Deploy HeritageShield
  console.log('\n4. Deploying HeritageShield...');
  const HeritageShield = await ethers.getContractFactory('HeritageShield');
  const hsp = await HeritageShield.deploy(await token.getAddress());
  await hsp.waitForDeployment();
  console.log('HeritageShield deployed to:', await hsp.getAddress());

  // 5. Link HSP to token
  console.log('\n5. Linking HSP to token...');
  await (await token.setHeritageShield(await hsp.getAddress())).wait();
  console.log('HSP linked to token');

  // Summary
  console.log('\n=== DEPLOYMENT COMPLETE ===\n');
  console.log('Network:', network.name);
  console.log('Deployer:', deployer.address);
  console.log('');
  console.log('Contracts:');
  console.log('  IdentityRegistry:', await identityRegistry.getAddress());
  console.log('  Compliance:', await compliance.getAddress());
  console.log('  BaseLotsToken:', await token.getAddress());
  console.log('  HeritageShield:', await hsp.getAddress());
  console.log('');
  console.log('Property Details:');
  console.log('  Name:', tokenName);
  console.log('  Symbol:', tokenSymbol);
  console.log('  Property ID:', propertyId);
  console.log('  Max Supply:', ethers.formatEther(maxSupply), 'tokens');

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      IdentityRegistry: await identityRegistry.getAddress(),
      Compliance: await compliance.getAddress(),
      BaseLotsToken: await token.getAddress(),
      HeritageShield: await hsp.getAddress(),
    },
    property: {
      name: tokenName,
      symbol: tokenSymbol,
      propertyId: propertyId,
      maxSupply: maxSupply.toString(),
    },
  };

  const fs = require('fs');
  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('\nDeployment info saved to deployment.json');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
