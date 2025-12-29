/**
 * Core DeFi Protocol Types
 */

export type Protocol = 'Uniswap' | 'Aave' | 'Compound';
export type Asset = 'ETH' | 'WETH' | 'USDC' | 'USDT' | 'DAI' | 'WBTC';

export type BlockType =
  // DEX
  | 'UNISWAP_SWAP'
  | 'PRICE_CHECK'
  | 'ARBITRAGE_DETECTOR'
  | 'MEV_PROTECTION'
  // Lending
  | 'AAVE_SUPPLY'
  | 'AAVE_BORROW'
  | 'REPAY_DEBT'
  | 'HEALTH_FACTOR_CHECK'
  // LP
  | 'CREATE_LP_POSITION'
  | 'ADJUST_RANGE'
  | 'COLLECT_FEES'
  // Logic
  | 'IF_CONDITION'
  | 'GAS_CHECKER'
  | 'STOP_LOSS';

export interface DeFiBlock {
  id: string;
  type: BlockType;
  protocol: Protocol;
  params: BlockParams;
  position: [number, number, number];
  connections: string[];
}

export interface BlockParams {
  // DEX params
  tokenIn?: Asset;
  tokenOut?: Asset;
  amount?: number;
  slippage?: number;

  // Lending params
  asset?: Asset;
  supplyAmount?: number;
  borrowAmount?: number;
  collateralFactor?: number;

  // LP params
  token0?: Asset;
  token1?: Asset;
  feeTier?: 500 | 3000 | 10000;
  tickLower?: number;
  tickUpper?: number;

  // Logic params
  condition?: string;
  threshold?: number;

  // MEV Protection params
  useFlashbots?: boolean;
  maxPriorityFeePerGas?: number;  // gwei
  privateTransaction?: boolean;
}
