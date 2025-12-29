/**
 * MevProtectionToggle - Toggle component for MEV protection in HUD
 *
 * Displays Flashbots protection status and allows users to enable/disable
 * private transaction routing.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ShieldOff, Info } from 'lucide-react';
import { mevProtectionService } from '../services/web3/mevProtectionService';

interface MevProtectionToggleProps {
    className?: string;
}

export const MevProtectionToggle: React.FC<MevProtectionToggleProps> = ({
    className = '',
}) => {
    const [isEnabled, setIsEnabled] = useState(mevProtectionService.isEnabled());
    const [showTooltip, setShowTooltip] = useState(false);

    useEffect(() => {
        // Sync state with service
        setIsEnabled(mevProtectionService.isEnabled());
    }, []);

    const handleToggle = () => {
        const newState = !isEnabled;
        mevProtectionService.setEnabled(newState);
        setIsEnabled(newState);
    };

    return (
        <div className={`relative flex items-center gap-2 ${className}`}>
            {/* Toggle Button */}
            <button
                onClick={handleToggle}
                className={`
          flex items-center gap-2 px-3 py-1.5
          font-mono text-xs uppercase tracking-wider
          border transition-all duration-200
          ${isEnabled
                        ? 'bg-qm-neon-cyan/20 border-qm-neon-cyan text-qm-neon-cyan'
                        : 'bg-transparent border-white/20 text-white/60 hover:border-white/40'
                    }
        `}
                aria-label={isEnabled ? 'Disable MEV Protection' : 'Enable MEV Protection'}
            >
                <motion.div
                    initial={false}
                    animate={{ rotate: isEnabled ? 0 : -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {isEnabled ? (
                        <Shield size={14} className="text-qm-neon-cyan" />
                    ) : (
                        <ShieldOff size={14} className="opacity-60" />
                    )}
                </motion.div>
                <span>MEV</span>
                <span
                    className={`
            px-1.5 py-0.5 text-[10px]
            ${isEnabled ? 'bg-qm-neon-cyan text-black' : 'bg-white/10 text-white/60'}
          `}
                >
                    {isEnabled ? 'ON' : 'OFF'}
                </span>
            </button>

            {/* Info Icon with Tooltip */}
            <div className="relative">
                <button
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="p-1 opacity-40 hover:opacity-100 transition-opacity"
                    aria-label="MEV Protection Info"
                >
                    <Info size={12} />
                </button>

                {/* Tooltip */}
                {showTooltip && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="
              absolute right-0 top-full mt-2 z-50
              w-64 p-3 bg-black/95 border border-white/20
              font-mono text-[10px] leading-relaxed
            "
                    >
                        <div className="flex items-center gap-2 mb-2 text-qm-neon-cyan">
                            <Shield size={12} />
                            <span className="uppercase tracking-wider">Flashbots Protect</span>
                        </div>
                        <p className="text-white/70">
                            Routes transactions through Flashbots RPC to protect against
                            MEV attacks like sandwich attacks and frontrunning.
                        </p>
                        <p className="mt-2 text-white/50">
                            Your transactions stay private until included in a block.
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default MevProtectionToggle;
