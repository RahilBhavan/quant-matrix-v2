/**
 * WebGL Detection and Fallback Utilities
 *
 * Provides utilities for:
 * - WebGL support detection
 * - WebGL context loss handling
 * - Fallback mode management
 * - Performance capability detection
 */

export interface WebGLCapabilities {
  supported: boolean;
  version: 1 | 2 | null;
  maxTextureSize: number;
  maxViewportDims: [number, number];
  maxVertexUniforms: number;
  maxFragmentUniforms: number;
  extensions: string[];
  renderer: string;
  vendor: string;
}

/**
 * Detect WebGL support and capabilities
 */
export function detectWebGLCapabilities(): WebGLCapabilities {
  const canvas = document.createElement('canvas');
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let version: 1 | 2 | null = null;

  // Try WebGL 2 first
  gl = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
  if (gl) {
    version = 2;
  } else {
    // Fall back to WebGL 1
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      version = 1;
    }
  }

  if (!gl) {
    return {
      supported: false,
      version: null,
      maxTextureSize: 0,
      maxViewportDims: [0, 0],
      maxVertexUniforms: 0,
      maxFragmentUniforms: 0,
      extensions: [],
      renderer: 'None',
      vendor: 'None',
    };
  }

  // Get capabilities
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    : 'Unknown';
  const vendor = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
    : 'Unknown';

  const capabilities: WebGLCapabilities = {
    supported: true,
    version,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
    maxVertexUniforms: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
    maxFragmentUniforms: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
    extensions: gl.getSupportedExtensions() || [],
    renderer,
    vendor,
  };

  // Clean up
  const loseContext = gl.getExtension('WEBGL_lose_context');
  if (loseContext) {
    loseContext.loseContext();
  }

  return capabilities;
}

/**
 * Check if device has sufficient WebGL capabilities for 3D features
 */
export function hasMinimumWebGLCapabilities(capabilities: WebGLCapabilities): boolean {
  if (!capabilities.supported) return false;

  // Minimum requirements
  const minTextureSize = 2048;
  const minViewportDim = 1024;
  const minVertexUniforms = 128;

  return (
    capabilities.maxTextureSize >= minTextureSize &&
    capabilities.maxViewportDims[0] >= minViewportDim &&
    capabilities.maxViewportDims[1] >= minViewportDim &&
    capabilities.maxVertexUniforms >= minVertexUniforms
  );
}

/**
 * Setup WebGL context loss recovery
 */
export function setupWebGLContextRecovery(
  canvas: HTMLCanvasElement,
  onContextLost: () => void,
  onContextRestored: () => void
): () => void {
  const handleContextLost = (event: Event) => {
    event.preventDefault();
    console.warn('[WebGL] Context lost, attempting recovery...');
    onContextLost();
  };

  const handleContextRestored = () => {
    console.log('[WebGL] Context restored');
    onContextRestored();
  };

  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);

  // Return cleanup function
  return () => {
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
  };
}

/**
 * Detect if running on mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get recommended quality mode based on device capabilities
 */
export function getRecommendedQualityMode(
  capabilities: WebGLCapabilities
): 'high' | 'medium' | 'low' {
  if (!capabilities.supported) return 'low';

  // Mobile devices default to medium
  if (isMobileDevice()) {
    return 'medium';
  }

  // Check renderer for integrated vs discrete GPU
  const renderer = capabilities.renderer.toLowerCase();
  const isIntegratedGPU =
    renderer.includes('intel') ||
    renderer.includes('integrated') ||
    renderer.includes('uhd graphics');

  if (isIntegratedGPU) {
    return 'medium';
  }

  // Check texture size as performance proxy
  if (capabilities.maxTextureSize >= 8192) {
    return 'high';
  } else if (capabilities.maxTextureSize >= 4096) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Log WebGL diagnostics to console (dev mode)
 */
export function logWebGLDiagnostics(capabilities: WebGLCapabilities): void {
  if (import.meta.env.DEV) {
    console.group('[WebGL] Diagnostics');
    console.log('Supported:', capabilities.supported);
    console.log('Version:', capabilities.version);
    console.log('Renderer:', capabilities.renderer);
    console.log('Vendor:', capabilities.vendor);
    console.log('Max Texture Size:', capabilities.maxTextureSize);
    console.log('Max Viewport:', capabilities.maxViewportDims);
    console.log('Max Vertex Uniforms:', capabilities.maxVertexUniforms);
    console.log('Max Fragment Uniforms:', capabilities.maxFragmentUniforms);
    console.log('Extensions:', capabilities.extensions.length);
    console.log('Recommended Quality:', getRecommendedQualityMode(capabilities));
    console.groupEnd();
  }
}

/**
 * Check for specific WebGL extensions
 */
export function hasWebGLExtension(
  capabilities: WebGLCapabilities,
  extensionName: string
): boolean {
  return capabilities.extensions.includes(extensionName);
}

/**
 * Estimate available VRAM (very rough approximation)
 */
export function estimateAvailableVRAM(capabilities: WebGLCapabilities): number {
  if (!capabilities.supported) return 0;

  // Very rough heuristic based on max texture size
  // This is NOT accurate but gives a ballpark estimate
  const maxTextureSize = capabilities.maxTextureSize;

  if (maxTextureSize >= 16384) return 4096; // ~4GB
  if (maxTextureSize >= 8192) return 2048; // ~2GB
  if (maxTextureSize >= 4096) return 1024; // ~1GB
  if (maxTextureSize >= 2048) return 512; // ~512MB

  return 256; // ~256MB
}

/**
 * WebGL Error Messages
 */
export const WEBGL_ERROR_MESSAGES = {
  NOT_SUPPORTED: 'WebGL is not supported on this device. 3D features are disabled.',
  CONTEXT_LOST: 'WebGL context was lost. Attempting to recover...',
  CONTEXT_LOST_PERMANENT: 'WebGL context could not be recovered. Please refresh the page.',
  INSUFFICIENT_CAPABILITIES: 'Your device does not meet minimum requirements for 3D features. Using 2D fallback.',
  MOBILE_WARNING: 'Running on mobile device. 3D features may have reduced performance.',
} as const;

/**
 * Create user-friendly error message
 */
export function getWebGLErrorMessage(
  capabilities: WebGLCapabilities
): string | null {
  if (!capabilities.supported) {
    return WEBGL_ERROR_MESSAGES.NOT_SUPPORTED;
  }

  if (!hasMinimumWebGLCapabilities(capabilities)) {
    return WEBGL_ERROR_MESSAGES.INSUFFICIENT_CAPABILITIES;
  }

  if (isMobileDevice()) {
    return WEBGL_ERROR_MESSAGES.MOBILE_WARNING;
  }

  return null;
}
