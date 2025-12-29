/**
 * MarketMoment Component
 * 
 * Rotating ticker displaying live market data: ETH price → GAS → TVL
 * Updates every 3 seconds with vertical slide transition per PRD.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketData {
    label: string;
    value: string;
}

const MOCK_DATA: MarketData[] = [
    { label: 'ETH', value: '$2,450.32' },
    { label: 'GAS', value: '12 GWEI' },
    { label: 'TVL', value: '$42.5B' },
];

interface MarketMomentProps {
    className?: string;
}

export const MarketMoment: React.FC<MarketMomentProps> = ({ className = '' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [data] = useState<MarketData[]>(MOCK_DATA);

    // Rotate every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % data.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [data.length]);

    const current = data[currentIndex];

    return (
        <div className={`font-mono text-xs uppercase tracking-widest ${className}`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="flex items-center gap-2"
                >
                    <span className="opacity-50">{current.label}:</span>
                    <span className="font-bold">{current.value}</span>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
