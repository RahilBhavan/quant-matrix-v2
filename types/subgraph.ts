/**
 * The Graph Subgraph Response Types
 */

export interface PoolDayData {
  date: number;
  token0Price: string;
  token1Price: string;
  liquidity: string;
  volumeUSD: string;
  feesUSD: string;
}

export interface ReserveHistory {
  timestamp: number;
  liquidityRate: string;
  variableBorrowRate: string;
  utilizationRate: string;
}

export interface SubgraphResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}
