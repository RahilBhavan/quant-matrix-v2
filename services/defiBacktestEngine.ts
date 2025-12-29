/**
 * DeFi Backtest Engine Service
 *
 * Simulates DeFi strategies using historical subgraph data.
 * Models slippage, gas costs, protocol fees, and impermanent loss.
 */

import { LegoBlock } from '../types';
import { uniswapService } from './subgraph/uniswapService';
import { aaveService } from './subgraph/aaveService';
import { historicalDataService } from './historicalDataService';

// DeFi-specific types
export interface DeFiBacktestConfig {
  blocks: LegoBlock[];
  startDate: Date;
  endDate: Date;
  initialCapital: number; // USDC
  rebalanceInterval: number; // hours
}

export interface TokenBalance {
  token: string;
  amount: number;
}

export interface LPPosition {
  poolAddress: string;
  token0: string;
  token1: string;
  liquidity: number;
  token0Amount: number;
  token1Amount: number;
  feeTier: number;
  entryPrice: number;
  feesEarned: { token0: number; token1: number };
}

export interface LendingPosition {
  protocol: 'Aave' | 'Compound';
  type: 'SUPPLY' | 'BORROW';
  asset: string;
  amount: number;
  entryAPY: number;
  accruedInterest: number;
}

export interface DeFiPortfolio {
  tokens: Map<string, number>; // token -> balance
  lpPositions: LPPosition[];
  lendingPositions: LendingPosition[];
  totalValueUSD: number;
}

export interface DeFiTrade {
  id: string;
  date: Date;
  type: 'SWAP' | 'SUPPLY' | 'BORROW' | 'REPAY' | 'LP_CREATE' | 'LP_CLOSE';
  protocol: string;
  details: any;
  gasCost: number; // ETH
  protocolFee: number; // USD
  slippage: number; // %
}

export interface DeFiBacktestResult {
  trades: DeFiTrade[];
  equityCurve: { date: Date; equity: number }[];
  metrics: {
    totalReturn: number;
    totalReturnPercent: number;
    sharpeRatio: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    totalGasSpent: number; // ETH
    totalFeesSpent: number; // USD
    totalTrades: number;
    impermanentLoss?: number; // For LP strategies
  };
  finalPortfolio: DeFiPortfolio;
}

// Constants for cost modeling
const GAS_COSTS = {
  SWAP: 150000, // gas units
  SUPPLY: 200000,
  BORROW: 300000,
  REPAY: 200000,
  LP_CREATE: 500000,
  LP_COLLECT: 100000,
  LP_CLOSE: 400000,
};

const PROTOCOL_FEES = {
  UNISWAP_0_3: 0.003, // 0.3%
  UNISWAP_0_05: 0.0005, // 0.05%
  UNISWAP_1_0: 0.01, // 1%
  AAVE_SUPPLY: 0, // No fee
  AAVE_BORROW: 0, // Included in APY
};

/**
 * Run DeFi strategy backtest using historical subgraph data
 */
