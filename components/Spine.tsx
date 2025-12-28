import React from 'react';
import { Reorder, AnimatePresence, motion } from 'framer-motion';
import { LegoBlock } from '../types';
import { X, AlertCircle } from 'lucide-react';

interface SpineProps {
  blocks: LegoBlock[];
  setBlocks: (blocks: LegoBlock[]) => void;
  isValid: boolean;
}

export const Spine: React.FC<SpineProps> = ({ blocks, setBlocks, isValid }) => {
  
  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
      {/* The Thread */}
      <div className={`absolute h-[60vh] w-[1px] top-[20vh] transition-colors duration-500 ${isValid ? 'bg-white/20' : 'bg-red-500/50'}`} />

      {/* The Droppable Area */}
      <div className="h-[60vh] w-full max-w-md pointer-events-auto overflow-y-auto no-scrollbar py-12 px-4 relative flex flex-col items-center">
        
        {blocks.length === 0 && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="absolute top-1/2 -translate-y-1/2 text-center"
            >
                <div className="w-[1px] h-12 bg-white animate-pulse mx-auto mb-4"></div>
                <span className="font-mono text-xs tracking-widest text-white/40 blink">[ DRAG_BLOCK_TO_START ]</span>
            </motion.div>
        )}

        <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="w-full space-y-1">
          <AnimatePresence>
            {blocks.map((block, index) => (
              <Reorder.Item
                key={block.id}
                value={block}
                initial={{ opacity: 0, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
                whileDrag={{ scale: 1.05, cursor: 'grabbing' }}
                className="relative group interactive-zone"
              >
                {/* Connector Line Top (if not first) */}
                {index > 0 && (
                   <div className="absolute -top-3 left-1/2 w-[1px] h-3 bg-white/50 -translate-x-1/2" />
                )}

                {/* The Block */}
                <div 
                    className="relative bg-black border border-white/20 backdrop-blur-md p-4 w-full cursor-grab active:cursor-grabbing hover:border-white transition-all duration-300 overflow-hidden group"
                >
                    {/* Art Reveal Background */}
                    <div 
                        className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                        style={{ backgroundColor: block.color }}
                    />
                    
                    {/* Content */}
                    <div className="flex items-center justify-between font-mono text-xs relative z-10">
                        <div className="flex flex-col">
                            <span className="text-[10px] opacity-50 uppercase mb-1 tracking-wider">{block.protocol}</span>
                            <span className="font-bold text-sm tracking-tight">{block.label}</span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-right hidden sm:block">
                                GAS: ~45k<br/>SLIP: 0.05%
                            </span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white hover:text-black transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Connector Line Bottom (if not last) */}
                {index < blocks.length - 1 && (
                   <div className="absolute -bottom-3 left-1/2 w-[1px] h-3 bg-white/50 -translate-x-1/2" />
                )}
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      </div>
    </div>
  );
};