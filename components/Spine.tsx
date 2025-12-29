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

import { LegoBlock, Protocol, BlockParams } from '../types';

import { BlockComponent } from './workspace/Block';



interface SpineProps {

  blocks: LegoBlock[];

  setBlocks: (blocks: LegoBlock[]) => void;

  isValid: boolean;

  selectedBlockId?: string | null;

  onBlockSelect?: (blockId: string) => void;

  editingBlockId?: string | null;

  onEditBlock?: (blockId: string | null) => void;

}



/**

 * Manhattan Connector (Straight Lines)

 */

const ManhattanConnector: React.FC<{ color: string }> = ({ color }) => {

  return (

    <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-8 -top-8 bg-ink z-0 flex flex-col items-center justify-center">

      {/* Execution Dot (Animation placeholder) */}

      <div className="w-[6px] h-[6px] bg-orange opacity-0 animate-pulse" />

    </div>

  );

};



export const Spine: React.FC<SpineProps> = ({

  blocks,

  setBlocks,

  isValid,

  selectedBlockId: externalSelectedBlockId,

  onBlockSelect,

  editingBlockId: externalEditingBlockId,

  onEditBlock,

}) => {

  // Use local state as fallback when external control is not provided

  const [localEditingBlockId, setLocalEditingBlockId] = useState<string | null>(null);



  // Prefer external control if provided

  const editingBlockId = externalEditingBlockId !== undefined ? externalEditingBlockId : localEditingBlockId;

  const setEditingBlockId = onEditBlock || setLocalEditingBlockId;



  const removeBlock = useCallback(

    (id: string) => {

      setBlocks(blocks.filter((b) => b.id !== id));

      if (editingBlockId === id) {

        setEditingBlockId(null);

      }

    },

    [blocks, setBlocks, editingBlockId, setEditingBlockId]

  );



  const handleEdit = useCallback((blockId: string) => {

    setEditingBlockId(blockId);

  }, [setEditingBlockId]);



  // Simple block validation (can be enhanced)

  const isBlockValid = useCallback((block: LegoBlock): boolean => {

    if (!block.params) return true;

    if (block.params.ticker && block.params.ticker.length === 0) return false;

    if (block.params.quantity !== undefined && block.params.quantity < 1) return false;

    return true;

  }, []);



  return (

    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">

      {/* The Platform/Spine Background */}

      <div

        className="absolute h-[80vh] w-[140px] top-[10vh] border-x border-dashed border-gray-300 bg-gray-50/50"

      />



      {/* The Droppable Area */}

      <div className="h-[80vh] w-full max-w-md pointer-events-auto overflow-y-auto no-scrollbar py-12 px-4 relative flex flex-col items-center">

        {blocks.length === 0 && (

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            className="absolute top-1/2 -translate-y-1/2 text-center"

          >

            <div className="w-[120px] h-[100px] border-2 border-dashed border-orange flex items-center justify-center bg-white/50">

               <span className="font-mono text-xs text-orange font-bold uppercase">

                 [ DROP HERE ]

               </span>

            </div>

          </motion.div>

        )}



        <Reorder.Group

          axis="y"

          values={blocks}

          onReorder={setBlocks}

          className="w-full flex flex-col items-center gap-8" // gap-8 = 32px spacing (24px min + connector)

        >

          <AnimatePresence>

            {blocks.map((block, index) => (

              <Reorder.Item

                key={block.id}

                value={block}

                initial={{ opacity: 0, scale: 0.9, y: 20 }}

                animate={{ opacity: 1, scale: 1, y: 0 }}

                exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}

                whileDrag={{ scale: 1.05, cursor: 'grabbing', zIndex: 50 }}

                className="relative"

              >

                {/* Connector for items after the first */}

                {index > 0 && <ManhattanConnector color="#0A0A0A" />}



                <BlockComponent

                  block={block}

                  isSelected={editingBlockId === block.id} // Reusing editing ID for selection for now

                  isError={!isBlockValid(block)}

                  onSelect={() => handleEdit(block.id)}

                  onDoubleClick={() => handleEdit(block.id)}

                />

                

                {/* Delete button (hover only) */}

                <button

                  onClick={(e) => {

                    e.stopPropagation();

                    removeBlock(block.id);

                  }}

                  className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"

                >

                  [×]

                </button>

              </Reorder.Item>

            ))}

          </AnimatePresence>

        </Reorder.Group>

      </div>

    </div>

  );

};
