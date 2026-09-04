import { motion, AnimatePresence } from 'framer-motion';

export default function PlaybookDisplay({ playbook }) {
  if (!playbook) return null;

  const completedSteps = playbook.steps?.filter(s => s.status === 'done').length || 0;
  const totalSteps = playbook.steps?.length || 0;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        padding: 20,
        borderRadius: 16,
        background: 'var(--bg-card)',
        border: '2px solid rgba(0,212,255,0.4)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.span
            animate={{
              rotate: playbook.completed ? 0 : 360
            }}
            transition={{
              duration: 2,
              repeat: playbook.completed ? 0 : Infinity,
              ease: 'linear'
            }}
            style={{ fontSize: 24 }}
          >
            {playbook.completed ? '✅' : '⚙️'}
          </motion.span>
          <span style={{
            fontWeight: 800,
            fontSize: '1.05rem',
            color: 'var(--text-primary)'
          }}>
            {playbook.name}
          </span>
        </div>
        
        {playbook.completed && (
          <motion.span
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{
              fontSize: '0.75rem',
              padding: '4px 12px',
              borderRadius: 8,
              fontWeight: 700,
              background: 'rgba(0,255,136,0.15)',
              color: '#00ff88',
              border: '2px solid rgba(0,255,136,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Completed
          </motion.span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 600
          }}>
            Execution Progress
          </span>
          <motion.span
            key={progress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              color: progress === 100 ? '#00ff88' : '#00d4ff',
              fontFamily: 'var(--font-data)'
            }}
          >
            {completedSteps}/{totalSteps} Steps
          </motion.span>
        </div>
        <div style={{
          height: 10,
          background: 'var(--bg-surface)',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid var(--border)'
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: progress === 100
                ? 'linear-gradient(90deg, #00ff88, #00d4ff)'
                : 'linear-gradient(90deg, #00d4ff, #00ff88)',
              borderRadius: 6,
              boxShadow: progress === 100
                ? '0 0 10px rgba(0,255,136,0.6)'
                : '0 0 10px rgba(0,212,255,0.6)'
            }}
          />
        </div>
      </div>

      {/* Horizontal step list */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        gap: 0,
        paddingBottom: 8
      }}>
        <AnimatePresence mode="wait">
          {playbook.steps?.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0
              }}
            >
              {/* Step circle + label */}
              <div style={{ textAlign: 'center', maxWidth: 120, padding: '0 8px' }}>
                <motion.div
                  animate={{
                    scale: step.status === 'running' ? [1, 1.1, 1] : 1,
                    rotate: step.status === 'running' ? [0, 360] : 0
                  }}
                  transition={{
                    scale: {
                      duration: 1.5,
                      repeat: step.status === 'running' ? Infinity : 0,
                      ease: 'easeInOut'
                    },
                    rotate: {
                      duration: 2,
                      repeat: step.status === 'running' ? Infinity : 0,
                      ease: 'linear'
                    }
                  }}
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    margin: '0 auto 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    fontWeight: 800,
                    background:
                      step.status === 'done' ? 'rgba(0,255,136,0.15)' :
                      step.status === 'running' ? 'rgba(0,212,255,0.15)' :
                      'var(--bg-surface)',
                    border: `3px solid ${
                      step.status === 'done' ? '#00ff88' :
                      step.status === 'running' ? '#00d4ff' :
                      'var(--border)'
                    }`,
                    boxShadow:
                      step.status === 'done' ? '0 0 15px rgba(0,255,136,0.4)' :
                      step.status === 'running' ? '0 0 15px rgba(0,212,255,0.4)' :
                      'none',
                    transition: 'all 0.4s',
                    color:
                      step.status === 'done' ? '#00ff88' :
                      step.status === 'running' ? '#00d4ff' :
                      'var(--text-muted)'
                  }}
                >
                  {step.status === 'done' ? '✓' :
                   step.status === 'running' ? '⟳' :
                   step.id}
                </motion.div>
                
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 + 0.2 }}
                  style={{
                    fontSize: '0.75rem',
                    lineHeight: 1.4,
                    fontWeight: 600,
                    color:
                      step.status === 'done' ? '#00ff88' :
                      step.status === 'running' ? 'var(--text-primary)' :
                      'var(--text-muted)',
                    transition: 'color 0.3s'
                  }}
                >
                  {step.action}
                </motion.div>
                
                {/* Status badge */}
                {step.status !== 'queued' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{
                      marginTop: 6,
                      fontSize: '0.65rem',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background:
                        step.status === 'done' ? 'rgba(0,255,136,0.1)' :
                        'rgba(0,212,255,0.1)',
                      color:
                        step.status === 'done' ? '#00ff88' : '#00d4ff',
                      border:
                        step.status === 'done' ? '1px solid rgba(0,255,136,0.3)' :
                        '1px solid rgba(0,212,255,0.3)'
                    }}
                  >
                    {step.status}
                  </motion.div>
                )}
              </div>

              {/* Connector line with animation */}
              {i < playbook.steps.length - 1 && (
                <div style={{
                  width: 40,
                  height: 3,
                  flexShrink: 0,
                  marginBottom: 32,
                  background: 'var(--bg-surface)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: step.status === 'done' ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.5 }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
                      borderRadius: 2,
                      boxShadow: '0 0 8px rgba(0,255,136,0.5)'
                    }}
                  />
                  
                  {/* Flowing particle effect for running step */}
                  {step.status === 'running' && (
                    <motion.div
                      animate={{
                        x: [-20, 60]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'linear'
                      }}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 20,
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
                        borderRadius: 2
                      }}
                    />
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Execution time footer */}
      {playbook.executionTime && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem'
          }}
        >
          <span style={{ color: 'var(--text-muted)' }}>
            Total Execution Time
          </span>
          <span style={{
            fontWeight: 800,
            color: '#00ff88',
            fontFamily: 'var(--font-data)',
            fontSize: '0.9rem'
          }}>
            {playbook.executionTime}ms
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
