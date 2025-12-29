import React, { useState, useEffect, useRef } from 'react';
import { Typography } from '../ui/Typography';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: 'workspace' | 'backtest' | 'portfolio' | 'optimize') => void;
}

const COMMANDS = [
  { id: 'workspace', label: '1. WORKSPACE', shortcut: '1' },
  { id: 'backtest', label: '2. BACKTEST', shortcut: '2' },
  { id: 'portfolio', label: '3. PORTFOLIO', shortcut: '3' },
  { id: 'optimize', label: '4. OPTIMIZE', shortcut: '4' },
] as const;

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        onNavigate(filteredCommands[selectedIndex].id as any);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop flex items-start justify-center pt-[20vh]">
      <div className="modal-window w-full max-w-[600px]">
        {/* Search Input */}
        <div className="border-b border-border pb-3">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="> _"
            className="w-full bg-transparent font-mono text-data outline-none"
          />
        </div>

        {/* Command List */}
        <div className="mt-3 space-y-1">
          {filteredCommands.map((cmd, index) => (
            <button
              key={cmd.id}
              onClick={() => {
                onNavigate(cmd.id as any);
                onClose();
              }}
              className={`w-full text-left px-3 py-2 font-mono transition-fast cursor-pointer ${index === selectedIndex
                  ? 'bg-ink text-white'
                  : 'hover:bg-gray-100'
                }`}
            >
              {cmd.label}
            </button>
          ))}
          {filteredCommands.length === 0 && (
            <Typography variant="small" className="text-gray-500 text-center py-4">
              No commands found
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};
