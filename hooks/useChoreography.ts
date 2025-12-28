/**
 * Animation Choreography Hook
 *
 * Provides utilities for sequencing and coordinating complex animations.
 * Handles staggering, delays, and queue-based animation execution.
 */

import { useRef, useCallback, useEffect } from 'react';

export interface AnimationSequenceItem {
  action: () => void | Promise<void>;
  delay: number;
}

export interface StaggerConfig {
  items: any[];
  delayBetween: number;
  onItem: (item: any, index: number) => void | Promise<void>;
}

export interface ChoreographyState {
  isPlaying: boolean;
  isPaused: boolean;
  currentIndex: number;
}

/**
 * Hook for choreographing animations
 */
export function useChoreography() {
  const stateRef = useRef<ChoreographyState>({
    isPlaying: false,
    isPaused: false,
    currentIndex: -1,
  });

  const timeoutsRef = useRef<number[]>([]);
  const queueRef = useRef<AnimationSequenceItem[]>([]);

  /**
   * Clear all pending timeouts
   */
  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  /**
   * Execute a sequence of animations
   * @param sequence - Array of animation items with delays
   * @returns Promise that resolves when sequence completes
   */
  const sequence = useCallback(async (sequence: AnimationSequenceItem[]): Promise<void> => {
    return new Promise((resolve) => {
      clearTimeouts();
      stateRef.current.isPlaying = true;
      stateRef.current.currentIndex = 0;

      let cumulativeDelay = 0;

      sequence.forEach((item, index) => {
        cumulativeDelay += item.delay;

        const timeoutId = window.setTimeout(async () => {
          if (!stateRef.current.isPaused) {
            stateRef.current.currentIndex = index;
            await item.action();

            // Resolve when last item completes
            if (index === sequence.length - 1) {
              stateRef.current.isPlaying = false;
              stateRef.current.currentIndex = -1;
              resolve();
            }
          }
        }, cumulativeDelay);

        timeoutsRef.current.push(timeoutId);
      });
    });
  }, [clearTimeouts]);

  /**
   * Stagger animation across multiple items
   * @param config - Stagger configuration
   * @returns Promise that resolves when stagger completes
   */
  const stagger = useCallback(async (config: StaggerConfig): Promise<void> => {
    const { items, delayBetween, onItem } = config;

    return new Promise((resolve) => {
      clearTimeouts();
      stateRef.current.isPlaying = true;

      items.forEach((item, index) => {
        const delay = index * delayBetween;

        const timeoutId = window.setTimeout(async () => {
          if (!stateRef.current.isPaused) {
            await onItem(item, index);

            // Resolve when last item completes
            if (index === items.length - 1) {
              stateRef.current.isPlaying = false;
              resolve();
            }
          }
        }, delay);

        timeoutsRef.current.push(timeoutId);
      });
    });
  }, [clearTimeouts]);

  /**
   * Pause the current animation sequence
   */
  const pause = useCallback(() => {
    stateRef.current.isPaused = true;
  }, []);

  /**
   * Resume paused animation sequence
   */
  const resume = useCallback(() => {
    stateRef.current.isPaused = false;
  }, []);

  /**
   * Stop and clear all animations
   */
  const stop = useCallback(() => {
    clearTimeouts();
    stateRef.current.isPlaying = false;
    stateRef.current.isPaused = false;
    stateRef.current.currentIndex = -1;
    queueRef.current = [];
  }, [clearTimeouts]);

  /**
   * Add item to animation queue
   * @param item - Animation sequence item
   */
  const enqueue = useCallback((item: AnimationSequenceItem) => {
    queueRef.current.push(item);
  }, []);

  /**
   * Process the animation queue
   */
  const processQueue = useCallback(async () => {
    if (stateRef.current.isPlaying || queueRef.current.length === 0) {
      return;
    }

    const queue = [...queueRef.current];
    queueRef.current = [];

    await sequence(queue);
  }, [sequence]);

  /**
   * Delay utility (async/await friendly)
   * @param ms - Delay in milliseconds
   * @returns Promise that resolves after delay
   */
  const delay = useCallback((ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }, []);

  /**
   * Create a timed callback
   * @param callback - Function to call
   * @param ms - Delay in milliseconds
   * @returns Cleanup function
   */
  const after = useCallback((callback: () => void, ms: number): (() => void) => {
    const timeoutId = window.setTimeout(callback, ms);
    timeoutsRef.current.push(timeoutId);

    return () => {
      clearTimeout(timeoutId);
      const index = timeoutsRef.current.indexOf(timeoutId);
      if (index > -1) {
        timeoutsRef.current.splice(index, 1);
      }
    };
  }, []);

  /**
   * Get current choreography state
   */
  const getState = useCallback((): ChoreographyState => {
    return { ...stateRef.current };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  return {
    sequence,
    stagger,
    pause,
    resume,
    stop,
    enqueue,
    processQueue,
    delay,
    after,
    getState,
  };
}

/**
 * FPS throttle utility
 * @param callback - Function to throttle
 * @param targetFps - Target frames per second
 * @returns Throttled function
 */
export function useThrottle(callback: (...args: any[]) => void, targetFps: number = 60) {
  const lastCallRef = useRef(0);
  const frameInterval = 1000 / targetFps;

  return useCallback((...args: any[]) => {
    const now = performance.now();

    if (now - lastCallRef.current >= frameInterval) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, frameInterval]);
}
