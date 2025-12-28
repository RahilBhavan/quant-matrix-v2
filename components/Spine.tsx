/**
 * Spine - Enhanced Strategy Block Chain
 *
 * Features:
 * - Click block to enter edit mode
 * - Curved bezier connectors with flow particles
 * - Protocol-based color coding
 * - Mini icons for each protocol
 * - Validation status indicators
 */

import React, { useState, useCallback } from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Activity,
  Shield
} from 'lucide-react';
import { LegoBlock, Protocol, BlockParams } from '../types';
import { BlockParamEditor } from './BlockParamEditor';

interface SpineProps {
  blocks: LegoBlock[];
  setBlocks: (blocks: LegoBlock[]) => void;
  isValid: boolean;
}

// Protocol color mapping
const PROTOCOL_COLORS: Record<Protocol, string> = {
  [Protocol.ENTRY]: '#00FF9D',
  [Protocol.EXIT]: '#FF4444',
  [Protocol.ORDERS]: '#8247E5',
  [Protocol.INDICATORS]: '#FFD93D',
  [Protocol.LOGIC]: '#FFFFFF',
  [Protocol.RISK]: '#6C63FF',
};

// Protocol icon mapping
const PROTOCOL_ICONS: Record<Protocol, React.ElementType> = {
  [Protocol.ENTRY]: TrendingUp,
  [Protocol.EXIT]: TrendingDown,
  [Protocol.ORDERS]: FileText,
  [Protocol.INDICATORS]: Activity,
  [Protocol.LOGIC]: Activity,
  [Protocol.RISK]: Shield,
};

/**
 * Bezier Connector with Flow Particles
 */
const BezierConnector: React.FC<{ color: string; index: number }> = ({ color, index }) => {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 w-16 h-8 -top-4 pointer-events-none">
      <svg
        width="64"
        height="32"
        viewBox="0 0 64 32"
        fill="none"
        className="absolute left-1/2 -translate-x-1/2"
      >
        {/* Bezier curve path */}
        <path
          d="M32 0 C32 16, 32 16, 32 32"
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.5"
          fill="none"
        />

        {/* Flow particle */}
        <circle r="2" fill={color}>
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            begin={`${index * 0.2}s`}
          >
            <mpath href="#flowPath" />
          </animateMotion>
        </circle>

        {/* Hidden path for particle motion */}
        <path
          id="flowPath"
          d="M32 0 C32 16, 32 16, 32 32"
          stroke="transparent"
          fill="none"
        />
      </svg>
    </div>
  );
};

/**
 * Single Block Component
 */
