'use client';

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
  email: string;
  fullName: string;
  country: string;
  isAccredited: boolean;
  submittedAt: string;
  verifiedAt?: string;
  identityHash: string;
}

export function KYCRegistration() {
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [step, setStep] = useState<'intro' | 'form' | 'submitting' | 'complete'>('intro');
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    ssn: '',
    country: 'US',
    isAccredited: false,
  });
  const [ssnError, setSsnError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Validate email
  const validateEmail = (value: string) => {
    if (value.length === 0) {
      setEmailError('');
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({...formData, email: value});
    validateEmail(value);
    
    // Check if user already verified with this email
    if (validateEmail(value)) {
      const saved = localStorage.getItem(`kyc-${value}`);
      if (saved) {
        try {
          setKycData(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved KYC data', e);
        }
      }
    }
  };

  // Validate full name
  const validateName = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setNameError('');
      return false;
    }
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    if (words.length < 2) {
      setNameError('Please enter both first and last name');
      return false;
    }
    const shortWords = words.filter(word => word.length < 2);
    if (shortWords.length > 0) {
      setNameError('Each name must be at least 2 characters');
      return false;
    }
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

  // Format SSN
  const formatSSN = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 9);
    
    if (limited.length <= 3) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 3)}-${limited.slice(3)}`;
    } else {
      return `${limited.slice(0, 3)}-${limited.slice(3, 5)}-${limited.slice(5)}`;
    }
  };

  // Validate SSN
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
      const firstThree = digits.slice(0, 3);
      if (firstThree === '000' || firstThree === '666' || (parseInt(firstThree) >= 900)) {
        setSsnError('Invalid SSN format');
        return false;
      }
      if (digits.slice(3, 5) === '00') {
        setSsnError('Invalid SSN format');
        return false;
      }
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

  // Simulate admin approval after 10 seconds
  useEffect(() => {
    if (kycData?.status === 'pending') {
      const timer = setTimeout(() => {
        const verified: KYCData = {
          ...kycData,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
          identityHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
        };
        localStorage.setItem(`kyc-${kycData.email}`, JSON.stringify(verified));
        setKycData(verified);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [kycData?.status, kycData?.email]);

  const handleSubmit = () => {
    setStep('submitting');
    
    setTimeout(() => {
      const newKYC: KYCData = {
        status: 'pending',
        email: formData.email,
        fullName: formData.fullName,
        country: formData.country,
        isAccredited: formData.isAccredited,
        submittedAt: new Date().toISOString(),
        identityHash: '',
      };
      localStorage.setItem(`kyc-${formData.email}`, JSON.stringify(newKYC));
      setKycData(newKYC);
      setStep('complete');
    }, 2000);
  };

  const resetKYC = () => {
    if (formData.email) {
      localStorage.removeItem(`kyc-${formData.email}`);
    }
    setKycData(null);
    setStep('intro');
    setFormData({
      email: '',
      fullName: '',
      ssn: '',
      country: 'US',
      isAccredited: false,
    });
  };

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
              <h2 className="text-xl font-bold text-green-400">Identity Verified</h2>
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
              <span className="text-gray-400">Email</span>
              <span className="text-white">{kycData.email}</span>
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
              <span className="text-white font-mono text-xs">{kycData.identityHash.slice(0, 20)}...</span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex gap-4">
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-orange-500 text-white"
          >
            Go to Dashboard
          </Button>
          <Button 
            onClick={resetKYC}
            variant="outline"
            className="border-gray-700 text-gray-400 hover:bg-gray-800"
          >
            Reset (Demo)
          </Button>
        </div>
      </div>
    );
  }

  // Show pending status
  if (kycData?.status === 'pending') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-yellow-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verification Pending</h2>
        <p className="text-gray-400 mb-6">
          Your application is being reviewed. This usually takes 1-2 business days.
        </p>
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-6">
          <p className="text-sm text-gray-400 mb-2">Demo Mode: Auto-approving in 10 seconds...</p>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="bg-gradient-to-r from-cyan-500 to-orange-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
        <Button 
          onClick={resetKYC}
          variant="outline"
          className="border-gray-700 text-gray-400"
        >
          Cancel & Start Over
        </Button>
      </div>
    );
  }

  // Show submission success
  if (step === 'complete') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
        <p className="text-gray-400 mb-8">
          We&apos;ve received your application. You&apos;ll be notified via email once verification is complete.
        </p>
      </div>
    );
  }

  // Show submitting state
  if (step === 'submitting') {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center">
        <div className="w-20 h-20 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-cyan-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Submitting...</h2>
        <p className="text-gray-400">Please wait while we process your information</p>
      </div>
    );
  }

  // Show form
  if (step === 'form') {
    // Compute validity without calling validators that set state
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const nameTrimmed = formData.fullName.trim();
    const nameWords = nameTrimmed.split(/\s+/).filter(w => w.length > 0);
    const nameValid = nameWords.length >= 2 && 
                      nameWords.every(w => w.length >= 2) &&
                      /^[a-zA-Z\s\-\'\.]+$/.test(nameTrimmed);
    const ssnDigits = formData.ssn.replace(/\D/g, '');
    const ssnFirstThree = ssnDigits.slice(0, 3);
    const ssnValid = ssnDigits.length === 9 && 
                     ssnFirstThree !== '000' && 
                     ssnFirstThree !== '666' && 
                     parseInt(ssnFirstThree) < 900 &&
                     ssnDigits.slice(3, 5) !== '00' &&
                     ssnDigits.slice(5) !== '0000';
    const isFormValid = emailValid && nameValid && ssnValid;

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6">Identity Verification</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {emailError && <p className="text-red-400 text-sm mt-1">{emailError}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Full Legal Name *
              </label>
              <Input
                type="text"
                value={formData.fullName}
                onChange={handleNameChange}
                placeholder="John Smith"
                className="bg-gray-800 border-gray-700 text-white"
              />
              {nameError && <p className="text-red-400 text-sm mt-1">{nameError}</p>}
              {!nameError && formData.fullName.trim().length > 0 && nameValid && (
                <p className="text-green-400 text-sm mt-1">✓ Name looks good</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Social Security Number (US) *
              </label>
              <Input
                type="text"
                value={formData.ssn}
                onChange={handleSSNChange}
                placeholder="XXX-XX-XXXX"
                maxLength={11}
                className="bg-gray-800 border-gray-700 text-white font-mono"
              />
              {ssnError && <p className="text-red-400 text-sm mt-1">{ssnError}</p>}
              {!ssnError && ssnValid && (
                <p className="text-green-400 text-sm mt-1">✓ SSN format valid</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Country of Residence
              </label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({...formData, country: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2"
              >
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="UK">United Kingdom</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg">
              <input
                type="checkbox"
                id="accredited"
                checked={formData.isAccredited}
                onChange={(e) => setFormData({...formData, isAccredited: e.target.checked})}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="accredited" className="text-sm text-gray-300 flex-1">
                I am an accredited investor
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="text-cyan-400 hover:text-cyan-300 ml-2" type="button">
                      (What&apos;s this?)
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Accredited Investor Status</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-gray-300">
                      <p>Under SEC rules, an accredited investor is someone who meets ONE of these criteria:</p>
                      <ul className="list-disc list-inside space-y-2 text-gray-400">
                        <li>Annual income exceeding $200,000 (or $300,000 joint) for the last 2 years</li>
                        <li>Net worth over $1 million (excluding primary residence)</li>
                        <li>Professional certifications (Series 7, 65, 82)</li>
                        <li>Director, executive officer, or general partner of the issuer</li>
                      </ul>
                      <p className="text-cyan-400 text-xs mt-3">
                        Note: Non-accredited investors can still invest, but with lower maximum amounts under Reg CF.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </label>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Verification
            </Button>
            <Button
              onClick={() => setStep('intro')}
              variant="outline"
              className="w-full border-gray-700 text-gray-400"
            >
              Back
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Your information is encrypted and stored securely. We comply with all federal investment regulations.
          </p>
        </div>
      </div>
    );
  }

  // Show intro/landing
  return (
    <div className="p-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-4 text-white">Get Verified to Invest</h2>
      <p className="text-gray-400 mb-8">
        Complete identity verification to start investing in fractional real estate. Takes less than 2 minutes.
      </p>
      
      <Button
        onClick={() => setStep('form')}
        className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 text-white py-6 text-lg font-semibold hover:opacity-90"
      >
        Start Verification
      </Button>

      <div className="mt-6 p-4 bg-gray-800/50 rounded-lg text-left">
        <p className="text-sm text-gray-400 mb-2"><strong className="text-white">What you&apos;ll need:</strong></p>
        <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
          <li>Legal name and SSN</li>
          <li>Email address</li>
          <li>Country of residence</li>
          <li>Accredited investor status (optional)</li>
        </ul>
      </div>
    </div>
  );
}
