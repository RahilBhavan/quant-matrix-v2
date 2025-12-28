# Phase 1: DeFi Platform Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Quant Matrix worktree into DeFi platform foundation with 3D visualization engine intact, Web3 dependencies installed, and new DeFi-specific file structure.

**Architecture:** Keep existing 3D visualization components (ThreeScene, visualizations, choreography, animation system), remove stock trading business logic, install Web3 stack (ethers.js, Apollo Client for The Graph), create new DeFi service layer placeholder structure.

**Tech Stack:** React 18, TypeScript, Vite, Three.js, React Three Fiber, ethers.js v6, @apollo/client, graphql, Tailwind CSS

---

## Task 1: Install Web3 Dependencies

**Files:**
- Modify: `package.json`
- Create: `package-lock.json` (updated)

**Step 1: Install ethers.js v6**

Run: `npm install ethers@^6.13.0`
Expected: Package added to dependencies

**Step 2: Install Apollo Client for The Graph**

Run: `npm install @apollo/client graphql`
Expected: Packages added to dependencies

**Step 3: Install additional utilities**

Run: `npm install date-fns@^3.0.0`
Expected: Date utility library added

**Step 4: Verify installation**

Run: `npm list ethers @apollo/client graphql`
Expected: All packages shown with correct versions

**Step 5: Test build**

Run: `npm run build`
Expected: Successful build

**Step 6: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add Web3 dependencies for DeFi platform

Install ethers.js v6 for blockchain interaction
Install Apollo Client + GraphQL for The Graph queries
Install date-fns for timestamp handling

Next: Create DeFi service structure"
```

---

## Task 2: Create DeFi Type Definitions

**Files:**
- Create: `src/types/defi.ts`
- Create: `src/types/position.ts`
- Create: `src/types/subgraph.ts`
- Create: `src/types/strategy.ts`
- Create: `src/types/index.ts`

**Step 1: Create core DeFi types**

Create `src/types/defi.ts`:

```typescript
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
}
```

**Step 2: Create position types**

Create `src/types/position.ts`:

```typescript
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
```

**Step 3: Create subgraph types**

Create `src/types/subgraph.ts`:

```typescript
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
```

**Step 4: Create strategy types**

Create `src/types/strategy.ts`:

```typescript
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
```

**Step 5: Create index barrel export**

Create `src/types/index.ts`:

```typescript
/**
 * Central export for all DeFi types
 */

export * from './defi';
export * from './position';
export * from './subgraph';
export * from './strategy';
```

**Step 6: Verify TypeScript compilation**

Run: `npm run build`
Expected: Successful build with no type errors

**Step 7: Commit**

```bash
git add src/types/
git commit -m "feat: add DeFi type definitions

Create comprehensive TypeScript types:
- defi.ts: Core protocol, block, and param types
- position.ts: Uniswap LP, Aave, Compound position types
- subgraph.ts: The Graph response types
- strategy.ts: Strategy, backtest, and performance types

All types ready for service layer implementation"
```

---

## Task 3: Create Web3 Service Structure

**Files:**
- Create: `src/services/web3/walletService.ts`
- Create: `src/services/web3/contractService.ts`
- Create: `src/services/web3/errorHandler.ts`
- Create: `src/services/web3/index.ts`

**Step 1: Create wallet service placeholder**

Create `src/services/web3/walletService.ts`:

```typescript
/**
 * WalletService - MetaMask connection and management
 */

import { ethers } from 'ethers';

export class WalletService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  async connect(): Promise<string> {
    // TODO: Implement MetaMask connection
    // TODO: Switch to Sepolia testnet
    throw new Error('Not implemented');
  }

  async disconnect(): Promise<void> {
    this.provider = null;
    this.signer = null;
  }

  async getAddress(): Promise<string> {
    if (!this.signer) throw new Error('Wallet not connected');
    return await this.signer.getAddress();
  }

  async getBalance(address: string): Promise<bigint> {
    if (!this.provider) throw new Error('Provider not initialized');
    return await this.provider.getBalance(address);
  }

  isConnected(): boolean {
    return this.provider !== null && this.signer !== null;
  }
}

// Singleton instance
export const walletService = new WalletService();
```

**Step 2: Create contract service placeholder**

Create `src/services/web3/contractService.ts`:

```typescript
/**
 * ContractService - Smart contract interaction
 */

import { ethers } from 'ethers';

// Sepolia testnet contract addresses (placeholders)
const CONTRACTS = {
  UNISWAP_ROUTER: '0x0000000000000000000000000000000000000000',
  AAVE_POOL: '0x0000000000000000000000000000000000000000',
  COMPOUND_COMET: '0x0000000000000000000000000000000000000000',
};

export class ContractService {
  async executeSwap(params: any): Promise<ethers.TransactionReceipt> {
    // TODO: Implement Uniswap swap
    throw new Error('Not implemented');
  }

