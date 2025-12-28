/**
 * EquityCurve3D - 3D Equity Curve Visualization
 *
 * Renders backtest equity curve as a 3D tube with:
 * - TubeGeometry along CatmullRomCurve3
 * - Gradient material (green → red based on slope)
 * - Draw-in animation over 2 seconds
 * - Particle markers for trades (green=BUY, red=SELL)
 * - Raycaster for point inspection
 * - Ground plane at initial capital level
 * - Red transparent planes for drawdown zones
 */

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EquityPoint, Trade } from '@/types';
import { COLORS, createParticleSystem, disposeObject3D } from '@/utils/three-helpers';

export interface EquityCurve3DProps {
    equityCurve: EquityPoint[];
    trades: Trade[];
    initialCapital: number;
    onPointHover?: (point: EquityPoint | null, index: number) => void;
}

// Constants
const TUBE_RADIUS = 0.05;
const ANIMATION_DURATION = 2000; // 2 seconds
const CURVE_WIDTH = 8; // X-axis span
const CURVE_HEIGHT = 4; // Y-axis span

/**
 * Calculate normalized curve points from equity data
 */
function calculateCurvePoints(
    equityCurve: EquityPoint[],
    initialCapital: number
): { points: THREE.Vector3[]; minEquity: number; maxEquity: number } {
    if (equityCurve.length === 0) {
        return { points: [], minEquity: 0, maxEquity: 0 };
    }

    const equities = equityCurve.map((p) => p.equity);
    const minEquity = Math.min(...equities);
    const maxEquity = Math.max(...equities);
    const equityRange = maxEquity - minEquity || 1;

    const points = equityCurve.map((point, index) => {
        const x = (index / (equityCurve.length - 1)) * CURVE_WIDTH - CURVE_WIDTH / 2;
        const y = ((point.equity - minEquity) / equityRange) * CURVE_HEIGHT - CURVE_HEIGHT / 2;
        const z = 0;
        return new THREE.Vector3(x, y, z);
    });

    return { points, minEquity, maxEquity };
}

/**
 * Create gradient shader material based on slope
 */
function createSlopeMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
        uniforms: {
            colorPositive: { value: new THREE.Color(COLORS.NEON_CYAN) },
            colorNegative: { value: new THREE.Color(COLORS.RED) },
            drawProgress: { value: 0 },
            opacity: { value: 0.9 },
        },
        vertexShader: `
      varying vec3 vPosition;
      varying float vProgress;
      
      void main() {
        vPosition = position;
        // Calculate progress along curve (0-1)
        vProgress = (position.x + ${CURVE_WIDTH / 2}.0) / ${CURVE_WIDTH}.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 colorPositive;
      uniform vec3 colorNegative;
      uniform float drawProgress;
      uniform float opacity;
      
      varying vec3 vPosition;
      varying float vProgress;
      
      void main() {
        // Hide undrawn portion
        if (vProgress > drawProgress) {
          discard;
        }
        
        // Mix color based on Y position (slope proxy)
        float mixFactor = smoothstep(-${CURVE_HEIGHT / 2}.0, ${CURVE_HEIGHT / 2}.0, vPosition.y);
        vec3 color = mix(colorNegative, colorPositive, mixFactor);
        
        gl_FragColor = vec4(color, opacity);
      }
    `,
        transparent: true,
        side: THREE.DoubleSide,
    });
}

/**
 * Equity Curve Tube Component
 */
