/**
 * DeFi Protocol Constants
 */

import { LegoBlock, Protocol } from './types';

// Protocol Colors
export const PROTOCOL_COLORS = {
  [Protocol.UNISWAP]: '#FF007A',  // Uniswap Pink
  [Protocol.AAVE]: '#B6509E',      // Aave Purple
  [Protocol.COMPOUND]: '#00D395',  // Compound Green
  [Protocol.LOGIC]: '#FFD93D',     // Yellow
  [Protocol.RISK]: '#6C63FF',      // Blue-Purple
} as const;

// DeFi Protocol Blocks
export const AVAILABLE_BLOCKS: Omit<LegoBlock, 'id'>[] = [
  // ===== UNISWAP DEX BLOCKS =====
  {
    type: 'UNISWAP_SWAP',
    protocol: Protocol.UNISWAP,
    label: 'Swap Tokens',
    description: 'Execute token swap on Uniswap V3',
    color: PROTOCOL_COLORS[Protocol.UNISWAP],
    params: {
      tokenIn: 'USDC',
      tokenOut: 'WETH',
      amount: 1000,
      slippage: 0.5,
    },
  },
  {
    type: 'PRICE_CHECK',
    protocol: Protocol.UNISWAP,
    label: 'Check Price',
    description: 'Get pool price & liquidity',
    color: PROTOCOL_COLORS[Protocol.UNISWAP],
    params: {
      tokenIn: 'USDC',
      tokenOut: 'WETH',
    },
  },
  {
    type: 'CREATE_LP_POSITION',
    protocol: Protocol.UNISWAP,
    label: 'Create LP Position',
    description: 'Provide liquidity to pool',
    color: PROTOCOL_COLORS[Protocol.UNISWAP],
    params: {
      token0: 'WETH',
      token1: 'USDC',
      feeTier: 3000,
      amount: 5000,
      tickLower: -887220,
      tickUpper: 887220,
    },
  },
  {
    type: 'COLLECT_FEES',
    protocol: Protocol.UNISWAP,
    label: 'Collect LP Fees',
    description: 'Claim earned trading fees',
    color: PROTOCOL_COLORS[Protocol.UNISWAP],
    params: {},
  },

  // ===== AAVE LENDING BLOCKS =====
  {
    type: 'AAVE_SUPPLY',
    protocol: Protocol.AAVE,
    label: 'Supply Collateral',
    description: 'Supply assets to earn yield',
    color: PROTOCOL_COLORS[Protocol.AAVE],
    params: {
      asset: 'USDC',
      supplyAmount: 5000,
    },
  },
  {
    type: 'AAVE_BORROW',
    protocol: Protocol.AAVE,
    label: 'Borrow Asset',
    description: 'Borrow against collateral',
    color: PROTOCOL_COLORS[Protocol.AAVE],
    params: {
      asset: 'WETH',
      borrowAmount: 1,
      collateralFactor: 0.8,
    },
  },
  {
    type: 'REPAY_DEBT',
    protocol: Protocol.AAVE,
    label: 'Repay Debt',
    description: 'Repay borrowed assets',
    color: PROTOCOL_COLORS[Protocol.AAVE],
    params: {
      asset: 'WETH',
      amount: 1,
    },
  },
  {
    type: 'HEALTH_FACTOR_CHECK',
    protocol: Protocol.AAVE,
    label: 'Health Check',
    description: 'Monitor liquidation risk',
    color: PROTOCOL_COLORS[Protocol.AAVE],
    params: {
      threshold: 1.5,
    },
  },

  // ===== LOGIC BLOCKS =====
  {
    type: 'IF_CONDITION',
    protocol: Protocol.LOGIC,
    label: 'If Condition',
    description: 'Conditional execution',
    color: PROTOCOL_COLORS[Protocol.LOGIC],
    params: {
      condition: 'APY > 5',
    },
  },
  {
    type: 'GAS_CHECKER',
    protocol: Protocol.LOGIC,
    label: 'Gas Check',
    description: 'Execute if gas below threshold',
    color: PROTOCOL_COLORS[Protocol.LOGIC],
    params: {
      threshold: 50,
    },
  },

  // ===== RISK MANAGEMENT BLOCKS =====
  {
    type: 'STOP_LOSS',
    protocol: Protocol.RISK,
    label: 'Stop Loss',
    description: 'Exit if loss exceeds threshold',
    color: PROTOCOL_COLORS[Protocol.RISK],
    params: {
      threshold: -10,
    },
  },
  {
    type: 'POSITION_SIZE',
    protocol: Protocol.RISK,
    label: 'Position Size',
    description: 'Calculate optimal position size',
    color: PROTOCOL_COLORS[Protocol.RISK],
    params: {
      percentage: 25,
    },
  },
];

// Token addresses for Sepolia testnet
export const TOKEN_ADDRESSES = {
  WETH: '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14',
  USDC: '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8',
  DAI: '0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357',
  USDT: '0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0',
} as const;

// Block metadata for UI
export const BLOCK_METADATA = {
  UNISWAP_SWAP: {
    icon: '🔄',
    category: 'DEX Trading',
    requiredParams: ['tokenIn', 'tokenOut', 'amount'],
  },
  PRICE_CHECK: {
    icon: '💹',
    category: 'DEX Trading',
    requiredParams: ['tokenIn', 'tokenOut'],
  },
  CREATE_LP_POSITION: {
    icon: '💧',
    category: 'Liquidity',
    requiredParams: ['token0', 'token1', 'feeTier'],
  },
  COLLECT_FEES: {
    icon: '💰',
    category: 'Liquidity',
    requiredParams: [],
  },
  AAVE_SUPPLY: {
    icon: '📥',
    category: 'Lending',
    requiredParams: ['asset', 'supplyAmount'],
  },
  AAVE_BORROW: {
    icon: '📤',
    category: 'Lending',
    requiredParams: ['asset', 'borrowAmount'],
  },
  REPAY_DEBT: {
    icon: '💸',
    category: 'Lending',
    requiredParams: ['asset', 'amount'],
  },
  HEALTH_FACTOR_CHECK: {
    icon: '❤️',
    category: 'Lending',
    requiredParams: ['threshold'],
  },
  IF_CONDITION: {
    icon: '❓',
    category: 'Logic',
    requiredParams: ['condition'],
  },
  GAS_CHECKER: {
    icon: '⛽',
    category: 'Logic',
    requiredParams: ['threshold'],
  },
  STOP_LOSS: {
    icon: '🛑',
    category: 'Risk',
    requiredParams: ['threshold'],
  },
  POSITION_SIZE: {
    icon: '📊',
    category: 'Risk',
    requiredParams: ['percentage'],
  },
} as const;

export const MOCK_MARKET_DATA = {
  marketStatus: 'OPEN' as const,
  lastUpdate: new Date(),
  dataFreshness: 0,
};