  async supplyToAave(params: any): Promise<ethers.TransactionReceipt> {
    // TODO: Implement Aave supply
    throw new Error('Not implemented');
  }

  async borrowFromAave(params: any): Promise<ethers.TransactionReceipt> {
    // TODO: Implement Aave borrow
    throw new Error('Not implemented');
  }
}

export const contractService = new ContractService();
```

**Step 3: Create error handler**

Create `src/services/web3/errorHandler.ts`:

```typescript
/**
 * Web3ErrorHandler - User-friendly error messages
 */

export interface UserFriendlyError {
  title: string;
  message: string;
  recoverable: boolean;
  action?: string;
  shouldRetry?: boolean;
}

export class Web3ErrorHandler {
  handleTransactionError(error: any): UserFriendlyError {
    // MetaMask user rejection
    if (error.code === 4001) {
      return {
        title: 'Transaction Rejected',
        message: 'You cancelled the transaction in MetaMask.',
        recoverable: true,
      };
    }

    // Insufficient gas
    if (error.code === -32000 || error.message?.includes('insufficient funds')) {
      return {
        title: 'Insufficient ETH for Gas',
        message: 'You need more ETH to pay for transaction gas.',
        recoverable: true,
        action: 'Get testnet ETH from Sepolia faucet',
      };
    }

    // Generic fallback
    return {
      title: 'Transaction Failed',
      message: error.message || 'Unknown error occurred',
      recoverable: false,
    };
  }
}

export const errorHandler = new Web3ErrorHandler();
```

**Step 4: Create barrel export**

Create `src/services/web3/index.ts`:

```typescript
export * from './walletService';
export * from './contractService';
export * from './errorHandler';
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Successful build

**Step 6: Commit**

```bash
git add src/services/web3/
git commit -m "feat: create Web3 service layer structure

Add service placeholders:
- walletService: MetaMask connection (not implemented)
- contractService: Smart contract calls (not implemented)
- errorHandler: User-friendly error messages

Ready for Phase 2 implementation"
```

---

## Task 4: Create Subgraph Service Structure

**Files:**
- Create: `src/services/subgraph/client.ts`
- Create: `src/services/subgraph/queries.ts`
- Create: `src/services/subgraph/uniswapService.ts`
- Create: `src/services/subgraph/aaveService.ts`
- Create: `src/services/subgraph/index.ts`

**Step 1: Create Apollo client setup**

Create `src/services/subgraph/client.ts`:

```typescript
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
```

**Step 2: Create GraphQL query definitions**

Create `src/services/subgraph/queries.ts`:

```typescript
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
```

**Step 3: Create Uniswap service placeholder**

Create `src/services/subgraph/uniswapService.ts`:

```typescript
/**
 * Uniswap V3 Subgraph Service
 */

import { uniswapClient } from './client';
import { POOL_HISTORY_QUERY } from './queries';
import { PoolDayData } from '@/types';

export class UniswapService {
  async getPoolHistory(
    poolAddress: string,
    startDate: Date,
    endDate: Date
  ): Promise<PoolDayData[]> {
    // TODO: Implement query
    throw new Error('Not implemented');
  }

  async getCurrentPrice(poolAddress: string): Promise<number> {
    // TODO: Implement query
    throw new Error('Not implemented');
  }
}

export const uniswapService = new UniswapService();
```

**Step 4: Create Aave service placeholder**

Create `src/services/subgraph/aaveService.ts`:

```typescript
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
```

**Step 5: Create barrel export**

Create `src/services/subgraph/index.ts`:

```typescript
export * from './client';
export * from './queries';
export * from './uniswapService';
export * from './aaveService';
```

**Step 6: Verify build**

Run: `npm run build`
Expected: Successful build

**Step 7: Commit**

```bash
git add src/services/subgraph/
git commit -m "feat: create Subgraph service layer structure

Add The Graph integration:
- client.ts: Apollo Client setup for Uniswap/Aave subgraphs
- queries.ts: GraphQL query definitions
- uniswapService: Pool history queries (not implemented)
- aaveService: Rate queries (not implemented)

Ready for Phase 3 implementation"
```

---

## Task 5: Copy 3D Visualization Components

**Files:**
- Keep: `src/components/three/ThreeScene.tsx`
- Keep: `src/components/visualizations/EquityCurve3D.tsx`
- Keep: `src/components/visualizations/PortfolioChart3D.tsx`
- Keep: `src/utils/three-helpers.ts`
- Keep: `src/hooks/useChoreography.ts`
- Keep: `src/utils/animation-presets.ts`
- Keep: `src/components/PerformanceMonitor.tsx`
- Keep: `src/utils/webgl-detection.ts`

**Step 1: Verify 3D components still exist**

