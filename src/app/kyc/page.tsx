'use client';

import Link from 'next/link';
import { KYCRegistration } from '@/components/kyc-registration';

export default function KYCPage() {
  return (
    <main className="min-h-screen bg-black">
      {/* Header with Logo */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/" className="flex-shrink-0">
              <img src="/logo.svg" alt="BaseLots" className="h-10 w-auto" />
            </Link>
            <div className="flex-1 flex justify-center">
              <h1 className="text-xl font-bold">
                <span className="text-cyan-400">KYC</span>{' '}
                <span className="text-white">Verification</span>
              </h1>
            </div>
            <div className="flex-shrink-0 w-10" />
          </div>
        </div>
      </header>

      <div className="pt-12">
        <div className="text-center mb-8">
          <p className="text-gray-400">
            Complete identity verification to invest in BaseLots properties
          </p>
        </div>
        <KYCRegistration />
      </div>
    </main>
  );
}
