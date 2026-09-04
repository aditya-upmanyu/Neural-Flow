// ConnectionBeams.jsx - Enhanced glowing connection beams with dynamic effects
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function ConnectionBeams({ nodes, positions }) {
  if (nodes.length < 2) return null;

  const connections = [
    { from: 1, to: 2 }, // US to EU
    { from: 2, to: 3 }, // EU to Asia
    { from: 1, to: 3 }  // US to Asia
  ];

  return (
    <group>
      {connections.map((conn, index) => {
        const fromNode = nodes.find(n => n.nodeId === conn.from);
        const toNode = nodes.find(n => n.nodeId === conn.to);
        
        if (!fromNode || !toNode) return null;

        return (
          <ConnectionBeam
            key={`${conn.from}-${conn.to}`}
            from={positions[conn.from]}
            to={positions[conn.to]}
            fromNode={fromNode}
            toNode={toNode}
            index={index}
          />
        );
      })}
    </group>
  );
}

function ConnectionBeam({ from, to, fromNode, toNode, index }) {
  const tubeRef = useRef();
  const glowRef = useRef();
  const pulseRef = useRef();

  // Determine beam color and intensity based on node status
  const getBeamColor = () => {
    if (fromNode.isUnderAttack || toNode.isUnderAttack) return '#ff3366';
    if (fromNode.status === 'WARNING' || toNode.status === 'WARNING') return '#ffaa00';
    return '#00d4ff';
  };

  const isActive = fromNode.isUnderAttack || toNode.isUnderAttack;

  // Create dynamic curved path between nodes
  const curve = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const distance = start.distanceTo(end);
    const arcHeight = distance * 0.3; // Dynamic arc based on distance
    
    const midPoint = new THREE.Vector3(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2 + arcHeight,
      (start.z + end.z) / 2
    );
    
    return new THREE.QuadraticBezierCurve3(start, midPoint, end);
  }, [from, to]);

  const beamColor = getBeamColor();

  // Animate beam effects
  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    // Pulsing effect
    if (tubeRef.current) {
      const pulse = isActive 
        ? Math.sin(time * 6) * 0.3 + 0.7 // Fast pulse during attacks
        : Math.sin(time * 1.5) * 0.2 + 0.8; // Slow breathing normally
      tubeRef.current.material.opacity = pulse * 0.5;
    }

    // Glow intensity
    if (glowRef.current) {
      const glow = isActive
        ? Math.sin(time * 8) * 0.4 + 0.6
        : 0.9;
      glowRef.current.material.opacity = glow;
    }

    // Energy wave pulse
    if (pulseRef.current && isActive) {
      const pulsePosition = (time * 2) % 1;
      const pulsePoint = curve.getPoint(pulsePosition);
      pulseRef.current.position.copy(pulsePoint);
      pulseRef.current.scale.setScalar(Math.sin(pulsePosition * Math.PI) * 0.5 + 0.3);
    }
  });

  return (
    <group>
      {/* Outer glow tube */}
      <mesh>
        <tubeGeometry args={[curve, 64, 0.08, 16, false]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Main beam tube */}
      <mesh ref={tubeRef}>
        <tubeGeometry args={[curve, 64, 0.04, 16, false]} />
        <meshStandardMaterial
          color={beamColor}
          emissive={beamColor}
          emissiveIntensity={isActive ? 1.5 : 0.8}
          transparent
          opacity={0.5}
          metalness={0.5}
          roughness={0.2}
        />
      </mesh>

      {/* Inner glowing core */}
      <mesh ref={glowRef}>
        <tubeGeometry args={[curve, 64, 0.02, 16, false]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Energy wave pulse (visible during attacks) */}
      {isActive && (
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial
            color={beamColor}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {/* Enhanced data packets */}
      <DataPackets 
        curve={curve} 
        color={beamColor} 
        count={isActive ? 12 : 4}
        speed={isActive ? 3 : 1}
        isActive={isActive}
      />

      {/* Sparkle particles along beam */}
      {isActive && <SparkleTrail curve={curve} color={beamColor} />}
    </group>
  );
}

function DataPackets({ curve, color, count, speed, isActive }) {
  const packetsRef = useRef([]);

  useFrame((state) => {
    packetsRef.current.forEach((packet, i) => {
      if (packet) {
        const offset = i / count;
        const t = ((state.clock.elapsedTime * speed + offset) % 1);
        const point = curve.getPoint(t);
        packet.position.copy(point);
        
        // Scale packets based on position (larger in middle)
        const scale = Math.sin(t * Math.PI) * 0.4 + 0.6;
        packet.scale.setScalar(scale);
        
        // Rotate packets
        packet.rotation.y = state.clock.elapsedTime * 2 + offset * Math.PI * 2;
      }
    });
  });

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={el => packetsRef.current[i] = el}>
          <boxGeometry args={isActive ? [0.12, 0.12, 0.12] : [0.08, 0.08, 0.08]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={isActive ? 1.0 : 0.7}
          />
        </mesh>
      ))}
    </>
  );
}

function SparkleTrail({ curve, color }) {
  const sparklesRef = useRef([]);
  const sparkleCount = 20;

  useFrame((state) => {
    sparklesRef.current.forEach((sparkle, i) => {
      if (sparkle) {
        const t = ((state.clock.elapsedTime * 2 + (i / sparkleCount) * 2) % 1);
        const point = curve.getPoint(t);
        sparkle.position.copy(point);
        
        // Fade sparkles as they travel
        const opacity = Math.sin(t * Math.PI) * 0.6;
        sparkle.material.opacity = opacity;
        sparkle.scale.setScalar(opacity * 0.5);
      }
    });
  });

  return (
    <>
      {Array.from({ length: sparkleCount }).map((_, i) => (
        <mesh key={i} ref={el => sparklesRef.current[i] = el}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </>
  );
}
