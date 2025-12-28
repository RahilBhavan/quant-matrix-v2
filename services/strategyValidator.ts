/**
 * Strategy Validator Service
 *
 * Validates trading strategies before execution or backtesting.
 * Checks structure, parameters, logic, and risk management.
 */

import { LegoBlock, ValidationResult, ValidationError, Protocol } from '../types';

/**
 * Validate a trading strategy
 * @param blocks - Array of strategy blocks
 * @returns Validation result with errors and warnings
 */
export function validateStrategy(blocks: LegoBlock[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (blocks.length === 0) {
    errors.push({
      blockId: 'N/A',
      blockType: 'N/A',
      message: 'Strategy has no blocks',
      severity: 'error',
    });
    return { valid: false, errors, warnings };
  }

  // 1. Structure Validation
  validateStructure(blocks, errors, warnings);

  // 2. Parameter Validation
  validateParameters(blocks, errors, warnings);

  // 3. Logic Validation
  validateLogic(blocks, errors, warnings);

  // 4. Risk Management Validation
  validateRiskManagement(blocks, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate strategy structure (entry/exit blocks)
 */
function validateStructure(
  blocks: LegoBlock[],
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const hasEntry = blocks.some(b => b.protocol === Protocol.ENTRY);
  const hasExit = blocks.some(b => b.protocol === Protocol.EXIT);

  if (!hasEntry) {
    errors.push({
      blockId: 'N/A',
      blockType: 'STRUCTURE',
      message: 'Strategy missing entry block (MARKET_BUY or BUY_ON_DIP)',
      severity: 'error',
    });
  }

  if (!hasExit) {
    warnings.push({
      blockId: 'N/A',
      blockType: 'STRUCTURE',
      message: 'Strategy missing explicit exit block (MARKET_SELL or TAKE_PROFIT)',
      severity: 'warning',
    });
  }

  // Check for duplicate block types that should be unique
  const blockTypes = blocks.map(b => b.type);
  const duplicateTypes = blockTypes.filter(
    (type, index) => blockTypes.indexOf(type) !== index
  );

  if (duplicateTypes.length > 0) {
    warnings.push({
      blockId: 'N/A',
      blockType: 'STRUCTURE',
      message: `Duplicate block types detected: ${Array.from(new Set(duplicateTypes)).join(', ')}`,
      severity: 'warning',
    });
  }
}

/**
 * Validate block parameters
 */
function validateParameters(
  blocks: LegoBlock[],
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  blocks.forEach((block) => {
    const { id, type, params } = block;

    if (!params) {
      warnings.push({
        blockId: id,
        blockType: type,
        message: 'Block has no parameters',
        severity: 'warning',
      });
      return;
    }

    // Validate based on block type
    switch (type) {
      case 'MARKET_BUY':
      case 'BUY_ON_DIP':
        if (!params.ticker) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Entry block missing ticker symbol',
            severity: 'error',
          });
        }
        if (!params.quantity || params.quantity <= 0) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Entry block missing or invalid quantity',
            severity: 'error',
          });
        }
        if (type === 'BUY_ON_DIP' && !params.threshold) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'BUY_ON_DIP missing threshold parameter',
            severity: 'error',
          });
        }
        break;

      case 'LIMIT_BUY':
        if (!params.ticker) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Limit buy missing ticker symbol',
            severity: 'error',
          });
        }
        if (!params.quantity || params.quantity <= 0) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Limit buy missing or invalid quantity',
            severity: 'error',
          });
        }
        if (!params.price || params.price <= 0) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Limit buy missing or invalid limit price',
            severity: 'error',
          });
        }
        break;

      case 'MARKET_SELL':
      case 'TAKE_PROFIT':
        if (type === 'TAKE_PROFIT' && !params.percentage) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Take profit missing percentage parameter',
            severity: 'error',
          });
        }
        break;

      case 'STOP_LOSS':
        if (!params.percentage || params.percentage <= 0) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Stop loss missing or invalid percentage',
            severity: 'error',
          });
        }
        if (params.percentage && params.percentage > 50) {
          warnings.push({
            blockId: id,
            blockType: type,
            message: `Stop loss percentage very high (${params.percentage}%), consider reducing`,
            severity: 'warning',
          });
        }
        break;

      case 'RSI_SIGNAL':
        if (!params.period || params.period <= 0) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'RSI signal missing or invalid period',
            severity: 'error',
          });
        }
        if (!params.threshold) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'RSI signal missing threshold (overbought/oversold level)',
            severity: 'error',
          });
        }
        if (params.threshold && (params.threshold < 0 || params.threshold > 100)) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'RSI threshold must be between 0 and 100',
            severity: 'error',
          });
        }
        break;

      case 'MACD_CROSS':
      case 'MA_CROSS':
        if (!params.period) {
          warnings.push({
            blockId: id,
            blockType: type,
            message: `${type} missing period parameter, using defaults`,
            severity: 'warning',
          });
        }
        break;

      case 'POSITION_SIZE':
        if (!params.percentage || params.percentage <= 0) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Position size missing or invalid percentage',
            severity: 'error',
          });
        }
        if (params.percentage && params.percentage > 100) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Position size cannot exceed 100% of portfolio',
            severity: 'error',
          });
        }
        if (params.percentage && params.percentage > 50) {
          warnings.push({
            blockId: id,
            blockType: type,
            message: `Position size very large (${params.percentage}%), consider diversification`,
            severity: 'warning',
          });
        }
        break;

      case 'MAX_DRAWDOWN':
        if (!params.percentage || params.percentage <= 0) {
          errors.push({
            blockId: id,
            blockType: type,
            message: 'Max drawdown missing or invalid percentage',
            severity: 'error',
          });
        }
        if (params.percentage && params.percentage > 50) {
          warnings.push({
            blockId: id,
            blockType: type,
            message: `Max drawdown very high (${params.percentage}%), consider tighter risk control`,
            severity: 'warning',
          });
        }
        break;
    }
  });
}

