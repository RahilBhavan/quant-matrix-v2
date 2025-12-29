import React from 'react';
import { Typography } from '../ui';
import { WalletButton } from './WalletButton';

interface HeaderProps {
  currentView: 'workspace' | 'backtest' | 'portfolio' | 'optimize';
  centerContent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ currentView, centerContent }) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] bg-canvas border-b border-ink z-50">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Typography variant="h2" className="font-mono tracking-tight">
            QUANT MATRIX
          </Typography>
          <div className="h-4 w-px bg-border" />
          <Typography variant="small" className="text-gray-600 uppercase">
            {currentView}
          </Typography>
        </div>

        {/* Center Section (Context-Aware) */}
        <div className="flex-1 flex justify-center">
          {centerContent}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
