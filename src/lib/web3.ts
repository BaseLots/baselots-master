import { createConfig, http } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { createPublicClient } from 'viem'

export const config = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: http('https://sepolia-rollup.arbitrum.io/rpc'),
  },
})

// Public client for manual reads
export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
})

// Contract details
export const CONTRACT_ADDRESS = '0x2bb6fc19646466719f7fde66c33959a7990927ef' as const

// ABI for BaseLotsMarket
export const CONTRACT_ABI = [
  {
    inputs: [],
    name: 'init',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'location', type: 'string' },
      { name: 'total_price', type: 'uint256' },
      { name: 'total_shares', type: 'uint256' },
    ],
    name: 'listProperty',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'property_id', type: 'uint256' },
      { name: 'share_amount', type: 'uint256' },
    ],
    name: 'invest',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'property_id', type: 'uint256' }],
    name: 'getProperty',
    outputs: [
      { name: 'id', type: 'uint256' },
      { name: 'owner', type: 'address' },
      { name: 'name', type: 'string' },
      { name: 'location', type: 'string' },
      { name: 'total_price', type: 'uint256' },
      { name: 'total_shares', type: 'uint256' },
      { name: 'available_shares', type: 'uint256' },
      { name: 'active', type: 'bool' },
      { name: 'created_at', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'property_id', type: 'uint256' },
      { name: 'investor', type: 'address' },
    ],
    name: 'getMyShares',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalProperties',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'property_id', type: 'uint256' }],
    name: 'isFullyFunded',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'property_id', type: 'uint256' }],
    name: 'getSharePrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'property_id', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    name: 'setPropertyActive',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getOwner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'greet',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
