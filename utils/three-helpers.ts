/**
 * Three.js Helper Utilities
 *
 * Reusable functions for creating materials, geometries, and managing Three.js objects.
 * All helpers follow the Quant Matrix aesthetic: wireframe, neon cyan, minimalist.
 */

import * as THREE from 'three';

// Color constants (matching design system)
export const COLORS = {
  NEON_CYAN: '#00FF9D',
  RED: '#FF4444',
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  PURPLE: '#8247E5',
  YELLOW: '#FFD93D',
  BLUE: '#6C63FF',
} as const;

/**
 * Create standardized neon material
 * @param color - Hex color string
 * @param opacity - Material opacity (0-1)
 * @param wireframe - Whether to render as wireframe
 * @returns MeshBasicMaterial with consistent styling
 */
export function createNeonMaterial(
  color: string = COLORS.NEON_CYAN,
  opacity: number = 0.8,
  wireframe: boolean = true
): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    wireframe,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
  });
}

/**
 * Create gradient material (for equity curves, P/L visualization)
 * @param colorStart - Starting color (typically green/cyan)
 * @param colorEnd - Ending color (typically red)
 * @param opacity - Material opacity
 * @returns MeshBasicMaterial with gradient shader
 */
export function createGradientMaterial(
  colorStart: string = COLORS.NEON_CYAN,
  colorEnd: string = COLORS.RED,
  opacity: number = 0.8
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      colorStart: { value: new THREE.Color(colorStart) },
      colorEnd: { value: new THREE.Color(colorEnd) },
      opacity: { value: opacity },
    },
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 colorStart;
      uniform vec3 colorEnd;
      uniform float opacity;
      varying vec3 vPosition;

      void main() {
        float mixFactor = (vPosition.y + 1.0) / 2.0; // Normalize -1 to 1 range
        vec3 color = mix(colorEnd, colorStart, mixFactor);
        gl_FragColor = vec4(color, opacity);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

/**
 * Create instanced candlestick geometry
 * @param count - Number of candlesticks
 * @returns InstancedMesh ready for candlestick data
 */
export function createInstancedCandlesticks(count: number): {
  bodyMesh: THREE.InstancedMesh;
  wickMesh: THREE.InstancedMesh;
} {
  const bodyGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
  const wickGeometry = new THREE.BoxGeometry(0.05, 1, 0.05);

  const bodyMesh = new THREE.InstancedMesh(
    bodyGeometry,
    createNeonMaterial(COLORS.NEON_CYAN, 0.8, true),
    count
  );

  const wickMesh = new THREE.InstancedMesh(
    wickGeometry,
    createNeonMaterial(COLORS.WHITE, 0.6, false),
    count
  );

  return { bodyMesh, wickMesh };
}

/**
 * Create instanced bars for portfolio visualization
 * @param count - Number of bars
 * @returns InstancedMesh for bar chart
 */
export function createInstancedBars(count: number): THREE.InstancedMesh {
  const geometry = new THREE.BoxGeometry(0.3, 1, 0.3);
  const material = createNeonMaterial(COLORS.NEON_CYAN, 0.8, true);

  return new THREE.InstancedMesh(geometry, material, count);
}

/**
 * Create tube geometry for equity curve
 * @param points - Array of 3D points
 * @param radius - Tube radius
 * @param segments - Number of segments
 * @returns TubeGeometry
 */
export function createTubeFromPoints(
  points: THREE.Vector3[],
  radius: number = 0.05,
  segments: number = 50
): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, segments, radius, 8, false);
}

/**
 * Create text sprite for labels
 * @param text - Label text
 * @param color - Text color
 * @param fontSize - Font size in pixels
 * @returns Sprite with text texture
 */
export function createTextSprite(
  text: string,
  color: string = COLORS.WHITE,
  fontSize: number = 32
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  // Set canvas size
  canvas.width = 256;
  canvas.height = 64;

  // Set font
  context.font = `${fontSize}px 'JetBrains Mono', monospace`;
  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  // Draw text
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  // Create texture
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });

  return new THREE.Sprite(material);
}

/**
 * Create ground plane (for reference in 3D visualizations)
 * @param size - Grid size
 * @param divisions - Number of grid divisions
 * @returns GridHelper
 */
