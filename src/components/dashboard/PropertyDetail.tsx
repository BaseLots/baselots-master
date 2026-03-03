'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar,
  TrendingUp,
  DollarSign,
  Shield,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  CreditCard,
  Building2,
  Coins
} from 'lucide-react';
import { 
  formatCurrency, 
  formatPercentage, 
  getInvestmentProgress, 
  getDaysRemaining 
} from '@/data/mockProperties';

interface PropertyDetailProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
}

const crimeLabels = {
  low: { label: 'Low Crime', color: 'text-emerald-400', icon: Shield },
  moderate: { label: 'Moderate Crime', color: 'text-yellow-400', icon: AlertTriangle },
  high: { label: 'High Crime', color: 'text-red-400', icon: AlertTriangle },
};

const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'ach' | 'crypto'>('card');

  if (!property) return null;

  const progress = getInvestmentProgress(property);
  const daysRemaining = getDaysRemaining(property.investmentDeadline);
  const crimeInfo = crimeLabels[property.crimeIndex];
  const CrimeIcon = crimeInfo.icon;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const handleCreateAccount = async () => {
    if (!email) return;
    
    setIsCreatingAccount(true);
    // Simulate account creation and embedded wallet setup
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsCreatingAccount(false);
    setHasAccount(true);
  };

  const handleInvest = async () => {
    if (!investmentAmount || Number(investmentAmount) < property.pricePerShare) return;
    
    setIsInvesting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsInvesting(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setInvestmentAmount('');
      setEmail('');
      setHasAccount(false);
    }, 3000);
  };

  const estimatedShares = investmentAmount 
    ? Math.floor(Number(investmentAmount) / property.pricePerShare) 
    : 0;

  const estimatedAnnualReturn = estimatedShares * property.pricePerShare * (property.expectedYield / 100);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl bg-black/95 border-white/10 p-0 overflow-hidden backdrop-blur-xl"
      >
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Investment Submitted!</h3>
            <p className="text-white/60">
              Your investment of {formatCurrency(Number(investmentAmount))} has been received.
              You&apos;ll receive a confirmation email shortly.
            </p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {/* Image Gallery */}
            <div className="relative h-72 sm:h-80">
              <Image
                src={property.images[currentImageIndex]}
                alt={property.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              
              {/* Navigation Arrows */}
              {property.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 
                             backdrop-blur-sm flex items-center justify-center text-white
                             hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 
                             backdrop-blur-sm flex items-center justify-center text-white
                             hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {property.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentImageIndex 
                        ? 'bg-white w-6' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>

              {/* Close Button for mobile */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 
                         backdrop-blur-sm flex items-center justify-center text-white
                         hover:bg-black/70 transition-colors lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-[#FF5722]/20 text-[#FF5722] border-[#FF5722]/30">
                    {property.propertyType.replace('-', ' ')}
                  </Badge>
                  <Badge className="bg-white/10 text-white/80">
                    Built {property.yearBuilt}
                  </Badge>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{property.name}</h2>
                <div className="flex items-center gap-2 text-white/60">
                  <MapPin className="w-4 h-4" />
                  <span>{property.address}, {property.city}, {property.state} {property.zipCode}</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Bed className="w-5 h-5 mx-auto mb-2 text-[#FF5722]" />
                  <p className="text-xl font-bold text-white">{property.bedrooms}</p>
                  <p className="text-xs text-white/50">Bedrooms</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Bath className="w-5 h-5 mx-auto mb-2 text-[#FF5722]" />
                  <p className="text-xl font-bold text-white">{property.bathrooms}</p>
                  <p className="text-xs text-white/50">Bathrooms</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <Square className="w-5 h-5 mx-auto mb-2 text-[#FF5722]" />
                  <p className="text-xl font-bold text-white">{property.squareFeet.toLocaleString()}</p>
                  <p className="text-xs text-white/50">Sq Ft</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">About this Property</h3>
                <p className="text-white/70 leading-relaxed">{property.description}</p>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity) => (
                    <Badge 
                      key={amenity}
                      variant="outline"
                      className="border-white/20 text-white/80 bg-white/5"
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Investment Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#FF5722]" />
                  Investment Opportunity
                </h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-white/50 mb-1">Total Value</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(property.totalValue)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-white/50 mb-1">Monthly Rent</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(property.monthlyRent)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-white/50 mb-1">Expected Yield</p>
                    <p className="text-xl font-bold text-emerald-400">{formatPercentage(property.expectedYield)}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-sm text-white/50 mb-1">5Y Projected Return</p>
                    <p className="text-xl font-bold text-[#00bcd4]">{formatPercentage(property.projectedReturn)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Funding Progress</span>
                    <span className="text-white font-bold">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3 bg-white/10" />
                  <div className="flex justify-between text-sm text-white/50">
                    <span>{property.sharesSold.toLocaleString()} of {property.totalShares.toLocaleString()} blocks sold</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {daysRemaining} days left
                    </span>
                  </div>
                </div>
              </div>

              {/* Neighborhood Stats */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Neighborhood</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-emerald-400">{property.neighborhoodRating}</span>
                    </div>
                    <p className="text-xs text-white/50">Neighborhood<br/>Rating</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                      <GraduationCap className="w-5 h-5 text-blue-400" />
                      <span className="text-lg font-bold text-blue-400 ml-1">{property.schoolRating}</span>
                    </div>
                    <p className="text-xs text-white/50">School<br/>Rating</p>
                  </div>
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                      property.crimeIndex === 'low' ? 'bg-emerald-500/20' : 
                      property.crimeIndex === 'moderate' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                    }`}>
                      <CrimeIcon className={`w-5 h-5 ${crimeInfo.color}`} />
                    </div>
                    <p className="text-xs text-white/50">{crimeInfo.label}</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              {/* Investment Form */}
              <div className="bg-gradient-to-br from-[#FF5722]/10 to-transparent rounded-2xl p-6 border border-[#FF5722]/20">
                <h3 className="text-lg font-semibold text-white mb-4">Invest Now</h3>
                
                {isCreatingAccount ? (
                  // Creating Account State
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="w-12 h-12 text-[#FF5722] animate-spin mb-4" />
                    <p className="text-white font-semibold mb-2">Creating your secure account...</p>
                    <p className="text-white/60 text-sm text-center">
                      Setting up your investment wallet and verifying your email
                    </p>
                  </div>
                ) : !hasAccount ? (
                  // Email Signup Form
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Get started with your email
                      </Label>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-14 bg-black/50 border-white/20 text-white text-lg
                                 focus-visible:ring-[#FF5722]/50 focus-visible:border-[#FF5722]"
                      />
                      <p className="text-xs text-white/40 mt-2">
                        We&apos;ll create a secure investment account for you automatically
                      </p>
                    </div>

                    <Button
                      onClick={handleCreateAccount}
                      disabled={!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)}
                      className="w-full h-14 bg-[#FF5722] hover:bg-[#FF5722]/90 text-white font-bold text-lg
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Continue to Invest
                    </Button>

                    <div className="text-center">
                      <button 
                        className="text-sm text-white/50 hover:text-white transition-colors underline"
                        onClick={() => {/* TODO: Add wallet connection modal */}}
                      >
                        Already have a wallet? Connect it here
                      </button>
                    </div>

                    <p className="text-xs text-white/40 text-center">
                      By continuing, you agree to our Terms of Service and understand the risks involved.
                    </p>
                  </div>
                ) : (
                  // Investment Amount Form (shown after account creation)
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-lg p-3 mb-4 flex items-center justify-between">
                      <span className="text-white/70 text-sm">Signed in as:</span>
                      <span className="text-white font-semibold text-sm">{email}</span>
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <Label className="text-white/70 mb-3 block">Payment Method</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setPaymentMethod('card')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                            ${paymentMethod === 'card' 
                              ? 'border-[#FF5722] bg-[#FF5722]/10' 
                              : 'border-white/20 bg-white/5 hover:border-white/40'}`}
                        >
                          <CreditCard className={`w-6 h-6 ${paymentMethod === 'card' ? 'text-[#FF5722]' : 'text-white/60'}`} />
                          <span className={`text-sm font-medium ${paymentMethod === 'card' ? 'text-white' : 'text-white/60'}`}>
                            Card
                          </span>
                          <span className="text-xs text-white/40">Instant</span>
                        </button>
                        
                        <button
                          onClick={() => setPaymentMethod('ach')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                            ${paymentMethod === 'ach' 
                              ? 'border-[#FF5722] bg-[#FF5722]/10' 
                              : 'border-white/20 bg-white/5 hover:border-white/40'}`}
                        >
                          <Building2 className={`w-6 h-6 ${paymentMethod === 'ach' ? 'text-[#FF5722]' : 'text-white/60'}`} />
                          <span className={`text-sm font-medium ${paymentMethod === 'ach' ? 'text-white' : 'text-white/60'}`}>
                            ACH
                          </span>
                          <span className="text-xs text-white/40">3-5 days</span>
                        </button>
                        
                        <button
                          onClick={() => setPaymentMethod('crypto')}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all
                            ${paymentMethod === 'crypto' 
                              ? 'border-[#FF5722] bg-[#FF5722]/10' 
                              : 'border-white/20 bg-white/5 hover:border-white/40'}`}
                        >
                          <Coins className={`w-6 h-6 ${paymentMethod === 'crypto' ? 'text-[#FF5722]' : 'text-white/60'}`} />
                          <span className={`text-sm font-medium ${paymentMethod === 'crypto' ? 'text-white' : 'text-white/60'}`}>
                            Crypto
                          </span>
                          <span className="text-xs text-white/40">Advanced</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-white/70 mb-2 block">
                        Investment Amount (Min: {formatCurrency(property.pricePerShare)})
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <Input
                          type="number"
                          placeholder={`${property.pricePerShare}`}
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                          className="h-14 pl-12 bg-black/50 border-white/20 text-white text-lg
                                   focus-visible:ring-[#FF5722]/50 focus-visible:border-[#FF5722]"
                          min={property.pricePerShare}
                          step={property.pricePerShare}
                        />
                      </div>
                    </div>

                    {estimatedShares > 0 && (
                      <div className="bg-white/5 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Blocks You&apos;ll Receive:</span>
                          <span className="text-white font-semibold">{estimatedShares}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-white/60">Estimated Annual Return:</span>
                          <span className="text-emerald-400 font-semibold">{formatCurrency(estimatedAnnualReturn)}</span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleInvest}
                      disabled={!investmentAmount || Number(investmentAmount) < property.pricePerShare || isInvesting}
                      className="w-full h-14 bg-[#FF5722] hover:bg-[#FF5722]/90 text-white font-bold text-lg
                               disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isInvesting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        `Invest ${investmentAmount ? formatCurrency(Number(investmentAmount)) : ''}`
                      )}
                    </Button>

                    <p className="text-xs text-white/40 text-center">
                      Payment processed securely. You&apos;ll receive a confirmation email.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default PropertyDetail;
