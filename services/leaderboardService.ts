/**
 * Leaderboard Service
 * 
 * Manages strategy rankings by Sharpe Ratio and fork functionality.
 * Creates a social ecosystem for strategy sharing and improvement.
 */

import { SavedStrategy, BacktestRecord } from '../types';
import {
    saveStrategy,
    loadStrategy,
    listStrategies,
    loadBacktestResults,
} from './persistenceService';
import { v4 as uuidv4 } from 'uuid';

// Ranked strategy with performance metrics
export interface RankedStrategy {
    strategy: SavedStrategy;
    rank: number;
    sharpeRatio: number;
    totalReturn: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    forkCount: number;
    parentId: string | null; // Original strategy if forked
    medal: '#1' | '#2' | '#3' | null;
}

// Fork tree node
export interface ForkNode {
    id: string;
    name: string;
    author: string;
    sharpeRatio: number;
    children: ForkNode[];
}

// Extended strategy with fork metadata
interface StrategyWithForkData extends SavedStrategy {
    forkOf?: string; // Parent strategy ID
    forkCount?: number;
    author?: string;
}

class LeaderboardService {
    private readonly FORK_METADATA_KEY = 'qm_fork_metadata';

    /**
     * Get all strategies ranked by Sharpe Ratio
     */
    getRankings(): RankedStrategy[] {
        const strategies = listStrategies();
        const forkMetadata = this.loadForkMetadata();

        // Get best backtest for each strategy
        const rankings: RankedStrategy[] = strategies.map(strategy => {
            const backtests = loadBacktestResults(strategy.id);
            const bestBacktest = this.getBestBacktest(backtests);
            const metadata = forkMetadata[strategy.id] || {};

            return {
                strategy,
                rank: 0, // Will be set after sorting
                sharpeRatio: bestBacktest?.result.metrics.sharpeRatio || 0,
                totalReturn: bestBacktest?.result.metrics.totalReturnPercent || 0,
                maxDrawdown: bestBacktest?.result.metrics.maxDrawdownPercent || 0,
                winRate: bestBacktest?.result.metrics.winRate || 0,
                totalTrades: bestBacktest?.result.metrics.totalTrades || 0,
                forkCount: metadata.forkCount || 0,
                parentId: metadata.forkOf || null,
                medal: null,
            };
        });

        // Sort by Sharpe Ratio (descending)
        rankings.sort((a, b) => b.sharpeRatio - a.sharpeRatio);

        // Assign ranks and medals
        rankings.forEach((entry, index) => {
            entry.rank = index + 1;
            if (index === 0) entry.medal = '#1';
            else if (index === 1) entry.medal = '#2';
            else if (index === 2) entry.medal = '#3';
        });

        return rankings;
    }

    /**
     * Get top N strategies
     */
    getTopStrategies(n: number = 10): RankedStrategy[] {
        return this.getRankings().slice(0, n);
    }

    /**
     * Fork a strategy (create a copy with attribution)
     */
    forkStrategy(strategyId: string, newName?: string): SavedStrategy | null {
        const original = loadStrategy(strategyId);
        if (!original) return null;

        // Create forked strategy
        const forkName = newName || `${original.name} (Fork)`;
        const forkedStrategy = saveStrategy(forkName, original.blocks);

        // Update fork metadata
        const metadata = this.loadForkMetadata();

        // Mark new strategy as fork
        metadata[forkedStrategy.id] = {
            forkOf: strategyId,
            forkCount: 0,
            author: 'You', // In production, use actual user ID
        };

        // Increment parent's fork count
        if (!metadata[strategyId]) {
            metadata[strategyId] = { forkCount: 0 };
        }
        metadata[strategyId].forkCount = (metadata[strategyId].forkCount || 0) + 1;

        this.saveForkMetadata(metadata);

        return forkedStrategy;
    }

    /**
     * Get fork history/tree for a strategy
     */
    getForkTree(strategyId: string): ForkNode | null {
        const strategy = loadStrategy(strategyId);
        if (!strategy) return null;

        const metadata = this.loadForkMetadata();
        const backtests = loadBacktestResults(strategyId);
        const bestBacktest = this.getBestBacktest(backtests);

        const root: ForkNode = {
            id: strategyId,
            name: strategy.name,
            author: metadata[strategyId]?.author || 'Unknown',
            sharpeRatio: bestBacktest?.result.metrics.sharpeRatio || 0,
            children: this.getChildForks(strategyId),
        };

        return root;
    }

    /**
     * Get all forks of a strategy
     */
    private getChildForks(parentId: string): ForkNode[] {
        const metadata = this.loadForkMetadata();
        const strategies = listStrategies();

        const children: ForkNode[] = [];

        for (const [id, data] of Object.entries(metadata)) {
            if (data.forkOf === parentId) {
                const strategy = strategies.find(s => s.id === id);
                if (strategy) {
                    const backtests = loadBacktestResults(id);
                    const bestBacktest = this.getBestBacktest(backtests);

                    children.push({
                        id,
                        name: strategy.name,
                        author: data.author || 'Unknown',
                        sharpeRatio: bestBacktest?.result.metrics.sharpeRatio || 0,
                        children: this.getChildForks(id), // Recursive
                    });
                }
            }
        }

        return children;
    }

    /**
     * Get the best backtest result (by Sharpe)
     */
    private getBestBacktest(backtests: BacktestRecord[]): BacktestRecord | null {
        if (backtests.length === 0) return null;

        return backtests.reduce((best, current) => {
            const bestSharpe = best.result.metrics.sharpeRatio || 0;
            const currentSharpe = current.result.metrics.sharpeRatio || 0;
            return currentSharpe > bestSharpe ? current : best;
        });
    }

    /**
     * Check if a strategy is a fork
     */
    isFork(strategyId: string): boolean {
        const metadata = this.loadForkMetadata();
        return !!metadata[strategyId]?.forkOf;
    }

    /**
     * Get parent strategy if forked
     */
    getParentStrategy(strategyId: string): SavedStrategy | null {
        const metadata = this.loadForkMetadata();
        const parentId = metadata[strategyId]?.forkOf;
        if (!parentId) return null;
        return loadStrategy(parentId);
    }

    // Persistence helpers
    private loadForkMetadata(): Record<string, any> {
        try {
            const data = localStorage.getItem(this.FORK_METADATA_KEY);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    }

    private saveForkMetadata(metadata: Record<string, any>): void {
        try {
            localStorage.setItem(this.FORK_METADATA_KEY, JSON.stringify(metadata));
        } catch (error) {
            console.error('[LeaderboardService] Failed to save fork metadata:', error);
        }
    }
}

export const leaderboardService = new LeaderboardService();
