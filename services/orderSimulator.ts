/**
 * Order Simulator Service
 *
 * Simulates realistic order fills during backtesting based on OHLC data.
 * Uses conservative fill logic to avoid overly optimistic backtest results.
 */

import { HistoricalBar, Order } from '../types';

export interface OrderFillResult {
  filled: boolean;
  fillPrice?: number;
  reason?: string;
}

/**
 * Simulate order fill for a single bar
 * @param order - The order to simulate
 * @param currentBar - Current price bar (OHLC)
 * @param previousBar - Previous price bar (for context)
 * @returns Fill result with filled status, price, and reason
 */
export function simulateOrderFill(
  order: Order,
  currentBar: HistoricalBar,
  previousBar?: HistoricalBar
): OrderFillResult {
  const { type, side, price: limitPrice, status } = order;

  // Skip if order already filled or cancelled
  if (status === 'FILLED' || status === 'CANCELLED') {
    return {
      filled: false,
      reason: `Order already ${status.toLowerCase()}`,
    };
  }

  // Market orders fill immediately at close price
  if (type === 'MARKET') {
    return {
      filled: true,
      fillPrice: currentBar.close,
      reason: 'Market order filled at close price',
    };
  }

  // Limit orders require price to reach limit
  if (type === 'LIMIT') {
    if (!limitPrice) {
      return {
        filled: false,
        reason: 'Limit order missing price',
      };
    }

    if (side === 'BUY') {
      // Limit buy fills if price drops to or below limit
      if (currentBar.low <= limitPrice) {
        // Conservative: fill at limit price (not necessarily at low)
        return {
          filled: true,
          fillPrice: limitPrice,
          reason: `Limit buy filled: low ${currentBar.low.toFixed(2)} <= ${limitPrice.toFixed(2)}`,
        };
      }
    } else {
      // Limit sell fills if price rises to or above limit
      if (currentBar.high >= limitPrice) {
        // Conservative: fill at limit price (not necessarily at high)
        return {
          filled: true,
          fillPrice: limitPrice,
          reason: `Limit sell filled: high ${currentBar.high.toFixed(2)} >= ${limitPrice.toFixed(2)}`,
        };
      }
    }

    return {
      filled: false,
      reason: `Limit ${side.toLowerCase()} not reached: price ${side === 'BUY' ? currentBar.low : currentBar.high} vs limit ${limitPrice}`,
    };
  }

  // Stop orders (stop loss) trigger when price hits stop
  if (type === 'STOP') {
    if (!limitPrice) {
      return {
        filled: false,
        reason: 'Stop order missing price',
      };
    }

    if (side === 'SELL') {
      // Stop loss (sell stop) triggers when price drops to or below stop
      if (currentBar.low <= limitPrice) {
        // Conservative: assume slippage, fill slightly below stop
        const slippage = limitPrice * 0.001; // 0.1% slippage
        const fillPrice = Math.max(limitPrice - slippage, currentBar.low);
        return {
          filled: true,
          fillPrice,
          reason: `Stop loss triggered: low ${currentBar.low.toFixed(2)} <= ${limitPrice.toFixed(2)}`,
        };
      }
    } else {
      // Stop buy (buy stop) triggers when price rises to or above stop
      if (currentBar.high >= limitPrice) {
        // Conservative: assume slippage, fill slightly above stop
        const slippage = limitPrice * 0.001; // 0.1% slippage
        const fillPrice = Math.min(limitPrice + slippage, currentBar.high);
        return {
          filled: true,
          fillPrice,
          reason: `Stop buy triggered: high ${currentBar.high.toFixed(2)} >= ${limitPrice.toFixed(2)}`,
        };
      }
    }

    return {
      filled: false,
      reason: `Stop ${side.toLowerCase()} not triggered: price ${side === 'SELL' ? currentBar.low : currentBar.high} vs stop ${limitPrice}`,
    };
  }

  // Stop limit orders (more complex)
  if (type === 'STOP_LIMIT') {
    if (!limitPrice) {
      return {
        filled: false,
        reason: 'Stop limit order missing price',
      };
    }

    // For simplicity, treat stop limit like stop in Phase 2
    // In Phase 3, we can add separate stop and limit prices
    if (side === 'SELL') {
      if (currentBar.low <= limitPrice) {
        const fillPrice = limitPrice;
        return {
          filled: true,
          fillPrice,
          reason: `Stop limit sell triggered: low ${currentBar.low.toFixed(2)} <= ${limitPrice.toFixed(2)}`,
        };
      }
    } else {
      if (currentBar.high >= limitPrice) {
        const fillPrice = limitPrice;
        return {
          filled: true,
          fillPrice,
          reason: `Stop limit buy triggered: high ${currentBar.high.toFixed(2)} >= ${limitPrice.toFixed(2)}`,
        };
      }
    }

    return {
      filled: false,
      reason: `Stop limit ${side.toLowerCase()} not triggered`,
    };
  }

  return {
    filled: false,
    reason: `Unknown order type: ${type}`,
  };
}

