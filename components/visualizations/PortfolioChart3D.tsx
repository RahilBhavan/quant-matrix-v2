/**
 * PortfolioChart3D - 3D Portfolio Visualization
 *
 * Renders portfolio positions as a circular bar chart with:
 * - BoxGeometry bars arranged in a circle
 * - Gradient material: cyan (profit) to red (loss)
 * - Text sprites for ticker labels
 * - Auto-rotate at 0.1 rad/sec
 * - Multi-metric support: value, P/L, allocation %
 */

import React, { useRef, useMemo, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Position } from '@/types';
import { COLORS, createNeonMaterial, lerpColor } from '@/utils/three-helpers';

export type PortfolioMetric = 'value' | 'pnl' | 'allocation';

export interface PortfolioChart3DProps {
    positions: Position[];
    metric: PortfolioMetric;
    totalEquity: number;
    onPositionHover?: (position: Position | null, index: number) => void;
}

// Constants
const CIRCLE_RADIUS = 3;
const BAR_WIDTH = 0.4;
const BAR_DEPTH = 0.3;
const MAX_BAR_HEIGHT = 3;
const AUTO_ROTATE_SPEED = 0.1; // rad/sec

/**
 * Calculate bar data from positions
 */
function calculateBarData(
    positions: Position[],
    metric: PortfolioMetric,
    totalEquity: number
): { position: Position; value: number; normalizedHeight: number; color: string; angle: number }[] {
    if (positions.length === 0) return [];

    // Calculate metrics
    const barData = positions.map((pos) => {
        let value: number;
        switch (metric) {
            case 'value':
                value = pos.currentPrice * pos.quantity;
                break;
            case 'pnl':
                value = pos.unrealizedPL;
                break;
            case 'allocation':
                value = ((pos.currentPrice * pos.quantity) / totalEquity) * 100;
                break;
            default:
                value = pos.currentPrice * pos.quantity;
        }
        return { position: pos, value };
    });

    // Find max for normalization
    const maxValue = Math.max(...barData.map((d) => Math.abs(d.value)), 1);

    // Calculate colors and heights
    return barData.map((data, index) => {
        const normalizedHeight = (Math.abs(data.value) / maxValue) * MAX_BAR_HEIGHT;

        // Color based on P/L (or allocation for allocation metric)
        let colorFactor: number;
        if (metric === 'pnl') {
            colorFactor = data.value >= 0 ? 1 : 0;
        } else {
            colorFactor = data.position.unrealizedPL >= 0 ? 1 : 0;
        }
        const color = colorFactor >= 0.5 ? COLORS.NEON_CYAN : COLORS.RED;

        // Angle for circular layout
        const angle = (index / positions.length) * Math.PI * 2;

        return {
            position: data.position,
            value: data.value,
            normalizedHeight: Math.max(normalizedHeight, 0.1), // Minimum height
            color,
            angle,
        };
    });
}

/**
 * Single Bar Component
 */
const PortfolioBar: React.FC<{
    position: Position;
    value: number;
    height: number;
    color: string;
    angle: number;
    index: number;
    onHover?: (index: number) => void;
}> = ({ position, value, height, color, angle, index, onHover }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    // Calculate position on circle
    const x = Math.cos(angle) * CIRCLE_RADIUS;
    const z = Math.sin(angle) * CIRCLE_RADIUS;
    const y = height / 2; // Center bar vertically

    const handlePointerEnter = useCallback(() => {
        if (onHover) onHover(index);
    }, [onHover, index]);

    const handlePointerLeave = useCallback(() => {
        if (onHover) onHover(-1);
    }, [onHover]);

    return (
        <group position={[x, 0, z]} rotation={[0, -angle + Math.PI / 2, 0]}>
            {/* Bar */}
            <mesh
                ref={meshRef}
                position={[0, y, 0]}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
            >
                <boxGeometry args={[BAR_WIDTH, height, BAR_DEPTH]} />
                <meshBasicMaterial
                    color={color}
                    transparent
                    opacity={0.8}
                    wireframe
                />
            </mesh>

            {/* Ticker Label */}
            <Text
                position={[0, height + 0.3, 0]}
                fontSize={0.2}
                color={COLORS.WHITE}
                anchorX="center"
                anchorY="bottom"
                font="/fonts/JetBrainsMono-Regular.ttf"
            >
                {position.symbol}
            </Text>

            {/* Value Label */}
            <Text
                position={[0, -0.3, 0]}
                fontSize={0.15}
                color={color}
                anchorX="center"
                anchorY="top"
                font="/fonts/JetBrainsMono-Regular.ttf"
            >
                {formatValue(value)}
            </Text>
        </group>
    );
};

