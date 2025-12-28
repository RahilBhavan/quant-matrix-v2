# Quant Matrix - Paper Trading Platform Design

**Date:** 2025-12-27
**Version:** 1.0
**Status:** Approved

## Executive Summary

Quant Matrix is a visual paper trading platform for stocks and ETFs. Users compose trading strategies using a block-based interface, backtest them against historical data, and execute them in a simulated environment. A Gemini AI assistant provides comprehensive support throughout the trading lifecycle.

## Core Architecture & Concept

### Three-Layer Architecture

**1. Presentation Layer (React + Three.js)**
- Workspace with block-based strategy builder (existing Spine component)
- 3D data visualizations (holographic charts, market depth cubes)
- Real-time portfolio dashboard
- AI chat interface

**2. Application Layer (TypeScript)**
- Strategy engine (validates, backtests, executes blocks)
- Portfolio manager (tracks positions, P&L, orders)
- Market data aggregator (Alpha Vantage/Yahoo Finance)
- Gemini AI service (expanded from existing)

**3. Data Layer (Browser storage)**
- LocalStorage for strategies, portfolios, settings
- IndexedDB for historical price data cache
- Session state management (React Context/Zustand)

### Block System Evolution

**Current State:** Generic DeFi protocols (Aave, Lido)

**New State:** Stock trading blocks with categories:
- **Entry/Exit:** BUY, SELL, LIMIT, STOP_LOSS
- **Indicators:** RSI, MACD, Moving Averages, Bollinger Bands
- **Logic:** If/Then conditions, time triggers, portfolio allocation
- **Risk Management:** Position sizing, max drawdown limits

Each block has parameters, validation rules, and execution logic. The existing "Lego composition" metaphor translates perfectly to trading logic.

## Core Features & User Workflows

### 1. Strategy Builder (Enhanced Workspace)

**Visual Block Composition:**
- Drag blocks from ActionRibbon onto Spine
- Real-time validation with type-safe connections
- Save/load strategies as templates

**Block Categories:**
- Entry/Exit: Market Buy, Limit Order, Stop Loss, Take Profit
- Indicators: RSI, MACD, Moving Averages, Bollinger Bands
- Logic: If/Then conditions, time triggers, portfolio % allocation
- Risk Management: Position sizing, max drawdown limits

### 2. Backtesting Engine

**Features:**
- Date range selection, initial capital configuration
- Runs blocks against historical data from Alpha Vantage
- Visual results: 3D equity curve, drawdown chart, trade markers
- Performance metrics: total return, Sharpe ratio, win rate, max drawdown
- Trade-by-trade breakdown table

### 3. Paper Trading Execution

**Capabilities:**
- Execute button broadcasts strategy to simulated environment
- Live portfolio tracking in HUD (positions, P&L, buying power)
- Order book view (pending/filled/cancelled)
- Real-time(ish) price updates (15-min delayed from free API)
- Automatic position updates when strategy conditions trigger

### 4. AI Assistant Integration

**Chat Panel:**
- Slides in from right (similar to audit overlay)
- Persistent message history per session
- Context buttons: "Analyze Strategy", "Explain Last Backtest", "Market Summary"

**AI Capabilities:**
- Context-aware: knows current strategy, positions, market conditions
- Suggests: block combinations, parameter tweaks, risk adjustments
- Explains: backtest failures, indicator meanings, market analysis
- Natural language to blocks: "Add stop loss at 5%" generates block

## UI/UX Design & Visual Components

### Workspace Layout

**Maintains Current Aesthetic:**
- Center Stage: Spine component with strategy blocks (vertical flow)
- Four-Corner HUD:
  - Top-left: Portfolio value, daily P&L
  - Top-right: Active strategy name, status indicator
  - Bottom-left: Market status, data refresh timer
  - Bottom-right: Quick actions (Save, Clear, Settings)
- Action Ribbon (bottom): Expanded categories - Entry, Exit, Indicators, Logic
- Side Panels (slide-in overlays):
  - Left: Strategy library, templates
  - Right: AI chat, audit reports, backtest results

### 3D Data Visualizations (Three.js)

**Visualization Types:**
- Market Globe: Rotating wireframe sphere showing sector performance as colored nodes
- Price Charts: Holographic candlestick charts floating in 3D space
- Portfolio Cube: 3D bar chart showing position weights
- Depth Visualization: Order book as layered planes (buy/sell pressure)

