/**
 * Uniswap V3 Subgraph Service
 */

import { uniswapClient } from './client';
import {
  POOL_HISTORY_QUERY,
  POOL_CURRENT_QUERY,
  POOLS_QUERY,
} from './queries';
import { PoolDayData } from '@/types';

interface Pool {
  id: string;
  token0: {
    id: string;
    symbol: string;
    name: string;
    decimals: string;
  };
  token1: {
    id: string;
    symbol: string;
    name: string;
    decimals: string;
  };
  token0Price: string;
  token1Price: string;
  liquidity: string;
  volumeUSD: string;
  feeTier: string;
  sqrtPrice?: string;
  tick?: string;
  totalValueLockedUSD?: string;
}

interface PoolDayDataRaw {
  date: number;
  token0Price: string;
  token1Price: string;
  liquidity: string;
  volumeUSD: string;
  feesUSD: string;
}

export class UniswapService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getPoolHistory(
    poolAddress: string,
    startDate: Date,
    endDate: Date
  ): Promise<PoolDayData[]> {
    const cacheKey = `pool-history-${poolAddress}-${startDate.getTime()}-${endDate.getTime()}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const startTime = Math.floor(startDate.getTime() / 1000);
      const endTime = Math.floor(endDate.getTime() / 1000);

      const { data } = await uniswapClient.query({
        query: POOL_HISTORY_QUERY,
        variables: {
          poolAddress: poolAddress.toLowerCase(),
          startTime,
          endTime,
        },
      });

      const poolDayDatas: PoolDayData[] = data.poolDayDatas.map((item: PoolDayDataRaw) => ({
        date: item.date,
        token0Price: item.token0Price,
        token1Price: item.token1Price,
        liquidity: item.liquidity,
        volumeUSD: item.volumeUSD,
        feesUSD: item.feesUSD,
      }));

      // Cache result
      this.setCache(cacheKey, poolDayDatas);

      return poolDayDatas;
    } catch (error: any) {
      console.error('Failed to fetch pool history:', error);
      throw new Error(`Failed to fetch pool history: ${error.message}`);
    }
  }

  async getCurrentPrice(poolAddress: string): Promise<number> {
    const cacheKey = `pool-price-${poolAddress}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await uniswapClient.query({
        query: POOL_CURRENT_QUERY,
        variables: {
          poolAddress: poolAddress.toLowerCase(),
        },
      });

      if (!data.pool) {
        throw new Error(`Pool ${poolAddress} not found`);
      }

      const price = parseFloat(data.pool.token0Price);

      // Cache result
      this.setCache(cacheKey, price);

      return price;
    } catch (error: any) {
      console.error('Failed to fetch current price:', error);
      throw new Error(`Failed to fetch current price: ${error.message}`);
    }
  }

  async getPoolInfo(poolAddress: string): Promise<Pool> {
    const cacheKey = `pool-info-${poolAddress}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await uniswapClient.query({
        query: POOL_CURRENT_QUERY,
        variables: {
          poolAddress: poolAddress.toLowerCase(),
        },
      });

      if (!data.pool) {
        throw new Error(`Pool ${poolAddress} not found`);
      }

      const poolInfo: Pool = data.pool;

      // Cache result
      this.setCache(cacheKey, poolInfo);

      return poolInfo;
    } catch (error: any) {
      console.error('Failed to fetch pool info:', error);
      throw new Error(`Failed to fetch pool info: ${error.message}`);
    }
  }

  async getTopPools(limit: number = 10, skip: number = 0): Promise<Pool[]> {
    const cacheKey = `top-pools-${limit}-${skip}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await uniswapClient.query({
        query: POOLS_QUERY,
        variables: {
          first: limit,
          skip,
        },
      });

      const pools: Pool[] = data.pools;

      // Cache result
      this.setCache(cacheKey, pools);

      return pools;
    } catch (error: any) {
      console.error('Failed to fetch top pools:', error);
      throw new Error(`Failed to fetch top pools: ${error.message}`);
    }
  }

  async getPriceAtTimestamp(
    poolAddress: string,
    timestamp: Date
  ): Promise<number | null> {
    try {
      // Get day data for the specific day
      const dayStart = new Date(timestamp);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(timestamp);
      dayEnd.setHours(23, 59, 59, 999);

      const history = await this.getPoolHistory(poolAddress, dayStart, dayEnd);

      if (history.length === 0) {
        return null;
      }

      // Return the closest price
      return parseFloat(history[0].token0Price);
    } catch (error) {
      console.error('Failed to fetch price at timestamp:', error);
      return null;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
}

export const uniswapService = new UniswapService();
