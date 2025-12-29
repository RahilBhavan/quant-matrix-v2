import React from 'react';
import { Protocol } from '../../types';
import { AVAILABLE_BLOCKS, BLOCK_METADATA } from '../../constants';
import { Typography } from '../ui/Typography';

interface BlockPaletteProps {
  activeCategory: Protocol | null;
  onAddBlock: (type: string) => void;
  onDragStart: (type: string) => void;
}

export const BlockPalette: React.FC<BlockPaletteProps> = ({
  activeCategory,
  onAddBlock,
  onDragStart,
}) => {
  if (!activeCategory) return null;

  const filteredBlocks = AVAILABLE_BLOCKS.filter(
    (block) => block.protocol === activeCategory
  );

  return (
    <div className="absolute top-[100px] left-0 right-0 z-30 px-6 pointer-events-none">
      <div className="flex flex-wrap gap-4 pointer-events-auto">
        {filteredBlocks.map((block) => {
          // Type casting for metadata lookup key
          const blockType = block.type as keyof typeof BLOCK_METADATA;
          const icon = BLOCK_METADATA[blockType]?.icon || '•';
          
          return (
            <div
              key={block.type}
              className="w-[80px] h-[100px] bg-white border border-border hover:border-ink cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-fast flex flex-col"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/react-dnd', block.type);
                onDragStart(block.type);
              }}
              onClick={() => onAddBlock(block.type)}
            >
              {/* Protocol Color Bar */}
              <div
                className="h-[4px] w-full"
                style={{ backgroundColor: block.color }}
              />
              
              {/* Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-2 text-center gap-2">
                <div className="text-2xl" style={{ color: block.color }}>
                  {icon}
                </div>
                <Typography variant="small" className="text-[10px] leading-tight font-medium">
                  {block.label}
                </Typography>
              </div>

              {/* Drag Handle Hint (Visual only) */}
              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-20">
                ⋮⋮
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
