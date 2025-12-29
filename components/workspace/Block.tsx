import React from 'react';
import { DeFiBlock, Protocol } from '../../types';
import { Typography, DataText } from '../ui';
import { BlockSocket } from './BlockSocket';

interface BlockComponentProps {
  block: DeFiBlock;
  isSelected?: boolean;
  isError?: boolean;
  isExecuting?: boolean;
  onSelect?: () => void;
  onDoubleClick?: () => void;
}

const PROTOCOL_COLORS: Record<Protocol, string> = {
  'Uniswap': '#FF007A',
  'Aave': '#B6509E',
  'Compound': '#00D395',
};

const BLOCK_ICONS: Record<string, string> = {
  UNISWAP_SWAP: '⟲',
  PRICE_CHECK: '💹',
  CREATE_LP_POSITION: '💧',
  COLLECT_FEES: '💰',
  AAVE_SUPPLY: '↓',
  AAVE_BORROW: '↑',
  REPAY_DEBT: '↵',
  HEALTH_FACTOR_CHECK: '♥',
  IF_CONDITION: '?',
  GAS_CHECKER: '⛽',
  STOP_LOSS: '⬛',
  ARBITRAGE_DETECTOR: '🔄',
  MEV_PROTECTION: '🛡️',
  ADJUST_RANGE: '📐',
};

export const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  isSelected = false,
  isError = false,
  isExecuting = false,
  onSelect,
  onDoubleClick,
}) => {
  const protocolColor = PROTOCOL_COLORS[block.protocol];
  const icon = BLOCK_ICONS[block.type] || '•';

  // Border styling
  const getBorderClass = () => {
    if (isSelected) return 'border-2';
    if (isError) return 'border-2 border-orange';
    return 'border border-border hover:border-2 hover:border-ink';
  };

  // Background styling
  const bgClass = isSelected ? 'bg-ink' : 'bg-white';
  const textClass = isSelected ? 'text-white' : 'text-ink';

  return (
    <div
      className={`relative cursor-pointer transition-fast ${getBorderClass()}`}
      style={{
        width: '120px',
        ...(isSelected ? { borderColor: protocolColor } : {}),
      }}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
    >
      {/* Top Socket */}
      <BlockSocket position="top" protocolColor={protocolColor} />

      {/* Header */}
      <div
        className="px-2 flex items-center"
        style={{
          height: '20px',
          backgroundColor: isSelected ? 'white' : protocolColor,
        }}
      >
        <Typography
          variant="small"
          className={`font-bold uppercase ${isSelected ? 'text-ink' : 'text-white'}`}
        >
          {block.protocol}
        </Typography>
      </div>

      {/* Body */}
      <div className={`px-2 py-3 ${bgClass}`}>
        {/* Icon */}
        <div className={`text-2xl text-center mb-1 ${textClass}`}>
          {icon}
        </div>

        {/* Label */}
        <Typography
          variant="small"
          className={`text-center ${textClass}`}
        >
          {block.type.replace(/_/g, ' ')}
        </Typography>
      </div>

      {/* Params Preview (if any) */}
      {block.params && Object.keys(block.params).length > 0 && (
        <div className="bg-gray-100 px-2 py-1 border-t border-border">
          <Typography variant="small" className="text-gray-600 font-mono">
            {/* Show first 2 params */}
            {Object.entries(block.params)
              .filter(([_, value]) => value !== undefined)
              .slice(0, 2)
              .map(([key, value]) => (
                <div key={key} className="truncate">
                  • {String(value)}
                </div>
              ))}
          </Typography>
        </div>
      )}

      {/* Bottom Socket */}
      <BlockSocket position="bottom" protocolColor={protocolColor} />

      {/* Error Overlay */}
      {isError && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,85,0,0.1) 10px, rgba(255,85,0,0.1) 12px)',
          }}
        />
      )}

      {/* Executing Animation */}
      {isExecuting && (
        <div
          className="absolute inset-0 pointer-events-none border-2 animate-pulse"
          style={{ borderColor: protocolColor }}
        />
      )}
    </div>
  );
};
