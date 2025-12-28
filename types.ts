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
