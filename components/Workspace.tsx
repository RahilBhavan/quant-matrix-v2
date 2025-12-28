import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { HUD } from './HUD';
import { Spine } from './Spine';
import { ActionRibbon } from './ActionRibbon';
import { AVAILABLE_BLOCKS, MOCK_MARKET_DATA } from '../constants';
import { LegoBlock, MatrixStatus } from '../types';
import { auditStrategy } from '../geminiService';
import { usePortfolio } from '../context/PortfolioContext';
import { BrainCircuit, Play, ShieldAlert } from 'lucide-react';

// Pre-compute noise texture to avoid external network request and ensure instant load.
const NOISE_BASE64 = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIiBvcGFjaXR5PSIwLjE1Ii8+PC9zdmc+`;

export const Workspace: React.FC = () => {
  const [blocks, setBlocks] = useState<LegoBlock[]>([]);
  const [status, setStatus] = useState<MatrixStatus>('IDLE');
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const { state: portfolio, buyStock } = usePortfolio();

  const validateLogic = (currentBlocks: LegoBlock[]): boolean => {
    return true;
  };

  // Memoize handler to prevent ActionRibbon re-renders
  const handleAddBlock = useCallback((type: string) => {
    const template = AVAILABLE_BLOCKS.find(b => b.type === type);
    if (!template) return;

    const newBlock: LegoBlock = {
      ...template,
      id: uuidv4(),
    };

    setBlocks(prev => [...prev, newBlock]);
    setAuditResult(null); 
  }, []);

  const handleAudit = async () => {
    if (blocks.length === 0) return;
    
    setStatus('ANALYZING');
    const result = await auditStrategy(blocks);
    setAuditResult(result);
    setStatus('OPTIMAL');
  };

  const handleExecute = () => {
    if (blocks.length === 0) return;
    setStatus('EXECUTING');

    // Execute first block if it's a BUY (demo for Phase 1)
    const firstBlock = blocks[0];
    if (firstBlock.type === 'MARKET_BUY' && firstBlock.params) {
      const { ticker, quantity } = firstBlock.params;
      const mockPrice = 150; // Phase 1: mock price, Phase 2 will fetch real
      if (ticker && quantity) {
        buyStock(ticker, quantity, mockPrice);
      }
    }

    setTimeout(() => {
      alert(`STRATEGY EXECUTED\nPortfolio Value: $${portfolio.totalEquity.toFixed(2)}`);
      setStatus('OPTIMAL');
    }, 2000);
  };

  const isValid = validateLogic(blocks);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden selection:bg-white selection:text-black">
      
      {/* Background Ambience */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        style={{ backgroundImage: `url('${NOISE_BASE64}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

      {/* Memoized HUD */}
      <HUD status={status} marketData={MOCK_MARKET_DATA} />

      {/* Main Workspace */}
      <main className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        
        <Spine blocks={blocks} setBlocks={setBlocks} isValid={isValid} />

        {/* Execution Controls */}
        <AnimatePresence>
          {blocks.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="absolute bottom-32 flex gap-4 z-50"
            >
              <button 
                onClick={handleAudit}
                disabled={status === 'ANALYZING'}
                className="bg-black border border-white/20 text-white hover:border-white px-6 py-3 font-mono text-xs uppercase tracking-widest flex items-center gap-2 transition-all hover:bg-white/5 disabled:opacity-50 interactive-zone"
              >
                {status === 'ANALYZING' ? <span className="animate-pulse">PROCESSING...</span> : (
                    <>
                        <BrainCircuit size={14} />
                        AUDIT_LOGIC
                    </>
                )}
              </button>

              <button 
                onClick={handleExecute}
                className="bg-white text-black px-8 py-3 font-mono text-xs uppercase tracking-widest font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors interactive-zone"
              >
                <Play size={14} fill="black" />
                EXECUTE
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audit Result Overlay */}
        <AnimatePresence>
          {auditResult && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-1/2 right-12 -translate-y-1/2 w-80 bg-black/90 border-l border-white p-6 backdrop-blur-md z-50 shadow-2xl shadow-white/5"
            >
                <div className="flex items-center gap-2 mb-4 text-qm-white">
                    <ShieldAlert size={16} />
                    <h3 className="font-bold font-sans tracking-tight">AUDIT REPORT</h3>
                </div>
                <p className="font-mono text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {auditResult}
                </p>
                <button onClick={() => setAuditResult(null)} className="mt-4 text-[10px] uppercase underline opacity-50 hover:opacity-100 interactive-zone">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Memoized Action Ribbon */}
      <ActionRibbon onAddBlock={handleAddBlock} />
    </div>
  );
};
