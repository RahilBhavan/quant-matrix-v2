# Hyper-Parameter Optimization Feature Design

**Date:** 2025-12-28
**Status:** Design Complete
**Scope:** Add ML-powered parameter optimization to DeFi strategy builder

## Overview

Enable users to automatically discover optimal strategy parameters through intelligent search algorithms, eliminating guesswork and significantly improving strategy performance. Instead of manually testing "RSI < 30", the system will explore thousands of parameter combinations to recommend "RSI < 32.5" based on historical backtesting.

## Goals

1. **Eliminate Parameter Guesswork**: Automatically find optimal values for technical indicators and DeFi-specific parameters
2. **Prevent Overfitting**: Use walk-forward validation to ensure parameters work on unseen data
3. **Show Trade-offs**: Visualize Pareto frontier to help users understand return vs risk trade-offs
4. **Keep It Fast**: Client-side optimization with Web Workers, results in 5-30 minutes
5. **Stay Educational**: Real-time visualization showing how optimization explores the parameter space

## Architecture Overview

### Core Components

#### 1. OptimizationEngine
Main orchestrator that manages the optimization lifecycle.

**Responsibilities:**
- Initialize Web Worker pool
- Coordinate between Bayesian and Genetic algorithms
- Manage optimization state (running, paused, complete)
- Aggregate results and maintain Pareto frontier
- Stream progress updates to UI

#### 2. ParameterExtractor
Analyzes strategy blocks and identifies optimizable parameters.

**Responsibilities:**
- Parse each block's type and params
- Extract optimizable parameters with reasonable ranges
- Handle continuous (RSI threshold), discrete (fee tiers), and percentage parameters
- Provide smart defaults based on parameter types

#### 3. BacktestWorkerPool
Manages parallel backtest execution in Web Workers.

**Responsibilities:**
- Spawn 4-8 workers based on CPU cores
- Distribute parameter combinations across workers
- Handle worker communication (postMessage/onMessage)
- Aggregate backtest results
- Implement result memoization (cache by parameter hash)

#### 4. WalkForwardValidator
Implements walk-forward optimization for overfitting prevention.

**Responsibilities:**
- Split date range into overlapping train/test windows
- Run optimization on train periods only
- Apply best parameters to test periods
- Calculate in-sample vs out-of-sample metrics
- Detect overfitting (>60% performance degradation)

### Data Flow

```
User selects strategy
  ↓
ParameterExtractor identifies 5-10 key parameters
  ↓
User picks algorithm (Bayesian/Genetic) + objectives
  ↓
OptimizationEngine generates parameter combinations
  ↓
BacktestWorkerPool runs parallel backtests
  ↓
WalkForwardValidator validates across time windows
  ↓
Results aggregate to build Pareto frontier
  ↓
User selects point on frontier
  ↓
Parameters apply to strategy blocks
```

### Integration with Existing Code

- Reuses `services/defiBacktestEngine.ts` (no changes needed)
- Wraps backtest engine in Web Workers
- Reads strategy from current `LegoBlock[]` state
- Updates block `params` with optimized values
- Stores optimization history in localStorage

## Smart Parameter Detection

### Parameter Extraction Logic

**DeFi Block Parameters:**

| Block Type | Parameters | Range/Values |
|------------|------------|--------------|
| UNISWAP_SWAP | amount, slippage | amount: 10-100% capital, slippage: 0.1-2.0% |
| AAVE_SUPPLY | supplyAmount | 10-100% of available capital |
| AAVE_BORROW | borrowAmount, collateralFactor | borrowAmount: variable, LTV: 0.5-0.85 |
| CREATE_LP_POSITION | amount, feeTier | amount: variable, feeTier: [500, 3000, 10000] |
| IF_CONDITION | threshold (parsed from condition) | Depends on indicator (RSI: 20-40, MA: varies) |
| STOP_LOSS | threshold | -5% to -25% |
| POSITION_SIZE | percentage | 10-50% of capital |

**Strategy-Level Parameters:**

| Parameter | Range | Notes |
|-----------|-------|-------|
| rebalanceInterval | 1-168 hours | How often to execute strategy |
| initialCapital | User-defined | Usually fixed, not optimized |

### Parameter Types

1. **Continuous**: RSI threshold, slippage (decimal ranges)
2. **Discrete**: Fee tiers, time intervals (specific valid values)
3. **Percentage**: Position sizes, capital allocation (0-100%)

