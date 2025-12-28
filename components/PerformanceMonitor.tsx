/**
 * PerformanceMonitor - Enhanced Performance Monitoring
 *
 * Displays real-time performance metrics:
 * - FPS with frame time graph
 * - Memory usage (if available)
 * - Active 3D visualizations count
 * - Quality mode indicator
 * - Bundle size metrics
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Monitor, Zap, AlertTriangle } from 'lucide-react';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memory?: {
    used: number;
    total: number;
    limit: number;
  };
  visualizationsCount: number;
  qualityMode: 'high' | 'medium' | 'low';
}

export interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  isDevMode?: boolean;
  alwaysShow?: boolean;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Mini frame time graph component
 */
const FrameTimeGraph: React.FC<{ frameTimes: number[] }> = ({ frameTimes }) => {
  const maxFrameTime = 33.33; // 30fps threshold
  const width = 100;
  const height = 30;

  return (
    <svg width={width} height={height} className="opacity-50">
      {/* Background grid */}
      <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#ffffff" strokeOpacity={0.1} />
      <line x1={0} y1={height} x2={width} y2={height} stroke="#ffffff" strokeOpacity={0.2} />

      {/* 30fps threshold line */}
      <line x1={0} y1={height * 0.33} x2={width} y2={height * 0.33} stroke="#ff4444" strokeOpacity={0.3} strokeDasharray="2,2" />

      {/* Frame time bars */}
      {frameTimes.map((time, i) => {
        const x = (i / frameTimes.length) * width;
        const barHeight = Math.min((time / maxFrameTime) * height, height);
        const y = height - barHeight;
        const color = time > 16.67 ? '#ff4444' : time > 12 ? '#ffd93d' : '#00ff9d';

        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={width / frameTimes.length}
            height={barHeight}
            fill={color}
            opacity={0.6}
          />
        );
      })}
    </svg>
  );
};

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  isDevMode = false,
  alwaysShow = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [frameTimes, setFrameTimes] = useState<number[]>([]);
  const frameTimeBufferSize = 60; // 1 second at 60fps

  // Update frame time history
  useEffect(() => {
    setFrameTimes(prev => {
      const newTimes = [...prev, metrics.frameTime].slice(-frameTimeBufferSize);
      return newTimes;
    });
  }, [metrics.frameTime]);

  // Determine if monitor should be visible
  const shouldShow = alwaysShow || isDevMode || metrics.fps < 45;

  if (!shouldShow) return null;

  const fpsColor =
    metrics.fps >= 55 ? 'text-green-500' :
    metrics.fps >= 30 ? 'text-yellow-500' :
    'text-red-500';

  const memoryPercent = metrics.memory
    ? (metrics.memory.used / metrics.memory.limit) * 100
    : 0;

  const memoryColor =
    memoryPercent < 70 ? 'text-green-500' :
    memoryPercent < 85 ? 'text-yellow-500' :
    'text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-4 left-4 z-[100] font-mono text-xs"
    >
      <div
        className="bg-black/90 border border-white/20 backdrop-blur-sm cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Compact View */}
        <div className="flex items-center gap-3 px-3 py-2">
          <Activity size={12} className="opacity-50" />
          <div className="flex items-center gap-2">
            <span className="opacity-60">FPS:</span>
            <span className={`font-bold ${fpsColor}`}>{metrics.fps}</span>
          </div>

          {metrics.fps < 45 && (
            <AlertTriangle size={12} className="text-yellow-500 animate-pulse" />
          )}

          {metrics.qualityMode !== 'high' && (
            <div className="text-[10px] px-1 border border-yellow-500 text-yellow-500">
              {metrics.qualityMode.toUpperCase()}
            </div>
          )}
        </div>

        {/* Expanded View */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-white/10 overflow-hidden"
            >
              <div className="p-3 space-y-3">
                {/* Frame Time Graph */}
                <div>
                  <div className="text-[10px] opacity-60 uppercase tracking-widest mb-1">
                    Frame Time
                  </div>
                  <FrameTimeGraph frameTimes={frameTimes} />
                  <div className="flex justify-between text-[9px] opacity-40 mt-1">
                    <span>0ms</span>
                    <span>16ms (60fps)</span>
                    <span>33ms (30fps)</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] opacity-60">AVG FRAME</div>
                    <div className="text-white">
                      {metrics.frameTime.toFixed(1)}ms
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] opacity-60">3D SCENES</div>
                    <div className="text-white">
                      {metrics.visualizationsCount}
                    </div>
                  </div>

                  {metrics.memory && (
                    <>
                      <div>
                        <div className="text-[10px] opacity-60">MEMORY</div>
                        <div className={memoryColor}>
                          {formatBytes(metrics.memory.used)}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] opacity-60">USAGE</div>
                        <div className={memoryColor}>
                          {memoryPercent.toFixed(1)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Quality Mode */}
                <div className="border-t border-white/10 pt-2">
                  <div className="text-[10px] opacity-60 uppercase tracking-widest mb-1">
                    Quality Mode
                  </div>
                  <div className="flex gap-1">
                    {(['high', 'medium', 'low'] as const).map(mode => (
                      <div
                        key={mode}
                        className={`text-[10px] px-2 py-1 border ${
                          metrics.qualityMode === mode
                            ? 'bg-white text-black border-white'
                            : 'border-white/20 opacity-40'
                        }`}
                      >
                        {mode.toUpperCase()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warnings */}
                {metrics.fps < 30 && (
                  <div className="border border-red-500 bg-red-500/10 p-2 flex items-start gap-2">
                    <AlertTriangle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-[10px] text-red-400">
                      Performance degraded. Consider reducing 3D complexity or closing panels.
                    </div>
                  </div>
                )}

                {metrics.memory && memoryPercent > 85 && (
                  <div className="border border-yellow-500 bg-yellow-500/10 p-2 flex items-start gap-2">
                    <AlertTriangle size={12} className="text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="text-[10px] text-yellow-400">
                      High memory usage detected. Some features may be disabled.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dev Mode Indicator */}
      {isDevMode && (
        <div className="text-[9px] opacity-40 mt-1 px-3">
          DEV MODE • Click to {isExpanded ? 'collapse' : 'expand'}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Hook to collect performance metrics
 */
export function usePerformanceMetrics(visualizationsCount: number = 0): PerformanceMetrics {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    visualizationsCount,
    qualityMode: 'high',
  });

  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const fpsUpdateIntervalRef = useRef(0);

  useEffect(() => {
    let animationFrameId: number;

    const measureFrame = (currentTime: number) => {
      // Calculate frame time
      const frameTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;

      frameCountRef.current++;
      fpsUpdateIntervalRef.current += frameTime;

      // Update FPS every second
      if (fpsUpdateIntervalRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / fpsUpdateIntervalRef.current);

        // Determine quality mode based on FPS
        const qualityMode: 'high' | 'medium' | 'low' =
          fps >= 55 ? 'high' :
          fps >= 30 ? 'medium' :
          'low';

        // Get memory info if available
        const memory = (performance as any).memory ? {
          used: (performance as any).memory.usedJSHeapSize,
          total: (performance as any).memory.totalJSHeapSize,
          limit: (performance as any).memory.jsHeapSizeLimit,
        } : undefined;

        setMetrics({
          fps,
          frameTime,
          memory,
          visualizationsCount,
          qualityMode,
        });

        frameCountRef.current = 0;
        fpsUpdateIntervalRef.current = 0;
      }

      animationFrameId = requestAnimationFrame(measureFrame);
    };

    animationFrameId = requestAnimationFrame(measureFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [visualizationsCount]);

  return metrics;
}
