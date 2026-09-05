// DataParticles.jsx - Ambient data particles floating in the scene
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function DataParticles({ nodes, positions }) {
  const particlesRef = useRef();
  const particleCount = 500;

  // Generate random particle positions
  const { positions: particlePositions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const color = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
      // Random position in a sphere around origin
      const radius = 4 + Math.random() * 4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      // Random color (cyan/green/blue tints)
      const colorChoice = Math.random();
      if (colorChoice < 0.4) {
        color.setHex(0x00ff88); // Green
      } else if (colorChoice < 0.7) {
        color.setHex(0x00d4ff); // Cyan
      } else {
        color.setHex(0xa855f7); // Purple
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 0.03 + 0.01;
    }

    return { positions, colors, sizes };
  }, []);

  // Animate particles
  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        // Gentle drift motion
        positions[i3] += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;
        positions[i3 + 1] += Math.cos(state.clock.elapsedTime * 0.3 + i) * 0.002;
        positions[i3 + 2] += Math.sin(state.clock.elapsedTime * 0.4 + i) * 0.002;

        // Contain within bounds
        const distance = Math.sqrt(
          positions[i3] ** 2 + 
          positions[i3 + 1] ** 2 + 
          positions[i3 + 2] ** 2
        );

        if (distance > 8) {
          positions[i3] *= 0.95;
          positions[i3 + 1] *= 0.95;
          positions[i3 + 2] *= 0.95;
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particlePositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
