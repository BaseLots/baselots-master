'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import PropertyCard from './PropertyCard';
import PropertyDetail from './PropertyDetail';
import ActivityTicker from './ActivityTicker';
import { BlockchainStatus } from '@/components/blockchain-status';
import { Property, PropertyFilters } from '@/types/property';
import { mockProperties } from '@/data/mockProperties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  TrendingUp,
  Building2,
  X
} from 'lucide-react';

// Dynamically import the CityScene for background
const CityScene = dynamic(
  () => import('@/components/home/city-scene').then((mod) => mod.CityScene),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-black" />,
  }
);

const Dashboard: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  // Check if we're on production (baselots.com) - hide dev/demo features
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname === 'baselots.com' || window.location.hostname === 'www.baselots.com');

  // Filter properties based on search and filters
  const filteredProperties = useMemo(() => {
    return mockProperties.filter((property) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchableText = `${property.name} ${property.address} ${property.city} ${property.state}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // Price filters
      if (filters.minPrice && property.pricePerShare < filters.minPrice) return false;
      if (filters.maxPrice && property.pricePerShare > filters.maxPrice) return false;

      // Yield filter
      if (filters.minYield && property.expectedYield < filters.minYield) return false;

      // Property type filter
      if (filters.propertyType && filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) return false;

      // State filter
      if (filters.state && filters.state !== 'all' && property.state !== filters.state) return false;

      return true;
    });
  }, [searchQuery, filters]);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setIsDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedProperty(null), 300);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const activeFiltersCount = Object.values(filters).filter(v => v && v !== 'all').length + (searchQuery ? 1 : 0);

  // Get unique states for filter
  const uniqueStates = [...new Set(mockProperties.map(p => p.state))].sort();

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <CityScene />
      </div>
      
      {/* Vignette Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#000000_85%)] pointer-events-none z-0" />

      {/* Content */}
      <div className="relative z-10">
        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-2 text-center">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                Demo Mode
              </Badge>
              <span className="text-amber-200/80 text-sm">
                Sample properties shown for demonstration. Real investment opportunities coming soon.
              </span>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mobile Layout (< sm): Two rows */}
            <div className="flex sm:hidden flex-col py-2">
              {/* Row 1: Logo + Get Started */}
              <div className="flex items-center justify-between">
                <Link href="/">
                  <img src="/logo.svg" alt="BaseLots" className="h-14 w-auto" />
                </Link>
                <Link href="/get-started">
                  <Button 
                    variant="outline" 
                    className="border-white/20 text-white hover:bg-white/10 px-4 py-2 h-10 text-sm whitespace-nowrap"
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
              {/* Row 2: Secondary nav - hidden on production */}
              {!isProduction && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Link href="/kyc">
                    <Button variant="ghost" className="text-green-400 hover:text-green-300 hover:bg-green-950/30 text-xs px-2 py-1 h-8">
                      Verify
                    </Button>
                  </Link>
                  <Link href="/hsp-demo">
                    <Button variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 text-xs px-2 py-1 h-8">
                      HSP Demo
                    </Button>
                  </Link>
                  <Link href="/contracts/">
                    <Button variant="ghost" className="text-orange-400 hover:text-orange-300 hover:bg-orange-950/30 text-xs px-2 py-1 h-8">
                      Contracts
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Desktop Layout (>= sm): Two rows */}
            <div className="hidden sm:flex flex-col py-2">
              {/* Row 1: Logo, Stats (centered), Get Started */}
              <div className="flex items-center relative">
                {/* Logo */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link href="/">
                    <img src="/logo.svg" alt="BaseLots" className="h-20 w-auto" />
                  </Link>
                </div>

                {/* Stats Summary - Absolute center */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className="text-xs text-white/50 uppercase tracking-wider">Properties</p>
                    <p className="text-lg font-bold text-white">{mockProperties.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/50 uppercase tracking-wider">Avg Yield</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {(mockProperties.reduce((acc, p) => acc + p.expectedYield, 0) / mockProperties.length).toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-white/50 uppercase tracking-wider">Total Value</p>
                    <p className="text-lg font-bold text-[#00bcd4]">
                      ${(mockProperties.reduce((acc, p) => acc + p.totalValue, 0) / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Get Started */}
                <Link href="/get-started">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-4 text-sm whitespace-nowrap">
                    Get Started
                  </Button>
                </Link>
              </div>

              {/* Row 2: Secondary nav centered with more spacing - hidden on production */}
              {!isProduction && (
                <div className="flex items-center justify-center gap-6 mt-3">
                  <Link href="/kyc">
                    <Button variant="ghost" className="text-green-400 hover:text-green-300 hover:bg-green-950/30 text-sm px-4">
                      Verify
                    </Button>
                  </Link>
                  <Link href="/hsp-demo">
                    <Button variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-950/30 text-sm px-4">
                      HSP Demo
                    </Button>
                  </Link>
                  <Link href="/contracts/">
                    <Button variant="ghost" className="text-orange-400 hover:text-orange-300 hover:bg-orange-950/30 text-sm px-4">
                      Contracts
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4 bg-[#FF5722]/20 text-[#FF5722] border-[#FF5722]/30 hover:bg-[#FF5722]/30">
                <TrendingUp className="w-3 h-3 mr-1" />
                Preview Investment Opportunities
              </Badge>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                Fractional Real Estate
              </h2>
              <p className="text-xl text-white/60 mb-2">
                Starting at <span className="text-[#FF5722] font-bold">$50</span> per block
              </p>
              <div className="inline-block backdrop-blur-xl bg-black/40 border border-white/10 rounded-2xl px-6 sm:px-8 py-4">
                <p className="text-white/80">
                  Own a piece of premium properties. Diversify your portfolio with professionally managed real estate.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Waitlist Signup Section */}
        <div className="relative overflow-hidden border-y border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">Join the Waitlist</h3>
                  <p className="text-white/60">
                    Get notified when real investment opportunities become available. Be first in line.
                  </p>
                </div>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const email = formData.get('email') as string;
                    fetch('/api/waitlist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email }),
                    }).then(() => {
                      alert('Thanks for signing up! We\'ll notify you when we launch.');
                      (e.target as HTMLFormElement).reset();
                    });
                  }}
                  className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"
                >
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    required
                    className="h-12 px-4 bg-white/5 border-white/20 text-white placeholder:text-white/40
                             focus-visible:ring-[#FF5722]/50 focus-visible:border-[#FF5722]/50 min-w-[280px]"
                  />
                  <Button
                    type="submit"
                    className="h-12 px-6 bg-[#FF5722] hover:bg-[#FF5722]/90 text-white font-semibold"
                  >
                    Get Early Access
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Ticker */}
        <ActivityTicker />

        {/* Blockchain Status - Only show on Vercel preview */}
        {typeof window !== 'undefined' && window.location.hostname.includes('vercel.app') && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid md:grid-cols-3 gap-4">
              <BlockchainStatus />
              <div className="md:col-span-2 p-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
                  <span className="text-sm text-white font-medium">Powered by Arbitrum</span>
                </div>
                <p className="text-sm text-white/80">
                  BLOCKS are fractional shares of real estate properties. A $500K property is tokenized into 10,000 BLOCKS at $50 each. Built on Arbitrum for low fees and fast finality.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search Bar */}
        <div className="sticky top-20 z-10 bg-black/90 backdrop-blur-xl border-b border-white/10 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-grow max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <Input
                  placeholder="Search properties, cities, or states..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40
                           focus-visible:ring-[#FF5722]/50 focus-visible:border-[#FF5722]/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 px-6 border-white/20 transition-all ${
                  showFilters ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-[#FF5722] text-white text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>

              {/* View Toggle */}
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center justify-center w-10 h-10 rounded-md transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white/10 text-white' 
                      : 'text-white/40 hover:text-white'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Clear Filters */}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="h-12 text-white/50 hover:text-white hover:bg-white/5"
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
                {/* Min Price */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Min Price/Block</label>
                  <Select
                    value={filters.minPrice?.toString() || 'all'}
                    onValueChange={(v) => setFilters(f => ({ ...f, minPrice: v === 'all' ? undefined : Number(v) }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20">
                      <SelectItem value="all">Any price</SelectItem>
                      <SelectItem value="50">$50+</SelectItem>
                      <SelectItem value="100">$100+</SelectItem>
                      <SelectItem value="200">$200+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Yield */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Min Yield</label>
                  <Select
                    value={filters.minYield?.toString() || 'all'}
                    onValueChange={(v) => setFilters(f => ({ ...f, minYield: v === 'all' ? undefined : Number(v) }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Any yield" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20">
                      <SelectItem value="all">Any yield</SelectItem>
                      <SelectItem value="6">6%+</SelectItem>
                      <SelectItem value="7">7%+</SelectItem>
                      <SelectItem value="8">8%+</SelectItem>
                      <SelectItem value="9">9%+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Property Type</label>
                  <Select
                    value={filters.propertyType || 'all'}
                    onValueChange={(v) => setFilters(f => ({ ...f, propertyType: v === 'all' ? undefined : v }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20">
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="single-family">Single Family</SelectItem>
                      <SelectItem value="multi-family">Multi Family</SelectItem>
                      <SelectItem value="condo">Condo</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* State */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">State</label>
                  <Select
                    value={filters.state || 'all'}
                    onValueChange={(v) => setFilters(f => ({ ...f, state: v === 'all' ? undefined : v }))}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20">
                      <SelectItem value="all">All states</SelectItem>
                      {uniqueStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-white/30" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No properties found</h3>
              <p className="text-white/50 mb-6">Try adjusting your filters or search query</p>
              <Button 
                onClick={clearFilters}
                className="bg-[#FF5722] hover:bg-[#FF5722]/90 text-white"
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <p className="text-white/50">
                  Showing <span className="text-white font-semibold">{filteredProperties.length}</span> properties
                </p>
              </div>

              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {filteredProperties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    onClick={handlePropertyClick}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black/80 backdrop-blur-xl mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="BaseLots" className="h-16 w-auto md:h-12" />
              </div>
              <p className="text-white/40 text-sm text-center">
                © 2026 BaseLots. All rights reserved. Fractional real estate investing.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <a href="#" className="text-white/50 hover:text-white transition-colors">Terms</a>
                <a href="#" className="text-white/50 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="text-white/50 hover:text-white transition-colors">Support</a>
                {!isProduction && (
                  <>
                    <span className="text-white/20">|</span>
                    <Link href="/token" className="text-white/40 hover:text-[#FF5722] transition-colors text-xs">
                      Connect Wallet
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Property Detail Modal */}
      <PropertyDetail
        property={selectedProperty}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
};

export default Dashboard;
