// NetworkTopology3D.jsx - Enhanced V4 3D Network Visualization
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Environment, Text, Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import ServerNode3D from './ServerNode3D';
import ConnectionBeams from './ConnectionBeams';
import DataParticles from './DataParticles';
import AttackRings from './AttackRings';
import useStore from '../../store/useStore';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

// Animated grid floor
function GridFloor() {
  const gridRef = useRef();
  
  useFrame(({ clock }) => {
    if (gridRef.current) {
      gridRef.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.1 - 2;
    }
  });

  return (
    <group ref={gridRef}>
      <gridHelper args={[20, 20, '#00d4ff', '#001a33']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial 
          color="#000511" 
          transparent 
          opacity={0.3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

// Floating particles in background
function BackgroundParticles() {
  const particlesRef = useRef();
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 200; i++) {
      const x = (Math.random() - 0.5) * 30;
      const y = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 30;
      temp.push({ x, y, z, speed: Math.random() * 0.5 + 0.1 });
    }
    return temp;
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.children.forEach((particle, i) => {
        particle.position.y += Math.sin(clock.elapsedTime * particles[i].speed) * 0.01;
        particle.position.x += Math.cos(clock.elapsedTime * particles[i].speed * 0.5) * 0.01;
      });
    }
  });

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={[particle.x, particle.y, particle.z]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial 
            color="#00d4ff" 
            emissive="#00d4ff"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// Pulsing energy sphere in center
function CenterEnergyCore() {
  const meshRef = useRef();
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.elapsedTime * 0.3;
      meshRef.current.rotation.y = clock.elapsedTime * 0.2;
      const scale = 0.8 + Math.sin(clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[0.5, 32, 32]} position={[0, 0, 0]}>
        <MeshDistortMaterial
          color="#00d4ff"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0}
          metalness={0.8}
          emissive="#00d4ff"
          emissiveIntensity={2}
        />
      </Sphere>
      {/* Outer rings */}
      {[1.2, 1.8, 2.4].map((radius, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius, 0.02, 16, 100]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={1.5 - i * 0.3}
            transparent
            opacity={0.4 - i * 0.1}
          />
        </mesh>
      ))}
    </Float>
  );
}

// Holographic labels
function NodeLabel({ position, text, status }) {
  const color = status === 'CRITICAL' ? '#ff4444' : status === 'WARNING' ? '#ffaa00' : '#00ff88';
  
  return (
    <Text
      position={[position[0], position[1] + 1.5, position[2]]}
      fontSize={0.3}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.05}
      outlineColor="#000000"
    >
      {text}
    </Text>
  );
}

export default function NetworkTopology3D() {
  const nodes = useStore(state => state.nodes);

  // Enhanced node positions in circular formation
  const nodePositions = useMemo(() => ({
    1: [-4, 0, 0],   // US Server - Left
    2: [0, 2, 3],    // EU Server - Top Back
    3: [4, 0, 0]     // Asia Server - Right
  }), []);

  return (
    <div className="w-full h-[700px] bg-gradient-to-b from-[#000511] via-[#001133] to-[#000511] rounded-xl border-2 border-cyan-500/30 overflow-hidden relative shadow-2xl shadow-cyan-500/20">
      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-3 text-xs font-mono z-10">
        <div className="text-cyan-400 font-bold mb-2">⚡ NETWORK STATUS</div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Nodes:</span>
            <span className="text-cyan-300 font-bold">{nodes.length} Active</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Latency:</span>
            <span className="text-green-400">{Math.round(Math.random() * 50 + 50)}ms</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Packets:</span>
            <span className="text-cyan-300">{Math.round(Math.random() * 1000 + 5000)}/s</span>
          </div>
        </div>
      </div>

      <Canvas
        camera={{ position: [0, 5, 10], fov: 50 }}
        shadows
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true
        }}
        dpr={[1, 2]}
      >
        {/* Enhanced Lighting Setup */}
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 5, 0]} intensity={2} color="#00d4ff" castShadow />
        <pointLight position={[10, 5, 10]} intensity={1.5} color="#ff00ff" />
        <pointLight position={[-10, 5, -10]} intensity={1.5} color="#00ff88" />
        <spotLight
          position={[0, 10, 0]}
          angle={0.3}
          penumbra={1}
          intensity={2}
          castShadow
          color="#00d4ff"
        />

        {/* Fog for depth */}
        <fog attach="fog" args={['#000511', 5, 25]} />

        {/* Enhanced background */}
        <Stars 
          radius={150} 
          depth={80} 
          count={8000} 
          factor={6} 
          saturation={0.5} 
          fade 
          speed={2}
        />

        {/* Environment */}
        <Environment preset="night" />

        {/* Grid floor */}
        <GridFloor />

        {/* Background particles */}
        <BackgroundParticles />

        {/* Center energy core */}
        <CenterEnergyCore />

        {/* Enhanced server nodes */}
        {nodes.map(node => (
          <group key={node.nodeId}>
            <ServerNode3D
              node={node}
              position={nodePositions[node.nodeId]}
            />
            <NodeLabel
              position={nodePositions[node.nodeId]}
              text={node.name}
              status={node.status}
            />
          </group>
        ))}

        {/* Connection beams */}
        <ConnectionBeams nodes={nodes} positions={nodePositions} />

        {/* Data particles */}
        <DataParticles nodes={nodes} positions={nodePositions} />

        {/* Attack rings */}
        {nodes
          .filter(node => node.isUnderAttack)
          .map(node => (
            <AttackRings
              key={`attack-${node.nodeId}`}
              position={nodePositions[node.nodeId]}
              attackType={node.attackType}
            />
          ))}

        {/* Enhanced camera controls */}
        <OrbitControls
          enablePan={true}
          maxDistance={20}
          minDistance={5}
          autoRotate
          autoRotateSpeed={1}
          enableDamping
          dampingFactor={0.03}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Enhanced post-processing */}
        <EffectComposer multisampling={8}>
          <Bloom
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
            intensity={2}
            radius={1}
            levels={9}
            mipmapBlur
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.001, 0.001]}
          />
          <DepthOfField
            focusDistance={0.01}
            focalLength={0.05}
            bokehScale={3}
          />
        </EffectComposer>
      </Canvas>

      {/* Enhanced legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-4 text-xs font-mono z-10">
        <div className="text-cyan-400 font-bold mb-3 text-sm">🛡️ NODE STATUS</div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50 animate-pulse" />
            <span className="text-gray-300">Healthy</span>
            <span className="text-green-400 font-bold ml-auto">{nodes.filter(n => n.status === 'HEALTHY').length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50 animate-pulse" />
            <span className="text-gray-300">Warning</span>
            <span className="text-yellow-400 font-bold ml-auto">{nodes.filter(n => n.status === 'WARNING').length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse" />
            <span className="text-gray-300">Critical</span>
            <span className="text-red-400 font-bold ml-auto">{nodes.filter(n => n.status === 'CRITICAL').length}</span>
          </div>
        </div>
      </div>

      {/* Control hints */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-md border border-cyan-500/50 rounded-lg p-3 text-xs font-mono z-10">
        <div className="text-cyan-400 font-bold mb-2">🎮 CONTROLS</div>
        <div className="flex flex-col gap-1 text-gray-400">
          <div>🖱️ Drag: Rotate</div>
          <div>🔍 Scroll: Zoom</div>
          <div>⌨️ Right-click: Pan</div>
        </div>
      </div>
    </div>
  );
}
