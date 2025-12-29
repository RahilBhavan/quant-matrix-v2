/**
 * StrategyMiniMap - 2D Overview of Strategy Spine
 *
 * Features:
 * - Semi-transparent top-down schematic view
 * - Protocol-based color coding for blocks
 * - Click-to-focus navigation
 * - Current selection highlight
 * - Viewport position indicator
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { LegoBlock, Protocol } from '../types';

interface StrategyMiniMapProps {
    blocks: LegoBlock[];
    selectedBlockId: string | null;
    onBlockSelect: (blockId: string) => void;
}

// Protocol color mapping (matching Spine.tsx)
const PROTOCOL_COLORS: Record<Protocol, string> = {
    [Protocol.ENTRY]: '#00FF9D',
    [Protocol.EXIT]: '#FF4444',
    [Protocol.ORDERS]: '#8247E5',
    [Protocol.INDICATORS]: '#FFD93D',
    [Protocol.LOGIC]: '#FFFFFF',
    [Protocol.RISK]: '#6C63FF',
};

export const StrategyMiniMap: React.FC<StrategyMiniMapProps> = ({
    blocks,
    selectedBlockId,
    onBlockSelect,
}) => {
    const handleBlockClick = useCallback(
        (blockId: string) => {
            onBlockSelect(blockId);
        },
        [onBlockSelect]
    );

    if (blocks.length === 0) return null;

    // Calculate layout dimensions
    const blockHeight = 20;
    const blockGap = 8;
    const totalHeight = blocks.length * (blockHeight + blockGap) - blockGap;
    const containerHeight = Math.min(totalHeight + 24, 200);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-32 left-8 z-50 pointer-events-auto"
        >
            {/* Header */}
            <div className="font-mono text-[10px] text-white/50 mb-2 tracking-widest">
                STRATEGY_MAP
            </div>

            {/* Mini-map Container */}
            <div
                className="relative bg-black/60 backdrop-blur-sm border border-white/10 p-3 overflow-y-auto no-scrollbar"
                style={{
                    width: 140,
                    maxHeight: containerHeight,
                }}
            >
                {/* Central Spine Line */}
                <div
                    className="absolute left-1/2 top-3 bottom-3 w-[1px] bg-gradient-to-b from-cyan-500/50 via-white/20 to-cyan-500/50 -translate-x-1/2"
                />

                {/* Block Representations */}
                <div className="relative flex flex-col items-center gap-2">
                    {blocks.map((block, index) => {
                        const isSelected = block.id === selectedBlockId;
                        const color = PROTOCOL_COLORS[block.protocol];

                        return (
                            <motion.button
                                key={block.id}
                                onClick={() => handleBlockClick(block.id)}
                                className={`relative w-full transition-all ${isSelected
                                        ? 'ring-1 ring-cyan-500 ring-offset-1 ring-offset-black'
                                        : 'hover:ring-1 hover:ring-white/30'
                                    }`}
                                style={{
                                    height: blockHeight,
                                    backgroundColor: isSelected ? `${color}30` : `${color}15`,
                                    borderLeft: `2px solid ${color}`,
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                title={`${block.label} - Click to focus`}
                            >
                                {/* Block Label */}
                                <div
                                    className="absolute inset-0 flex items-center px-2 font-mono text-[8px] truncate"
                                    style={{ color: isSelected ? color : `${color}99` }}
                                >
                                    {block.label}
                                </div>

                                {/* Selection Indicator */}
                                {isSelected && (
                                    <motion.div
                                        layoutId="minimap-selection"
                                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-cyan-500"
                                        initial={false}
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Block Count */}
                <div className="mt-3 pt-2 border-t border-white/10 text-center font-mono text-[9px] text-white/30">
                    {blocks.length} BLOCK{blocks.length !== 1 ? 'S' : ''}
                </div>
            </div>

            {/* Keyboard Hint */}
            <div className="mt-2 font-mono text-[9px] text-white/30">
                Click block to focus
            </div>
        </motion.div>
    );
};

export default StrategyMiniMap;