### Smart Defaults

System suggests reasonable ranges based on parameter semantics:
- Slippage: 0.3-1.5% (protects from extreme slippage)
- Stop loss: -10% to -20% (typical risk management)
- Position size: 15-35% (diversification)
- RSI oversold: 25-35 (classic range)

## Optimization Algorithms

### Algorithm Selection

Users manually choose between:

**Bayesian Optimization:**
- **Pros**: Fast convergence (50-100 iterations), efficient for continuous parameters
- **Cons**: Less effective for high-dimensional spaces (>10 parameters)
- **Best for**: Strategies with 3-8 parameters, users wanting quick results (5-10 min)
- **Use case**: "I need decent parameters quickly"

**Genetic Algorithm:**
- **Pros**: Better global exploration, handles mixed parameter types well
- **Cons**: Slower, requires more iterations (200-600)
- **Best for**: Complex strategies with 8+ parameters, thorough exploration (15-30 min)
- **Use case**: "I want to explore the full parameter space"

### Bayesian Optimization Details

**Implementation:**
- Use Gaussian Process to model objective function
- Acquisition function: Expected Improvement
- Initial exploration: 10 random parameter combinations
- Iterative refinement: 40-90 more iterations

**Process:**
1. Start with random samples (exploration phase)
2. Build probabilistic model of parameter → performance mapping
3. Use acquisition function to suggest next promising parameters
4. Update model with new results
5. Repeat until convergence or iteration limit

### Genetic Algorithm Details

**Implementation:**
- Custom NSGA-II (Non-dominated Sorting Genetic Algorithm II)
- Population size: 20-30 individuals
- Generations: 10-20
- Selection: Tournament selection (top 50%)
- Crossover: Blend crossover for continuous, uniform for discrete
- Mutation rate: 10-20% of parameters

**Process:**
1. Initialize random population (20-30 parameter sets)
2. Evaluate fitness via backtesting
3. Non-dominated sorting for multi-objective ranking
4. Selection: Keep top 50% based on Pareto rank + crowding distance
5. Crossover: Blend pairs of good individuals
6. Mutation: Randomly perturb parameters for diversity
7. Repeat for 10-20 generations

## Multi-Objective Optimization

### Objective Functions

Users can optimize for multiple goals simultaneously:

**Available Objectives:**
1. **Maximize Sharpe Ratio** (risk-adjusted returns)
2. **Maximize Total Return** (absolute profit)
3. **Minimize Max Drawdown** (risk management)
4. **Maximize Win Rate** (consistency)
5. **Minimize Gas Costs** (cost efficiency)
6. **Minimize Protocol Fees** (cost efficiency)

Users must select at least 2 objectives.

### Pareto Optimization

**Pareto Dominance:**
- Solution A dominates B if A is ≥ B on all objectives AND > B on at least one
- Non-dominated solutions form the Pareto frontier
- Frontier represents optimal trade-off curve

**Example Trade-offs:**
- Higher returns ↔ Higher drawdown
- Lower gas costs ↔ Fewer trades ↔ Lower returns
- Higher win rate ↔ More conservative ↔ Lower total returns

### Multi-Objective Implementation

**Bayesian Optimization:**
- Use Expected Hypervolume Improvement (EHVI) acquisition function
- Balances exploration across all objectives

**Genetic Algorithm:**
- NSGA-II naturally handles multiple objectives
- Fitness based on Pareto rank (primary) + crowding distance (secondary)
- Crowding distance maintains diversity along frontier

### Pareto Frontier Visualization

**Scatter Plot (2D):**
- X-axis: Primary objective (e.g., Sharpe Ratio)
- Y-axis: Secondary objective (e.g., Max Drawdown as negative)
- Frontier points: Green highlights
- Dominated points: Gray/transparent
- Interactive: Hover to see full metrics, click to select

**User Interaction:**
1. User sees trade-off curve clearly
2. Hovers over point → tooltip shows all parameters + metrics
3. Clicks point → preview equity curve
4. Confirms selection → parameters apply to strategy

## Walk-Forward Optimization

### Why Walk-Forward?

Traditional optimization tests parameters on the same data used to find them, leading to overfitting. Walk-forward validation ensures parameters work on unseen future data.

### Window Configuration

