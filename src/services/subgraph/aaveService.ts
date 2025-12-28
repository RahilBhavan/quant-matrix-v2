/**
 * Aave V3 Subgraph Service
 */

import { aaveClient } from './client';
import {
  AAVE_RATES_QUERY,
  AAVE_RESERVE_HISTORY_QUERY,
  AAVE_ALL_RESERVES_QUERY,
} from './queries';
import { ReserveHistory } from '@/types';

interface Reserve {
  id: string;
  symbol: string;
  name: string;
  underlyingAsset: string;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  utilizationRate: string;
  totalLiquidity: string;
  availableLiquidity: string;
  totalDebt?: string;
}

interface ReserveHistoryRaw {
  timestamp: number;
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  utilizationRate: string;
  liquidityIndex: string;
}

export class AaveService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Convert Aave RAY (1e27) rate to APY percentage
   */
  private rayToAPY(rayRate: string): number {
    const RAY = 10 ** 27;
    const rate = parseFloat(rayRate) / RAY;
    // Convert to APY: (1 + rate)^(seconds in year / seconds in block) - 1
    // Simplified: rate * 100 for approximate APY
    return rate * 100;
  }

  async getCurrentRates(asset: string): Promise<{
    supplyAPY: number;
    borrowAPY: number;
    utilizationRate: number;
  }> {
    const cacheKey = `rates-${asset}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await aaveClient.query({
        query: AAVE_RATES_QUERY,
        variables: {
          asset: asset.toLowerCase(),
        },
      });

      if (!data.reserves || data.reserves.length === 0) {
        throw new Error(`Reserve for asset ${asset} not found`);
      }

      const reserve = data.reserves[0];

      const rates = {
        supplyAPY: this.rayToAPY(reserve.liquidityRate),
        borrowAPY: this.rayToAPY(reserve.variableBorrowRate),
        utilizationRate: parseFloat(reserve.utilizationRate),
      };

      // Cache result
      this.setCache(cacheKey, rates);

      return rates;
    } catch (error: any) {
      console.error('Failed to fetch current rates:', error);
      throw new Error(`Failed to fetch current rates: ${error.message}`);
    }
  }

  async getReserveInfo(asset: string): Promise<Reserve> {
    const cacheKey = `reserve-info-${asset}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await aaveClient.query({
        query: AAVE_RATES_QUERY,
        variables: {
          asset: asset.toLowerCase(),
        },
      });

      if (!data.reserves || data.reserves.length === 0) {
        throw new Error(`Reserve for asset ${asset} not found`);
      }

      const reserve: Reserve = data.reserves[0];

      // Cache result
      this.setCache(cacheKey, reserve);

      return reserve;
    } catch (error: any) {
      console.error('Failed to fetch reserve info:', error);
      throw new Error(`Failed to fetch reserve info: ${error.message}`);
    }
  }

  async getRateHistory(
    asset: string,
    startDate: Date,
    endDate?: Date
  ): Promise<ReserveHistory[]> {
    const cacheKey = `rate-history-${asset}-${startDate.getTime()}-${endDate?.getTime()}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // First, get reserve ID
      const reserveInfo = await this.getReserveInfo(asset);
      const reserveId = reserveInfo.id;

      const startTime = Math.floor(startDate.getTime() / 1000);
      const endTime = endDate ? Math.floor(endDate.getTime() / 1000) : Math.floor(Date.now() / 1000);

      const { data } = await aaveClient.query({
        query: AAVE_RESERVE_HISTORY_QUERY,
        variables: {
          reserveId,
          startTime,
          endTime,
        },
      });

      const history: ReserveHistory[] = data.reserveParamsHistoryItems.map(
        (item: ReserveHistoryRaw) => ({
          timestamp: item.timestamp,
          liquidityRate: item.liquidityRate,
          variableBorrowRate: item.variableBorrowRate,
          utilizationRate: item.utilizationRate,
        })
      );

      // Cache result
      this.setCache(cacheKey, history);

      return history;
    } catch (error: any) {
      console.error('Failed to fetch rate history:', error);
      throw new Error(`Failed to fetch rate history: ${error.message}`);
    }
  }

  async getAllReserves(): Promise<Reserve[]> {
    const cacheKey = 'all-reserves';

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data } = await aaveClient.query({
        query: AAVE_ALL_RESERVES_QUERY,
      });

      const reserves: Reserve[] = data.reserves;

      // Cache result
      this.setCache(cacheKey, reserves);

      return reserves;
    } catch (error: any) {
      console.error('Failed to fetch all reserves:', error);
      throw new Error(`Failed to fetch all reserves: ${error.message}`);
    }
  }

  async getTopReservesByLiquidity(limit: number = 10): Promise<Reserve[]> {
    try {
      const allReserves = await this.getAllReserves();

      // Sort by total liquidity (already sorted from query, but ensure)
      return allReserves
        .sort((a, b) => parseFloat(b.totalLiquidity) - parseFloat(a.totalLiquidity))
        .slice(0, limit);
    } catch (error: any) {
      console.error('Failed to fetch top reserves:', error);
      throw new Error(`Failed to fetch top reserves: ${error.message}`);
    }
  }

  async getAPYAtTimestamp(
    asset: string,
    timestamp: Date
  ): Promise<{ supplyAPY: number; borrowAPY: number } | null> {
    try {
      // Get history around the timestamp
      const dayBefore = new Date(timestamp);
      dayBefore.setDate(dayBefore.getDate() - 1);

      const dayAfter = new Date(timestamp);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const history = await this.getRateHistory(asset, dayBefore, dayAfter);

      if (history.length === 0) {
        return null;
      }

      // Find closest timestamp
      const targetTime = timestamp.getTime() / 1000;
      const closest = history.reduce((prev, curr) => {
        return Math.abs(curr.timestamp - targetTime) < Math.abs(prev.timestamp - targetTime)
          ? curr
          : prev;
      });

      return {
        supplyAPY: this.rayToAPY(closest.liquidityRate),
        borrowAPY: this.rayToAPY(closest.variableBorrowRate),
      };
    } catch (error) {
      console.error('Failed to fetch APY at timestamp:', error);
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

export const aaveService = new AaveService();
