'use client';

import React from 'react';
import Image from 'next/image';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  TrendingUp, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import { 
  formatCurrency, 
  formatPercentage, 
  getInvestmentProgress, 
  getDaysRemaining 
} from '@/data/mockProperties';

interface PropertyCardProps {
  property: Property;
  onClick: (property: Property) => void;
}

const statusColors = {
  available: 'bg-black/80 text-green-400 border-green-500/50 font-semibold',
  funding: 'bg-black/80 text-orange-400 border-orange-500/50 font-semibold',
  funded: 'bg-black/80 text-blue-400 border-blue-500/50 font-semibold',
  closed: 'bg-black/80 text-gray-400 border-gray-500/50 font-semibold',
};

const statusLabels = {
  available: 'Available',
  funding: 'Almost Funded',
  funded: 'Fully Funded',
  closed: 'Closed',
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick }) => {
  const progress = getInvestmentProgress(property);
  const daysRemaining = getDaysRemaining(property.investmentDeadline);
  const isAlmostFunded = progress >= 75;
  const isNew = daysRemaining > 60 && progress < 25;

  return (
    <Card 
      className="group overflow-hidden bg-black/60 border-white/10 hover:border-[#FF5722]/50 
                 transition-all duration-500 cursor-pointer backdrop-blur-sm
                 hover:shadow-[0_0_30px_rgba(255,87,34,0.15)] hover:-translate-y-1"
      onClick={() => onClick(property)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={property.images[0]}
          alt={property.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Status Badge */}
        <Badge 
          className={`absolute top-4 left-4 border px-3 py-1 shadow-lg ${statusColors[property.status]} backdrop-blur-xl`}
        >
          {statusLabels[property.status]}
        </Badge>

        {/* Hot/Featured Badge */}
        {isAlmostFunded && (
          <Badge className="absolute top-4 right-4 bg-black/80 text-[#FF5722] border border-[#FF5722]/50 px-3 py-1 font-semibold backdrop-blur-xl shadow-lg">
            🔥 Almost Funded
          </Badge>
        )}
        {isNew && (
          <Badge className="absolute top-4 right-4 bg-black/80 text-emerald-400 border border-emerald-500/50 px-3 py-1 font-semibold backdrop-blur-xl shadow-lg">
            ✨ New
          </Badge>
        )}

        {/* Quick Stats Overlay */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between text-white">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#FF5722]" />
            <span className="text-sm font-medium">{property.city}, {property.state}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" /> {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" /> {property.bathrooms}
            </span>
            <span className="flex items-center gap-1">
              <Square className="w-4 h-4" /> {property.squareFeet.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-5 space-y-4">
        {/* Title & Address */}
        <div>
          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-[#FF5722] transition-colors">
            {property.name}
          </h3>
          <p className="text-white/60 text-sm truncate">
            {property.address}, {property.city}, {property.state} {property.zipCode}
          </p>
        </div>

        {/* Financial Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Per Block</p>
            <p className="text-lg font-bold text-white">{formatCurrency(property.pricePerShare)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Yield</p>
            <p className="text-lg font-bold text-emerald-400">{formatPercentage(property.expectedYield)}</p>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">5Y Return</p>
            <p className="text-lg font-bold text-[#00bcd4]">{formatPercentage(property.projectedReturn)}</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Funding Progress
            </span>
            <span className="text-white font-semibold">{progress}%</span>
          </div>
          <Progress 
            value={progress} 
            className="h-2 bg-white/10"
          />
          <div className="flex justify-between items-center text-xs text-white/50">
            <span>{property.sharesSold.toLocaleString()} blocks sold</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {daysRemaining} days left
            </span>
          </div>
        </div>

        {/* CTA Button */}
        <Button 
          className="w-full bg-white/10 hover:bg-[#FF5722] text-white hover:text-white 
                     border border-white/20 hover:border-[#FF5722] transition-all duration-300
                     group/btn"
        >
          <span>View Investment Details</span>
          <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
