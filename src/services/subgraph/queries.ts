/**
 * GraphQL Queries for The Graph
 */

import { gql } from '@apollo/client';

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

export const AAVE_RATES_QUERY = gql`
  query AaveRates($asset: String!, $startTime: Int!) {
    reserves(where: { underlyingAsset: $asset }) {
      id
      symbol
      supplyRate
      variableBorrowRate
      utilizationRate
    }
  }
`;
