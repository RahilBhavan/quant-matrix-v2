import React, { useRef, useMemo, useEffect, ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ThreeSceneProvider, useThreeScene } from './three/ThreeScene';
import { createNeonMaterial, COLORS } from '@/utils/three-helpers';

/**
 * Attractor Mesh - Default background visualization
 * Rotating icosahedron with gentle pulsing animation
 */
const AttractorMesh = () => {
  const mesh = useRef<THREE.Mesh>(null!);
  const { registerVisualization, unregisterVisualization } = useThreeScene();

  // Register with scene context
  useEffect(() => {
    if (mesh.current) {
      registerVisualization('attractor', mesh.current, -10); // Lowest priority (background)
    }

    return () => {
      unregisterVisualization('attractor');
    };
  }, [registerVisualization, unregisterVisualization]);

  // Rotate and pulse the mesh
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.1;
      mesh.current.rotation.y += delta * 0.15;

      // Gentle breathing pulse
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      mesh.current.scale.setScalar(scale);
    }
  });

  const activeMaterial = useMemo(
    () => createNeonMaterial(COLORS.NEON_CYAN, 0.8, true),
    []
  );

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[2.5, 2]} />
        <primitive object={activeMaterial} attach="material" />
      </mesh>
    </Float>
  );
};

/**
 * Performance Monitor Display (Dev Mode)
 * Shows FPS and quality status in development
 * Must be rendered inside ThreeSceneProvider to access context
 */
const PerformanceMonitor: React.FC = () => {
  const { fps, shouldReduceQuality } = useThreeScene();
  const [visible, setVisible] = React.useState(false);

  // Show in dev mode or when performance degrades
  useEffect(() => {
    const isDev = import.meta.env.DEV;
    setVisible(isDev || shouldReduceQuality);
  }, [shouldReduceQuality]);

  if (!visible) return null;

  return (
    <Html>
      <div className="fixed bottom-4 left-4 z-[100] font-mono text-xs bg-black/80 text-white px-2 py-1 border border-white/20 pointer-events-none">
        <div className="flex gap-4">
          <span>FPS: {fps}</span>
          {shouldReduceQuality && (
            <span className="text-red-500">LOW PERF</span>
          )}
        </div>
      </div>
    </Html>
  );
};

/**
 * Scene Content - Renders inside Canvas
 * Includes default attractor and any additional children
 */
const SceneContent: React.FC<{ children?: ReactNode; showAttractor?: boolean }> = ({
  children,
  showAttractor = true,
}) => {
  return (
    <>
      {/* Default background visualization */}
      {showAttractor && <AttractorMesh />}

      {/* Additional 3D content */}
      {children}
    </>
  );
};

/**
 * ThreeBackground - Enhanced with Scene Management
 *
 * Provides centralized Three.js scene with:
 * - Scene context for visualization registration
 * - Default attractor mesh (rotating icosahedron)
 * - Performance monitoring
 * - Support for additional 3D visualizations as children
 *
 * Usage:
 * ```tsx
 * <ThreeBackground>
 *   <CustomVisualization />
 * </ThreeBackground>
 * ```
 *
 * Or with scene context:
 * ```tsx
 * const MyComponent = () => {
 *   const { registerVisualization } = useThreeScene();
 *   // Use scene context
 * }
 * ```
 */
export interface ThreeBackgroundProps {
  children?: ReactNode;
  showAttractor?: boolean;
  showPerformanceMonitor?: boolean;
}

/**
 * Inner wrapper that has access to ThreeScene context
 */
const ThreeBackgroundInner: React.FC<{
  children?: ReactNode;
  showAttractor: boolean;
  showPerformanceMonitor: boolean;
}> = ({ children, showAttractor, showPerformanceMonitor }) => {
  return (
    <>
      <SceneContent showAttractor={showAttractor}>
        {children}
      </SceneContent>
    </>
  );
};

export const ThreeBackground: React.FC<ThreeBackgroundProps> = ({
  children,
  showAttractor = true,
  showPerformanceMonitor = true,
}) => {
  return (
    <ThreeSceneProvider>
      {/* 2D DOM Elements (Performance Monitor) */}
      {showPerformanceMonitor && <PerformanceMonitor />}

      {/* 3D Scene Elements */}
      <ThreeBackgroundInner
        showAttractor={showAttractor}
        showPerformanceMonitor={false}
      >
        {children}
      </ThreeBackgroundInner>
    </ThreeSceneProvider>
  );
};

/**
 * Re-export scene context hook for convenience
 */
export { useThreeScene } from './three/ThreeScene';
