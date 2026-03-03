import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseEther, formatEther } from 'viem';
import { useState } from 'react';

// Contract ABIs (minimal for MVP)
const TOKEN_ABI = [
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "amount", "type": "uint256" }],
    "name": "buyTokens",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "propertyId",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxSupply",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

// Arbitrum Sepolia deployed address (from deployment.json)
const TOKEN_ADDRESS = '0x477Ca46D56b63b41978De9327aB002A85A9892c0' as const;

export function TokenMinter() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const [buyAmount, setBuyAmount] = useState('0.01');

  const { data: balance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: totalSupply } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'totalSupply',
  });

  const { data: maxSupplyData } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: 'maxSupply',
  });

  const { writeContract, isPending, error } = useWriteContract();

  const handleBuy = () => {
    writeContract({
      address: TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: 'buyTokens',
      value: parseEther(buyAmount),
    });
  };

  if (!isConnected) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-white">Connect Wallet</h2>
        <p className="text-gray-400 mb-8">Connect your wallet to view your BLT token balance and buy tokens.</p>
        <button
          onClick={() => connect({ connector: injected() })}
          className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Token Dashboard</h2>
        <button
          onClick={() => disconnect()}
          className="text-sm text-gray-400 hover:text-white"
        >
          Disconnect
        </button>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 mb-6 border border-gray-800">
        <p className="text-gray-400 text-sm mb-1">Connected Address</p>
        <p className="text-white font-mono">{address}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Your Balance</p>
          <p className="text-2xl font-bold text-cyan-400">
            {balance && typeof balance === 'bigint' ? formatEther(balance) : '0'} BLT
          </p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm mb-1">Total Supply</p>
          <p className="text-2xl font-bold text-orange-400">
            {totalSupply && typeof totalSupply === 'bigint' ? formatEther(totalSupply) : '0'} BLT
          </p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
        <p className="text-gray-400 text-sm mb-1">Contract Address</p>
        <a
          href={`https://sepolia.arbiscan.io/address/${TOKEN_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 font-mono text-sm hover:underline"
        >
          {TOKEN_ADDRESS}
        </a>
        <p className="text-gray-500 text-xs mt-2">Arbitrum Sepolia Testnet</p>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Buy Tokens</h3>
        <p className="text-gray-400 text-sm mb-4">
          1 ETH = 100 BLT tokens (MVP rate)
        </p>
        <div className="flex gap-4">
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={buyAmount}
            onChange={(e) => setBuyAmount(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
            placeholder="ETH amount"
          />
          <button
            onClick={handleBuy}
            disabled={isPending}
            className="bg-gradient-to-r from-cyan-500 to-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isPending ? 'Buying...' : 'Buy BLT'}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-2">{error.message}</p>
        )}
      </div>
    </div>
  );
}
