/**
 * Aave V3 Subgraph Service
 */

import { aaveClient } from './client';
import { AAVE_RATES_QUERY } from './queries';

export class AaveService {
  async getCurrentRates(asset: string): Promise<{ supplyAPY: number; borrowAPY: number }> {
    // TODO: Implement query
    throw new Error('Not implemented');
  }

  async getRateHistory(asset: string, startDate: Date): Promise<any[]> {
    // TODO: Implement query
    throw new Error('Not implemented');
  }
}

export const aaveService = new AaveService();
