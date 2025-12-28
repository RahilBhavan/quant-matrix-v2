/**
 * Technical Indicators Service
 *
 * Provides calculations for RSI, MACD, SMA, and EMA using standard industry formulas.
 * Results are memoized for performance optimization.
 */

// Simple in-memory cache for indicator results
const indicatorCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL = 300000; // 5 minutes

function getCacheKey(indicator: string, ...params: any[]): string {
  return `${indicator}_${params.join('_')}`;
}

function getCached<T>(key: string): T | null {
  const cached = indicatorCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result as T;
  }
  return null;
}

function setCache<T>(key: string, result: T): void {
  indicatorCache.set(key, { result, timestamp: Date.now() });
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param prices - Array of closing prices
 * @param period - Number of periods for the average
 * @returns Array of SMA values (null for insufficient data points)
 */
export function calculateSMA(prices: number[], period: number): (number | null)[] {
  const cacheKey = getCacheKey('SMA', prices.join(','), period);
  const cached = getCached<(number | null)[]>(cacheKey);
  if (cached) return cached;

  const result: (number | null)[] = [];

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }

  setCache(cacheKey, result);
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param prices - Array of closing prices
 * @param period - Number of periods for the average
 * @returns Array of EMA values (null for insufficient data points)
 */
export function calculateEMA(prices: number[], period: number): (number | null)[] {
  const cacheKey = getCacheKey('EMA', prices.join(','), period);
  const cached = getCached<(number | null)[]>(cacheKey);
  if (cached) return cached;

  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA value is SMA
  let ema: number | null = null;

  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // Initialize with SMA
      const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
      ema = sum / period;
      result.push(ema);
    } else {
      // EMA = (Close - EMA(previous)) * multiplier + EMA(previous)
      ema = (prices[i] - ema!) * multiplier + ema!;
      result.push(ema);
    }
  }

  setCache(cacheKey, result);
  return result;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param prices - Array of closing prices
 * @param period - Number of periods (typically 14)
 * @returns Array of RSI values (0-100, null for insufficient data)
 */
export function calculateRSI(prices: number[], period: number = 14): (number | null)[] {
  const cacheKey = getCacheKey('RSI', prices.join(','), period);
  const cached = getCached<(number | null)[]>(cacheKey);
  if (cached) return cached;

  const result: (number | null)[] = [];

  if (prices.length < period + 1) {
    return prices.map(() => null);
  }

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Separate gains and losses
  const gains = changes.map(change => Math.max(change, 0));
  const losses = changes.map(change => Math.max(-change, 0));

  // Calculate initial average gain and loss (SMA for first period)
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // First RSI value (after period + 1 prices)
  for (let i = 0; i < period; i++) {
    result.push(null);
  }

  const rs = avgGain / (avgLoss || 0.00001); // Avoid division by zero
  const rsi = 100 - (100 / (1 + rs));
  result.push(rsi);

  // Calculate subsequent RSI values using smoothed averages
  for (let i = period; i < changes.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

    const rs = avgGain / (avgLoss || 0.00001);
    const rsi = 100 - (100 / (1 + rs));
    result.push(rsi);
  }

  setCache(cacheKey, result);
  return result;
}

/**
 * MACD Result Interface
 */
export interface MACDResult {
  macd: (number | null)[];
  signal: (number | null)[];
  histogram: (number | null)[];
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param prices - Array of closing prices
 * @param fastPeriod - Fast EMA period (typically 12)
 * @param slowPeriod - Slow EMA period (typically 26)
 * @param signalPeriod - Signal line EMA period (typically 9)
 * @returns Object with MACD line, signal line, and histogram
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult {
  const cacheKey = getCacheKey('MACD', prices.join(','), fastPeriod, slowPeriod, signalPeriod);
  const cached = getCached<MACDResult>(cacheKey);
  if (cached) return cached;

  // Calculate fast and slow EMAs
  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);

  // MACD line = Fast EMA - Slow EMA
  const macdLine: (number | null)[] = fastEMA.map((fast, i) => {
    const slow = slowEMA[i];
    if (fast === null || slow === null) return null;
    return fast - slow;
  });

  // Signal line = EMA of MACD line
  const macdValues = macdLine.filter(v => v !== null) as number[];
  const signalEMA = calculateEMA(macdValues, signalPeriod);

  // Align signal line with MACD line indices
  const signalLine: (number | null)[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
    } else {
      signalLine.push(signalEMA[signalIndex] ?? null);
      signalIndex++;
    }
  }

  // Histogram = MACD line - Signal line
  const histogram: (number | null)[] = macdLine.map((macd, i) => {
    const signal = signalLine[i];
    if (macd === null || signal === null) return null;
    return macd - signal;
  });

  const result: MACDResult = {
    macd: macdLine,
    signal: signalLine,
    histogram,
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Detect MACD crossover signals
 * @param macdResult - MACD calculation result
 * @returns Array of signals: 1 (bullish cross), -1 (bearish cross), 0 (no cross)
 */
export function detectMACDCrossover(macdResult: MACDResult): number[] {
  const signals: number[] = [];

  for (let i = 0; i < macdResult.macd.length; i++) {
    if (i === 0) {
      signals.push(0);
      continue;
    }

    const prevMACD = macdResult.macd[i - 1];
    const prevSignal = macdResult.signal[i - 1];
    const currMACD = macdResult.macd[i];
    const currSignal = macdResult.signal[i];

    if (
      prevMACD !== null &&
      prevSignal !== null &&
      currMACD !== null &&
      currSignal !== null
    ) {
      // Bullish crossover: MACD crosses above signal
      if (prevMACD <= prevSignal && currMACD > currSignal) {
        signals.push(1);
      }
      // Bearish crossover: MACD crosses below signal
      else if (prevMACD >= prevSignal && currMACD < currSignal) {
        signals.push(-1);
      } else {
        signals.push(0);
      }
    } else {
      signals.push(0);
    }
  }

  return signals;
}

/**
 * Detect Moving Average crossover signals
 * @param fastMA - Fast moving average array
 * @param slowMA - Slow moving average array
 * @returns Array of signals: 1 (bullish cross), -1 (bearish cross), 0 (no cross)
 */
export function detectMACrossover(
  fastMA: (number | null)[],
  slowMA: (number | null)[]
): number[] {
  const signals: number[] = [];

  for (let i = 0; i < fastMA.length; i++) {
    if (i === 0) {
      signals.push(0);
      continue;
    }

    const prevFast = fastMA[i - 1];
    const prevSlow = slowMA[i - 1];
    const currFast = fastMA[i];
    const currSlow = slowMA[i];

    if (
      prevFast !== null &&
      prevSlow !== null &&
      currFast !== null &&
      currSlow !== null
    ) {
      // Bullish crossover: Fast crosses above slow
      if (prevFast <= prevSlow && currFast > currSlow) {
        signals.push(1);
      }
      // Bearish crossover: Fast crosses below slow
      else if (prevFast >= prevSlow && currFast < currSlow) {
        signals.push(-1);
      } else {
        signals.push(0);
      }
    } else {
      signals.push(0);
    }
  }

  return signals;
}

/**
 * Clear the indicator cache (useful for testing)
 */
export function clearCache(): void {
  indicatorCache.clear();
}
