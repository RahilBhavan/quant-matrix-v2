/**
 * StrategyLeaderboard Component
 * 
 * Displays ranked strategies sorted by Sharpe Ratio with
 * medals, fork counts, and action buttons.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trophy,
    GitFork,
    TrendingUp,
    TrendingDown,
    Target,
    Loader2,
    ExternalLink,
    X,
} from 'lucide-react';
import { leaderboardService, RankedStrategy } from '../services/leaderboardService';
import { LegoBlock } from '../types';

interface StrategyLeaderboardProps {
    isOpen: boolean;
    onClose: () => void;
    onLoadStrategy?: (blocks: LegoBlock[]) => void;
    onForkStrategy?: (blocks: LegoBlock[], name: string) => void;
}

export const StrategyLeaderboard: React.FC<StrategyLeaderboardProps> = ({
    isOpen,
    onClose,
    onLoadStrategy,
    onForkStrategy,
}) => {
    const [rankings, setRankings] = useState<RankedStrategy[]>([]);
    const [loading, setLoading] = useState(true);
    const [forking, setForking] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadRankings();
        }
    }, [isOpen]);

    const loadRankings = () => {
        setLoading(true);
        // Simulate async load
        setTimeout(() => {
            const data = leaderboardService.getRankings();
            setRankings(data);
            setLoading(false);
        }, 300);
    };

    const handleFork = async (entry: RankedStrategy) => {
        setForking(entry.strategy.id);
        try {
            const forked = leaderboardService.forkStrategy(entry.strategy.id);
            if (forked && onForkStrategy) {
                onForkStrategy(forked.blocks, forked.name);
            }
            loadRankings(); // Refresh to show updated fork count
        } finally {
            setForking(null);
        }
    };

    const handleLoad = (entry: RankedStrategy) => {
        if (onLoadStrategy) {
            onLoadStrategy(entry.strategy.blocks);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-3xl max-h-[80vh] bg-black border border-white/20 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <Trophy className="text-yellow-400" size={24} />
                            <div>
                                <h2 className="font-sans font-bold text-xl tracking-tight">
                                    STRATEGY_LEADERBOARD
                                </h2>
                                <p className="font-mono text-xs text-white/50">
                                    Ranked by Sharpe Ratio (risk-adjusted returns)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto max-h-[60vh]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-white/40\" size={32} />
                            </div>
                        ) : rankings.length === 0 ? (
                            <div className="text-center py-12">
                                <Trophy className="mx-auto text-white/20 mb-4" size={48} />
                                <p className="font-mono text-sm text-white/40">
                                    No ranked strategies yet
                                </p>
                                <p className="font-mono text-xs text-white/30 mt-2">
                                    Create and backtest strategies to join the leaderboard
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {rankings.map((entry) => (
                                    <LeaderboardEntry
                                        key={entry.strategy.id}
                                        entry={entry}
                                        onLoad={() => handleLoad(entry)}
                                        onFork={() => handleFork(entry)}
                                        isForking={forking === entry.strategy.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-white/10 bg-white/[0.02]">
                        <div className="flex items-center justify-between text-[10px] font-mono text-white/40">
                            <span>{rankings.length} STRATEGIES RANKED</span>
                            <span>UPDATED: {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Individual leaderboard entry
const LeaderboardEntry: React.FC<{
    entry: RankedStrategy;
    onLoad: () => void;
    onFork: () => void;
    isForking: boolean;
}> = ({ entry, onLoad, onFork, isForking }) => {
    const { strategy, rank, medal, sharpeRatio, totalReturn, forkCount, parentId } = entry;

    return (
        <motion.div
            className={`
        relative p-4 border rounded transition-all
        ${rank <= 3 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/10 hover:border-white/20'}
      `}
            whileHover={{ scale: 1.01 }}
        >
            <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-12 text-center">
                    {medal ? (
                        <span className="text-2xl">{medal}</span>
                    ) : (
                        <span className="font-mono text-lg text-white/40">#{rank}</span>
                    )}
                </div>

                {/* Strategy Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-mono text-sm text-white truncate">
                            {strategy.name}
                        </h3>
                        {parentId && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded">
                                FORK
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                        <MetricBadge
                            icon={TrendingUp}
                            label="Sharpe"
                            value={sharpeRatio.toFixed(2)}
                            positive={sharpeRatio > 1}
                        />
                        <MetricBadge
                            icon={totalReturn >= 0 ? TrendingUp : TrendingDown}
                            label="Return"
                            value={`${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(1)}%`}
                            positive={totalReturn >= 0}
                        />
                        <MetricBadge
                            icon={GitFork}
                            label="Forks"
                            value={forkCount.toString()}
                            positive={false}
                            neutral
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onFork}
                        disabled={isForking}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-500/50 text-purple-400 hover:bg-purple-500/10 transition-colors text-xs font-mono disabled:opacity-50"
                    >
                        {isForking ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <GitFork size={12} />
                        )}
                        FORK
                    </button>
                    <button
                        onClick={onLoad}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-gray-200 transition-colors text-xs font-mono font-bold"
                    >
                        <ExternalLink size={12} />
                        LOAD
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// Metric badge component
const MetricBadge: React.FC<{
    icon: React.ElementType;
    label: string;
    value: string;
    positive: boolean;
    neutral?: boolean;
}> = ({ icon: Icon, label, value, positive, neutral }) => (
    <div className="flex items-center gap-1 text-[10px]">
        <Icon
            size={10}
            className={neutral ? 'text-white/40' : positive ? 'text-green-400' : 'text-red-400'}
        />
        <span className="text-white/40">{label}:</span>
        <span className={neutral ? 'text-white/60' : positive ? 'text-green-400' : 'text-red-400'}>
            {value}
        </span>
    </div>
);
