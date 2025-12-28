/**
 * GraphQL Queries for The Graph
 */

import { gql } from '@apollo/client';

// Uniswap V3 Queries
export const POOL_HISTORY_QUERY = gql`
  query PoolHistory($poolAddress: String!, $startTime: Int!, $endTime: Int!) {
    poolDayDatas(
      where: { pool: $poolAddress, date_gte: $startTime, date_lte: $endTime }
      orderBy: date
      orderDirection: asc
    ) {
      date
      token0Price
      token1Price
      liquidity
      volumeUSD
      feesUSD
    }
  }
`;

export const POOL_CURRENT_QUERY = gql`
  query PoolCurrent($poolAddress: String!) {
    pool(id: $poolAddress) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      token0Price
      token1Price
      liquidity
      volumeUSD
      feeTier
      sqrtPrice
      tick
    }
  }
`;

export const POOLS_QUERY = gql`
  query Pools($first: Int!, $skip: Int!) {
    pools(
      first: $first
      skip: $skip
      orderBy: totalValueLockedUSD
      orderDirection: desc
      where: { liquidity_gt: "0" }
    ) {
      id
      token0 {
        symbol
        name
      }
      token1 {
        symbol
        name
      }
      token0Price
      token1Price
      liquidity
      volumeUSD
      totalValueLockedUSD
      feeTier
    }
  }
`;

// Aave V3 Queries
export const AAVE_RATES_QUERY = gql`
  query AaveRates($asset: String!) {
    reserves(where: { underlyingAsset: $asset }) {
      id
      symbol
      name
      underlyingAsset
      liquidityRate
      variableBorrowRate
      stableBorrowRate
      utilizationRate
      totalLiquidity
      availableLiquidity
      totalDebt
    }
  }
`;

export const AAVE_RESERVE_HISTORY_QUERY = gql`
  query AaveReserveHistory($reserveId: String!, $startTime: Int!, $endTime: Int!) {
    reserveParamsHistoryItems(
      where: { reserve: $reserveId, timestamp_gte: $startTime, timestamp_lte: $endTime }
      orderBy: timestamp
      orderDirection: asc
      first: 1000
    ) {
      timestamp
      liquidityRate
      variableBorrowRate
      stableBorrowRate
      utilizationRate
      liquidityIndex
    }
  }
`;

export const AAVE_ALL_RESERVES_QUERY = gql`
  query AaveAllReserves {
    reserves(first: 50, orderBy: totalLiquidity, orderDirection: desc) {
      id
      symbol
      name
      underlyingAsset
      liquidityRate
      variableBorrowRate
      utilizationRate
      totalLiquidity
      availableLiquidity
    }
  }
`;
