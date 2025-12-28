# Quant Matrix DeFi

**Visual DeFi strategy builder with institutional-grade backtesting.**

Build automated DeFi strategies using a 3D block-building interface, backtest against real historical data from The Graph, and execute on Ethereum Sepolia testnet.

![Status](https://img.shields.io/badge/status-production--ready-brightgreen)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Key Features

### ✅ Phase 1: Foundation
- 🎨 3D visualization engine (Three.js + React Three Fiber)
- 📘 Complete TypeScript type system for DeFi protocols
- 🏗️ Web3 service layer architecture
- 📊 The Graph subgraph integration

### ✅ Phase 2: Web3 Core
- 🦊 MetaMask wallet connection with auto-network switching
- ⚡ Sepolia testnet integration
- 🔗 Smart contract interaction (Uniswap V3, Aave V3)
- 💰 Real-time wallet balance and network display

### ✅ Phase 3: Subgraph Integration
- 📈 Historical pool data queries (Uniswap V3)
- 💸 Lending rate history (Aave V3)
- ⚙️ Real-time protocol state tracking
- 🚀 5-minute caching layer for performance

### ✅ Phase 4: Block Builder UI
- 🧱 12 DeFi blocks across 5 categories
- 🎨 Protocol-specific color coding
- 🏷️ Block metadata with icons and categories
- ⚙️ Parameter validation system

### ✅ Phase 5: Backtesting Engine
- 🔄 Subgraph replay algorithm
- 💰 Slippage, gas, and protocol fee modeling
- 📊 Performance metrics (Sharpe, drawdown, IL)
- 📉 Equity curve generation

### ✅ Phase 6: Live Execution
- ✍️ Transaction signing and submission
- 🌐 Real Sepolia testnet execution
- 📜 Transaction history tracking
- ⛽ Gas cost monitoring

### ✅ Phase 7: Dashboard
- 💼 Portfolio position tracking
- 📊 Protocol statistics aggregation
- 💵 Real-time USD valuation
- ❤️ Health factor monitoring

## 🛠️ Tech Stack

**Frontend Framework**
- React 18 with TypeScript 5.5
- Vite (build tool)
- Tailwind CSS (styling)

**3D Visualization**
- Three.js
- React Three Fiber
- @react-three/drei

**Web3 Integration**
- ethers.js v6.16.0
- MetaMask browser extension

**Data Layer**
- The Graph Protocol
- Apollo Client 4.0.11
- GraphQL 16.12.0

**DeFi Protocols (Sepolia)**
- Uniswap V3 (DEX trading & LP)
- Aave V3 (lending & borrowing)
- Compound V3 (future integration)

## 📦 DeFi Blocks

### DEX Trading (Uniswap)
- 🔄 **UNISWAP_SWAP** - Execute token swaps
- 💹 **PRICE_CHECK** - Get pool price & liquidity
- 💧 **CREATE_LP_POSITION** - Provide liquidity
- 💰 **COLLECT_FEES** - Claim trading fees

### Lending (Aave)
- 📥 **AAVE_SUPPLY** - Supply collateral for yield
- 📤 **AAVE_BORROW** - Borrow assets
- 💸 **REPAY_DEBT** - Repay loans
- ❤️ **HEALTH_FACTOR_CHECK** - Monitor liquidation risk

### Logic & Risk
- ❓ **IF_CONDITION** - Conditional execution
- ⛽ **GAS_CHECKER** - Gas price threshold
- 🛑 **STOP_LOSS** - Exit on loss threshold
- 📊 **POSITION_SIZE** - Calculate position size

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- MetaMask browser extension
- Sepolia testnet ETH ([faucet](https://sepoliafaucet.com/))

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd quant-matrix-defi

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## 🎮 Usage

### 1. Connect Wallet
Click "CONNECT_WALLET" in the top right corner. MetaMask will:
- Request account access
- Automatically switch to Sepolia testnet
- Display your address and ETH balance

### 2. Build Strategy
Drag DeFi blocks onto the 3D spine to compose your strategy. Each block has:
- Protocol color coding
- Parameter editor
- Connection points

### 3. Backtest Strategy
Configure backtest parameters:
- Date range
- Initial capital
- Rebalance interval

View results:
- 3D equity curve
- Performance metrics
- Trade history
- Gas & fee costs

### 4. Execute Live
Execute blocks on Sepolia testnet:
- Real smart contract calls
- Transaction confirmation
- Gas cost tracking
- Transaction history

### 5. Monitor Portfolio
Track your DeFi positions:
- Token balances
- Lending positions (Aave)
- LP positions (Uniswap)
- Protocol statistics

## 📊 Performance Metrics

The backtesting engine calculates:
- **Total Return** - Absolute and percentage
- **Sharpe Ratio** - Risk-adjusted returns (annualized)
- **Max Drawdown** - Largest peak-to-trough decline
- **Gas Costs** - Total ETH spent on gas
- **Protocol Fees** - Total fees paid to protocols
- **Impermanent Loss** - For LP strategies
- **Win Rate** - Percentage of profitable trades

## 🏗️ Architecture

```
src/
├── components/          # React components
│   ├── three/          # 3D visualization
│   └── visualizations/ # Charts & graphs
├── services/           # Business logic
│   ├── web3/          # Wallet & contracts
│   ├── subgraph/      # The Graph queries
│   ├── defiBacktestEngine.ts
│   ├── liveExecutionService.ts
│   └── positionTrackingService.ts
├── types/             # TypeScript definitions
├── constants/         # DeFi blocks & tokens
└── hooks/            # React hooks
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed architecture documentation.

## 🔐 Security

- **Testnet Only**: All transactions execute on Sepolia
- **No Private Keys**: Uses MetaMask for signing
- **User Approval**: Every transaction requires confirmation
- **Error Handling**: Comprehensive error messages
- **Health Checks**: Wallet connection & network validation

## 📝 Smart Contract Addresses (Sepolia)

```typescript
// Protocols
Uniswap V3 Router: 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E
Aave V3 Pool:      0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951

// Tokens
WETH:  0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
USDC:  0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
DAI:   0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
USDT:  0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0
```

## 🧪 Testing

The platform has been tested with:
- MetaMask wallet connection
- Network switching (Sepolia)
- Token swaps on Uniswap V3
- Aave supply/borrow operations
- Transaction history tracking
- Portfolio position queries

## 🗺️ Roadmap

**Phase 8: Polish & Documentation** ✅
- Comprehensive README
- Code documentation
- Architecture diagrams
- Usage examples

**Future Enhancements**
- Multi-chain support (mainnet, Arbitrum, Optimism)
- Additional protocols (Curve, Compound V3)
- Advanced strategies (flash loans, arbitrage)
- Social features (share strategies)
- Mobile responsive design

## 📚 Resources

- [Uniswap V3 Docs](https://docs.uniswap.org/contracts/v3/overview)
- [Aave V3 Docs](https://docs.aave.com/developers/v/2.0/)
- [The Graph Docs](https://thegraph.com/docs/)
- [ethers.js Docs](https://docs.ethers.org/)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with Claude Code
- Inspired by DeFi Saver and InstaDapp
- 3D visualization inspired by Quant Matrix original design
- Protocol integrations: Uniswap, Aave

---

**⚠️ Disclaimer**: This is a testnet demonstration project. Do not use with real funds on mainnet without thorough security audits.
