import React, { useEffect, useState, memo } from 'react';
import { MarketData, MatrixStatus } from '../types';
import { usePortfolio } from '../context/PortfolioContext';
import { getQuote, isMarketOpen } from '../services/marketDataService';

interface HUDProps {
  status: MatrixStatus;
  marketData: MarketData;
  onOpenBacktest: () => void;
  onOpenLibrary: () => void;
  onOpenPriceChart: () => void;
}

export const HUD: React.FC<HUDProps> = memo(({ status, marketData, onOpenBacktest, onOpenLibrary, onOpenPriceChart }) => {
  const { state: portfolio } = usePortfolio();
  const [demoQuote, setDemoQuote] = useState<{ price: number; change: number } | null>(null);

  useEffect(() => {
    const fetchDemoQuote = async () => {
      try {
        const quote = await getQuote('SPY');
        setDemoQuote({ price: quote.price, change: quote.changePercent });
      } catch (error) {
        console.error('Failed to fetch demo quote:', error);
      }
    };

    if (import.meta.env.VITE_ALPHA_VANTAGE_KEY) {
      fetchDemoQuote();
    }
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  const dailyPL = portfolio.totalEquity - 100000;
  const dailyPLPercent = (dailyPL / 100000) * 100;

  const marketStatus = isMarketOpen() ? 'OPEN' : 'CLOSED';

  return (
    <>
      {/* Top Left: Identity */}
      <div className="fixed top-6 left-8 z-50 pointer-events-none">
        <h1 className="font-sans font-black text-2xl tracking-tighter leading-none hover:animate-glitch pointer-events-auto cursor-default">
          QUANT MATRIX<br />
          <span className="text-xs font-mono font-normal tracking-widest opacity-60">
            PAPER_TRADING_v1
          </span>
        </h1>
      </div>

      {/* Top Right: Portfolio Value */}
      <div className="fixed top-6 right-8 z-50 text-right font-mono text-xs space-y-1 pointer-events-none">
        <div className="flex items-center justify-end gap-2">
          <span className="opacity-50">PORTFOLIO</span>
          <span className="font-bold text-white text-lg">
            {formatCurrency(portfolio.totalEquity)}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="opacity-50">DAILY_P/L</span>
          <span className={`font-bold ${dailyPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(dailyPL)} ({formatPercent(dailyPLPercent)})
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="opacity-50">POSITIONS</span>
          <span>{portfolio.positions.length}</span>
        </div>
        {demoQuote && (
          <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/10">
            <span className="opacity-50">SPY</span>
            <span className={demoQuote.change >= 0 ? 'text-green-500' : 'text-red-500'}>
              {formatCurrency(demoQuote.price)} ({formatPercent(demoQuote.change)})
            </span>
          </div>
        )}
      </div>

      {/* Bottom Left: Navigation */}
      <div className="fixed bottom-32 left-8 z-50 hidden md:flex flex-col gap-2 font-mono text-xs opacity-80">
        <div className="flex items-center gap-2 text-white font-bold">
          <span className="w-2 h-2 bg-white"></span>
          [01] WORKSPACE
        </div>
        <div
          onClick={onOpenBacktest}
          className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer interactive-zone"
        >
          <span className="w-2 h-2 border border-white"></span>
          [02] BACKTEST
        </div>
        <div
          onClick={onOpenLibrary}
          className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer interactive-zone"
        >
          <span className="w-2 h-2 border border-white"></span>
          [03] LIBRARY
        </div>
        <div
          onClick={onOpenPriceChart}
          className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity cursor-pointer interactive-zone"
        >
          <span className="w-2 h-2 border border-white"></span>
          [04] PRICE_CHART
        </div>
      </div>

      {/* Bottom Right: Market Status */}
      <div className="fixed bottom-32 right-8 z-50 text-right font-mono text-xs pointer-events-none">
        <div className="flex items-center justify-end gap-2">
          <span className={`w-2 h-2 rounded-full ${
            marketStatus === 'OPEN' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}></span>
          <span className="uppercase">MARKET: {marketStatus}</span>
        </div>
        <div className="flex items-center justify-end gap-2 mt-1">
          <span className={`w-2 h-2 rounded-full ${
            status === 'OPTIMAL' ? 'bg-green-500' :
            status === 'CRITICAL' ? 'bg-red-500' : 'bg-white'
          } animate-pulse`}></span>
          <span className="uppercase">STATUS: {status}</span>
        </div>
        <div className="opacity-50 mt-1">
          CASH: {formatCurrency(portfolio.cash)}
        </div>
      </div>
    </>
  );
});

HUD.displayName = 'HUD';
