# Quant Matrix DeFi - Architecture

## Preserved Components from Stock Platform

### 3D Visualization Engine
- `components/three/ThreeScene.tsx` - Scene context and management
- `components/visualizations/EquityCurve3D.tsx` - Equity curve tube geometry
- `components/visualizations/PortfolioChart3D.tsx` - Portfolio bars
- `utils/three-helpers.ts` - Material/geometry factories
- `components/PerformanceMonitor.tsx` - FPS monitoring

### Animation System
- `hooks/useChoreography.ts` - Animation sequencing
- `utils/animation-presets.ts` - Framer Motion variants

### WebGL Detection
- `utils/webgl-detection.ts` - Capability detection and fallbacks

## New DeFi Services (Placeholders)
- `services/web3/` - Wallet and contract interaction
- `services/subgraph/` - The Graph queries
- `types/` - DeFi-specific TypeScript types

## Next Steps
Phase 2: Implement Web3 wallet connection
Phase 3: Implement subgraph data fetching
Phase 4: Create DeFi block components