export async function runDeFiBacktest(
  config: DeFiBacktestConfig
): Promise<DeFiBacktestResult> {
  const { blocks, startDate, endDate, initialCapital, rebalanceInterval } = config;

  // Initialize portfolio
  const portfolio: DeFiPortfolio = {
    tokens: new Map([['USDC', initialCapital]]),
    lpPositions: [],
    lendingPositions: [],
    totalValueUSD: initialCapital,
  };

  const trades: DeFiTrade[] = [];
  const equityCurve: { date: Date; equity: number }[] = [];
  let tradeIdCounter = 1;

  // Track costs
  let totalGasSpent = 0;
  let totalFeesSpent = 0;

  // Generate timestamps for rebalancing
  const timestamps: Date[] = [];
  let currentTime = new Date(startDate);
  while (currentTime <= endDate) {
    timestamps.push(new Date(currentTime));
    currentTime = new Date(currentTime.getTime() + rebalanceInterval * 60 * 60 * 1000);
  }

  console.log(`Running backtest over ${timestamps.length} periods`);

  // Pre-fetch historical data for the entire backtest period
  const tokensInStrategy = extractTokensFromBlocks(blocks);
  try {
    await historicalDataService.prefetchData(startDate, endDate, tokensInStrategy);
    console.log('[DeFiBacktest] Historical data prefetched successfully');
  } catch (error) {
    console.warn('[DeFiBacktest] Failed to prefetch historical data, using fallbacks:', error);
  }

  // Execute strategy at each timestamp
  for (const timestamp of timestamps) {
    // Get historical prices at this timestamp using real subgraph data
    const prices = historicalDataService.getPricesAtTimestamp(timestamp);

    // Execute strategy blocks
    for (const block of blocks) {
      try {
        const result = await executeBlock(block, portfolio, prices, timestamp);

        if (result.trade) {
          trades.push({
            id: `T${tradeIdCounter++}`,
            date: timestamp,
            ...result.trade,
          });

          totalGasSpent += result.gasCost;
          totalFeesSpent += result.protocolFee;
        }
      } catch (error) {
        console.error(`Error executing block ${block.type}:`, error);
      }
    }

    // Update lending positions (accrue interest)
    updateLendingPositions(portfolio, prices, timestamp);

    // Calculate portfolio value
    const portfolioValue = calculatePortfolioValue(portfolio, prices);

    equityCurve.push({
      date: timestamp,
      equity: portfolioValue,
    });
  }

  // Calculate metrics
  const metrics = calculateDeFiMetrics(
    equityCurve,
    initialCapital,
    totalGasSpent,
    totalFeesSpent,
    trades.length,
    portfolio.lpPositions
  );

  return {
    trades,
    equityCurve,
    metrics,
    finalPortfolio: portfolio,
  };
}

/**
 * Execute a single DeFi block
 */
