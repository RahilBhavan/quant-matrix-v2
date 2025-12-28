/**
 * PortfolioPanel - Portfolio Management Panel
 *
 * Features:
 * - 3D Portfolio visualization
 * - Metric selector (value, P/L, allocation %)
 * - Sort controls (size, symbol, performance)
 * - Position details table
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart2, SortAsc, SortDesc } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { Position } from '@/types';
import { PortfolioChart3D, PortfolioMetric } from '../visualizations/PortfolioChart3D';
import { ThreeSceneProvider } from '../three/ThreeScene';

interface PortfolioPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

type SortField = 'value' | 'symbol' | 'performance';
type SortDirection = 'asc' | 'desc';

export const PortfolioPanel: React.FC<PortfolioPanelProps> = ({ isOpen, onClose }) => {
    const { state: portfolio } = usePortfolio();
    const [metric, setMetric] = useState<PortfolioMetric>('value');
    const [sortField, setSortField] = useState<SortField>('value');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Sort positions
    const sortedPositions = useMemo(() => {
        const positions = [...portfolio.positions];

        positions.sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'value':
                    comparison = (a.currentPrice * a.quantity) - (b.currentPrice * b.quantity);
                    break;
                case 'symbol':
                    comparison = a.symbol.localeCompare(b.symbol);
                    break;
                case 'performance':
                    comparison = a.unrealizedPLPercent - b.unrealizedPLPercent;
                    break;
            }
            return sortDirection === 'desc' ? -comparison : comparison;
        });

        return positions;
    }, [portfolio.positions, sortField, sortDirection]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const metricOptions: { value: PortfolioMetric; label: string; icon: React.ElementType }[] = [
        { value: 'value', label: 'VALUE', icon: DollarSign },
        { value: 'pnl', label: 'P/L', icon: TrendingUp },
        { value: 'allocation', label: 'ALLOC %', icon: PieChart },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3 }}
                        className="fixed right-0 top-0 h-screen w-full md:w-[700px] bg-black border-l border-white z-50 overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-black border-b border-white p-6 flex items-center justify-between z-10">
                            <h2 className="font-sans font-bold text-2xl tracking-tighter">PORTFOLIO_3D</h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white hover:text-black transition-colors interactive-zone"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="border border-white/20 p-4">
                                    <div className="font-mono text-[10px] opacity-60 mb-1">TOTAL_VALUE</div>
                                    <div className="font-bold text-xl">{formatCurrency(portfolio.totalEquity)}</div>
                                </div>
                                <div className="border border-white/20 p-4">
                                    <div className="font-mono text-[10px] opacity-60 mb-1">POSITIONS</div>
                                    <div className="font-bold text-xl">{portfolio.positions.length}</div>
                                </div>
                                <div className="border border-white/20 p-4">
                                    <div className="font-mono text-[10px] opacity-60 mb-1">CASH</div>
                                    <div className="font-bold text-xl">{formatCurrency(portfolio.cash)}</div>
                                </div>
                            </div>

                            {/* Metric Selector */}
                            <div className="space-y-2">
                                <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">Display Metric</h3>
                                <div className="flex gap-2">
                                    {metricOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => setMetric(option.value)}
                                            className={`flex items-center gap-2 px-4 py-2 border transition-colors interactive-zone ${metric === option.value
                                                    ? 'bg-white text-black border-white'
                                                    : 'border-white/20 hover:border-white'
                                                }`}
                                        >
                                            <option.icon size={14} />
                                            <span className="font-mono text-xs">{option.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 3D Chart */}
                            <div className="space-y-2">
                                <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">Visualization</h3>
                                <div className="bg-white/5 h-80 border border-white/10">
                                    {portfolio.positions.length > 0 ? (
                                        <ThreeSceneProvider>
                                            <PortfolioChart3D
                                                positions={portfolio.positions}
                                                metric={metric}
                                                totalEquity={portfolio.totalEquity}
                                            />
                                        </ThreeSceneProvider>
                                    ) : (
                                        <div className="h-full flex items-center justify-center font-mono text-xs text-gray-500">
                                            No positions to display
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sort Controls */}
                            <div className="space-y-2">
                                <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">Sort By</h3>
                                <div className="flex gap-2">
                                    {(['value', 'symbol', 'performance'] as SortField[]).map((field) => (
                                        <button
                                            key={field}
                                            onClick={() => handleSort(field)}
                                            className={`flex items-center gap-2 px-3 py-2 border transition-colors interactive-zone font-mono text-xs ${sortField === field
                                                    ? 'bg-white text-black border-white'
                                                    : 'border-white/20 hover:border-white'
                                                }`}
                                        >
                                            {sortField === field && (
                                                sortDirection === 'desc' ? <SortDesc size={12} /> : <SortAsc size={12} />
                                            )}
                                            {field.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Position Details Table */}
                            <div className="space-y-2">
                                <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">
                                    Position Details ({sortedPositions.length})
                                </h3>
                                <div className="border border-white/20 overflow-hidden">
                                    <table className="w-full font-mono text-xs">
                                        <thead className="bg-white/5 border-b border-white/20">
                                            <tr className="text-left">
                                                <th className="p-3">SYMBOL</th>
                                                <th className="p-3 text-right">QTY</th>
                                                <th className="p-3 text-right">AVG</th>
                                                <th className="p-3 text-right">CURRENT</th>
                                                <th className="p-3 text-right">VALUE</th>
                                                <th className="p-3 text-right">P/L</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedPositions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                                        No positions
                                                    </td>
                                                </tr>
                                            ) : (
                                                sortedPositions.map((pos) => (
                                                    <tr key={pos.symbol} className="border-b border-white/10 hover:bg-white/5">
                                                        <td className="p-3 font-bold">{pos.symbol}</td>
                                                        <td className="p-3 text-right">{pos.quantity}</td>
                                                        <td className="p-3 text-right opacity-60">{formatCurrency(pos.avgPrice)}</td>
                                                        <td className="p-3 text-right">{formatCurrency(pos.currentPrice)}</td>
                                                        <td className="p-3 text-right font-bold">
                                                            {formatCurrency(pos.currentPrice * pos.quantity)}
                                                        </td>
                                                        <td className={`p-3 text-right ${pos.unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {formatCurrency(pos.unrealizedPL)}
                                                            <br />
                                                            <span className="text-[10px]">{formatPercent(pos.unrealizedPLPercent)}</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PortfolioPanel;