const EquityTube: React.FC<{
    points: THREE.Vector3[];
    onHover?: (index: number) => void;
}> = ({ points, onHover }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const materialRef = useRef<THREE.ShaderMaterial | null>(null);
    const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);

    // Create geometry and material
    const { geometry, material } = useMemo(() => {
        if (points.length < 2) {
            return { geometry: null, material: null };
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, points.length * 2, TUBE_RADIUS, 8, false);
        const tubeMaterial = createSlopeMaterial();

        materialRef.current = tubeMaterial;

        return { geometry: tubeGeometry, material: tubeMaterial };
    }, [points]);

    // Start animation on mount
    useEffect(() => {
        setAnimationStartTime(performance.now());
    }, [points]);

    // Animate draw-in
    useFrame(() => {
        if (!materialRef.current || animationStartTime === null) return;

        const elapsed = performance.now() - animationStartTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);

        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        materialRef.current.uniforms.drawProgress.value = eased;
    });

    // Raycaster hover
    const handlePointerMove = useCallback(
        (event: ThreeEvent<PointerEvent>) => {
            if (!onHover || !event.point || points.length === 0) return;

            // Find closest point index based on X position
            const normalizedX = (event.point.x + CURVE_WIDTH / 2) / CURVE_WIDTH;
            const index = Math.round(normalizedX * (points.length - 1));
            onHover(Math.max(0, Math.min(index, points.length - 1)));
        },
        [onHover, points.length]
    );

    const handlePointerOut = useCallback(() => {
        if (onHover) onHover(-1);
    }, [onHover]);

    if (!geometry || !material) return null;

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            onPointerMove={handlePointerMove}
            onPointerOut={handlePointerOut}
        />
    );
};

/**
 * Trade Markers Component (Particle System)
 */
const TradeMarkers: React.FC<{
    trades: Trade[];
    equityCurve: EquityPoint[];
    curvePoints: THREE.Vector3[];
}> = ({ trades, equityCurve, curvePoints }) => {
    const buyPointsRef = useRef<THREE.Points>(null);
    const sellPointsRef = useRef<THREE.Points>(null);

    // Calculate trade positions
    const { buyPositions, sellPositions } = useMemo(() => {
        const buyPos: number[] = [];
        const sellPos: number[] = [];

        trades.forEach((trade) => {
            // Find closest equity curve point by date
            const tradeDate = new Date(trade.date).getTime();
            let closestIndex = 0;
            let closestDiff = Infinity;

            equityCurve.forEach((point, index) => {
                const pointDate = new Date(point.date).getTime();
                const diff = Math.abs(pointDate - tradeDate);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestIndex = index;
                }
            });

            if (closestIndex < curvePoints.length) {
                const pos = curvePoints[closestIndex];
                const arr = trade.side === 'BUY' ? buyPos : sellPos;
                arr.push(pos.x, pos.y + 0.2, pos.z); // Slightly above curve
            }
        });

        return { buyPositions: new Float32Array(buyPos), sellPositions: new Float32Array(sellPos) };
    }, [trades, equityCurve, curvePoints]);

    // Create geometries
    const buyGeometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(buyPositions, 3));
        return geo;
    }, [buyPositions]);

    const sellGeometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(sellPositions, 3));
        return geo;
    }, [sellPositions]);

    // Pulse animation
    useFrame((state) => {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
        if (buyPointsRef.current) {
            (buyPointsRef.current.material as THREE.PointsMaterial).size = 0.15 * scale;
        }
        if (sellPointsRef.current) {
            (sellPointsRef.current.material as THREE.PointsMaterial).size = 0.15 * scale;
        }
    });

    return (
        <>
            <points ref={buyPointsRef} geometry={buyGeometry}>
                <pointsMaterial
                    color={COLORS.NEON_CYAN}
                    size={0.15}
                    transparent
                    opacity={0.9}
                    sizeAttenuation
                />
            </points>
            <points ref={sellPointsRef} geometry={sellGeometry}>
                <pointsMaterial
                    color={COLORS.RED}
                    size={0.15}
                    transparent
                    opacity={0.9}
                    sizeAttenuation
                />
            </points>
        </>
    );
};

/**
 * Ground Plane at Initial Capital Level
 */
const GroundPlane: React.FC<{ y: number }> = ({ y }) => {
    return (
        <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[CURVE_WIDTH + 1, 2]} />
            <meshBasicMaterial color={COLORS.WHITE} transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>
    );
};

/**
 * Drawdown Zone Planes
 */
