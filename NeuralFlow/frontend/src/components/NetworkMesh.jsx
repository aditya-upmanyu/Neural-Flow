import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

// 3D Node Sphere
function NodeSphere({ position, node, onClick }) {
  const meshRef = useRef();
  const glowRef = useRef();
  
  const statusColor = 
    node.status === 'healthy' ? '#00ff88' :
    node.status === 'warning' ? '#ffaa00' : '#ff3355';

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + node.id) * 0.1;
      
      // Pulse effect for critical nodes
      if (node.status === 'critical') {
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
        meshRef.current.scale.setScalar(scale);
      }
    }
    
    if (glowRef.current && node.status !== 'healthy') {
      glowRef.current.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Outer glow sphere */}
      <Sphere ref={glowRef} args={[0.65, 32, 32]}>
        <meshBasicMaterial 
          color={statusColor} 
          transparent 
          opacity={0.2}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Main node sphere */}
      <Sphere 
        ref={meshRef} 
        args={[0.5, 32, 32]} 
        onClick={onClick}
      >
        <meshStandardMaterial 
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      
      {/* Node label */}
      <Text
        position={[0, -0.9, 0]}
        fontSize={0.25}
        color="#e8e8e8"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {node.name}
      </Text>
      
      {/* Health score */}
      <Text
        position={[0, -1.2, 0]}
        fontSize={0.18}
        color={statusColor}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {node.healthScore}%
      </Text>
    </group>
  );
}

// Animated connection line between nodes
function ConnectionLine({ start, end, active }) {
  const lineRef = useRef();
  
  useFrame((state) => {
    if (lineRef.current && active) {
      lineRef.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end)
  ], [start, end]);

  return (
    <Line
      ref={lineRef}
      points={points}
      color={active ? "#00d4ff" : "#1a1a2e"}
      lineWidth={active ? 2 : 1}
      transparent
      opacity={active ? 0.5 : 0.2}
    />
  );
}

// Data flow particles
function DataParticle({ start, end, speed = 1, delay = 0 }) {
  const particleRef = useRef();
  
  useFrame((state) => {
    if (particleRef.current) {
      const t = ((state.clock.elapsedTime * speed + delay) % 2) / 2;
      const pos = new THREE.Vector3().lerpVectors(
        new THREE.Vector3(...start),
        new THREE.Vector3(...end),
        t
      );
      particleRef.current.position.copy(pos);
      
      // Fade in/out
      particleRef.current.material.opacity = Math.sin(t * Math.PI) * 0.8;
    }
  });

  return (
    <Sphere ref={particleRef} args={[0.08, 16, 16]}>
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.8} />
    </Sphere>
  );
}

// Main 3D Scene
function Scene({ nodes }) {
  // Position nodes in a circle
  const nodePositions = useMemo(() => {
    const radius = 3;
    return nodes.map((node, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      return [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ];
    });
  }, [nodes]);

  // Determine active connections (between healthy nodes)
  const connections = useMemo(() => {
    const conns = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const active = nodes[i].status === 'healthy' && nodes[j].status === 'healthy';
        conns.push({
          start: nodePositions[i],
          end: nodePositions[j],
          active,
          id: `${i}-${j}`
        });
      }
    }
    return conns;
  }, [nodes, nodePositions]);

  // Create data particles for active connections
  const particles = useMemo(() => {
    const parts = [];
    connections.forEach((conn, idx) => {
      if (conn.active) {
        // Multiple particles per connection
        for (let i = 0; i < 3; i++) {
          parts.push({
            ...conn,
            particleId: `${conn.id}-${i}`,
            delay: i * 0.7
          });
        }
      }
    });
    return parts;
  }, [connections]);

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      
      {/* Directional light */}
      <directionalLight position={[5, 5, 5]} intensity={0.5} />
      
      {/* Point lights for dramatic effect */}
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#00d4ff" />
      <pointLight position={[0, -5, 0]} intensity={0.3} color="#ff6b35" />
      
      {/* Connection lines */}
      {connections.map((conn) => (
        <ConnectionLine
          key={conn.id}
          start={conn.start}
          end={conn.end}
          active={conn.active}
        />
      ))}
      
      {/* Data flow particles */}
      {particles.map((particle) => (
        <DataParticle
          key={particle.particleId}
          start={particle.start}
          end={particle.end}
          speed={0.5}
          delay={particle.delay}
        />
      ))}
      
      {/* Node spheres */}
      {nodes.map((node, i) => (
        <NodeSphere
          key={node.id}
          position={nodePositions[i]}
          node={node}
          onClick={() => console.log(`Clicked ${node.name}`)}
        />
      ))}
      
      {/* Grid helper (subtle) */}
      <gridHelper args={[10, 10, '#1a1a2e', '#0a0a14']} />
      
      {/* Camera controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={15}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

// Main component wrapper
export default function NetworkMesh({ nodes }) {
  if (!nodes || nodes.length === 0) {
    return (
      <div style={{
        width: '100%',
        height: 400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔮</div>
          <div>Loading 3D visualization...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: 400,
      background: 'var(--bg-card)',
      borderRadius: 16,
      border: '2px solid var(--border)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        zIndex: 10,
        background: 'rgba(10,10,20,0.8)',
        backdropFilter: 'blur(10px)',
        padding: '8px 16px',
        borderRadius: 10,
        border: '1px solid rgba(0,212,255,0.3)'
      }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#00d4ff',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>🌐</span>
          <span>3D NETWORK TOPOLOGY</span>
        </div>
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: 4
        }}>
          {nodes.filter(n => n.status === 'healthy').length} active connections
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 10,
        background: 'rgba(10,10,20,0.8)',
        backdropFilter: 'blur(10px)',
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        fontSize: '0.7rem',
        color: 'var(--text-muted)'
      }}>
        🖱️ Drag to rotate · Scroll to zoom
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 5, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <Scene nodes={nodes} />
      </Canvas>
    </div>
  );
}
