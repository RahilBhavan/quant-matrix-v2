# Quant Matrix DeFi Transformation Design

**Date:** 2025-12-28
**Goal:** Transform Quant Matrix into a DeFi-centric platform for crypto company internship applications
**Approach:** Clean rebuild (new repository) with copied 3D visualization engine

---

## 1. Project Architecture & Structure

**New Repository:** `quant-matrix-defi`

**Core Philosophy:** Visual DeFi strategy builder with institutional-grade backtesting. Users drag protocol blocks (Uniswap swap, Aave supply, LP positions) onto a 3D spine, connect them with logic, backtest against real subgraph data, then execute on Sepolia testnet.

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite
- **3D:** Three.js + React Three Fiber + @react-three/drei
- **Web3:** ethers.js v6 (wallet connection, contract calls, transaction signing)
- **Data:** The Graph Protocol (subgraph queries for Uniswap V3, Aave V3, Compound V3)
- **Styling:** Tailwind CSS (minimalist black/white/neon cyan aesthetic)

**File Structure:**
```
quant-matrix-defi/
├── src/
│   ├── components/
│   │   ├── three/ (COPY - ThreeScene, visualizations)
│   │   ├── blocks/ (NEW - DeFi protocol blocks)
│   │   ├── dashboard/ (NEW - position management)
│   │   └── core/ (COPY - Workspace, HUD, Spine)
│   ├── services/
│   │   ├── web3/ (NEW - ethers, wallet, contracts)
│   │   ├── subgraph/ (NEW - The Graph queries)
│   │   ├── protocols/ (NEW - Uniswap/Aave/Compound logic)
│   │   └── backtest/ (NEW - subgraph replay engine)
│   ├── types/ (NEW - DeFi-specific types)
│   └── hooks/ (COPY choreography + NEW Web3 hooks)
```

**Two Main Pages:**
1. **Strategy Builder** (`/`) - Visual block builder + 3D workspace
2. **Dashboard** (`/dashboard`) - Live positions, protocol stats, wallet management

---

## 2. DeFi Protocol Blocks

**Block Categories:**

**1. DEX Trading Blocks** (Uniswap V3, Curve)
- `UNISWAP_SWAP` - Execute token swap with slippage protection
- `PRICE_CHECK` - Get pool price/liquidity before action
- `ARBITRAGE_DETECTOR` - Compare prices across DEXs
- `MEV_PROTECTION` - Flashbots RPC integration (advanced)

**2. Lending Blocks** (Aave V3, Compound V3)
- `AAVE_SUPPLY` - Supply collateral, earn yield
- `AAVE_BORROW` - Borrow against collateral
- `REPAY_DEBT` - Repay loan
- `HEALTH_FACTOR_CHECK` - Monitor liquidation risk

**3. LP Management Blocks** (Uniswap V3)
- `CREATE_LP_POSITION` - Mint concentrated liquidity position
- `ADJUST_RANGE` - Rebalance LP range
- `COLLECT_FEES` - Claim earned fees
- `IL_CALCULATOR` - Calculate impermanent loss

**4. Logic & Risk Blocks**
- `IF_CONDITION` - Conditional execution (if APY > 5%, then...)
- `GAS_CHECKER` - Only execute if gas < threshold
- `STOP_LOSS` - Exit position if loss exceeds %
- `POSITION_SIZE` - Calculate optimal position size

**Block Structure:**
```typescript
interface DeFiBlock {
  id: string;
  type: 'UNISWAP_SWAP' | 'AAVE_SUPPLY' | ...;
  protocol: 'Uniswap' | 'Aave' | 'Compound';
  params: {
    tokenIn?: string;      // e.g., "USDC"
    tokenOut?: string;     // e.g., "WETH"
    amount?: number;
    slippage?: number;     // %
    // Protocol-specific params...
  };
  position: [number, number, number]; // 3D spine position
}
```

