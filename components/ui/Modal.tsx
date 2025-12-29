import React, { useEffect, useCallback } from 'react';
import { Typography } from './Typography';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  protocolColor?: string;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  protocolColor = '#0A0A0A',
  maxWidth = '600px',
  footer,
}) => {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(250, 250, 248, 0.95)' }}
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-ink relative"
        style={{ maxWidth, width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="h-[50px] px-6 flex items-center justify-between"
          style={{ backgroundColor: protocolColor }}
        >
          <Typography variant="h3" className="text-white uppercase font-bold">
            {title}
          </Typography>
          <button
            onClick={onClose}
            className="text-white font-mono text-lg hover:opacity-70 transition-opacity"
            aria-label="Close modal"
          >
            [×]
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer (optional) */}
        {footer && (
          <div className="px-6 pb-6 pt-0 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
