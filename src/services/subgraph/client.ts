/**
 * Apollo Client for The Graph
 */

import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// The Graph API endpoints (Sepolia testnet)
const SUBGRAPH_URLS = {
  UNISWAP_V3: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3-sepolia',
  AAVE_V3: 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3-sepolia',
};

export const uniswapClient = new ApolloClient({
  link: new HttpLink({ uri: SUBGRAPH_URLS.UNISWAP_V3 }),
  cache: new InMemoryCache(),
});

export const aaveClient = new ApolloClient({
  link: new HttpLink({ uri: SUBGRAPH_URLS.AAVE_V3 }),
  cache: new InMemoryCache(),
});
