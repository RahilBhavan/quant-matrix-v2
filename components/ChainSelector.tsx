/**
 * ChainSelector Component
 * 
 * Dropdown selector for switching between supported blockchain networks.
 * Shows current chain with icon and allows switching to other L2s.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Loader2 } from 'lucide-react';
import {
    ChainId,
    ChainConfig,
    getSupportedChains,
    getChainConfig,
    getChainIdHex,
} from '../services/web3/chainConfig';

interface ChainSelectorProps {
    currentChainId: ChainId | null;
    onChainSelect: (chainId: ChainId) => Promise<void>;
    showTestnets?: boolean;
    disabled?: boolean;
}

// Chain icons as simple colored circles with letters
const ChainIcon: React.FC<{ chain: ChainConfig; size?: number }> = ({ chain, size = 20 }) => (
    <div
        className="rounded-full flex items-center justify-center font-bold text-white"
        style={{
            backgroundColor: chain.iconColor,
            width: size,
            height: size,
            fontSize: size * 0.5,
        }}
    >
        {chain.shortName[0]}
    </div>
);

export const ChainSelector: React.FC<ChainSelectorProps> = ({
    currentChainId,
    onChainSelect,
    showTestnets = true,
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSwitching, setIsSwitching] = useState(false);

    const chains = getSupportedChains(showTestnets);
    const currentChain = currentChainId ? getChainConfig(currentChainId) : null;

    const handleSelect = async (chainId: ChainId) => {
        if (chainId === currentChainId || isSwitching) return;

        setIsSwitching(true);
        try {
            await onChainSelect(chainId);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to switch chain:', error);
        } finally {
            setIsSwitching(false);
        }
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled || isSwitching}
                className={`
          flex items-center gap-2 px-3 py-2 
          bg-black/50 border border-white/20 
          hover:border-white/40 transition-colors
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-white/40' : ''}
        `}
            >
                {isSwitching ? (
                    <Loader2 size={16} className="animate-spin text-white/60" />
                ) : currentChain ? (
                    <ChainIcon chain={currentChain} size={16} />
                ) : (
                    <div className="w-4 h-4 rounded-full bg-white/20" />
                )}

                <span className="font-mono text-xs text-white/80">
                    {currentChain?.shortName || 'Select Network'}
                </span>

                <ChevronDown
                    size={14}
                    className={`text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Menu */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 mt-1 z-50 min-w-[200px] bg-black border border-white/20 shadow-xl"
                        >
                            {/* Mainnets */}
                            <div className="p-2">
                                <div className="px-2 py-1 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                    Mainnets
                                </div>
                                {chains
                                    .filter(c => !c.isTestnet)
                                    .map(chain => (
                                        <ChainOption
                                            key={chain.chainId}
                                            chain={chain}
                                            isSelected={chain.chainId === currentChainId}
                                            onClick={() => handleSelect(chain.chainId)}
                                        />
                                    ))}
                            </div>

                            {/* Testnets */}
                            {showTestnets && (
                                <div className="p-2 border-t border-white/10">
                                    <div className="px-2 py-1 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                        Testnets
                                    </div>
                                    {chains
                                        .filter(c => c.isTestnet)
                                        .map(chain => (
                                            <ChainOption
                                                key={chain.chainId}
                                                chain={chain}
                                                isSelected={chain.chainId === currentChainId}
                                                onClick={() => handleSelect(chain.chainId)}
                                            />
                                        ))}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

// Individual chain option
const ChainOption: React.FC<{
    chain: ChainConfig;
    isSelected: boolean;
    onClick: () => void;
}> = ({ chain, isSelected, onClick }) => (
    <button
        onClick={onClick}
        className={`
      w-full flex items-center gap-3 px-3 py-2 
      hover:bg-white/5 transition-colors text-left
      ${isSelected ? 'bg-white/5' : ''}
    `}
    >
        <ChainIcon chain={chain} size={20} />

        <div className="flex-1">
            <div className="font-mono text-xs text-white">{chain.shortName}</div>
            {chain.isTestnet && (
                <div className="text-[10px] text-white/40">Testnet</div>
            )}
        </div>

        {isSelected && (
            <Check size={14} className="text-green-400" />
        )}
    </button>
);
