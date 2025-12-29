import React, { useCallback } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  label,
  unit = '',
  disabled = false,
  className = '',
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );

  return (
    <div className={`${className}`}>
      {/* Label and Value */}
      <div className="flex items-center justify-between mb-2">
        {label && (
          <span className="font-mono text-xs text-gray-600 uppercase">{label}</span>
        )}
        <span className="font-mono text-sm font-medium">
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </span>
      </div>

      {/* Track and Thumb */}
      <div className="relative h-6 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-[1px] bg-gray-300" />

        {/* Filled track */}
        <div
          className="absolute left-0 h-[1px] bg-ink"
          style={{ width: `${percentage}%` }}
        />

        {/* Native range input (styled) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {/* Custom thumb */}
        <div
          className="absolute w-3 h-3 bg-ink pointer-events-none"
          style={{
            left: `calc(${percentage}% - 6px)`,
          }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex items-center justify-between mt-1">
        <span className="font-mono text-xs text-gray-400">{min}{unit}</span>
        <span className="font-mono text-xs text-gray-400">{max}{unit}</span>
      </div>
    </div>
  );
};