**Visual Design:**
- **Color coding**: Uniswap = Pink (#FF007A), Aave = Purple (#B6509E), Compound = Green (#00D395)
- **Icons**: Each block shows protocol logo
- **Connectors**: Curved lines with animated flow particles

---

## 3. Web3 Integration & Wallet Connection

**Wallet Connection Flow:**

User clicks "CONNECT_WALLET" in HUD → MetaMask popup → Sign connection → Switch to Sepolia testnet → Display address + ETH balance

**Core Web3 Service** (`services/web3/walletService.ts`):
```typescript
export class WalletService {
  private provider: ethers.BrowserProvider | null;
  private signer: ethers.Signer | null;

  async connect(): Promise<string> {
    // Request MetaMask connection
    // Switch to Sepolia (chainId: 11155111)
    // Return connected address
  }

  async switchToSepolia(): Promise<void> {
    // Auto-switch or prompt user to add Sepolia
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    // Sign and broadcast transaction
  }

  watchBalance(address: string, callback: (balance: bigint) => void) {
    // Real-time balance updates
  }
}
```

**Contract Interaction** (`services/web3/contractService.ts`):
```typescript
export class ContractService {
  // Pre-configured Sepolia contract addresses
  private contracts = {
    uniswapRouter: '0x...',    // Uniswap V3 SwapRouter
    aavePool: '0x...',         // Aave V3 Pool
    compoundComet: '0x...',    // Compound V3 Comet
  };

  async executeSwap(params: SwapParams): Promise<TransactionReceipt> {
    const router = new ethers.Contract(this.contracts.uniswapRouter, ABI, signer);
    const tx = await router.exactInputSingle({...});
    return await tx.wait();
  }
}
```

**HUD Integration:**
- Top-right corner: Wallet address (truncated: `0x1234...5678`), ETH balance, Sepolia network indicator
- Connect button changes to neon cyan when connected
- Disconnected state shows red warning

---

## 4. The Graph Integration & Historical Data

**Subgraph Queries** (`services/subgraph/subgraphService.ts`):

**Why The Graph:** Query historical protocol state (pool reserves, borrow rates, LP positions) across thousands of blocks efficiently. Essential for backtesting.

**Subgraphs Used:**
- **Uniswap V3**: Pool prices, liquidity, swap volume, fee tiers
- **Aave V3**: Supply/borrow rates, utilization, liquidations
- **Compound V3**: Supply APY, borrow APY, collateral factors

**Example Queries:**

```typescript
// Get Uniswap pool state over time range
const POOL_HISTORY_QUERY = gql`
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

// Get Aave lending rates over time
const AAVE_RATES_QUERY = gql`
  query AaveRates($asset: String!, $startTime: Int!) {
    reserves(where: { underlyingAsset: $asset }) {
      id
      supplyRate
      variableBorrowRate
      utilizationRate
      reserveHistory(where: { timestamp_gte: $startTime }) {
        timestamp
        liquidityRate
        variableBorrowRate
      }
    }
  }
`;
```

**Backtesting Data Flow:**
1. User sets date range (e.g., "Last 3 months")
2. Fetch subgraph data for all protocols in strategy
3. Replay strategy block-by-block at each timestamp
4. Calculate P&L, gas costs, slippage, IL
5. Render 3D equity curve with results

**Caching Strategy:**
- Cache subgraph responses in memory (5 min TTL)
- LocalStorage for frequently used pools
- Show loading states during queries

---

## 5. Backtesting Engine - Subgraph Replay

**Core Concept:** Replay strategy execution at each historical timestamp using real protocol state from The Graph.

**Backtest Execution Flow** (`services/backtest/backtestEngine.ts`):

```typescript
interface BacktestConfig {
  blocks: DeFiBlock[];
  startDate: Date;
  endDate: Date;
  initialCapital: number;    // Starting USDC
  rebalanceInterval: number; // Execute strategy every N hours
}

interface BacktestResult {
  equityCurve: EquityPoint[];
  trades: Trade[];
  metrics: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalGasSpent: number;
    totalFeesSpent: number;
    impermanentLoss?: number; // For LP strategies
  };
}
```

**Replay Algorithm:**

```typescript
async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  // 1. Fetch historical data for all protocols in blocks
  const poolData = await fetchPoolHistory(config.blocks);
  const rateData = await fetchRateHistory(config.blocks);

  // 2. Initialize portfolio state
  let portfolio = {
    usdc: config.initialCapital,
    tokens: new Map<string, number>(),
    positions: [], // Aave supplies, LP positions
  };

  const equityCurve: EquityPoint[] = [];
  const trades: Trade[] = [];

  // 3. Step through time at rebalance intervals
  for (let timestamp = config.startDate; timestamp <= config.endDate; timestamp += interval) {

    // 4. Build execution context with historical state
    const context = {
      poolPrices: poolData.getPricesAt(timestamp),
      aaveRates: rateData.getRatesAt(timestamp),
      gasPrice: 20, // gwei (simplified)
    };

    // 5. Execute strategy blocks
    const actions = executeStrategy(config.blocks, context, portfolio);

    // 6. Simulate actions (swaps, supplies, borrows)
    for (const action of actions) {
      if (action.type === 'SWAP') {
        const result = simulateSwap(action, context.poolPrices);
        portfolio.usdc -= action.amountIn;
        portfolio.tokens.set(action.tokenOut, result.amountOut);
        trades.push({ timestamp, ...action, gasSpent: estimateGas('swap') });
      }
      // ... handle SUPPLY, BORROW, LP actions
    }

    // 7. Calculate portfolio value in USDC
    const totalValue = calculatePortfolioValue(portfolio, context.poolPrices);
    equityCurve.push({ date: timestamp, equity: totalValue });
  }

  // 8. Calculate metrics
  return { equityCurve, trades, metrics: calculateMetrics(equityCurve, trades) };
}
```

**Key Features:**
- **Slippage modeling**: Use pool liquidity to estimate realistic slippage
- **Gas estimation**: Track cumulative gas costs
- **Fee calculation**: Protocol fees (Uniswap 0.3%, Aave variable)
- **IL tracking**: For LP positions, calculate IL vs HODL

**Visualization:**
- 3D equity curve (reuse EquityCurve3D) with trade markers
- Overlay gas costs as red zones
- Show IL separately for LP strategies

---

## 6. Dashboard - Live Position Management

**Dashboard Page** (`/dashboard`) - Monitor and manage active DeFi positions.

**Layout Structure:**

```
┌─────────────────────────────────────────────────┐
│ HUD: Wallet Connected | Portfolio Value | APY   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Protocol Overview Cards]                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Uniswap  │ │  Aave    │ │ Compound │       │
│  │ 2 pools  │ │ $5.2k    │ │ $3.1k    │       │
│  │ $12.3k   │ │ 4.2% APY │ │ 5.1% APY │       │
│  └──────────┘ └──────────┘ └──────────┘       │
│                                                 │
│  [Active Positions Table]                       │
│  Protocol  | Position    | Value  | P&L | Action│
│  ─────────────────────────────────────────────  │
│  Uniswap   | WETH/USDC LP| $8.2k  | +12%| Manage│
│  Aave      | Supply USDC | $5.2k  | +4% | Manage│
│  Compound  | Borrow ETH  | -$2.1k | -3% | Manage│
│                                                 │
│  [3D Portfolio Visualization]                   │
│  (Reuse PortfolioChart3D - bars per protocol)  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Real-Time Data Updates** (`services/web3/positionTracker.ts`):

