import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { AVAILABLE_BLOCKS } from '../constants';
import { Plus } from 'lucide-react';

interface ActionRibbonProps {
  onAddBlock: (blockType: string) => void;
}

export const ActionRibbon: React.FC<ActionRibbonProps> = memo(({ onAddBlock }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full h-24 bg-black border-t border-white/10 z-40 backdrop-blur-sm">
      <div className="h-full flex items-center overflow-x-auto no-scrollbar pl-8 space-x-0">
        <div className="flex-shrink-0 mr-8 font-mono text-xs opacity-40 rotate-180 text-vertical-lr h-12 border-r border-white/20 pr-4 select-none">
            AVAILABLE_MODULES
        </div>
        
        {AVAILABLE_BLOCKS.map((block) => (
          <motion.button
            key={block.type}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAddBlock(block.type)}
            className="group relative flex-shrink-0 w-48 h-16 border-r border-white/10 hover:bg-white/5 transition-colors text-left p-3 interactive-zone flex flex-col justify-between"
          >
             <div className="flex justify-between items-start w-full">
                <span className="font-mono text-[10px] opacity-50">{block.protocol}</span>
                <Plus size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
             <div className="font-sans font-bold text-sm tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-400">
                {block.label}
             </div>
             
             {/* Art Bar */}
             <div 
                className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-300"
                style={{ backgroundColor: block.color }}
             />
          </motion.button>
        ))}
        
        {/* Infinite scroll buffer */}
        <div className="w-24 flex-shrink-0" />
      </div>
    </div>
  );
});

ActionRibbon.displayName = 'ActionRibbon';
