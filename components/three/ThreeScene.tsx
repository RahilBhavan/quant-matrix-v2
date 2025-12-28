import React, { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { motion } from 'framer-motion';

/**
 * Three.js Scene Context
 *
 * Provides centralized scene management for all 3D visualizations.
 * Handles camera positioning, visualization registration, and shared resources.
 */

export interface ThreeVisualization {
  id: string;
  object: THREE.Object3D;
  priority: number; // Higher priority renders on top
  active: boolean;
}

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
  duration: number;
}

interface ThreeSceneContextValue {
  // Scene management
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  gl: THREE.WebGLRenderer | null;

  // Visualization registration
  registerVisualization: (id: string, object: THREE.Object3D, priority?: number) => void;
  unregisterVisualization: (id: string) => void;
  getVisualization: (id: string) => ThreeVisualization | undefined;
  listVisualizations: () => ThreeVisualization[];

  // Camera control
  moveCameraTo: (target: CameraTarget) => void;
  resetCamera: () => void;

  // Performance
  fps: number;
  shouldReduceQuality: boolean;
}

const ThreeSceneContext = createContext<ThreeSceneContextValue | null>(null);

/**
 * Hook to access Three.js scene context
 */
export const useThreeScene = () => {
  const context = useContext(ThreeSceneContext);
  if (!context) {
    throw new Error('useThreeScene must be used within ThreeSceneProvider');
  }
  return context;
};

/**
 * Scene Manager Component (runs inside Canvas)
 */
const SceneManager: React.FC<{
  onSceneReady: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, gl: THREE.WebGLRenderer) => void;
}> = ({ onSceneReady }) => {
  const { scene, camera, gl } = useThree();

  React.useEffect(() => {
    if (scene && camera instanceof THREE.PerspectiveCamera && gl) {
      onSceneReady(scene, camera, gl);
    }
  }, [scene, camera, gl, onSceneReady]);

  return null;
};

/**
 * FPS Monitor Component
 */
const FPSMonitor: React.FC<{ onFPSUpdate: (fps: number) => void }> = ({ onFPSUpdate }) => {
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  React.useEffect(() => {
    let animationFrameId: number;

    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;

      // Update FPS every second
      if (elapsed >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / elapsed);
        onFPSUpdate(fps);

        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onFPSUpdate]);

  return null;
};

/**
 * Three.js Scene Provider
 */
export const ThreeSceneProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [gl, setGl] = useState<THREE.WebGLRenderer | null>(null);
  const [fps, setFps] = useState(60);

  const visualizationsRef = useRef<Map<string, ThreeVisualization>>(new Map());
  const cameraAnimationRef = useRef<{
    startPos: THREE.Vector3;
    endPos: THREE.Vector3;
    startLookAt: THREE.Vector3;
    endLookAt: THREE.Vector3;
    progress: number;
    duration: number;
  } | null>(null);

  // Default camera position
  const DEFAULT_CAMERA_POS: [number, number, number] = [0, 0, 8];
  const DEFAULT_LOOKAT: [number, number, number] = [0, 0, 0];

  const handleSceneReady = useCallback((
    newScene: THREE.Scene,
    newCamera: THREE.PerspectiveCamera,
    newGl: THREE.WebGLRenderer
  ) => {
    setScene(newScene);
    setCamera(newCamera);
    setGl(newGl);
  }, []);

  const registerVisualization = useCallback((
    id: string,
    object: THREE.Object3D,
    priority: number = 0
  ) => {
    const visualization: ThreeVisualization = {
      id,
      object,
      priority,
      active: true,
    };

    visualizationsRef.current.set(id, visualization);

    if (scene) {
      scene.add(object);
    }

    console.log(`[ThreeScene] Registered visualization: ${id}`);
  }, [scene]);

  const unregisterVisualization = useCallback((id: string) => {
    const visualization = visualizationsRef.current.get(id);

    if (visualization && scene) {
      scene.remove(visualization.object);

      // Dispose geometry and materials
      visualization.object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }

    visualizationsRef.current.delete(id);
    console.log(`[ThreeScene] Unregistered visualization: ${id}`);
  }, [scene]);

  const getVisualization = useCallback((id: string) => {
    return visualizationsRef.current.get(id);
  }, []);

  const listVisualizations = useCallback(() => {
    return Array.from(visualizationsRef.current.values())
      .sort((a, b) => b.priority - a.priority);
  }, []);

  const moveCameraTo = useCallback((target: CameraTarget) => {
    if (!camera) return;

    const startPos = new THREE.Vector3().copy(camera.position);
    const endPos = new THREE.Vector3(...target.position);

    // Get current lookAt by using camera direction
    const startLookAt = new THREE.Vector3();
    camera.getWorldDirection(startLookAt);
    startLookAt.multiplyScalar(10).add(camera.position);

    const endLookAt = new THREE.Vector3(...target.lookAt);

    cameraAnimationRef.current = {
      startPos,
      endPos,
      startLookAt,
      endLookAt,
      progress: 0,
      duration: target.duration,
    };
  }, [camera]);

  const resetCamera = useCallback(() => {
    moveCameraTo({
      position: DEFAULT_CAMERA_POS,
      lookAt: DEFAULT_LOOKAT,
      duration: 800,
    });
  }, [moveCameraTo]);

  // Animate camera transitions
  React.useEffect(() => {
    if (!camera || !cameraAnimationRef.current) return;

    let animationFrameId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const anim = cameraAnimationRef.current;
      if (!anim) return;

      const elapsed = currentTime - startTime;
      anim.progress = Math.min(elapsed / anim.duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - anim.progress, 3);

      // Interpolate position
      camera.position.lerpVectors(anim.startPos, anim.endPos, eased);

      // Interpolate lookAt
      const currentLookAt = new THREE.Vector3().lerpVectors(
        anim.startLookAt,
        anim.endLookAt,
        eased
      );
      camera.lookAt(currentLookAt);

      if (anim.progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        cameraAnimationRef.current = null;
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [camera]);

  const shouldReduceQuality = fps < 30;

  const contextValue: ThreeSceneContextValue = {
    scene,
    camera,
    gl,
    registerVisualization,
    unregisterVisualization,
    getVisualization,
    listVisualizations,
    moveCameraTo,
    resetCamera,
    fps,
    shouldReduceQuality,
  };

  return (
    <ThreeSceneContext.Provider value={contextValue}>
      <motion.div
        className="absolute inset-0 z-0 pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Canvas camera={{ position: DEFAULT_CAMERA_POS }}>
          <fog attach="fog" args={['#000000', 5, 15]} />
          <SceneManager onSceneReady={handleSceneReady} />
          <FPSMonitor onFPSUpdate={setFps} />
          {children}
        </Canvas>
      </motion.div>
    </ThreeSceneContext.Provider>
  );
};
