import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onEnterMatrix: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterMatrix }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [keyboardHolding, setKeyboardHolding] = useState(false);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = () => {
    setIsHolding(true);
    setProgress(0);

    // Progress animation (0-100 over 1200ms)
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / 1200) * 100, 100);
      setProgress(newProgress);
    }, 16); // ~60fps

    // Trigger transition after 1200ms
    holdTimeoutRef.current = setTimeout(() => {
      onEnterMatrix();
    }, 1200);
  };

  const endHold = () => {
    setIsHolding(false);
    setProgress(0);
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  // Keyboard handlers
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!keyboardHolding) {
        setKeyboardHolding(true);
        startHold();
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setKeyboardHolding(false);
      endHold();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-canvas text-ink flex items-center justify-center p-6">
      {/* Top-Left: Beta Badge */}
      <div className="fixed top-6 left-6 z-50">
        <span className="font-mono text-small uppercase text-gray-600">
          [BETA]
        </span>
      </div>

      {/* Top-Right: Network Status */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <div className="w-2 h-2 bg-success" />
        <span className="font-mono text-small uppercase text-gray-600">
          SEPOLIA TESTNET
        </span>
      </div>

      {/* Central Content */}
      <div className="flex flex-col items-center">
        {/* Logo */}
        <h1 className="font-mono font-bold text-[48px] md:text-[64px] uppercase tracking-wider text-ink text-center mb-3">
          QUANT MATRIX
        </h1>

        {/* Tagline */}
        <p className="font-sans text-body text-gray-600 text-center mb-12">
          Visual DeFi Logic Compiler
        </p>

        {/* Hold Button */}
        <button
          onMouseDown={startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={startHold}
          onTouchEnd={endHold}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          className="relative w-[240px] md:w-[240px] h-[60px] border-2 border-ink font-mono font-bold text-small uppercase overflow-hidden transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
          aria-label="Hold for 1.2 seconds to enter workspace"
        >
          {/* Progress fill */}
          <div
            className="absolute inset-0 bg-orange transition-all duration-75"
            style={{
              width: `${progress}%`,
              transitionProperty: 'width'
            }}
          />

          {/* Button text */}
          <span
            className={`relative z-10 transition-colors duration-200 ${
              progress > 50 ? 'text-white' : 'text-ink'
            }`}
          >
            HOLD TO EXECUTE
          </span>
        </button>
      </div>

      {/* Bottom Disclaimer */}
      <div className="fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center gap-3">
        {/* Optional separator line */}
        <div className="w-[200px] h-px bg-border" />

        <p className="font-sans text-small text-gray-400 text-center">
          Testnet only. Not financial advice.
        </p>
      </div>
    </div>
  );
};
