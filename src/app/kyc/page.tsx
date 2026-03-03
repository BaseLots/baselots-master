'use client';

import { KYCRegistration } from '@/components/kyc-registration';

export default function KYCPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="pt-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-cyan-400">KYC</span> Verification
          </h1>
          <p className="text-gray-400">
            Complete identity verification to invest in BaseLots properties
          </p>
        </div>
        <KYCRegistration />
      </div>
    </main>
  );
}
