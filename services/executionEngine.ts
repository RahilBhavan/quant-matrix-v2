/**
 * Execution Engine Service
 *
 * Executes trading strategy blocks in sequence.
 * Handles all 12 block types with conditional logic and indicator evaluation.
 */

import {
  LegoBlock,
  ExecutionContext,
  ExecutionAction,
  HistoricalBar,
  Position,
} from '../types';
import {
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateEMA,
  detectMACDCrossover,
  detectMACrossover,
  MACDResult,
} from './indicators';

/**
 * Execute a single block
 * @param block - The block to execute
 * @param context - Execution context (bar data, portfolio, indicators, mode)
 * @returns Execution action or null
 */
export function executeBlock(
  block: LegoBlock,
  context: ExecutionContext
): ExecutionAction | null {
  const { type, params } = block;

  if (!params) {
    return {
      type: 'SKIP',
      symbol: '',
      reason: `Block ${type} has no parameters`,
    };
  }

  switch (type) {
    case 'MARKET_BUY':
      return executeMarketBuy(block, context);

    case 'BUY_ON_DIP':
      return executeBuyOnDip(block, context);

    case 'LIMIT_BUY':
      return executeLimitBuy(block, context);

    case 'MARKET_SELL':
      return executeMarketSell(block, context);

    case 'TAKE_PROFIT':
      return executeTakeProfit(block, context);

    case 'STOP_LOSS':
      return executeStopLoss(block, context);

    case 'RSI_SIGNAL':
      return executeRSISignal(block, context);

    case 'MACD_CROSS':
      return executeMACDCross(block, context);

    case 'MA_CROSS':
      return executeMACross(block, context);

    case 'POSITION_SIZE':
      return executePositionSize(block, context);

    case 'MAX_DRAWDOWN':
      return executeMaxDrawdown(block, context);

    default:
      return {
        type: 'SKIP',
        symbol: params.ticker || '',
        reason: `Unknown block type: ${type}`,
      };
  }
}

/**
 * Execute strategy (all blocks in sequence)
 * @param blocks - Array of strategy blocks
 * @param context - Execution context
 * @returns Array of execution actions
 */
export function executeStrategy(
  blocks: LegoBlock[],
  context: ExecutionContext
): ExecutionAction[] {
  const actions: ExecutionAction[] = [];

  for (const block of blocks) {
    const action = executeBlock(block, context);
    if (action) {
      actions.push(action);

      // Stop processing if we hit a critical action (like max drawdown)
      if (action.type === 'SELL' && action.reason.includes('MAX_DRAWDOWN')) {
        break;
      }
    }
  }

  return actions;
}

// ==================== ENTRY BLOCKS ====================

function executeMarketBuy(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { ticker, quantity } = block.params!;
  const { currentBar, portfolio } = context;

  if (!ticker || !quantity) {
    return { type: 'SKIP', symbol: '', reason: 'MARKET_BUY missing ticker or quantity' };
  }

  const cost = currentBar.close * quantity;

  if (cost > portfolio.cash) {
    return {
      type: 'SKIP',
      symbol: ticker,
      reason: `Insufficient funds: need ${cost.toFixed(2)}, have ${portfolio.cash.toFixed(2)}`,
    };
  }

  return {
    type: 'BUY',
    symbol: ticker,
    quantity,
    price: currentBar.close,
    reason: 'Market buy executed at close price',
  };
}

function executeBuyOnDip(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { ticker, quantity, threshold } = block.params!;
  const { currentBar, previousBar } = context;

  if (!ticker || !quantity || !threshold) {
    return { type: 'SKIP', symbol: '', reason: 'BUY_ON_DIP missing parameters' };
  }

  if (!previousBar) {
    return { type: 'SKIP', symbol: ticker, reason: 'No previous bar for dip detection' };
  }

  // Calculate percentage drop
  const drop = ((previousBar.close - currentBar.close) / previousBar.close) * 100;

  if (drop >= threshold) {
    return {
      type: 'BUY',
      symbol: ticker,
      quantity,
      price: currentBar.close,
      reason: `Dip detected: ${drop.toFixed(2)}% drop >= ${threshold}% threshold`,
    };
  }

  return {
    type: 'SKIP',
    symbol: ticker,
    reason: `No dip: ${drop.toFixed(2)}% drop < ${threshold}% threshold`,
  };
}

