import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

const TYPE_META = {
  INFO:         { color: 'var(--text-muted)',  dot: '#4a4a68', tag: 'INFO' },
  WARN:         { color: 'var(--amber)',        dot: 'var(--amber)', tag: 'WARN' },
  ALERT:        { color: 'var(--red)',          dot: 'var(--red)',   tag: 'ALERT' },
  AI_DECISION:  { color: 'var(--cyan)',         dot: 'var(--cyan)',  tag: 'AI' },
  AI:           { color: 'var(--cyan)',         dot: 'var(--cyan)',  tag: 'AI' },
  REROUTE:      { color: 'var(--violet)',       dot: 'var(--violet)',tag: 'ROUTE' },
  RESOLVE:      { color: 'var(--green)',        dot: 'var(--green)', tag: 'OK' },
  RECOVERY:     { color: 'var(--green)',        dot: 'var(--green)', tag: 'RECOV' },
  METRIC_SPIKE: { color: 'var(--amber)',        dot: 'var(--amber)', tag: 'SPIKE' },
  ACTION:       { color: 'var(--amber)',        dot: 'var(--amber)', tag: 'ACTION' },
  METRIC:       { color: 'var(--violet)',       dot: 'var(--violet)',tag: 'METRIC' },
};

function fmtTime(ts) {
  if (typeof ts === 'number') {
    return new Date(ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  return String(ts).slice(0, 8);
}

export default function EventLog({ events = [], maxHeight = '100%' }) {
  const containerRef = useRef(null);
  // Track whether user has scrolled away from the top (newest events are at top)
  const userScrolledRef = useRef(false);

  // When new events arrive: only snap to top if user hasn't manually scrolled down
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!userScrolledRef.current) {
      el.scrollTop = 0; // newest event is at top — snap there if not reading history
    }
  }, [events.length]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    // User is considered "scrolled away" if they are more than 40px from the top
    userScrolledRef.current = el.scrollTop > 40;
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      position: 'relative',
    }} className="nf-card-accent-cyan">

      {/* header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
        background: 'rgba(0,212,255,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* blinking record dot */}
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--red)',
            boxShadow: '0 0 5px var(--red)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--text-secondary)', textTransform: 'uppercase',
          }}>
            LIVE AGENT LOG
          </span>
        </div>
        <span style={{
          fontSize: '0.65rem', color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          background: 'var(--bg-elevated)',
          padding: '2px 7px', borderRadius: 4,
          border: '1px solid var(--border)',
        }}>
          {events.length}
        </span>
      </div>

      {/* log body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="thin-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 4px',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <AnimatePresence initial={false}>
          {events.slice(0, 120).map((ev, i) => {
            const m = TYPE_META[ev.type] || TYPE_META.INFO;
            const isFirst = i === 0;
            return (
              <motion.div
                key={ev.id || i}
                initial={{ opacity: 0, x: -8, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                  display: 'flex', gap: 8,
                  padding: '4px 10px',
                  borderRadius: 4,
                  background: isFirst ? 'rgba(255,255,255,0.025)' : 'transparent',
                  alignItems: 'flex-start',
                  borderLeft: isFirst ? `2px solid ${m.dot}` : '2px solid transparent',
                  transition: 'background 0.2s',
                  marginBottom: 1,
                }}
              >
                {/* timestamp */}
                <span style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.65rem',
                  flexShrink: 0,
                  paddingTop: 1,
                  minWidth: 60,
                  letterSpacing: '0.04em',
                }}>
                  {fmtTime(ev.timestamp)}
                </span>

                {/* type dot */}
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: m.dot,
                  flexShrink: 0,
                  marginTop: 4,
                }} />

                {/* tag */}
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: m.color,
                  minWidth: 38,
                  letterSpacing: '0.06em',
                  paddingTop: 1,
                  flexShrink: 0,
                }}>
                  {m.tag}
                </span>

                {/* message */}
                <span style={{
                  color: isFirst ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                  flex: 1,
                }}>
                  {ev.message}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {events.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-mono)',
          }}>
            — awaiting system events —
          </div>
        )}
      </div>
    </div>
  );
}
