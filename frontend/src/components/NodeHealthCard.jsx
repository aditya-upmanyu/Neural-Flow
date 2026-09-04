// NodeHealthCard.jsx - Canonical Reusable Node Health Card per Section 15 of final_version.md
import React from 'react';
import { motion } from 'framer-motion';

/* ─── SVG Circular Progress Ring ──────────────────────────────── */
function HealthRing({ value, color, size = 60, stroke = 4 }) {
  const r      = (size - stroke * 2) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      {/* Progress arc — rotated via transform on the SVG */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease', filter: `drop-shadow(0 0 4px ${color}88)` }}
      />
      {/* Center label */}
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fill: color,
          fontSize: '0.65rem',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        {value}%
      </text>
    </svg>
  );
}

/* ─── Single Metric Chip ───────────────────────────────────────── */
function StatChip({ label, value, valueColor }) {
  return (
    <div
      className="stat-chip"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        padding: '6px 8px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 7,
        minWidth: 0,
      }}
    >
      <span style={{
        fontSize: '0.55rem',
        fontWeight: 700,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '0.8rem',
        fontWeight: 800,
        fontFamily: 'var(--font-mono)',
        color: valueColor || 'var(--text-primary)',
        letterSpacing: '-0.01em',
        lineHeight: 1.1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Breathing dot for CRITICAL status ───────────────────────── */
function BreathingDot({ color }) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 8, height: 8 }}>
      <span style={{
        position: 'absolute',
        width: 8, height: 8,
        borderRadius: '50%',
        background: color,
        opacity: 0.3,
        animation: 'nhc-breathing-ring 1.4s ease-in-out infinite',
      }} />
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, position: 'relative' }} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NodeHealthCard
   ═══════════════════════════════════════════════════════════════ */
