/**
 * DeFi Strategy Types
 */

import { DeFiBlock } from './defi';

export interface EquityPoint {
  date: Date;
  equity: number;
}

export interface Trade {
  date: Date;
  type: 'BUY' | 'SELL' | 'SUPPLY' | 'BORROW';
  asset: string;
  amount: number;
  price: number;
  gasCost: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalGasSpent: number;
  totalFeesSpent: number;
  winRate?: number;
  impermanentLoss?: number;
}

export interface BacktestResult {
  equityCurve: EquityPoint[];
  trades: Trade[];
  metrics: PerformanceMetrics;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  blocks: DeFiBlock[];
  createdAt: Date;
  backtestResults?: BacktestResult;
}
