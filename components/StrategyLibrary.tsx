import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2, Download, Upload, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { LegoBlock, SavedStrategy } from '../types';
import {
  saveStrategy,
  loadStrategy,
  listStrategies,
  deleteStrategy,
  exportData,
  importData,
  getStorageStats,
} from '../services/persistenceService';

interface StrategyLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  currentBlocks: LegoBlock[];
  onLoadStrategy: (blocks: LegoBlock[]) => void;
}

export const StrategyLibrary: React.FC<StrategyLibraryProps> = ({
  isOpen,
  onClose,
  currentBlocks,
  onLoadStrategy,
}) => {
  const [strategyName, setStrategyName] = useState('');
  const [strategies, setStrategies] = useState<SavedStrategy[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load strategies on mount and when panel opens
  useEffect(() => {
    if (isOpen) {
      refreshStrategies();
    }
  }, [isOpen]);

  const refreshStrategies = () => {
    const loadedStrategies = listStrategies();
    setStrategies(loadedStrategies.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
  };

  const handleSave = () => {
    if (!strategyName.trim()) {
      setError('Please enter a strategy name');
      return;
    }

    if (currentBlocks.length === 0) {
      setError('Cannot save empty strategy');
      return;
    }

    try {
      saveStrategy(strategyName.trim(), currentBlocks);
      setSaveMessage(`Strategy "${strategyName}" saved successfully`);
      setError(null);
      setStrategyName('');
      refreshStrategies();

      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save strategy');
    }
  };

  const handleLoad = (id: string) => {
    const strategy = loadStrategy(id);
    if (strategy) {
      onLoadStrategy(strategy.blocks);
      setSaveMessage(`Loaded "${strategy.name}"`);
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setError('Failed to load strategy');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete strategy "${name}"?`)) {
      const success = deleteStrategy(id);
      if (success) {
        setSaveMessage(`Deleted "${name}"`);
        refreshStrategies();
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        setError('Failed to delete strategy');
      }
    }
  };

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quant-matrix-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSaveMessage('Data exported successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = event.target?.result as string;
            importData(json);
            setSaveMessage('Data imported successfully');
            refreshStrategies();
            setTimeout(() => setSaveMessage(null), 3000);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import data');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const storageStats = getStorageStats();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 h-screen w-full md:w-[400px] bg-black border-r border-white z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-black border-b border-white p-6 flex items-center justify-between z-10">
              <h2 className="font-sans font-bold text-2xl tracking-tighter">STRATEGY_LIB</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:text-black transition-colors interactive-zone"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Save Current Strategy */}
              <div className="space-y-4">
                <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">Save Current</h3>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSave()}
                    placeholder="Strategy name..."
                    className="flex-1 bg-transparent border border-white/20 px-3 py-2 font-mono text-sm focus:border-qm-neon-cyan outline-none"
                  />
                  <button
                    onClick={handleSave}
                    disabled={!strategyName.trim() || currentBlocks.length === 0}
                    className="px-4 py-2 bg-white text-black hover:bg-qm-neon-cyan transition-colors disabled:opacity-30 disabled:cursor-not-allowed interactive-zone flex items-center gap-2"
                  >
                    <Save size={16} />
                    SAVE
                  </button>
                </div>

                <div className="font-mono text-[10px] opacity-50">
                  {currentBlocks.length} block{currentBlocks.length !== 1 ? 's' : ''} in current strategy
                </div>

                {saveMessage && (
                  <div className="border border-qm-neon-cyan p-3 bg-qm-neon-cyan/10">
                    <p className="font-mono text-xs text-qm-neon-cyan">{saveMessage}</p>
                  </div>
                )}

                {error && (
                  <div className="border border-red-500 p-3 bg-red-500/10">
                    <p className="font-mono text-xs text-red-500">{error}</p>
                  </div>
                )}
              </div>

              {/* Storage Stats */}
              <div className="border border-white/20 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={12} className="opacity-50" />
                  <span className="font-mono text-[10px] opacity-60 uppercase tracking-widest">Storage</span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="opacity-60">Used:</span>
                    <span>{(storageStats.used / 1024).toFixed(0)} KB / {(storageStats.total / 1024).toFixed(0)} KB</span>
                  </div>
                  <div className="w-full bg-white/10 h-1">
                    <div
                      className="bg-qm-neon-cyan h-1"
                      style={{ width: `${Math.min(storageStats.usedPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between opacity-60">
                    <span>{storageStats.strategiesCount} strategies</span>
                    <span>{storageStats.backtestsCount} backtests</span>
                  </div>
                </div>
              </div>

              {/* Import/Export */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExport}
                  className="px-3 py-2 border border-white/20 hover:bg-white hover:text-black transition-colors interactive-zone flex items-center justify-center gap-2 font-mono text-xs"
                >
                  <Download size={14} />
                  EXPORT
                </button>
                <button
                  onClick={handleImport}
                  className="px-3 py-2 border border-white/20 hover:bg-white hover:text-black transition-colors interactive-zone flex items-center justify-center gap-2 font-mono text-xs"
                >
                  <Upload size={14} />
                  IMPORT
                </button>
              </div>

              {/* Saved Strategies List */}
              <div className="space-y-4">
                <h3 className="font-mono text-xs tracking-widest opacity-60 uppercase">
                  Saved ({strategies.length})
                </h3>

                {strategies.length === 0 ? (
                  <div className="border border-white/10 p-6 text-center">
                    <p className="font-mono text-xs opacity-40">No saved strategies</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {strategies.map((strategy) => (
                      <div
                        key={strategy.id}
                        className="border border-white/20 p-4 hover:bg-white/5 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-sans font-bold text-sm">{strategy.name}</h4>
                            <p className="font-mono text-[10px] opacity-50 mt-1">
                              {strategy.blocks.length} block{strategy.blocks.length !== 1 ? 's' : ''} · Updated {format(new Date(strategy.updatedAt), 'MM/dd/yyyy')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDelete(strategy.id, strategy.name)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <button
                          onClick={() => handleLoad(strategy.id)}
                          className="w-full bg-white text-black py-2 text-xs font-bold hover:bg-qm-neon-cyan transition-colors"
                        >
                          LOAD_STRATEGY
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
