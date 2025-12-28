# 3D Visualizations Guide

## Overview

Quant Matrix features comprehensive 3D visualizations built with Three.js and React Three Fiber. This guide covers architecture, usage, performance optimization, and troubleshooting.

## Architecture

### Component Hierarchy

```
ThreeSceneProvider (Context)
└── Canvas (React Three Fiber)
    ├── AttractorMesh (Background)
    ├── PriceChart3D (Candlesticks)
    ├── EquityCurve3D (Backtest Results)
    └── PortfolioChart3D (Position Bars)
```

### Core Components

#### ThreeScene Context (`components/three/ThreeScene.tsx`)

Centralized scene management providing:
- Visualization registration system with priorities
- Camera animation utilities
- FPS monitoring
- Auto quality reduction when FPS < 30

```typescript
import { useThreeScene } from './three/ThreeScene';

const { registerVisualization, moveCameraTo, fps } = useThreeScene();
```

#### Three Helpers (`utils/three-helpers.ts`)

Factory functions for materials and geometries:
- `createNeonMaterial()` - Wireframe materials
- `createGradientMaterial()` - Shader-based gradients
- `createTubeFromPoints()` - Equity curve tubes
- `disposeObject3D()` - Memory cleanup

## Visualizations

### 1. Price Chart 3D

**File**: `components/visualizations/PriceChart3D.tsx`

Renders candlestick charts as instanced 3D boxes.

**Features:**
- Instanced rendering for 100+ candles
- Color coding: Cyan (bullish) / Red (bearish)
- Entrance animation: Y-scale from 0 to 1
- Hover detection with OHLC tooltip
- LOD: Auto-samples to 50 candles when FPS < 30

**Usage:**
```tsx
<PriceChart3D
  data={historicalBars}
  symbol="AAPL"
  onHover={(bar, index) => console.log(bar)}
/>
```

**Performance:**
- 100 candles: ~2ms render time
- 500 candles: ~8ms render time (with LOD)
- Memory: ~5MB for 100 candles

### 2. Equity Curve 3D

**File**: `components/visualizations/EquityCurve3D.tsx`

Renders backtest equity curve as a tube geometry with trade markers.

**Features:**
- TubeGeometry along CatmullRomCurve3
- Gradient shader (green → red based on slope)
- Draw-in animation over 2 seconds
- Particle system for trade markers
- Ground plane at initial capital
- Transparent drawdown zones

**Usage:**
```tsx
<EquityCurve3D
  equityCurve={backtestResult.equityCurve}
  trades={backtestResult.trades}
  initialCapital={100000}
  onPointHover={(point, index) => setHovered(point)}
/>
```

**Performance:**
- 100 points: ~3ms render time
- 1000 points: ~12ms render time
- Memory: ~8MB for 1000 points

### 3. Portfolio Chart 3D

**File**: `components/visualizations/PortfolioChart3D.tsx`

Renders portfolio positions as bars in circular layout.

**Features:**
- Circular bar arrangement (360° / position count)
- Gradient material based on P/L
- Text sprites for ticker labels
- Auto-rotation at 0.1 rad/sec
- Multi-metric support (value, P/L, allocation)

**Usage:**
```tsx
<PortfolioChart3D
  positions={portfolio.positions}
  metric="pnl"
  onPositionHover={(position) => setSelected(position)}
/>
```

**Performance:**
- 10 positions: ~1ms render time
- 50 positions: ~4ms render time
- Memory: ~3MB for 50 positions

## Performance Optimization

### 1. Lazy Loading

Panels are lazy-loaded to reduce initial bundle size:

```typescript
const PriceChartPanel = lazy(() => import('./panels/PriceChartPanel'));
```

**Impact**: ~130KB bundle size reduction on initial load.

### 2. Instanced Rendering

Use `THREE.InstancedMesh` for repeated geometries:

```typescript
const bodyMesh = new THREE.InstancedMesh(
  bodyGeometry,
  material,
  candleCount
);
```

**Impact**: 10x performance improvement for 100+ objects.

### 3. LOD (Level of Detail)

Automatically reduce detail when performance degrades:

```typescript
const maxCandles = shouldReduceQuality ? 50 : data.length;
```

**Impact**: Maintains 30+ FPS on low-end devices.

### 4. Memory Management

Always dispose Three.js objects:

```typescript
useEffect(() => {
  return () => {
    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      (meshRef.current.material as Material).dispose();
    }
  };
}, []);
```

**Impact**: Prevents memory leaks in long sessions.

### 5. Animation Throttling

Skip frames when FPS < 30:

```typescript
useFrame((state, delta) => {
  if (fps < 30) return; // Skip this frame
  // ... animation code
});
```

## WebGL Support

### Detection

