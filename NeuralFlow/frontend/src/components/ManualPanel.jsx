import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ManualPanel({ warningNode, nodes, mode, timer, timerActive, onShift, onTimerStop }) {
  const [shifting, setShifting] = useState(false);
  const [result, setResult] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  const healthyNodes = nodes.filter(n => n.id !== warningNode?.id && n.status === 'healthy');
  const isActive = mode === 'manual';
  const failedRequests = Math.floor(timer * 12);

  const handleShift = async () => {
    const targetNode = selectedNode || healthyNodes[0];
    if (!warningNode || !targetNode || shifting) return;
    
    setShifting(true);
    try {
      const data = await onShift(warningNode.id, targetNode.id);
      setResult({ delay: data.reactionTime || timer, failedRequests });
      setTimeout(() => setResult(null), 8000);
    } finally {
      setShifting(false);
    }
  };

  const card = {
    padding: 20,
    borderRadius: 16,
    height: '100%',
    background: 'var(--bg-card)',
    border: `2px solid ${isActive ? 'var(--neon-yellow)' : 'var(--border)'}`,
    boxShadow: isActive ? '0 0 24px rgba(255,170,0,0.3)' : '0 2px 8px rgba(0,0,0,0.4)',
    transition: 'all 0.3s',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={card}
    >
      {/* Animated Background Gradient for Active State */}
      {isActive && warningNode && (
        <motion.div
          animate={{ 
            background: [
              'radial-gradient(circle at 20% 20%, rgba(255,170,0,0.05), transparent)',
              'radial-gradient(circle at 80% 80%, rgba(255,170,0,0.05), transparent)',
              'radial-gradient(circle at 20% 20%, rgba(255,170,0,0.05), transparent)'
            ]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Title Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 20,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>👤</span>
          <div>
            <div style={{ 
              fontWeight: 800, 
              fontSize: '0.95rem', 
              color: 'var(--neon-yellow)',
              fontFamily: 'var(--font-ui)',
              letterSpacing: '0.05em'
            }}>
              MANUAL MODE
            </div>
            <div style={{ 
              fontSize: '0.7rem', 
              color: 'var(--text-muted)',
              marginTop: 2
            }}>
              Human Control
            </div>
          </div>
        </div>
        
        <motion.div
          animate={{ scale: isActive ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: isActive ? 'var(--neon-yellow)' : 'var(--text-dim)',
            boxShadow: isActive ? '0 0 12px var(--neon-yellow)' : 'none'
          }}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Idle State */}
        {!warningNode && !result && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '40px 20px' }}
          >
            <motion.div 
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ fontSize: 48, marginBottom: 12 }}
            >
              🟢
            </motion.div>
            <p style={{ 
              fontSize: '0.95rem', 
              color: 'var(--text-primary)',
              fontWeight: 600,
              marginBottom: 8
            }}>
              All Systems Healthy
            </p>
            <p style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}>
              Launch an attack to see manual<br />response time comparison
            </p>
          </motion.div>
        )}

        {/* Alert State */}
        {warningNode && !result && (
          <motion.div
            key="alert"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Critical Alert Box */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              style={{
                padding: 16,
                borderRadius: 12,
                marginBottom: 16,
                background: 'rgba(255,51,85,0.12)',
                border: '2px solid rgba(255,51,85,0.4)'
              }}
            >
              <div style={{ 
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 8
              }}>
                <motion.span
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                  style={{ fontSize: 24 }}
                >
                  ⚠️
                </motion.span>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 800, 
                    fontSize: '0.95rem', 
                    color: '#ff3355',
                    marginBottom: 6
                  }}>
                    ALERT: {warningNode.name} {warningNode.status.toUpperCase()}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4
                  }}>
                    Latency: <span style={{ color: '#ff3355', fontFamily: 'var(--font-data)', fontWeight: 700 }}>{warningNode.latency}ms</span> (threshold: 300ms)
                    <br />
                    CPU: <span style={{ color: '#ffaa00', fontFamily: 'var(--font-data)', fontWeight: 700 }}>{Math.round(warningNode.cpu)}%</span> · 
                    Health: <span style={{ color: '#ff6b35', fontFamily: 'var(--font-data)', fontWeight: 700 }}>{warningNode.healthScore}/100</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Human Response Timer */}
            {timerActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  textAlign: 'center',
                  padding: 16,
                  marginBottom: 16,
                  background: 'rgba(255,170,0,0.08)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,170,0,0.3)'
                }}
              >
                <div style={{ 
                  fontSize: '0.7rem', 
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  marginBottom: 8
                }}>
                  ⏱️ Human Reaction Time
                </div>
                
                <motion.div 
                  className="font-data"
                  style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 800, 
                    color: '#ffaa00',
                    textShadow: '0 0 20px rgba(255,170,0,0.5)',
                    lineHeight: 1,
                    marginBottom: 8
                  }}
                >
                  {timer.toFixed(1)}s
                </motion.div>
                
                {/* Progress Bar */}
                <div style={{
                  width: '100%',
                  height: 8,
                  background: 'var(--bg-surface)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  marginBottom: 10
                }}>
                  <motion.div
                    animate={{ width: `${Math.min((timer / 30) * 100, 100)}%` }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #ffaa00, #ff6b35)',
                      borderRadius: 4
                    }}
                  />
                </div>

                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#ff3355',
                  fontWeight: 700
                }}>
                  ❌ ~{failedRequests} requests failing right now
                </div>
              </motion.div>
            )}

            {/* Required Steps */}
            <div style={{
              padding: 14,
              borderRadius: 10,
              marginBottom: 16,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)'
            }}>
              <div style={{ 
                fontWeight: 700, 
                marginBottom: 10, 
                color: 'var(--text-primary)',
                fontSize: '0.85rem'
              }}>
                🎯 Required Actions:
              </div>
              <div style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.8rem',
                lineHeight: 1.8
              }}>
                <div>1. ✓ Read alert notification</div>
                <div>2. ✓ Verify node metrics</div>
                <div>3. → Select target node below</div>
                <div>4. → Execute traffic shift</div>
              </div>
            </div>

            {/* Node Selection */}
            {healthyNodes.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600
                }}>
                  Select Target Node:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {healthyNodes.map(node => (
                    <motion.button
                      key={node.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedNode(node)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 10,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: selectedNode?.id === node.id 
                          ? 'rgba(0,212,255,0.15)' 
                          : 'var(--bg-surface)',
                        color: selectedNode?.id === node.id 
                          ? '#00d4ff' 
                          : 'var(--text-secondary)',
                        border: `1px solid ${selectedNode?.id === node.id 
                          ? '#00d4ff' 
                          : 'var(--border)'}`,
                        transition: 'all 0.2s'
                      }}
                    >
                      <div>{node.name}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: 2 }}>
                        {node.healthScore}% health
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Large CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShift}
              disabled={shifting || healthyNodes.length === 0}
              style={{
                width: '100%',
                padding: 16,
                borderRadius: 12,
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: shifting ? 'wait' : 'pointer',
                background: shifting 
                  ? 'rgba(255,170,0,0.1)' 
                  : 'linear-gradient(135deg, rgba(255,170,0,0.2), rgba(255,107,53,0.2))',
                color: '#ffaa00',
                border: '2px solid #ffaa00',
                transition: 'all 0.2s',
                opacity: (shifting || healthyNodes.length === 0) ? 0.5 : 1,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: !shifting && healthyNodes.length > 0 
                  ? '0 4px 16px rgba(255,170,0,0.3)' 
                  : 'none'
              }}
            >
              {shifting ? (
                <span>⏳ SHIFTING TRAFFIC...</span>
              ) : (
                <span>
                  🔀 SHIFT TRAFFIC → {selectedNode?.name || healthyNodes[0]?.name || 'No Node Available'}
                </span>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Success State */}
        {result && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: 'center', padding: '30px 20px' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              style={{ fontSize: 64, marginBottom: 16 }}
            >
              ✅
            </motion.div>
            <div style={{ 
              fontWeight: 800, 
              color: '#00ff88', 
              marginBottom: 12,
              fontSize: '1.1rem'
            }}>
              Traffic Shifted Successfully
            </div>
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: 'rgba(255,170,0,0.08)',
              border: '1px solid rgba(255,170,0,0.3)',
              marginBottom: 12
            }}>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)',
                marginBottom: 6
              }}>
                Human Reaction Time:
              </div>
              <div style={{ 
                fontSize: '1.8rem', 
                fontWeight: 800,
                color: '#ffaa00',
                fontFamily: 'var(--font-data)',
                marginBottom: 8
              }}>
                {result.delay.toFixed(1)}s
              </div>
              <div style={{ 
                fontSize: '0.85rem', 
                color: '#ff3355',
                fontWeight: 700
              }}>
                ❌ {result.failedRequests} requests failed
              </div>
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)',
              fontStyle: 'italic'
            }}>
              Users experienced {result.delay.toFixed(1)} seconds of downtime
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
