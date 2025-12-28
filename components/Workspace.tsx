import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { HUD } from './HUD';
import { Spine } from './Spine';
import { ActionRibbon } from './ActionRibbon';

// Lazy load heavy panels for better performance
const BacktestPanel = lazy(() => import('./BacktestPanel').then(m => ({ default: m.BacktestPanel })));
const StrategyLibrary = lazy(() => import('./StrategyLibrary').then(m => ({ default: m.StrategyLibrary })));
const PriceChartPanel = lazy(() => import('./panels/PriceChartPanel').then(m => ({ default: m.PriceChartPanel })));
const PortfolioPanel = lazy(() => import('./panels/PortfolioPanel').then(m => ({ default: m.PortfolioPanel })));
import { AVAILABLE_BLOCKS, MOCK_MARKET_DATA } from '../constants';
import { LegoBlock, MatrixStatus, ExecutionContext, ValidationResult } from '../types';
import { auditStrategy } from '../geminiService';
import { usePortfolio } from '../context/PortfolioContext';
import { validateStrategy } from '../services/strategyValidator';
import { executeStrategy } from '../services/executionEngine';
import { getQuote } from '../services/marketDataService';
import { BrainCircuit, Play, ShieldAlert, AlertCircle } from 'lucide-react';

// Pre-compute noise texture to avoid external network request and ensure instant load.
const NOISE_BASE64 = `data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIiBvcGFjaXR5PSIwLjE1Ii8+PC9zdmc+`;

export const Workspace: React.FC = () => {
  const [blocks, setBlocks] = useState<LegoBlock[]>([]);
  const [status, setStatus] = useState<MatrixStatus>('IDLE');
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showBacktestPanel, setShowBacktestPanel] = useState(false);
  const [showStrategyLibrary, setShowStrategyLibrary] = useState(false);
  const [showPriceChart, setShowPriceChart] = useState(false);
  const [showPortfolioPanel, setShowPortfolioPanel] = useState(false);
  const { state: portfolio, buyStock, sellStock } = usePortfolio();

  // Validate strategy whenever blocks change
  useEffect(() => {
    const result = validateStrategy(blocks);
    setValidationResult(result);
  }, [blocks]);

  const isValid = validationResult?.valid ?? false;

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

  const handleExecute = async () => {
    if (blocks.length === 0) return;

    // Validate first
    if (!isValid) {
      alert('Strategy has validation errors. Please fix them before executing.');
      return;
    }

    setStatus('EXECUTING');

    try {
      // Get ticker from first block
      const ticker = blocks.find(b => b.params?.ticker)?.params?.ticker || 'AAPL';

      // Fetch real quote
      const quote = await getQuote(ticker);

      // Build historical prices for indicators (simplified - in backtesting we have full history)
      const priceHistory: number[] = [quote.price];

      // Create execution context
      const context: ExecutionContext = {
        currentBar: {
          date: new Date(),
          open: quote.price,
          high: quote.price,
          low: quote.price,
          close: quote.price,
          volume: quote.volume,
        },
        portfolio: {
          cash: portfolio.cash,
          positions: [...portfolio.positions],
          totalEquity: portfolio.totalEquity,
        },
        indicators: new Map([['prices', priceHistory]]),
        mode: 'live',
        peakEquity: portfolio.totalEquity,
      };

      // Execute strategy
      const actions = executeStrategy(blocks, context);

      // Apply actions to portfolio
      for (const action of actions) {
        if (action.type === 'BUY' && action.symbol && action.quantity && action.price) {
          buyStock(action.symbol, action.quantity, action.price);
        } else if (action.type === 'SELL' && action.symbol && action.quantity && action.price) {
          sellStock(action.symbol, action.quantity);
        }
      }

      setTimeout(() => {
        const actionSummary = actions.map(a => `${a.type}: ${a.reason}`).join('\n');
        alert(`STRATEGY EXECUTED\n\n${actionSummary}\n\nPortfolio Value: $${portfolio.totalEquity.toFixed(2)}`);
        setStatus('OPTIMAL');
      }, 1000);
    } catch (error) {
      console.error('Execution error:', error);
      alert(`Execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatus('CRITICAL');
    }
  };

  const handleLoadStrategy = (loadedBlocks: LegoBlock[]) => {
    setBlocks(loadedBlocks);
    setAuditResult(null);
    setValidationResult(null);
    setShowStrategyLibrary(false);
  };



  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden selection:bg-white selection:text-black">

      {/* Background Ambience */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ backgroundImage: `url('${NOISE_BASE64}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none" />

      {/* Memoized HUD */}
      <HUD
        status={status}
        marketData={MOCK_MARKET_DATA}
        onOpenBacktest={() => setShowBacktestPanel(true)}
        onOpenLibrary={() => setShowStrategyLibrary(true)}
        onOpenPriceChart={() => setShowPriceChart(true)}
        onOpenPortfolio={() => setShowPortfolioPanel(true)}
      />

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

        {/* Validation Errors Overlay */}
        <AnimatePresence>
          {validationResult && !validationResult.valid && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-32 right-12 w-80 bg-red-500/10 border border-red-500 p-6 backdrop-blur-md z-50"
            >
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-red-500" />
                <h3 className="font-bold font-sans tracking-tight text-red-500">VALIDATION ERRORS</h3>
              </div>
              <div className="space-y-2">
                {validationResult.errors.map((error, i) => (
                  <div key={i} className="font-mono text-xs text-red-400">
                    • {error.message}
                  </div>
                ))}
                {validationResult.warnings.length > 0 && (
                  <>
                    <div className="mt-4 font-mono text-[10px] text-yellow-500 uppercase tracking-widest">Warnings:</div>
                    {validationResult.warnings.map((warning, i) => (
                      <div key={i} className="font-mono text-xs text-yellow-400">
                        • {warning.message}
                      </div>
                    ))}
                  </>
                )}
              </div>
              <button onClick={() => setValidationResult(null)} className="mt-4 text-[10px] uppercase underline opacity-50 hover:opacity-100 interactive-zone text-red-500">Dismiss</button>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Memoized Action Ribbon */}
      <ActionRibbon onAddBlock={handleAddBlock} />

      {/* Lazy-loaded Panels with Suspense */}
      <Suspense fallback={null}>
        {showBacktestPanel && (
          <BacktestPanel
            isOpen={showBacktestPanel}
            onClose={() => setShowBacktestPanel(false)}
            blocks={blocks}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showStrategyLibrary && (
          <StrategyLibrary
            isOpen={showStrategyLibrary}
            onClose={() => setShowStrategyLibrary(false)}
            currentBlocks={blocks}
            onLoadStrategy={handleLoadStrategy}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showPriceChart && (
          <PriceChartPanel
            isOpen={showPriceChart}
            onClose={() => setShowPriceChart(false)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {showPortfolioPanel && (
          <PortfolioPanel
            isOpen={showPortfolioPanel}
            onClose={() => setShowPortfolioPanel(false)}
          />
        )}
      </Suspense>
    </div>
  );
};
