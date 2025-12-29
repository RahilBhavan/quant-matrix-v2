import React from 'react';
import { Protocol } from '../../types';
import { Typography } from '../ui/Typography';

interface CategoryTabsProps {
  activeCategory: Protocol | null;
  onSelectCategory: (category: Protocol) => void;
}

const CATEGORIES = [
  { id: Protocol.UNISWAP, label: 'TRADING', color: '#FF007A' },
  { id: Protocol.AAVE, label: 'LENDING', color: '#B6509E' },
  { id: Protocol.COMPOUND, label: 'LIQUIDITY', color: '#00D395' },
  { id: Protocol.LOGIC, label: 'LOGIC', color: '#FFD93D' },
  { id: Protocol.RISK, label: 'RISK', color: '#6C63FF' },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-6 px-6 h-[40px] border-b border-border bg-white">
      {CATEGORIES.map((category) => {
        const isActive = activeCategory === category.id;
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className="h-full relative px-2 transition-all duration-100 flex items-center group cursor-pointer"
          >
            <Typography
              variant="small"
              className={`uppercase transition-colors ${
                isActive ? 'font-bold text-ink' : 'text-gray-500 group-hover:text-ink'
              }`}
            >
              {category.label}
            </Typography>
            
            {isActive && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: category.color }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};