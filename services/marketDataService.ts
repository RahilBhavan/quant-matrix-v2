import { StockQuote } from '../types';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || '';
const BASE_URL = 'https://www.alphavantage.co/query';

const RATE_LIMIT = {
  requestsPerMinute: 5,
  requestsPerDay: 25,
};

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class MarketDataCache {
  private cache: Map<string, CacheEntry> = new Map();

  set(key: string, data: any, ttl: number = 300000) {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  clear() {
    this.cache.clear();
  }
}

const cache = new MarketDataCache();

class RateLimiter {
  private tokens: number = RATE_LIMIT.requestsPerMinute;
  private lastRefill: number = Date.now();

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    if (elapsed > 60000) {
      this.tokens = RATE_LIMIT.requestsPerMinute;
      this.lastRefill = now;
    }

    if (this.tokens <= 0) {
      const waitTime = 60000 - elapsed;
      throw new Error(`Rate limit exceeded. Wait ${Math.ceil(waitTime / 1000)}s`);
    }

    this.tokens--;
  }
}

const rateLimiter = new RateLimiter();

export async function getQuote(symbol: string): Promise<StockQuote> {
  const cacheKey = `quote_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  await rateLimiter.acquire();

  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message']) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    if (data['Note']) {
      throw new Error('API rate limit reached');
    }

    const quote = data['Global Quote'];
    const result: StockQuote = {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume']),
      timestamp: new Date(),
    };

    cache.set(cacheKey, result, 300000);
    return result;
  } catch (error) {
    console.error('Alpha Vantage Error:', error);
    throw error;
  }
}

export async function getHistoricalData(
  symbol: string,
  range: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<any[]> {
  const cacheKey = `history_${symbol}_${range}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  await rateLimiter.acquire();

  const functionMap = {
    daily: 'TIME_SERIES_DAILY',
    weekly: 'TIME_SERIES_WEEKLY',
    monthly: 'TIME_SERIES_MONTHLY',
  };

  const url = `${BASE_URL}?function=${functionMap[range]}&symbol=${symbol}&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data['Error Message'] || data['Note']) {
      throw new Error('API error');
    }

    const timeSeriesKey = Object.keys(data).find(k => k.includes('Time Series'));
    if (!timeSeriesKey) throw new Error('Invalid response format');

    const timeSeries = data[timeSeriesKey];
    const result = Object.entries(timeSeries).map(([date, values]: [string, any]) => ({
      date,
      open: parseFloat(values['1. open']),
      high: parseFloat(values['2. high']),
      low: parseFloat(values['3. low']),
      close: parseFloat(values['4. close']),
      volume: parseInt(values['5. volume']),
    }));

    cache.set(cacheKey, result, 86400000);
    return result;
  } catch (error) {
    console.error('Historical data error:', error);
    throw error;
  }
}

export function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (day === 0 || day === 6) return false;

  const currentMinutes = hour * 60 + minute;
  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;

  return currentMinutes >= marketOpen && currentMinutes < marketClose;
}

export { cache as marketDataCache };
