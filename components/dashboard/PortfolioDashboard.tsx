import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { DashboardCard } from './DashboardCard';
import { Typography, DataText } from '../ui/Typography';
import { Protocol } from '../../types';

// Loading skeleton for cards
const CardSkeleton: React.FC<{ height?: string }> = ({ height = 'h-8' }) => (
  <div className={`bg-gray-200 ${height} w-full animate-pulse`} />
);

// Protocol color map
const PROTOCOL_DOT_COLORS: Record<string, string> = {
  AAVE: 'bg-aave',
  UNISWAP: 'bg-uniswap',
  COMPOUND: 'bg-success',
};

export const PortfolioDashboard: React.FC = () => {
  const { state: portfolio } = usePortfolio();

  // Loading and error states
  const isLoading = false; // Would come from context/hook in production
  const error = null; // Would come from context/hook in production

  // Mock data for things not in context (would be fetched from API)
  const gasSpent = 0.0456;
  const gasSpentUSD = 91.20;
  const avgGasPerTx = 3.80;
  const healthFactor = 2.45;
  const change24h = { value: 1234.56, percent: 2.8 };
  const change7d = { value: -456.78, percent: -1.0 };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  const formatPercent = (val: number) =>
    `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`;

  // Health factor color logic
  const getHealthFactorColor = (hf: number) => {
    if (hf >= 2) return 'text-success';
    if (hf >= 1.5) return 'text-orange';
    return 'text-error';
  };

  const getHealthFactorLabel = (hf: number) => {
    if (hf >= 2) return 'SAFE';
    if (hf >= 1.5) return 'CAUTION';
    return 'CRITICAL';
  };

  // Error state
  if (error) {
    return (
      <div className="p-6 md:p-12 flex items-center justify-center h-full">
        <div className="text-center">
          <Typography variant="h2" className="text-error mb-2">
            ERR_PORTFOLIO_LOAD
          </Typography>
          <Typography variant="body" className="text-gray-500">
            Failed to load portfolio data. Please refresh.
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12">
      <div className="grid grid-cols-12 gap-6">

        {/* 1. Total Value Card */}
        <DashboardCard title="PORTFOLIO VALUE" colSpan={6}>
          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton height="h-12" />
              <CardSkeleton height="h-4" />
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center">
              <DataText className="text-4xl block mb-2">
                {formatCurrency(portfolio.totalEquity)}
              </DataText>
              <div className="flex gap-4">
                <DataText success={change24h.value >= 0} error={change24h.value < 0} className="text-sm">
                  24h: {change24h.value >= 0 ? '+' : ''}{formatCurrency(change24h.value)} ({formatPercent(change24h.percent)})
                </DataText>
                <DataText success={change7d.value >= 0} error={change7d.value < 0} className="text-sm">
                  7d: {change7d.value >= 0 ? '+' : ''}{formatCurrency(change7d.value)} ({formatPercent(change7d.percent)})
                </DataText>
              </div>
            </div>
          )}
        </DashboardCard>

        {/* 2. Performance Chart Card (Placeholder for now) */}
        <DashboardCard title="PERFORMANCE (30D)" colSpan={6}>
          {isLoading ? (
            <CardSkeleton height="h-[150px]" />
          ) : (
            <div className="relative w-full h-[150px] border-l border-b border-border">
              {/* Mock Line Chart */}
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                <polyline
                  points="0,150 50,140 100,100 150,110 200,80 250,90 300,50 350,40 400,60 450,20 500,10"
                  fill="none"
                  stroke="#0A0A0A"
                  strokeWidth="2"
                />
              </svg>
              <div className="absolute bottom-[-24px] left-0 text-[10px] font-mono text-gray-400">Jan 1</div>
              <div className="absolute bottom-[-24px] right-0 text-[10px] font-mono text-gray-400">Jan 30</div>
            </div>
          )}
        </DashboardCard>

        {/* 3. Gas Tracker */}
        <DashboardCard title="GAS SPENT" colSpan={3}>
          {isLoading ? (
            <div className="space-y-4">
              <CardSkeleton height="h-6" />
              <CardSkeleton height="h-4" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Typography variant="small" className="uppercase opacity-60">THIS MONTH</Typography>
                <DataText className="block text-xl">{gasSpent.toFixed(4)} ETH</DataText>
                <DataText className="block text-sm text-gray-500">≈ ${gasSpentUSD.toFixed(2)}</DataText>
              </div>
              <div>
                <Typography variant="small" className="uppercase opacity-60">AVG/TX</Typography>
                <DataText className="block text-lg">${avgGasPerTx.toFixed(2)}</DataText>
              </div>
            </div>
          )}
        </DashboardCard>

        {/* 4. Health Factor */}
        <DashboardCard title="HEALTH FACTOR" colSpan={3}>
          {isLoading ? (
            <CardSkeleton height="h-[100px]" />
          ) : (
            <div className="h-full flex flex-col justify-between">
              <div>
                <DataText className={`text-4xl block ${getHealthFactorColor(healthFactor)}`}>
                  {healthFactor.toFixed(2)}
                </DataText>
                <Typography variant="small" className={`uppercase font-bold tracking-widest mt-1 ${getHealthFactorColor(healthFactor)}`}>
                  {getHealthFactorLabel(healthFactor)}
                </Typography>
              </div>
              <div className="bg-gray-100 p-2 border border-border">
                <Typography variant="small" className="text-[10px] font-mono">
                  [ LIQUIDATION AT 1.00 ]
                </Typography>
              </div>
            </div>
          )}
        </DashboardCard>

        {/* 5. Positions Table */}
        <DashboardCard title="ACTIVE POSITIONS" colSpan={12}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ink text-white text-xs uppercase font-sans">
                  <th className="p-3 font-medium">PROTOCOL</th>
                  <th className="p-3 font-medium">TYPE</th>
                  <th className="p-3 font-medium">ASSET</th>
                  <th className="p-3 font-medium text-right">AMOUNT</th>
                  <th className="p-3 font-medium text-right">VALUE</th>
                  <th className="p-3 font-medium text-right">PNL</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Skeleton loading rows
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="p-3"><CardSkeleton height="h-4" /></td>
                      <td className="p-3"><CardSkeleton height="h-4" /></td>
                      <td className="p-3"><CardSkeleton height="h-4" /></td>
                      <td className="p-3"><CardSkeleton height="h-4" /></td>
                      <td className="p-3"><CardSkeleton height="h-4" /></td>
                      <td className="p-3"><CardSkeleton height="h-4" /></td>
                    </tr>
                  ))
                ) : portfolio.positions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center border-b border-gray-100">
                      <Typography variant="small" className="text-gray-500 uppercase">
                        NO ACTIVE POSITIONS
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  portfolio.positions.map((pos, index) => (
                    <tr
                      key={pos.symbol}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer font-mono text-sm ${index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                        }`}
                    >
                      <td className="p-3 flex items-center gap-2">
                        <div className={`w-2 h-2 ${PROTOCOL_DOT_COLORS['AAVE'] || 'bg-gray-400'}`} />
                        AAVE
                      </td>
                      <td className="p-3">SUPPLY</td>
                      <td className="p-3 font-bold">{pos.symbol}</td>
                      <td className="p-3 text-right">{pos.quantity.toLocaleString()}</td>
                      <td className="p-3 text-right">{formatCurrency(pos.currentPrice * pos.quantity)}</td>
                      <td className={`p-3 text-right ${pos.unrealizedPL >= 0 ? 'text-success' : 'text-error'}`}>
                        {pos.unrealizedPL >= 0 ? '+' : ''}{pos.unrealizedPLPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DashboardCard>

      </div>
    </div>
  );
};
