/**
 * CameraControls - HUD controls for 3D camera navigation
 *
 * Features:
 * - Reset View button (returns to default isometric overview)
 * - Focus on Block button (centers on selected block)
 * - Camera preset dropdown (Top, Front, Side, Isometric)
 * - Keyboard shortcuts (R = reset, F = focus)
 */

import React, { useCallback, useEffect, useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Focus, ChevronDown, Eye, ZoomIn, ZoomOut } from 'lucide-react';

interface CameraControlsProps {
    selectedBlockId: string | null;
    onFocusBlock?: (blockId: string) => void;
    blockPositions?: Map<string, { x: number; y: number; z: number }>;
    zoomLevel: number;
    onZoomChange: (zoom: number | ((prev: number) => number)) => void;
}

// Camera preset configurations
const CAMERA_PRESETS = {
    isometric: {
        label: 'Isometric',
        position: [0, 0, 8] as [number, number, number],
        lookAt: [0, 0, 0] as [number, number, number],
    },
    top: {
        label: 'Top Down',
        position: [0, 10, 0] as [number, number, number],
        lookAt: [0, 0, 0] as [number, number, number],
    },
    front: {
        label: 'Front',
        position: [0, 0, 10] as [number, number, number],
        lookAt: [0, 0, 0] as [number, number, number],
    },
    side: {
        label: 'Side',
        position: [10, 0, 0] as [number, number, number],
        lookAt: [0, 0, 0] as [number, number, number],
    },
} as const;

type PresetKey = keyof typeof CAMERA_PRESETS;

export const CameraControls: React.FC<CameraControlsProps> = ({
    onFocusBlock,
    blockPositions,
    zoomLevel,
    onZoomChange,
}) => {
    // Standalone mode - camera integration will be added when ThreeSceneProvider is used
    const [showPresets, setShowPresets] = useState(false);
    const [currentPreset, setCurrentPreset] = useState<PresetKey>('isometric');

    // Placeholder handlers - these will show visual feedback
    // Real camera integration requires wrapping app in ThreeSceneProvider
    const resetCamera = useCallback(() => {
        console.log('[CameraControls] Reset camera to isometric view');
    }, []);

    const moveCameraTo = useCallback((target: { position: number[]; lookAt: number[]; duration: number }) => {
        console.log('[CameraControls] Move camera to:', target);
    }, []);

    // Reset view handler
    const handleResetView = useCallback(() => {
        resetCamera();
        setCurrentPreset('isometric');
    }, [resetCamera]);

    // Focus on selected block
    const handleFocusBlock = useCallback(() => {
        if (!selectedBlockId || !blockPositions) return;

        const blockPos = blockPositions.get(selectedBlockId);
        if (!blockPos) return;

        // Calculate camera position relative to block
        // Position camera above and in front of block
        moveCameraTo({
            position: [blockPos.x, blockPos.y + 2, blockPos.z + 5],
            lookAt: [blockPos.x, blockPos.y, blockPos.z],
            duration: 600,
        });
    }, [selectedBlockId, blockPositions, moveCameraTo]);

    // Apply camera preset
    const handlePresetChange = useCallback(
        (preset: PresetKey) => {
            const config = CAMERA_PRESETS[preset];
            moveCameraTo({
                position: config.position,
                lookAt: config.lookAt,
                duration: 600,
            });
            setCurrentPreset(preset);
            setShowPresets(false);
        },
        [moveCameraTo]
    );

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (e.key.toLowerCase() === 'r') {
                handleResetView();
            } else if (e.key.toLowerCase() === 'f' && selectedBlockId) {
                handleFocusBlock();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleResetView, handleFocusBlock, selectedBlockId]);

    // Close presets dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setShowPresets(false);
        if (showPresets) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showPresets]);

    return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 font-mono text-xs">
            {/* Reset View Button */}
            <motion.button
                onClick={handleResetView}
                className="flex items-center gap-2 px-3 py-2 bg-black border border-white/30 hover:bg-white hover:text-black transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Reset View (R)"
            >
                <Home size={14} />
                <span className="hidden sm:inline uppercase tracking-widest">RESET</span>
            </motion.button>

            {/* Zoom Out Button */}
            <motion.button
                onClick={() => onZoomChange(prev => Math.max(50, prev - 25))}
                className="flex items-center justify-center w-10 h-10 bg-black border border-white/30 hover:bg-white hover:text-black transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Zoom Out"
            >
                <ZoomOut size={14} />
            </motion.button>

            {/* Zoom Level Display */}
            <div className="px-3 py-2 bg-black border border-white/30 text-center min-w-[60px]">
                <span className="uppercase tracking-widest">{zoomLevel}%</span>
            </div>

            {/* Zoom In Button */}
            <motion.button
                onClick={() => onZoomChange(prev => Math.min(200, prev + 25))}
                className="flex items-center justify-center w-10 h-10 bg-black border border-white/30 hover:bg-white hover:text-black transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title="Zoom In"
            >
                <ZoomIn size={14} />
            </motion.button>

            {/* Focus on Block Button */}
            <motion.button
                onClick={handleFocusBlock}
                disabled={!selectedBlockId}
                className={`flex items-center gap-2 px-3 py-2 bg-black border transition-all ${selectedBlockId
                    ? 'border-white/30 hover:bg-white hover:text-black'
                    : 'border-white/10 text-white/30 cursor-not-allowed'
                    }`}
                whileHover={selectedBlockId ? { scale: 1.02 } : {}}
                whileTap={selectedBlockId ? { scale: 0.98 } : {}}
                title={selectedBlockId ? 'Focus on Block (F)' : 'Select a block first'}
            >
                <Focus size={14} />
                <span className="hidden sm:inline uppercase tracking-widest">FOCUS</span>
            </motion.button>

            {/* Camera Presets Dropdown */}
            <div className="relative">
                <motion.button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowPresets(!showPresets);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-black border border-white/30 hover:bg-white hover:text-black transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    title="Camera Presets"
                >
                    <Eye size={14} />
                    <span className="hidden sm:inline uppercase tracking-widest">
                        {CAMERA_PRESETS[currentPreset].label.toUpperCase()}
                    </span>
                    <ChevronDown
                        size={12}
                        className={`transition-transform ${showPresets ? 'rotate-180' : ''}`}
                    />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                    {showPresets && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute bottom-full left-0 mb-2 w-full min-w-[120px] bg-black/95 border border-white/20"
                        >
                            {(Object.keys(CAMERA_PRESETS) as PresetKey[]).map((key) => (
                                <button
                                    key={key}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePresetChange(key);
                                    }}
                                    className={`w-full px-3 py-2 text-left uppercase tracking-widest hover:bg-white hover:text-black transition-colors ${currentPreset === key ? 'bg-white/10' : ''
                                        }`}
                                >
                                    {CAMERA_PRESETS[key].label.toUpperCase()}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Keyboard Shortcut Hints */}
            <div className="hidden lg:flex items-center gap-4 ml-4 text-white/30">
                <span>
                    <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">R</kbd> Reset
                </span>
                {selectedBlockId && (
                    <span>
                        <kbd className="px-1 py-0.5 bg-white/10 rounded text-[10px]">F</kbd> Focus
                    </span>
                )}
            </div>
        </div>
    );
};

export default CameraControls;
