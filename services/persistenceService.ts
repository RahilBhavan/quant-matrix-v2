/**
 * Persistence Service
 *
 * Manages LocalStorage operations for strategies, backtest results, and settings.
 * Handles quota exceeded and JSON parse errors gracefully.
 */

import { SavedStrategy, BacktestRecord, LegoBlock } from '../types';

// LocalStorage keys
const STRATEGIES_KEY = 'qm_strategies';
const BACKTESTS_KEY = 'qm_backtests';
const SETTINGS_KEY = 'qm_settings';

// ==================== STRATEGY PERSISTENCE ====================

/**
 * Save a strategy to LocalStorage
 * @param name - Strategy name
 * @param blocks - Strategy blocks
 * @returns Saved strategy with ID
 */
export function saveStrategy(name: string, blocks: LegoBlock[]): SavedStrategy {
  const strategies = listStrategies();

  // Check if strategy with same name exists
  const existingIndex = strategies.findIndex(s => s.name === name);

  const strategy: SavedStrategy = {
    id: existingIndex >= 0 ? strategies[existingIndex].id : generateId(),
    name,
    blocks,
    createdAt: existingIndex >= 0 ? strategies[existingIndex].createdAt : new Date(),
    updatedAt: new Date(),
  };

  if (existingIndex >= 0) {
    // Update existing strategy
    strategies[existingIndex] = strategy;
  } else {
    // Add new strategy
    strategies.push(strategy);
  }

  saveToLocalStorage(STRATEGIES_KEY, strategies);
  return strategy;
}

/**
 * Load a strategy by ID
 * @param id - Strategy ID
 * @returns Strategy or null if not found
 */
export function loadStrategy(id: string): SavedStrategy | null {
  const strategies = listStrategies();
  return strategies.find(s => s.id === id) || null;
}

/**
 * List all saved strategies
 * @returns Array of saved strategies
 */
export function listStrategies(): SavedStrategy[] {
  const data = loadFromLocalStorage<SavedStrategy[]>(STRATEGIES_KEY);
  return data || [];
}

/**
 * Delete a strategy by ID
 * @param id - Strategy ID
 * @returns True if deleted, false if not found
 */
export function deleteStrategy(id: string): boolean {
  const strategies = listStrategies();
  const index = strategies.findIndex(s => s.id === id);

  if (index >= 0) {
    strategies.splice(index, 1);
    saveToLocalStorage(STRATEGIES_KEY, strategies);

    // Also delete associated backtest results
    const backtests = listBacktestResults();
    const filteredBacktests = backtests.filter(b => b.strategyId !== id);
    saveToLocalStorage(BACKTESTS_KEY, filteredBacktests);

    return true;
  }

  return false;
}

// ==================== BACKTEST PERSISTENCE ====================

/**
 * Save a backtest result
 * @param record - Backtest record
 * @returns Saved record with ID
 */
export function saveBacktestResult(record: Omit<BacktestRecord, 'id' | 'timestamp'>): BacktestRecord {
  const backtests = listBacktestResults();

  const newRecord: BacktestRecord = {
    ...record,
    id: generateId(),
    timestamp: new Date(),
  };

  backtests.push(newRecord);

  // Keep only last 50 backtest results per strategy to avoid quota issues
  const strategyBacktests = backtests.filter(b => b.strategyId === record.strategyId);
  if (strategyBacktests.length > 50) {
    // Remove oldest
    const oldestId = strategyBacktests.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )[0].id;
    const index = backtests.findIndex(b => b.id === oldestId);
    if (index >= 0) {
      backtests.splice(index, 1);
    }
  }

  saveToLocalStorage(BACKTESTS_KEY, backtests);
  return newRecord;
}

/**
 * Load backtest results for a strategy
 * @param strategyId - Strategy ID (optional, returns all if not provided)
 * @returns Array of backtest records
 */
export function loadBacktestResults(strategyId?: string): BacktestRecord[] {
  const backtests = listBacktestResults();

  if (strategyId) {
    return backtests.filter(b => b.strategyId === strategyId);
  }

  return backtests;
}

/**
 * List all backtest results
 * @returns Array of backtest records
 */
