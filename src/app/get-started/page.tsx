'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  Home,
  Shield,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Mail,
} from 'lucide-react';

const CityScene = dynamic(
  () => import('@/components/home/city-scene').then((mod) => mod.CityScene),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-black" /> }
);

const faqs = [
  {
    question: 'What is BaseLots?',
    answer:
      'BaseLots is a fractional real estate investment platform that lets you buy $50-$100 shares (called "blocks") of rental properties. You earn passive income from rent and benefit from property appreciation without the hassle of traditional real estate ownership.',
    icon: Home,
  },
  {
    question: 'How does the waitlist work?',
    answer:
      "Joining the waitlist gives you early access to our platform when we launch. You'll be among the first to invest in fractional real estate properties. We'll notify you via email when spots open up.",
    icon: Clock,
  },
  {
    question: 'How much do I need to invest?',
    answer:
      'You can start with as little as $50-$100 per property share. This makes real estate investing accessible to everyone, not just wealthy investors. Build a diversified portfolio across multiple properties with minimal capital.',
    icon: Wallet,
  },
  {
    question: 'How do I earn returns?',
    answer:
      'You earn returns in two ways: (1) Monthly rental income distributions proportional to your ownership, and (2) Property value appreciation when the property is sold or you sell your shares on our secondary market.',
    icon: TrendingUp,
  },
  {
    question: 'Is my investment secure?',
    answer:
      'Yes. Each property is held in a legally compliant entity, and your ownership is represented by regulated security tokens on an L2 blockchain. We work with licensed securities attorneys and use industry-standard custody solutions.',
    icon: CheckCircle2,
  },
];

export default function GetStartedPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, interest: 'get-started' }),
    });
    setSubmitted(true);
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <div className="fixed inset-0 z-0">
        <CityScene />
      </div>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000000_85%)] pointer-events-none z-0" />

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20 md:grid md:grid-cols-3">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <img
                    src="/logo.svg"
                    alt="BaseLots"
                    className="h-24 w-auto md:h-20"
                  />
                </Link>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <Badge className="bg-[#FF5722]/20 text-[#FF5722] border-[#FF5722]/30">
                  <Shield className="w-3 h-3 mr-1" />
                  Join the Waitlist
                </Badge>
              </div>
              <div className="flex justify-end">
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="flex border-white/20 text-white hover:bg-white/10 px-6"
                  >
                    Explore Properties
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero / Waitlist Section */}
        <section className="py-20 sm:py-28 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <Badge className="mb-6 bg-[#00D4FF]/20 text-[#00D4FF] border-[#00D4FF]/30">
              <Mail className="w-3 h-3 mr-1" />
              Limited Early Access
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Get Early Access to{' '}
              <span className="text-[#FF5722]">Fractional Real Estate</span>
            </h1>
            <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 mb-10 max-w-2xl mx-auto border border-white/10">
              <p className="text-xl text-white/80 leading-relaxed">
                Join thousands of investors waiting to buy $50-$100 shares of
                rental properties. Be first in line when we launch.
              </p>
            </div>

            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 h-12 text-base font-semibold text-white placeholder:text-white/60 bg-white/15 backdrop-blur-xl border-2 border-white/40 rounded-xl shadow-2xl shadow-black/50 focus:bg-white/25 focus:border-[#00D4FF] focus:ring-4 focus:ring-[#00D4FF]/30 transition-all duration-300"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                    boxShadow: 'inset 0 1px 8px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.4)'
                  }}
                />
                <Button
                  type="submit"
                  className="bg-[#FF5722] hover:bg-[#E64A19] text-white h-12 px-8"
                >
                  Join Waitlist
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center gap-4 bg-black/50 backdrop-blur-md p-8 rounded-2xl border border-white/10 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <p className="text-xl text-white font-medium">
                  You&apos;re on the list!
                </p>
                <p className="text-white/70">
                  We&apos;ll notify you when early access opens.
                </p>
              </div>
            )}

            <div className="mt-12 inline-flex items-center gap-8 text-white/70 text-sm bg-black/50 backdrop-blur-md px-8 py-4 rounded-full border border-white/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00D4FF]" />
                <span>No fees to join</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00D4FF]" />
                <span>Early investor perks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00D4FF]" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 border-t border-white/10">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-white/60">
                Everything you need to know about BaseLots
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="border border-white/10 rounded-xl overflow-hidden bg-black/60 backdrop-blur-md"
                >
                  <button
                    onClick={() =>
                      setOpenFaq(openFaq === index ? null : index)
                    }
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/10 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#FF5722]/20 flex items-center justify-center shrink-0">
                      <faq.icon className="w-5 h-5 text-[#FF5722]" />
                    </div>
                    <span className="flex-1 text-lg font-medium text-white">
                      {faq.question}
                    </span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-white/60" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/60" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 pl-[74px]">
                      <p className="text-white/80 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="py-20 border-t border-white/10">
          <div className="max-w-3xl mx-auto px-4">
            <div className="bg-black/60 backdrop-blur-md rounded-2xl p-10 text-center border border-white/10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Start Building Wealth?
              </h2>
              <p className="text-white/70 mb-8 max-w-xl mx-auto">
                Join the waitlist today and be among the first to access
                fractional real estate investments.
              </p>
              <Link href="#">
                <Button
                  onClick={() =>
                    document
                      .querySelector('section')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="bg-[#FF5722] hover:bg-[#E64A19] text-white h-12 px-8"
                >
                  Join the Waitlist
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 text-center text-white/40 text-sm">
            <p>&copy; 2026 BaseLots. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