**Design Principles:**
- Wireframe aesthetic throughout
- Neon cyan accents (#00FF9D)
- Black background
- Consistent with existing ThreeBackground component

### Block Design Evolution

**Current:** Simple cards with label/value

**New Design Elements:**
- Icon on left (BUY = arrow up, RSI = wave chart)
- Block type label (uppercase mono)
- Editable parameters (inline inputs, appear on hover)
- Connection ports (visual dots top/bottom)
- Status indicator (idle/active/triggered)
- Drag handle (subtle grip pattern)

### Animation & Interactions

- Block connections: Neon line draws between ports when valid
- Strategy execution: Blocks pulse sequentially as they execute
- Data updates: Smooth number counter animations
- Transitions: Consistent 300-500ms easing (existing pattern)

## Data Management & Technical Implementation

### Market Data Strategy

**Primary Source:** Alpha Vantage
- Free tier: 25 requests/day, 5 requests/minute
- Fallback: Yahoo Finance API (unofficial library)

**Data Types:**
- Real-time quotes (15-min delayed on free tier)
- Historical daily OHLCV (open, high, low, close, volume)
- Company fundamentals (optional: market cap, P/E ratio)

**Caching Strategy:**
- Store historical data in IndexedDB (persist across sessions)
- Cache daily bars for 24 hours
- Real-time quotes refresh every 5 minutes during market hours

### Portfolio & Order Management

**Paper Trading Account:**
- Starting balance: $100,000 (configurable)
- Tracks: cash, positions, buying power, total equity
- Order types: market, limit, stop, stop-limit
- Commission model: $0 (modern standard) or configurable flat fee

**State Management:**
- React Context or Zustand for global state
- LocalStorage for persistence (strategies, settings, portfolio history)
- Session-only data: current prices, active orders

### Strategy Execution Engine

**Block Interpreter:**
- Processes strategy as DAG (directed acyclic graph)

**Execution Modes:**
- Backtest: Runs through historical data, simulates fills
- Paper trade: Monitors live prices, triggers blocks when conditions met
- Event loop: Checks strategy conditions every market data refresh

**Order Simulation:**
- Market orders: Fill at current price instantly
- Limit orders: Fill when price crosses threshold
- Realistic slippage model (optional)

### Performance Considerations

- Debounce price updates to avoid excessive re-renders
- Virtualize large trade history tables
- Web Workers for heavy backtest calculations
- Memoize expensive Three.js computations

## AI Integration & User Experience Flows

### Gemini AI Capabilities (Enhanced)

**1. Strategy Assistant**
- Analyzes block composition, suggests improvements
- "Your strategy lacks downside protection" → suggests stop-loss block
- Explains parameters: "RSI below 30 typically indicates oversold conditions"
- Natural language → blocks: User types intent, AI generates block configuration

**2. Market Analyst**
- Summarizes market conditions from latest data
- "Tech sector down 2% today, high volatility detected"
- Correlates strategy performance with market events
- News sentiment analysis (if integrated with news API)

**3. Backtest Interpreter**
- Explains why strategy succeeded/failed
- "70% of losses occurred during Fed rate announcements"
- Suggests parameter optimizations
- Compares against benchmarks (S&P 500)

**4. Trading Copilot**
- Monitors active paper positions
- Alerts: "AAPL position up 15%, consider taking profit"
- Risk warnings: "Portfolio concentration: 60% in tech"
- Execution suggestions: "Market volatile, use limit orders"

### Key User Flows

**New User Journey:**
1. Landing page → Hold "INITIALIZE" button
2. Workspace appears empty with tutorial overlay
3. "Build your first strategy" - guided 3-block example (Buy AAPL, Hold 30 days, Sell)
4. Run backtest → See results → AI explains performance
5. Modify strategy → Execute paper trade
6. Dashboard shows simulated position

**Strategy Creation Flow:**
1. Open strategy library or start blank
2. Add entry block (e.g., "Buy when RSI < 30")
3. Add risk block (e.g., "Stop loss at -5%")
4. Add exit block (e.g., "Take profit at +10%")
5. Validate (Spine shows green connections)
6. Name and save strategy
7. Run backtest or execute live

**Backtesting Flow:**
1. Click "Backtest" (new HUD button)
2. Modal appears: Select date range, capital, ticker
3. Progress bar (processing historical data)
4. Results panel slides in: Equity curve (3D), metrics table
5. AI summary at bottom
6. Options: Modify strategy, Execute live, Save results

## Error Handling & Edge Cases

### API Rate Limiting

**Problem:** Alpha Vantage = 25 calls/day, 5/minute

**Solutions:**
- Request queue with rate limiter
- Show "Rate limit reached" message with countdown timer
- Cache aggressively (don't re-fetch same data)
- Fallback to Yahoo Finance if Alpha Vantage exhausted
- Visual indicator: "Data freshness: 2 hours old"

### Network Failures

- Offline mode: Use cached data, disable live features
- Retry logic: Exponential backoff (1s, 2s, 4s, fail)
- User feedback: Toast notifications ("Connection lost, using cached data")
- Graceful degradation: Show last known prices with timestamp

### Invalid Strategy Blocks

- Validation rules: Entry block required, logical order enforced
- Visual feedback: Red border on invalid blocks, error tooltip
- Cannot execute if invalid (Execute button disabled)
- AI assistance: "Your strategy needs an exit condition"

### Market Hours

- US markets closed: Show "Market Closed" in HUD
- Weekend/holidays: Detect and pause live updates
- Paper trading continues (uses last close price)
- Backtest unaffected (works 24/7)

### Data Quality Issues

- Missing price data: Interpolate or skip that period, warn user
- Extreme values: Detect outliers (>50% move), flag as suspicious
- Symbol not found: "AAPL1234 not recognized, did you mean AAPL?"

### Portfolio Edge Cases

- Insufficient buying power: Block order, show notification
- Partial fills: Not realistic for paper trading, always fill 100%
- Dividends/splits: Ignore initially, note as future enhancement
- Short selling: Disabled initially (complexity), add later if needed

### Browser Compatibility

- LocalStorage full: Warn user, offer to clear old data
- IndexedDB unsupported: Fallback to in-memory cache only
- WebGL unavailable: Disable 3D visualizations, show 2D fallback charts

## Testing Strategy

### Testing Layers

**1. Unit Tests**
- Strategy validation logic (block connection rules)
- Portfolio calculations (P&L, position sizing, buying power)
- Order simulation engine (fills, pricing logic)
- Data transformations (API responses → internal format)
- Block interpreter (strategy execution logic)

**2. Integration Tests**
- Market data API mocking (avoid rate limits in tests)
- Backtest engine with known historical data
- Portfolio state updates through order lifecycle
- LocalStorage/IndexedDB persistence
- Gemini AI service (mock responses)

**3. Visual/Component Tests**
- Block drag-and-drop interactions
- Three.js rendering (snapshot tests)
- Animation sequences
- Responsive layout breakpoints
- HUD component updates

**4. User Acceptance Scenarios**
- Complete strategy creation → backtest → execute flow
- Error recovery (network failure mid-backtest)
- Multi-strategy management
- Portfolio performance over simulated week

## Development Phases

### Phase 1: Foundation (Week 1-2)
- Refactor existing blocks system for stock trading
- Build new block types (BUY, SELL, indicators)
- Implement Alpha Vantage integration
- Basic portfolio state management
- Enhanced AI service for strategy analysis

### Phase 2: Core Trading (Week 2-3)
- Backtesting engine with historical data
- Order simulation and fill logic
- Portfolio dashboard in HUD
- Strategy validation and execution engine
- LocalStorage persistence

### Phase 3: Visualization (Week 3-4)
- 3D price charts (Three.js candlesticks)
- Backtest results visualization
- Portfolio performance graphs
- Enhanced block UI with parameters
- Smooth animations throughout

### Phase 4: AI & Polish (Week 4-5)
- Full AI chat integration
- Natural language → blocks
- Strategy suggestions and optimization
- Error handling and edge cases
- Performance optimization
- User onboarding flow

## Design Principles

### Maintained from Current Version
- Minimalist black/white high-contrast UI
- Wireframe 3D geometric shapes
- Clean typography mix (sans-serif + monospace)
- HUD-style four-corner layout
- Neon cyan accents (#00FF9D)
- Smooth Framer Motion animations
- Block-based "Lego" composition system

### New Additions
- Professional trading interface with futuristic elements
- 3D holographic data visualizations
- Comprehensive AI assistance throughout
- Paper trading focus (no real money risk)
- Educational and accessible to beginners

## Future Enhancements (Post-Launch)

- Real broker integration (Alpaca, Interactive Brokers)
- Cryptocurrency support
- Social features (share strategies, leaderboards)
- Advanced indicators and custom block creation
- Mobile responsive design
- Portfolio analytics dashboard
- Strategy marketplace
- Advanced risk management tools
- Multi-timeframe analysis
- Options trading simulation
