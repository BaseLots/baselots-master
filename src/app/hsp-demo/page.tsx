'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  User,
  UserX,
  ArrowRight,
  CheckCircle2,
  Database,
  Key,
  FileText,
  Activity,
  Play,
  RotateCcw,
  Building2,
  Coins,
  Users,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock transaction type
interface Transaction {
  id: string;
  type: 'inheritance' | 'tokenization' | 'verification' | 'transfer';
  from: string;
  to: string;
  amount?: string;
  property?: string;
  timestamp: Date;
  status: 'pending' | 'confirmed' | 'executed';
}

// Generate mock transactions
const generateMockTx = (count: number): Transaction[] => {
  const types: Transaction['type'][] = ['inheritance', 'tokenization', 'verification', 'transfer'];
  const userIds = ['User #1842', 'User #2156', 'User #3401', 'User #4529', 'User #5083'];
  const properties = ['Sunset Heights Villa', 'Austin Urban Lofts', 'Phoenix Desert Oasis', 'Miami Beachfront Condo'];

  return Array.from({ length: count }, (_, i) => ({
    id: `tx-${Date.now()}-${i}`,
    type: types[Math.floor(Math.random() * types.length)],
    from: userIds[Math.floor(Math.random() * userIds.length)],
    to: userIds[Math.floor(Math.random() * userIds.length)],
    amount: Math.random() > 0.5 ? `${Math.floor(Math.random() * 50 + 10)} BLOCKS` : undefined,
    property: Math.random() > 0.5 ? properties[Math.floor(Math.random() * properties.length)] : undefined,
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    status: Math.random() > 0.3 ? 'confirmed' : 'pending',
  }));
};

// Flow step component
const FlowStep = ({
  icon: Icon,
  title,
  description,
  isActive,
  isCompleted,
  delay = 0
}: {
  icon: LucideIcon,
  title: string,
  description: string,
  isActive: boolean,
  isCompleted: boolean,
  delay?: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className={`relative p-6 rounded-2xl border-2 transition-all duration-500 ${
      isActive
        ? 'border-[#FF5722] bg-[#FF5722]/10 shadow-lg shadow-[#FF5722]/20'
        : isCompleted
        ? 'border-green-500/50 bg-green-500/10'
        : 'border-white/10 bg-white/5'
    }`}
  >
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-xl ${
        isActive ? 'bg-[#FF5722]' : isCompleted ? 'bg-green-500' : 'bg-white/10'
      }`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold mb-1 ${isActive ? 'text-[#FF5722]' : 'text-white'}`}>
          {title}
        </h3>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      {isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-green-400"
        >
          <CheckCircle2 className="w-6 h-6" />
        </motion.div>
      )}
    </div>
    {isActive && (
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#FF5722] rotate-45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />
    )}
  </motion.div>
);

