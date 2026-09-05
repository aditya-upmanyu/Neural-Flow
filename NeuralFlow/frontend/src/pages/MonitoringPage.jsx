// MonitoringPage.jsx - Read-Only Operational Telemetry Monitor per Section 17 of final_version.md
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useStore from '../store/useStore';
import NodeHealthCard from '../components/NodeHealthCard';
import LatencyGraph from '../components/LatencyGraph';

export default function MonitoringPage() {
  const [selectedNode, setSelectedNode] = useState(null);

  const nodes = useStore(s => s.nodes || []);
  const events = useStore(s => s.events || []);
  const systemHealthScore = useStore(s => s.getSystemHealthScore ? s.getSystemHealthScore() : 95);
  const statusSummary = useStore(s => s.getStatusSummary ? s.getStatusSummary() : { healthy: 3, warning: 0, critical: 0 });
  const incident = useStore(s => s.incident || {});
  const orchestratorStatus = useStore(s => s.orchestratorStatus || {});

  const isIncidentActive = Boolean(
    incident.state &&
    incident.state !== 'NORMAL' &&
    incident.state !== 'IDLE' &&
    incident.state !== 'RECOVERED'
  );

  const healthColor = systemHealthScore > 70 ? 'var(--green)' : systemHealthScore > 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Top Header ── */}
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>
            OPERATIONS · READ-ONLY TELEMETRY
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Live Infrastructure Monitor
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Authoritative stream: <strong style={{ color: 'var(--cyan)' }}>WebSocket 1000ms</strong>
          </span>
        </div>
      </div>

      {/* ── 1. LIVE SYSTEM OVERVIEW ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 18,
      }}>
        {[
          { label: 'SYSTEM HEALTH', value: `${systemHealthScore}%`, color: healthColor, sub: 'Weighted fleet SLA' },
          { label: 'TOTAL NODES',   value: nodes.length,          color: 'var(--cyan)',  sub: 'Active endpoints' },
          { label: 'HEALTHY',       value: statusSummary.healthy, color: 'var(--green)', sub: 'SLA compliant' },
          { label: 'WARNING',       value: statusSummary.warning, color: 'var(--amber)', sub: 'Elevated latency' },
          { label: 'CRITICAL',      value: statusSummary.critical,color: 'var(--red)',   sub: 'Anomalous load' },
        ].map(c => (
          <div key={c.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 2. ACTIVE INCIDENT BANNER (IF ACTIVE) ── */}
      {isIncidentActive && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 18, padding: '12px 18px', borderRadius: 10,
            background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--red)', animation: 'ping 1.5s infinite' }} />
            <div>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.04em' }}>
                ● ACTIVE TELEMETRY INCIDENT · {incident.state}
              </span>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Affected Node: Node {incident.nodeId || 1} {incident.targetNodeId ? `➔ Rerouting to Node ${incident.targetNodeId}` : ''}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Phase: <strong style={{ color: 'var(--cyan)' }}>{incident.state}</strong>
          </div>
        </motion.div>
      )}

      {/* ── 3. NODE HEALTH GRID (REUSABLE CANONICAL NODES) ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
          MONITORED INFRASTRUCTURE NODES · {nodes.length} ENDPOINTS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {nodes.map(node => (
            <NodeHealthCard
              key={node.nodeId || node.id}
              node={node}
              onViewDetails={(n) => setSelectedNode(n)}
            />
          ))}
        </div>
      </div>

      {/* ── 4. REAL-TIME METRICS & NETWORK EVENTS STREAM ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
        {/* Real-Time Latency Graph */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px',
        }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 12 }}>
            REAL-TIME LATENCY STREAM (MS)
          </div>
          <LatencyGraph nodes={nodes} />
        </div>

        {/* Network State Events Log */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px',
          display: 'flex', flexDirection: 'column', height: 320,
        }}>
          <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
            LIVE TELEMETRY TRANSITION EVENTS
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }} className="thin-scroll">
            {events.slice(0, 30).map((ev, i) => (
              <div key={ev.id || i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, minWidth: 62 }}>
                  {typeof ev.timestamp === 'number' ? new Date(ev.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : String(ev.timestamp).slice(0, 8)}
                </span>
                <span style={{
                  fontSize: '0.62rem', fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                  background: ev.severity === 'CRITICAL' ? 'rgba(255,51,85,0.15)' : ev.severity === 'HIGH' ? 'rgba(245,158,11,0.15)' : 'rgba(0,212,255,0.1)',
                  color: ev.severity === 'CRITICAL' ? 'var(--red)' : ev.severity === 'HIGH' ? 'var(--amber)' : 'var(--cyan)',
                  flexShrink: 0,
                }}>
                  {ev.severity || 'INFO'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {ev.message}
                </span>
              </div>
            ))}
            {events.length === 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 40 }}>
                Awaiting telemetry events...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 5. NODE DETAILS MODAL ── */}
      {selectedNode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedNode(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '24px', maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 3 }}>NODE IDENTITY [N{selectedNode.nodeId || selectedNode.id}]</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{selectedNode.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{selectedNode.location || 'Distributed Edge'}</div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ width: 32, height: 32, borderRadius: 7, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { l: 'Status',     v: (selectedNode.status || 'HEALTHY').toUpperCase() },
                { l: 'Health Score', v: `${Math.round(selectedNode.health ?? selectedNode.healthScore ?? 100)}/100` },
                { l: 'Live Latency', v: `${Math.round(selectedNode.latency ?? selectedNode.metrics?.latency ?? 20)}ms` },
                { l: 'Throughput',   v: `${Math.round(selectedNode.requestsPerSecond ?? 10)} RPS` },
                { l: 'CPU Load',     v: `${Math.round(selectedNode.cpu ?? selectedNode.metrics?.cpu ?? 15)}%` },
                { l: 'Memory RSS',   v: `${Math.round(selectedNode.memory ?? selectedNode.metrics?.memory ?? 30)}MB` },
                { l: 'Error Rate',   v: `${selectedNode.errorRate ?? 0}%` },
                { l: 'Traffic Weight', v: `${Math.round(selectedNode.traffic ?? 33)}%` },
              ].map(m => (
                <div key={m.l} style={{ padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: 7 }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 2 }}>{m.l}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{m.v}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