/**
 * Format value for display
 */
function formatValue(value: number): string {
    if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    } else if (Math.abs(value) < 100) {
        return value.toFixed(2);
    }
    return value.toFixed(0);
}

/**
 * Ground Ring
 */
const GroundRing: React.FC = () => {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[CIRCLE_RADIUS - 0.5, CIRCLE_RADIUS + 0.5, 64]} />
            <meshBasicMaterial color={COLORS.WHITE} transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>
    );
};

/**
 * Hover Tooltip
 */
const PositionTooltip: React.FC<{
    position: Position | null;
    metric: PortfolioMetric;
}> = ({ position, metric }) => {
    if (!position) return null;

    const value = position.currentPrice * position.quantity;
    const formatCurrency = (v: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
    const formatPercent = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

    return (
        <Html center position={[0, MAX_BAR_HEIGHT + 1, 0]}>
            <div className="bg-black border border-white px-4 py-3 font-mono text-xs pointer-events-none min-w-[180px]">
                <div className="text-lg font-bold mb-2">{position.symbol}</div>
                <div className="space-y-1 text-gray-300">
                    <div className="flex justify-between">
                        <span>QTY:</span>
                        <span>{position.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>AVG:</span>
                        <span>{formatCurrency(position.avgPrice)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>CURRENT:</span>
                        <span>{formatCurrency(position.currentPrice)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/20 pt-1 mt-1">
                        <span>VALUE:</span>
                        <span className="font-bold">{formatCurrency(value)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>P/L:</span>
                        <span className={position.unrealizedPL >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {formatCurrency(position.unrealizedPL)} ({formatPercent(position.unrealizedPLPercent)})
                        </span>
                    </div>
                </div>
            </div>
        </Html>
    );
};

/**
 * Main PortfolioChart3D Component
 */
export const PortfolioChart3D: React.FC<PortfolioChart3DProps> = ({
    positions,
    metric,
    totalEquity,
    onPositionHover,
}) => {
    const groupRef = useRef<THREE.Group>(null);
    const [hoveredIndex, setHoveredIndex] = React.useState<number>(-1);

    // Calculate bar data
    const barData = useMemo(
        () => calculateBarData(positions, metric, totalEquity),
        [positions, metric, totalEquity]
    );

    // Auto-rotate
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += AUTO_ROTATE_SPEED * delta;
        }
    });

    // Handle hover
    const handleHover = useCallback(
        (index: number) => {
            setHoveredIndex(index);
            if (onPositionHover) {
                onPositionHover(index >= 0 ? positions[index] : null, index);
            }
        },
        [positions, onPositionHover]
    );

    const hoveredPosition = hoveredIndex >= 0 ? positions[hoveredIndex] : null;

    if (positions.length === 0) {
        return (
            <Html center>
                <div className="font-mono text-xs text-gray-500">No positions</div>
            </Html>
        );
    }

    return (
        <group ref={groupRef}>
            {/* Ground ring */}
            <GroundRing />

            {/* Bars */}
            {barData.map((data, index) => (
                <PortfolioBar
                    key={data.position.symbol}
                    position={data.position}
                    value={data.value}
                    height={data.normalizedHeight}
                    color={data.color}
                    angle={data.angle}
                    index={index}
                    onHover={handleHover}
                />
            ))}

            {/* Tooltip */}
            <PositionTooltip position={hoveredPosition} metric={metric} />
        </group>
    );
};

export default PortfolioChart3D;
