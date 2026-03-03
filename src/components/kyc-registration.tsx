import { useAccount, useReadContract } from 'wagmi';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const IDENTITY_REGISTRY_ABI = [
  {
    "inputs": [{ "internalType": "address", "name": "wallet", "type": "address" }],
    "name": "isVerified",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "wallet", "type": "address" }],
    "name": "isAccredited",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "wallet", "type": "address" },
      { "internalType": "bytes32", "name": "identityHash", "type": "bytes32" },
      { "internalType": "bool", "name": "isAccredited", "type": "bool" },
      { "internalType": "uint16", "name": "countryCode", "type": "uint16" },
      { "internalType": "uint64", "name": "expiryDate", "type": "uint64" }
    ],
    "name": "registerIdentity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "user", "type": "address" }],
    "name": "getIdentity",
    "outputs": [
      { "internalType": "bytes32", "name": "identityHash", "type": "bytes32" },
      { "internalType": "bool", "name": "verified", "type": "bool" },
      { "internalType": "bool", "name": "accredited", "type": "bool" },
      { "internalType": "uint16", "name": "countryCode", "type": "uint16" },
      { "internalType": "uint64", "name": "expiry", "type": "uint64" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Would be set after deploying IdentityRegistry
const IDENTITY_REGISTRY_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export function KYCRegistration() {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<'intro' | 'form' | 'submitting' | 'pending'>('intro');
  const [formData, setFormData] = useState({
    fullName: '',
    ssn: '',
    country: 'US',
    isAccredited: false,
  });

  const { data: isVerified } = useReadContract({
    address: IDENTITY_REGISTRY_ADDRESS,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: 'isVerified',
    args: address ? [address] : undefined,
  });

  const { data: identityData } = useReadContract({
    address: IDENTITY_REGISTRY_ADDRESS,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: 'getIdentity',
    args: address ? [address] : undefined,
  });

  const { error } = useWriteContract();

  const handleSubmit = () => {
    // In production: Send to KYC provider API first
    // For demo: Show "pending" state
    setStep('submitting');
    
    // Simulate API call delay
    setTimeout(() => {
      setStep('pending');
    }, 2000);
  };

  if (!isConnected) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4 text-white">KYC Verification</h2>
        <p className="text-gray-400">Connect your wallet to check KYC status</p>
      </div>
    );
  }

  // Show verified status
  if (isVerified) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-green-400 mb-2">✓ KYC Verified</h2>
          <p className="text-gray-300">Your identity has been verified and you can invest in BaseLots properties.</p>
        </div>
        
        {identityData && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Identity Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-green-400">Verified</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Accredited Investor</span>
                <span className={identityData[2] ? 'text-green-400' : 'text-gray-500'}>
                  {identityData[2] ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Country</span>
                <span className="text-white">{identityData[3] === 840 ? 'United States' : identityData[3]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expiry</span>
                <span className="text-white">
                  {new Date(Number(identityData[4]) * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">KYC Registration</h2>

      {step === 'intro' && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Why KYC?</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">•</span>
                SEC compliance for security token offerings
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">•</span>
                Anti-money laundering (AML) requirements
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cyan-400">•</span>
                Investor protection and verification
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">What You&apos;ll Need</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-orange-400">1.</span>
                Government-issued photo ID
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-400">2.</span>
                Proof of address (utility bill, bank statement)
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-400">3.</span>
                Selfie for identity verification
              </li>
              <li className="flex items-start gap-3">
                <span className="text-orange-400">4.</span>
                SSN or Tax ID (for US residents)
              </li>
            </ul>
          </div>

          <div className="bg-amber-900/20 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-200 text-sm">
              <strong>Demo Mode:</strong> In production, this would integrate with Sumsub, 
              Onfido, or similar KYC provider. Your documents are verified off-chain, 
              then your wallet is registered on-chain.
            </p>
          </div>

          <Button 
            onClick={() => setStep('form')}
            className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white py-6 text-lg font-semibold"
          >
            Start KYC Verification
          </Button>
        </div>
      )}

      {step === 'form' && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-6">
          <h3 className="text-lg font-semibold text-white">Personal Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Full Legal Name</label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                placeholder="John Doe"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">SSN / Tax ID</label>
              <Input
                value={formData.ssn}
                onChange={(e) => setFormData({...formData, ssn: e.target.value})}
                placeholder="XXX-XX-XXXX"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="accredited"
                checked={formData.isAccredited}
                onChange={(e) => setFormData({...formData, isAccredited: e.target.checked})}
                className="w-5 h-5 rounded border-gray-600"
              />
              <label htmlFor="accredited" className="text-gray-300 text-sm">
                I qualify as an <a href="#" className="text-cyan-400 underline">Accredited Investor</a>
              </label>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white py-6 text-lg font-semibold"
            >
              Submit for Verification
            </Button>
            <Button 
              variant="ghost"
              onClick={() => setStep('intro')}
              className="w-full text-gray-400 hover:text-white"
            >
              Back
            </Button>
          </div>
        </div>
      )}

      {step === 'submitting' && (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Submitting...</h3>
          <p className="text-gray-400">Uploading documents to KYC provider</p>
        </div>
      )}

      {step === 'pending' && (
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Verification Pending</h3>
          <p className="text-gray-400 mb-6">
            Your KYC application has been submitted. In production, this would be reviewed 
            by our KYC provider (typically 24-48 hours).
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-400 mb-2">Application Details:</p>
            <p className="text-white font-mono text-sm">Wallet: {address}</p>
            <p className="text-white text-sm">Name: {formData.fullName}</p>
            <p className="text-white text-sm">Submitted: {new Date().toLocaleString()}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error.message}</p>
        </div>
      )}
    </div>
  );
}
