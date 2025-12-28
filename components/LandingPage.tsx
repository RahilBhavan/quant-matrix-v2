import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThreeBackground } from './ThreeBackground';
import { ArrowDown, Coins, Activity, Zap, Lock, ShieldAlert } from 'lucide-react';

interface LandingPageProps {
  onEnterMatrix: () => void;
}

const StrategyRow = ({ label, value, meta, highlight = false, icon: Icon }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="group relative flex items-center justify-between py-6 border-b border-white/20 hover:bg-white hover:text-black transition-colors duration-300 px-4 interactive-zone cursor-crosshair"
  >
    <div className="flex items-center gap-4">
      {Icon && <Icon size={16} className="opacity-50 group-hover:opacity-100" />}
      <div className="flex flex-col">
        <span className="font-mono text-[10px] opacity-60 uppercase tracking-widest">{label}</span>
        <span className={`font-sans font-bold text-xl tracking-tight ${highlight ? 'text-qm-neon-cyan group-hover:text-black' : ''}`}>
          {value}
        </span>
      </div>
    </div>
    <div className="text-right">
      <span className="font-mono text-xs opacity-50 group-hover:opacity-100">{meta}</span>
    </div>
    
    {/* X-Ray Tooltip */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block z-50">
      <div className="bg-black text-white p-2 border border-black text-[10px] font-mono shadow-xl">
         CONTRACT: 0x7a...4F2A<br/>
         LIQUIDITY: DEEP
      </div>
    </div>
  </motion.div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterMatrix }) => {
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cycle Ticker
  const tickers = [
    { label: 'ETH', value: '$2,450.32' },
    { label: 'GAS', value: '12 GWEI' },
    { label: 'TVL', value: '$42.5B' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % tickers.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [tickers.length]);

  // Hold to Execute Logic
  const startHold = () => {
    setIsHolding(true);
    holdTimeoutRef.current = setTimeout(() => {
      onEnterMatrix();
    }, 1200); // 1.2s hold time
  };

  const endHold = () => {
    setIsHolding(false);
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      
      {/* --- Four-Corner HUD --- */}
      
      {/* Top Left: Identity */}
      <div className="fixed top-8 left-8 z-50 mix-blend-difference cursor-pointer" onClick={() => window.scrollTo(0,0)}>
        <span className="font-sans font-bold tracking-tighter text-lg">QUANT MATRIX [BETA]</span>
      </div>

      {/* Top Right: Market Moment */}
      <div className="fixed top-8 right-8 z-50 font-mono text-xs text-right mix-blend-difference">
        <AnimatePresence mode="wait">
          <motion.div
            key={tickerIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-2"
          >
            <span className="opacity-50">{tickers[tickerIndex].label}</span>
            <span className="font-bold">{tickers[tickerIndex].value}</span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Left: Context */}
      <div className="fixed bottom-8 left-8 z-50 font-mono text-[10px] mix-blend-difference hidden md:block">
        SCROLL TO DECRYPT // V.1.0.4
      </div>

      {/* Bottom Right: Utility */}
      <div className="fixed bottom-8 right-8 z-50 flex gap-6 font-mono text-xs mix-blend-difference">
        {['MENU', 'DOCS', 'CONNECT'].map(item => (
          <span key={item} className="cursor-pointer hover:underline interactive-zone">{item}</span>
        ))}
      </div>


      {/* --- Hero Section: The Mathematical Void --- */}
      <section className="relative h-screen flex items-center w-full overflow-hidden">
        <ThreeBackground />
        
        <div className="container mx-auto px-8 relative z-10 grid grid-cols-12 gap-4 pointer-events-none">
          <div className="col-span-12 md:col-start-2 md:col-span-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.8] mb-8 mix-blend-difference text-white"
            >
              ALPHA IN<br />
              THIRTY SECONDS.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="font-mono text-sm md:text-base opacity-70 max-w-md ml-2"
            >
              Compose. Backtest. Execute. The first all-in-one DeFi logic gate.
            </motion.p>
          </div>
        </div>
      </section>


      {/* --- Feature Section: The "Lego" Composition --- */}
      <section className="relative py-32 bg-black z-20">
        <div className="container mx-auto px-8 grid grid-cols-1 md:grid-cols-2 gap-16">
          
          {/* Sticky Description */}
          <div className="hidden md:block sticky top-32 h-fit">
            <h2 className="text-4xl font-bold mb-8">THE STACK.</h2>
            <p className="font-mono text-sm opacity-60 leading-relaxed mb-8">
              Quant Matrix isn't a dashboard. It's a compiler for financial logic. 
              Chain discrete protocols into atomic execution blocks.
            </p>
            <div className="border-l border-white/20 pl-4 space-y-2 font-mono text-xs">
              <div className="flex items-center gap-2 opacity-50">
                <ShieldAlert size={12} /> AUDITED: TRAIL OF BITS
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <Lock size={12} /> LIQUIDITY LOCK: ACTIVE
              </div>
            </div>
          </div>

          {/* The Receipt / Lego Stack */}
          <div className="border-t border-white">
            <StrategyRow 
              label="INPUT_ASSET" 
              value="100,000 USDC" 
              meta="WALLET: MAIN"
              icon={Coins}
            />
            <StrategyRow 
              label="PROTOCOL_01" 
              value="AAVE V3 // SUPPLY" 
              meta="APY: 4.2%"
              icon={Activity}
            />
            <StrategyRow 
              label="PROTOCOL_02" 
              value="LIDO // STAKE" 
              meta="REWARDS: stETH"
              icon={Zap}
            />
            <StrategyRow 
              label="NET_YIELD" 
              value="12.4% APY" 
              meta="RISK: LOW"
              highlight={true}
            />
          </div>

        </div>
      </section>


      {/* --- Portal Section: CTA --- */}
      <section className="h-[80vh] flex flex-col items-center justify-center relative z-20 bg-black">
        <h3 className="font-mono text-xs tracking-[0.5em] opacity-50 mb-12">SYSTEM READY</h3>
        
        <div 
          className="relative interactive-zone"
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
        >
          {/* The Button Base */}
          <div className="w-32 h-32 rounded-full border border-white flex items-center justify-center cursor-none relative z-10 hover:bg-white/5 transition-colors">
            <span className="font-bold text-xs">INITIALIZE</span>
          </div>

          {/* The Fill Animation */}
          <motion.div 
            className="absolute inset-0 bg-white rounded-full z-0"
            initial={{ scale: 0 }}
            animate={{ scale: isHolding ? 1.5 : 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />
          
          {/* The Ring Expansion (Decorative) */}
           <motion.div 
            className="absolute inset-0 border border-white rounded-full z-0 opacity-20"
            animate={{ scale: isHolding ? 2 : 1, opacity: isHolding ? 0 : 0.2 }}
            transition={{ duration: 1, repeat: isHolding ? Infinity : 0 }}
          />
        </div>

        <p className="mt-8 font-mono text-[10px] opacity-40">HOLD TO EXECUTE</p>
      </section>

    </div>
  );
};