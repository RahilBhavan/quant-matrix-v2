/**
 * useBacktestWorker Hook
 * 
 * Manages Web Worker lifecycle for running backtests off the main thread.
 * Provides progress updates, result handling, and cancellation.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { BacktestConfig, BacktestResult } from '../types';
import type { WorkerMessage, WorkerResponse } from '../workers/backtestWorker';

interface ProgressState {
    step: number;
    message: string;
    percent: number;
}

interface UseBacktestWorkerReturn {
    run: (config: BacktestConfig) => void;
    cancel: () => void;
    isRunning: boolean;
    progress: ProgressState;
    result: BacktestResult | null;
    error: string | null;
}

export function useBacktestWorker(): UseBacktestWorkerReturn {
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState<ProgressState>({ step: 0, message: '', percent: 0 });
    const [result, setResult] = useState<BacktestResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const workerRef = useRef<Worker | null>(null);

    // Initialize worker on mount
    useEffect(() => {
        // Create worker using Vite's worker import syntax
        workerRef.current = new Worker(
            new URL('../workers/backtestWorker.ts', import.meta.url),
            { type: 'module' }
        );

        // Handle messages from worker
        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { type } = e.data;

            switch (type) {
                case 'PROGRESS':
                    setProgress({
                        step: e.data.step,
                        message: e.data.message,
                        percent: e.data.percent,
                    });
                    break;

                case 'COMPLETE':
                    setResult(e.data.result);
                    setIsRunning(false);
                    setProgress({ step: 0, message: '', percent: 0 });
                    break;

                case 'ERROR':
                    setError(e.data.error);
                    setIsRunning(false);
                    setProgress({ step: 0, message: '', percent: 0 });
                    break;

                case 'CANCELLED':
                    setIsRunning(false);
                    setProgress({ step: 0, message: 'Cancelled', percent: 0 });
                    break;
            }
        };

        workerRef.current.onerror = (err) => {
            console.error('Worker error:', err);
            setError('Worker error: ' + err.message);
            setIsRunning(false);
        };

        // Cleanup on unmount
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const run = useCallback((config: BacktestConfig) => {
        if (!workerRef.current || isRunning) return;

        setIsRunning(true);
        setResult(null);
        setError(null);
        setProgress({ step: 0, message: 'Starting...', percent: 0 });

        const message: WorkerMessage = { type: 'START', config };
        workerRef.current.postMessage(message);
    }, [isRunning]);

    const cancel = useCallback(() => {
        if (!workerRef.current || !isRunning) return;

        const message: WorkerMessage = { type: 'CANCEL' };
        workerRef.current.postMessage(message);
    }, [isRunning]);

    return {
        run,
        cancel,
        isRunning,
        progress,
        result,
        error,
    };
}
