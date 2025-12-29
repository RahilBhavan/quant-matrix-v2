import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error = false,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const borderClass = error
    ? 'border-2 border-error'
    : isOpen
      ? 'border-2 border-ink'
      : 'border border-border';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full h-[44px] px-3 flex items-center justify-between bg-white font-mono text-sm ${borderClass} ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer'
          }`}
      >
        <span className={selectedOption ? 'text-ink' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="text-ink">▼</span>
      </button>

      {isOpen && !disabled && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border-2 border-ink border-t-0 max-h-[200px] overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left font-mono text-sm transition-colors ${option.value === value
                  ? 'bg-ink text-white'
                  : 'hover:bg-ink hover:text-white'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
