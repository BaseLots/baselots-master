'use client';

import React from 'react';
import { Lot } from '@/types/lot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface LotCardProps {
  lot: Lot;
  onInvest: (lot: Lot) => void;
}

const LotCard: React.FC<LotCardProps> = ({ lot, onInvest }) => {
  return (
    <Card className="overflow-hidden bg-white/5 border-white/10 hover:border-secondary/50 transition-all duration-300">
      <div className="aspect-video relative overflow-hidden">
        <img src={lot.image} alt={lot.name} className="object-cover w-full h-full transition-transform duration-500 hover:scale-110" />
        <div className="absolute top-2 right-2 bg-primary px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg">
          AI Valued: ${lot.aiValuation.toLocaleString()}
        </div>
      </div>
      <CardHeader>
        <CardTitle className="text-xl text-white">{lot.name}</CardTitle>
        <CardDescription className="text-white/60">{lot.location}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Price</p>
            <p className="text-lg font-semibold text-secondary">${lot.price.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-white/40 uppercase tracking-wider text-[10px] font-bold">Size</p>
            <p className="text-lg font-semibold text-white">{lot.size.toLocaleString()} sq ft</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => onInvest(lot)}
          className="w-full bg-primary hover:bg-primary/80 text-white font-bold"
        >
          Invest Now
        </Button>
      </CardFooter>
    </Card>
  );
};

export default LotCard;
