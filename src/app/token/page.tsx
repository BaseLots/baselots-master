'use client';

import { TokenMinter } from '@/components/token-minter';

export default function TokenPage() {
  return (
    <main className="min-h-screen bg-black">
      <div className="pt-20">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            BaseLots <span className="text-cyan-400">Token</span>
          </h1>
          <p className="text-gray-400">
            Fractional real estate security token on Arbitrum Sepolia
          </p>
        </div>
        <TokenMinter />
      </div>
    </main>
  );
}
