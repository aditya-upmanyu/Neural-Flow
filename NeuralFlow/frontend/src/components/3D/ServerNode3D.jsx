// ServerNode3D.jsx - Individual 3D server node with health visualization
import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export default function ServerNode3D({ node, position }) {
  const sphereRef = useRef();
  const ringRefs = useRef([]);
  const shieldRef = useRef();
  const [pulseIntensity, setPulseIntensity] = useState(0);
  
  // Determine color based on status
  const getNodeColor = () => {
    if (node.isUnderAttack) return '#ff3366';
    if (node.status === 'HEALTHY') return '#00ff88';
    if (node.status === 'WARNING') return '#ffd700';
    if (node.status === 'CRITICAL') return '#ff3366';
    return '#00ff88';
  };

  const getEmissiveColor = () => {
    if (node.isUnderAttack) return '#ff0033';
    if (node.status === 'HEALTHY') return '#003322';
    if (node.status === 'WARNING') return '#332200';
    if (node.status === 'CRITICAL') return '#ff0033';
    return '#003322';
  };

  const nodeColor = getNodeColor();
  const emissiveColor = getEmissiveColor();

  // Attack intensity (0-1 based on attack type)
  const attackIntensity = node.isUnderAttack ? 
    (node.attackType === 'DDoS' ? 1.0 : 0.6) : 0;

  // Enhanced breathing and attack pulsing animation
  useFrame((state) => {
    const time = state.clock.elapsedTime;

    if (sphereRef.current) {
      if (node.isUnderAttack) {
        // Aggressive pulsing during attacks
        const attackPulse = Math.sin(time * 8) * 0.15 + 1;
        const breathe = Math.sin(time * 2) * 0.05 + 1;
        const scale = attackPulse * breathe;
        sphereRef.current.scale.set(scale, scale, scale);
        
        // Increase emissive intensity during pulse peaks
        const emissiveIntensity = (Math.sin(time * 8) + 1) * 0.5 + 0.5; // 0.5-1.5
        sphereRef.current.material.emissiveIntensity = emissiveIntensity * 1.5;
        
        // Add jitter effect for severe attacks
        if (attackIntensity > 0.7) {
          sphereRef.current.position.x = position[0] + (Math.random() - 0.5) * 0.05;
          sphereRef.current.position.y = position[1] + (Math.random() - 0.5) * 0.05;
          sphereRef.current.position.z = position[2] + (Math.random() - 0.5) * 0.05;
        }
      } else {
        // Normal breathing
        const breathe = Math.sin(time * 2) * 0.05 + 1;
        sphereRef.current.scale.set(breathe, breathe, breathe);
        sphereRef.current.material.emissiveIntensity = 0.3;
        sphereRef.current.position.set(...position);
      }
    }

    // Rotate rings at different speeds (faster during attacks)
    const speedMultiplier = node.isUnderAttack ? 5 : 1;
    ringRefs.current.forEach((ring, index) => {
      if (ring) {
        ring.rotation.z += (0.005 + index * 0.002) * speedMultiplier;
        ring.rotation.x = Math.sin(time * 0.5) * 0.2;
        
        // Pulse ring opacity during attacks
        if (node.isUnderAttack) {
          const opacity = (Math.sin(time * 6 + index) + 1) * 0.25 + 0.2;
          ring.material.opacity = opacity;
        }
      }
    });

    // Shield pulsing during mitigation
    if (shieldRef.current && node.status === 'WARNING') {
      const shieldPulse = (Math.sin(time * 4) + 1) * 0.3 + 0.4; // 0.4-1.0
      shieldRef.current.scale.set(shieldPulse, shieldPulse, shieldPulse);
      shieldRef.current.material.opacity = shieldPulse * 0.4;
    }
  });

  // Create orbital particles based on health
  const particleCount = Math.floor((node.health / 100) * 20);
  const particles = useMemo(() => {
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 1.5;
      positions.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: (Math.random() - 0.5) * 0.5
      });
    }
    return positions;
  }, [particleCount]);

  return (
    <group position={position}>
      {/* Main sphere */}
      <Sphere ref={sphereRef} args={[0.8, 32, 32]} castShadow>
        <meshStandardMaterial
          color={nodeColor}
          emissive={emissiveColor}
          emissiveIntensity={node.isUnderAttack ? 0.8 : 0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>

      {/* Protective shield (appears during mitigation) */}
      {node.status === 'WARNING' && (
        <Sphere ref={shieldRef} args={[1.3, 32, 32]}>
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            wireframe
          />
        </Sphere>
      )}

      {/* Concentric rings (more dramatic during attacks) */}
      {[1.2, 1.5, 1.8].map((radius, index) => (
        <mesh
          key={index}
          ref={el => ringRefs.current[index] = el}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[radius, node.isUnderAttack ? 0.04 : 0.02, 8, 32]} />
          <meshBasicMaterial
            color={nodeColor}
            transparent
            opacity={node.isUnderAttack ? 0.5 - index * 0.1 : 0.3 - index * 0.08}
          />
        </mesh>
      ))}

      {/* Health orbit particles */}
      {particles.map((pos, i) => (
        <Particle
          key={i}
          position={[pos.x, pos.y, pos.z]}
          color={nodeColor}
          speed={node.isUnderAttack ? 2 + i * 0.2 : 0.5 + i * 0.1}
          isAttack={node.isUnderAttack}
        />
      ))}

      {/* Node label */}
      <Html
        position={[0, 1.5, 0]}
        center
        distanceFactor={8}
        className="pointer-events-none"
      >
        <div className={`bg-neural-card/95 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs whitespace-nowrap transition-all ${
          node.isUnderAttack 
            ? 'border-red-500 shadow-lg shadow-red-500/50' 
            : 'border-neural-border'
        }`}>
          <div className="font-semibold text-white">{node.name}</div>
          <div className="text-gray-400 text-[10px]">{node.location}</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <div 
                className={`w-2 h-2 rounded-full ${node.isUnderAttack ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: nodeColor, boxShadow: `0 0 8px ${nodeColor}` }}
              />
              <span className="text-gray-300">{node.health}%</span>
            </div>
            <div className="text-gray-400">|</div>
            <span className={`text-gray-300 ${node.isUnderAttack && node.latency > 300 ? 'text-red-400 font-bold' : ''}`}>
              {node.latency}ms
            </span>
          </div>
          {node.isUnderAttack && (
            <div className="text-red-400 font-mono text-[10px] mt-1 animate-pulse flex items-center gap-1">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-ping" />
              ⚠ {node.attackType?.toUpperCase() || 'ATTACK'}
            </div>
          )}
        </div>
      </Html>

      {/* Dramatic spotlight when under attack */}
      {node.isUnderAttack && (
        <>
          <pointLight
            position={[0, 3, 0]}
            color="#ff3366"
            intensity={3}
            distance={8}
          />
          <pointLight
            position={[0, -2, 0]}
            color="#ff0033"
            intensity={1.5}
            distance={5}
          />
        </>
      )}

      {/* Subtle ambient light for healthy nodes */}
      {!node.isUnderAttack && node.status === 'HEALTHY' && (
        <pointLight
          position={[0, 1, 0]}
          color="#00ff88"
          intensity={0.5}
          distance={3}
        />
      )}
    </group>
  );
}

// Small particle component for orbiting dots
function Particle({ position, color, speed, isAttack }) {
  const ref = useRef();
  
  useFrame((state) => {
    if (ref.current) {
      const time = state.clock.elapsedTime * speed;
      ref.current.position.x = position[0] * Math.cos(time) - position[1] * Math.sin(time);
      ref.current.position.y = position[0] * Math.sin(time) + position[1] * Math.cos(time);
      
      // Add erratic movement during attacks
      if (isAttack) {
        ref.current.position.z = position[2] + Math.sin(time * 3) * 0.3;
      }
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[isAttack ? 0.08 : 0.05, 8, 8]} />
      <meshBasicMaterial 
        color={color} 
        transparent={isAttack}
        opacity={isAttack ? 0.8 : 1.0}
      />
    </mesh>
  );
}