**Default Settings:**
- **Optimization Window**: 90 days (training period)
- **Test Window**: 30 days (out-of-sample validation)
- **Step Size**: 30 days (window slide amount)
- **Window Type**: Rolling (fixed lookback, adapts to market changes)

**Example Timeline:**
```
Jan-Mar: optimize → test on Apr
Feb-Apr: optimize → test on May
Mar-May: optimize → test on Jun
Apr-Jun: optimize → test on Jul
... (continue rolling)
```

### Walk-Forward Process

For each window:
1. Run optimization algorithm on 90-day training period
2. Find best parameters for that period
3. Apply those parameters to 30-day test period (no re-optimization)
4. Record test period performance

Final metrics = aggregation of all test period results.

### Metrics Reported

**In-Sample (Training Period):**
- Shows best-case performance during optimization
- Useful for understanding optimization effectiveness

**Out-of-Sample (Test Period):**
- Realistic expected performance on unseen data
- What users should actually expect

**Performance Degradation:**
- `(In-Sample - Out-of-Sample) / In-Sample * 100%`
- Typical: 20-40% degradation is normal
- Warning if >60% degradation (likely overfit)

### Visual Indicators

**Equity Curve:**
- Training periods: Blue shaded regions
- Test periods: Green shaded regions
- Clear boundaries between train/test

**Warning System:**
- If test performance drops >60% vs training: Display overfitting warning
- Suggest: Simplify strategy, reduce parameter count, increase training window

## UI Components & User Flow

### New Navigation Item

Add `[05] OPTIMIZE` to bottom-left navigation menu (after `[04] CHARTS`).

Clicking opens full-screen optimization panel overlay.

### Optimization Panel Layout

**3-Column Design:**

#### Left Column - Configuration (25% width)

**Algorithm Selection:**
```
○ Bayesian Optimization
  ℹ Fast convergence, efficient for 3-8 parameters

○ Genetic Algorithm
  ℹ Thorough exploration, better for 8+ parameters
```

**Objectives (Multi-select checkboxes):**
```
☑ Maximize Sharpe Ratio
☑ Minimize Max Drawdown
☐ Maximize Total Return
☐ Maximize Win Rate
☐ Minimize Gas Costs
```
*At least 2 required*

**Detected Parameters:**
```
RSI Threshold
  Min: [25] Max: [40]

Position Size %
  Min: [10] Max: [50]

Slippage Tolerance
  Min: [0.3] Max: [1.5]

... (5-10 total)
```
*Auto-populated, user can adjust ranges*

**Date Range:**
- Inherited from current strategy
- User can adjust for optimization

**[Start Optimization]** - Large primary button

#### Center Column - Live Visualization (50% width)

**Top - Progress Bar:**
```
Iteration 45/100 | Est. 3 min remaining
[████████████░░░░░░░░] 45%
Web Workers: 4/4 active
```

**Middle - Pareto Frontier:**
- Large scatter plot (600x400px)
- Updates in real-time as new solutions discovered
- Axes: Primary objective (X) vs Secondary objective (Y)
- Points: Green (frontier), Gray (dominated)
- Interactive hover/click

**Bottom - Current Best Preview:**
- Thumbnail equity curve of current best solution
- Key metrics display: Sharpe, Drawdown, Return
- Updates as better solutions found

#### Right Column - Results (25% width)

**Top 10 Parameter Sets:**

Scrollable ranked list:

```
#1 - Sharpe: 2.45 | Drawdown: -12.3%
  RSI: 32.5 | Position: 25% | Slippage: 0.8%
  In-Sample: 2.67 | Out-of-Sample: 2.45 (-8%)
  [Apply to Strategy]

#2 - Sharpe: 2.38 | Drawdown: -10.1%
  RSI: 30.0 | Position: 20% | Slippage: 1.0%
  In-Sample: 2.71 | Out-of-Sample: 2.38 (-12%)
  [Apply to Strategy]

... (8 more)
```

**Bottom:**
- `[Export All Results]` - Download JSON

### User Flow

1. User builds strategy with DeFi blocks
2. Clicks `[05] OPTIMIZE` in navigation
3. Reviews auto-detected parameters (adjusts ranges if needed)
4. Selects algorithm (Bayesian/Genetic)
5. Checks 2+ optimization objectives
6. Clicks `[Start Optimization]`
7. Watches real-time progress and Pareto frontier building
8. After completion, explores results:
   - Hover over frontier points
   - Click to preview equity curve
   - Review in-sample vs out-of-sample metrics
