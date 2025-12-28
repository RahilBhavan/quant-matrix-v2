import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const AttractorMesh = () => {
  const mesh = useRef<THREE.Mesh>(null!);
  const [hovered, setHover] = React.useState(false);

  // Rotate the mesh
  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.1;
      mesh.current.rotation.y += delta * 0.15;
    }
  });

  // Material handling
  const wireframeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#333333'),
    wireframe: true,
    transparent: true,
    opacity: 0.3,
  }), []);

  const activeMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#00FF9D'), // Neon Cyan ignition
    wireframe: true,
    transparent: true,
    opacity: 0.8,
  }), []);

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
      <mesh
        ref={mesh}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
        scale={hovered ? 1.2 : 1}
      >
        <icosahedronGeometry args={[2.5, 2]} />
        <primitive object={hovered ? activeMaterial : wireframeMaterial} attach="material" />
      </mesh>
    </Float>
  );
};

export const ThreeBackground = () => {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <fog attach="fog" args={['#000000', 5, 15]} />
        <AttractorMesh />
      </Canvas>
    </div>
  );
};