```typescript
class PositionTracker {
  async getActivePositions(walletAddress: string): Promise<Position[]> {
    const positions: Position[] = [];

    // Query Uniswap LP positions
    const lpPositions = await this.getUniswapPositions(walletAddress);

    // Query Aave supplies/borrows
    const aavePositions = await this.getAavePositions(walletAddress);

    // Query Compound positions
    const compoundPositions = await this.getCompoundPositions(walletAddress);

    return [...lpPositions, ...aavePositions, ...compoundPositions];
  }

  async getLiveAPY(protocol: 'Aave' | 'Compound', asset: string): Promise<number> {
    // Fetch current supply/borrow rates from contracts
    const poolContract = new ethers.Contract(poolAddress, ABI, provider);
    const reserveData = await poolContract.getReserveData(assetAddress);
    return Number(reserveData.currentLiquidityRate) / 1e27; // Convert ray to %
  }

  watchPositions(walletAddress: string, callback: (positions: Position[]) => void) {
    // Poll every 30 seconds for position updates
    setInterval(() => {
      this.getActivePositions(walletAddress).then(callback);
    }, 30000);
  }
}
```

**Position Actions:**
- **Manage button** → Opens modal with protocol-specific actions:
  - Uniswap LP: Adjust range, collect fees, close position
  - Aave: Add collateral, repay, withdraw
  - Compound: Supply more, borrow more, repay

**3D Visualization:**
- Reuse `PortfolioChart3D` component
- Bars colored by protocol (Uniswap pink, Aave purple, Compound green)
- Height = position value
- Hover shows detailed stats

---

## 7. Type Definitions & Data Models

**Core DeFi Types** (`src/types/defi.ts`):

```typescript
// Protocol Types
export type Protocol = 'Uniswap' | 'Aave' | 'Compound';
export type Asset = 'ETH' | 'WETH' | 'USDC' | 'USDT' | 'DAI' | 'WBTC';

// Block Types
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
  connections: string[]; // IDs of connected blocks
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
  feeTier?: 500 | 3000 | 10000; // Uniswap V3 fee tiers (0.05%, 0.3%, 1%)
  tickLower?: number;
  tickUpper?: number;

  // Logic params
  condition?: string; // e.g., "APY > 5"
  threshold?: number;
}
```

