import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import useStore from '../store/useStore';

const NAV_GROUPS = [
  {
    category: 'COMMAND CENTER',
    items: [
      { id: 'dashboard', path: '/', icon: '▣', label: 'Dashboard', sub: 'Overview' },
    ]
  },
  {
    category: 'OPERATIONS',
    items: [
      { id: 'monitoring', path: '/monitoring', icon: '◈', label: 'Live Monitor', sub: 'Telemetry & nodes' },
      { id: 'bharatbazaar', path: '/bharatbazaar', icon: '🌐', label: 'BharatBazaar', sub: 'E-commerce gateway' },
    ]
  },
  {
    category: 'INTELLIGENCE',
    items: [
      { id: 'ai-insights', path: '/ai-insights', icon: '🧠', label: 'AI Insights', sub: 'Model & decisions' },
      { id: 'comparison', path: '/comparison', icon: '⇄', label: 'AI vs Human', sub: 'Baseline comparison' },
    ]
  },
  {
    category: 'EVIDENCE',
    items: [
      { id: 'reports', path: '/reports', icon: '≡', label: 'Reports', sub: 'Incident receipts' },
    ]
  },
  {
    category: 'SYSTEM',
    items: [
      { id: 'settings', path: '/settings', icon: '◎', label: 'Settings', sub: 'Policy & config' },
    ]
  }
];

export default function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const wsConnected = useStore(s => s.wsConnected);
  const nodes = useStore(s => s.nodes);
  const incident = useStore(s => s.incident);

  const critical = nodes.filter(n => (n.status || '').toLowerCase() === 'critical' || n.isUnderAttack).length;
  const systemOk = (incident.state === 'NORMAL' || incident.state === 'COOLDOWN' || incident.state === 'RESOLVED') && critical === 0;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              display: typeof window !== 'undefined' && window.innerWidth < 1024 ? 'block' : 'none'
            }}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        animate={{ x: isOpen ? 0 : -260 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="sidebar-scrollbar"
        style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, width: 240,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column',
          zIndex: 50, overflowY: 'auto',
          boxShadow: '4px 0 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* ── Brand ── */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {/* logo mark */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--cyan-dim)',
              border: '1px solid rgba(0,212,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="var(--cyan)" opacity="0.9"/>
                <circle cx="8" cy="8" r="6" stroke="var(--cyan)" strokeWidth="1" fill="none" opacity="0.4"/>
                <circle cx="8" cy="8" r="8" stroke="var(--cyan)" strokeWidth="0.5" fill="none" opacity="0.2"/>
                <line x1="2" y1="8" x2="6" y2="8" stroke="var(--cyan)" strokeWidth="1" opacity="0.6"/>
                <line x1="10" y1="8" x2="14" y2="8" stroke="var(--cyan)" strokeWidth="1" opacity="0.6"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="var(--cyan)" strokeWidth="1" opacity="0.6"/>
                <line x1="8" y1="10" x2="8" y2="14" stroke="var(--cyan)" strokeWidth="1" opacity="0.6"/>
              </svg>
            </div>
            <div>
              <div style={{
                fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em',
                color: 'var(--text-primary)', fontFamily: 'var(--font-ui)',
              }}>
                NEURALFLOW
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.12em', fontWeight: 600 }}>
                V5.0 · AUTONOMOUS RESILIENCE
              </div>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {NAV_GROUPS.map((group) => (
            <div key={group.category} style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: '0.58rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                padding: '4px 10px 6px',
                textTransform: 'uppercase',
              }}>
                {group.category}
              </div>
              {group.items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <NavLink key={item.id} to={item.path} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
                    <motion.div
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8, position: 'relative',
                        background: active ? 'rgba(0,212,255,0.08)' : 'transparent',
                        border: active ? '1px solid rgba(0,212,255,0.18)' : '1px solid transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }}
                      onMouseLeave={e => {
                        if (!active) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      {/* active indicator bar */}
                      {active && (
                        <div style={{
                          position: 'absolute', left: 0, top: '20%', bottom: '20%',
                          width: 2, borderRadius: 2,
                          background: 'var(--cyan)',
                          boxShadow: '0 0 8px var(--cyan)',
                        }} />
                      )}

                      {/* icon */}
                      <div style={{
                        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: active ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.04)',
                        color: active ? 'var(--cyan)' : 'var(--text-muted)',
                        fontSize: '0.8rem',
                        transition: 'all 0.15s',
                      }}>
                        {item.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.8rem', fontWeight: active ? 700 : 500,
                          color: active ? 'var(--cyan)' : 'var(--text-primary)',
                          transition: 'color 0.15s',
                        }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 0.5 }}>
                          {item.sub}
                        </div>
                      </div>
                    </motion.div>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── System Status ── */}
        <div style={{
          padding: '14px 16px 20px',
          borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {/* WS connection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              background: wsConnected ? 'var(--green)' : 'var(--red)',
              boxShadow: wsConnected ? '0 0 6px var(--green)' : '0 0 6px var(--red)',
              animation: wsConnected ? 'pulse-slow 3s ease-in-out infinite' : 'none',
            }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              {wsConnected ? 'BACKEND CONNECTED' : 'CONNECTING...'}
            </span>
          </div>

          {/* system state pill */}
          <div style={{
            padding: '8px 12px', borderRadius: 8,
            background: systemOk ? 'rgba(0,232,122,0.06)' : 'rgba(255,51,85,0.06)',
            border: `1px solid ${systemOk ? 'rgba(0,232,122,0.15)' : 'rgba(255,51,85,0.15)'}`,
          }}>
            <div style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
              color: systemOk ? 'var(--green)' : 'var(--red)',
              marginBottom: 2,
            }}>
              {systemOk ? '● ALL SYSTEMS NOMINAL' : `● ${critical} NODE${critical !== 1 ? 'S' : ''} CRITICAL`}
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
              {nodes.length} nodes monitored
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          left: isOpen ? 252 : 12,
          top: 14,
          zIndex: 51,
          width: 36, height: 36, borderRadius: 8,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-light)',
          color: 'var(--text-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          transition: 'left 0.3s ease',
        }}
      >
        {isOpen ? '✕' : '☰'}
      </motion.button>
    </>
  );
}
