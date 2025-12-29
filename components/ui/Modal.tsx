import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Typography } from './Typography';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  headerColor?: string;
  children: React.ReactNode;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  headerColor = '#0A0A0A',
  children,
  width = '600px',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 bg-canvas/95 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Window */}
          <motion.div
            ref={modalRef}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.1, ease: 'linear' }}
            className="relative bg-white border-2 border-ink w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            style={{ maxWidth: width }}
          >
            {/* Header */}
            <div
              className="h-[50px] px-6 flex items-center justify-between"
              style={{ backgroundColor: headerColor }}
            >
              <Typography variant="h3" className="text-white uppercase font-bold tracking-wider">
                {title}
              </Typography>
              <button
                onClick={onClose}
                className="text-white hover:text-white/80 font-mono text-lg transition-fast"
              >
                [×]
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
