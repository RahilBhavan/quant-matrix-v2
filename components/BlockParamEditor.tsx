/**
 * BlockParamEditor - Inline Parameter Editor for Strategy Blocks
 *
 * Features:
 * - Type-aware inputs (text, number, percentage)
 * - Auto-focus first input
 * - Escape to cancel, Enter to confirm
 * - 300ms debounced updates
 * - Click-outside to save
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';
import { LegoBlock, BlockParams } from '../types';

interface BlockParamEditorProps {
    block: LegoBlock;
    onUpdate: (blockId: string, params: BlockParams) => void;
    onClose: () => void;
}

// Param configuration for type-aware rendering
interface ParamConfig {
    key: keyof BlockParams;
    label: string;
    type: 'text' | 'number' | 'percentage' | 'boolean';
    min?: number;
    max?: number;
    step?: number;
}

const PARAM_CONFIGS: ParamConfig[] = [
    { key: 'ticker', label: 'TICKER', type: 'text' },
    { key: 'quantity', label: 'QUANTITY', type: 'number', min: 1, step: 1 },
    { key: 'price', label: 'PRICE', type: 'number', min: 0, step: 0.01 },
    { key: 'threshold', label: 'THRESHOLD', type: 'number', min: 0, max: 100 },
    { key: 'period', label: 'PERIOD', type: 'number', min: 1, step: 1 },
    { key: 'percentage', label: 'PERCENTAGE', type: 'percentage', min: 0, max: 100, step: 0.1 },
    // MEV Protection params
    { key: 'useFlashbots', label: 'USE FLASHBOTS', type: 'boolean' },
    { key: 'privateTransaction', label: 'PRIVATE TX', type: 'boolean' },
    { key: 'maxPriorityFeePerGas', label: 'MAX PRIORITY FEE (GWEI)', type: 'number', min: 0, step: 1 },
];

export const BlockParamEditor: React.FC<BlockParamEditorProps> = ({
    block,
    onUpdate,
    onClose,
}) => {
    const [localParams, setLocalParams] = useState<BlockParams>(block.params || {});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const containerRef = useRef<HTMLDivElement>(null);
    const firstInputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Get applicable params for this block
    const applicableParams = PARAM_CONFIGS.filter(
        (config) => block.params && config.key in block.params
    );

    // Auto-focus first input
    useEffect(() => {
        if (firstInputRef.current) {
            firstInputRef.current.focus();
            firstInputRef.current.select();
        }
    }, []);

    // Click-outside handler
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                handleSave();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [localParams]);

    // Keyboard handler
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
            }
        },
        [localParams]
    );

    // Validate params
    const validate = (params: BlockParams): boolean => {
        const newErrors: Record<string, string> = {};

        if (params.ticker && params.ticker.length === 0) {
            newErrors.ticker = 'Required';
        }
        if (params.quantity !== undefined && params.quantity < 1) {
            newErrors.quantity = 'Min 1';
        }
        if (params.percentage !== undefined && (params.percentage < 0 || params.percentage > 100)) {
            newErrors.percentage = '0-100';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Debounced update
    const handleParamChange = (key: keyof BlockParams, value: string | number) => {
        const newParams = { ...localParams, [key]: value };
        setLocalParams(newParams);

        // Clear previous debounce
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Debounce validation
        debounceRef.current = setTimeout(() => {
            validate(newParams);
        }, 300);
    };

    // Save handler
    const handleSave = () => {
        if (validate(localParams)) {
            onUpdate(block.id, localParams);
            onClose();
        }
    };

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    return (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute inset-0 bg-black/95 border border-qm-neon-cyan z-20 p-4"
            onKeyDown={handleKeyDown}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-xs opacity-60 uppercase tracking-widest">
                    EDIT: {block.label}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        className="p-1 hover:bg-qm-neon-cyan hover:text-black transition-colors"
                        title="Save (Enter)"
                    >
                        <Check size={14} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-red-500 hover:text-black transition-colors"
                        title="Cancel (Esc)"
                    >
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Param Inputs */}
            <div className="space-y-3">
                {applicableParams.map((config, index) => (
                    <div key={config.key} className="flex items-center gap-3">
                        <label className="font-mono text-[10px] opacity-60 w-20 uppercase">
                            {config.label}
                        </label>
                        <div className="flex-1 relative">
                            {config.type === 'boolean' ? (
                                /* Boolean Toggle */
                                <button
                                    onClick={() => {
                                        const currentValue = localParams[config.key] as boolean | undefined;
                                        handleParamChange(config.key, !currentValue);
                                    }}
                                    className={`
                                        flex items-center gap-2 px-3 py-1 font-mono text-xs
                                        border transition-all
                                        ${localParams[config.key]
                                            ? 'bg-qm-neon-cyan/20 border-qm-neon-cyan text-qm-neon-cyan'
                                            : 'bg-transparent border-white/20 text-white/60'
                                        }
                                    `}
                                    type="button"
                                >
                                    <span className={`w-3 h-3 border ${localParams[config.key] ? 'bg-qm-neon-cyan border-qm-neon-cyan' : 'border-white/40'}`}>
                                        {localParams[config.key] && '✓'}
                                    </span>
                                    <span>{localParams[config.key] ? 'ON' : 'OFF'}</span>
                                </button>
                            ) : (
                                /* Text/Number Input */
                                <>
                                    <input
                                        ref={index === 0 ? firstInputRef : undefined}
                                        type={config.type === 'text' ? 'text' : 'number'}
                                        value={localParams[config.key] ?? ''}
                                        onChange={(e) => {
                                            let value: string | number = e.target.value;
                                            if (config.type !== 'text') {
                                                value = parseFloat(e.target.value) || 0;
                                            } else {
                                                value = e.target.value.toUpperCase();
                                            }
                                            handleParamChange(config.key, value);
                                        }}
                                        min={config.min}
                                        max={config.max}
                                        step={config.step}
                                        className={`w-full bg-transparent border px-2 py-1 font-mono text-sm outline-none transition-colors ${errors[config.key]
                                            ? 'border-red-500 text-red-500'
                                            : 'border-white/20 focus:border-qm-neon-cyan'
                                            }`}
                                    />
                                    {config.type === 'percentage' && (
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50">%</span>
                                    )}
                                </>
                            )}
                            {errors[config.key] && (
                                <div className="absolute -right-6 top-1/2 -translate-y-1/2">
                                    <AlertCircle size={12} className="text-red-500" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
                <div className="mt-4 text-red-500 font-mono text-[10px]">
                    {Object.values(errors).join(' • ')}
                </div>
            )}
        </motion.div>
    );
};

export default BlockParamEditor;
