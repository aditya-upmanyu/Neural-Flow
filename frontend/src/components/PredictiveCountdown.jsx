import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function PredictiveCountdown({ predictions, nodes, incidentNodeId }) {
  const entries = Object.entries(predictions || {})
    .map(([nodeId, seconds]) => {
      const node = nodes.find(n => n.id === parseInt(nodeId) || n.nodeId === parseInt(nodeId));
      return node ? { nodeId: parseInt(nodeId), seconds, node } : null;
    })
    .filter(Boolean)
    .filter(p => p.seconds !== null && p.seconds > 0)
    .sort((a, b) => a.seconds - b.seconds);

  if (entries.length === 0) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        minHeight: 120,
      }}>
        <div style={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
          color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10,
        }}>
          PREDICTIVE RISK ENGINE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--green)',
            boxShadow: '0 0 8px var(--green)',
            animation: 'pulse-slow 3s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--green)' }}>
            ALL NODES NOMINAL
          </span>
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
          No breach predicted · Monitoring active
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(245,166,35,0.2)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 14px',
      height: '100%',
    }} className="nf-card-accent-red">
      <div style={{
        fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
        color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10,
      }}>
        PREDICTIVE RISK ENGINE
      </div>

      <AnimatePresence>
        {entries.map((e, i) => (
          <PredCard key={`${incidentNodeId ?? 0}-${e.nodeId}`} entry={e} index={i} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function PredCard({ entry, index }) {
  const { node, seconds: initial } = entry;
  const [countdown, setCountdown] = useState(initial);

  // Reset countdown whenever initial changes OR when it's a new prediction
  // (same node could have a new breach prediction in Run 2)
  useEffect(() => {
    setCountdown(initial);
    const iv = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(iv); // cleanup always fires — no stale intervals
  }, [initial]);

  const pct = Math.max(0, Math.min(100, (countdown / initial) * 100));
  const urgency = countdown <= 5 ? 'critical' : countdown <= 15 ? 'high' : 'medium';
  const color = urgency === 'critical' ? 'var(--red)' : urgency === 'high' ? 'var(--amber)' : 'var(--amber)';

  // latency slope text
  const slope = node.latencyTrend ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${urgency === 'critical' ? 'rgba(255,51,85,0.3)' : 'rgba(245,166,35,0.2)'}`,
        borderRadius: 8, padding: '10px 12px', marginBottom: 8,
      }}
    >
      {/* top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
            {node.name}
          </div>
          <div style={{ display: 'flex', gap: 10, fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span>CURRENT <span style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{node.latency}ms</span></span>
            <span>THRESH <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>300ms</span></span>
            {slope !== null && (
              <span>SLOPE <span style={{ color: slope > 0 ? 'var(--red)' : 'var(--green)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {slope > 0 ? '+' : ''}{slope.toFixed(1)}ms/s
              </span></span>
            )}
          </div>
        </div>
        {/* countdown ring */}
        <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
          <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="22" cy="22" r="18" fill="none" stroke="var(--bg-card)" strokeWidth="4" />
            <motion.circle
              cx="22" cy="22" r="18" fill="none"
              stroke={color} strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={113.1}
              animate={{ strokeDashoffset: 113.1 * (1 - pct / 100) }}
              transition={{ duration: 0.8 }}
              style={{ filter: `drop-shadow(0 0 4px ${color})` }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: '0.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
              color, lineHeight: 1,
            }}>{countdown}</span>
            <span style={{ fontSize: '0.5rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SEC</span>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
          style={{ height: '100%', background: color, borderRadius: 1 }}
        />
      </div>

      {/* bottom tag */}
      <div style={{
        marginTop: 6, fontSize: '0.62rem', fontWeight: 700,
        color: urgency === 'critical' ? 'var(--red)' : 'var(--amber)',
        letterSpacing: '0.08em',
      }}>
        {urgency === 'critical' ? '🔴 BREACH IMMINENT — AI INTERVENTION READY'
          : urgency === 'high'    ? '⚠ HIGH RISK — MONITORING CLOSELY'
          :                         '◈ ELEVATED — PREDICTIVE WATCH ACTIVE'}
      </div>
    </motion.div>
  );
}