async function executeBlock(
  block: LegoBlock,
  portfolio: DeFiPortfolio,
  prices: Map<string, number>,
  timestamp: Date
): Promise<{
  trade?: Omit<DeFiTrade, 'id' | 'date'>;
  gasCost: number;
  protocolFee: number;
}> {
  let gasCost = 0;
  let protocolFee = 0;
  let trade: Omit<DeFiTrade, 'id' | 'date'> | undefined;

  switch (block.type) {
    case 'UNISWAP_SWAP': {
      const { tokenIn, tokenOut, amount, slippage } = block.params || {};
      if (!tokenIn || !tokenOut || !amount) break;

      const tokenInBalance = portfolio.tokens.get(tokenIn) || 0;
      if (tokenInBalance < amount) break; // Insufficient balance

      // Calculate swap
      const priceImpact = calculateSlippage(amount, 1000000); // Assume $1M liquidity
      const effectiveSlippage = Math.max(priceImpact, slippage || 0.5);

      const tokenOutPrice = prices.get(tokenOut) || 1;
      const tokenInPrice = prices.get(tokenIn) || 1;

      const expectedOut = (amount * tokenInPrice) / tokenOutPrice;
      const actualOut = expectedOut * (1 - effectiveSlippage / 100);

      // Update balances
      portfolio.tokens.set(tokenIn, tokenInBalance - amount);
      portfolio.tokens.set(tokenOut, (portfolio.tokens.get(tokenOut) || 0) + actualOut);

      // Calculate costs
      gasCost = (GAS_COSTS.SWAP * 20) / 1e9; // 20 gwei gas price
      protocolFee = amount * tokenInPrice * PROTOCOL_FEES.UNISWAP_0_3;

      trade = {
        type: 'SWAP',
        protocol: 'Uniswap',
        details: { tokenIn, tokenOut, amountIn: amount, amountOut: actualOut },
        gasCost,
        protocolFee,
        slippage: effectiveSlippage,
      };
      break;
    }

    case 'AAVE_SUPPLY': {
      const { asset, supplyAmount } = block.params || {};
      if (!asset || !supplyAmount) break;

      const assetBalance = portfolio.tokens.get(asset) || 0;
      if (assetBalance < supplyAmount) break;

      // Supply to Aave
      portfolio.tokens.set(asset, assetBalance - supplyAmount);

      // Create lending position
      const currentAPY = await getAaveAPY(asset, timestamp);
      portfolio.lendingPositions.push({
        protocol: 'Aave',
        type: 'SUPPLY',
        asset,
        amount: supplyAmount,
        entryAPY: currentAPY,
        accruedInterest: 0,
      });

      gasCost = (GAS_COSTS.SUPPLY * 20) / 1e9;

      trade = {
        type: 'SUPPLY',
        protocol: 'Aave',
        details: { asset, amount: supplyAmount, apy: currentAPY },
        gasCost,
        protocolFee: 0,
        slippage: 0,
      };
      break;
    }

    case 'AAVE_BORROW': {
      const { asset, borrowAmount } = block.params || {};
      if (!asset || !borrowAmount) break;

      // Check collateral (simplified - assume USDC collateral)
      const collateralValue = portfolio.tokens.get('USDC') || 0;
      const maxBorrow = collateralValue * 0.8; // 80% LTV

      const assetPrice = prices.get(asset) || 1;
      const borrowValueUSD = borrowAmount * assetPrice;

      if (borrowValueUSD > maxBorrow) break; // Insufficient collateral

      // Borrow from Aave
      portfolio.tokens.set(asset, (portfolio.tokens.get(asset) || 0) + borrowAmount);

      const currentAPY = await getAaveAPY(asset, timestamp);
      portfolio.lendingPositions.push({
        protocol: 'Aave',
        type: 'BORROW',
        asset,
        amount: borrowAmount,
        entryAPY: currentAPY,
        accruedInterest: 0,
      });

      gasCost = (GAS_COSTS.BORROW * 20) / 1e9;

      trade = {
        type: 'BORROW',
        protocol: 'Aave',
        details: { asset, amount: borrowAmount, apy: currentAPY },
        gasCost,
        protocolFee: 0,
        slippage: 0,
      };
      break;
    }

    case 'CREATE_LP_POSITION': {
      const { token0, token1, amount, feeTier } = block.params || {};
      if (!token0 || !token1 || !amount || !feeTier) break;

      // Simplified LP creation
      const token0Price = prices.get(token0) || 1;
      const token1Price = prices.get(token1) || 1;

      const token0Amount = amount / 2 / token0Price;
      const token1Amount = amount / 2 / token1Price;

      const token0Balance = portfolio.tokens.get(token0) || 0;
      const token1Balance = portfolio.tokens.get(token1) || 0;

      if (token0Balance < token0Amount || token1Balance < token1Amount) break;

      // Create LP position
      portfolio.tokens.set(token0, token0Balance - token0Amount);
      portfolio.tokens.set(token1, token1Balance - token1Amount);

      portfolio.lpPositions.push({
        poolAddress: `${token0}-${token1}-${feeTier}`,
        token0,
        token1,
        liquidity: amount,
        token0Amount,
        token1Amount,
        feeTier,
        entryPrice: token0Price / token1Price,
        feesEarned: { token0: 0, token1: 0 },
      });

      gasCost = (GAS_COSTS.LP_CREATE * 20) / 1e9;

      trade = {
        type: 'LP_CREATE',
        protocol: 'Uniswap',
        details: { token0, token1, amount, feeTier },
        gasCost,
        protocolFee: 0,
        slippage: 0,
      };
      break;
    }
  }

  return { trade, gasCost, protocolFee };
}

/**
 * Calculate slippage based on trade size and pool liquidity
 */
function calculateSlippage(tradeSize: number, poolLiquidity: number): number {
  // Simple slippage model: linear with trade size
  const tradeSizePercent = (tradeSize / poolLiquidity) * 100;
  return tradeSizePercent * 0.1; // 0.1% slippage per 1% of pool
}

/**
 * Update lending positions with accrued interest
 */
function updateLendingPositions(
  portfolio: DeFiPortfolio,
  prices: Map<string, number>,
  timestamp: Date
): void {
  for (const position of portfolio.lendingPositions) {
    // Simple interest calculation (in reality, compound continuously)
    const dailyRate = position.entryAPY / 365 / 100;
    position.accruedInterest += position.amount * dailyRate;

    // Add interest to amount
    if (position.type === 'SUPPLY') {
      position.amount += position.amount * dailyRate;
    } else {
      // BORROW: interest increases debt
      position.amount += position.amount * dailyRate;
    }
  }
}

