import React, { useState, useRef, useEffect } from 'react';
import { Typography } from './Typography';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  options,
  onChange,
  label,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <Typography variant="small" className="uppercase text-xs font-bold text-gray-500 mb-1 block">
          {label}
        </Typography>
      )}
      
      <div
        className={`border ${isOpen ? 'border-ink border-2' : 'border-border'} bg-white px-3 py-2 cursor-pointer flex items-center justify-between transition-fast h-[40px]`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Typography variant="data" className="truncate">
          {selectedOption ? selectedOption.label : value}
        </Typography>
        <span className="font-mono text-xs">▼</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-ink z-50 max-h-[200px] overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              className={`px-3 py-2 cursor-pointer hover:bg-ink hover:text-white transition-fast font-mono text-sm ${
                option.value === value ? 'bg-gray-100' : ''
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
