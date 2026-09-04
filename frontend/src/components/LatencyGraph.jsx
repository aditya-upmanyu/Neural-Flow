import { useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';
import {
  LineChart, Line as RechartLine, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, Legend, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

const NODE_COLORS = { 1: '#00d4ff', 2: '#00ff88', 3: '#ff6b35' };

// 3D Line Path Component
function LatencyPath3D({ nodeId, history, color, maxLatency }) {
  const pathRef = useRef();
  
  const points = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    return history.map((point, i) => {
      const x = (i / Math.max(history.length - 1, 1)) * 8 - 4; // Spread across -4 to 4
      const y = (point.value / maxLatency) * 3; // Height based on latency
      const z = (nodeId - 2) * 2; // Separate nodes in Z axis
      return new THREE.Vector3(x, y, z);
    });
  }, [history, nodeId, maxLatency]);

  useFrame(() => {
    if (pathRef.current && points.length > 1) {
      // Subtle wave animation
      const time = Date.now() * 0.001;
      pathRef.current.position.y = Math.sin(time + nodeId) * 0.05;
    }
  });

  if (points.length < 2) return null;

  return (
    <group ref={pathRef}>
      <Line
        points={points}
        color={color}
        lineWidth={3}
        transparent
        opacity={0.8}
      />
      
      {/* Endpoint sphere */}
      <mesh position={[points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      
      {/* Label */}
      <Text
        position={[4.5, points[points.length - 1].y, points[points.length - 1].z]}
        fontSize={0.3}
        color={color}
        anchorX="left"
        anchorY="middle"
      >
        Node {nodeId}
      </Text>
    </group>
  );
}

// Threshold plane
function ThresholdPlane({ threshold, maxLatency }) {
  const y = (threshold / maxLatency) * 3;
  
  return (
    <mesh position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[8, 6]} />
      <meshBasicMaterial
        color="#ffcc00"
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Animated grid floor
function AnimatedGrid() {
  const gridRef = useRef();
  
  useFrame((state) => {
    if (gridRef.current) {
      gridRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1 - 0.5;
    }
  });
  
  return (
    <group ref={gridRef}>
      <gridHelper args={[10, 20, '#1a1a2e', '#0a0a14']} />
    </group>
  );
}

// 3D Scene
function LatencyScene3D({ nodes }) {
  const maxLatency = useMemo(() => {
    const allLatencies = nodes.flatMap(n => 
      (n.latencyHistory || []).map(h => h.value)
    );
    return Math.max(...allLatencies, 1000);
  }, [nodes]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#00d4ff" />
      <pointLight position={[-5, 5, -5]} intensity={0.4} color="#ff6b35" />
      
      <AnimatedGrid />
      <ThresholdPlane threshold={300} maxLatency={maxLatency} />
      
      {nodes.map(node => (
        <LatencyPath3D
          key={node.id}
          nodeId={node.id}
          history={node.latencyHistory}
          color={NODE_COLORS[node.id]}
          maxLatency={maxLatency}
        />
      ))}
      
      {/* Axis labels */}
      <Text position={[-5, 0, 0]} fontSize={0.3} color="#555577">
        Time →
      </Text>
      <Text position={[0, 2, -3]} fontSize={0.3} color="#555577" rotation={[0, 0, Math.PI / 2]}>
        Latency (ms)
      </Text>
      
      <OrbitControls
        enablePan={false}
        minDistance={8}
        maxDistance={20}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

export default function LatencyGraph({ nodes }) {
  const [view3D, setView3D] = useState(false);
  
  const data = useMemo(() => {
    const maxLen = Math.max(...nodes.map(n => n.latencyHistory?.length || 0), 1);
    return Array.from({ length: maxLen }, (_, i) => {
      const pt = { tick: i };
      nodes.forEach(n => {
        const h   = n.latencyHistory || [];
        const idx = h.length - maxLen + i;
        if (idx >= 0 && h[idx]) pt[`n${n.id}`] = Math.min(h[idx].value, 3000);
      });
      return pt;
    });
  }, [nodes]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '8px 12px', fontSize: 12
      }}>
        {payload.map(p => (
          <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
            Node {p.dataKey.replace('n', '')}: {p.value > 1000
              ? `${(p.value / 1000).toFixed(2)}s` : `${p.value}ms`}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 20,
        borderRadius: 16,
        background: 'var(--bg-card)',
        border: '2px solid rgba(0,212,255,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <div>
          <div style={{
            fontWeight: 800,
            fontSize: '1.05rem',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <span style={{ fontSize: 24 }}>📊</span>
            <span>REAL-TIME LATENCY MONITOR</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Pinging: httpbin.org · jsonplaceholder.typicode.com · sampleapis.com
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setView3D(!view3D)}
          style={{
            padding: '8px 16px',
            borderRadius: 10,
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: view3D ? 'rgba(0,255,136,0.15)' : 'rgba(0,212,255,0.15)',
            color: view3D ? '#00ff88' : '#00d4ff',
            border: `2px solid ${view3D ? 'rgba(0,255,136,0.3)' : 'rgba(0,212,255,0.3)'}`,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span>{view3D ? '🎲' : '📈'}</span>
          <span>{view3D ? '3D View' : '2D Chart'}</span>
        </motion.button>
      </div>

      {view3D ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            width: '100%',
            height: 300,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--border)',
            background: 'var(--bg-surface)'
          }}
        >
          <Canvas camera={{ position: [8, 4, 8], fov: 50 }}>
            <LatencyScene3D nodes={nodes} />
          </Canvas>
          
          {/* 3D Controls hint */}
          <div style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            background: 'rgba(10,10,20,0.8)',
            backdropFilter: 'blur(10px)',
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)'
          }}>
            🖱️ Drag to rotate · Scroll to zoom
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ right: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis
                dataKey="tick"
                tick={{ fill: '#555577', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: '#555577', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => v >= 1000 ? `${v / 1000}s` : `${v}ms`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={300}
                stroke="rgba(255,204,0,0.5)"
                strokeDasharray="5 5"
                label={{
                  value: 'Threshold 300ms',
                  fill: '#ffcc00',
                  fontSize: 10,
                  position: 'insideRight'
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }}
                formatter={v => `Node ${v.replace('n', '')}`}
              />
              {nodes.map(n => (
                <RechartLine
                  key={n.id}
                  type="monotone"
                  dataKey={`n${n.id}`}
                  stroke={NODE_COLORS[n.id]}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Legend for current values */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-around',
          gap: 12
        }}
      >
        {nodes.map(node => (
          <div
            key={node.id}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              background: 'var(--bg-surface)',
              border: `1px solid ${NODE_COLORS[node.id]}40`,
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginBottom: 4
            }}>
              Node {node.id}
            </div>
            <div style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              color: NODE_COLORS[node.id],
              fontFamily: 'var(--font-data)'
            }}>
              {node.latency}ms
            </div>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
