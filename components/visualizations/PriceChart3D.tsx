/**
 * PriceChart3D - 3D Candlestick Chart Visualization
 *
 * Renders historical price data as instanced 3D candlesticks with:
 * - Bullish candles: Neon cyan wireframe
 * - Bearish candles: Red wireframe
 * - Z-axis: Time progression
 * - Y-axis: Price levels
 * - Staggered entrance animation
 * - Hover interactions with OHLC tooltips
 * - Automatic scaling and LOD for performance
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useThreeScene } from '../three/ThreeScene';
import { createNeonMaterial, COLORS, updateInstancedMeshMatrix } from '@/utils/three-helpers';
import { HistoricalBar } from '@/types';

export interface PriceChart3DProps {
  data: HistoricalBar[];
  symbol?: string;
  onHover?: (bar: HistoricalBar | null, index: number) => void;
}

/**
 * Calculate price range and normalization
 */
function calculatePriceScale(data: HistoricalBar[]) {
  if (data.length === 0) return { min: 0, max: 100, range: 100 };

  const allPrices = data.flatMap(bar => [bar.high, bar.low]);
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const range = max - min;
  const padding = range * 0.1; // 10% padding

  return {
    min: min - padding,
    max: max + padding,
    range: range + padding * 2,
  };
}

/**
 * Normalize price to Y-axis coordinate
 */
function normalizePrice(price: number, scale: { min: number; max: number; range: number }): number {
  return ((price - scale.min) / scale.range) * 10 - 5; // Map to -5 to 5 range
}

