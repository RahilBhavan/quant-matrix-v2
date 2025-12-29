import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomCursor } from './components/CustomCursor';
import { Workspace } from './components/Workspace';
import { LandingPage } from './components/LandingPage';
import { Header } from './components/layout/Header';
import { CommandPalette } from './components/layout/CommandPalette';
import { Typography } from './components/ui/Typography';
import { PortfolioProvider } from './context/PortfolioContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

import { CategoryTabs } from './components/workspace/CategoryTabs';
import { PortfolioDashboard } from './components/dashboard/PortfolioDashboard';
import { Protocol } from './types';

type ViewState = 'LANDING' | 'WORKSPACE';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [currentView, setCurrentView] = useState<'workspace' | 'backtest' | 'portfolio' | 'optimize'>('workspace');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Protocol | null>(Protocol.UNISWAP);

  const enterMatrix = () => {
    setView('WORKSPACE');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !isPaletteOpen) {
        e.preventDefault();
        setIsPaletteOpen(true);
      }

      if (e.key >= '1' && e.key <= '4' && !isPaletteOpen) {
        const views = ['workspace', 'backtest', 'portfolio', 'optimize'] as const;
        const viewIndex = parseInt(e.key) - 1;
        setCurrentView(views[viewIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen]);

  return (
    <AccessibilityProvider>
      <PortfolioProvider>
        <a href="#main-workspace" className="skip-link">
          Skip to main content
        </a>

        <CustomCursor />

        <AnimatePresence mode="wait">
          {view === 'LANDING' && (
            <motion.div
              key="landing"
              exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.5 } }}
              className="w-full"
            >
              <LandingPage onEnterMatrix={enterMatrix} />
            </motion.div>
          )}

          {view === 'WORKSPACE' && (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "circOut" }}
              className="w-full h-full min-h-screen bg-canvas"
              id="main-workspace"
              role="main"
              aria-label="Strategy workspace"
            >
              <Header
                currentView={currentView}
                centerContent={
                  currentView === 'workspace' ? (
                    <CategoryTabs
                      activeCategory={activeCategory}
                      onSelectCategory={setActiveCategory}
                    />
                  ) : null
                }
              />

              <main className="pt-[60px] h-full overflow-y-auto">
                {currentView === 'workspace' && <Workspace activeCategory={activeCategory} />}
                {currentView === 'portfolio' && <PortfolioDashboard />}
                {(currentView === 'backtest' || currentView === 'optimize') && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Typography variant="h2" className="text-gray-400 mb-2">
                        [ VIEW UNDER CONSTRUCTION ]
                      </Typography>
                      <Typography variant="small" className="text-gray-400">
                        PLEASE RETURN TO WORKSPACE
                      </Typography>
                    </div>
                  </div>
                )}
              </main>
            </motion.div>
          )}
        </AnimatePresence>

        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          onNavigate={(view) => {
            setCurrentView(view);
          }}
        />

        <div className="fixed bottom-4 right-4 z-40">
          <Typography variant="small" className="text-gray-500 font-mono">
            [/]
          </Typography>
        </div>
      </PortfolioProvider>
    </AccessibilityProvider>
  );
};

export default App;