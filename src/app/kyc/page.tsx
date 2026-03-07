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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="pt-12 pb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-cyan-400">Verify Your</span>{' '}
            <span className="text-white">Identity</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Quick verification to start investing in real estate
          </p>
        </div>
        <KYCRegistration />
      </div>
    </main>
  );
}
