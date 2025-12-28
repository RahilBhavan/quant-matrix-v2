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