export const PriceChart3D: React.FC<PriceChart3DProps> = ({ data, symbol = 'UNKNOWN', onHover }) => {
  const groupRef = useRef<THREE.Group>(null!);
  const bodyMeshRef = useRef<THREE.InstancedMesh>(null!);
  const wickMeshRef = useRef<THREE.InstancedMesh>(null!);
  const { registerVisualization, unregisterVisualization, shouldReduceQuality } = useThreeScene();
  const { raycaster, camera, pointer } = useThree();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Calculate price scale
  const priceScale = useMemo(() => calculatePriceScale(data), [data]);

  // Determine quality level based on performance
  const maxCandles = shouldReduceQuality ? 50 : data.length;
  const visibleData = useMemo(() => {
    if (data.length <= maxCandles) return data;
    // Sample data to maintain performance
    const step = Math.ceil(data.length / maxCandles);
    return data.filter((_, i) => i % step === 0);
  }, [data, maxCandles]);

  // Create materials
  const bullishMaterial = useMemo(() => createNeonMaterial(COLORS.NEON_CYAN, 0.9, true), []);
  const bearishMaterial = useMemo(() => createNeonMaterial(COLORS.RED, 0.9, true), []);
  const wickMaterial = useMemo(() => createNeonMaterial(COLORS.WHITE, 0.6, false), []);

  // Register with scene
  useEffect(() => {
    if (groupRef.current) {
      registerVisualization(`price-chart-${symbol}`, groupRef.current, 5);
    }

    return () => {
      unregisterVisualization(`price-chart-${symbol}`);
    };
  }, [symbol, registerVisualization, unregisterVisualization]);

  // Initialize instanced meshes
  useEffect(() => {
    if (!bodyMeshRef.current || !wickMeshRef.current || visibleData.length === 0) return;

    const spacing = 0.5; // Space between candles on Z-axis
    const bodyWidth = 0.3;
    const wickWidth = 0.05;

    visibleData.forEach((bar, i) => {
      const isBullish = bar.close >= bar.open;
      const bodyHeight = Math.abs(normalizePrice(bar.close, priceScale) - normalizePrice(bar.open, priceScale));
      const bodyY = (normalizePrice(bar.close, priceScale) + normalizePrice(bar.open, priceScale)) / 2;
      const z = (i - visibleData.length / 2) * spacing;

      // Create body matrix
      const bodyPosition = new THREE.Vector3(0, bodyY, z);
      const bodyScale = new THREE.Vector3(bodyWidth, Math.max(bodyHeight, 0.05), bodyWidth);
      updateInstancedMeshMatrix(bodyMeshRef.current, i, bodyPosition, bodyScale);

      // Create wick matrix
      const wickHigh = normalizePrice(bar.high, priceScale);
      const wickLow = normalizePrice(bar.low, priceScale);
      const wickHeight = wickHigh - wickLow;
      const wickY = (wickHigh + wickLow) / 2;

      const wickPosition = new THREE.Vector3(0, wickY, z);
      const wickScale = new THREE.Vector3(wickWidth, wickHeight, wickWidth);
      updateInstancedMeshMatrix(wickMeshRef.current, i, wickPosition, wickScale);

      // Set color based on bullish/bearish
      const color = isBullish ? new THREE.Color(COLORS.NEON_CYAN) : new THREE.Color(COLORS.RED);
      bodyMeshRef.current.setColorAt(i, color);
    });

    bodyMeshRef.current.instanceMatrix.needsUpdate = true;
    wickMeshRef.current.instanceMatrix.needsUpdate = true;
    if (bodyMeshRef.current.instanceColor) {
      bodyMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [visibleData, priceScale]);

  // Entrance animation
  useEffect(() => {
    let animationFrameId: number;
    const startTime = performance.now();
    const duration = 2000; // 2 seconds total

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [visibleData]);

  // Apply animation scale
  useFrame(() => {
    if (groupRef.current && animationProgress < 1) {
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - animationProgress, 3);
      groupRef.current.scale.y = eased;
    }
  });

  // Raycasting for hover detection
  useFrame(() => {
    if (!bodyMeshRef.current || visibleData.length === 0) return;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(bodyMeshRef.current);

    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      const index = intersects[0].instanceId;
      if (index !== hoveredIndex) {
        setHoveredIndex(index);
        if (onHover) {
          onHover(visibleData[index], index);
        }
      }
    } else if (hoveredIndex !== null) {
      setHoveredIndex(null);
      if (onHover) {
        onHover(null, -1);
      }
    }
  });

  // Highlight hovered candle
  useEffect(() => {
    if (!bodyMeshRef.current) return;

    visibleData.forEach((bar, i) => {
      const isBullish = bar.close >= bar.open;
      const baseColor = isBullish ? new THREE.Color(COLORS.NEON_CYAN) : new THREE.Color(COLORS.RED);

      if (i === hoveredIndex) {
        // Brighten hovered candle
        baseColor.multiplyScalar(1.5);
      }

      bodyMeshRef.current.setColorAt(i, baseColor);
    });

    if (bodyMeshRef.current.instanceColor) {
      bodyMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, [hoveredIndex, visibleData]);

  if (visibleData.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Candlestick Bodies */}
      <instancedMesh
        ref={bodyMeshRef}
        args={[undefined, undefined, visibleData.length]}
        material={bullishMaterial}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* Candlestick Wicks */}
      <instancedMesh
        ref={wickMeshRef}
        args={[undefined, undefined, visibleData.length]}
        material={wickMaterial}
      >
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>

      {/* Ground plane for reference */}
      <gridHelper
        args={[20, 20, COLORS.WHITE, COLORS.WHITE]}
        position={[0, -5, 0]}
        rotation={[0, 0, 0]}
      >
        <meshBasicMaterial transparent opacity={0.1} />
      </gridHelper>

      {/* Price axis labels (simplified - would use text sprites in production) */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-10, 0, 0, 10, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={COLORS.WHITE} opacity={0.3} transparent />
      </lineSegments>
    </group>
  );
};

/**
 * OHLC Tooltip Component
 * Displays bar information on hover
 */
export interface OHLCTooltipProps {
  bar: HistoricalBar | null;
  symbol: string;
  position?: { x: number; y: number };
}

export const OHLCTooltip: React.FC<OHLCTooltipProps> = ({ bar, symbol, position }) => {
  if (!bar) return null;

  const isBullish = bar.close >= bar.open;
  const change = bar.close - bar.open;
  const changePercent = (change / bar.open) * 100;

  return (
    <div
      className="fixed pointer-events-none z-50 bg-black/90 border border-white/20 p-3 font-mono text-xs backdrop-blur-sm"
      style={{
        left: position?.x ?? 0,
        top: position?.y ?? 0,
        transform: 'translate(-50%, -120%)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-bold text-white">{symbol}</span>
        <span className={isBullish ? 'text-qm-neon-cyan' : 'text-red-500'}>
          {isBullish ? '↑' : '↓'} {changePercent.toFixed(2)}%
        </span>
      </div>
      <div className="space-y-1 text-gray-300">
        <div className="flex justify-between gap-4">
          <span className="opacity-60">O:</span>
          <span>${bar.open.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="opacity-60">H:</span>
          <span>${bar.high.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="opacity-60">L:</span>
          <span>${bar.low.toFixed(2)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="opacity-60">C:</span>
          <span className={isBullish ? 'text-qm-neon-cyan' : 'text-red-500'}>
            ${bar.close.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between gap-4 border-t border-white/10 pt-1 mt-1">
          <span className="opacity-60">Vol:</span>
          <span>{bar.volume.toLocaleString()}</span>
        </div>
        <div className="text-[10px] opacity-40 mt-2">
          {bar.date.toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};
