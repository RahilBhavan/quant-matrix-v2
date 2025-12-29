import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomCursor } from './components/CustomCursor';
import { Workspace } from './components/Workspace';
import { LandingPage } from './components/LandingPage';
import { Header, CommandPalette } from './components/layout';
import { Typography } from './components/ui';
import { PortfolioProvider } from './context/PortfolioContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

type ViewState = 'LANDING' | 'WORKSPACE';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [currentView, setCurrentView] = useState<'workspace' | 'backtest' | 'portfolio' | 'optimize'>('workspace');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const enterMatrix = () => {
    setView('WORKSPACE');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette with /
      if (e.key === '/' && !isPaletteOpen) {
        e.preventDefault();
        setIsPaletteOpen(true);
      }

      // Number shortcuts
      if (e.key >= '1' && e.key <= '4' && !isPaletteOpen) {
        const views = ['workspace', 'backtest', 'portfolio', 'optimize'];
        const viewIndex = parseInt(e.key) - 1;
        setCurrentView(views[viewIndex] as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaletteOpen]);

  return (
    <AccessibilityProvider>
      <PortfolioProvider>
        {/* Skip link for keyboard navigation */}
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
                    <div className="flex gap-2">
                    </div>
                  ) : null
                }
              />

              {/* Main content area - offset for fixed header */}
              <main className="pt-[60px]">
                <Workspace />
              </main>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Command Palette */}
        <CommandPalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          onNavigate={(view) => {
            setCurrentView(view);
          }}
        />

        {/* Command palette hint in bottom-right */}
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

