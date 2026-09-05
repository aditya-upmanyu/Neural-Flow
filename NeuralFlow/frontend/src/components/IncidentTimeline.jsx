import { motion } from 'framer-motion';

const STATES = [
  { key: 'NORMAL',         label: 'NORMAL',    icon: '◉', color: 'var(--text-muted)' },
  { key: 'DETECTED',       label: 'DETECTED',  icon: '⚠', color: 'var(--amber)' },
  { key: 'PREDICTED',      label: 'PREDICTED', icon: '◈', color: 'var(--amber)' },
  { key: 'REROUTING',      label: 'REROUTING', icon: '↗', color: 'var(--cyan)' },
  { key: 'ACTION_PENDING', label: 'AWAITING',  icon: '⏳', color: 'var(--red)' },
  { key: 'VERIFYING',      label: 'VERIFYING', icon: '◎', color: 'var(--violet)' },
  { key: 'COOLDOWN',       label: 'COOLDOWN',  icon: '◌', color: 'var(--cyan)' },
];

// Map real incident state to display index
function getActiveIdx(state) {
  const map = {
    NORMAL: 0, DETECTED: 1, PREDICTED: 2, REROUTING: 3,
    ACTION_PENDING: 4, VERIFYING: 5, RESOLVED: 5, COOLDOWN: 6,
  };
  return map[state] ?? 0;
}

export default function IncidentTimeline({ incident }) {
  const state = incident?.state || 'NORMAL';
  const activeIdx = getActiveIdx(state);
  const isNormal = state === 'NORMAL';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
          color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>
          INCIDENT LIFECYCLE
        </span>
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
          color: isNormal ? 'var(--green)' : STATES[activeIdx]?.color || 'var(--amber)',
          background: isNormal ? 'var(--green-dim)' : 'rgba(255,255,255,0.05)',
          padding: '2px 8px', borderRadius: 4,
          border: `1px solid ${isNormal ? 'rgba(0,232,122,0.2)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          {state.replace('_', ' ')}
        </span>
      </div>

      {/* timeline track */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* background track */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: 1, background: 'var(--border)',
          transform: 'translateY(-50%)',
        }} />
        {/* progress fill */}
        <motion.div
          animate={{ width: activeIdx === 0 ? '0%' : `${(activeIdx / (STATES.length - 1)) * 100}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: '50%', left: 0,
            height: 1,
            background: STATES[activeIdx]?.color || 'var(--cyan)',
            transform: 'translateY(-50%)',
            boxShadow: `0 0 6px ${STATES[activeIdx]?.color || 'var(--cyan)'}`,
          }}
        />

        {/* step nodes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
          {STATES.map((s, idx) => {
            const isPast   = idx < activeIdx;
            const isCurrent = idx === activeIdx;
            const isFuture = idx > activeIdx;
            const color = s.color;

            return (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                {/* node circle */}
                <motion.div
                  animate={isCurrent ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 1.5, repeat: isCurrent ? Infinity : 0, ease: 'easeInOut' }}
                  style={{
                    width: isCurrent ? 22 : 16,
                    height: isCurrent ? 22 : 16,
                    borderRadius: '50%',
                    background: isFuture
                      ? 'var(--bg-elevated)'
                      : isCurrent
                        ? color
                        : 'rgba(255,255,255,0.15)',
                    border: isCurrent
                      ? `2px solid ${color}`
                      : isPast
                        ? `1px solid rgba(255,255,255,0.2)`
                        : `1px solid var(--border)`,
                    boxShadow: isCurrent ? `0 0 12px ${color}` : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isCurrent ? '0.6rem' : '0.5rem',
                    color: isFuture ? 'var(--text-muted)' : isCurrent ? '#020204' : 'var(--text-secondary)',
                    zIndex: 1, position: 'relative',
                    transition: 'all 0.4s',
                  }}
                >
                  {isCurrent ? s.icon : isPast ? '✓' : ''}
                </motion.div>

                {/* label */}
                <span style={{
                  fontSize: '0.52rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? color : isFuture ? 'var(--text-dim)' : 'var(--text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  transition: 'color 0.4s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 56,
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
