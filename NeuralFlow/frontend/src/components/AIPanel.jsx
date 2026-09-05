import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIPanel({ mode, lastDecision, activePlaybook, nodes, onViewDecision }) {
  const [status, setStatus] = useState('monitoring');
  const [confidenceCount, setConfidenceCount] = useState(0);

  useEffect(() => {
    if (activePlaybook && !activePlaybook.completed) setStatus('acting');
    else if (lastDecision && !activePlaybook)        setStatus('resolved');
    else                                             setStatus('monitoring');
  }, [activePlaybook, lastDecision]);

  // Animate confidence counting up
  useEffect(() => {
    if (lastDecision && status === 'resolved') {
      setConfidenceCount(0);
      const target = lastDecision.confidence;
      const duration = 1500;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setConfidenceCount(target);
          clearInterval(timer);
        } else {
          setConfidenceCount(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [lastDecision, status]);

  const isActive = mode === 'ai';
  const healthyCount = nodes.filter(n => n.status === 'healthy').length;

  const card = {
    padding: 20,
    borderRadius: 16,
    height: '100%',
    background: 'var(--bg-card)',
    border: `2px solid ${isActive ? 'var(--neon-blue)' : 'var(--border)'}`,
    boxShadow: isActive ? '0 0 24px rgba(0,212,255,0.3)' : '0 2px 8px rgba(0,0,0,0.4)',
    transition: 'all 0.3s',
    position: 'relative',
    overflow: 'hidden'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={card}
    >
      {/* Animated Background for Active State */}
      {isActive && (
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 80% 20%, rgba(0,212,255,0.05), transparent)',
              'radial-gradient(circle at 20% 80%, rgba(0,212,255,0.05), transparent)',
              'radial-gradient(circle at 80% 20%, rgba(0,212,255,0.05), transparent)'
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

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🤖</span>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: '0.95rem',
              color: 'var(--neon-blue)',
              fontFamily: 'var(--font-ui)',
              letterSpacing: '0.05em'
            }}>
              AI MODE
            </div>
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: 2
            }}>
              NeuralFlow Agent
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          borderRadius: 12,
          background: isActive ? 'rgba(0,212,255,0.12)' : 'rgba(122,122,138,0.12)',
          border: `1px solid ${isActive ? 'rgba(0,212,255,0.3)' : 'rgba(122,122,138,0.3)'}`
        }}>
          <motion.div
            animate={{
              scale: isActive ? [1, 1.2, 1] : 1,
              opacity: isActive ? [1, 0.6, 1] : 0.5
            }}
            transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: isActive ? '#00d4ff' : '#7a7a8a',
              boxShadow: isActive ? '0 0 12px #00d4ff' : 'none'
            }}
          />
          <span style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            color: isActive ? '#00d4ff' : '#7a7a8a',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {isActive ? 'ACTIVE' : 'STANDBY'}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Monitoring State */}
        {status === 'monitoring' && (
          <motion.div
            key="monitoring"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: '20px 0' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ fontSize: 48, marginBottom: 12 }}
              >
                🔍
              </motion.div>
              <div style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#00d4ff',
                marginBottom: 8
              }}>
                Continuously Monitoring
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5
              }}>
                Analyzing system patterns every 2 seconds
              </div>
            </div>

            {/* System Status */}
            <div style={{
              padding: 16,
              borderRadius: 12,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              marginBottom: 16
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  System Status
                </span>
                <span style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: '#00ff88',
                  fontFamily: 'var(--font-data)'
                }}>
                  {healthyCount}/{nodes.length} Healthy
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                gap: 4,
                height: 6,
                borderRadius: 3,
                overflow: 'hidden',
                background: 'var(--bg-surface)'
              }}>
                {nodes.map((node, i) => (
                  <motion.div
                    key={node.id}
                    initial={{ width: 0 }}
                    animate={{ width: `${100 / nodes.length}%` }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      background: node.status === 'healthy' ? '#00ff88' :
                                 node.status === 'warning' ? '#ffaa00' : '#ff3355',
                      borderRadius: 2
                    }}
                  />
                ))}
              </div>
            </div>

            {!isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  fontSize: '0.8rem',
                  textAlign: 'center',
                  background: 'rgba(255,170,0,0.12)',
                  color: '#ffaa00',
                  border: '1px solid rgba(255,170,0,0.3)',
                  lineHeight: 1.5
                }}
              >
                ⚡ Switch to AI MODE to enable<br />automatic response
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Acting State (Playbook Running) */}
        {status === 'acting' && activePlaybook && (
          <motion.div
            key="acting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Action Header */}
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              style={{
                padding: 14,
                borderRadius: 12,
                textAlign: 'center',
                marginBottom: 16,
                background: 'rgba(0,212,255,0.12)',
                border: '2px solid rgba(0,212,255,0.4)'
              }}
            >
              <div style={{
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#00d4ff',
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  ⚡
                </motion.span>
                AUTO-RESPONDING
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                Reaction time: &lt;300ms · Zero downtime
              </div>
            </motion.div>

            {/* Playbook Name */}
            <div style={{
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#00d4ff',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span>📋</span>
              <span>{activePlaybook.name}</span>
            </div>

            {/* Live Action Steps */}
            <div style={{ marginBottom: 12 }}>
              {activePlaybook.steps?.map((step, i) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: step.status === 'running' ? 'rgba(0,212,255,0.08)' :
                               step.status === 'done' ? 'rgba(0,255,136,0.08)' :
                               'transparent',
                    border: `1px solid ${
                      step.status === 'running' ? 'rgba(0,212,255,0.2)' :
                      step.status === 'done' ? 'rgba(0,255,136,0.2)' : 'transparent'
                    }`,
                    fontSize: '0.8rem'
                  }}
                >
                  <motion.span
                    animate={{
                      rotate: step.status === 'running' ? 360 : 0
                    }}
                    transition={{
                      duration: 1,
                      repeat: step.status === 'running' ? Infinity : 0,
                      ease: 'linear'
                    }}
                    style={{ fontSize: 18 }}
                  >
                    {step.status === 'done' ? '✅' :
                     step.status === 'running' ? '🔄' : '⏳'}
                  </motion.span>
                  <span style={{
                    flex: 1,
                    color: step.status === 'done' ? '#00ff88' :
                           step.status === 'running' ? '#00d4ff' : 'var(--text-muted)',
                    fontWeight: step.status === 'running' ? 600 : 400
                  }}>
                    {step.action}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Progress Indicator */}
            <div style={{
              padding: 12,
              borderRadius: 10,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Overall Progress
              </div>
              <div style={{
                width: '100%',
                height: 8,
                background: 'var(--bg-surface)',
                borderRadius: 4,
                overflow: 'hidden'
              }}>
                <motion.div
                  animate={{
                    width: `${(activePlaybook.steps?.filter(s => s.status === 'done').length / activePlaybook.steps?.length) * 100}%`
                  }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
                    borderRadius: 4
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Resolved State */}
        {status === 'resolved' && lastDecision && (
          <motion.div
            key="resolved"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Success Banner */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              style={{
                padding: 16,
                borderRadius: 12,
                textAlign: 'center',
                marginBottom: 16,
                background: 'rgba(0,255,136,0.12)',
                border: '2px solid rgba(0,255,136,0.4)'
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                style={{ fontSize: 40, marginBottom: 8 }}
              >
                ✅
              </motion.div>
              <div style={{
                fontWeight: 800,
                fontSize: '1rem',
                color: '#00ff88',
                marginBottom: 8
              }}>
                Auto-Resolved Successfully
              </div>
              
              {/* Reaction Time */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 6
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  Reaction Time:
                </span>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  style={{
                    fontSize: '1.3rem',
                    fontWeight: 800,
                    color: '#00ff88',
                    fontFamily: 'var(--font-data)',
                    textShadow: '0 0 10px rgba(0,255,136,0.5)'
                  }}
                >
                  {lastDecision.decisionTimeMs}ms
                </motion.span>
              </div>

              <div style={{
                fontSize: '0.8rem',
                color: '#00ff88',
                fontWeight: 700
              }}>
                ✓ Failed Requests: 0
              </div>
            </motion.div>

            {/* Action Details */}
            <div style={{
              padding: 14,
              borderRadius: 10,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              marginBottom: 14
            }}>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Action Taken
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--text-primary)',
                marginBottom: 8,
                lineHeight: 1.5
              }}>
                <span style={{ color: '#00d4ff' }}>→</span> Node {lastDecision.fromNodeId} → Node {lastDecision.toNodeId}
              </div>
              
              {/* Confidence Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  width: 70
                }}>
                  Confidence:
                </span>
                <div style={{
                  flex: 1,
                  height: 6,
                  background: 'var(--bg-surface)',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${confidenceCount}%` }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
                      borderRadius: 3
                    }}
                  />
                </div>
                <motion.span
                  style={{
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    color: '#00d4ff',
                    fontFamily: 'var(--font-data)',
                    minWidth: 45,
                    textAlign: 'right'
                  }}
                >
                  {confidenceCount}%
                </motion.span>
              </div>
            </div>

            {/* View Decision Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onViewDecision}
              style={{
                width: '100%',
                padding: 14,
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: '#00d4ff',
                background: 'rgba(0,212,255,0.12)',
                border: '2px solid rgba(0,212,255,0.3)',
                transition: 'all 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              🧠 View Full AI Decision Report
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