Run: `ls src/components/three/ src/components/visualizations/ src/utils/three-helpers.ts src/hooks/useChoreography.ts`
Expected: All files present

**Step 2: Test build with existing components**

Run: `npm run build`
Expected: Successful build

**Step 3: Document kept components**

Create `docs/ARCHITECTURE.md`:

```markdown
# Quant Matrix DeFi - Architecture

## Preserved Components from Stock Platform

### 3D Visualization Engine
- `components/three/ThreeScene.tsx` - Scene context and management
- `components/visualizations/EquityCurve3D.tsx` - Equity curve tube geometry
- `components/visualizations/PortfolioChart3D.tsx` - Portfolio bars
- `utils/three-helpers.ts` - Material/geometry factories
- `components/PerformanceMonitor.tsx` - FPS monitoring

### Animation System
- `hooks/useChoreography.ts` - Animation sequencing
- `utils/animation-presets.ts` - Framer Motion variants

### WebGL Detection
- `utils/webgl-detection.ts` - Capability detection and fallbacks

## New DeFi Services (Placeholders)
- `services/web3/` - Wallet and contract interaction
- `services/subgraph/` - The Graph queries
- `types/` - DeFi-specific TypeScript types

## Next Steps
Phase 2: Implement Web3 wallet connection
Phase 3: Implement subgraph data fetching
Phase 4: Create DeFi block components
```

**Step 4: Commit**

```bash
git add docs/ARCHITECTURE.md
git commit -m "docs: document architecture and preserved components

List 3D visualization components kept from stock platform
Document new DeFi service structure
Outline implementation phases"
```

---

## Task 6: Update README for DeFi Platform

**Files:**
- Modify: `README.md`

**Step 1: Update README content**

Replace content in `README.md`:

```markdown
# Quant Matrix DeFi

Visual DeFi strategy builder with institutional-grade backtesting. Build automated DeFi strategies using a 3D block-building interface, backtest against real historical data from The Graph, and execute on Ethereum Sepolia testnet.

## Features (In Development)

### Phase 1: Foundation ✅
- 3D visualization engine (Three.js + React Three Fiber)
- TypeScript type system for DeFi protocols
- Web3 service layer structure
- The Graph subgraph integration setup

### Phase 2: Web3 Core (Next)
- MetaMask wallet connection
- Sepolia testnet integration
- Smart contract interaction (Uniswap, Aave, Compound)

### Phase 3: Subgraph Integration
- Historical pool data queries
- Lending rate history
- Real-time protocol state

### Phase 4: Block Builder UI
- Drag-and-drop DeFi blocks
- Protocol-specific parameters
- Visual strategy composition

### Phase 5: Backtesting Engine
- Subgraph data replay
- Slippage/gas/fee modeling
- Performance metrics calculation

### Phase 6: Live Execution
- Transaction signing and submission
- Real testnet execution
- Transaction history tracking

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **3D:** Three.js, React Three Fiber, @react-three/drei
- **Web3:** ethers.js v6
- **Data:** The Graph (Apollo Client, GraphQL)
- **Protocols:** Uniswap V3, Aave V3, Compound V3 (Sepolia testnet)

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## Implementation Plan

See [docs/plans/2025-12-28-defi-transformation-design.md](docs/plans/2025-12-28-defi-transformation-design.md) for the complete transformation design.

## License

MIT
```

**Step 2: Verify formatting**

Run: `cat README.md | head -20`
Expected: Clean markdown formatting

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README for DeFi platform

Replace stock trading description with DeFi focus
List development phases and features
Document tech stack (ethers.js, The Graph)
Add architecture reference"
```

---

## Task 7: Clean Up Stock Trading Code

**Files:**
- Remove: `src/services/marketDataService.ts`
- Remove: `src/services/orderSimulator.ts`
- Remove: `src/services/indicators.ts`
- Modify: `src/constants.ts` (mark for replacement)
- Keep: `src/services/backtestEngine.ts` (will be rewritten)
- Keep: `src/services/executionEngine.ts` (will be rewritten)
- Keep: `src/services/strategyValidator.ts` (will be rewritten)
- Keep: `src/services/persistenceService.ts`

**Step 1: Remove stock-specific services**

Run: `rm src/services/marketDataService.ts src/services/orderSimulator.ts src/services/indicators.ts`
Expected: Files deleted

**Step 2: Mark constants for replacement**

Add comment to top of `src/constants.ts`:

```typescript
/**
 * LEGACY STOCK TRADING CONSTANTS
 * TODO: Replace with DeFi protocol blocks in Phase 4
 *
 * Current blocks are placeholders from stock trading platform.
 * Will be replaced with: UNISWAP_SWAP, AAVE_SUPPLY, CREATE_LP_POSITION, etc.
 */