/**
 * Validate strategy logic (order of operations)
 */
function validateLogic(
  blocks: LegoBlock[],
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const entryBlocks = blocks.filter(b => b.protocol === Protocol.ENTRY || b.protocol === Protocol.ORDERS);
  const exitBlocks = blocks.filter(b => b.protocol === Protocol.EXIT);

  // Check for sell before buy
  const firstEntry = blocks.findIndex(b => b.protocol === Protocol.ENTRY || b.protocol === Protocol.ORDERS);
  const firstExit = blocks.findIndex(b => b.protocol === Protocol.EXIT);

  if (firstExit !== -1 && firstEntry !== -1 && firstExit < firstEntry) {
    warnings.push({
      blockId: blocks[firstExit].id,
      blockType: blocks[firstExit].type,
      message: 'Exit block appears before entry block - verify strategy logic',
      severity: 'warning',
    });
  }

  // Check for multiple conflicting exits
  const takeProfitCount = exitBlocks.filter(b => b.type === 'TAKE_PROFIT').length;
  const marketSellCount = exitBlocks.filter(b => b.type === 'MARKET_SELL').length;

  if (takeProfitCount > 1) {
    warnings.push({
      blockId: 'N/A',
      blockType: 'TAKE_PROFIT',
      message: 'Multiple take profit blocks detected - only one will execute',
      severity: 'warning',
    });
  }

  if (marketSellCount > 1) {
    warnings.push({
      blockId: 'N/A',
      blockType: 'MARKET_SELL',
      message: 'Multiple market sell blocks detected - verify strategy logic',
      severity: 'warning',
    });
  }

  // Check for conflicting ticker symbols
  const tickers = blocks
    .filter(b => b.params?.ticker)
    .map(b => b.params!.ticker!)
    .filter((v, i, a) => a.indexOf(v) === i);

  if (tickers.length > 1) {
    warnings.push({
      blockId: 'N/A',
      blockType: 'LOGIC',
      message: `Multiple ticker symbols detected: ${tickers.join(', ')} - strategy should focus on one symbol`,
      severity: 'warning',
    });
  }
}

/**
 * Validate risk management
 */
function validateRiskManagement(
  blocks: LegoBlock[],
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const hasStopLoss = blocks.some(b => b.type === 'STOP_LOSS');
  const hasMaxDrawdown = blocks.some(b => b.type === 'MAX_DRAWDOWN');
  const hasPositionSize = blocks.some(b => b.type === 'POSITION_SIZE');

  // Warn if no stop loss
  if (!hasStopLoss) {
    warnings.push({
      blockId: 'N/A',
      blockType: 'RISK',
      message: 'No stop loss block - consider adding for risk management',
      severity: 'warning',
    });
  }

  // Warn if no max drawdown
  if (!hasMaxDrawdown) {
    warnings.push({
      blockId: 'N/A',
      blockType: 'RISK',
      message: 'No max drawdown limit - consider adding for portfolio protection',
      severity: 'warning',
    });
  }

  // Check position sizing
  if (!hasPositionSize) {
    warnings.push({
      blockId: 'N/A',
      blockType: 'RISK',
      message: 'No position sizing block - using default 100% allocation',
      severity: 'warning',
    });
  }

  // Check for over-concentration
  const positionSizeBlock = blocks.find(b => b.type === 'POSITION_SIZE');
  if (positionSizeBlock?.params?.percentage && positionSizeBlock.params.percentage > 50) {
    warnings.push({
      blockId: positionSizeBlock.id,
      blockType: 'POSITION_SIZE',
      message: 'Position size exceeds 50% of portfolio - high concentration risk',
      severity: 'warning',
    });
  }
}

/**
 * Get a human-readable summary of validation results
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return 'Strategy is valid with no warnings';
  }

  const parts: string[] = [];

  if (!result.valid) {
    parts.push(`${result.errors.length} error${result.errors.length !== 1 ? 's' : ''} found`);
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''} found`);
  }

  return parts.join(', ');
}
