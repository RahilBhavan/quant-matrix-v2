/**
 * Backtest Engine Service
 *
 * Simulates trading strategies on historical data.
 * Calculates performance metrics and generates equity curves.
 */

import {
  BacktestConfig,
  BacktestResult,
  Trade,
  PerformanceMetrics,
  EquityPoint,
  HistoricalBar,
  ExecutionContext,
  Position,
  Order,
} from '../types';
import { getHistoricalData } from './marketDataService';
import { executeStrategy } from './executionEngine';
import { simulateOrderFill } from './orderSimulator';

/**
 * Run backtest simulation
 * @param config - Backtest configuration
 * @returns Backtest results with trades, metrics, and equity curve
 */
export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  const { symbol, startDate, endDate, initialCapital, blocks } = config;

  // 1. Fetch historical data
  const historicalBars = await getHistoricalData(symbol, startDate, endDate);

  if (historicalBars.length === 0) {
    throw new Error('No historical data available for backtest');
  }

  // 2. Initialize portfolio state
  let cash = initialCapital;
  let positions: Position[] = [];
  let orders: Order[] = [];
  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];
  const dailyReturns: number[] = [];

  let peakEquity = initialCapital;
  let tradeIdCounter = 1;

  // Track prices for indicators
  const priceHistory: number[] = [];

  // 3. Simulate each bar
  for (let i = 0; i < historicalBars.length; i++) {
    const currentBar = historicalBars[i];
    const previousBar = i > 0 ? historicalBars[i - 1] : undefined;

    // Update price history for indicators
    priceHistory.push(currentBar.close);

    // Update position prices
    positions = positions.map(pos => {
      const unrealizedPL = (currentBar.close - pos.avgPrice) * pos.quantity;
      const unrealizedPLPercent = ((currentBar.close - pos.avgPrice) / pos.avgPrice) * 100;
      return {
        ...pos,
        currentPrice: currentBar.close,
        unrealizedPL,
        unrealizedPLPercent,
      };
    });

    // Calculate current equity
    const positionValue = positions.reduce(
      (sum, pos) => sum + pos.currentPrice * pos.quantity,
      0
    );
    const totalEquity = cash + positionValue;

    // Update peak equity
    if (totalEquity > peakEquity) {
      peakEquity = totalEquity;
    }

    // Process pending orders
    orders = orders.filter(order => {
      if (order.status !== 'PENDING') return true;

      const fillResult = simulateOrderFill(order, currentBar, previousBar);

      if (fillResult.filled && fillResult.fillPrice) {
        // Execute order
        if (order.side === 'BUY') {
          const cost = order.quantity * fillResult.fillPrice;
          if (cost <= cash) {
            cash -= cost;

            // Update or create position
            const existingPos = positions.find(p => p.symbol === order.symbol);
            if (existingPos) {
              const totalQuantity = existingPos.quantity + order.quantity;
              const totalCost = existingPos.avgPrice * existingPos.quantity + cost;
              existingPos.quantity = totalQuantity;
              existingPos.avgPrice = totalCost / totalQuantity;
            } else {
              positions.push({
                symbol: order.symbol,
                quantity: order.quantity,
                avgPrice: fillResult.fillPrice,
                currentPrice: fillResult.fillPrice,
                unrealizedPL: 0,
                unrealizedPLPercent: 0,
              });
            }

            // Record trade
            trades.push({
              id: `T${tradeIdCounter++}`,
              symbol: order.symbol,
              side: 'BUY',
              quantity: order.quantity,
              price: fillResult.fillPrice,
              date: new Date(currentBar.date),
              blockType: order.type,
            });

            order.status = 'FILLED';
          } else {
            order.status = 'CANCELLED';
          }
        } else {
          // SELL
          const position = positions.find(p => p.symbol === order.symbol);
          if (position && position.quantity >= order.quantity) {
            const proceeds = order.quantity * fillResult.fillPrice;
            cash += proceeds;

            // Calculate P&L
            const pnl = (fillResult.fillPrice - position.avgPrice) * order.quantity;

            // Record trade
            trades.push({
              id: `T${tradeIdCounter++}`,
              symbol: order.symbol,
              side: 'SELL',
              quantity: order.quantity,
              price: fillResult.fillPrice,
              date: new Date(currentBar.date),
              blockType: order.type,
              pnl,
            });

            // Update position
            position.quantity -= order.quantity;
            if (position.quantity === 0) {
              positions = positions.filter(p => p.symbol !== order.symbol);
            }

            order.status = 'FILLED';
          } else {
            order.status = 'CANCELLED';
          }
        }

        return false; // Remove filled/cancelled orders
      }

      return true; // Keep pending orders
    });

    // Build execution context
    const context: ExecutionContext = {
      currentBar,
      previousBar,
      portfolio: {
        cash,
        positions: [...positions],
        totalEquity,
      },
      indicators: new Map([['prices', [...priceHistory]]]),
      mode: 'backtest',
      peakEquity,
    };

    // Execute strategy blocks
    const actions = executeStrategy(blocks, context);

    // Process execution actions
    for (const action of actions) {
      if (action.type === 'BUY') {
        if (!action.symbol || !action.quantity || !action.price) continue;

        const cost = action.quantity * action.price;
        if (cost <= cash) {
          cash -= cost;

          // Update or create position
          const existingPos = positions.find(p => p.symbol === action.symbol);
          if (existingPos) {
            const totalQuantity = existingPos.quantity + action.quantity;
            const totalCost = existingPos.avgPrice * existingPos.quantity + cost;
            existingPos.quantity = totalQuantity;
            existingPos.avgPrice = totalCost / totalQuantity;
          } else {
            positions.push({
              symbol: action.symbol,
              quantity: action.quantity,
              avgPrice: action.price,
              currentPrice: action.price,
              unrealizedPL: 0,
              unrealizedPLPercent: 0,
            });
          }

          // Record trade
          trades.push({
            id: `T${tradeIdCounter++}`,
            symbol: action.symbol,
            side: 'BUY',
            quantity: action.quantity,
            price: action.price,
            date: new Date(currentBar.date),
            blockType: action.orderType || 'MARKET',
          });
        }
      } else if (action.type === 'SELL') {
        if (!action.symbol || !action.quantity || !action.price) continue;

        const position = positions.find(p => p.symbol === action.symbol);
        if (position && position.quantity >= action.quantity) {
          const proceeds = action.quantity * action.price;
          cash += proceeds;

          // Calculate P&L
          const pnl = (action.price - position.avgPrice) * action.quantity;

          // Record trade
          trades.push({
            id: `T${tradeIdCounter++}`,
            symbol: action.symbol,
            side: 'SELL',
            quantity: action.quantity,
            price: action.price,
            date: new Date(currentBar.date),
            blockType: action.orderType || 'MARKET',
            pnl,
          });

          // Update position
          position.quantity -= action.quantity;
          if (position.quantity === 0) {
            positions = positions.filter(p => p.symbol !== action.symbol);
          }
        }
      } else if (action.type === 'PLACE_ORDER') {
        if (!action.symbol || !action.quantity || !action.orderType) continue;

        // Create pending order
        orders.push({
          id: `O${orders.length + 1}`,
          symbol: action.symbol,
          type: action.orderType,
          side: 'BUY', // For now, assume buy orders
          quantity: action.quantity,
          price: action.price,
          status: 'PENDING',
          createdAt: new Date(currentBar.date),
        });
      }
    }

    // Record equity point
    const finalPositionValue = positions.reduce(
      (sum, pos) => sum + pos.currentPrice * pos.quantity,
      0
    );
    const finalEquity = cash + finalPositionValue;

    equityCurve.push({
      date: currentBar.date,
      equity: finalEquity,
    });

    // Calculate daily return
    if (i > 0) {
      const prevEquity = equityCurve[i - 1].equity;
      const dailyReturn = ((finalEquity - prevEquity) / prevEquity) * 100;
      dailyReturns.push(dailyReturn);
    }
  }

  // 4. Calculate performance metrics
  const metrics = calculatePerformanceMetrics(
    trades,
    equityCurve,
    dailyReturns,
    initialCapital
  );

  return {
    trades,
    metrics,
    equityCurve,
    dailyReturns,
  };
}

