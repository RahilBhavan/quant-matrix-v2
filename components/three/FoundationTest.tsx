/**
 * Foundation Test Component
 *
 * Tests Week 1 infrastructure:
 * - ThreeScene context registration
 * - three-helpers material/geometry creation
 * - Animation sequencing
 * - Multiple visualizations coexisting
 *
 * Usage: Temporarily add to ThreeBackground children in App.tsx
 * <ThreeBackground><FoundationTest /></ThreeBackground>
 */

import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useThreeScene } from './ThreeScene';
import { createNeonMaterial, COLORS } from '@/utils/three-helpers';
import { useChoreography } from '@/hooks/useChoreography';

/**
 * Single rotating cube
 */
const ColoredCube: React.FC<{
  position: [number, number, number];
  color: string;
  id: string;
}> = ({ position, color, id }) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { registerVisualization, unregisterVisualization } = useThreeScene();

  // Register with scene
  useEffect(() => {
    if (meshRef.current) {
      registerVisualization(id, meshRef.current, 0); // Normal priority
    }

    return () => {
      unregisterVisualization(id);
    };
  }, [id, registerVisualization, unregisterVisualization]);

  // Animate rotation
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={createNeonMaterial(color, 0.9, true)} attach="material" />
    </mesh>
  );
};

/**
 * Grid of colored cubes testing:
 * - Multiple visualization registration
 * - Material creation utilities
 * - Scene context management
 */
export const FoundationTest: React.FC = () => {
  const { listVisualizations } = useThreeScene();
  const { sequence, delay } = useChoreography();
  const [cubesVisible, setCubesVisible] = React.useState(false);

  // Test animation sequencing on mount
  useEffect(() => {
    const testSequence = async () => {
      await delay(500); // Wait for scene to initialize
      console.log('[FoundationTest] Starting cube reveal sequence');

      setCubesVisible(true);

      await delay(1000);

      // Log registered visualizations
      const visualizations = listVisualizations();
      console.log('[FoundationTest] Registered visualizations:', visualizations.length);
      visualizations.forEach(viz => {
        console.log(`  - ${viz.id} (priority: ${viz.priority})`);
      });

      console.log('[FoundationTest] Foundation test complete ✓');
    };

    testSequence();
  }, [delay, listVisualizations]);

  if (!cubesVisible) return null;

  // 3x3 grid of cubes with different colors
  const cubes = [
    { pos: [-3, 2, 0], color: COLORS.NEON_CYAN, id: 'test-cube-1' },
    { pos: [0, 2, 0], color: COLORS.RED, id: 'test-cube-2' },
    { pos: [3, 2, 0], color: COLORS.YELLOW, id: 'test-cube-3' },
    { pos: [-3, -1, 0], color: COLORS.PURPLE, id: 'test-cube-4' },
    { pos: [0, -1, 0], color: COLORS.BLUE, id: 'test-cube-5' },
    { pos: [3, -1, 0], color: COLORS.WHITE, id: 'test-cube-6' },
    { pos: [-3, -4, 0], color: COLORS.NEON_CYAN, id: 'test-cube-7' },
    { pos: [0, -4, 0], color: COLORS.RED, id: 'test-cube-8' },
    { pos: [3, -4, 0], color: COLORS.YELLOW, id: 'test-cube-9' },
  ];

  return (
    <>
      {cubes.map(cube => (
        <ColoredCube
          key={cube.id}
          position={cube.pos as [number, number, number]}
          color={cube.color}
          id={cube.id}
        />
      ))}
    </>
  );
};

/**
 * Instructions for running test:
 *
 * 1. Import in App.tsx:
 *    import { FoundationTest } from './components/three/FoundationTest';
 *
 * 2. Add to ThreeBackground:
 *    <ThreeBackground>
 *      <FoundationTest />
 *    </ThreeBackground>
 *
 * 3. Run dev server:
 *    npm run dev
 *
 * 4. Check browser console for test output
 *
 * 5. Expected results:
 *    - 9 colored wireframe cubes appear in 3x3 grid
 *    - All cubes rotate smoothly
 *    - Attractor mesh still visible in background
 *    - Console shows "Foundation test complete ✓"
 *    - Console lists 10 registered visualizations (1 attractor + 9 cubes)
 *    - FPS monitor shows in bottom-left corner
 *
 * 6. Remove FoundationTest when Week 1 verification complete
 */
