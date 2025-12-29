import React, { memo, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AVAILABLE_BLOCKS, BLOCK_METADATA } from '../constants';
import { Plus, ChevronDown } from 'lucide-react';

interface ActionRibbonProps {
  onAddBlock: (blockType: string) => void;
}

// Block categories for organization
const BLOCK_CATEGORIES = {
  Triggers: {
    description: 'Condition checks',
    types: ['PRICE_CHECK', 'HEALTH_FACTOR_CHECK', 'IF_CONDITION', 'GAS_CHECKER'],
  },
  Actions: {
    description: 'Execute operations',
    types: ['UNISWAP_SWAP', 'AAVE_SUPPLY', 'AAVE_BORROW', 'REPAY_DEBT'],
  },
  Liquidity: {
    description: 'LP management',
    types: ['CREATE_LP_POSITION', 'COLLECT_FEES'],
  },
  Risk: {
    description: 'Risk controls',
    types: ['STOP_LOSS', 'POSITION_SIZE'],
  },
} as const;

type CategoryKey = keyof typeof BLOCK_CATEGORIES;

export const ActionRibbon: React.FC<ActionRibbonProps> = memo(({ onAddBlock }) => {
  const [activeCategory, setActiveCategory] = useState<CategoryKey | 'all'>('all');

  // Group blocks by category
  const categorizedBlocks = useMemo(() => {
    const result: Record<CategoryKey, typeof AVAILABLE_BLOCKS> = {
      Triggers: [],
      Actions: [],
      Liquidity: [],
      Risk: [],
    };

    AVAILABLE_BLOCKS.forEach((block) => {
      for (const [category, config] of Object.entries(BLOCK_CATEGORIES)) {
        if (config.types.includes(block.type as any)) {
          result[category as CategoryKey].push(block);
          break;
        }
      }
    });

    return result;
  }, []);

  // Get blocks to display based on filter
  const displayBlocks = useMemo(() => {
    if (activeCategory === 'all') {
      return AVAILABLE_BLOCKS;
    }
    return categorizedBlocks[activeCategory];
  }, [activeCategory, categorizedBlocks]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black border-t border-white/10 z-40 backdrop-blur-sm">
      {/* Category Tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === 'all'
            ? 'bg-white text-black'
            : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
        >
          All ({AVAILABLE_BLOCKS.length})
        </button>
        {(Object.keys(BLOCK_CATEGORIES) as CategoryKey[]).map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeCategory === category
              ? 'bg-white text-black'
              : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
          >
            {category}
            <span className="opacity-60">({categorizedBlocks[category].length})</span>
          </button>
        ))}
      </div>

      {/* Block List */}
      <div className="h-20 flex items-center overflow-x-auto no-scrollbar pl-4">
        {/* Category Label */}
        <div className="flex-shrink-0 mr-6 font-mono text-xs opacity-60 rotate-180 text-vertical-lr h-12 border-r border-white/20 pr-4 select-none">
          {activeCategory === 'all' ? 'ALL_MODULES' : activeCategory.toUpperCase()}
        </div>

        {/* Blocks */}
        <AnimatePresence mode="popLayout">
          {displayBlocks.map((block, index) => {
            const meta = BLOCK_METADATA[block.type as keyof typeof BLOCK_METADATA];

            return (
              <motion.button
                key={block.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAddBlock(block.type)}
                className="group relative flex-shrink-0 w-44 h-14 border-r border-white/10 hover:bg-white/5 transition-colors text-left px-3 py-2 interactive-zone flex flex-col justify-between"
              >
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">{meta?.icon || '●'}</span>
                    <span className="font-mono text-[9px] opacity-60 uppercase">{meta?.category || block.protocol}</span>
                  </div>
                  <Plus size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="font-sans font-bold text-xs tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400 truncate">
                  {block.label}
                </div>

                {/* Art Bar */}
                <div
                  className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-300"
                  style={{ backgroundColor: block.color }}
                />
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Infinite scroll buffer */}
        <div className="w-24 flex-shrink-0" />
      </div>
    </div>
  );
});

ActionRibbon.displayName = 'ActionRibbon';