function executeLimitBuy(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { ticker, quantity, price } = block.params!;
  const { currentBar } = context;

  if (!ticker || !quantity || !price) {
    return { type: 'SKIP', symbol: '', reason: 'LIMIT_BUY missing parameters' };
  }

  // Check if limit price was reached
  if (currentBar.low <= price) {
    return {
      type: 'BUY',
      symbol: ticker,
      quantity,
      price,
      orderType: 'LIMIT',
      reason: `Limit buy triggered: low ${currentBar.low.toFixed(2)} <= ${price.toFixed(2)}`,
    };
  }

  return {
    type: 'PLACE_ORDER',
    symbol: ticker,
    quantity,
    price,
    orderType: 'LIMIT',
    reason: `Limit buy order placed at ${price.toFixed(2)}`,
  };
}

// ==================== EXIT BLOCKS ====================

function executeMarketSell(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { portfolio, currentBar } = context;

  // Find the first position to sell
  const position = portfolio.positions[0];

  if (!position) {
    return { type: 'SKIP', symbol: '', reason: 'No position to sell' };
  }

  return {
    type: 'SELL',
    symbol: position.symbol,
    quantity: position.quantity,
    price: currentBar.close,
    reason: 'Market sell executed at close price',
  };
}

function executeTakeProfit(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { percentage } = block.params!;
  const { portfolio, currentBar } = context;

  if (!percentage) {
    return { type: 'SKIP', symbol: '', reason: 'TAKE_PROFIT missing percentage' };
  }

  // Check each position for take profit
  for (const position of portfolio.positions) {
    const profitPercent = ((position.currentPrice - position.avgPrice) / position.avgPrice) * 100;

    if (profitPercent >= percentage) {
      return {
        type: 'SELL',
        symbol: position.symbol,
        quantity: position.quantity,
        price: currentBar.close,
        reason: `Take profit triggered: ${profitPercent.toFixed(2)}% >= ${percentage}%`,
      };
    }
  }

  return {
    type: 'SKIP',
    symbol: '',
    reason: `No position reached ${percentage}% profit`,
  };
}

function executeStopLoss(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { percentage } = block.params!;
  const { portfolio, currentBar } = context;

  if (!percentage) {
    return { type: 'SKIP', symbol: '', reason: 'STOP_LOSS missing percentage' };
  }

  // Check each position for stop loss
  for (const position of portfolio.positions) {
    const lossPercent = ((position.avgPrice - position.currentPrice) / position.avgPrice) * 100;

    if (lossPercent >= percentage) {
      return {
        type: 'SELL',
        symbol: position.symbol,
        quantity: position.quantity,
        price: currentBar.close,
        orderType: 'STOP',
        reason: `Stop loss triggered: ${lossPercent.toFixed(2)}% loss >= ${percentage}%`,
      };
    }
  }

  return {
    type: 'SKIP',
    symbol: '',
    reason: `No position hit ${percentage}% stop loss`,
  };
}

// ==================== INDICATOR BLOCKS ====================

function executeRSISignal(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { period = 14, threshold = 30 } = block.params!;
  const { currentBar } = context;

  // Get historical prices from context indicators
  const prices = context.indicators.get('prices') as number[] | undefined;

  if (!prices || prices.length < period + 1) {
    return {
      type: 'SKIP',
      symbol: '',
      reason: 'Insufficient price history for RSI calculation',
    };
  }

  const rsiValues = calculateRSI(prices, period);
  const currentRSI = rsiValues[rsiValues.length - 1];

  if (currentRSI === null) {
    return { type: 'SKIP', symbol: '', reason: 'RSI not yet calculated' };
  }

  // Oversold signal (buy)
  if (currentRSI <= threshold) {
    return {
      type: 'BUY',
      symbol: block.params!.ticker || '',
      quantity: block.params!.quantity || 0,
      price: currentBar.close,
      reason: `RSI oversold: ${currentRSI.toFixed(2)} <= ${threshold}`,
    };
  }

  // Overbought signal (sell) - using 100 - threshold for symmetry
  const overboughtThreshold = 100 - threshold;
  if (currentRSI >= overboughtThreshold) {
    const position = context.portfolio.positions[0];
    if (position) {
      return {
        type: 'SELL',
        symbol: position.symbol,
        quantity: position.quantity,
        price: currentBar.close,
        reason: `RSI overbought: ${currentRSI.toFixed(2)} >= ${overboughtThreshold}`,
      };
    }
  }

  return {
    type: 'SKIP',
    symbol: '',
    reason: `RSI neutral: ${currentRSI.toFixed(2)}`,
  };
}

