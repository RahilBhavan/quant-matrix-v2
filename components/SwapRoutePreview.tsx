/**
 * SwapRoutePreview Component
 * 
 * Displays available swap routes with price comparison,
 * gas estimates, and highlights the best route.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Loader2, AlertCircle, Zap, Award } from 'lucide-react';
import {
    smartOrderRouter,
    DexQuote,
    OptimalRoute,
    SwapParams,
    DexType,
} from '../services/smartOrderRouter';
import { ethers } from 'ethers';

interface SwapRoutePreviewProps {
    tokenIn: string;
    tokenOut: string;
    amountIn: string; // Formatted amount (e.g., "1000")
    decimals?: number;
    onSelectRoute?: (route: OptimalRoute) => void;
}

export const SwapRoutePreview: React.FC<SwapRoutePreviewProps> = ({
    tokenIn,
    tokenOut,
    amountIn,
    decimals = 18,
    onSelectRoute,
}) => {
    const [route, setRoute] = useState<OptimalRoute | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRoutes = async () => {
            if (!tokenIn || !tokenOut || !amountIn || parseFloat(amountIn) === 0) {
                setRoute(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const params: SwapParams = {
                    tokenIn,
                    tokenOut,
                    amountIn: ethers.parseUnits(amountIn, decimals),
                    slippageTolerance: 0.5,
                };

                const optimalRoute = await smartOrderRouter.findBestRoute(params);
                setRoute(optimalRoute);
                onSelectRoute?.(optimalRoute);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch routes');
                setRoute(null);
            } finally {
                setLoading(false);
            }
        };

        // Debounce route fetching
        const timer = setTimeout(fetchRoutes, 500);
        return () => clearTimeout(timer);
    }, [tokenIn, tokenOut, amountIn, decimals, onSelectRoute]);

    if (!tokenIn || !tokenOut || !amountIn) {
        return null;
    }

    return (
        <div className="bg-black/50 border border-white/10 rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-white/60" />
                    <span className="font-mono text-xs text-white/60 uppercase tracking-wider">
                        Route Comparison
                    </span>
                </div>
                {loading && <Loader2 size={14} className="animate-spin text-white/40" />}
            </div>

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle size={12} />
                    <span>{error}</span>
                </div>
            )}

            {/* Routes */}
            <AnimatePresence mode="wait">
                {route && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-2"
                    >
                        {route.quotes.map((quote, index) => (
                            <RouteCard
                                key={quote.dex}
                                quote={quote}
                                isBest={index === 0}
                                savings={index === 0 ? route.savings : undefined}
                            />
                        ))}

                        {/* Summary */}
                        {route.quotes.length > 1 && (
                            <div className="pt-2 border-t border-white/10 text-xs font-mono text-white/50">
                                Using {smartOrderRouter.getDexName(route.bestDex)} saves {route.savings} vs other routes
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className="h-14 bg-white/5 animate-pulse rounded"
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Individual route card
const RouteCard: React.FC<{
    quote: DexQuote;
    isBest: boolean;
    savings?: string;
}> = ({ quote, isBest, savings }) => {
    const dexName = smartOrderRouter.getDexName(quote.dex);
    const dexColor = smartOrderRouter.getDexColor(quote.dex);

    return (
        <motion.div
            className={`
        relative p-3 border rounded transition-all cursor-pointer
        ${isBest
                    ? 'border-green-500/50 bg-green-500/5'
                    : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
                }
      `}
            whileHover={{ scale: 1.01 }}
        >
            {/* Best Badge */}
            {isBest && (
                <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-green-500 text-black text-[10px] font-bold rounded">
                    <Award size={10} />
                    BEST
                </div>
            )}

            <div className="flex items-center justify-between">
                {/* DEX Info */}
                <div className="flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: dexColor }}
                    >
                        {dexName[0]}
                    </div>
                    <div>
                        <div className="font-mono text-sm text-white">{dexName}</div>
                        <div className="text-[10px] text-white/40">
                            {quote.poolFee ? `${quote.poolFee / 10000}% fee` : 'Dynamic fee'}
                        </div>
                    </div>
                </div>

                {/* Output Amount */}
                <div className="text-right">
                    <div className="font-mono text-sm text-white">
                        {parseFloat(quote.amountOutFormatted).toFixed(6)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-white/40">
                        <Zap size={10} />
                        ~{(Number(quote.gasEstimate) / 1000).toFixed(0)}k gas
                    </div>
                </div>
            </div>

            {/* Price Impact */}
            {quote.priceImpact > 0.1 && (
                <div className="mt-2 text-[10px] text-yellow-500">
                    ⚠️ {quote.priceImpact.toFixed(2)}% price impact
                </div>
            )}
        </motion.div>
    );
};
