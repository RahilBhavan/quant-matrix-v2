/**
 * PriceChartPanel - 3D Price Chart Interface
 *
 * Slide-in panel providing:
 * - Symbol selector
 * - Date range controls
 * - 3D price chart visualization
 * - OHLC tooltip on hover
 * - View controls (rotate/zoom/reset)
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, TrendingUp, RotateCcw, ChevronDown } from 'lucide-react';
import { PriceChart3D, OHLCTooltip } from '../visualizations/PriceChart3D';

import { getHistoricalData } from '@/services/marketDataService';
import { HistoricalBar } from '@/types';
import { panelSlideUp } from '@/utils/animation-presets';

export interface PriceChartPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialSymbol?: string;
}

type DateRange = '1M' | '3M' | '6M' | '1Y' | 'MAX';

const DATE_RANGES: { label: string; value: DateRange }[] = [
  { label: '1 Month', value: '1M' },
  { label: '3 Months', value: '3M' },
  { label: '6 Months', value: '6M' },
  { label: '1 Year', value: '1Y' },
  { label: 'Max', value: 'MAX' },
];

const POPULAR_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'SPY', 'QQQ'];

/**
 * Calculate date range
 */
function getDateRangeValues(range: DateRange): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();

  switch (range) {
    case '1M':
      from.setMonth(from.getMonth() - 1);
      break;
    case '3M':
      from.setMonth(from.getMonth() - 3);
      break;
    case '6M':
      from.setMonth(from.getMonth() - 6);
      break;
    case '1Y':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case 'MAX':
      from.setFullYear(from.getFullYear() - 5); // 5 years max
      break;
  }

  return { from, to };
}

export const PriceChartPanel: React.FC<PriceChartPanelProps> = ({
  isOpen,
  onClose,
  initialSymbol = 'AAPL',
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [inputSymbol, setInputSymbol] = useState(initialSymbol);
  const [dateRange, setDateRange] = useState<DateRange>('3M');
  const [data, setData] = useState<HistoricalBar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBar, setHoveredBar] = useState<HistoricalBar | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);

  // Fetch data when symbol or date range changes
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const { from, to } = getDateRangeValues(dateRange);
        const historicalData = await getHistoricalData(symbol, from, to);

        if (historicalData.length === 0) {
          setError('No data available for selected range');
        } else {
          setData(historicalData);
        }
      } catch (err) {
        console.error('Failed to fetch price data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol, dateRange, isOpen]);

  // Update tooltip position on mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    };

    if (isOpen) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isOpen]);

  const handleSymbolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const upperSymbol = inputSymbol.toUpperCase().trim();
    if (upperSymbol && upperSymbol !== symbol) {
      setSymbol(upperSymbol);
      setShowSymbolDropdown(false);
    }
  };

  const handleQuickSymbol = (quickSymbol: string) => {
    setSymbol(quickSymbol);
    setInputSymbol(quickSymbol);
    setShowSymbolDropdown(false);
  };

  const handleHover = (bar: HistoricalBar | null) => {
    setHoveredBar(bar);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        variants={panelSlideUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 bg-black flex flex-col"
      >
        {/* Header */}
        <div className="relative z-10 border-b border-white/20 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <TrendingUp size={20} className="text-qm-neon-cyan" />
              <h2 className="font-sans font-bold text-xl tracking-tight">PRICE CHART</h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 transition-colors interactive-zone"
              aria-label="Close panel"
            >
              <X size={20} />
            </button>
          </div>

          {/* Controls */}
          <div className="px-6 pb-4 flex flex-wrap gap-4 items-center">
            {/* Symbol Input */}
            <div className="relative">
              <form onSubmit={handleSymbolSubmit} className="flex gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={inputSymbol}
                    onChange={(e) => setInputSymbol(e.target.value)}
                    onFocus={() => setShowSymbolDropdown(true)}
                    placeholder="Symbol"
                    className="bg-black border border-white/20 text-white px-4 py-2 font-mono text-xs uppercase tracking-widest focus:border-qm-neon-cyan outline-none w-32 interactive-zone"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>
                <button
                  type="submit"
                  className="bg-white text-black px-4 py-2 font-mono text-xs uppercase tracking-widest font-bold hover:bg-gray-200 transition-colors interactive-zone"
                >
                  Load
                </button>
              </form>

              {/* Quick Symbol Dropdown */}
              {showSymbolDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full mt-2 bg-black border border-white/20 p-2 min-w-[200px] z-50"
                >
                  <div className="text-[10px] uppercase tracking-widest opacity-50 mb-2 px-2">
                    Popular Symbols
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {POPULAR_SYMBOLS.map((sym) => (
                      <button
                        key={sym}
                        onClick={() => handleQuickSymbol(sym)}
                        className="text-left px-2 py-1 font-mono text-xs hover:bg-white/10 transition-colors interactive-zone"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Date Range Selector */}
            <div className="flex gap-2">
              <Calendar size={16} className="opacity-50 self-center" />
              {DATE_RANGES.map((range) => (
                <button
                  key={range.value}
                  onClick={() => setDateRange(range.value)}
                  className={`px-3 py-2 font-mono text-xs uppercase tracking-widest transition-colors interactive-zone ${dateRange === range.value
                      ? 'bg-qm-neon-cyan text-black font-bold'
                      : 'border border-white/20 text-white hover:border-white'
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* View Controls */}
            <div className="ml-auto flex gap-2">
              <button
                className="p-2 border border-white/20 hover:border-white transition-colors interactive-zone"
                title="Reset View"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative flex-1 overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-sm">
              <div className="font-mono text-sm animate-pulse">LOADING DATA...</div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <div className="bg-red-500/10 border border-red-500 p-6 max-w-md">
                <div className="font-mono text-sm text-red-500 mb-2">ERROR</div>
                <div className="font-mono text-xs text-red-400">{error}</div>
              </div>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <>
              <PriceChart3D data={data} symbol={symbol} onHover={handleHover} />

              {/* OHLC Tooltip */}
              <OHLCTooltip bar={hoveredBar} symbol={symbol} position={tooltipPosition} />
            </>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="font-mono text-sm opacity-50">NO DATA AVAILABLE</div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="relative z-10 border-t border-white/20 bg-black/80 backdrop-blur-sm p-4">
          <div className="flex justify-between items-center font-mono text-xs">
            <div className="flex gap-6 opacity-50">
              <span>CANDLES: {data.length}</span>
              <span>RANGE: {dateRange}</span>
            </div>
            <div className="flex gap-4 opacity-50">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-qm-neon-cyan bg-qm-neon-cyan/20"></span>
                BULLISH
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-red-500 bg-red-500/20"></span>
                BEARISH
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
