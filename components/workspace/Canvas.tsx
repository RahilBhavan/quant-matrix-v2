import React from 'react';
import { Typography } from '../ui/Typography';

interface CanvasProps {
  isEmpty: boolean;
  children?: React.ReactNode;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  isEmpty,
  children,
  zoom = 100,
  onZoomChange,
}) => {
  const handleZoomIn = () => {
    if (zoom < 150 && onZoomChange) {
      onZoomChange(zoom + 25);
    }
  };

  const handleZoomOut = () => {
    if (zoom > 50 && onZoomChange) {
      onZoomChange(zoom - 25);
    }
  };

  const handleZoomReset = () => {
    if (onZoomChange) {
      onZoomChange(100);
    }
  };

  return (
    <div className="relative w-full h-full dot-grid bg-canvas overflow-hidden">
      {/* Empty State */}
      {isEmpty && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Typography variant="h2" className="mb-3 text-gray-600">
              [ CANVAS READY ]
            </Typography>
            <Typography variant="small" className="text-gray-500">
              SELECT CATEGORY ABOVE OR<br />
              PRESS / TO BEGIN
            </Typography>
          </div>
        </div>
      )}

      {/* Canvas Content */}
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${zoom / 100})` }}
      >
        {children}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white border border-border px-2 py-1">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 50}
          className="px-2 py-1 font-mono text-small hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          -
        </button>
        <button
          onClick={handleZoomReset}
          className="px-3 py-1 font-mono text-small hover:bg-gray-100"
        >
          {zoom}%
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 150}
          className="px-2 py-1 font-mono text-small hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          +
        </button>
      </div>
    </div>
  );
};
