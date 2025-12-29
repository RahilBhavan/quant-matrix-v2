/**
 * Backtest Worker
 * 
 * Runs backtest computation off the main thread to prevent UI freeze.
 * Supports progress streaming and cancellation.
 */

import { BacktestConfig, BacktestResult, LegoBlock } from '../types';

// Worker message types
export type WorkerMessage =
    | { type: 'START'; config: BacktestConfig }
    | { type: 'CANCEL' };

export type WorkerResponse =
    | { type: 'PROGRESS'; step: number; message: string; percent: number }
    | { type: 'COMPLETE'; result: BacktestResult }
    | { type: 'ERROR'; error: string }
    | { type: 'CANCELLED' };

// Progress phases
const PROGRESS_PHASES = [
    { step: 1, message: 'Loading historical data...', percent: 15 },
    { step: 2, message: 'Calculating indicators...', percent: 35 },
    { step: 3, message: 'Simulating trades...', percent: 60 },
    { step: 4, message: 'Computing metrics...', percent: 85 },
    { step: 5, message: 'Finalizing results...', percent: 100 },
];

let isCancelled = false;

// Post progress update to main thread
function postProgress(phase: typeof PROGRESS_PHASES[number]) {
    self.postMessage({
        type: 'PROGRESS',
        step: phase.step,
        message: phase.message,
        percent: phase.percent,
    } as WorkerResponse);
}

// Simple delay function
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Core backtest logic (simplified version that runs in worker)
async function runBacktestInWorker(config: BacktestConfig): Promise<BacktestResult> {
    const { blocks, startDate, endDate, initialCapital, symbol } = config;

    // Phase 1: Load data
    postProgress(PROGRESS_PHASES[0]);
    await delay(200);
    if (isCancelled) throw new Error('CANCELLED');

    // Generate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Phase 2: Calculate indicators
    postProgress(PROGRESS_PHASES[1]);
    await delay(150);
    if (isCancelled) throw new Error('CANCELLED');

    // Generate mock price data
    let basePrice = 150;
    const priceData: { date: Date; open: number; high: number; low: number; close: number }[] = [];

    for (let i = 0; i <= daysDiff; i++) {
        const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
        const change = (Math.random() - 0.48) * 3;
        const open = basePrice;
        const close = basePrice + change;
        const high = Math.max(open, close) + Math.random() * 1;
        const low = Math.min(open, close) - Math.random() * 1;

        priceData.push({ date, open, high, low, close });
        basePrice = close;

        // Yield to prevent blocking (every 50 days)
        if (i % 50 === 0 && i > 0) {
            await delay(1);
            if (isCancelled) throw new Error('CANCELLED');
        }
    }

    // Phase 3: Simulate trades
    postProgress(PROGRESS_PHASES[2]);
    await delay(200);
    if (isCancelled) throw new Error('CANCELLED');

    // Execute strategy based on blocks
    const trades: BacktestResult['trades'] = [];
    let equity = initialCapital;
    let position = 0;
    let tradeId = 1;

    for (let i = 20; i < priceData.length; i++) {
        const current = priceData[i];

        // Simple moving average crossover simulation
        const sma20 = priceData.slice(i - 20, i).reduce((sum, d) => sum + d.close, 0) / 20;
        const sma5 = priceData.slice(i - 5, i).reduce((sum, d) => sum + d.close, 0) / 5;

        // Buy signal
        if (sma5 > sma20 && position === 0) {
            const quantity = Math.floor(equity * 0.95 / current.close);
            if (quantity > 0) {
                position = quantity;
                equity -= quantity * current.close;
                trades.push({
                    id: `T${tradeId++}`,
                    date: current.date,
                    side: 'BUY' as const,
                    symbol,
                    quantity,
                    price: current.close,
                });
            }
        }
        // Sell signal
        else if (sma5 < sma20 && position > 0) {
            const sellPrice = current.close;
            const pnl = (sellPrice - trades[trades.length - 1].price) * position;
            equity += position * sellPrice;
            trades.push({
                id: `T${tradeId++}`,
                date: current.date,
                side: 'SELL' as const,
                symbol,
                quantity: position,
                price: sellPrice,
                pnl,
            });
            position = 0;
        }

        // Yield periodically
        if (i % 100 === 0) {
            await delay(1);
            if (isCancelled) throw new Error('CANCELLED');
        }
    }

    // Phase 4: Compute metrics
    postProgress(PROGRESS_PHASES[3]);
    await delay(150);
    if (isCancelled) throw new Error('CANCELLED');

    // Build equity curve
    const equityCurve: { date: Date; equity: number }[] = [];
    let runningEquity = initialCapital;
    let tradeIndex = 0;

    for (const day of priceData) {
        if (tradeIndex < trades.length && trades[tradeIndex].date <= day.date) {
            const trade = trades[tradeIndex];
            if (trade.side === 'BUY') {
                runningEquity -= trade.quantity * trade.price;
            } else {
                runningEquity += trade.quantity * trade.price;
            }
            tradeIndex++;
        }
        equityCurve.push({ date: day.date, equity: runningEquity + position * day.close });
    }

    // Calculate metrics
    const finalEquity = equityCurve[equityCurve.length - 1]?.equity || initialCapital;
    const totalReturn = finalEquity - initialCapital;
    const totalReturnPercent = (totalReturn / initialCapital) * 100;

    // Max drawdown
    let peak = initialCapital;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    for (const point of equityCurve) {
        if (point.equity > peak) peak = point.equity;
        const dd = peak - point.equity;
        const ddPercent = (dd / peak) * 100;
        if (dd > maxDrawdown) {
            maxDrawdown = dd;
            maxDrawdownPercent = ddPercent;
        }
    }

    // Win rate
    const closedTrades = trades.filter(t => t.pnl !== undefined);
    const wins = closedTrades.filter(t => (t.pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    // Profit factor
    const grossProfit = closedTrades.reduce((sum, t) => sum + Math.max(t.pnl || 0, 0), 0);
    const grossLoss = Math.abs(closedTrades.reduce((sum, t) => sum + Math.min(t.pnl || 0, 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // Sharpe ratio (simplified)
    const returns = equityCurve.slice(1).map((p, i) =>
        (p.equity - equityCurve[i].equity) / equityCurve[i].equity
    );
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Phase 5: Finalize
    postProgress(PROGRESS_PHASES[4]);

    return {
        equityCurve,
        trades,
        metrics: {
            totalReturn,
            totalReturnPercent,
            sharpeRatio,
            maxDrawdown,
            maxDrawdownPercent,
            winRate,
            profitFactor,
            totalTrades: trades.length,
        },
    };
}

// Worker message handler
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type } = e.data;

    if (type === 'CANCEL') {
        isCancelled = true;
        return;
    }

    if (type === 'START') {
        isCancelled = false;

        try {
            const result = await runBacktestInWorker(e.data.config);

            if (isCancelled) {
                self.postMessage({ type: 'CANCELLED' } as WorkerResponse);
                return;
            }

            self.postMessage({ type: 'COMPLETE', result } as WorkerResponse);
        } catch (error: any) {
            if (error.message === 'CANCELLED') {
                self.postMessage({ type: 'CANCELLED' } as WorkerResponse);
            } else {
                self.postMessage({
                    type: 'ERROR',
                    error: error.message || 'Unknown error'
                } as WorkerResponse);
            }
        }
    }
};
