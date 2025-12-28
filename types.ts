export enum Protocol {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  ORDERS = 'ORDERS',
  INDICATORS = 'INDICATORS',
  LOGIC = 'LOGIC',
  RISK = 'RISK'
}

export interface BlockParams {
  ticker?: string;
  quantity?: number;
  price?: number;
  threshold?: number;
  period?: number;
  percentage?: number;
}

export interface LegoBlock {
  id: string;
  type: string;
  protocol: Protocol;
  label: string;
  description: string;
  color: string;
  params?: BlockParams;
}

export interface MarketData {
  marketStatus: 'OPEN' | 'CLOSED' | 'PRE' | 'POST';
  lastUpdate: Date;
  dataFreshness: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
  side: 'BUY' | 'SELL';
  quantity: number;
  price?: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED';
  createdAt: Date;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export type MatrixStatus = 'IDLE' | 'OPTIMAL' | 'ANALYZING' | 'EXECUTING' | 'CRITICAL';

// Phase 2: Backtesting and Execution Types

export interface HistoricalBar {
  date: Date | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  date: Date;
  blockType: string;
  pnl?: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}

export interface BacktestConfig {
  symbol: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  blocks: LegoBlock[];
}

export interface EquityPoint {
  date: Date | string;
  equity: number;
}

export interface BacktestResult {
  trades: Trade[];
  metrics: PerformanceMetrics;
  equityCurve: EquityPoint[];
  dailyReturns: number[];
}

export interface ExecutionContext {
  currentBar: HistoricalBar;
  previousBar?: HistoricalBar;
  portfolio: {
    cash: number;
    positions: Position[];
    totalEquity: number;
  };
  indicators: Map<string, any>;
  mode: 'backtest' | 'live';
  peakEquity?: number;
}

export interface ExecutionAction {
  type: 'BUY' | 'SELL' | 'PLACE_ORDER' | 'SKIP';
  symbol: string;
  quantity?: number;
  price?: number;
  orderType?: Order['type'];
  reason: string;
}

export interface ValidationError {
  blockId: string;
  blockType: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface SavedStrategy {
  id: string;
  name: string;
  blocks: LegoBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BacktestRecord {
  id: string;
  strategyId: string;
  config: BacktestConfig;
  result: BacktestResult;
  timestamp: Date;
}
