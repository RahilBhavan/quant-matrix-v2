/**
 * DeFi Position Types
 */

import { Protocol, Asset } from './defi';

export interface BasePosition {
  id: string;
  protocol: Protocol;
  walletAddress: string;
  value: number;
  pnl: number;
  createdAt: Date;
}

export interface UniswapLPPosition extends BasePosition {
  protocol: 'Uniswap';
  poolAddress: string;
  token0: Asset;
  token1: Asset;
  liquidity: bigint;
  tickLower: number;
  tickUpper: number;
  feesEarned: { token0: number; token1: number };
  impermanentLoss: number;
}

export interface AavePosition extends BasePosition {
  protocol: 'Aave';
  type: 'SUPPLY' | 'BORROW';
  asset: Asset;
  amount: number;
  apy: number;
  healthFactor?: number;
}

export interface CompoundPosition extends BasePosition {
  protocol: 'Compound';
  type: 'SUPPLY' | 'BORROW';
  asset: Asset;
  amount: number;
  apy: number;
}

export type Position = UniswapLPPosition | AavePosition | CompoundPosition;