/**
 * Calculate total portfolio value in USD
 */
function calculatePortfolioValue(
  portfolio: DeFiPortfolio,
  prices: Map<string, number>
): number {
  let total = 0;

  // Token balances
  for (const [token, balance] of portfolio.tokens.entries()) {
    const price = prices.get(token) || 1;
    total += balance * price;
  }

  // LP positions
  for (const lp of portfolio.lpPositions) {
    const token0Price = prices.get(lp.token0) || 1;
    const token1Price = prices.get(lp.token1) || 1;
    total += lp.token0Amount * token0Price + lp.token1Amount * token1Price;
    total += lp.feesEarned.token0 * token0Price + lp.feesEarned.token1 * token1Price;
  }

  // Lending positions
  for (const lending of portfolio.lendingPositions) {
    const price = prices.get(lending.asset) || 1;
    if (lending.type === 'SUPPLY') {
      total += lending.amount * price;
    } else {
      // BORROW: negative value (debt)
      total -= lending.amount * price;
    }
  }

  return total;
}

/**
 * Get Aave APY at specific timestamp using historical subgraph data
 */
async function getAaveAPY(asset: string, timestamp: Date): Promise<number> {
  try {
    const apyData = historicalDataService.getAPYAtTimestamp(asset, timestamp);
    return apyData.supplyAPY;
  } catch (error) {
    console.warn(`Failed to get APY for ${asset}, using fallback:`, error);
    return 5.2; // Fallback APY
  }
}

/**
 * Extract all tokens used in strategy blocks
 */
function extractTokensFromBlocks(blocks: LegoBlock[]): string[] {
  const tokens = new Set<string>();

  for (const block of blocks) {
    const params = block.params || {};

    if (params.tokenIn) tokens.add(params.tokenIn);
    if (params.tokenOut) tokens.add(params.tokenOut);
    if (params.asset) tokens.add(params.asset);
    if (params.token0) tokens.add(params.token0);
    if (params.token1) tokens.add(params.token1);
  }

  // Always include common tokens
  tokens.add('USDC');
  tokens.add('WETH');

  return Array.from(tokens);
}

/**
 * Calculate DeFi-specific performance metrics
 */
function calculateDeFiMetrics(
  equityCurve: { date: Date; equity: number }[],
  initialCapital: number,
  totalGasSpent: number,
  totalFeesSpent: number,
  totalTrades: number,
  lpPositions: LPPosition[]
): DeFiBacktestResult['metrics'] {
  const finalEquity = equityCurve[equityCurve.length - 1]?.equity || initialCapital;

  // Total return
  const totalReturn = finalEquity - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;

  // Max drawdown
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let peak = initialCapital;

  for (const point of equityCurve) {
    if (point.equity > peak) {
      peak = point.equity;
    }
    const drawdown = peak - point.equity;
    const drawdownPercent = (drawdown / peak) * 100;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  }

  // Sharpe ratio (simplified)
  const returns = equityCurve.slice(1).map((point, i) => {
    const prevEquity = equityCurve[i].equity;
    return ((point.equity - prevEquity) / prevEquity) * 100;
  });

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(365) : 0;

  // Calculate IL for LP positions (simplified)
  let impermanentLoss = 0;
  if (lpPositions.length > 0) {
    // Simplified IL calculation
    impermanentLoss = lpPositions.reduce((sum, lp) => {
      const currentPrice = 2000; // Mock current price
      const priceRatio = currentPrice / lp.entryPrice;
      const il = 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
      return sum + Math.abs(il) * lp.liquidity;
    }, 0);
  }

  return {
    totalReturn,
    totalReturnPercent,
    sharpeRatio,
    maxDrawdown,
    maxDrawdownPercent,
    totalGasSpent,
    totalFeesSpent,
    totalTrades,
    impermanentLoss,
  };
}
