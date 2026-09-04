// Traffic Flow Visualizer - Shows real-time traffic shifting between nodes
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function TrafficFlowVisualizer({ nodes }) {
  const [flowAnimations, setFlowAnimations] = useState([]);

  // Detect traffic shifts and create animations
  useEffect(() => {
    nodes.forEach((node, index) => {
      if (node.isUnderAttack) {
        // Show traffic flowing OUT of attacked node
        const otherNodes = nodes.filter(n => n.nodeId !== node.nodeId && !n.isUnderAttack);
        otherNodes.forEach(targetNode => {
          const flow = {
            from: node.nodeId,
            to: targetNode.nodeId,
            amount: 25, // percentage
            color: '#ef4444',
            timestamp: Date.now()
          };
          setFlowAnimations(prev => [...prev.slice(-5), flow]);
        });
      }
    });
  }, [nodes.map(n => n.isUnderAttack).join(',')]);

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 16,
      border: '1px solid var(--border-subtle)',
      padding: 24,
      marginBottom: 24
    }}>
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        🔄 Traffic Flow Visualization
      </h3>

      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        position: 'relative',
        minHeight: 200,
        padding: '20px 0'
      }}>
        {nodes.map((node, index) => (
          <NodeBubble
            key={node.nodeId}
            node={node}
            position={index}
            total={nodes.length}
          />
        ))}

        {/* Flow Arrows */}
        {nodes.map((fromNode, fromIndex) => {
          if (!fromNode.isUnderAttack) return null;
          
          return nodes
            .filter(toNode => toNode.nodeId !== fromNode.nodeId && !toNode.isUnderAttack)
            .map((toNode, toIndex) => (
              <FlowArrow
                key={`${fromNode.nodeId}-${toNode.nodeId}`}
                fromIndex={fromIndex}
                toIndex={nodes.findIndex(n => n.nodeId === toNode.nodeId)}
                total={nodes.length}
                trafficAmount={fromNode.traffic * 0.3}
              />
            ));
        })}
      </div>

      {/* Traffic Legend */}
      <div style={{
        display: 'flex',
        gap: 16,
        marginTop: 20,
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 8,
        fontSize: '0.85rem'
      }}>
        <LegendItem color="#10b981" label="Healthy" />
        <LegendItem color="#f59e0b" label="High Load" />
        <LegendItem color="#ef4444" label="Under Attack" />
        <div style={{ marginLeft: 'auto', color: 'var(--text-secondary)' }}>
          ⚡ Traffic shifts automatically during attacks
        </div>
      </div>
    </div>
  );
}

function NodeBubble({ node, position, total }) {
  const getColor = () => {
    if (node.isUnderAttack) return '#ef4444';
    if (node.health < 50) return '#f59e0b';
    return '#10b981';
  };

  const getSize = () => {
    // Size based on traffic load
    return 80 + (node.traffic * 0.8);
  };

  return (
    <motion.div
      animate={{
        scale: node.isUnderAttack ? [1, 1.1, 1] : 1,
        boxShadow: node.isUnderAttack 
          ? ['0 0 20px rgba(239,68,68,0.3)', '0 0 40px rgba(239,68,68,0.6)', '0 0 20px rgba(239,68,68,0.3)']
          : '0 4px 12px rgba(0,0,0,0.1)'
      }}
      transition={{
        duration: 1.5,
        repeat: node.isUnderAttack ? Infinity : 0
      }}
      style={{
        position: 'relative',
        width: getSize(),
        height: getSize(),
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${getColor()}, ${getColor()}dd)`,
        border: `3px solid ${getColor()}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 700,
        boxShadow: `0 0 20px ${getColor()}66`,
        zIndex: 10
      }}
    >
      <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>
        {node.name}
      </div>
      <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
        {node.traffic}% traffic
      </div>
      
      {/* Attack indicator */}
      {node.isUnderAttack && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            top: -5,
            right: -5,
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#ff0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            border: '2px solid white'
          }}
        >
          ⚠️
        </motion.div>
      )}

      {/* Traffic particles */}
      {node.traffic > 30 && (
        <motion.div
          animate={{ scale: [0, 1.5], opacity: [0.8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px solid ${getColor()}`,
            opacity: 0
          }}
        />
      )}
    </motion.div>
  );
}

function FlowArrow({ fromIndex, toIndex, total, trafficAmount }) {
  return (
    <motion.div
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: '50%',
        zIndex: 5,
        pointerEvents: 'none'
      }}
    >
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '200px',
          top: '-100px'
        }}
      >
        <defs>
          <marker
            id={`arrowhead-${fromIndex}-${toIndex}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill="#00ffd1"
            />
          </marker>
        </defs>
        
        {/* Animated flow line */}
        <motion.path
          d={`M ${(fromIndex / (total - 1)) * 100}% 100 Q 50% 20, ${(toIndex / (total - 1)) * 100}% 100`}
          stroke="#00ffd1"
          strokeWidth="3"
          fill="none"
          markerEnd={`url(#arrowhead-${fromIndex}-${toIndex})`}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Flow particles */}
        {[...Array(3)].map((_, i) => (
          <motion.circle
            key={i}
            r="4"
            fill="#00ffd1"
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.6,
              ease: 'linear'
            }}
            style={{
              offsetPath: `path("M ${(fromIndex / (total - 1)) * 100}% 100 Q 50% 20, ${(toIndex / (total - 1)) * 100}% 100")`,
              filter: 'drop-shadow(0 0 4px #00ffd1)'
            }}
          />
        ))}
      </svg>

      {/* Traffic amount label */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 12px',
          background: 'rgba(0,255,209,0.2)',
          border: '1px solid rgba(0,255,209,0.5)',
          borderRadius: 12,
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#00ffd1',
          whiteSpace: 'nowrap',
          zIndex: 20
        }}
      >
        ⚡ Shifting {trafficAmount.toFixed(0)}% traffic
      </motion.div>
    </motion.div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6
    }}>
      <div style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}66`
      }} />
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  );
}
