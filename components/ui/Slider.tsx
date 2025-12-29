import React, { useRef, useState, useEffect } from 'react';
import { Typography } from './Typography';

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  label?: string;
  formatValue?: (val: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step,
  onChange,
  label,
  formatValue = (val) => val.toString(),
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleInteract = (clientX: number) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    let newValue = min + percentage * (max - min);
    // Snap to step
    newValue = Math.round(newValue / step) * step;
    // Clamp
    newValue = Math.max(min, Math.min(max, newValue));
    
    onChange(newValue);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleInteract(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step]);

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        {label && (
          <Typography variant="small" className="uppercase text-xs font-bold text-gray-500">
            {label}
          </Typography>
        )}
        <Typography variant="data">
          {formatValue(value)}
        </Typography>
      </div>

      <div
        ref={trackRef}
        className="relative h-[24px] flex items-center cursor-pointer"
        onMouseDown={(e) => {
          setIsDragging(true);
          handleInteract(e.clientX);
        }}
      >
        {/* Track Line */}
        <div className="absolute left-0 right-0 h-[1px] bg-border" />
        
        {/* Thumb */}
        <div
          className={`absolute w-[12px] h-[12px] bg-ink transform -translate-x-1/2 transition-transform ${isDragging ? 'scale-125' : ''}`}
          style={{ left: `${percentage}%` }}
        />

        {/* Min/Max Labels */}
        <div className="absolute top-full left-0 mt-1">
          <Typography variant="small" className="text-[10px] font-mono text-gray-400">
            {formatValue(min)}
          </Typography>
        </div>
        <div className="absolute top-full right-0 mt-1">
          <Typography variant="small" className="text-[10px] font-mono text-gray-400">
            {formatValue(max)}
          </Typography>
        </div>
      </div>
    </div>
  );
};