**Position Types** (`src/types/position.ts`):

```typescript
export interface BasePosition {
  id: string;
  protocol: Protocol;
  walletAddress: string;
  value: number; // USD value
  pnl: number;   // P&L %
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
  impermanentLoss: number; // %
}

export interface AavePosition extends BasePosition {
  protocol: 'Aave';
  type: 'SUPPLY' | 'BORROW';
  asset: Asset;
  amount: number;
  apy: number;
  healthFactor?: number; // For borrow positions
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

**Subgraph Response Types** (`src/types/subgraph.ts`):

```typescript
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
  liquidityRate: string;    // Supply APY
  variableBorrowRate: string;
  utilizationRate: string;
}

export interface SubgraphResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}
```

**Strategy Types** (`src/types/strategy.ts`):

```typescript
export interface Strategy {
  id: string;
  name: string;
  description: string;
  blocks: DeFiBlock[];
  createdAt: Date;
  backtestResults?: BacktestResult;
}

export interface BacktestResult {
  equityCurve: EquityPoint[];
  trades: Trade[];
  metrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  totalReturn: number;      // %
  sharpeRatio: number;
  maxDrawdown: number;      // %
  totalGasSpent: number;    // ETH
  totalFeesSpent: number;   // USD
  winRate?: number;         // % of profitable trades
  impermanentLoss?: number; // For LP strategies
}
```

---

## 8. Error Handling & Edge Cases

**Web3 Error Handling** (`services/web3/errorHandler.ts`):

```typescript
export class Web3ErrorHandler {
  handleTransactionError(error: any): UserFriendlyError {
    // MetaMask user rejection
    if (error.code === 4001) {
      return {
        title: 'Transaction Rejected',
        message: 'You cancelled the transaction in MetaMask.',
        recoverable: true
      };
    }

    // Insufficient gas
    if (error.code === -32000 || error.message.includes('insufficient funds')) {
      return {
        title: 'Insufficient ETH for Gas',
        message: 'You need more ETH to pay for transaction gas.',
        recoverable: true,
        action: 'Get testnet ETH from Sepolia faucet'
      };
    }

    // Slippage exceeded
    if (error.message.includes('Too little received')) {
      return {
        title: 'Slippage Exceeded',
        message: 'Price moved unfavorably. Increase slippage tolerance.',
        recoverable: true
      };
    }

    // RPC error
    if (error.code === -32603) {
      return {
        title: 'Network Error',
        message: 'RPC provider failed. Retrying...',
        recoverable: true,
        shouldRetry: true
      };
    }

    // Generic fallback
    return {
      title: 'Transaction Failed',
      message: error.message || 'Unknown error occurred',
      recoverable: false
    };
  }
}
```

**Protocol-Specific Errors:**

```typescript
// Aave health factor check
async function checkHealthFactor(userAddress: string): Promise<void> {
  const pool = new ethers.Contract(AAVE_POOL, ABI, provider);
  const userData = await pool.getUserAccountData(userAddress);
  const healthFactor = Number(userData.healthFactor) / 1e18;

  if (healthFactor < 1.05) {
    throw new Error(
      `CRITICAL: Health factor is ${healthFactor.toFixed(2)}. ` +
      `Position will be liquidated if it drops below 1.0. ` +
      `Add more collateral or repay debt immediately.`
    );
  }
}