/**
 * Check if an order would fill at market open (gap scenario)
 * @param order - The order to check
 * @param currentBar - Current price bar
 * @param previousBar - Previous price bar
 * @returns True if order fills on gap, false otherwise
 */
export function checkGapFill(
  order: Order,
  currentBar: HistoricalBar,
  previousBar: HistoricalBar
): boolean {
  const { type, side, price: limitPrice } = order;

  if (type === 'MARKET') return true; // Market orders always fill

  if (!limitPrice) return false;

  // Check for gap up or gap down
  const gapUp = currentBar.open > previousBar.close;
  const gapDown = currentBar.open < previousBar.close;

  if (type === 'LIMIT') {
    if (side === 'BUY' && gapDown) {
      // Gap down might fill limit buy
      return currentBar.open <= limitPrice;
    }
    if (side === 'SELL' && gapUp) {
      // Gap up might fill limit sell
      return currentBar.open >= limitPrice;
    }
  }

  if (type === 'STOP' || type === 'STOP_LIMIT') {
    if (side === 'SELL' && gapDown) {
      // Gap down might trigger stop loss
      return currentBar.open <= limitPrice;
    }
    if (side === 'BUY' && gapUp) {
      // Gap up might trigger stop buy
      return currentBar.open >= limitPrice;
    }
  }

  return false;
}

/**
 * Calculate fill price for gap scenario
 * @param order - The order
 * @param currentBar - Current price bar
 * @returns Fill price for gap fill
 */
export function getGapFillPrice(
  order: Order,
  currentBar: HistoricalBar
): number {
  const { type, side, price: limitPrice } = order;

  if (type === 'MARKET') {
    return currentBar.open; // Market orders fill at open in gap
  }

  if (!limitPrice) {
    return currentBar.open;
  }

  if (type === 'LIMIT') {
    // Limit orders fill at limit price (or better if gap is larger)
    if (side === 'BUY') {
      return Math.min(limitPrice, currentBar.open);
    } else {
      return Math.max(limitPrice, currentBar.open);
    }
  }

  if (type === 'STOP' || type === 'STOP_LIMIT') {
    // Stop orders fill at open (market order after trigger)
    // Apply slippage for realism
    const slippage = currentBar.open * 0.001;
    if (side === 'SELL') {
      return currentBar.open - slippage;
    } else {
      return currentBar.open + slippage;
    }
  }

  return currentBar.open;
}

/**
 * Estimate slippage for market orders based on volatility
 * @param currentBar - Current price bar
 * @param orderSize - Order size in shares
 * @param averageVolume - Average daily volume
 * @returns Estimated slippage as decimal (e.g., 0.001 = 0.1%)
 */
export function estimateSlippage(
  currentBar: HistoricalBar,
  orderSize: number,
  averageVolume: number
): number {
  // Calculate order size as % of volume
  const volumePercentage = orderSize / averageVolume;

  // Calculate intraday volatility
  const volatility = (currentBar.high - currentBar.low) / currentBar.close;

  // Base slippage (0.05% for small orders)
  let slippage = 0.0005;

  // Add slippage for large orders
  if (volumePercentage > 0.01) {
    slippage += volumePercentage * 0.01; // 1% slippage per 1% of volume
  }

  // Add slippage for volatile markets
  if (volatility > 0.02) {
    slippage += volatility * 0.1; // Scale with volatility
  }

  // Cap at 1% max slippage
  return Math.min(slippage, 0.01);
}
