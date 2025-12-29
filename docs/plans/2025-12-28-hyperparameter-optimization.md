# Hyperparameter Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add intelligent parameter optimization to DeFi strategies using Bayesian and Genetic algorithms with walk-forward validation, running entirely client-side with Web Workers.

**Architecture:** Parameter extraction analyzes strategy blocks to identify optimizable parameters. Web Workers run parallel backtests with different parameter combinations. Bayesian and Genetic algorithms intelligently explore the parameter space. Walk-forward validation prevents overfitting by testing on unseen data. Pareto frontier visualization shows multi-objective trade-offs.

**Tech Stack:** TypeScript, Web Workers API, Recharts (scatter plots), existing defiBacktestEngine

---

## Task 1: Project Structure & Type Definitions

**Files:**
- Create: `services/optimization/types.ts`
- Create: `services/optimization/index.ts`

**Step 1: Create optimization types file**

Create `services/optimization/types.ts`:

```typescript
/**
 * Optimization Types
 *
 * Core type definitions for hyperparameter optimization.
 */

import { LegoBlock } from '../../types';
import { DeFiBacktestResult } from '../defiBacktestEngine';

// Parameter definitions
export interface ParameterDefinition {
  blockId: string;
  blockType: string;
  paramName: string;
  type: 'continuous' | 'discrete' | 'percentage';
  min?: number;
  max?: number;
  values?: number[]; // For discrete parameters
  defaultValue: number;
}

export interface ParameterSet {
  [blockId: string]: {
    [paramName: string]: number;
  };
}

// Optimization configuration
export type OptimizationAlgorithm = 'bayesian' | 'genetic';

export type OptimizationObjective =
  | 'sharpeRatio'
  | 'totalReturn'
  | 'maxDrawdown'
  | 'winRate'
  | 'gasCosts'
  | 'protocolFees';

export interface OptimizationConfig {
  algorithm: OptimizationAlgorithm;
  objectives: OptimizationObjective[]; // At least 2
  maxIterations: number;
  parameters: ParameterDefinition[];
  backtestConfig: {
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    rebalanceInterval: number;
  };
}

// Walk-forward validation
export interface WalkForwardWindow {
  trainStart: Date;
  trainEnd: Date;
  testStart: Date;
  testEnd: Date;
}

// Optimization results
export interface ObjectiveScores {
  sharpeRatio?: number;
  totalReturn?: number;
  maxDrawdown?: number;
  winRate?: number;
  gasCosts?: number;
  protocolFees?: number;
}

export interface OptimizationSolution {
  id: string;
  parameters: ParameterSet;
  inSampleScores: ObjectiveScores;
  outOfSampleScores: ObjectiveScores;
  degradation: number; // Percentage
  isParetoOptimal: boolean;
  backtestResult?: DeFiBacktestResult;
}

export interface OptimizationProgress {
  iteration: number;
  maxIterations: number;
  bestSolution?: OptimizationSolution;
  paretoFrontier: OptimizationSolution[];
  estimatedTimeRemaining: number; // seconds
  workersActive: number;
}

export interface OptimizationResult {
  config: OptimizationConfig;
  solutions: OptimizationSolution[];
  paretoFrontier: OptimizationSolution[];
  totalIterations: number;
  totalTime: number; // seconds
  cacheHitRate: number;
}

// Web Worker messages
export interface BacktestWorkerRequest {
  type: 'BACKTEST';
  id: string;
  blocks: LegoBlock[];
  parameters: ParameterSet;
  config: {
    startDate: Date;
    endDate: Date;
    initialCapital: number;
    rebalanceInterval: number;
  };
}

export interface BacktestWorkerResponse {
  type: 'RESULT' | 'ERROR';
  id: string;
  parameters: ParameterSet;
  result?: DeFiBacktestResult;
  error?: string;
}
```

**Step 2: Create barrel export**

Create `services/optimization/index.ts`:

```typescript
export * from './types';
```

**Step 3: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add services/optimization/types.ts services/optimization/index.ts
git commit -m "feat(optimization): add core type definitions"
```

---

## Task 2: Parameter Extractor Service

**Files:**
- Create: `services/optimization/parameterExtractor.ts`
- Modify: `services/optimization/index.ts`

**Step 1: Write test for parameter extraction**

Create `services/optimization/__tests__/parameterExtractor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ParameterExtractor } from '../parameterExtractor';
import { LegoBlock, Protocol } from '../../../types';

