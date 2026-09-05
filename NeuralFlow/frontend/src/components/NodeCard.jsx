import { useState } from 'react';
import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  healthy: {
    color: '#00ff88',
    glow: '0 0 20px rgba(0,255,136,0.4)',
    border: 'rgba(0,255,136,0.4)',
    emoji: '🟢',
    label: 'HEALTHY'
  },
  warning: {
    color: '#ffaa00',
    glow: '0 0 20px rgba(255,170,0,0.4)',
    border: 'rgba(255,170,0,0.5)',
    emoji: '🟡',
    label: 'WARNING'
  },
  critical: {
    color: '#ff3355',
    glow: '0 0 24px rgba(255,51,85,0.6)',
    border: 'rgba(255,51,85,0.6)',
    emoji: '🔴',
    label: 'CRITICAL'
  }
};

const healthColor = s =>
  s >= 80 ? '#00ff88' :
  s >= 60 ? '#ffaa00' :
  s >= 40 ? '#ff6b35' : '#ff3355';

// Enhanced Mini Gauge with gradient
function MiniGauge({ label, value, maxVal = 100, unit }) {
  const pct = Math.min(100, (value / maxVal) * 100);
  const barColor = pct > 75 ? '#ff3355' : pct > 50 ? '#ffaa00' : '#00d4ff';
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, marginBottom: 8 }}>
      <span style={{ 
        color: 'var(--text-muted)', 
        width: 60, 
        flexShrink: 0,
        fontFamily: 'var(--font-ui)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        {label}
      </span>
      <div style={{ 
        flex: 1, 
        background: 'var(--bg-surface)', 
        borderRadius: 6, 
        height: 6,
        overflow: 'hidden'
      }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ 
            height: '100%', 
            background: `linear-gradient(90deg, ${barColor}, ${barColor}dd)`,
            borderRadius: 6,
            boxShadow: `0 0 8px ${barColor}44`
          }} 
        />
      </div>
      <span style={{ 
        color: barColor, 
        width: 52, 
        textAlign: 'right', 
        fontWeight: 700,
        fontFamily: 'var(--font-data)',
        fontSize: '0.8rem'
      }}>
        {Math.round(value)}{unit}
      </span>
    </div>
  );
}

export default function NodeCard({ node, prediction }) {
  const [isHovered, setIsHovered] = useState(false);
  
  if (!node) return null;
  
  const statusConfig = STATUS_CONFIG[node.status] || STATUS_CONFIG.healthy;
  const hc = healthColor(node.healthScore);
  const latDisplay = node.latency > 1000
    ? `${(node.latency / 1000).toFixed(1)}s` : `${node.latency}ms`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      style={{
        padding: 18,
        borderRadius: 16,
        background: 'var(--bg-card)',
        border: `2px solid ${statusConfig.border}`,
        boxShadow: isHovered ? statusConfig.glow : '0 2px 8px rgba(0,0,0,0.4)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Glow */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.05 }}
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${statusConfig.color}, transparent)`,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Header: Name + Status Badge */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: 16,
        position: 'relative'
      }}>
        <div>
          <div style={{ 
            fontWeight: 800, 
            fontSize: '1.125rem',
            fontFamily: 'var(--font-ui)',
            marginBottom: 4
          }}>
            {statusConfig.emoji} {node.name}
          </div>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-ui)'
          }}>
            {node.location}
          </div>
        </div>
        
        <motion.div 
          animate={{ 
            scale: node.status === 'critical' ? [1, 1.05, 1] : 1 
          }}
          transition={{ 
            duration: 1.5, 
            repeat: node.status === 'critical' ? Infinity : 0 
          }}
          className="status-badge"
          style={{
            background: `${statusConfig.color}22`,
            color: statusConfig.color,
            border: `1px solid ${statusConfig.color}66`,
            padding: '4px 10px',
            borderRadius: 12,
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}
        >
          {statusConfig.label}
        </motion.div>
      </div>

      {/* Main Metrics: Health, Latency, Traffic */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 12,
        marginBottom: 18,
        padding: '12px 0',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="metric-value"
            style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: hc,
              fontFamily: 'var(--font-data)',
              textShadow: `0 0 10px ${hc}66`,
              lineHeight: 1
            }}
          >
            {node.healthScore}
          </motion.div>
          <div className="metric-label" style={{ marginTop: 6 }}>
            Health
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="metric-value"
            style={{ 
              fontSize: '2rem', 
              fontWeight: 800,
              color: node.latency > 300 ? '#ff3355' : '#00d4ff',
              fontFamily: 'var(--font-data)',
              textShadow: `0 0 10px ${node.latency > 300 ? '#ff3355' : '#00d4ff'}66`,
              lineHeight: 1
            }}
          >
            {latDisplay}
          </motion.div>
          <div className="metric-label" style={{ marginTop: 6 }}>
            Latency
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="metric-value"
            style={{ 
              fontSize: '2rem', 
              fontWeight: 800, 
              color: '#00d4ff',
              fontFamily: 'var(--font-data)',
              textShadow: '0 0 10px #00d4ff66',
              lineHeight: 1
            }}
          >
            {Math.round(node.traffic)}%
          </motion.div>
          <div className="metric-label" style={{ marginTop: 6 }}>
            Traffic
          </div>
        </div>
      </div>

      {/* Mini Gauges */}
      <div style={{ marginBottom: 8 }}>
        <MiniGauge label="Latency"  value={Math.min(node.latency, 1000)} maxVal={1000} unit="ms" />
        <MiniGauge label="CPU"      value={node.cpu}       unit="%" />
        <MiniGauge label="Memory"   value={node.memory}    unit="%" />
        <MiniGauge label="Errors"   value={node.errorRate} unit="%" />
        <MiniGauge label="Queue"    value={node.queue}     maxVal={500} unit="" />
      </div>

      {/* Prediction Warning */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 12,
            padding: '8px 12px',
            borderRadius: 10,
            fontSize: '0.75rem',
            textAlign: 'center',
            background: 'rgba(255,170,0,0.12)',
            color: '#ffaa00',
            border: '1px solid rgba(255,170,0,0.4)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          <span className="animate-pulse">⏳</span>
          <span>
            Breach predicted in {Math.floor(prediction / 60)}m {prediction % 60}s
          </span>
        </motion.div>
      )}

      {/* Hover Actions (show on hover) */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 12,
            display: 'flex',
            gap: 8
          }}
        >
          <button style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 600,
            background: 'rgba(0,212,255,0.15)',
            color: '#00d4ff',
            border: '1px solid rgba(0,212,255,0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            📊 Details
          </button>
          <button style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            fontSize: '0.75rem',
            fontWeight: 600,
            background: 'rgba(255,107,53,0.15)',
            color: '#ff6b35',
            border: '1px solid rgba(255,107,53,0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            🔄 Restart
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