9. Selects desired parameter set
10. Clicks `[Apply to Strategy]`
11. Parameters update in block params
12. User can run backtest or execute live with optimized parameters

### During Optimization

- Strategy editing disabled
- Pulsing animation on progress bar
- Pareto frontier updates every 5 new solutions
- Worker status indicator (green = active)
- `[Stop Optimization]` button available

## Technical Implementation

### File Structure

```
services/
├── optimization/
│   ├── optimizationEngine.ts          # Main orchestrator (300 lines)
│   ├── parameterExtractor.ts          # Smart parameter detection (200 lines)
│   ├── algorithms/
│   │   ├── bayesianOptimizer.ts       # Bayesian optimization (250 lines)
│   │   ├── geneticOptimizer.ts        # NSGA-II implementation (350 lines)
│   │   └── paretoFrontier.ts          # Multi-objective utilities (150 lines)
│   ├── walkForwardValidator.ts        # Window splitting & validation (200 lines)
│   └── backtestWorker.ts              # Web Worker wrapper (100 lines)
├── optimization.worker.ts              # Worker entry point (50 lines)

components/
├── OptimizationPanel.tsx               # Main panel layout (300 lines)
├── optimization/
│   ├── AlgorithmSelector.tsx          # Algorithm choice UI (100 lines)
│   ├── ObjectiveSelector.tsx          # Objective checkboxes (80 lines)
│   ├── ParameterRangeEditor.tsx       # Parameter range inputs (150 lines)
│   ├── ParetoFrontierChart.tsx        # Scatter plot (200 lines)
│   ├── OptimizationProgress.tsx       # Progress bar + status (120 lines)
│   └── ResultsList.tsx                # Top 10 results list (180 lines)
```

### Web Worker Architecture

**Worker Pool Setup:**
```typescript
const workerCount = Math.min(navigator.hardwareConcurrency || 4, 8);
const workers: Worker[] = [];

for (let i = 0; i < workerCount; i++) {
  const worker = new Worker(new URL('./optimization.worker.ts', import.meta.url));
  worker.onmessage = handleWorkerResult;
  workers.push(worker);
}
```

**Task Distribution:**
```typescript
// Main thread distributes parameter combinations
workers[i % workers.length].postMessage({
  type: 'BACKTEST',
  params: parameterCombination,
  config: backtestConfig,
  blocks: strategyBlocks
});
```

**Worker Implementation:**
```typescript
// optimization.worker.ts
import { runDeFiBacktest } from './services/defiBacktestEngine';

self.onmessage = async (e) => {
  const { params, config, blocks } = e.data;

  // Apply params to blocks
  const updatedBlocks = applyParamsToBlocks(blocks, params);

  // Run backtest
  const result = await runDeFiBacktest({
    blocks: updatedBlocks,
    ...config
  });

  // Return result
  self.postMessage({
    params,
    metrics: result.metrics
  });
};
```

### Key Libraries

**None for core algorithms** - Custom lightweight implementations for:
- Bayesian optimization (~250 lines)
- Genetic algorithm (~350 lines)
- Pareto frontier utilities (~150 lines)

**Existing Libraries:**
- **Recharts** (already in project) - Pareto frontier scatter plot
- **Web Workers API** - Native browser API

### Performance Optimizations

#### 1. Memoization
```typescript
const backtestCache = new Map<string, BacktestResult>();

function getCacheKey(params: ParameterSet): string {
  return JSON.stringify(params);
}

async function runBacktestWithCache(params: ParameterSet) {
  const key = getCacheKey(params);
  if (backtestCache.has(key)) {
    return backtestCache.get(key);
  }

  const result = await runBacktest(params);
  backtestCache.set(key, result);
  return result;
}
```

#### 2. Early Termination
```typescript
// If no improvement in 20 iterations
if (iterationsSinceImprovement > 20) {
  showDialog("No improvement in 20 iterations. Stop optimization?");
}
```

#### 3. Adaptive Batch Sizing
```typescript
let batchSize = 5; // Start small

function updateBatchSize() {
  if (completedIterations > 20) {
    batchSize = 20; // Increase after warmup
  }
}
```