const DrawdownZones: React.FC<{
    equityCurve: EquityPoint[];
    curvePoints: THREE.Vector3[];
}> = ({ equityCurve, curvePoints }) => {
    // Calculate drawdown regions
    const zones = useMemo(() => {
        const result: { startX: number; endX: number; minY: number }[] = [];
        let peakY = -Infinity;
        let inDrawdown = false;
        let zoneStart = 0;
        let zoneMinY = Infinity;

        curvePoints.forEach((point, index) => {
            if (point.y > peakY) {
                if (inDrawdown) {
                    // End current drawdown zone
                    result.push({ startX: zoneStart, endX: point.x, minY: zoneMinY });
                    inDrawdown = false;
                    zoneMinY = Infinity;
                }
                peakY = point.y;
            } else if (point.y < peakY - 0.1) {
                if (!inDrawdown) {
                    inDrawdown = true;
                    zoneStart = curvePoints[Math.max(0, index - 1)].x;
                }
                zoneMinY = Math.min(zoneMinY, point.y);
            }
        });

        // Close final zone if still in drawdown
        if (inDrawdown && curvePoints.length > 0) {
            result.push({
                startX: zoneStart,
                endX: curvePoints[curvePoints.length - 1].x,
                minY: zoneMinY,
            });
        }

        return result;
    }, [curvePoints]);

    return (
        <>
            {zones.map((zone, index) => (
                <mesh
                    key={index}
                    position={[(zone.startX + zone.endX) / 2, zone.minY, -0.1]}
                >
                    <planeGeometry args={[zone.endX - zone.startX, 0.5]} />
                    <meshBasicMaterial color={COLORS.RED} transparent opacity={0.1} side={THREE.DoubleSide} />
                </mesh>
            ))}
        </>
    );
};

/**
 * Tooltip Component
 */
const EquityTooltip: React.FC<{
    point: EquityPoint | null;
    position: THREE.Vector3 | null;
}> = ({ point, position }) => {
    if (!point || !position) return null;

    const formattedDate =
        typeof point.date === 'string' ? point.date : point.date.toISOString().split('T')[0];

    return (
        <Html position={[position.x, position.y + 0.5, position.z]} center>
            <div className="bg-black border border-white px-3 py-2 font-mono text-xs pointer-events-none">
                <div className="text-gray-400">{formattedDate}</div>
                <div className="text-qm-neon-cyan font-bold">
                    ${point.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            </div>
        </Html>
    );
};

/**
 * Main EquityCurve3D Component
 */
export const EquityCurve3D: React.FC<EquityCurve3DProps> = ({
    equityCurve,
    trades,
    initialCapital,
    onPointHover,
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

    // Calculate curve data
    const { points, minEquity, maxEquity } = useMemo(
        () => calculateCurvePoints(equityCurve, initialCapital),
        [equityCurve, initialCapital]
    );

    // Calculate ground plane Y position (initial capital level)
    const groundY = useMemo(() => {
        if (points.length === 0) return 0;
        const equityRange = maxEquity - minEquity || 1;
        return ((initialCapital - minEquity) / equityRange) * CURVE_HEIGHT - CURVE_HEIGHT / 2;
    }, [points, minEquity, maxEquity, initialCapital]);

    // Handle hover
    const handleHover = useCallback(
        (index: number) => {
            setHoveredIndex(index);
            if (onPointHover) {
                onPointHover(index >= 0 ? equityCurve[index] : null, index);
            }
        },
        [equityCurve, onPointHover]
    );

    // Get hovered point and position
    const hoveredPoint = hoveredIndex >= 0 ? equityCurve[hoveredIndex] : null;
    const hoveredPosition = hoveredIndex >= 0 && points[hoveredIndex] ? points[hoveredIndex] : null;

    if (points.length < 2) {
        return (
            <Html center>
                <div className="font-mono text-xs text-gray-500">No equity data</div>
            </Html>
        );
    }

    return (
        <group>
            {/* Equity curve tube */}
            <EquityTube points={points} onHover={handleHover} />

            {/* Trade markers */}
            <TradeMarkers trades={trades} equityCurve={equityCurve} curvePoints={points} />

            {/* Ground plane at initial capital */}
            <GroundPlane y={groundY} />

            {/* Drawdown zones */}
            <DrawdownZones equityCurve={equityCurve} curvePoints={points} />

            {/* Tooltip */}
            <EquityTooltip point={hoveredPoint} position={hoveredPosition} />
        </group>
    );
};

export default EquityCurve3D;
