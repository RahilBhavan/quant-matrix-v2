/**
 * StrategyPromptInput Component
 * 
 * Floating input bar for AI-powered strategy generation.
 * Allows users to describe strategies in natural language.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, X, Lightbulb, AlertCircle } from 'lucide-react';
import { LegoBlock } from '../types';
import { aiStrategyService } from '../services/aiStrategyService';

interface StrategyPromptInputProps {
    onGenerate: (blocks: LegoBlock[]) => void;
    isExpanded?: boolean;
    onToggle?: () => void;
}

export const StrategyPromptInput: React.FC<StrategyPromptInputProps> = ({
    onGenerate,
    isExpanded = false,
    onToggle,
}) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showExamples, setShowExamples] = useState(false);

    const isConfigured = aiStrategyService.isConfigured();
    const examples = aiStrategyService.getExamplePrompts();

    const handleSubmit = async () => {
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const blocks = await aiStrategyService.generateStrategy(prompt);

            if (blocks.length === 0) {
                setError('No valid blocks generated. Try being more specific.');
                return;
            }

            onGenerate(blocks);
            setPrompt('');

            // Auto-collapse after success
            if (onToggle) {
                setTimeout(onToggle, 300);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate strategy');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const useExample = (example: string) => {
        setPrompt(example);
        setShowExamples(false);
    };

    // Collapsed button state - PRD compliant (white border, no color)
    if (!isExpanded) {
        return (
            <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={onToggle}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-3 bg-black border border-white/40 hover:bg-white hover:text-black text-white font-mono text-xs uppercase tracking-widest transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <Sparkles size={14} />
                <span>AI_STRATEGY</span>
            </motion.button>
        );
    }

    // Expanded input state
    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4"
            >
                <div className="bg-black border border-white/30 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-white/60" />
                            <span className="font-mono text-[10px] text-white/60 tracking-widest uppercase">
                                AI STRATEGY GENERATOR
                            </span>
                        </div>
                        <button
                            onClick={onToggle}
                            className="p-1 hover:bg-white/10 transition-colors"
                        >
                            <X size={14} className="text-white/60" />
                        </button>
                    </div>

                    {/* Examples dropdown */}
                    <AnimatePresence>
                        {showExamples && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-b border-white/10 overflow-hidden"
                            >
                                <div className="p-3 space-y-2">
                                    <div className="flex items-center gap-2 text-white/40 text-xs">
                                        <Lightbulb size={12} />
                                        <span>Example prompts:</span>
                                    </div>
                                    {examples.map((example, i) => (
                                        <button
                                            key={i}
                                            onClick={() => useExample(example)}
                                            className="block w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded transition-colors"
                                        >
                                            "{example}"
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Input area */}
                    <div className="p-4">
                        {!isConfigured && (
                            <div className="flex items-center gap-2 mb-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <AlertCircle size={16} className="text-yellow-500" />
                                <span className="text-xs text-yellow-500">
                                    Add VITE_GEMINI_API_KEY to .env to enable AI
                                </span>
                            </div>
                        )}

                        <div className="flex items-end gap-3">
                            <div className="flex-1 relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe your DeFi strategy..."
                                    disabled={isLoading || !isConfigured}
                                    className="w-full bg-white/5 border border-white/20 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/50 focus:outline-none resize-none transition-colors disabled:opacity-50 font-mono text-sm"
                                    rows={2}
                                />
                                <button
                                    onClick={() => setShowExamples(!showExamples)}
                                    className="absolute right-3 top-3 p-1 text-white/30 hover:text-white/60 transition-colors"
                                    title="Show examples"
                                >
                                    <Lightbulb size={16} />
                                </button>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!prompt.trim() || isLoading || !isConfigured}
                                className="flex items-center justify-center w-12 h-12 bg-white text-black hover:bg-white/80 disabled:bg-white/20 disabled:text-white/40 transition-all disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Send size={16} />
                                )}
                            </button>
                        </div>

                        {/* Error display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                            >
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={14} className="text-red-400" />
                                    <span className="text-xs text-red-400">{error}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Loading indicator */}
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 flex items-center gap-2 text-white/50"
                            >
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                <span className="text-xs">GENERATING STRATEGY BLOCKS...</span>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
