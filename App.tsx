import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomCursor } from './components/CustomCursor';
import { Workspace } from './components/Workspace';
import { LandingPage } from './components/LandingPage';
import { PortfolioProvider } from './context/PortfolioContext';

type ViewState = 'LANDING' | 'WORKSPACE';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');

  const enterMatrix = () => {
    setView('WORKSPACE');
  };

  return (
    <PortfolioProvider>
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
            className="w-full h-full"
          >
            <Workspace />
          </motion.div>
        )}
      </AnimatePresence>
    </PortfolioProvider>
  );
};

export default App;