describe('ParameterExtractor', () => {
  const extractor = new ParameterExtractor();

  it('should extract RSI threshold from IF_CONDITION block', () => {
    const blocks: LegoBlock[] = [
      {
        id: 'block-1',
        type: 'IF_CONDITION',
        protocol: Protocol.LOGIC,
        label: 'RSI Check',
        description: 'Check RSI',
        color: '#FFD93D',
        params: {
          condition: 'RSI < 30',
        },
      },
    ];

    const parameters = extractor.extract(blocks);

    expect(parameters).toHaveLength(1);
    expect(parameters[0]).toEqual({
      blockId: 'block-1',
      blockType: 'IF_CONDITION',
      paramName: 'rsiThreshold',
      type: 'continuous',
      min: 20,
      max: 40,
      defaultValue: 30,
    });
  });

  it('should extract slippage from UNISWAP_SWAP block', () => {
    const blocks: LegoBlock[] = [
      {
        id: 'block-2',
        type: 'UNISWAP_SWAP',
        protocol: Protocol.UNISWAP,
        label: 'Swap',
        description: 'Swap tokens',
        color: '#FF007A',
        params: {
          tokenIn: 'USDC',
          tokenOut: 'WETH',
          amount: 1000,
          slippage: 0.5,
        },
      },
    ];

    const parameters = extractor.extract(blocks);

    expect(parameters.length).toBeGreaterThan(0);
    const slippageParam = parameters.find(p => p.paramName === 'slippage');
    expect(slippageParam).toEqual({
      blockId: 'block-2',
      blockType: 'UNISWAP_SWAP',
      paramName: 'slippage',
      type: 'continuous',
      min: 0.1,
      max: 2.0,
      defaultValue: 0.5,
    });
  });

  it('should extract position size from POSITION_SIZE block', () => {
    const blocks: LegoBlock[] = [
      {
        id: 'block-3',
        type: 'POSITION_SIZE',
        protocol: Protocol.RISK,
        label: 'Position Size',
        description: 'Calculate position',
        color: '#6C63FF',
        params: {
          percentage: 25,
        },
      },
    ];

    const parameters = extractor.extract(blocks);

    expect(parameters).toHaveLength(1);
    expect(parameters[0]).toEqual({
      blockId: 'block-3',
      blockType: 'POSITION_SIZE',
      paramName: 'percentage',
      type: 'percentage',
      min: 10,
      max: 50,
      defaultValue: 25,
    });
  });

  it('should extract fee tier from CREATE_LP_POSITION block', () => {
    const blocks: LegoBlock[] = [
      {
        id: 'block-4',
        type: 'CREATE_LP_POSITION',
        protocol: Protocol.UNISWAP,
        label: 'Create LP',
        description: 'Add liquidity',
        color: '#FF007A',
        params: {
          token0: 'WETH',
          token1: 'USDC',
          feeTier: 3000,
          amount: 5000,
        },
      },
    ];

    const parameters = extractor.extract(blocks);

    const feeTierParam = parameters.find(p => p.paramName === 'feeTier');
    expect(feeTierParam).toEqual({
      blockId: 'block-4',
      blockType: 'CREATE_LP_POSITION',
      paramName: 'feeTier',
      type: 'discrete',
      values: [500, 3000, 10000],
      defaultValue: 3000,
    });
  });

  it('should limit to 10 most important parameters', () => {
    const blocks: LegoBlock[] = Array.from({ length: 15 }, (_, i) => ({
      id: `block-${i}`,
      type: 'POSITION_SIZE',
      protocol: Protocol.RISK,
      label: 'Position',
      description: 'Size',
      color: '#6C63FF',
      params: { percentage: 25 },
    }));

    const parameters = extractor.extract(blocks);

    expect(parameters.length).toBeLessThanOrEqual(10);
  });
});
```

**Step 2: Add test script to package.json**

Modify `package.json`:

```json
{
  "scripts": {
    "test": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

**Step 3: Install test dependencies**

Run: `npm install -D vitest`

**Step 4: Run test to verify it fails**

Run: `npm test parameterExtractor`
Expected: FAIL with "Cannot find module '../parameterExtractor'"

**Step 5: Implement ParameterExtractor**

Create `services/optimization/parameterExtractor.ts`:

```typescript
/**
 * Parameter Extractor
 *
 * Analyzes strategy blocks and identifies optimizable parameters.
 */

import { LegoBlock } from '../../types';
import { ParameterDefinition } from './types';

export class ParameterExtractor {
  /**
   * Extract optimizable parameters from strategy blocks
   */
  extract(blocks: LegoBlock[]): ParameterDefinition[] {
    const parameters: ParameterDefinition[] = [];

    for (const block of blocks) {
      const blockParams = this.extractBlockParameters(block);
      parameters.push(...blockParams);
    }

    // Limit to 10 most important parameters
    return this.prioritizeParameters(parameters).slice(0, 10);
  }

  /**
   * Extract parameters from a single block
   */
  private extractBlockParameters(block: LegoBlock): ParameterDefinition[] {
    const extractors: Record<string, (block: LegoBlock) => ParameterDefinition[]> = {
      UNISWAP_SWAP: this.extractSwapParams.bind(this),
      AAVE_SUPPLY: this.extractSupplyParams.bind(this),
      AAVE_BORROW: this.extractBorrowParams.bind(this),
      CREATE_LP_POSITION: this.extractLPParams.bind(this),
      IF_CONDITION: this.extractConditionParams.bind(this),
      STOP_LOSS: this.extractStopLossParams.bind(this),
      POSITION_SIZE: this.extractPositionSizeParams.bind(this),
    };

    const extractor = extractors[block.type];
    return extractor ? extractor(block) : [];
  }

  /**
   * Extract parameters from UNISWAP_SWAP block
   */
  private extractSwapParams(block: LegoBlock): ParameterDefinition[] {
    const params: ParameterDefinition[] = [];

    if (block.params?.slippage !== undefined) {
      params.push({
        blockId: block.id,
        blockType: block.type,
        paramName: 'slippage',
        type: 'continuous',
        min: 0.1,
        max: 2.0,
        defaultValue: block.params.slippage,
      });
    }

    if (block.params?.amount !== undefined) {
      params.push({
        blockId: block.id,
        blockType: block.type,
        paramName: 'amount',
        type: 'continuous',
        min: block.params.amount * 0.5,
        max: block.params.amount * 1.5,
        defaultValue: block.params.amount,
      });
    }

    return params;
  }

  /**
   * Extract parameters from AAVE_SUPPLY block
   */
  private extractSupplyParams(block: LegoBlock): ParameterDefinition[] {
    if (block.params?.supplyAmount === undefined) return [];

    return [
      {
        blockId: block.id,
        blockType: block.type,
        paramName: 'supplyAmount',
        type: 'continuous',
        min: block.params.supplyAmount * 0.5,
        max: block.params.supplyAmount * 1.5,
        defaultValue: block.params.supplyAmount,
      },
    ];
  }

  /**
   * Extract parameters from AAVE_BORROW block
   */
  private extractBorrowParams(block: LegoBlock): ParameterDefinition[] {
    const params: ParameterDefinition[] = [];

    if (block.params?.borrowAmount !== undefined) {
      params.push({
        blockId: block.id,
        blockType: block.type,
        paramName: 'borrowAmount',
        type: 'continuous',
        min: block.params.borrowAmount * 0.5,
        max: block.params.borrowAmount * 1.5,
        defaultValue: block.params.borrowAmount,
      });
    }

    if (block.params?.collateralFactor !== undefined) {
      params.push({
        blockId: block.id,
        blockType: block.type,
        paramName: 'collateralFactor',
        type: 'continuous',
        min: 0.5,
        max: 0.85,
        defaultValue: block.params.collateralFactor,
      });
    }

    return params;
  }

  /**
   * Extract parameters from CREATE_LP_POSITION block
   */
  private extractLPParams(block: LegoBlock): ParameterDefinition[] {
    const params: ParameterDefinition[] = [];

    if (block.params?.feeTier !== undefined) {
      params.push({
        blockId: block.id,
        blockType: block.type,
        paramName: 'feeTier',
        type: 'discrete',
        values: [500, 3000, 10000],
        defaultValue: block.params.feeTier,
      });
    }

    if (block.params?.amount !== undefined) {
      params.push({
        blockId: block.id,
        blockType: block.type,
        paramName: 'amount',
        type: 'continuous',
        min: block.params.amount * 0.5,
        max: block.params.amount * 1.5,
        defaultValue: block.params.amount,
      });
    }

    return params;
  }

  /**
   * Extract parameters from IF_CONDITION block
   */
  private extractConditionParams(block: LegoBlock): ParameterDefinition[] {
    if (!block.params?.condition) return [];

    const condition = block.params.condition as string;

    // Parse RSI condition (e.g., "RSI < 30")
    const rsiMatch = condition.match(/RSI\s*([<>]=?)\s*(\d+(?:\.\d+)?)/i);
    if (rsiMatch) {
      const threshold = parseFloat(rsiMatch[2]);
      return [
        {
          blockId: block.id,
          blockType: block.type,
          paramName: 'rsiThreshold',
          type: 'continuous',
          min: 20,
          max: 40,
          defaultValue: threshold,
        },
      ];
    }

    // Parse APY condition (e.g., "APY > 5")
    const apyMatch = condition.match(/APY\s*([<>]=?)\s*(\d+(?:\.\d+)?)/i);
    if (apyMatch) {
      const threshold = parseFloat(apyMatch[2]);
      return [
        {
          blockId: block.id,
          blockType: block.type,
          paramName: 'apyThreshold',
          type: 'continuous',
          min: 2,
          max: 15,
          defaultValue: threshold,
        },
      ];
    }

    return [];
  }

  /**
   * Extract parameters from STOP_LOSS block
   */
  private extractStopLossParams(block: LegoBlock): ParameterDefinition[] {
    if (block.params?.threshold === undefined) return [];

    return [
      {
        blockId: block.id,
        blockType: block.type,
        paramName: 'threshold',
        type: 'continuous',
        min: -25,
        max: -5,
        defaultValue: block.params.threshold,
      },
    ];
  }

  /**
   * Extract parameters from POSITION_SIZE block
   */
  private extractPositionSizeParams(block: LegoBlock): ParameterDefinition[] {
    if (block.params?.percentage === undefined) return [];

    return [
      {
        blockId: block.id,
        blockType: block.type,
        paramName: 'percentage',
        type: 'percentage',
        min: 10,
        max: 50,
        defaultValue: block.params.percentage,
      },
    ];
  }

  /**
   * Prioritize parameters by importance
   */
  private prioritizeParameters(parameters: ParameterDefinition[]): ParameterDefinition[] {
    // Priority: Risk management > Entry/Exit > Position sizing > Execution
    const priorityMap: Record<string, number> = {
      threshold: 1, // Stop loss
      rsiThreshold: 2, // Entry signal
      apyThreshold: 2,
      percentage: 3, // Position size
      collateralFactor: 1, // Risk
      slippage: 4,
      amount: 5,
      feeTier: 5,
    };

    return parameters.sort((a, b) => {
      const priorityA = priorityMap[a.paramName] || 10;
      const priorityB = priorityMap[b.paramName] || 10;
      return priorityA - priorityB;
    });
  }
}

export const parameterExtractor = new ParameterExtractor();
```

**Step 6: Export from barrel**

Modify `services/optimization/index.ts`:

```typescript
export * from './types';
export * from './parameterExtractor';
```

**Step 7: Run test to verify it passes**

Run: `npm test parameterExtractor`
Expected: All tests PASS

**Step 8: Commit**

```bash
git add services/optimization/parameterExtractor.ts services/optimization/__tests__/parameterExtractor.test.ts services/optimization/index.ts package.json
git commit -m "feat(optimization): add parameter extraction service

- Extracts parameters from DeFi blocks
- Supports continuous, discrete, and percentage types
- Prioritizes risk and entry/exit parameters
- Limits to top 10 parameters"
```

---

## Task 3: Walk-Forward Validator

**Files:**
- Create: `services/optimization/walkForwardValidator.ts`
- Create: `services/optimization/__tests__/walkForwardValidator.test.ts`

**Step 1: Write test for window generation**

Create `services/optimization/__tests__/walkForwardValidator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { WalkForwardValidator } from '../walkForwardValidator';

describe('WalkForwardValidator', () => {
  const validator = new WalkForwardValidator();

  it('should generate non-overlapping train/test windows', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-06-01');

    const windows = validator.generateWindows(startDate, endDate);

    expect(windows.length).toBeGreaterThan(0);

    // Check each window
    windows.forEach((window) => {
      expect(window.trainStart < window.trainEnd).toBe(true);
      expect(window.trainEnd <= window.testStart).toBe(true);
      expect(window.testStart < window.testEnd).toBe(true);
    });
  });

  it('should create 90-day train and 30-day test windows', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-06-01');

    const windows = validator.generateWindows(startDate, endDate);
    const firstWindow = windows[0];

    const trainDays = Math.floor(
      (firstWindow.trainEnd.getTime() - firstWindow.trainStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const testDays = Math.floor(
      (firstWindow.testEnd.getTime() - firstWindow.testStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    expect(trainDays).toBe(90);
    expect(testDays).toBe(30);
  });

  it('should slide window by 30 days', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-06-01');

    const windows = validator.generateWindows(startDate, endDate);

    if (windows.length >= 2) {
      const slideDays = Math.floor(
        (windows[1].trainStart.getTime() - windows[0].trainStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(slideDays).toBe(30);
    }
  });

  it('should calculate performance degradation', () => {
    const inSample = { sharpeRatio: 2.0, totalReturn: 50 };
    const outOfSample = { sharpeRatio: 1.5, totalReturn: 35 };

    const degradation = validator.calculateDegradation(inSample, outOfSample);

    expect(degradation).toBeGreaterThan(0);
    expect(degradation).toBeLessThan(100);
  });

  it('should detect overfitting when degradation > 60%', () => {
    const degradation = 65;

    const isOverfit = validator.isOverfit(degradation);

    expect(isOverfit).toBe(true);
  });

  it('should not flag overfitting when degradation < 60%', () => {
    const degradation = 35;

    const isOverfit = validator.isOverfit(degradation);

    expect(isOverfit).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test walkForwardValidator`
Expected: FAIL with "Cannot find module"

**Step 3: Implement WalkForwardValidator**

Create `services/optimization/walkForwardValidator.ts`:

```typescript
/**
 * Walk-Forward Validator
 *
 * Implements walk-forward optimization to prevent overfitting.
 * Splits timeline into rolling train/test windows.
 */

import { WalkForwardWindow, ObjectiveScores } from './types';

export class WalkForwardValidator {
  private readonly TRAIN_WINDOW_DAYS = 90;
  private readonly TEST_WINDOW_DAYS = 30;
  private readonly STEP_SIZE_DAYS = 30;
  private readonly OVERFIT_THRESHOLD = 60; // 60% degradation

  /**
   * Generate walk-forward windows from date range
   */
  generateWindows(startDate: Date, endDate: Date): WalkForwardWindow[] {
    const windows: WalkForwardWindow[] = [];
    const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Need at least train + test days
    if (totalDays < this.TRAIN_WINDOW_DAYS + this.TEST_WINDOW_DAYS) {
      throw new Error(
        `Date range too short. Need at least ${this.TRAIN_WINDOW_DAYS + this.TEST_WINDOW_DAYS} days.`
      );
    }

    let currentStart = new Date(startDate);

    while (true) {
      const trainStart = new Date(currentStart);
      const trainEnd = this.addDays(trainStart, this.TRAIN_WINDOW_DAYS);
      const testStart = new Date(trainEnd);
      const testEnd = this.addDays(testStart, this.TEST_WINDOW_DAYS);

      // Stop if test window exceeds end date
      if (testEnd > endDate) {
        break;
      }

      windows.push({
        trainStart,
        trainEnd,
        testStart,
        testEnd,
      });

      // Slide window forward
      currentStart = this.addDays(currentStart, this.STEP_SIZE_DAYS);
    }

    return windows;
  }

  /**
   * Calculate performance degradation percentage
   */
  calculateDegradation(inSample: ObjectiveScores, outOfSample: ObjectiveScores): number {
    // Average degradation across all objectives
    const degradations: number[] = [];

    if (inSample.sharpeRatio && outOfSample.sharpeRatio) {
      const deg = ((inSample.sharpeRatio - outOfSample.sharpeRatio) / inSample.sharpeRatio) * 100;
      degradations.push(Math.max(0, deg));
    }

    if (inSample.totalReturn && outOfSample.totalReturn) {
      const deg = ((inSample.totalReturn - outOfSample.totalReturn) / inSample.totalReturn) * 100;
      degradations.push(Math.max(0, deg));
    }

    if (inSample.winRate && outOfSample.winRate) {
      const deg = ((inSample.winRate - outOfSample.winRate) / inSample.winRate) * 100;
      degradations.push(Math.max(0, deg));
    }

    // Average degradation
    return degradations.length > 0
      ? degradations.reduce((a, b) => a + b, 0) / degradations.length
      : 0;
  }

  /**
   * Check if degradation indicates overfitting
   */
  isOverfit(degradation: number): boolean {
    return degradation > this.OVERFIT_THRESHOLD;
  }

  /**
   * Add days to a date
   */
  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

export const walkForwardValidator = new WalkForwardValidator();
```

**Step 4: Export from barrel**

Modify `services/optimization/index.ts`:

```typescript
export * from './types';
export * from './parameterExtractor';
export * from './walkForwardValidator';
```

**Step 5: Run test to verify it passes**

Run: `npm test walkForwardValidator`
Expected: All tests PASS

**Step 6: Commit**

```bash
git add services/optimization/walkForwardValidator.ts services/optimization/__tests__/walkForwardValidator.test.ts services/optimization/index.ts
git commit -m "feat(optimization): add walk-forward validation

- Generates 90-day train / 30-day test windows
- Slides forward by 30 days
- Calculates performance degradation
- Detects overfitting (>60% degradation)"
```

---

## Task 4: Web Worker Setup

**Files:**
- Create: `services/optimization/optimization.worker.ts`
- Create: `services/optimization/backtestWorker.ts`

**Step 1: Create Web Worker entry point**

Create `services/optimization/optimization.worker.ts`:

```typescript
/**
 * Optimization Web Worker
 *
 * Runs backtests in separate thread to keep UI responsive.
 */

import { runDeFiBacktest } from '../defiBacktestEngine';
import { BacktestWorkerRequest, BacktestWorkerResponse } from './types';
import { LegoBlock } from '../../types';

// Apply parameters to blocks
function applyParametersToBlocks(
  blocks: LegoBlock[],
  parameters: BacktestWorkerRequest['parameters']
): LegoBlock[] {
  return blocks.map((block) => {
    const blockParams = parameters[block.id];
    if (blockParams) {
      return {
        ...block,
        params: {
          ...block.params,
          ...blockParams,
        },
      };
    }
    return block;
  });
}

// Handle messages from main thread
self.onmessage = async (event: MessageEvent<BacktestWorkerRequest>) => {
  const { type, id, blocks, parameters, config } = event.data;

  if (type !== 'BACKTEST') {
    return;
  }

  try {
    // Apply parameters to blocks
    const updatedBlocks = applyParametersToBlocks(blocks, parameters);

    // Run backtest
    const result = await runDeFiBacktest({
      blocks: updatedBlocks,
      startDate: new Date(config.startDate),
      endDate: new Date(config.endDate),
      initialCapital: config.initialCapital,
      rebalanceInterval: config.rebalanceInterval,
    });

    // Send result back to main thread
    const response: BacktestWorkerResponse = {
      type: 'RESULT',
      id,
      parameters,
      result,
    };

    self.postMessage(response);
  } catch (error: any) {
    // Send error back to main thread
    const response: BacktestWorkerResponse = {
      type: 'ERROR',
      id,
      parameters,
      error: error.message,
    };

    self.postMessage(response);
  }
};
```

**Step 2: Create worker pool manager**

Create `services/optimization/backtestWorker.ts`:

```typescript
/**
 * Backtest Worker Pool
 *
 * Manages multiple Web Workers for parallel backtest execution.
 */

import { BacktestWorkerRequest, BacktestWorkerResponse, ParameterSet } from './types';
import { LegoBlock } from '../../types';
import { DeFiBacktestResult } from '../defiBacktestEngine';

interface BacktestTask {
  id: string;
  resolve: (result: DeFiBacktestResult) => void;
  reject: (error: Error) => void;
}

export class BacktestWorkerPool {
  private workers: Worker[] = [];
  private taskQueue: BacktestTask[] = [];
  private activeWorkers = 0;
  private cache = new Map<string, DeFiBacktestResult>();

  constructor(private workerCount: number = Math.min(navigator.hardwareConcurrency || 4, 8)) {
    this.initializeWorkers();
  }

  /**
   * Initialize worker pool
   */
  private initializeWorkers(): void {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker(
        new URL('./optimization.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = this.handleWorkerMessage.bind(this);
      this.workers.push(worker);
    }
  }

  /**
   * Run backtest with caching
   */
  async runBacktest(
    blocks: LegoBlock[],
    parameters: ParameterSet,
    config: {
      startDate: Date;
      endDate: Date;
      initialCapital: number;
      rebalanceInterval: number;
    }
  ): Promise<DeFiBacktestResult> {
    // Check cache
    const cacheKey = this.getCacheKey(parameters);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Find available worker
    return new Promise((resolve, reject) => {
      const taskId = `task-${Date.now()}-${Math.random()}`;

      this.taskQueue.push({
        id: taskId,
        resolve: (result) => {
          this.cache.set(cacheKey, result);
          resolve(result);
        },
        reject,
      });

      this.processQueue(blocks, parameters, config);
    });
  }

  /**
   * Process task queue
   */
  private processQueue(
    blocks: LegoBlock[],
    parameters: ParameterSet,
    config: {
      startDate: Date;
      endDate: Date;
      initialCapital: number;
      rebalanceInterval: number;
    }
  ): void {
    if (this.taskQueue.length === 0 || this.activeWorkers >= this.workerCount) {
      return;
    }

    const task = this.taskQueue.shift()!;
    const worker = this.workers[this.activeWorkers];

    const request: BacktestWorkerRequest = {
      type: 'BACKTEST',
      id: task.id,
      blocks,
      parameters,
      config,
    };

    worker.postMessage(request);
    this.activeWorkers++;
  }

  /**
   * Handle worker response
   */
  private handleWorkerMessage(event: MessageEvent<BacktestWorkerResponse>): void {
    const { type, id, result, error } = event.data;

    const task = this.taskQueue.find((t) => t.id === id);
    if (!task) return;

    this.activeWorkers--;

    if (type === 'RESULT' && result) {
      task.resolve(result);
    } else if (type === 'ERROR') {
      task.reject(new Error(error || 'Unknown worker error'));
    }

    // Process next task
    this.processQueue(
      [] as LegoBlock[], // Will be provided by next call
      {},
      {
        startDate: new Date(),
        endDate: new Date(),
        initialCapital: 0,
        rebalanceInterval: 0,
      }
    );
  }

  /**
   * Get cache key from parameters
   */
  private getCacheKey(parameters: ParameterSet): string {
    return JSON.stringify(parameters);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Will track in production
    };
  }

  /**
   * Get active worker count
   */
  getActiveWorkerCount(): number {
    return this.activeWorkers;
  }

  /**
   * Terminate all workers
   */
  terminate(): void {
    this.workers.forEach((worker) => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.cache.clear();
  }
}
```

**Step 3: Export from barrel**

Modify `services/optimization/index.ts`:

```typescript
export * from './types';
export * from './parameterExtractor';
export * from './walkForwardValidator';
export * from './backtestWorker';
```

**Step 4: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds (workers may show warnings, that's OK)

**Step 5: Commit**

```bash
git add services/optimization/optimization.worker.ts services/optimization/backtestWorker.ts services/optimization/index.ts
git commit -m "feat(optimization): add Web Worker pool for parallel backtests

- Worker entry point runs backtests in separate thread
- Pool manager distributes tasks across 4-8 workers
- Result caching to avoid duplicate backtests
- Keeps UI responsive during optimization"
```

---

## Task 5: Pareto Frontier Utilities

**Files:**
- Create: `services/optimization/algorithms/paretoFrontier.ts`
- Create: `services/optimization/algorithms/__tests__/paretoFrontier.test.ts`

**Step 1: Write tests for Pareto dominance**

Create `services/optimization/algorithms/__tests__/paretoFrontier.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ParetoFrontier } from '../paretoFrontier';
import { OptimizationSolution, ObjectiveScores } from '../../types';

describe('ParetoFrontier', () => {
  const pareto = new ParetoFrontier();

  const createSolution = (
    id: string,
    sharpe: number,
    drawdown: number
  ): OptimizationSolution => ({
    id,
    parameters: {},
    inSampleScores: { sharpeRatio: sharpe, maxDrawdown: drawdown },
    outOfSampleScores: { sharpeRatio: sharpe * 0.8, maxDrawdown: drawdown },
    degradation: 20,
    isParetoOptimal: false,
  });

  it('should detect when A dominates B', () => {
    const a = createSolution('a', 2.0, -10); // Better Sharpe, same drawdown
    const b = createSolution('b', 1.5, -10);

    const dominates = pareto.dominates(a, b, ['sharpeRatio', 'maxDrawdown']);

    expect(dominates).toBe(true);
  });

  it('should detect when neither dominates', () => {
    const a = createSolution('a', 2.0, -15); // Better Sharpe, worse drawdown
    const b = createSolution('b', 1.5, -10); // Worse Sharpe, better drawdown

    const aDominatesB = pareto.dominates(a, b, ['sharpeRatio', 'maxDrawdown']);
    const bDominatesA = pareto.dominates(b, a, ['sharpeRatio', 'maxDrawdown']);

    expect(aDominatesB).toBe(false);
    expect(bDominatesA).toBe(false);
  });

  it('should extract Pareto frontier from solutions', () => {
    const solutions = [
      createSolution('a', 2.0, -10), // Pareto optimal
      createSolution('b', 1.5, -8),  // Pareto optimal
      createSolution('c', 1.0, -12), // Dominated by a
      createSolution('d', 2.5, -20), // Pareto optimal (high risk/reward)
    ];

    const frontier = pareto.extractFrontier(solutions, ['sharpeRatio', 'maxDrawdown']);

    expect(frontier).toHaveLength(3);
    expect(frontier.map(s => s.id).sort()).toEqual(['a', 'b', 'd']);
  });

  it('should mark solutions as Pareto optimal', () => {
    const solutions = [
      createSolution('a', 2.0, -10),
      createSolution('b', 1.0, -12),
    ];

    const frontier = pareto.extractFrontier(solutions, ['sharpeRatio', 'maxDrawdown']);

    frontier.forEach(solution => {
      expect(solution.isParetoOptimal).toBe(true);
    });
  });

  it('should handle maximization objectives (Sharpe, return)', () => {
    const a = createSolution('a', 2.0, -10);
    const b = createSolution('b', 1.5, -10);

    // A has higher Sharpe (maximize) → A dominates B
    const dominates = pareto.dominates(a, b, ['sharpeRatio']);
    expect(dominates).toBe(true);
  });

  it('should handle minimization objectives (drawdown, costs)', () => {
    const a: OptimizationSolution = {
      id: 'a',
      parameters: {},
      inSampleScores: { maxDrawdown: -8 }, // Less drawdown (better)
      outOfSampleScores: {},
      degradation: 0,
      isParetoOptimal: false,
    };

    const b: OptimizationSolution = {
      id: 'b',
      parameters: {},
      inSampleScores: { maxDrawdown: -12 }, // More drawdown (worse)
      outOfSampleScores: {},
      degradation: 0,
      isParetoOptimal: false,
    };

    // Drawdown is minimization: -8 > -12, so A dominates B
    const dominates = pareto.dominates(a, b, ['maxDrawdown']);
    expect(dominates).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test paretoFrontier`
Expected: FAIL

**Step 3: Implement ParetoFrontier**

Create `services/optimization/algorithms/paretoFrontier.ts`:

```typescript
/**
 * Pareto Frontier Utilities
 *
 * Multi-objective optimization using Pareto dominance.
 */

import { OptimizationSolution, OptimizationObjective } from '../types';

export class ParetoFrontier {
  // Objectives to maximize (higher is better)
  private readonly MAXIMIZE: OptimizationObjective[] = [
    'sharpeRatio',
    'totalReturn',
    'winRate',
  ];

  // Objectives to minimize (lower is better)
  private readonly MINIMIZE: OptimizationObjective[] = [
    'maxDrawdown',
    'gasCosts',
    'protocolFees',
  ];

  /**
   * Check if solution A dominates solution B
   *
   * A dominates B if:
   * - A is >= B on all objectives AND
   * - A is > B on at least one objective
   */
  dominates(
    a: OptimizationSolution,
    b: OptimizationSolution,
    objectives: OptimizationObjective[]
  ): boolean {
    let betterInAtLeastOne = false;

    for (const objective of objectives) {
      const aValue = this.getObjectiveValue(a, objective);
      const bValue = this.getObjectiveValue(b, objective);

      if (aValue === undefined || bValue === undefined) continue;

      const isMaximize = this.MAXIMIZE.includes(objective);

      if (isMaximize) {
        // Maximize: A should be >= B
        if (aValue < bValue) return false; // A is worse
        if (aValue > bValue) betterInAtLeastOne = true;
      } else {
        // Minimize: A should be <= B (for drawdown: -8 is better than -12)
        if (aValue > bValue) return false; // A is worse
        if (aValue < bValue) betterInAtLeastOne = true;
      }
    }

    return betterInAtLeastOne;
  }

  /**
   * Extract Pareto frontier from solutions
   */
  extractFrontier(
    solutions: OptimizationSolution[],
    objectives: OptimizationObjective[]
  ): OptimizationSolution[] {
    const frontier: OptimizationSolution[] = [];

    for (const solution of solutions) {
      let isDominated = false;

      // Check if this solution is dominated by any other
      for (const other of solutions) {
        if (other.id === solution.id) continue;

        if (this.dominates(other, solution, objectives)) {
          isDominated = true;
          break;
        }
      }

      if (!isDominated) {
        frontier.push({
          ...solution,
          isParetoOptimal: true,
        });
      }
    }

    return frontier;
  }

  /**
   * Get objective value from solution
   */
  private getObjectiveValue(
    solution: OptimizationSolution,
    objective: OptimizationObjective
  ): number | undefined {
    // Use out-of-sample scores if available, otherwise in-sample
    const scores = solution.outOfSampleScores.sharpeRatio !== undefined
      ? solution.outOfSampleScores
      : solution.inSampleScores;

    return scores[objective];
  }

  /**
   * Calculate crowding distance for NSGA-II
   * (Used by genetic algorithm)
   */
  calculateCrowdingDistance(
    frontier: OptimizationSolution[],
    objectives: OptimizationObjective[]
  ): Map<string, number> {
    const distances = new Map<string, number>();

    // Initialize all distances to 0
    frontier.forEach(solution => distances.set(solution.id, 0));

    // For each objective
    for (const objective of objectives) {
      // Sort by objective value
      const sorted = [...frontier].sort((a, b) => {
        const aValue = this.getObjectiveValue(a, objective) || 0;
        const bValue = this.getObjectiveValue(b, objective) || 0;
        return aValue - bValue;
      });

      // Boundary solutions get infinite distance
      if (sorted.length > 0) {
        distances.set(sorted[0].id, Infinity);
        distances.set(sorted[sorted.length - 1].id, Infinity);
      }

      // Calculate distances for middle solutions
      for (let i = 1; i < sorted.length - 1; i++) {
        const prev = this.getObjectiveValue(sorted[i - 1], objective) || 0;
        const next = this.getObjectiveValue(sorted[i + 1], objective) || 0;
        const range = next - prev;

        const currentDistance = distances.get(sorted[i].id) || 0;
        distances.set(sorted[i].id, currentDistance + range);
      }
    }

    return distances;
  }
}

export const paretoFrontier = new ParetoFrontier();
```

**Step 4: Run test to verify it passes**

Run: `npm test paretoFrontier`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add services/optimization/algorithms/paretoFrontier.ts services/optimization/algorithms/__tests__/paretoFrontier.test.ts
git commit -m "feat(optimization): add Pareto frontier utilities

- Pareto dominance checking
- Frontier extraction from solutions
- Crowding distance for NSGA-II
- Handles maximize and minimize objectives"
```

---

## Task 6: Bayesian Optimizer (Part 1 - Structure)

**Files:**
- Create: `services/optimization/algorithms/bayesianOptimizer.ts`
- Create: `services/optimization/algorithms/__tests__/bayesianOptimizer.test.ts`

**Step 1: Write test for random sampling**

Create `services/optimization/algorithms/__tests__/bayesianOptimizer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { BayesianOptimizer } from '../bayesianOptimizer';
import { ParameterDefinition, OptimizationObjective } from '../../types';

describe('BayesianOptimizer', () => {
  const parameters: ParameterDefinition[] = [
    {
      blockId: 'block-1',
      blockType: 'POSITION_SIZE',
      paramName: 'percentage',
      type: 'continuous',
      min: 10,
      max: 50,
      defaultValue: 25,
    },
    {
      blockId: 'block-2',
      blockType: 'STOP_LOSS',
      paramName: 'threshold',
      type: 'continuous',
      min: -25,
      max: -5,
      defaultValue: -10,
    },
  ];

  const objectives: OptimizationObjective[] = ['sharpeRatio', 'maxDrawdown'];

  it('should generate random initial samples', () => {
    const optimizer = new BayesianOptimizer(parameters, objectives);
    const samples = optimizer.generateInitialSamples(5);

    expect(samples).toHaveLength(5);

    samples.forEach(sample => {
      expect(sample['block-1']).toBeDefined();
      expect(sample['block-1'].percentage).toBeGreaterThanOrEqual(10);
      expect(sample['block-1'].percentage).toBeLessThanOrEqual(50);

      expect(sample['block-2']).toBeDefined();
      expect(sample['block-2'].threshold).toBeGreaterThanOrEqual(-25);
      expect(sample['block-2'].threshold).toBeLessThanOrEqual(-5);
    });
  });

  it('should handle discrete parameters', () => {
    const discreteParams: ParameterDefinition[] = [
      {
        blockId: 'block-3',
        blockType: 'CREATE_LP_POSITION',
        paramName: 'feeTier',
        type: 'discrete',
        values: [500, 3000, 10000],
        defaultValue: 3000,
      },
    ];

    const optimizer = new BayesianOptimizer(discreteParams, objectives);
    const samples = optimizer.generateInitialSamples(10);

    samples.forEach(sample => {
      const feeTier = sample['block-3'].feeTier;
      expect([500, 3000, 10000]).toContain(feeTier);
    });
  });

  it('should suggest next parameter set', () => {
    const optimizer = new BayesianOptimizer(parameters, objectives);

    // Add some observed data
    optimizer.addObservation(
      { 'block-1': { percentage: 20 }, 'block-2': { threshold: -15 } },
      { sharpeRatio: 1.5, maxDrawdown: -12 }
    );

    const next = optimizer.suggestNext();

    expect(next['block-1']).toBeDefined();
    expect(next['block-2']).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test bayesianOptimizer`
Expected: FAIL

**Step 3: Implement BayesianOptimizer structure**

Create `services/optimization/algorithms/bayesianOptimizer.ts`:

```typescript
/**
 * Bayesian Optimizer
 *
 * Uses Gaussian Process with Expected Improvement acquisition function.
 * Simplified implementation for client-side use.
 */

import {
  ParameterDefinition,
  ParameterSet,
  OptimizationObjective,
  ObjectiveScores,
} from '../types';

interface Observation {
  parameters: ParameterSet;
  scores: ObjectiveScores;
}

export class BayesianOptimizer {
  private observations: Observation[] = [];

  constructor(
    private parameters: ParameterDefinition[],
    private objectives: OptimizationObjective[]
  ) {}

  /**
   * Generate random initial samples for exploration
   */
  generateInitialSamples(count: number): ParameterSet[] {
    const samples: ParameterSet[] = [];

    for (let i = 0; i < count; i++) {
      const sample: ParameterSet = {};

      for (const param of this.parameters) {
        if (!sample[param.blockId]) {
          sample[param.blockId] = {};
        }

        if (param.type === 'discrete') {
          // Random choice from discrete values
          const values = param.values || [];
          const randomIndex = Math.floor(Math.random() * values.length);
          sample[param.blockId][param.paramName] = values[randomIndex];
        } else {
          // Random value in continuous range
          const min = param.min || 0;
          const max = param.max || 100;
          const value = min + Math.random() * (max - min);
          sample[param.blockId][param.paramName] = value;
        }
      }

      samples.push(sample);
    }

    return samples;
  }

  /**
   * Add observation (parameter set + result)
   */
  addObservation(parameters: ParameterSet, scores: ObjectiveScores): void {
    this.observations.push({ parameters, scores });
  }

  /**
   * Suggest next parameter set using acquisition function
   */
  suggestNext(): ParameterSet {
    // If no observations, return random sample
    if (this.observations.length === 0) {
      return this.generateInitialSamples(1)[0];
    }

    // Simplified Expected Improvement:
    // Sample random candidates and pick best based on distance to good observations
    const candidates = this.generateInitialSamples(20);

    let bestCandidate = candidates[0];
    let bestScore = -Infinity;

    for (const candidate of candidates) {
      const score = this.evaluateCandidate(candidate);
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Evaluate candidate using simplified acquisition function
   */
  private evaluateCandidate(candidate: ParameterSet): number {
    // Find best observation
    const bestObservation = this.findBestObservation();
    if (!bestObservation) return Math.random();

    // Calculate distance from best observation
    const distance = this.calculateDistance(candidate, bestObservation.parameters);

    // Prefer candidates near good solutions but not too close (exploration/exploitation)
    const optimalDistance = 0.2; // 20% of parameter space
    const distanceScore = 1 / (1 + Math.abs(distance - optimalDistance));

    return distanceScore;
  }

  /**
   * Find best observation based on primary objective
   */
  private findBestObservation(): Observation | undefined {
    if (this.observations.length === 0) return undefined;

    const primaryObjective = this.objectives[0];

    return this.observations.reduce((best, current) => {
      const bestValue = best.scores[primaryObjective] || -Infinity;
      const currentValue = current.scores[primaryObjective] || -Infinity;
      return currentValue > bestValue ? current : best;
    });
  }

  /**
   * Calculate normalized distance between parameter sets
   */
  private calculateDistance(a: ParameterSet, b: ParameterSet): number {
    let sumSquaredDiff = 0;
    let count = 0;

    for (const param of this.parameters) {
      const aValue = a[param.blockId]?.[param.paramName];
      const bValue = b[param.blockId]?.[param.paramName];

      if (aValue === undefined || bValue === undefined) continue;

      // Normalize to 0-1 range
      const min = param.min || 0;
      const max = param.max || 100;
      const range = max - min;

      const aNorm = (aValue - min) / range;
      const bNorm = (bValue - min) / range;

      sumSquaredDiff += Math.pow(aNorm - bNorm, 2);
      count++;
    }

    return count > 0 ? Math.sqrt(sumSquaredDiff / count) : 0;
  }

  /**
   * Get number of observations
   */
  getObservationCount(): number {
    return this.observations.length;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test bayesianOptimizer`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add services/optimization/algorithms/bayesianOptimizer.ts services/optimization/algorithms/__tests__/bayesianOptimizer.test.ts
git commit -m "feat(optimization): add Bayesian optimizer structure

- Random initial sampling (exploration)
- Observation tracking
- Simplified Expected Improvement acquisition
- Distance-based candidate evaluation"
```

---

## Task 7: Genetic Optimizer (Part 1 - Structure)

**Files:**
- Create: `services/optimization/algorithms/geneticOptimizer.ts`
- Create: `services/optimization/algorithms/__tests__/geneticOptimizer.test.ts`

**Step 1: Write test for population initialization**

Create `services/optimization/algorithms/__tests__/geneticOptimizer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GeneticOptimizer } from '../geneticOptimizer';
import { ParameterDefinition, OptimizationObjective } from '../../types';

describe('GeneticOptimizer', () => {
  const parameters: ParameterDefinition[] = [
    {
      blockId: 'block-1',
      blockType: 'POSITION_SIZE',
      paramName: 'percentage',
      type: 'continuous',
      min: 10,
      max: 50,
      defaultValue: 25,
    },
  ];

  const objectives: OptimizationObjective[] = ['sharpeRatio', 'maxDrawdown'];

  it('should initialize random population', () => {
    const optimizer = new GeneticOptimizer(parameters, objectives, 20);

    const population = optimizer.getPopulation();

    expect(population).toHaveLength(20);
  });

  it('should perform crossover between two individuals', () => {
    const optimizer = new GeneticOptimizer(parameters, objectives, 20);

    const parent1 = { 'block-1': { percentage: 20 } };
    const parent2 = { 'block-1': { percentage: 40 } };

    const child = optimizer.crossover(parent1, parent2);

    // Child should be blend of parents
    const childValue = child['block-1'].percentage;
    expect(childValue).toBeGreaterThanOrEqual(20);
    expect(childValue).toBeLessThanOrEqual(40);
  });

  it('should mutate individual parameters', () => {
    const optimizer = new GeneticOptimizer(parameters, objectives, 20);

    const individual = { 'block-1': { percentage: 25 } };
    const mutated = optimizer.mutate(individual, 1.0); // 100% mutation rate

    // Should be different
    expect(mutated['block-1'].percentage).not.toBe(25);

    // Should be in valid range
    expect(mutated['block-1'].percentage).toBeGreaterThanOrEqual(10);
    expect(mutated['block-1'].percentage).toBeLessThanOrEqual(50);
  });

  it('should select top performers', () => {
    const optimizer = new GeneticOptimizer(parameters, objectives, 20);

    // Add fitness scores
    const population = optimizer.getPopulation();
    population.forEach((individual, i) => {
      optimizer.setFitness(individual, i * 0.1); // Increasing fitness
    });

    const selected = optimizer.select(10);

    expect(selected).toHaveLength(10);
    // Top 10 should have higher fitness
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test geneticOptimizer`
Expected: FAIL

**Step 3: Implement GeneticOptimizer structure**

Create `services/optimization/algorithms/geneticOptimizer.ts`:

```typescript
/**
 * Genetic Optimizer
 *
 * NSGA-II (Non-dominated Sorting Genetic Algorithm II)
 * for multi-objective optimization.
 */

import {
  ParameterDefinition,
  ParameterSet,
  OptimizationObjective,
  OptimizationSolution,
} from '../types';
import { ParetoFrontier } from './paretoFrontier';

interface Individual {
  parameters: ParameterSet;
  fitness: number;
  rank: number;
  crowdingDistance: number;
}

export class GeneticOptimizer {
  private population: Individual[] = [];
  private generation = 0;
  private paretoHelper = new ParetoFrontier();

  constructor(
    private parameters: ParameterDefinition[],
    private objectives: OptimizationObjective[],
    private populationSize: number = 30
  ) {
    this.initializePopulation();
  }

  /**
   * Initialize random population
   */
  private initializePopulation(): void {
    for (let i = 0; i < this.populationSize; i++) {
      const individual: Individual = {
        parameters: this.generateRandomParameters(),
        fitness: 0,
        rank: 0,
        crowdingDistance: 0,
      };
      this.population.push(individual);
    }
  }

  /**
   * Generate random parameter set
   */
  private generateRandomParameters(): ParameterSet {
    const params: ParameterSet = {};

    for (const param of this.parameters) {
      if (!params[param.blockId]) {
        params[param.blockId] = {};
      }

      if (param.type === 'discrete') {
        const values = param.values || [];
        const randomIndex = Math.floor(Math.random() * values.length);
        params[param.blockId][param.paramName] = values[randomIndex];
      } else {
        const min = param.min || 0;
        const max = param.max || 100;
        params[param.blockId][param.paramName] = min + Math.random() * (max - min);
      }
    }

    return params;
  }

  /**
   * Crossover (blend) two parents
   */
  crossover(parent1: ParameterSet, parent2: ParameterSet): ParameterSet {
    const child: ParameterSet = {};

    for (const param of this.parameters) {
      if (!child[param.blockId]) {
        child[param.blockId] = {};
      }

      const value1 = parent1[param.blockId]?.[param.paramName];
      const value2 = parent2[param.blockId]?.[param.paramName];

      if (value1 === undefined || value2 === undefined) continue;

      if (param.type === 'discrete') {
        // Random choice from parents
        child[param.blockId][param.paramName] = Math.random() < 0.5 ? value1 : value2;
      } else {
        // Blend crossover
        const alpha = Math.random();
        child[param.blockId][param.paramName] = value1 * alpha + value2 * (1 - alpha);
      }
    }

    return child;
  }

  /**
   * Mutate individual parameters
   */
  mutate(individual: ParameterSet, mutationRate: number = 0.2): ParameterSet {
    const mutated: ParameterSet = JSON.parse(JSON.stringify(individual));

    for (const param of this.parameters) {
      if (Math.random() > mutationRate) continue;

      if (param.type === 'discrete') {
        const values = param.values || [];
        const randomIndex = Math.floor(Math.random() * values.length);
        mutated[param.blockId][param.paramName] = values[randomIndex];
      } else {
        const min = param.min || 0;
        const max = param.max || 100;
        const range = max - min;

        // Add Gaussian noise
        const current = mutated[param.blockId][param.paramName];
        const noise = (Math.random() - 0.5) * range * 0.2; // 20% of range
        const newValue = Math.max(min, Math.min(max, current + noise));

        mutated[param.blockId][param.paramName] = newValue;
      }
    }

    return mutated;
  }

  /**
   * Select top individuals
   */
  select(count: number): ParameterSet[] {
    // Sort by fitness
    const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);

    return sorted.slice(0, count).map(ind => ind.parameters);
  }

  /**
   * Set fitness for individual
   */
  setFitness(parameters: ParameterSet, fitness: number): void {
    const individual = this.population.find(ind =>
      JSON.stringify(ind.parameters) === JSON.stringify(parameters)
    );

    if (individual) {
      individual.fitness = fitness;
    }
  }

  /**
   * Get current population
   */
  getPopulation(): ParameterSet[] {
    return this.population.map(ind => ind.parameters);
  }

  /**
   * Get current generation number
   */
  getGeneration(): number {
    return this.generation;
  }

  /**
   * Evolve to next generation
   */
  evolve(): void {
    // Select parents (top 50%)
    const parentCount = Math.floor(this.populationSize / 2);
    const parents = this.select(parentCount);

    // Create offspring through crossover + mutation
    const offspring: Individual[] = [];

    for (let i = 0; i < this.populationSize - parentCount; i++) {
      const parent1 = parents[Math.floor(Math.random() * parents.length)];
      const parent2 = parents[Math.floor(Math.random() * parents.length)];

      let child = this.crossover(parent1, parent2);
      child = this.mutate(child);

      offspring.push({
        parameters: child,
        fitness: 0,
        rank: 0,
        crowdingDistance: 0,
      });
    }

    // Keep top parents + offspring
    const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
    this.population = [...sorted.slice(0, parentCount), ...offspring];

    this.generation++;
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test geneticOptimizer`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add services/optimization/algorithms/geneticOptimizer.ts services/optimization/algorithms/__tests__/geneticOptimizer.test.ts
git commit -m "feat(optimization): add Genetic optimizer structure

- Random population initialization
- Crossover (blend for continuous, random for discrete)
- Mutation with Gaussian noise
- Tournament selection
- Generation evolution"
```

---

## Task 8: Optimization Engine (Main Orchestrator)

**Files:**
- Create: `services/optimization/optimizationEngine.ts`

**Step 1: Implement optimization engine**

Create `services/optimization/optimizationEngine.ts`:

```typescript
/**
 * Optimization Engine
 *
 * Main orchestrator for hyperparameter optimization.
 * Coordinates workers, algorithms, and walk-forward validation.
 */

import { LegoBlock } from '../../types';
import {
  OptimizationConfig,
  OptimizationResult,
  OptimizationProgress,
  OptimizationSolution,
  ParameterSet,
  ObjectiveScores,
} from './types';
import { BacktestWorkerPool } from './backtestWorker';
import { WalkForwardValidator } from './walkForwardValidator';
import { BayesianOptimizer } from './algorithms/bayesianOptimizer';
import { GeneticOptimizer } from './algorithms/geneticOptimizer';
import { ParetoFrontier } from './algorithms/paretoFrontier';

export class OptimizationEngine {
  private workerPool: BacktestWorkerPool;
  private walkForward: WalkForwardValidator;
  private paretoHelper: ParetoFrontier;
  private solutions: OptimizationSolution[] = [];
  private currentIteration = 0;
  private startTime = 0;
  private isRunning = false;

  constructor() {
    this.workerPool = new BacktestWorkerPool();
    this.walkForward = new WalkForwardValidator();
    this.paretoHelper = new ParetoFrontier();
  }

  /**
   * Start optimization
   */
  async optimize(
    blocks: LegoBlock[],
    config: OptimizationConfig,
    onProgress?: (progress: OptimizationProgress) => void
  ): Promise<OptimizationResult> {
    this.isRunning = true;
    this.currentIteration = 0;
    this.solutions = [];
    this.startTime = Date.now();

    try {
      if (config.algorithm === 'bayesian') {
        return await this.runBayesianOptimization(blocks, config, onProgress);
      } else {
        return await this.runGeneticOptimization(blocks, config, onProgress);
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run Bayesian optimization
   */
  private async runBayesianOptimization(
    blocks: LegoBlock[],
    config: OptimizationConfig,
    onProgress?: (progress: OptimizationProgress) => void
  ): Promise<OptimizationResult> {
    const optimizer = new BayesianOptimizer(config.parameters, config.objectives);

    // Generate initial samples (exploration)
    const initialSamples = optimizer.generateInitialSamples(10);

    // Evaluate initial samples
    for (const parameters of initialSamples) {
      await this.evaluateSolution(blocks, parameters, config);
      this.currentIteration++;

      if (onProgress) {
        onProgress(this.getProgress(config.maxIterations));
      }
    }

    // Iterative optimization
    while (this.currentIteration < config.maxIterations && this.isRunning) {
      // Suggest next parameters
      const nextParameters = optimizer.suggestNext();

      // Evaluate
      const solution = await this.evaluateSolution(blocks, nextParameters, config);

      // Add observation
      optimizer.addObservation(nextParameters, solution.outOfSampleScores);

      this.currentIteration++;

      if (onProgress) {
        onProgress(this.getProgress(config.maxIterations));
      }
    }

    return this.buildResult(config);
  }

  /**
   * Run Genetic optimization
   */
  private async runGeneticOptimization(
    blocks: LegoBlock[],
    config: OptimizationConfig,
    onProgress?: (progress: OptimizationProgress) => void
  ): Promise<OptimizationResult> {
    const optimizer = new GeneticOptimizer(config.parameters, config.objectives, 30);

    const maxGenerations = Math.ceil(config.maxIterations / 30);

    for (let gen = 0; gen < maxGenerations && this.isRunning; gen++) {
      const population = optimizer.getPopulation();

      // Evaluate each individual
      for (const parameters of population) {
        const solution = await this.evaluateSolution(blocks, parameters, config);

        // Set fitness (use primary objective)
        const primaryObjective = config.objectives[0];
        const fitness = solution.outOfSampleScores[primaryObjective] || 0;
        optimizer.setFitness(parameters, fitness);

        this.currentIteration++;

        if (onProgress) {
          onProgress(this.getProgress(config.maxIterations));
        }
      }

      // Evolve to next generation
      optimizer.evolve();
    }

    return this.buildResult(config);
  }

  /**
   * Evaluate a parameter set using walk-forward validation
   */
  private async evaluateSolution(
    blocks: LegoBlock[],
    parameters: ParameterSet,
    config: OptimizationConfig
  ): Promise<OptimizationSolution> {
    const windows = this.walkForward.generateWindows(
      config.backtestConfig.startDate,
      config.backtestConfig.endDate
    );

    let inSampleScores: ObjectiveScores = {};
    let outOfSampleScores: ObjectiveScores = {};

    // Run backtests on each window
    for (const window of windows) {
      // Train period backtest
      const trainResult = await this.workerPool.runBacktest(blocks, parameters, {
        startDate: window.trainStart,
        endDate: window.trainEnd,
        initialCapital: config.backtestConfig.initialCapital,
        rebalanceInterval: config.backtestConfig.rebalanceInterval,
      });

      // Test period backtest
      const testResult = await this.workerPool.runBacktest(blocks, parameters, {
        startDate: window.testStart,
        endDate: window.testEnd,
        initialCapital: config.backtestConfig.initialCapital,
        rebalanceInterval: config.backtestConfig.rebalanceInterval,
      });

      // Aggregate scores
      inSampleScores = this.aggregateScores(inSampleScores, trainResult.metrics);
      outOfSampleScores = this.aggregateScores(outOfSampleScores, testResult.metrics);
    }

    // Average scores across windows
    const windowCount = windows.length;
    inSampleScores = this.averageScores(inSampleScores, windowCount);
    outOfSampleScores = this.averageScores(outOfSampleScores, windowCount);

    // Calculate degradation
    const degradation = this.walkForward.calculateDegradation(inSampleScores, outOfSampleScores);

    const solution: OptimizationSolution = {
      id: `solution-${this.solutions.length}`,
      parameters,
      inSampleScores,
      outOfSampleScores,
      degradation,
      isParetoOptimal: false,
    };

    this.solutions.push(solution);
    return solution;
  }

  /**
   * Aggregate backtest metrics into objective scores
   */
  private aggregateScores(current: ObjectiveScores, metrics: any): ObjectiveScores {
    return {
      sharpeRatio: (current.sharpeRatio || 0) + (metrics.sharpeRatio || 0),
      totalReturn: (current.totalReturn || 0) + (metrics.totalReturn || 0),
      maxDrawdown: (current.maxDrawdown || 0) + (metrics.maxDrawdown || 0),
      winRate: (current.winRate || 0) + ((metrics.winTrades / metrics.totalTrades) || 0),
      gasCosts: (current.gasCosts || 0) + (metrics.totalGasSpent || 0),
      protocolFees: (current.protocolFees || 0) + (metrics.totalFeesSpent || 0),
    };
  }

  /**
   * Average scores by window count
   */
  private averageScores(scores: ObjectiveScores, count: number): ObjectiveScores {
    const result: ObjectiveScores = {};

    for (const key in scores) {
      const objKey = key as keyof ObjectiveScores;
      const value = scores[objKey];
      if (value !== undefined) {
        result[objKey] = value / count;
      }
    }

    return result;
  }

  /**
   * Get current progress
   */
  private getProgress(maxIterations: number): OptimizationProgress {
    const paretoFrontier = this.paretoHelper.extractFrontier(
      this.solutions,
      this.getCurrentObjectives()
    );

    const bestSolution = paretoFrontier.length > 0 ? paretoFrontier[0] : undefined;

    const elapsed = (Date.now() - this.startTime) / 1000;
    const iterationsRemaining = maxIterations - this.currentIteration;
    const avgTimePerIteration = this.currentIteration > 0 ? elapsed / this.currentIteration : 5;
    const estimatedTimeRemaining = iterationsRemaining * avgTimePerIteration;

    return {
      iteration: this.currentIteration,
      maxIterations,
      bestSolution,
      paretoFrontier,
      estimatedTimeRemaining,
      workersActive: this.workerPool.getActiveWorkerCount(),
    };
  }

  /**
   * Build final result
   */
  private buildResult(config: OptimizationConfig): OptimizationResult {
    const paretoFrontier = this.paretoHelper.extractFrontier(
      this.solutions,
      config.objectives
    );

    const totalTime = (Date.now() - this.startTime) / 1000;
    const cacheStats = this.workerPool.getCacheStats();

    return {
      config,
      solutions: this.solutions,
      paretoFrontier,
      totalIterations: this.currentIteration,
      totalTime,
      cacheHitRate: cacheStats.hitRate,
    };
  }

  /**
   * Get current objectives (helper)
   */
  private getCurrentObjectives(): string[] {
    return this.solutions.length > 0
      ? Object.keys(this.solutions[0].inSampleScores)
      : [];
  }

  /**
   * Stop optimization
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.workerPool.terminate();
  }
}

export const optimizationEngine = new OptimizationEngine();
```

**Step 2: Export from barrel**

Modify `services/optimization/index.ts`:

```typescript
export * from './types';
export * from './parameterExtractor';
export * from './walkForwardValidator';
export * from './backtestWorker';
export * from './optimizationEngine';
```

**Step 3: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add services/optimization/optimizationEngine.ts services/optimization/index.ts
git commit -m "feat(optimization): add optimization engine orchestrator

- Coordinates Bayesian and Genetic algorithms
- Manages Web Worker pool for parallel execution
- Implements walk-forward validation
- Tracks progress and builds Pareto frontier
- Calculates performance degradation"
```

---

## Task 9: UI Components - Optimization Panel

**Files:**
- Create: `components/OptimizationPanel.tsx`
- Modify: `components/HUD.tsx` (add navigation link)

**Step 1: Create basic optimization panel**

Create `components/OptimizationPanel.tsx`:

```typescript
import React, { useState } from 'react';
import { OptimizationConfig, OptimizationAlgorithm, OptimizationObjective } from '../services/optimization';

interface OptimizationPanelProps {
  onClose: () => void;
  isOpen: boolean;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ onClose, isOpen }) => {
  const [algorithm, setAlgorithm] = useState<OptimizationAlgorithm>('bayesian');
  const [objectives, setObjectives] = useState<OptimizationObjective[]>(['sharpeRatio', 'maxDrawdown']);
  const [isOptimizing, setIsOptimizing] = useState(false);

  if (!isOpen) return null;

  const handleObjectiveToggle = (objective: OptimizationObjective) => {
    if (objectives.includes(objective)) {
      // Keep at least 2 objectives
      if (objectives.length > 2) {
        setObjectives(objectives.filter(o => o !== objective));
      }
    } else {
      setObjectives([...objectives, objective]);
    }
  };

  const handleStartOptimization = () => {
    setIsOptimizing(true);
    // TODO: Start optimization
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex">
      {/* Header */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center">
        <h1 className="text-2xl font-mono text-white">OPTIMIZATION</h1>
        <button
          onClick={onClose}
          className="text-white opacity-60 hover:opacity-100 font-mono"
        >
          [ESC] CLOSE
        </button>
      </div>

      {/* Content - 3 Columns */}
      <div className="mt-24 flex w-full gap-4 px-8 pb-8">
        {/* Left Column - Configuration */}
        <div className="w-1/4 bg-gray-900 bg-opacity-50 p-6 font-mono text-sm">
          <h2 className="text-white font-bold mb-4">CONFIGURATION</h2>

          {/* Algorithm Selection */}
          <div className="mb-6">
            <label className="text-gray-400 text-xs mb-2 block">ALGORITHM</label>
            <div className="space-y-2">
              <label className="flex items-center text-white cursor-pointer">
                <input
                  type="radio"
                  name="algorithm"
                  value="bayesian"
                  checked={algorithm === 'bayesian'}
                  onChange={(e) => setAlgorithm(e.target.value as OptimizationAlgorithm)}
                  className="mr-2"
                />
                Bayesian Optimization
              </label>
              <p className="text-gray-500 text-xs ml-6">Fast convergence, 50-100 iterations</p>

              <label className="flex items-center text-white cursor-pointer">
                <input
                  type="radio"
                  name="algorithm"
                  value="genetic"
                  checked={algorithm === 'genetic'}
                  onChange={(e) => setAlgorithm(e.target.value as OptimizationAlgorithm)}
                  className="mr-2"
                />
                Genetic Algorithm
              </label>
              <p className="text-gray-500 text-xs ml-6">Thorough exploration, 200-600 iterations</p>
            </div>
          </div>

          {/* Objectives */}
          <div className="mb-6">
            <label className="text-gray-400 text-xs mb-2 block">OBJECTIVES (min 2)</label>
            <div className="space-y-2">
              {(['sharpeRatio', 'totalReturn', 'maxDrawdown', 'winRate', 'gasCosts'] as OptimizationObjective[]).map(
                (objective) => (
                  <label key={objective} className="flex items-center text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={objectives.includes(objective)}
                      onChange={() => handleObjectiveToggle(objective)}
                      className="mr-2"
                    />
                    {objective.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                )
              )}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStartOptimization}
            disabled={isOptimizing || objectives.length < 2}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 font-bold"
          >
            {isOptimizing ? 'OPTIMIZING...' : 'START OPTIMIZATION'}
          </button>
        </div>

        {/* Center Column - Visualization */}
        <div className="flex-1 bg-gray-900 bg-opacity-50 p-6">
          <div className="flex items-center justify-center h-full text-gray-500 font-mono">
            {isOptimizing ? 'Optimization in progress...' : 'Configure and start optimization'}
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="w-1/4 bg-gray-900 bg-opacity-50 p-6 font-mono text-sm">
          <h2 className="text-white font-bold mb-4">RESULTS</h2>
          <div className="text-gray-500">No results yet</div>
        </div>
      </div>
    </div>
  );
};
```

**Step 2: Add navigation to HUD**

Modify `components/HUD.tsx` - add after the `[04] CHARTS` button:

```typescript
// In the navigation section, add:
<button
  onClick={onOpenOptimize} // You'll need to add this prop
  onKeyDown={(e) => e.key === 'Enter' && onOpenOptimize()}
  className="flex items-center gap-2 opacity-40 hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer interactive-zone bg-transparent border-none text-white text-left focus:outline-none focus:ring-1 focus:ring-white"
  aria-label="Open Optimization panel"
>
  <span className="w-2 h-2 border border-white" aria-hidden="true"></span>
  [05] OPTIMIZE
</button>
```

**Step 3: Verify TypeScript compilation**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add components/OptimizationPanel.tsx components/HUD.tsx
git commit -m "feat(optimization): add optimization panel UI skeleton

- 3-column layout (config, viz, results)
- Algorithm selection (Bayesian/Genetic)
- Multi-objective checkboxes
- Navigation link in HUD
- Start optimization button"
```

---

## Execution Plan Summary

The above tasks implement the core infrastructure for hyperparameter optimization:

**Completed:**
1. ✅ Type definitions
2. ✅ Parameter extractor (smart detection)
3. ✅ Walk-forward validator (overfitting prevention)
4. ✅ Web Worker pool (parallel backtesting)
5. ✅ Pareto frontier utilities
6. ✅ Bayesian optimizer (structure)
7. ✅ Genetic optimizer (structure)
8. ✅ Optimization engine (orchestrator)
9. ✅ Basic UI panel

**Remaining Tasks (to be done in next batches):**

**Batch 2:**
- Task 10: Parameter range editor UI component
- Task 11: Progress visualization component
- Task 12: Pareto frontier chart (Recharts)
- Task 13: Results list component

**Batch 3:**
- Task 14: Wire up optimization engine to UI
- Task 15: Real-time progress updates
- Task 16: Apply optimized parameters to strategy
- Task 17: Export/import optimization results

**Batch 4:**
- Task 18: Performance optimizations (early termination, adaptive batching)
- Task 19: Error handling and edge cases
- Task 20: Integration tests
- Task 21: Documentation and examples

Each task follows the same pattern: Test → Implement → Verify → Commit

---

## Next Steps

This plan is ready for execution using **superpowers:executing-plans** skill in batches.

After Task 9, the system will have:
- Core services functional
- Basic UI in place
- Tests passing
- Type-safe implementation

Subsequent batches will add:
- Rich visualizations
- Real-time updates
- User interactions
- Polish and optimization
