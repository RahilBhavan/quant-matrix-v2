/**
 * BlockToolbar - Contextual Action Toolbar for Selected Blocks
 *
 * Features:
 * - Appears on block selection
 * - Duplicate, Delete, Edit actions
 * - Follows BlockParamEditor interaction patterns
 * - Keyboard shortcut hints
 */

import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Trash2, Edit3, X, AlertTriangle } from 'lucide-react';
import { LegoBlock } from '../types';

interface BlockToolbarProps {
    block: LegoBlock | null;
    onDuplicate: (block: LegoBlock) => void;
    onDelete: (blockId: string) => void;
    onEdit: (blockId: string) => void;
    onClose: () => void;
}

export const BlockToolbar: React.FC<BlockToolbarProps> = ({
    block,
    onDuplicate,
    onDelete,
    onEdit,
    onClose,
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDuplicate = useCallback(() => {
        if (block) {
            onDuplicate(block);
        }
    }, [block, onDuplicate]);

    const handleDelete = useCallback(() => {
        if (block) {
            setShowDeleteConfirm(true);
        }
    }, [block]);

    const confirmDelete = useCallback(() => {
        if (block) {
            onDelete(block.id);
            setShowDeleteConfirm(false);
            onClose();
        }
    }, [block, onDelete, onClose]);

    const handleEdit = useCallback(() => {
        if (block) {
            onEdit(block.id);
        }
    }, [block, onEdit]);

    // Reset confirmation when block changes
    React.useEffect(() => {
        setShowDeleteConfirm(false);
    }, [block?.id]);

    if (!block) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="fixed bottom-48 left-1/2 -translate-x-1/2 z-50"
            >
                <div className="bg-black/90 border border-white/20 backdrop-blur-sm flex items-center gap-1 p-1 font-mono text-xs">
                    {/* Block Info */}
                    <div className="px-3 py-2 border-r border-white/10 text-white/60 max-w-[150px] truncate">
                        {block.label}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1 px-1">
                        {/* Duplicate */}
                        <motion.button
                            onClick={handleDuplicate}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-cyan-500 hover:text-black transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Duplicate Block"
                        >
                            <Copy size={12} />
                            <span className="hidden sm:inline">COPY</span>
                        </motion.button>

                        {/* Edit */}
                        <motion.button
                            onClick={handleEdit}
                            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-cyan-500 hover:text-black transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            title="Edit Parameters"
                        >
                            <Edit3 size={12} />
                            <span className="hidden sm:inline">EDIT</span>
                        </motion.button>

                        {/* Delete */}
                        <AnimatePresence mode="wait">
                            {!showDeleteConfirm ? (
                                <motion.button
                                    key="delete"
                                    onClick={handleDelete}
                                    className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-red-500 hover:text-black transition-all"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    title="Delete Block"
                                >
                                    <Trash2 size={12} />
                                    <span className="hidden sm:inline">DELETE</span>
                                </motion.button>
                            ) : (
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex items-center gap-1 bg-red-500/20 border border-red-500/50 px-2 py-1"
                                >
                                    <AlertTriangle size={12} className="text-red-500" />
                                    <span className="text-red-500 text-[10px]">Delete?</span>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-1.5 py-0.5 bg-red-500 text-black text-[10px] hover:bg-red-400"
                                    >
                                        YES
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="px-1.5 py-0.5 border border-white/20 text-[10px] hover:bg-white/10"
                                    >
                                        NO
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-white/10 transition-all border-l border-white/10 ml-1"
                        title="Close (Esc)"
                    >
                        <X size={12} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BlockToolbar;
