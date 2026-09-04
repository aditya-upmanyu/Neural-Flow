// BharatBazaarPage.jsx - Clean Application View & Real-Time Autonomous Resilience per Sections 19 & 20 of final_version.md
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, ShieldCheck, Activity, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import useStore from '../store/useStore';
import NodeHealthCard from '../components/NodeHealthCard';
import { API_URL } from '../config';

export default function BharatBazaarPage() {
  const nodes = useStore(s => s.nodes || []);
  const incident = useStore(s => s.incident || {});
  const environment = useStore(s => s.environment);
  const setEnvironment = useStore(s => s.setEnvironment);

  const [bbMetrics, setBbMetrics] = useState({
    activeRoute: 'Node 1 (Primary Gateway)',
    totalRequests: 14820,
    avgLatency: 24,
    errorRate: 0.0,
    availability: 99.98,
    status: 'OPTIMAL',
  });

  // Calculate live application metrics from node telemetry
  useEffect(() => {
    if (!nodes.length) return;
    const avgLat = Math.round(nodes.reduce((acc, n) => acc + (n.latency || 20), 0) / nodes.length);
    const maxErr = Math.max(...nodes.map(n => n.errorRate || 0));
    const activeN = nodes.find(n => !n.isUnderAttack && (n.status || '').toLowerCase() !== 'critical') || nodes[0];
    
    setBbMetrics(prev => ({
      ...prev,
      avgLatency: avgLat,
      errorRate: Math.round(maxErr * 10) / 10,
      activeRoute: `${activeN?.name || 'Node 1'} (Port :5100)`,
      status: incident.state && incident.state !== 'NORMAL' ? 'INCIDENT_ACTIVE' : avgLat > 150 ? 'DEGRADED' : 'OPTIMAL',
      availability: maxErr > 10 ? 98.4 : 99.98,
    }));
  }, [nodes, incident]);

  const isIncidentActive = Boolean(incident.state && incident.state !== 'NORMAL' && incident.state !== 'RECOVERED');

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 4 }}>
            OPERATIONS · APPLICATION INTEGRATION
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>BharatBazaar E-Commerce Application</span>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 6,
              background: 'rgba(124,92,252,0.15)', color: 'var(--violet)', border: '1px solid rgba(124,92,252,0.3)',
            }}>
              INTEGRATED DEMO ENVIRONMENT
            </span>
          </div>
        </div>

        {/* Protection Status Badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px', borderRadius: 8,
          background: isIncidentActive ? 'rgba(255,51,85,0.1)' : 'rgba(0,232,122,0.08)',
          border: `1px solid ${isIncidentActive ? 'rgba(255,51,85,0.3)' : 'rgba(0,232,122,0.25)'}`,
          color: isIncidentActive ? 'var(--red)' : 'var(--green)', fontSize: '0.72rem', fontWeight: 700,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: isIncidentActive ? 'var(--red)' : 'var(--green)' }} />
          {isIncidentActive ? `NEURALFLOW PROTECTING · ${incident.state}` : 'NEURALFLOW AUTONOMOUS PROTECTION ACTIVE'}
        </div>
      </div>

      {/* ── 1. APPLICATION HEALTH METRICS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'APP STATUS', value: bbMetrics.status, color: bbMetrics.status === 'OPTIMAL' ? 'var(--green)' : 'var(--red)', sub: 'SLA target > 99.9%' },
          { label: 'AVG LATENCY', value: `${bbMetrics.avgLatency}ms`, color: bbMetrics.avgLatency > 120 ? 'var(--red)' : 'var(--cyan)', sub: 'User checkout latency' },
          { label: 'ERROR RATE', value: `${bbMetrics.errorRate}%`, color: bbMetrics.errorRate > 2 ? 'var(--red)' : 'var(--green)', sub: 'HTTP 5xx failures' },
          { label: 'AVAILABILITY', value: `${bbMetrics.availability}%`, color: 'var(--green)', sub: 'Global uptime' },
          { label: 'ACTIVE GATEWAY', value: `Node ${incident.targetNodeId || 1}`, color: 'var(--violet)', sub: 'External Router :5100' },
        ].map(c => (
          <div key={c.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '14px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: c.color }}>{c.value}</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 2. DYNAMIC APPLICATION ROUTING & PROTECTION FLOW ── */}
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '18px 20px', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            BharatBazaar ➔ NeuralFlow Autonomous Routing Pipeline
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
            Active Target: <strong>{bbMetrics.activeRoute}</strong>
          </span>
        </div>

        {/* Visual Pipeline Flow */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, alignItems: 'center',
          background: 'var(--bg-surface)', padding: '14px', borderRadius: 10, border: '1px solid var(--border-light)',
        }}>
          <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontWeight: 700 }}>1. SHOPPERS</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>Web Clients</div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--cyan)' }}>➔ HTTP ➔</div>

          <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 6, border: '1px solid rgba(124,92,252,0.4)' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--violet)', fontWeight: 700 }}>2. NEURALFLOW PROXY</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--violet)' }}>Router :5100</div>
          </div>

          <div style={{ textAlign: 'center', color: isIncidentActive ? 'var(--red)' : 'var(--green)' }}>
            {isIncidentActive ? '↗ REROUTED ➔' : '➔ HEALTHY ➔'}
          </div>

          <div style={{ textAlign: 'center', padding: '8px', background: 'var(--bg-elevated)', borderRadius: 6, border: `1px solid ${isIncidentActive ? 'var(--green)' : 'var(--border)'}` }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--green)', fontWeight: 700 }}>3. ACTIVE BACKEND</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {incident.targetNodeId ? `Node ${incident.targetNodeId} (Replica)` : 'Node 1 (Primary)'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. NODE HEALTH & ROUTING TOPOLOGY ── */}
      <div>
        <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 12 }}>
          APPLICATION INSTANCE NODES · REAL-TIME TELEMETRY
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
          {nodes.map(node => (
            <NodeHealthCard
              key={node.nodeId || node.id}
              node={node}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
