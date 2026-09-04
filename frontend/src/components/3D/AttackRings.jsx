// AttackRings.jsx - Enhanced expanding pulse rings with explosions and lightning
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function AttackRings({ position, attackType, intensity = 1.0 }) {
  const [rings, setRings] = useState([]);
  const [explosions, setExplosions] = useState([]);
  const nextRingTime = useRef(0);
  const nextExplosionTime = useRef(0);
  const groupRef = useRef();

  // Spawn rate based on attack intensity
  const spawnInterval = Math.max(0.15, 0.6 - (intensity * 0.4));
  const explosionInterval = 0.8;

  // Create new rings and explosions periodically
  useFrame((state) => {
    // Spawn attack rings
    if (state.clock.elapsedTime > nextRingTime.current) {
      setRings(prev => [...prev, {
        id: Math.random(),
        startTime: state.clock.elapsedTime,
        duration: 2.2,
        initialRotation: Math.random() * Math.PI * 2,
        offset: Math.random() * 0.5 - 0.25
      }]);
      nextRingTime.current = state.clock.elapsedTime + spawnInterval;

      const maxRings = Math.floor(5 + intensity * 5);
      if (rings.length > maxRings) {
        setRings(prev => prev.slice(1));
      }
    }

    // Spawn explosions for dramatic effect
    if (state.clock.elapsedTime > nextExplosionTime.current) {
      setExplosions(prev => [...prev, {
        id: Math.random(),
        startTime: state.clock.elapsedTime,
        duration: 0.8,
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 1.5 + 0.5
      }]);
      nextExplosionTime.current = state.clock.elapsedTime + explosionInterval;

      if (explosions.length > 8) {
        setExplosions(prev => prev.slice(1));
      }
    }

    // Rotate entire group
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003 * intensity;
    }
  });

  // Cleanup expired effects
  useEffect(() => {
    const interval = setInterval(() => {
      setRings(prev => prev.filter(ring => Date.now() - ring.startTime < 2500));
      setExplosions(prev => prev.filter(exp => Date.now() - exp.startTime < 1000));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <group ref={groupRef} position={position}>
      {/* Attack rings */}
      {rings.map(ring => (
        <AttackRing 
          key={ring.id} 
          ring={ring} 
          attackType={attackType} 
          intensity={intensity}
        />
      ))}
      
      {/* Explosion particles */}
      {explosions.map(explosion => (
        <ExplosionParticle
          key={explosion.id}
          explosion={explosion}
          attackType={attackType}
        />
      ))}
      
      {/* Lightning bolts emanating from node */}
      <LightningBolts attackType={attackType} intensity={intensity} />
      
      {/* Warning symbols floating around */}
      <WarningSymbols attackType={attackType} />
    </group>
  );
}

function AttackRing({ ring, attackType, intensity }) {
  const meshRef = useRef();
  const innerMeshRef = useRef();
  const shockwaveRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      const elapsed = state.clock.elapsedTime - ring.startTime;
      const progress = Math.min(elapsed / ring.duration, 1);

      // Expand with easing
      const maxScale = 5 + intensity * 3;
      const easedProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const scale = 1 + easedProgress * maxScale;
      meshRef.current.scale.set(scale, scale, scale);

      // Fade out
      const fadeOut = Math.pow(1 - progress, 2);
      meshRef.current.material.opacity = fadeOut * (0.6 + intensity * 0.2);

      // Rotate
      meshRef.current.rotation.z = ring.initialRotation + progress * Math.PI * 3;
    }

    // Inner ring with offset animation
    if (innerMeshRef.current) {
      const elapsed = state.clock.elapsedTime - ring.startTime;
      const progress = Math.min(elapsed / ring.duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const scale = 0.7 + easedProgress * (5 + intensity * 3);
      innerMeshRef.current.scale.set(scale, scale, scale);
      
      const fadeOut = Math.pow(1 - progress, 2);
      innerMeshRef.current.material.opacity = fadeOut * 0.4 * intensity;
      
      innerMeshRef.current.rotation.z = ring.initialRotation - progress * Math.PI * 2;
    }

    // Shockwave effect
    if (shockwaveRef.current) {
      const elapsed = state.clock.elapsedTime - ring.startTime;
      const progress = Math.min(elapsed / ring.duration, 1);
      
      if (progress < 0.3) { // Only show early in animation
        const shockProgress = progress / 0.3;
        const scale = 1 + shockProgress * 8;
        shockwaveRef.current.scale.set(scale, scale, 1);
        shockwaveRef.current.material.opacity = (1 - shockProgress) * 0.8;
      } else {
        shockwaveRef.current.material.opacity = 0;
      }
    }
  });

  const getAttackColor = () => {
    switch (attackType) {
      case 'DDoS':
      case 'ddos': return '#ff3366';
      case 'SlowLoris': return '#ff6b35';
      case 'Latency':
      case 'latency': return '#ff6600';
      case 'MemoryLeak': return '#a855f7';
      case 'TrafficSpike': return '#ffd700';
      default: return '#ff3366';
    }
  };

  const color = getAttackColor();

  return (
    <>
      {/* Outer ring */}
      <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.85, 1.05, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner ring */}
      <mesh ref={innerMeshRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 0.8, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Shockwave (initial burst) */}
      <mesh ref={shockwaveRef} rotation={[Math.PI / 2, 0, 0]} position={[0, ring.offset, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

function ExplosionParticle({ explosion, attackType }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      const elapsed = state.clock.elapsedTime - explosion.startTime;
      const progress = Math.min(elapsed / explosion.duration, 1);

      // Move outward
      const distance = explosion.distance + progress * 2;
      const x = Math.cos(explosion.angle) * distance;
      const z = Math.sin(explosion.angle) * distance;
      const y = Math.sin(progress * Math.PI) * 0.5; // Arc trajectory

      meshRef.current.position.set(x, y, z);

      // Scale and fade
      const scale = (1 - progress) * 0.3 + 0.1;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.material.opacity = (1 - progress) * 0.9;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.15, 12, 12]} />
      <meshBasicMaterial
        color="#ff6600"
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

function LightningBolts({ attackType, intensity }) {
  const boltsRef = useRef([]);
  const boltCount = 6;

  useFrame((state) => {
    boltsRef.current.forEach((bolt, i) => {
      if (bolt) {
        const time = state.clock.elapsedTime;
        const offset = (i / boltCount) * Math.PI * 2;
        
        // Flicker effect
        const flicker = Math.random() > 0.7 ? 1 : 0.3;
        bolt.material.opacity = flicker * 0.6 * intensity;
        
        // Extend outward
        const extend = Math.sin(time * 4 + offset) * 0.5 + 1.5;
        const x = Math.cos(offset) * extend;
        const z = Math.sin(offset) * extend;
        bolt.position.set(x, 0, z);
        
        // Rotate
        bolt.rotation.y = offset + time * 2;
      }
    });
  });

  return (
    <group>
      {Array.from({ length: boltCount }).map((_, i) => (
        <mesh key={i} ref={el => boltsRef.current[i] = el}>
          <boxGeometry args={[0.05, 2, 0.05]} />
          <meshBasicMaterial
            color="#00d4ff"
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

function WarningSymbols({ attackType }) {
  const symbolsRef = useRef([]);
  const symbolCount = 4;

  useFrame((state) => {
    symbolsRef.current.forEach((symbol, i) => {
      if (symbol) {
        const time = state.clock.elapsedTime;
        const offset = (i / symbolCount) * Math.PI * 2;
        const radius = 2;
        
        // Orbit around node
        const x = Math.cos(time + offset) * radius;
        const z = Math.sin(time + offset) * radius;
        const y = Math.sin(time * 2 + offset) * 0.5 + 1;
        
        symbol.position.set(x, y, z);
        symbol.rotation.y = time * 2;
        
        // Pulse
        const pulse = Math.sin(time * 4 + offset) * 0.2 + 0.8;
        symbol.scale.setScalar(pulse * 0.3);
      }
    });
  });

  return (
    <group>
      {Array.from({ length: symbolCount }).map((_, i) => (
        <mesh key={i} ref={el => symbolsRef.current[i] = el}>
          <octahedronGeometry args={[0.2, 0]} />
          <meshBasicMaterial
            color="#ff3366"
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}
