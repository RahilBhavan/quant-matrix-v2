/**
 * DeFi Protocol Block Definitions
 * TODO: Implement in Phase 4
 */

import { DeFiBlock } from '@/types';

export const DEFI_BLOCKS: Omit<DeFiBlock, 'id' | 'position'>[] = [
  // DEX Blocks
  {
    type: 'UNISWAP_SWAP',
    protocol: 'Uniswap',
    params: {
      tokenIn: 'USDC',
      tokenOut: 'WETH',
      amount: 1000,
      slippage: 0.5,
    },
    connections: [],
  },
  {
    type: 'PRICE_CHECK',
    protocol: 'Uniswap',
    params: {
      tokenIn: 'USDC',
      tokenOut: 'WETH',
    },
    connections: [],
  },

  // Lending Blocks
  {
    type: 'AAVE_SUPPLY',
    protocol: 'Aave',
    params: {
      asset: 'USDC',
      supplyAmount: 5000,
    },
    connections: [],
  },
  {
    type: 'AAVE_BORROW',
    protocol: 'Aave',
    params: {
      asset: 'WETH',
      borrowAmount: 1,
      collateralFactor: 0.8,
    },
    connections: [],
  },

  // LP Blocks
  {
    type: 'CREATE_LP_POSITION',
    protocol: 'Uniswap',
    params: {
      token0: 'WETH',
      token1: 'USDC',
      feeTier: 3000,
      tickLower: -887220,
      tickUpper: 887220,
    },
    connections: [],
  },

  // Logic Blocks
  {
    type: 'IF_CONDITION',
    protocol: 'Uniswap',
    params: {
      condition: 'APY > 5',
    },
    connections: [],
  },
  {
    type: 'STOP_LOSS',
    protocol: 'Uniswap',
    params: {
      threshold: -10,
    },
    connections: [],
  },
];

export const PROTOCOL_COLORS = {
  Uniswap: '#FF007A',
  Aave: '#B6509E',
  Compound: '#00D395',
} as const;