```typescript
import { detectWebGLCapabilities } from '@/utils/webgl-detection';

const capabilities = detectWebGLCapabilities();
if (!capabilities.supported) {
  // Show 2D fallback
}
```

### Fallback Handling

All 3D visualizations have 2D fallbacks:
- **PriceChart3D** → recharts LineChart
- **EquityCurve3D** → recharts AreaChart
- **PortfolioChart3D** → recharts BarChart

### Context Loss Recovery

```typescript
import { setupWebGLContextRecovery } from '@/utils/webgl-detection';

useEffect(() => {
  const cleanup = setupWebGLContextRecovery(
    canvasRef.current,
    () => console.warn('Context lost'),
    () => console.log('Context restored')
  );
  return cleanup;
}, []);
```

## Troubleshooting

### Low FPS

**Symptoms**: FPS < 30, choppy animations
**Solutions**:
1. Close unused panels
2. Reduce number of active visualizations
3. Clear browser cache
4. Use 2D view instead

### High Memory Usage

**Symptoms**: Browser slowing down, crashes
**Solutions**:
1. Refresh page to clear memory
2. Close other browser tabs
3. Reduce data range (fewer candles/trades)
4. Use Chrome Task Manager to monitor

### WebGL Errors

**Symptoms**: Black screen, "WebGL not supported"
**Solutions**:
1. Update graphics drivers
2. Enable hardware acceleration in browser
3. Try different browser (Chrome recommended)
4. Use 2D fallback mode

### Mobile Performance

**Symptoms**: Slow on mobile devices
**Expected**: Mobile devices automatically use medium quality
**Solutions**:
1. Use 2D views on mobile
2. Reduce data range
3. Close background apps

## Browser Compatibility

### Supported Browsers

| Browser | Version | Performance | Notes |
|---------|---------|-------------|-------|
| Chrome | 90+ | Excellent | Recommended |
| Firefox | 88+ | Good | WebGL 2 support |
| Safari | 14+ | Good | macOS/iOS |
| Edge | 90+ | Excellent | Chromium-based |

### Not Supported

- IE 11 and below
- Opera Mini
- UC Browser
- Old Android browsers (<5.0)

## Best Practices

### 1. Limit Active Visualizations

- Maximum 2-3 active 3D panels simultaneously
- Close panels when not needed
- Use 2D view for quick analysis

### 2. Data Management

- Limit price chart to 500 candles max
- Limit equity curve to 1000 points
- Limit portfolio to 50 positions

### 3. Animation Performance

- Keep animation durations < 3 seconds
- Use RAF throttling for non-critical updates
- Debounce user input (300ms)

### 4. Memory Management

- Dispose objects in useEffect cleanup
- Clear references to large objects
- Monitor memory in dev tools

## Performance Metrics

### Target Performance

- **FPS**: 60 (minimum 30)
- **Frame Time**: <16ms (maximum 33ms)
- **Memory**: <150MB increase
- **Initial Load**: <3s
- **Panel Open**: <500ms

### Monitoring

Use the Performance Monitor (Dev Mode):
```
Bottom-left corner when FPS < 45
Click to expand for detailed metrics
```

Metrics shown:
- FPS with frame time graph
- Memory usage (if available)
- Active visualizations count
- Quality mode indicator

## API Reference

### useThreeScene Hook

```typescript
const {
  scene,                    // THREE.Scene
  camera,                   // THREE.PerspectiveCamera
  registerVisualization,    // (id, object, priority) => void
  unregisterVisualization,  // (id) => void
  moveCameraTo,             // (target) => void
  resetCamera,              // () => void
  fps,                      // number
  shouldReduceQuality,      // boolean
} = useThreeScene();
```

### useChoreography Hook

```typescript
const {
  sequence,      // (items) => Promise<void>
  stagger,       // (config) => Promise<void>
  pause,         // () => void
  resume,        // () => void
  stop,          // () => void
  delay,         // (ms) => Promise<void>
} = useChoreography();
```

## Examples

### Custom 3D Visualization

```typescript
import { useThreeScene } from './three/ThreeScene';
import { createNeonMaterial } from '@/utils/three-helpers';

const CustomViz: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { registerVisualization, unregisterVisualization } = useThreeScene();

  useEffect(() => {
    if (meshRef.current) {
      registerVisualization('custom', meshRef.current, 5);
    }
    return () => unregisterVisualization('custom');
  }, []);

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <primitive object={createNeonMaterial()} attach="material" />
    </mesh>
  );
};
```

### Animated Camera Transition

```typescript
const { moveCameraTo } = useThreeScene();

const focusOnChart = () => {
  moveCameraTo({
    position: [0, 2, 10],
    lookAt: [0, 0, 0],
    duration: 800,
  });
};
```

## Further Reading

- [Three.js Documentation](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Performance Optimization](https://discoverthreejs.com/tips-and-tricks/)
