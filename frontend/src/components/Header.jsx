// Header.jsx - Clean, Context-Aware Global Header per Section 06 of final_version.md
import React from 'react';
import useStore from '../store/useStore';

export default function Header({
  title = 'Command Center',
  description = 'Autonomous resilience & risk orchestration platform',
  onOpenIncident = null,
  onReset = null,
}) {
  const wsConnected = useStore(s => s.wsConnected);
  const systemMode = useStore(s => s.systemMode || 'AI');
  const incident = useStore(s => s.incident || {});
  const nodes = useStore(s => s.nodes || []);
  const switchMode = useStore(s => s.switchMode);

  const isIncidentActive = Boolean(
    incident?.state &&
    incident.state !== 'NORMAL' &&
    incident.state !== 'IDLE' &&
    incident.state !== 'RECOVERED' &&
    incident.state !== 'RESOLVED' &&
    incident.state !== 'COOLDOWN'
  );

  const criticalCount = nodes.filter(n => (n.status || '').toUpperCase() === 'CRITICAL' || n.isUnderAttack).length;

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderRadius: 12, marginBottom: 16,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* ── LEFT: Title & Description ── */}
      <div>
        <h1 style={{
          fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)',
          letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {title}
        </h1>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0', fontWeight: 500 }}>
          {description}
        </p>
      </div>

      {/* ── RIGHT: System Status, Autonomy Mode & Contextual Action ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* WebSocket Connectivity Indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 600,
          background: wsConnected ? 'rgba(0,232,122,0.08)' : 'rgba(255,51,85,0.08)',
          border: `1px solid ${wsConnected ? 'rgba(0,232,122,0.2)' : 'rgba(255,51,85,0.2)'}`,
          color: wsConnected ? 'var(--green)' : 'var(--red)',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: wsConnected ? 'var(--green)' : 'var(--red)',
            boxShadow: wsConnected ? '0 0 6px var(--green)' : 'none',
          }} />
          {wsConnected ? 'TELEMETRY LIVE' : 'DISCONNECTED'}
        </div>

        {/* System Health State Badge */}
        {isIncidentActive || criticalCount > 0 ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
            background: 'rgba(255,51,85,0.12)', border: '1px solid rgba(255,51,85,0.3)',
            color: 'var(--red)', letterSpacing: '0.04em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)', animation: 'ping 1s infinite' }} />
            INCIDENT ACTIVE · {incident.state || 'ALERT'}
          </div>
        ) : (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
            background: 'rgba(0,232,122,0.08)', border: '1px solid rgba(0,232,122,0.2)',
            color: 'var(--green)', letterSpacing: '0.04em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            SYSTEM HEALTHY
          </div>
        )}

        {/* Autonomy Mode Switch */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'var(--bg-elevated)', borderRadius: 8, padding: 2,
          border: '1px solid var(--border-light)',
        }}>
          <button
            onClick={() => switchMode && switchMode('ai')}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: systemMode.toUpperCase() === 'AI' ? 'var(--cyan)' : 'transparent',
              color: systemMode.toUpperCase() === 'AI' ? '#020204' : 'var(--text-secondary)',
            }}
          >
            🤖 AUTONOMOUS
          </button>
          <button
            onClick={() => switchMode && switchMode('manual')}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
              border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: systemMode.toUpperCase() === 'MANUAL' ? 'var(--amber)' : 'transparent',
              color: systemMode.toUpperCase() === 'MANUAL' ? '#020204' : 'var(--text-secondary)',
            }}
          >
            👤 MANUAL
          </button>
        </div>

        {/* Reset Action */}
        {onReset && (
          <button
            onClick={onReset}
            title="Reset system state and telemetry baselines"
            style={{
              padding: '5px 10px', borderRadius: 6, fontSize: '0.7rem',
              background: 'transparent', border: '1px solid var(--border-light)',
              color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
          >
            ↺ Reset
          </button>
        )}
      </div>
    </header>
  );
}