function listBacktestResults(): BacktestRecord[] {
  const data = loadFromLocalStorage<BacktestRecord[]>(BACKTESTS_KEY);
  return data || [];
}

/**
 * Delete a backtest result by ID
 * @param id - Backtest ID
 * @returns True if deleted, false if not found
 */
export function deleteBacktestResult(id: string): boolean {
  const backtests = listBacktestResults();
  const index = backtests.findIndex(b => b.id === id);

  if (index >= 0) {
    backtests.splice(index, 1);
    saveToLocalStorage(BACKTESTS_KEY, backtests);
    return true;
  }

  return false;
}

// ==================== SETTINGS PERSISTENCE ====================

export interface AppSettings {
  theme?: 'dark' | 'light';
  defaultCapital?: number;
  showHints?: boolean;
  autoSaveStrategies?: boolean;
  defaultBacktestPeriod?: string;
}

/**
 * Save application settings
 * @param settings - Settings object
 */
export function saveSettings(settings: AppSettings): void {
  saveToLocalStorage(SETTINGS_KEY, settings);
}

/**
 * Load application settings
 * @returns Settings object or default settings
 */
export function loadSettings(): AppSettings {
  const settings = loadFromLocalStorage<AppSettings>(SETTINGS_KEY);
  return settings || {
    theme: 'dark',
    defaultCapital: 100000,
    showHints: true,
    autoSaveStrategies: false,
    defaultBacktestPeriod: '1y',
  };
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Save data to LocalStorage with error handling
 */
function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded. Clearing old data...');

        // Try to free up space by clearing backtest results
        if (key !== BACKTESTS_KEY) {
          localStorage.removeItem(BACKTESTS_KEY);

          // Try again
          try {
            const json = JSON.stringify(data);
            localStorage.setItem(key, json);
          } catch (retryError) {
            console.error('Failed to save after clearing backtests:', retryError);
            throw new Error('LocalStorage quota exceeded. Please delete some strategies or backtest results.');
          }
        } else {
          throw new Error('LocalStorage quota exceeded. Unable to save backtest result.');
        }
      } else {
        console.error('Failed to save to LocalStorage:', error);
        throw error;
      }
    }
  }
}

/**
 * Load data from LocalStorage with error handling
 */
function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const json = localStorage.getItem(key);
    if (!json) return null;

    const data = JSON.parse(json);

    // Convert date strings back to Date objects
    return deserializeDates(data);
  } catch (error) {
    console.error('Failed to load from LocalStorage:', error);
    return null;
  }
}

/**
 * Recursively convert date strings to Date objects
 */
function deserializeDates<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Check if string is ISO date format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (isoDateRegex.test(obj)) {
      return new Date(obj) as any;
    }
    return obj as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deserializeDates(item)) as any;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = deserializeDates(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get LocalStorage usage statistics
 */
export function getStorageStats(): {
  used: number;
  total: number;
  usedPercent: number;
  strategiesCount: number;
  backtestsCount: number;
} {
  let used = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    }
  }

  // Typical LocalStorage limit is 5-10MB, assume 5MB (5 * 1024 * 1024 bytes)
  const total = 5 * 1024 * 1024;
  const usedPercent = (used / total) * 100;

  return {
    used,
    total,
    usedPercent,
    strategiesCount: listStrategies().length,
    backtestsCount: listBacktestResults().length,
  };
}

/**
 * Clear all Quant Matrix data from LocalStorage
 */
export function clearAllData(): void {
  localStorage.removeItem(STRATEGIES_KEY);
  localStorage.removeItem(BACKTESTS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
}

/**
 * Export all data as JSON (for backup)
 */
export function exportData(): string {
  const data = {
    strategies: listStrategies(),
    backtests: listBacktestResults(),
    settings: loadSettings(),
    exportDate: new Date(),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import data from JSON (for restore)
 */
export function importData(json: string): void {
  try {
    const data = JSON.parse(json);

    if (data.strategies) {
      saveToLocalStorage(STRATEGIES_KEY, data.strategies);
    }

    if (data.backtests) {
      saveToLocalStorage(BACKTESTS_KEY, data.backtests);
    }

    if (data.settings) {
      saveToLocalStorage(SETTINGS_KEY, data.settings);
    }
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Invalid backup file format');
  }
}