const BlockCard: React.FC<{
  block: LegoBlock;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onUpdateParams: (blockId: string, params: BlockParams) => void;
  onCloseEditor: () => void;
  isBlockValid: boolean;
  totalBlocks: number;
}> = ({
  block,
  index,
  isEditing,
  onEdit,
  onRemove,
  onUpdateParams,
  onCloseEditor,
  isBlockValid,
  totalBlocks,
}) => {
    const protocolColor = PROTOCOL_COLORS[block.protocol];
    const ProtocolIcon = PROTOCOL_ICONS[block.protocol];

    return (
      <div className="relative">
        {/* Bezier Connector (if not first) */}
        {index > 0 && <BezierConnector color={protocolColor} index={index} />}

        {/* The Block */}
        <div
          onClick={onEdit}
          className={`relative bg-black backdrop-blur-md p-4 w-full cursor-pointer transition-all duration-300 overflow-hidden group ${isEditing
              ? 'border-2 border-qm-neon-cyan'
              : 'border border-white/20 hover:border-white'
            }`}
          style={{
            borderLeftColor: protocolColor,
            borderLeftWidth: '3px',
          }}
        >
          {/* Art Reveal Background */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
            style={{ backgroundColor: block.color }}
          />

          {/* Content */}
          <div className="flex items-center justify-between font-mono text-xs relative z-10">
            <div className="flex items-center gap-3">
              {/* Protocol Icon */}
              <div
                className="p-1.5 rounded"
                style={{ backgroundColor: `${protocolColor}20` }}
              >
                <ProtocolIcon size={14} style={{ color: protocolColor }} />
              </div>

              <div className="flex flex-col">
                <span
                  className="text-[10px] uppercase mb-1 tracking-wider font-bold"
                  style={{ color: protocolColor }}
                >
                  {block.protocol}
                </span>
                <span className="font-bold text-sm tracking-tight">{block.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Validation Indicator */}
              <div className="flex items-center gap-1">
                {isBlockValid ? (
                  <Check size={12} className="text-green-500" />
                ) : (
                  <AlertCircle size={12} className="text-red-500" />
                )}
              </div>

              {/* Param Preview */}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-right hidden sm:block max-w-[100px] truncate">
                {block.params &&
                  Object.entries(block.params)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' | ')}
              </span>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white hover:text-black transition-all"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Inline Editor */}
          <AnimatePresence>
            {isEditing && (
              <BlockParamEditor
                block={block}
                onUpdate={onUpdateParams}
                onClose={onCloseEditor}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Connector (if not last) */}
        {index < totalBlocks - 1 && (
          <div
            className="absolute -bottom-4 left-1/2 w-[2px] h-4 -translate-x-1/2"
            style={{ backgroundColor: protocolColor, opacity: 0.5 }}
          />
        )}
      </div>
    );
  };

export const Spine: React.FC<SpineProps> = ({ blocks, setBlocks, isValid }) => {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const removeBlock = useCallback(
    (id: string) => {
      setBlocks(blocks.filter((b) => b.id !== id));
      if (editingBlockId === id) {
        setEditingBlockId(null);
      }
    },
    [blocks, setBlocks, editingBlockId]
  );

  const updateBlockParams = useCallback(
    (blockId: string, params: BlockParams) => {
      setBlocks(
        blocks.map((b) => (b.id === blockId ? { ...b, params } : b))
      );
    },
    [blocks, setBlocks]
  );

  const handleEdit = useCallback((blockId: string) => {
    setEditingBlockId((prev) => (prev === blockId ? null : blockId));
  }, []);

  // Simple block validation (can be enhanced)
  const isBlockValid = useCallback((block: LegoBlock): boolean => {
    if (!block.params) return true;
    if (block.params.ticker && block.params.ticker.length === 0) return false;
    if (block.params.quantity !== undefined && block.params.quantity < 1) return false;
    return true;
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      {/* The Main Thread Line */}
      <div
        className={`absolute h-[60vh] w-[2px] top-[20vh] transition-colors duration-500 ${isValid ? 'bg-gradient-to-b from-qm-neon-cyan/50 via-white/20 to-qm-neon-cyan/50' : 'bg-red-500/50'
          }`}
      />

      {/* The Droppable Area */}
      <div className="h-[60vh] w-full max-w-md pointer-events-auto overflow-y-auto no-scrollbar py-12 px-4 relative flex flex-col items-center">
        {blocks.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-1/2 -translate-y-1/2 text-center"
          >
            <div className="w-[2px] h-12 bg-qm-neon-cyan animate-pulse mx-auto mb-4" />
            <span className="font-mono text-xs tracking-widest text-white/40">
              [ DRAG_BLOCK_TO_START ]
            </span>
          </motion.div>
        )}

        <Reorder.Group
          axis="y"
          values={blocks}
          onReorder={setBlocks}
          className="w-full space-y-8"
        >
          <AnimatePresence>
            {blocks.map((block, index) => (
              <Reorder.Item
                key={block.id}
                value={block}
                initial={{ opacity: 0, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 50 }}
                className="relative"
              >
                <BlockCard
                  block={block}
                  index={index}
                  isEditing={editingBlockId === block.id}
                  onEdit={() => handleEdit(block.id)}
                  onRemove={() => removeBlock(block.id)}
                  onUpdateParams={updateBlockParams}
                  onCloseEditor={() => setEditingBlockId(null)}
                  isBlockValid={isBlockValid(block)}
                  totalBlocks={blocks.length}
                />
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>

      {/* Flow Particles Animation Style */}
      <style>{`
        @keyframes flowParticle {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(32px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};