// Transaction item component
const TransactionItem = ({ tx }: { tx: Transaction }) => {
  const getIcon = () => {
    switch (tx.type) {
      case 'inheritance': return <Shield className="w-4 h-4 text-[#FF5722]" />;
      case 'tokenization': return <Coins className="w-4 h-4 text-[#00D4FF]" />;
      case 'verification': return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'transfer': return <ArrowRight className="w-4 h-4 text-purple-400" />;
    }
  };

  const getLabel = () => {
    switch (tx.type) {
      case 'inheritance': return 'HSP Execution';
      case 'tokenization': return 'Property Tokenized';
      case 'verification': return 'Oracle Verified';
      case 'transfer': return 'Token Transfer';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 text-sm"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-white truncate">{getLabel()}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {tx.status}
          </span>
        </div>
        <div className="text-white/50 text-xs truncate">
          {tx.from} → {tx.to}
          {tx.property && <span className="ml-2 text-[#00D4FF]">• {tx.property}</span>}
        </div>
      </div>
      <div className="text-xs text-white/40">
        {tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </motion.div>
  );
};

export default function HSPDemoPage() {
  const [simulationStep, setSimulationStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(generateMockTx(5));
  const [tokenizationProgress, setTokenizationProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const flowSteps = [
    {
      icon: User,
      title: 'Property Owner',
      description: 'Investor holds tokenized real estate shares on Arbitrum Stylus',
    },
    {
      icon: Database,
      title: 'Chainlink Oracle',
      description: 'Monitors official death records and legal databases',
    },
    {
      icon: UserX,
      title: 'Death Verification',
      description: 'Oracle confirms passing via multiple authoritative sources',
    },
    {
      icon: FileText,
      title: 'Smart Contract Trigger',
      description: 'HSP contract validates claim against on-chain will',
    },
    {
      icon: Key,
      title: 'Auto-Transfer',
      description: 'Assets automatically transferred to designated beneficiaries',
    },
  ];

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(0);

    let step = 0;
    intervalRef.current = setInterval(() => {
      step++;
      if (step >= flowSteps.length) {
        setIsSimulating(false);
        if (intervalRef.current) clearInterval(intervalRef.current);

        // Add a completion transaction
        const newTx: Transaction = {
          id: `tx-${Date.now()}`,
          type: 'inheritance',
          from: 'User #1842',
          to: 'User #2156',
          amount: '50 BLOCKS',
          property: 'Sunset Heights Villa',
          timestamp: new Date(),
          status: 'executed',
        };
        setTransactions(prev => [newTx, ...prev].slice(0, 10));
      } else {
        setSimulationStep(step);
      }
    }, 2000);
  };

  const resetSimulation = () => {
    setIsSimulating(false);
    setSimulationStep(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Animate tokenization progress
  useEffect(() => {
    const interval = setInterval(() => {
      setTokenizationProgress(prev => (prev >= 100 ? 0 : prev + 2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Add new transactions periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newTx = generateMockTx(1)[0];
        setTransactions(prev => [newTx, ...prev].slice(0, 10));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,87,34,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,212,255,0.1),transparent_50%)]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF5722]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00D4FF]/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#FF5722] to-[#FF8A65]">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl">Heritage Shield Protocol</h1>
                  <p className="text-xs text-white/50">Automated Inheritance on Arbitrum Stylus</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm text-green-400">Live Demo</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5722]/10 border border-[#FF5722]/30"
            >
              <span className="text-[#FF5722] font-medium">BaseLots Differentiator</span>
              <span className="text-white/50">|</span>
              <span className="text-white/70">Patent-Pending Technology</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold"
            >
              Protect Your Legacy{' '}
              <span className="bg-gradient-to-r from-[#FF5722] to-[#FF8A65] bg-clip-text text-transparent">
                From Probate Delays
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-white/60 max-w-3xl mx-auto"
            >
              Heritage Shield Protocol automates the asset transfer phase of inheritance. Once verified 
              records trigger the smart contract, your property tokens move to beneficiaries in seconds 
              — bypassing the 18-month probate wait for asset access.
            </motion.p>
          </section>

          {/* Main Demo Grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Flow Visualization */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Activity className="w-6 h-6 text-[#00D4FF]" />
                  How HSP Works
                </h3>
                <div className="flex gap-2">
                  {!isSimulating ? (
                    <Button
                      onClick={startSimulation}
                      className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run Simulation
                    </Button>
                  ) : (
                    <Button
                      onClick={resetSimulation}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {flowSteps.map((step, index) => (
                  <React.Fragment key={index}>
                    <FlowStep
                      icon={step.icon}
                      title={step.title}
                      description={step.description}
                      isActive={isSimulating && simulationStep === index}
                      isCompleted={isSimulating && simulationStep > index}
                      delay={index * 0.1}
                    />
                    {index < flowSteps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <motion.div
                          animate={{
                            opacity: isSimulating && simulationStep >= index ? 1 : 0.3,
                            scaleY: isSimulating && simulationStep >= index ? 1.2 : 1
                          }}
                          className="w-0.5 h-6 bg-gradient-to-b from-[#FF5722] to-[#00D4FF]"
                        />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {simulationStep === flowSteps.length - 1 && isSimulating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-center"
                >
                  <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h4 className="text-xl font-bold text-green-400 mb-2">Inheritance Executed!</h4>
                  <p className="text-white/70">Assets transferred in ~15 seconds. Zero human intervention required.</p>
                </motion.div>
              )}
            </section>

            {/* Right: Tokenization & Activity */}
            <section className="space-y-6">
              {/* Property Tokenization Visualizer */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#00D4FF]" />
                  Property Tokenization
                </h3>

                <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-white/10">
                  {/* Animated property */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="relative"
                    >
                      <Building2 className="w-20 h-20 text-[#00D4FF] opacity-50" />

                      {/* Orbiting tokens */}
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-8 h-8 -ml-4 -mt-4"
                          animate={{
                            rotate: 360,
                          }}
                          transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear",
                            delay: i * 0.5,
                          }}
                          style={{
                            top: '50%',
                            left: '50%',
                            transformOrigin: `${60 + i * 15}px`,
                          }}
                        >
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF5722] to-[#FF8A65] flex items-center justify-center text-xs font-bold">
                            B
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Progress overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-white/70">Tokenizing Property...</span>
                      <span className="text-[#00D4FF]">{tokenizationProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#00D4FF] to-[#FF5722]"
                        style={{ width: `${tokenizationProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-[#FF5722]">$50-100</div>
                    <div className="text-xs text-white/50">Per Block</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-[#00D4FF]">10K+</div>
                    <div className="text-xs text-white/50">Blocks/Property</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-white/5">
                    <div className="text-2xl font-bold text-green-400">~15s</div>
                    <div className="text-xs text-white/50">Inheritance</div>
                  </div>
                </div>
              </div>

              {/* Live Activity Ticker */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  On-Chain Activity
                  <span className="ml-auto text-xs text-white/40 font-normal">Live</span>
                </h3>

                <div className="space-y-2 max-h-64 overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    {transactions.map((tx) => (
                      <TransactionItem key={tx.id} tx={tx} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* HSP Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#FF5722]/10 to-transparent border border-[#FF5722]/20">
                  <Shield className="w-8 h-8 text-[#FF5722] mb-2" />
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-sm text-white/50">Automated Execution</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#00D4FF]/10 to-transparent border border-[#00D4FF]/20">
                  <Users className="w-8 h-8 text-[#00D4FF] mb-2" />
                  <div className="text-2xl font-bold">Zero</div>
                  <div className="text-sm text-white/50">Beneficiaries Lost</div>
                </div>
              </div>
            </section>
          </div>

          {/* Architecture Section */}
          <section className="py-12 border-t border-white/10">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Powered by Arbitrum Stylus</h3>
              <p className="text-white/60">Rust-based smart contracts for maximum security and performance</p>
            </div>

            {/* Tech Stack Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {['Arbitrum Stylus', 'ERC-3643', 'Chainlink Oracles', 'Rust/WASM', 'Solidity Interop'].map((tech) => (
                <div key={tech} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-white/80">
                  {tech}
                </div>
              ))}
            </div>

            {/* Architecture Diagram */}
            <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-16 h-16 rounded-xl bg-[#FF5722]/20 flex items-center justify-center mb-3">
                    <Database className="w-8 h-8 text-[#FF5722]" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">Identity Registry</h4>
                  <p className="text-xs text-white/50">ERC-3643 Standard</p>
                </div>

                <ArrowRight className="w-6 h-6 text-white/30 hidden md:block" />
                <div className="w-6 h-0.5 bg-white/30 md:hidden" />

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-16 h-16 rounded-xl bg-[#00D4FF]/20 flex items-center justify-center mb-3">
                    <Activity className="w-8 h-8 text-[#00D4FF]" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">Stylus Engine</h4>
                  <p className="text-xs text-white/50">Rust/WASM</p>
                </div>

                <ArrowRight className="w-6 h-6 text-white/30 hidden md:block" />
                <div className="w-6 h-0.5 bg-white/30 md:hidden" />

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-16 h-16 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                    <Key className="w-8 h-8 text-purple-400" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">Chainlink Oracle</h4>
                  <p className="text-xs text-white/50">Verification</p>
                </div>

                <ArrowRight className="w-6 h-6 text-white/30 hidden md:block" />
                <div className="w-6 h-0.5 bg-white/30 md:hidden" />

                {/* Step 4 */}
                <div className="flex flex-col items-center text-center p-4">
                  <div className="w-16 h-16 rounded-xl bg-green-500/20 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="font-semibold text-sm mb-1">Asset Transfer</h4>
                  <p className="text-xs text-white/50">~15 seconds</p>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap justify-center gap-6 text-xs text-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5722]" />
                  <span>Identity Layer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#00D4FF]" />
                  <span>Execution Layer</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                  <span>Oracle Network</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span>Settlement</span>
                </div>
              </div>
            </div>

            {/* Development Status */}
            <div className="max-w-2xl mx-auto mt-8 p-6 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <FileText className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-yellow-400 mb-1">Technical Proof-of-Concept Complete</h4>
                  <p className="text-sm text-white/70">
                    The HSP architecture is designed and prototyped. We&apos;re working with securities counsel 
                    to map state-by-state compliance before mainnet deployment. Patent pending.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="text-center py-12 border-t border-white/10">
            <h3 className="text-2xl font-bold mb-4">Ready to Reduce Probate From Years to Seconds?</h3>
            <p className="text-white/60 mb-6 max-w-2xl mx-auto">
              HSP is patent-pending technology exclusive to BaseLots. Join the waitlist to be among
              the first to secure your legacy with automated inheritance.
            </p>
            <div className="flex gap-4 justify-center">
              <Button className="bg-[#FF5722] hover:bg-[#E64A19] text-white h-12 px-8">
                Join the Waitlist
              </Button>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 h-12 px-8">
                Read the Whitepaper
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