/**
 * Calculate performance metrics from backtest results
 */
function calculatePerformanceMetrics(
  trades: Trade[],
  equityCurve: EquityPoint[],
  dailyReturns: number[],
  initialCapital: number
): PerformanceMetrics {
  const finalEquity = equityCurve[equityCurve.length - 1]?.equity || initialCapital;

  // Total return
  const totalReturn = finalEquity - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;

  // Max drawdown
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  let peak = initialCapital;

  equityCurve.forEach(point => {
    if (point.equity > peak) {
      peak = point.equity;
    }
    const drawdown = peak - point.equity;
    const drawdownPercent = (drawdown / peak) * 100;

    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPercent = drawdownPercent;
    }
  });

  // Sharpe ratio (annualized)
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
    dailyReturns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // 252 trading days

  // Win rate and profit factor
  const sellTrades = trades.filter(t => t.side === 'SELL' && t.pnl !== undefined);
  const winningTrades = sellTrades.filter(t => t.pnl! > 0);
  const losingTrades = sellTrades.filter(t => t.pnl! < 0);

  const winRate =
    sellTrades.length > 0 ? (winningTrades.length / sellTrades.length) * 100 : 0;

  const totalGains = winningTrades.reduce((sum, t) => sum + t.pnl!, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl!, 0));
  const profitFactor = totalLosses > 0 ? totalGains / totalLosses : 0;

  return {
    totalReturn,
    totalReturnPercent,
    sharpeRatio,
    maxDrawdown,
    maxDrawdownPercent,
    winRate,
    totalTrades: trades.length,
    profitFactor,
  };
}
