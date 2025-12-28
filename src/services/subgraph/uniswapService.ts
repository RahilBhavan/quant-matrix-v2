/**
 * Uniswap V3 Subgraph Service
 */

import { uniswapClient } from './client';
import { POOL_HISTORY_QUERY } from './queries';
import { PoolDayData } from '@/types';

export class UniswapService {
  async getPoolHistory(
    poolAddress: string,
    startDate: Date,
    endDate: Date
  ): Promise<PoolDayData[]> {
    // TODO: Implement query
    throw new Error('Not implemented');
  }

  async getCurrentPrice(poolAddress: string): Promise<number> {
    // TODO: Implement query
    throw new Error('Not implemented');
  }
}

export const uniswapService = new UniswapService();