#### 4. Result Streaming
```typescript
// Update UI incrementally, not just at end
if (newSolutionsCount % 5 === 0) {
  updateParetoFrontier();
  updateBestResult();
}
```

### Integration Points

**Reading Current Strategy:**
```typescript
const currentBlocks = useStrategyStore(state => state.blocks);
const parameters = parameterExtractor.extract(currentBlocks);
```

**Applying Optimized Parameters:**
```typescript
function applyOptimizedParams(params: ParameterSet) {
  const updatedBlocks = blocks.map(block => {
    const blockParams = params[block.id];
    if (blockParams) {
      return { ...block, params: { ...block.params, ...blockParams } };
    }
    return block;
  });

  updateStrategy(updatedBlocks);
}
```

**Storing Optimization History:**
```typescript
// localStorage for persistence
const optimizationHistory = {
  timestamp: Date.now(),
  algorithm: 'bayesian',
  objectives: ['sharpe', 'drawdown'],
  results: paretoFrontier,
  selectedParams: bestParams
};

localStorage.setItem(
  `optimization_${strategyId}_${timestamp}`,
  JSON.stringify(optimizationHistory)
);
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
- Web Worker pool setup
- Parameter extraction service
- Walk-forward validator
- Basic UI skeleton

### Phase 2: Bayesian Algorithm (Week 2)
- Gaussian Process implementation
- Expected Improvement acquisition
- Integration with backtest engine
- Basic progress visualization

### Phase 3: Genetic Algorithm (Week 3)
- NSGA-II implementation
- Multi-objective ranking
- Crossover/mutation operators
- Population evolution tracking

### Phase 4: UI & Visualization (Week 4)
- Pareto frontier chart (Recharts)
- Parameter range editor
- Results list with filtering
- Progress indicators

### Phase 5: Polish & Testing (Week 5)
- Performance optimizations (memoization, batching)
- Error handling & edge cases
- User testing & feedback
- Documentation

## Success Metrics

**User Success:**
- Users can find better parameters than manual guessing (>20% improvement in Sharpe ratio)
- Out-of-sample performance within 40% of in-sample (no overfitting)
- Optimization completes in <15 minutes for typical strategies

**Technical Success:**
- Web Workers utilize 80%+ of available CPU cores
- Cache hit rate >30% (avoid duplicate backtests)
- UI remains responsive during optimization (60fps)

**User Adoption:**
- >50% of users run at least one optimization
- Users apply optimized parameters to >70% of strategies

## Future Enhancements

**Phase 2 (Post-MVP):**
- Ensemble optimization (combine multiple algorithms)
- Parameter sensitivity analysis (which parameters matter most)
- Optimization presets ("Conservative", "Aggressive", "Balanced")
- Save/load optimization configurations
- Compare optimization runs side-by-side

**Phase 3 (Advanced):**
- Multi-period optimization (optimize for different market regimes)
- Constraint handling (e.g., "keep gas costs < $100")
- Transfer learning (use optimization results from similar strategies)
- Real-time optimization (continuously adapt parameters as new data arrives)

## Risks & Mitigations

**Risk 1: Browser Performance**
- **Issue**: Complex backtests may freeze browser
- **Mitigation**: Web Workers isolate computation, UI stays responsive; early termination if >30min

**Risk 2: Overfitting**
- **Issue**: Users trust optimized parameters too much
- **Mitigation**: Walk-forward validation shows realistic performance; warnings if degradation >60%

**Risk 3: User Confusion**
- **Issue**: Users don't understand Pareto frontier
- **Mitigation**: Tooltips, simple explanations, recommended point on frontier

**Risk 4: Parameter Space Too Large**
- **Issue**: 15+ parameters = slow convergence
- **Mitigation**: Smart parameter extraction limits to 5-10 key parameters; warn if >12

## Conclusion

This optimization feature transforms the platform from "manual parameter guessing" to "data-driven parameter discovery". By combining Bayesian and Genetic algorithms with walk-forward validation, users get:

1. **Better strategies** - Automatically discover optimal parameters
2. **Realistic expectations** - Out-of-sample validation prevents overfitting
3. **Understanding trade-offs** - Pareto frontier shows return vs risk clearly
4. **Fast results** - Client-side Web Workers deliver results in 5-30 minutes
5. **Educational experience** - Real-time visualization teaches optimization concepts

Total implementation effort: ~5 weeks, ~3,500 lines of code, zero external API dependencies.