```

**Step 3: Verify build still works**

Run: `npm run build`
Expected: Build might show warnings but should complete

**Step 4: Commit**

```bash
git add .
git commit -m "refactor: remove stock trading services

Delete stock-specific code:
- marketDataService (Alpha Vantage integration)
- orderSimulator (stock order fills)
- indicators (RSI, MACD for stocks)

Mark constants.ts for replacement with DeFi blocks

Keep backtesting/execution/validation services for rewrite"
```

---

## Task 8: Create Placeholder DeFi Constants

**Files:**
- Create: `src/constants/defi-blocks.ts`
- Modify: `src/constants.ts` (import from new file)

**Step 1: Create DeFi block definitions**

Create `src/constants/defi-blocks.ts`:

```typescript
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
```

**Step 2: Update main constants file**

Prepend to `src/constants.ts`:

```typescript
/**
 * DeFi Protocol Constants
 */
export * from './constants/defi-blocks';

// LEGACY STOCK CONSTANTS BELOW - Will be removed
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build warning about unused exports, but successful

**Step 4: Commit**

```bash
git add src/constants/
git commit -m "feat: add DeFi block constant definitions

Create placeholder DeFi blocks:
- DEX: UNISWAP_SWAP, PRICE_CHECK
- Lending: AAVE_SUPPLY, AAVE_BORROW
- LP: CREATE_LP_POSITION
- Logic: IF_CONDITION, STOP_LOSS

Add protocol color scheme (Uniswap pink, Aave purple, Compound green)

Ready for Phase 4 UI implementation"
```

---

## Task 9: Verify Phase 1 Complete

**Files:**
- All created files
- Build output

**Step 1: Run full build**

Run: `npm run build`
Expected: Successful build with code splitting

**Step 2: Check file structure**

Run: `tree -L 3 src/ -I node_modules`
Expected output:
```
src/
├── components/
│   ├── three/
│   │   └── ThreeScene.tsx
│   └── visualizations/
│       ├── EquityCurve3D.tsx
│       └── PortfolioChart3D.tsx
├── services/
│   ├── web3/
│   │   ├── walletService.ts
│   │   ├── contractService.ts
│   │   └── errorHandler.ts
│   └── subgraph/
│       ├── client.ts
│       ├── queries.ts
│       ├── uniswapService.ts
│       └── aaveService.ts
├── types/
│   ├── defi.ts
│   ├── position.ts
│   ├── subgraph.ts
│   └── strategy.ts
└── constants/
    └── defi-blocks.ts
```

**Step 3: Verify dependencies installed**

Run: `npm list ethers @apollo/client graphql`
Expected: All packages listed

**Step 4: Check git status**

Run: `git log --oneline -10`
Expected: See all Phase 1 commits

**Step 5: Final verification commit**

```bash
git add .
git commit -m "chore: Phase 1 Foundation complete ✅

Summary:
- ✅ Web3 dependencies installed (ethers.js, Apollo Client)
- ✅ DeFi TypeScript types defined (protocols, positions, strategies)
- ✅ Service structure created (web3, subgraph placeholders)
- ✅ 3D visualization engine preserved
- ✅ DeFi block constants defined
- ✅ Stock trading code removed
- ✅ Documentation updated (README, ARCHITECTURE)

Build: Successful
Dependencies: ethers@6.13.0, @apollo/client, graphql
3D Components: ThreeScene, EquityCurve3D, PortfolioChart3D preserved

Next Phase: Phase 2 - Web3 Core (wallet connection, Sepolia)"
```

---

## Success Criteria

Phase 1 is complete when:

- ✅ `npm run build` succeeds with no TypeScript errors
- ✅ ethers.js v6 and Apollo Client installed
- ✅ All DeFi types defined in `src/types/`
- ✅ Web3 service structure created (placeholders OK)
- ✅ Subgraph service structure created (placeholders OK)
- ✅ 3D visualization components intact (ThreeScene, visualizations)
- ✅ DeFi block constants defined
- ✅ Stock trading services removed
- ✅ README and architecture docs updated
- ✅ All changes committed to git

**Deliverable:** Foundation ready for Phase 2 wallet implementation

---

## Notes for Implementation

**DRY Principles:**
- Use barrel exports (`index.ts`) to simplify imports
- Centralize constants in `constants/defi-blocks.ts`
- Reuse 3D visualization components without modification

**YAGNI:**
- Services are placeholders (throw errors) - implement in later phases
- Only create types actually needed for Phase 1
- Don't implement features not in the design document

**Testing:**
- Build verification after each task
- No unit tests in Phase 1 (foundation only)
- Tests will be added in Phase 2+ when implementing functionality

**Commit Frequency:**
- Commit after each task (9 commits total)
- Use conventional commit format (`feat:`, `docs:`, `refactor:`)
- Include context in commit messages for portfolio reviewers
