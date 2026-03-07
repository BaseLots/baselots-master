'use client'

import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { parseEther, formatEther, encodeFunctionData, hexToBigInt, hexToString, getAddress } from 'viem'
import { CONTRACT_ADDRESS, CONTRACT_ABI, publicClient } from '@/lib/web3'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'

export function StylusDemo() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })
  
  const [propertyName, setPropertyName] = useState('Test Property')
  const [propertyLocation, setPropertyLocation] = useState('New York, NY')
  const [propertyPrice, setPropertyPrice] = useState('1')
  const [propertyShares, setPropertyShares] = useState('100')
  const [lookupIndex, setLookupIndex] = useState('0')
  const [lookedUpProperty, setLookedUpProperty] = useState<readonly [bigint, `0x${string}`, string, string, bigint, bigint, bigint, boolean, bigint] | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  // Read contract data (must be before any conditional return)
  const { data: greeting } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'greet',
  })

  const { data: totalProperties, refetch: refetchTotal } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getTotalProperties',
  })

  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getOwner',
  })

  const { data: property0 } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getProperty',
    args: [BigInt(0)],
    query: { enabled: (totalProperties ?? BigInt(0)) > BigInt(0) },
  })

  const handleLookupProperty = async () => {
    setLookupError(null)
    try {
      const idx = BigInt(lookupIndex || '0')
      
      const data = await publicClient.call({
        to: CONTRACT_ADDRESS,
        data: encodeFunctionData({ abi: CONTRACT_ABI, functionName: 'getProperty', args: [idx] }),
      })
      
      if (!data.data) throw new Error('No data returned')
      
      // Manual parsing for tuple encoding
      const hex = data.data.slice(2) // Remove 0x prefix
      
      // Helper to read a 32-byte word at a specific byte offset
      const readWord = (byteOffset: number): string => {
        const charOffset = byteOffset * 2
        return hex.slice(charOffset, charOffset + 64)
      }
      
      // First word is offset to tuple data (should be 0x20 = 32 bytes)
      const tupleOffset = parseInt(readWord(0), 16)
      
      // Tuple data starts at this offset
      const tupleStart = tupleOffset
      
      // Read static fields from tuple (each 32 bytes)
      const id = hexToBigInt(('0x' + readWord(tupleStart + 0)) as `0x${string}`)
      const owner = ('0x' + readWord(tupleStart + 32).slice(24)) as `0x${string}` // Last 20 bytes
      
      // String offsets are relative to tuple start
      const nameOffset = parseInt(readWord(tupleStart + 64), 16)
      const locationOffset = parseInt(readWord(tupleStart + 96), 16)
      
      const totalPrice = hexToBigInt(('0x' + readWord(tupleStart + 128)) as `0x${string}`)
      const totalShares = hexToBigInt(('0x' + readWord(tupleStart + 160)) as `0x${string}`)
      const availableShares = hexToBigInt(('0x' + readWord(tupleStart + 192)) as `0x${string}`)
      const active = readWord(tupleStart + 224) !== '0'.repeat(64)
      const createdAt = hexToBigInt(('0x' + readWord(tupleStart + 256)) as `0x${string}`)
      
      // Parse strings - offsets are from tuple start
      const namePosition = tupleStart + nameOffset
      const nameLength = parseInt(readWord(namePosition), 16)
      const nameHex = hex.slice((namePosition + 32) * 2, (namePosition + 32) * 2 + nameLength * 2)
      const name = Buffer.from(nameHex, 'hex').toString('utf8')
      
      const locationPosition = tupleStart + locationOffset
      const locationLength = parseInt(readWord(locationPosition), 16)
      const locationHex = hex.slice((locationPosition + 32) * 2, (locationPosition + 32) * 2 + locationLength * 2)
      const location = Buffer.from(locationHex, 'hex').toString('utf8')
      
      const result: readonly [bigint, `0x${string}`, string, string, bigint, bigint, bigint, boolean, bigint] = [
        id, owner, name, location, totalPrice, totalShares, availableShares, active, createdAt
      ]
      
      setLookedUpProperty(result)
    } catch (err) {
      console.error('Failed to fetch property:', err)
      setLookedUpProperty(null)
      setLookupError(err instanceof Error ? err.message : 'Property not found')
    }
  }

  const handleListProperty = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'listProperty',
      args: [
        propertyName,
        propertyLocation,
        parseEther(propertyPrice), // Price in ETH
        BigInt(propertyShares),
      ],
    })
  }

  const isOwner = address?.toLowerCase() === owner?.toLowerCase()

  // Prevent hydration mismatch - render loading state before mounted
  if (!mounted) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">BaseLots Token Demo</h2>
        <div className="p-4 bg-slate-100 rounded-lg text-slate-900">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">BaseLots Token Demo</h2>
      
      {/* Connection Status */}
      <div className="p-4 bg-slate-100 rounded-lg text-slate-900">
        {isConnected ? (
          <div className="space-y-2">
            <p>Connected: <code className="bg-slate-200 px-2 py-1 rounded">{address?.slice(0, 6)}...{address?.slice(-4)}</code></p>
            {owner && <p>Contract Owner: <code className="bg-slate-200 px-2 py-1 rounded">{owner.slice(0, 6)}...{owner.slice(-4)}</code></p>}
            <div className="flex items-center gap-4">
              {isOwner && <span className="text-green-700 font-semibold">You are the owner!</span>}
              <Button onClick={() => disconnect()} variant="outline" size="sm">Disconnect</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>
        )}
      </div>

      {/* Contract Info */}
      <div className="p-4 bg-cyan-50 rounded-lg space-y-2 text-slate-900">
        <h3 className="font-semibold">Contract Status</h3>
        <p><strong>Greeting:</strong> {greeting ?? 'Loading...'}</p>
        <p><strong>Total Properties:</strong> {totalProperties?.toString() ?? '0'}</p>
        <p className="text-xs text-slate-500">Contract: {CONTRACT_ADDRESS}</p>
      </div>

      {/* Property 0 Details (if exists) */}
      {property0 && (
        <div className="p-4 bg-orange-50 rounded-lg space-y-2 text-slate-900">
          <h3 className="font-semibold">Property #0</h3>
          <p><strong>Name:</strong> {property0[2]}</p>
          <p><strong>Location:</strong> {property0[3]}</p>
          <p><strong>Price:</strong> {formatEther(property0[4])} ETH</p>
          <p><strong>Total Shares:</strong> {property0[5].toString()}</p>
          <p><strong>Available:</strong> {property0[6].toString()}</p>
          <p><strong>Active:</strong> {property0[7] ? 'Yes' : 'No'}</p>
        </div>
      )}

      {/* Lookup Property */}
      <div className="p-4 bg-slate-50 rounded-lg space-y-3 text-slate-900">
        <h3 className="font-semibold">Lookup Property</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={lookupIndex}
            onChange={(e) => setLookupIndex(e.target.value)}
            placeholder="Property ID"
            className="px-3 py-2 border rounded w-24"
            min="0"
          />
          <Button onClick={handleLookupProperty} variant="outline">Get Property</Button>
        </div>
        {lookupError && (
          <p className="text-red-600 text-sm">{lookupError}</p>
        )}
        {lookedUpProperty && (
          <div className="space-y-1 pt-2 border-t">
            <p><strong>Name:</strong> {lookedUpProperty[2]}</p>
            <p><strong>Location:</strong> {lookedUpProperty[3]}</p>
            <p><strong>Price:</strong> {formatEther(lookedUpProperty[4])} ETH</p>
            <p><strong>Total Shares:</strong> {lookedUpProperty[5].toString()}</p>
            <p><strong>Available:</strong> {lookedUpProperty[6].toString()}</p>
            <p><strong>Active:</strong> {lookedUpProperty[7] ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>

      {/* List Property Form (owner only) */}
      {isConnected && isOwner && (
        <div className="p-4 border-2 border-dashed border-slate-300 rounded-lg space-y-4">
          <h3 className="font-semibold">List New Property</h3>
          <div className="grid gap-3">
            <input
              type="text"
              value={propertyName}
              onChange={(e) => setPropertyName(e.target.value)}
              placeholder="Property Name"
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              value={propertyLocation}
              onChange={(e) => setPropertyLocation(e.target.value)}
              placeholder="Location"
              className="px-3 py-2 border rounded"
            />
            <input
              type="number"
              value={propertyPrice}
              onChange={(e) => setPropertyPrice(e.target.value)}
              placeholder="Price (ETH)"
              className="px-3 py-2 border rounded"
            />
            <input
              type="number"
              value={propertyShares}
              onChange={(e) => setPropertyShares(e.target.value)}
              placeholder="Total Shares"
              className="px-3 py-2 border rounded"
            />
            <Button 
              onClick={handleListProperty} 
              disabled={isPending || isConfirming}
              className="bg-[#FF5722] hover:bg-[#E64A19]"
            >
              {isPending ? 'Confirming...' : isConfirming ? 'Waiting...' : 'List Property'}
            </Button>
            {isConfirmed && (
              <p className="text-green-600">✓ Property listed! <button onClick={() => refetchTotal()} className="underline">Refresh</button></p>
            )}
            {hash && (
              <p className="text-xs">
                <a 
                  href={`https://sepolia.arbiscan.io/tx/${hash}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View on Arbiscan →
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Network reminder */}
      <p className="text-xs text-slate-500 text-center">
        Make sure your wallet is connected to <strong>Arbitrum Sepolia</strong>
      </p>
    </div>
  )
}
