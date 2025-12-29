import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Activity, DollarSign, Target, Zap, Cuboid, BarChart3, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { LegoBlock, BacktestConfig, BacktestResult } from '../types';
import { useBacktestWorker } from '../hooks/useBacktestWorker';
import { saveBacktestResult } from '../services/persistenceService';
import { EquityCurve3D } from './visualizations/EquityCurve3D';
import { ThreeSceneProvider } from './three/ThreeScene';

interface BacktestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: LegoBlock[];
}

// Progress phases for backtest simulation
const PROGRESS_PHASES = [
  { step: 1, message: 'Loading historical data...', percent: 15 },
  { step: 2, message: 'Calculating indicators...', percent: 35 },
  { step: 3, message: 'Simulating trades...', percent: 60 },
  { step: 4, message: 'Computing metrics...', percent: 85 },
  { step: 5, message: 'Rendering results...', percent: 100 },
];

interface ProgressState {
  step: number;
  message: string;
  percent: number;
}

export const BacktestPanel: React.FC<BacktestPanelProps> = ({ isOpen, onClose, blocks }) => {
  // Configuration state
  const [symbol, setSymbol] = useState('AAPL');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [initialCapital, setInitialCapital] = useState(100000);

  // Use Web Worker for backtest
  const { run, cancel, isRunning, progress, result, error } = useBacktestWorker();

  // 3D view toggle
  const [view3D, setView3D] = useState(false);

  // Save result when backtest completes
  useEffect(() => {
    if (result) {
      try {
        saveBacktestResult({
          strategyId: 'current',
          config: { symbol, startDate, endDate, initialCapital, blocks },
          result,
        });
      } catch (saveError) {
        console.error('Failed to save backtest result:', saveError);
      }
    }
  }, [result, symbol, startDate, endDate, initialCapital, blocks]);

  const handleRunBacktest = () => {
    if (blocks.length === 0) return;

    const config: BacktestConfig = {
      symbol,
      startDate,
      endDate,
      initialCapital,
      blocks,
    };

    run(config); // Non-blocking worker call
  };

  const handleCancel = () => {
    cancel();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed right-0 top-0 h-screen w-full md:w-[600px] bg-black border-l border-white z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-black border-b border-white p-6 flex items-center justify-between z-10">
              <h2 className="font-sans font-bold text-2xl tracking-tighter">BACKTEST_ENGINE</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:text-black transition-colors interactive-zone"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Configuration Form */}
              <div className="space-y-4">
                <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">Configuration</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] opacity-60 mb-1">SYMBOL</label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="w-full bg-transparent border border-white/20 px-3 py-2 font-mono text-sm focus:border-qm-neon-cyan outline-none"
                      placeholder="AAPL"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] opacity-60 mb-1">CAPITAL</label>
                    <input
                      type="number"
                      value={initialCapital}
                      onChange={(e) => setInitialCapital(Number(e.target.value))}
                      className="w-full bg-transparent border border-white/20 px-3 py-2 font-mono text-sm focus:border-qm-neon-cyan outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] opacity-60 mb-1">START_DATE</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-transparent border border-white/20 px-3 py-2 font-mono text-sm focus:border-qm-neon-cyan outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] opacity-60 mb-1">END_DATE</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-transparent border border-white/20 px-3 py-2 font-mono text-sm focus:border-qm-neon-cyan outline-none"
                    />
                  </div>
                </div>

                {/* Run Button / Progress Bar */}
                {!isRunning ? (
                  <button
                    onClick={handleRunBacktest}
                    disabled={blocks.length === 0}
                    className="w-full bg-white text-black font-bold py-3 hover:bg-qm-neon-cyan transition-colors disabled:opacity-30 disabled:cursor-not-allowed interactive-zone"
                  >
                    RUN_BACKTEST
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Progress Bar */}
                    <div className="relative h-2 bg-white/10 overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-qm-neon-cyan"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percent}%` }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                      />
                    </div>

                    {/* Status Message */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin text-qm-neon-cyan" />
                        <span className="font-mono text-xs text-white/80">
                          {progress.message}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-white/50">
                        {progress.percent}%
                      </span>
                    </div>

                    {/* Cancel Button */}
                    <button
                      onClick={handleCancel}
                      className="w-full border border-white/20 text-white/60 hover:text-white hover:border-white py-2 font-mono text-xs transition-colors interactive-zone"
                    >
                      CANCEL
                    </button>
                  </div>
                )}

                {error && (
                  <div className="border border-red-500 p-3 bg-red-500/10">
                    <p className="font-mono text-xs text-red-500">{error}</p>
                  </div>
                )}
              </div>

              {/* Results */}
              {result && (
                <>
                  {/* Metrics Grid */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">Performance Metrics</h3>

                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard
                        icon={DollarSign}
                        label="TOTAL_RETURN"
                        value={formatCurrency(result.metrics.totalReturn)}
                        subtitle={formatPercent(result.metrics.totalReturnPercent)}
                        positive={result.metrics.totalReturn >= 0}
                      />

                      <MetricCard
                        icon={Activity}
                        label="SHARPE_RATIO"
                        value={result.metrics.sharpeRatio.toFixed(2)}
                        subtitle={result.metrics.sharpeRatio > 1 ? 'GOOD' : 'LOW'}
                        positive={result.metrics.sharpeRatio > 1}
                      />

                      <MetricCard
                        icon={TrendingDown}
                        label="MAX_DRAWDOWN"
                        value={formatCurrency(result.metrics.maxDrawdown)}
                        subtitle={formatPercent(result.metrics.maxDrawdownPercent)}
                        positive={false}
                      />

                      <MetricCard
                        icon={Target}
                        label="WIN_RATE"
                        value={`${result.metrics.winRate.toFixed(1)}%`}
                        subtitle={`${result.metrics.totalTrades} TRADES`}
                        positive={result.metrics.winRate > 50}
                      />

                      <MetricCard
                        icon={TrendingUp}
                        label="PROFIT_FACTOR"
                        value={result.metrics.profitFactor.toFixed(2)}
                        subtitle={result.metrics.profitFactor > 1 ? 'PROFITABLE' : 'LOSING'}
                        positive={result.metrics.profitFactor > 1}
                      />

                      <MetricCard
                        icon={Zap}
                        label="TOTAL_TRADES"
                        value={result.metrics.totalTrades.toString()}
                        subtitle={`${Math.floor(result.trades.filter(t => t.side === 'BUY').length)} BUYS`}
                        positive={true}
                      />
                    </div>
                  </div>

                  {/* Equity Curve */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">Equity Curve</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setView3D(false)}
                          className={`p-2 border transition-colors interactive-zone ${!view3D ? 'bg-white text-black border-white' : 'border-white/20 hover:border-white'}`}
                          title="2D View"
                        >
                          <BarChart3 size={14} />
                        </button>
                        <button
                          onClick={() => setView3D(true)}
                          className={`p-2 border transition-colors interactive-zone ${view3D ? 'bg-white text-black border-white' : 'border-white/20 hover:border-white'}`}
                          title="3D View"
                        >
                          <Cuboid size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 h-64">
                      {view3D ? (
                        <ThreeSceneProvider>
                          <EquityCurve3D
                            equityCurve={result.equityCurve}
                            trades={result.trades}
                            initialCapital={initialCapital}
                          />
                        </ThreeSceneProvider>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={result.equityCurve.map(point => ({
                            date: typeof point.date === 'string' ? point.date : point.date.toISOString().split('T')[0],
                            equity: point.equity,
                          }))}>
                            <XAxis
                              dataKey="date"
                              tick={{ fill: '#fff', fontSize: 10 }}
                              tickFormatter={(val) => format(new Date(val), 'MM/dd')}
                            />
                            <YAxis
                              tick={{ fill: '#fff', fontSize: 10 }}
                              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              contentStyle={{
                                background: '#000',
                                border: '1px solid #fff',
                                borderRadius: 0,
                              }}
                              labelStyle={{ color: '#fff', fontSize: 10 }}
                              itemStyle={{ color: '#00FF9D', fontSize: 10 }}
                              formatter={(val: number) => formatCurrency(val)}
                            />
                            <Line
                              type="monotone"
                              dataKey="equity"
                              stroke="#00FF9D"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Trade List */}
                  <div className="space-y-4">
                    <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">
                      Trades ({result.trades.length})
                    </h3>

                    <div className="border border-white/20 max-h-96 overflow-y-auto">
                      <table className="w-full font-mono text-xs">
                        <thead className="sticky top-0 bg-black border-b border-white/20">
                          <tr className="text-left">
                            <th className="p-2">DATE</th>
                            <th className="p-2">SIDE</th>
                            <th className="p-2">QTY</th>
                            <th className="p-2">PRICE</th>
                            <th className="p-2">P/L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.trades.map((trade) => (
                            <tr key={trade.id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="p-2 opacity-60">
                                {format(new Date(trade.date), 'MM/dd/yyyy')}
                              </td>
                              <td className={`p-2 ${trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                {trade.side}
                              </td>
                              <td className="p-2">{trade.quantity}</td>
                              <td className="p-2">{formatCurrency(trade.price)}</td>
                              <td className={`p-2 ${trade.pnl && trade.pnl > 0 ? 'text-green-500' : trade.pnl && trade.pnl < 0 ? 'text-red-500' : 'opacity-60'}`}>
                                {trade.pnl !== undefined ? formatCurrency(trade.pnl) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Metric Card Component
interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle: string;
  positive: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, subtitle, positive }) => (
  <div className="border border-white/20 p-4 hover:bg-white/5 transition-colors">
    <div className="flex items-center gap-2 mb-2">
      <Icon size={12} className="opacity-50" />
      <span className="font-mono text-[10px] opacity-60 uppercase tracking-widest">{label}</span>
    </div>
    <div className={`font-sans font-bold text-xl mb-1 ${positive ? 'text-qm-neon-cyan' : ''}`}>
      {value}
    </div>
    <div className="font-mono text-[10px] opacity-50">{subtitle}</div>
  </div>
);