// Uniswap liquidity check
async function checkPoolLiquidity(poolAddress: string, swapAmount: bigint): Promise<void> {
  const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
  const liquidity = await pool.liquidity();

  // Warn if swap is >5% of pool liquidity (high slippage risk)
  if (swapAmount > liquidity / 20n) {
    console.warn(
      `Warning: Swap amount is ${(Number(swapAmount * 100n / liquidity))}% ` +
      `of pool liquidity. Expect high slippage.`
    );
  }
}
```

**Edge Cases:**

**1. Network Disconnection:**
```typescript
// Auto-retry failed subgraph queries
async function fetchWithRetry<T>(
  query: string,
  variables: any,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await graphClient.query({ query, variables });
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * (i + 1)); // Exponential backoff
    }
  }
}
```

**2. Empty Backtest Data:**
```typescript
// Handle pools with no historical data
if (poolDayDatas.length === 0) {
  return {
    error: true,
    message: `No historical data found for this pool. ` +
             `It may be newly created or not indexed by The Graph.`,
    fallback: 'Try a different date range or use a more established pool.'
  };
}
```

**3. Wallet Network Mismatch:**
```typescript
// Detect and prompt network switch
const chainId = await provider.getNetwork().then(n => n.chainId);
if (chainId !== 11155111n) { // Sepolia
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0xaa36a7' }], // Sepolia in hex
  });
}
```

**UI Error Display:**
- Toast notifications for recoverable errors (3s auto-dismiss)
- Modal dialogs for critical errors (health factor, insufficient funds)
- Inline warnings in block parameters (gas too high, slippage warning)

---

## 9. Implementation Roadmap

**Phase 1: Foundation & Setup (Week 1)**
- Create new repo `quant-matrix-defi`
- Copy 3D visualization components from current project (ThreeScene, visualizations, choreography)
- Set up Vite + React + TypeScript + Tailwind
- Install Web3 dependencies: `ethers`, `@apollo/client`, `graphql`
- Create base file structure
- **Deliverable:** Dev server running with copied 3D components working

**Phase 2: Web3 Core (Week 2)**
- Implement `WalletService` (MetaMask connection, Sepolia switch)
- Implement `ContractService` (Uniswap/Aave/Compound contract ABIs)
- Update HUD with wallet connection UI
- Test wallet connection flow
- **Deliverable:** Can connect MetaMask, display wallet address/balance, switch to Sepolia

**Phase 3: Subgraph Integration (Week 3)**
- Set up Apollo Client for The Graph
- Implement Uniswap V3 subgraph queries (pool history, prices)
- Implement Aave V3 subgraph queries (rates, reserves)
- Add caching layer
- Test data fetching for sample pools
- **Deliverable:** Can query and display historical pool data

**Phase 4: Block Builder UI (Week 4)**
- Create DeFi block components (UNISWAP_SWAP, AAVE_SUPPLY, etc.)
- Update `constants.ts` with DeFi blocks
- Implement protocol color coding (Uniswap pink, Aave purple, Compound green)
- Add block parameter editor for DeFi-specific params
- Update Spine for DeFi blocks
- **Deliverable:** Can drag DeFi blocks onto spine, edit parameters

**Phase 5: Backtesting Engine (Week 5)**
- Implement subgraph replay algorithm
- Add slippage/gas/fee modeling
- Calculate equity curve from historical execution
- Integrate with EquityCurve3D visualization
- **Deliverable:** Can backtest simple swap strategy, see 3D equity curve

**Phase 6: Live Execution (Week 6)**
- Implement transaction signing and submission
- Add transaction status tracking
- Test swap execution on Sepolia
- Add transaction history display
- **Deliverable:** Can execute real Uniswap swap on testnet

**Phase 7: Dashboard (Week 7)**
- Create dashboard page route
- Implement position tracking (query user's LP/Aave/Compound positions)
- Add protocol overview cards
- Integrate PortfolioChart3D
- Add real-time APY updates
- **Deliverable:** Dashboard shows live positions with 3D visualization

**Phase 8: Polish & Documentation (Week 8)**
- Add loading states, animations
- Write comprehensive README with demo video/screenshots
- Add inline code documentation
- Performance optimization (lazy loading, caching)
- Cross-browser testing
- **Deliverable:** Production-ready portfolio project with full documentation

**Total Timeline:** 8 weeks for complete DeFi platform

**MVP Milestone** (End of Week 6): Can build strategies, backtest, and execute on Sepolia - sufficient for internship interviews.

---

## Success Criteria

**Technical:**
- ✓ MetaMask wallet connection working
- ✓ Can query The Graph for Uniswap/Aave/Compound data
- ✓ Visual block builder with DeFi blocks functional
- ✓ Backtesting produces realistic results
- ✓ Can execute transactions on Sepolia testnet
- ✓ Dashboard displays live positions
- ✓ 3D visualizations working (equity curve, portfolio chart)

**Portfolio Quality:**
- ✓ Professional README with screenshots/demo video
- ✓ Clean, documented codebase
- ✓ Demonstrates Web3 knowledge (ethers.js, smart contracts)
- ✓ Demonstrates data engineering (The Graph, caching)
- ✓ Demonstrates frontend skills (React, Three.js, TypeScript)
- ✓ Production-ready error handling
- ✓ Deployed live (Vercel/Netlify)

**Internship Relevance:**
- ✓ Shows deep DeFi protocol understanding
- ✓ Multi-protocol integration (Uniswap, Aave, Compound)
- ✓ Unique differentiator (3D visual strategy builder)
- ✓ Real testnet execution (not just mock data)
- ✓ Institutional-grade backtesting

---

## Next Steps

1. Create `quant-matrix-defi` repository
2. Set up git worktree for isolated development
3. Write detailed implementation plan for Phase 1
4. Begin copying 3D visualization components
