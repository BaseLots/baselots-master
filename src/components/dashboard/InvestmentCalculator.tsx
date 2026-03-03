'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CalcResults {
  monthlyMortgage: number;
  annualCashFlow: number;
  cashOnCashRoi: number;
  noi: number;
  capRate: number;
}

const InvestmentCalculator = () => {
  const [price, setPrice] = useState(500000);
  const [downPct, setDownPct] = useState(20);
  const [interest, setInterest] = useState(6.5);
  const [termYears, setTermYears] = useState(30);
  const [annualRent, setAnnualRent] = useState(36000);
  const [annualExp, setAnnualExp] = useState(12000);
  const [vacancyPct, setVacancyPct] = useState(5);
  const [results, setResults] = useState<CalcResults | null>(null);

  const calculate = () => {
    const downAmt = price * (downPct / 100);
    const loanAmt = price - downAmt;
    const monthlyRate = (interest / 100) / 12;
    const numPayments = termYears * 12;
    const x = Math.pow(1 + monthlyRate, numPayments);
    const monthlyMortgage = loanAmt * (monthlyRate * x) / (x - 1);

    const grossMonthlyRent = annualRent / 12;
    const effectiveMonthlyRent = grossMonthlyRent * (1 - vacancyPct / 100);
    const monthlyExp = annualExp / 12;
    const monthlyCashFlow = effectiveMonthlyRent - monthlyExp - monthlyMortgage;
    const annualCashFlow = monthlyCashFlow * 12;
    const noi = annualRent - annualExp;
    const capRate = (noi / price) * 100;
    const cashOnCashRoi = downAmt > 0 ? (annualCashFlow / downAmt) * 100 : 0;

    setResults({ monthlyMortgage, annualCashFlow, cashOnCashRoi, noi, capRate });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Investment Calculator</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          <div>
            <Label className="text-white/70 font-medium mb-2 block">Purchase Price ($)</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12"
              placeholder="500000"
            />
          </div>
          <div>
            <Label className="text-white/70 font-medium mb-2 block">Down Payment (%)</Label>
            <Input
              type="number"
              value={downPct}
              onChange={(e) => setDownPct(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12"
              placeholder="20"
            />
          </div>
          <div>
            <Label className="text-white/70 font-medium mb-2 block">Interest Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={interest}
              onChange={(e) => setInterest(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12"
              placeholder="6.5"
            />
          </div>
          <div>
            <Label className="text-white/70 font-medium mb-2 block">Loan Term (years)</Label>
            <Input
              type="number"
              value={termYears}
              onChange={(e) => setTermYears(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12"
              placeholder="30"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-white/70 font-medium mb-2 block">Annual Rental Income ($)</Label>
            <Input
              type="number"
              value={annualRent}
              onChange={(e) => setAnnualRent(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12"
              placeholder="36000"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-white/70 font-medium mb-2 block">Annual Expenses ($)</Label>
            <Input
              type="number"
              value={annualExp}
              onChange={(e) => setAnnualExp(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12"
              placeholder="12000"
            />
          </div>
          <div>
            <Label className="text-white/70 font-medium mb-2 block">Vacancy Rate (%)</Label>
            <Input
              type="number"
              step="0.1"
              value={vacancyPct}
              onChange={(e) => setVacancyPct(Number(e.target.value))}
              className="bg-white/10 border-white/20 text-white placeholder-white/50 h-12"
              placeholder="5"
            />
          </div>
          <div className="md:col-span-1">
            <Button onClick={calculate} className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 text-white font-bold mt-6 md:mt-0">
              Calculate Returns
            </Button>
          </div>
        </CardContent>
      </Card>
      {results && (
        <Card className="bg-gradient-to-br from-green-500/10 to-blue-500/10 border-green-500/30">
          <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-secondary">${results.monthlyMortgage.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              <p className="text-white/60 text-sm uppercase tracking-wider">Monthly Mortgage</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">${results.annualCashFlow.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              <p className="text-white/60 text-sm uppercase tracking-wider">Annual Cash Flow</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{results.cashOnCashRoi.toFixed(1)}%</p>
              <p className="text-white/60 text-sm uppercase tracking-wider">Cash-on-Cash ROI</p>
            </div>
            <div className="text-center md:col-span-2 lg:col-span-1">
              <p className="text-xl font-bold text-white">Cap Rate: {results.capRate.toFixed(1)}%</p>
              <p className="text-white/60 text-sm uppercase tracking-wider">NOI: ${results.noi.toLocaleString()}/yr</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InvestmentCalculator;
