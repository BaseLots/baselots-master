import { useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface KYCData {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  fullName: string;
  country: string;
  isAccredited: boolean;
  submittedAt: string;
  verifiedAt?: string;
  identityHash: string;
}

export function KYCRegistration() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [step, setStep] = useState<'intro' | 'form' | 'submitting' | 'complete'>('intro');
  const [formData, setFormData] = useState({
    fullName: '',
    ssn: '',
    country: 'US',
    isAccredited: false,
  });
  const [ssnError, setSsnError] = useState('');
  const [nameError, setNameError] = useState('');

  // Validate full name (at least first and last name)
  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setNameError('');
      return false;
    }
    // Check for at least 2 words (first and last name)
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 2) {
      setNameError('Please enter both first and last name');
      return false;
    }
    // Check each word is at least 2 characters
    const shortWords = words.filter(word => word.length < 2);
    if (shortWords.length > 0) {
      setNameError('Each name must be at least 2 characters');
      return false;
    }
    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    const validNamePattern = /^[a-zA-Z\s\-\'\.]+$/;
    if (!validNamePattern.test(trimmed)) {
      setNameError('Name can only contain letters, spaces, hyphens, and apostrophes');
      return false;
    }
    setNameError('');
    return true;
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({...formData, fullName: value});
    validateName(value);
  };

  // Format SSN as user types (XXX-XX-XXXX)
  const formatSSN = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 9 digits
    const limited = digits.slice(0, 9);
    
    // Format with dashes
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
    }
  };

  // Validate SSN (must be 9 digits)
  const validateSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) {
      setSsnError('');
      return false;
    }
    if (digits.length < 9) {
      setSsnError(`Enter ${9 - digits.length} more digit${9 - digits.length === 1 ? '' : 's'}`);
      return false;
    }
    if (digits.length === 9) {
      // Basic SSN validation - first 3 digits can't be 000, 666, or 900-999
      const firstThree = digits.slice(0, 3);
      if (firstThree === '000' || firstThree === '666' || (parseInt(firstThree) >= 900)) {
        setSsnError('Invalid SSN format');
        return false;
      }
      // Middle 2 digits can't be 00
      if (digits.slice(3, 5) === '00') {
        setSsnError('Invalid SSN format');
        return false;
      }
      // Last 4 digits can't be 0000
      if (digits.slice(5) === '0000') {
        setSsnError('Invalid SSN format');
        return false;
      }
      setSsnError('');
      return true;
    }
    setSsnError('');
    return true;
  };

  const handleSSNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSSN(e.target.value);
    setFormData({...formData, ssn: formatted});
    validateSSN(formatted);
  };

  // Load KYC data from localStorage on mount
  useEffect(() => {
    if (address) {
      const saved = localStorage.getItem(`kyc-${address}`);
      if (saved) {
        // Use setTimeout to avoid synchronous setState in effect
        setTimeout(() => setKycData(JSON.parse(saved)), 0);
      }
    }
  }, [address]);

  // Simulate admin approval after 10 seconds in demo mode
  useEffect(() => {
    if (kycData?.status === 'pending' && address) {
      const timer = setTimeout(() => {
        const verified: KYCData = {
          ...kycData,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          identityHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        };
        localStorage.setItem(`kyc-${address}`, JSON.stringify(verified));
        // State update is wrapped in setTimeout, clear timer handles cleanup
        setKycData(verified);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [kycData?.status, address]);

  const handleSubmit = () => {
    setStep('submitting');
    
    setTimeout(() => {
      if (address) {
        const newKYC: KYCData = {
          status: 'pending',
          fullName: formData.fullName,
          country: formData.country,
          isAccredited: formData.isAccredited,
          submittedAt: new Date().toISOString(),
          identityHash: '',
        };
        localStorage.setItem(`kyc-${address}`, JSON.stringify(newKYC));
        setKycData(newKYC);
        setStep('complete');
      }
    }, 2000);
  };

  const resetKYC = () => {
    if (address) {
      localStorage.removeItem(`kyc-${address}`);
      setKycData(null);
      setStep('intro');
    }
  };

  if (!isConnected) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-4 text-white">KYC Verification</h2>
        <p className="text-gray-400 mb-8">Connect your wallet to complete identity verification and start investing in BaseLots properties.</p>
        <Button 
          onClick={() => connect({ connector: injected() })}
          className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white py-6 text-lg font-semibold hover:opacity-90"
        >
          Connect Wallet
        </Button>
      </div>
    );
  }

  // Show verified status
  if (kycData?.status === 'verified') {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-green-400">KYC Verified</h2>
              <p className="text-green-300/70 text-sm">You can now invest in BaseLots properties</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold text-white mb-4">Identity Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Status</span>
              <span className="text-green-400 font-medium">Verified ✓</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Name</span>
              <span className="text-white">{kycData.fullName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Accredited Investor</span>
              <span className={kycData.isAccredited ? 'text-green-400' : 'text-gray-500'}>
                {kycData.isAccredited ? 'Yes ✓' : 'No'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Country</span>
              <span className="text-white">
                {kycData.country === 'US' ? 'United States' : 
                 kycData.country === 'CA' ? 'Canada' : 
                 kycData.country === 'UK' ? 'United Kingdom' : kycData.country}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Verified On</span>
              <span className="text-white">
                {kycData.verifiedAt ? new Date(kycData.verifiedAt).toLocaleDateString() : '-'}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Identity Hash</span>
              <span className="text-gray-500 font-mono text-sm">
                {kycData.identityHash.slice(0, 16)}...{kycData.identityHash.slice(-8)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
          <p className="text-amber-200 text-sm">
            <strong>Demo Mode:</strong> This verification is stored locally in your browser. 
            In production, this would be recorded on-chain in the IdentityRegistry contract.
          </p>
        </div>

        <Button 
          onClick={resetKYC}
          variant="ghost"
          className="w-full mt-4 text-gray-400 hover:text-white"
        >
          Reset Demo (Clear KYC Data)
        </Button>
      </div>
    );
  }

  // Show pending status
  if (kycData?.status === 'pending') {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Verification Pending</h3>
          <p className="text-gray-400 mb-6">
            Your KYC application has been submitted and is under review.
          </p>
          
          <div className="bg-gray-800 rounded-lg p-4 text-left mb-6">
            <p className="text-sm text-gray-400 mb-2">Application Details:</p>
            <p className="text-white font-mono text-sm">Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
            <p className="text-white text-sm">Name: {kycData.fullName}</p>
            <p className="text-white text-sm">Submitted: {new Date(kycData.submittedAt).toLocaleString()}</p>
          </div>

          <div className="flex items-center justify-center gap-2 text-amber-400">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-sm">Auto-approving in demo mode (10s)...</span>
          </div>
        </div>

        <Button 
          onClick={resetKYC}
          variant="ghost"
          className="w-full mt-4 text-gray-400 hover:text-white"
        >
          Cancel Application
        </Button>
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
              <strong>Demo Mode:</strong> This simulates the KYC flow. Your data is stored 
              locally and auto-approved after 10 seconds for demonstration purposes.
            </p>
          </div>

          <Button 
            onClick={() => setStep('form')}
            className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white py-6 text-lg font-semibold hover:opacity-90"
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
                onChange={handleNameChange}
                placeholder="John Doe"
                className={`bg-gray-800 text-white h-12 ${
                  nameError ? 'border-red-500 focus:border-red-500' : 
                  formData.fullName.trim().split(/\s+/).filter(w => w.length > 0).length >= 2 ? 'border-green-500 focus:border-green-500' : 
                  'border-gray-700'
                }`}
              />
              {nameError ? (
                <p className="text-red-400 text-xs mt-1">{nameError}</p>
              ) : formData.fullName.trim().split(/\s+/).filter(w => w.length > 0).length >= 2 ? (
                <p className="text-green-400 text-xs mt-1">✓ Valid name</p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">Enter first and last name</p>
              )}
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">SSN / Tax ID</label>
              <Input
                value={formData.ssn}
                onChange={handleSSNChange}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
                inputMode="numeric"
                className={`bg-gray-800 text-white h-12 ${
                  ssnError ? 'border-red-500 focus:border-red-500' : 
                  formData.ssn.length === 11 ? 'border-green-500 focus:border-green-500' : 
                  'border-gray-700'
                }`}
              />
              {ssnError ? (
                <p className="text-red-400 text-xs mt-1">{ssnError}</p>
              ) : formData.ssn.length === 11 ? (
                <p className="text-green-400 text-xs mt-1">✓ Valid SSN format</p>
              ) : (
                <p className="text-gray-500 text-xs mt-1">9 digits required (XXX-XX-XXXX)</p>
              )}
            </div>

            <div>
              <label className="block text-gray-400 text-sm mb-2">Country</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white h-12"
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
                className="w-5 h-5 rounded border-gray-600 bg-gray-800"
              />
              <label htmlFor="accredited" className="text-gray-300 text-sm flex items-center gap-1">
                I qualify as an
                <Dialog>
                  <DialogTrigger asChild>
                    <button type="button" className="text-cyan-400 underline hover:text-cyan-300 cursor-pointer bg-transparent border-none p-0">
                      Accredited Investor
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold text-cyan-400">What is an Accredited Investor?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-gray-300">
                      <p>
                        An <strong className="text-white">Accredited Investor</strong> is someone who meets specific financial criteria set by the SEC, allowing them to invest in certain private securities and alternative investments.
                      </p>
                      
                      <div>
                        <h4 className="font-semibold text-white mb-2">You qualify if you meet ANY of these:</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>Annual income of <strong className="text-white">$200,000+</strong> (individual) or <strong className="text-white">$300,000+</strong> (joint with spouse) for the past 2 years</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>Net worth over <strong className="text-white">$1,000,000</strong> (excluding primary residence)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>Hold a Series 7, 65, or 82 license in good standing</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-cyan-400 mt-0.5">•</span>
                            <span>Entity with assets over <strong className="text-white">$5,000,000</strong></span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
                        <p className="text-amber-200 text-sm">
                          <strong>Note:</strong> BaseLots requires accredited investor status for certain higher-tier investments and removes investment limits for Reg CF offerings.
                        </p>
                      </div>

                      <p className="text-xs text-gray-500">
                        Source: SEC Rule 501 of Regulation D
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </label>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              onClick={handleSubmit}
              disabled={nameError !== '' || formData.fullName.trim().split(/\s+/).filter(w => w.length > 0).length < 2 || formData.ssn.length < 11 || ssnError !== ''}
              className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white py-6 text-lg font-semibold hover:opacity-90 disabled:opacity-50"
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
    </div>
  );
}