export function createGroundPlane(
  size: number = 10,
  divisions: number = 10
): THREE.GridHelper {
  const gridHelper = new THREE.GridHelper(
    size,
    divisions,
    new THREE.Color(COLORS.WHITE).setHex(0x404040),
    new THREE.Color(COLORS.WHITE).setHex(0x202020)
  );

  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;

  return gridHelper;
}

/**
 * Create particle system for trade markers
 * @param count - Number of particles
 * @param color - Particle color
 * @returns Points geometry
 */
export function createParticleSystem(
  count: number,
  color: string = COLORS.NEON_CYAN
): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: 0.1,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

/**
 * Update instanced mesh matrix for position/scale/rotation
 * @param mesh - InstancedMesh to update
 * @param index - Instance index
 * @param position - Position vector
 * @param scale - Scale vector
 * @param rotation - Rotation quaternion (optional)
 */
export function updateInstancedMeshMatrix(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  scale: THREE.Vector3,
  rotation?: THREE.Quaternion
): void {
  const matrix = new THREE.Matrix4();

  if (rotation) {
    matrix.compose(position, rotation, scale);
  } else {
    matrix.compose(position, new THREE.Quaternion(), scale);
  }

  mesh.setMatrixAt(index, matrix);
  mesh.instanceMatrix.needsUpdate = true;
}

/**
 * Animate value from start to end
 * @param from - Starting value
 * @param to - Ending value
 * @param duration - Animation duration in ms
 * @param onUpdate - Callback with current value
 * @param onComplete - Callback when animation completes
 */
export function animateValue(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  onComplete?: () => void
): () => void {
  let animationFrameId: number;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Ease-in-out cubic
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const current = from + (to - from) * eased;
    onUpdate(current);

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      if (onComplete) onComplete();
    }
  };

  animationFrameId = requestAnimationFrame(animate);

  // Return cleanup function
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

/**
 * Dispose Three.js object and all its children
 * @param object - Object3D to dispose
 */
export function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }

      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => {
            disposeMaterial(material);
          });
        } else {
          disposeMaterial(child.material);
        }
      }
    }

    if (child instanceof THREE.Points && child.material) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      disposeMaterial(child.material as THREE.Material);
    }

    if (child instanceof THREE.Sprite && child.material) {
      disposeMaterial(child.material);
    }
  });

  // Remove from parent
  if (object.parent) {
    object.parent.remove(object);
  }
}

/**
 * Dispose material and its textures
 * @param material - Material to dispose
 */
function disposeMaterial(material: THREE.Material): void {
  if ('map' in material && material.map) {
    material.map.dispose();
  }

  if ('lightMap' in material && material.lightMap) {
    material.lightMap.dispose();
  }

  if ('bumpMap' in material && material.bumpMap) {
    material.bumpMap.dispose();
  }

  if ('normalMap' in material && material.normalMap) {
    material.normalMap.dispose();
  }

  if ('specularMap' in material && material.specularMap) {
    material.specularMap.dispose();
  }

  if ('envMap' in material && material.envMap) {
    material.envMap.dispose();
  }

  material.dispose();
}

/**
 * Convert hex color to RGB array
 * @param hex - Hex color string
 * @returns RGB array [r, g, b] (0-255)
 */
export function hexToRgb(hex: string): [number, number, number] {
  const color = new THREE.Color(hex);
  return [
    Math.round(color.r * 255),
    Math.round(color.g * 255),
    Math.round(color.b * 255),
  ];
}

/**
 * Interpolate between two colors
 * @param colorStart - Starting color
 * @param colorEnd - Ending color
 * @param factor - Interpolation factor (0-1)
 * @returns Interpolated color
 */
export function lerpColor(
  colorStart: string,
  colorEnd: string,
  factor: number
): string {
  const c1 = new THREE.Color(colorStart);
  const c2 = new THREE.Color(colorEnd);

  const result = new THREE.Color();
  result.r = c1.r + (c2.r - c1.r) * factor;
  result.g = c1.g + (c2.g - c1.g) * factor;
  result.b = c1.b + (c2.b - c1.b) * factor;

  return `#${result.getHexString()}`;
}