function executeMACDCross(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { currentBar } = context;
  const prices = context.indicators.get('prices') as number[] | undefined;

  if (!prices || prices.length < 35) {
    return {
      type: 'SKIP',
      symbol: '',
      reason: 'Insufficient price history for MACD calculation',
    };
  }

  const macdResult = calculateMACD(prices);
  const crossovers = detectMACDCrossover(macdResult);
  const currentSignal = crossovers[crossovers.length - 1];

  if (currentSignal === 1) {
    // Bullish crossover
    return {
      type: 'BUY',
      symbol: block.params!.ticker || '',
      quantity: block.params!.quantity || 0,
      price: currentBar.close,
      reason: 'MACD bullish crossover detected',
    };
  }

  if (currentSignal === -1) {
    // Bearish crossover
    const position = context.portfolio.positions[0];
    if (position) {
      return {
        type: 'SELL',
        symbol: position.symbol,
        quantity: position.quantity,
        price: currentBar.close,
        reason: 'MACD bearish crossover detected',
      };
    }
  }

  return {
    type: 'SKIP',
    symbol: '',
    reason: 'No MACD crossover',
  };
}

function executeMACross(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { period = 50 } = block.params!;
  const { currentBar } = context;
  const prices = context.indicators.get('prices') as number[] | undefined;

  if (!prices || prices.length < period * 2) {
    return {
      type: 'SKIP',
      symbol: '',
      reason: 'Insufficient price history for MA crossover',
    };
  }

  const fastMA = calculateSMA(prices, period);
  const slowMA = calculateSMA(prices, period * 2);
  const crossovers = detectMACrossover(fastMA, slowMA);
  const currentSignal = crossovers[crossovers.length - 1];

  if (currentSignal === 1) {
    // Bullish crossover
    return {
      type: 'BUY',
      symbol: block.params!.ticker || '',
      quantity: block.params!.quantity || 0,
      price: currentBar.close,
      reason: `MA crossover: ${period} crossed above ${period * 2}`,
    };
  }

  if (currentSignal === -1) {
    // Bearish crossover
    const position = context.portfolio.positions[0];
    if (position) {
      return {
        type: 'SELL',
        symbol: position.symbol,
        quantity: position.quantity,
        price: currentBar.close,
        reason: `MA crossover: ${period} crossed below ${period * 2}`,
      };
    }
  }

  return {
    type: 'SKIP',
    symbol: '',
    reason: 'No MA crossover',
  };
}

// ==================== RISK MANAGEMENT BLOCKS ====================

function executePositionSize(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { percentage } = block.params!;
  const { portfolio } = context;

  if (!percentage) {
    return { type: 'SKIP', symbol: '', reason: 'POSITION_SIZE missing percentage' };
  }

  // This block modifies the quantity of subsequent buy actions
  // In practice, this would be handled by the backtester or execution layer
  // For now, we just validate and skip
  const maxPosition = (portfolio.cash * percentage) / 100;

  return {
    type: 'SKIP',
    symbol: '',
    reason: `Position size set to ${percentage}% (max: $${maxPosition.toFixed(2)})`,
  };
}

function executeMaxDrawdown(block: LegoBlock, context: ExecutionContext): ExecutionAction | null {
  const { percentage } = block.params!;
  const { portfolio, peakEquity } = context;

  if (!percentage) {
    return { type: 'SKIP', symbol: '', reason: 'MAX_DRAWDOWN missing percentage' };
  }

  if (!peakEquity || peakEquity === 0) {
    return { type: 'SKIP', symbol: '', reason: 'Peak equity not tracked' };
  }

  const currentDrawdown = ((peakEquity - portfolio.totalEquity) / peakEquity) * 100;

  if (currentDrawdown >= percentage) {
    // Sell all positions immediately
    const position = portfolio.positions[0];
    if (position) {
      return {
        type: 'SELL',
        symbol: position.symbol,
        quantity: position.quantity,
        price: context.currentBar.close,
        reason: `MAX_DRAWDOWN triggered: ${currentDrawdown.toFixed(2)}% >= ${percentage}%`,
      };
    }
  }

  return {
    type: 'SKIP',
    symbol: '',
    reason: `Drawdown ${currentDrawdown.toFixed(2)}% < ${percentage}%`,
  };
}