export default function NodeHealthCard({
  node,
  onViewDetails = null,
  isSelected = false,
  className = '',
}) {
  if (!node) return null;

  const id        = node.nodeId || node.id;
  const name      = node.name || `Node ${id}`;
  const status    = (node.status || (node.health > 70 ? 'HEALTHY' : node.health > 40 ? 'WARNING' : 'CRITICAL')).toUpperCase();

  const latency   = Math.round(node.latency    ?? node.metrics?.latency    ?? 20);
  const errorRate = Math.round((node.errorRate ?? node.metrics?.errorRate  ?? 0) * 10) / 10;
  const traffic   = Math.round(node.traffic    ?? node.requestsPerSecond   ?? node.trafficWeight ?? 33);
  const health    = Math.round(node.health     ?? node.healthScore          ?? 100);
  const cpu       = Math.round(node.cpu        ?? node.cpuUsage             ?? 20);

  const isCritical = status === 'CRITICAL' || node.isUnderAttack;
  const isWarning  = status === 'WARNING'  || (health <= 70 && !isCritical);
  const isHealthy  = !isCritical && !isWarning;

  const anomalyLevel = node.anomalyLevel
    ? String(node.anomalyLevel).toUpperCase()
    : isCritical ? 'HIGH' : isWarning ? 'MEDIUM' : 'LOW';

  /* ── Color tokens by status ─────────────────────────── */
  const statusColor  = isCritical ? 'var(--red)'   : isWarning ? 'var(--amber)' : 'var(--green)';
  const statusBg     = isCritical ? 'rgba(255,51,85,0.12)'   : isWarning ? 'rgba(245,158,11,0.12)' : 'rgba(0,232,122,0.10)';
  const statusBorder = isCritical ? 'rgba(255,51,85,0.35)'   : isWarning ? 'rgba(245,158,11,0.30)' : 'rgba(0,232,122,0.25)';

  /* ── Health-ring / bar color ────────────────────────── */
  const ringColor = health > 70 ? 'var(--green)' : health > 40 ? 'var(--amber)' : 'var(--red)';

  /* ── Card shell shadow ──────────────────────────────── */
  const cardShadow = isSelected
    ? '0 0 0 1px var(--cyan), 0 0 20px rgba(0,212,255,0.18)'
    : isCritical
    ? '0 0 24px rgba(255,51,85,0.14), var(--shadow-md)'
    : 'var(--shadow-sm)';

  const cardBorder = isSelected ? '1px solid var(--cyan)' : `1px solid ${statusBorder}`;

  return (
    <>
      {/* Scoped keyframes (injected once per render — lightweight) */}
      <style>{`
        @keyframes nhc-breathing-ring {
          0%, 100% { transform: scale(1);   opacity: 0.3; }
          50%       { transform: scale(2.4); opacity: 0;   }
        }
        @keyframes nhc-attack-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
      `}</style>

      <motion.div
        whileHover={{ y: -2, scale: 1.005 }}
        transition={{ duration: 0.15 }}
        className={['nf-card-premium', isCritical ? 'nf-card-glow-red' : '', className].filter(Boolean).join(' ')}
        style={{
          background: 'var(--bg-card)',
          border: cardBorder,
          borderRadius: 'var(--radius-lg)',
          boxShadow: cardShadow,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Under-attack pulsing top border ─────────── */}
        {node.isUnderAttack && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: 'var(--red)',
            animation: 'nhc-attack-pulse 0.9s ease-in-out infinite',
            zIndex: 10,
          }} />
        )}

        {/* ── Left border accent strip ─────────────────── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: 4,
          background: statusColor,
          opacity: isCritical ? 1 : 0.75,
          borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
        }} />

        {/* ── Inner content (left-padded past the strip) ─ */}
        <div style={{ padding: '14px 14px 14px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>

          {/* ── Header row ─────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            {/* Left: name + location */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: '0.92rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {name}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {node.location || 'Distributed Edge'}
              </div>
            </div>

            {/* Right: ID chip + status badge */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 }}>
              {/* Node ID monospace chip */}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border)',
                borderRadius: 4,
                padding: '2px 6px',
                letterSpacing: '0.06em',
              }}>
                N{id}
              </span>

              {/* Status badge with breathing dot for CRITICAL */}
              <div style={{
                padding: '3px 8px',
                borderRadius: 6,
                fontSize: '0.62rem',
                fontWeight: 800,
                background: statusBg,
                border: `1px solid ${statusBorder}`,
                color: statusColor,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                {isCritical
                  ? <BreathingDot color={statusColor} />
                  : <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor }} />
                }
                {status}
              </div>
            </div>
          </div>

          {/* ── Under Attack badge ───────────────────────── */}
          {node.isUnderAttack && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{
                fontSize: '0.58rem',
                fontWeight: 800,
                color: 'var(--red)',
                background: 'rgba(255,51,85,0.12)',
                border: '1px solid rgba(255,51,85,0.35)',
                borderRadius: 4,
                padding: '2px 7px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                animation: 'nhc-attack-pulse 1.1s ease-in-out infinite',
              }}>
                ⚠ UNDER ATTACK
              </span>
            </div>
          )}

          {/* ── Health ring + 2×3 metric chips ───────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* SVG ring */}
            <HealthRing value={health} color={ringColor} size={60} stroke={4} />

            {/* Metrics grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 5,
              flex: 1,
              minWidth: 0,
            }}>
              <StatChip
                label="Latency"
                value={`${latency}ms`}
                valueColor={latency > 120 ? 'var(--red)' : latency > 60 ? 'var(--amber)' : 'var(--cyan)'}
              />
              <StatChip
                label="Err Rate"
                value={`${errorRate}%`}
                valueColor={errorRate > 5 ? 'var(--red)' : errorRate > 2 ? 'var(--amber)' : 'var(--text-primary)'}
              />
              <StatChip
                label="Traffic"
                value={`${traffic} rps`}
                valueColor="var(--text-primary)"
              />
              <StatChip
                label="CPU"
                value={`${cpu}%`}
                valueColor={cpu > 75 ? 'var(--red)' : cpu > 55 ? 'var(--amber)' : 'var(--text-primary)'}
              />
              <StatChip
                label="Anomaly"
                value={anomalyLevel}
                valueColor={isCritical ? 'var(--red)' : isWarning ? 'var(--amber)' : 'var(--green)'}
              />
              <StatChip
                label="Health"
                value={`${health}%`}
                valueColor={ringColor}
              />
            </div>
          </div>

          {/* ── Full-width health bar ────────────────────── */}
          <div className="nf-bar" style={{ height: 4, marginTop: 2 }}>
            <div
              className="nf-bar-fill"
              style={{
                width: `${health}%`,
                background: ringColor,
                boxShadow: `0 0 6px ${ringColor === 'var(--green)' ? 'rgba(0,232,122,0.5)' : ringColor === 'var(--amber)' ? 'rgba(245,166,35,0.5)' : 'rgba(255,51,85,0.5)'}`,
                transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1), background 0.4s ease',
              }}
            />
          </div>

          {/* ── Action CTA ──────────────────────────────── */}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(node)}
              style={{
                width: '100%',
                padding: '6px 0',
                borderRadius: 6,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: '0.68rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.04em',
                transition: 'all 0.15s',
                marginTop: 2,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'var(--cyan-dim)';
                e.currentTarget.style.color        = 'var(--cyan)';
                e.currentTarget.style.borderColor  = 'var(--cyan)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'var(--bg-elevated)';
                e.currentTarget.style.color        = 'var(--text-secondary)';
                e.currentTarget.style.borderColor  = 'var(--border)';
              }}
            >
              VIEW DETAILS →
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
