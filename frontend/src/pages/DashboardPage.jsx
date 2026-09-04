// NeuralFlow V5 — Dashboard (Command Center Layout)
import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import useStore from '../store/useStore';
import toast from 'react-hot-toast';
import EventLog from '../components/EventLog';
import PredictiveCountdown from '../components/PredictiveCountdown';
import AIExplainer from '../components/AIExplainer';
import IncidentTimeline from '../components/IncidentTimeline';
import HumanInterventionPanel from '../components/HumanInterventionPanel';
import AIDecisionSummary from '../components/AIDecisionSummary';
import BharatBazaarIntegrationCard from '../components/BharatBazaarIntegrationCard';
import NodeDetailsPanel from '../components/NodeDetailsPanel';
import RecoveryTimingDisplay from '../components/RecoveryTimingDisplay';

// NFV5 Master Upgrades
import AgentMissionPanel from '../components/AgentMissionPanel';
import CandidateRanking from '../components/CandidateRanking';
import AdaptationTimeline from '../components/AdaptationTimeline';
import LiveAgentActivity from '../components/LiveAgentActivity';
import BenchmarkView from '../components/BenchmarkView';
import ReliabilityView from '../components/ReliabilityView';
import DecisionReceiptModal from '../components/DecisionReceiptModal';
import NetworkTopologyCanvas from '../components/NetworkTopologyCanvas';

import { API_URL, IS_LOCAL } from '../config';

async function apiCall(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetchWithTimeout(`${API_URL}${path}`, opts);
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`);
    return res.json();
  } catch (err) {
    if (err.message.includes('fetch') || err.name === 'TypeError') {
      throw new Error(`NeuralFlow backend is unavailable on port 3001.`);
    }
    throw err;
  }
}


// ── 3D Network Core ─────────────────────────────────────────
function NetworkCore({ nodes }) {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.12;
  });
  const R = 2.2;
  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 4, 4]} intensity={1.4} color="#00d4ff" />
      <pointLight position={[-4, 3, -4]} intensity={0.8} color="#7c5cfc" />
      {nodes.map((node, i) => {
        const angle = (i / nodes.length) * Math.PI * 2;
        const x = Math.cos(angle) * R, z = Math.sin(angle) * R;
        const st = (node.status || 'healthy').toLowerCase();
        const color = st === 'critical' ? '#ff3355' : st === 'warning' ? '#f5a623' : '#00e87a';
        const emissive = st === 'critical' ? 1.5 : st === 'warning' ? 0.9 : 0.5;
        return (
          <group key={node.nodeId} position={[x, 0, z]}>
            <mesh>
              <sphereGeometry args={[0.38, 32, 32]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={node.isUnderAttack ? 2 : emissive} metalness={0.7} roughness={0.2} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.46, 32, 32]} />
              <meshBasicMaterial color={color} transparent opacity={0.12} side={2} />
            </mesh>
            {node.isUnderAttack && (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.62, 0.78, 32]} />
                <meshBasicMaterial color={color} transparent opacity={0.5} side={2} />
              </mesh>
            )}
            {nodes.slice(i + 1).map((other, j) => {
              const oi = i + 1 + j;
              const oa = (oi / nodes.length) * Math.PI * 2;
              const ox = Math.cos(oa) * R, oz = Math.sin(oa) * R;
              const pts = [new THREE.Vector3(x, 0, z), new THREE.Vector3(ox, 0, oz)];
              const geo = new THREE.BufferGeometry().setFromPoints(pts);
              return (
                <line key={`${i}-${oi}`} geometry={geo}>
                  <lineBasicMaterial color={color} transparent opacity={node.isUnderAttack ? 0.6 : 0.18} />
                </line>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}


// ── Dashboard Page ───────────────────────────────────────────
export default function DashboardPage() {
  const nodes         = useStore(s => s.nodes);
  const mode          = useStore(s => s.mode);
  const environment   = useStore(s => s.environment);
  const events        = useStore(s => s.events);
  const incident      = useStore(s => s.incident);
  const lastAIDecision= useStore(s => s.lastAIDecision);
  const manualModeState = useStore(s => s.manualModeState);
  const completedAISession = useStore(s => s.completedAISession);
  const completedManualSession = useStore(s => s.completedManualSession);
  const latestIncident = useStore(s => s.latestIncident);
  const orchestratorStatus = useStore(s => s.orchestratorStatus);

  const [showExplainer, setShowExplainer] = useState(false);
  const [activeCenterTab, setActiveCenterTab] = useState('TOPOLOGY');
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null); // For NodeDetailsPanel

  // Close explainer automatically when lastAIDecision is cleared (after reset)
  useEffect(() => {
    if (!lastAIDecision) {
      setShowExplainer(false);
    }
  }, [lastAIDecision]);

  // Clear chart data on reset (incident returns to NORMAL with no nodeId)
  const prevIncidentRef = useRef(incident);
  useEffect(() => {
    const prev = prevIncidentRef.current;
    prevIncidentRef.current = incident;
    // Reset fires demo_reset → state with NORMAL; detect by stats resetting to 0
    if (prev.state !== 'NORMAL' && incident.state === 'NORMAL' && !incident.nodeId) {
      setChartData([]);
    }
  }, [incident]);

  // Rolling latency chart from live telemetry
  useEffect(() => {
    if (!nodes.length) return;
    const label = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = { t: label };
    nodes.forEach(n => { entry[`n${n.nodeId}`] = n.latency; });
    setChartData(prev => {
      const next = [...prev, entry];
      return next.length > 30 ? next.slice(-30) : next;
    });
  }, [nodes]);

  const handleModeSwitch = useCallback(async (newMode) => {
    try {
      await apiCall('/api/mode', 'POST', { mode: newMode });
      toast.success(`Switched to ${newMode} mode`, { icon: newMode === 'AI' ? '🤖' : '👤' });
    } catch (e) {
      toast.error(`Failed to switch mode: ${e.message}`);
    }
  }, []);

  const handleEnvironmentSwitch = useCallback(async (newEnv) => {
    if (newEnv === environment) return;
    try {
      // For EXTERNAL, first check BB nodes are reachable
      if (newEnv === 'EXTERNAL') {
        const health = await apiCall('/api/external/health', 'GET');
        if (!health.allReachable) {
          const unreachable = health.nodes.filter(n => !n.reachable).map(n => n.name).join(', ');
          toast.error(`BharatBazaar unreachable: ${unreachable}. Start BB nodes first.`, { duration: 5000, icon: '⚠️' });
          return;
        }
      }
      await apiCall('/api/environment', 'POST', { environment: newEnv });
      // toast fired by WebSocket environment_changed handler
    } catch (e) {
      toast.error(`Failed to switch environment: ${e.message}`);
    }
  }, [environment]);

  const handleLaunchAttack = useCallback(async (nodeId, intensity = 60) => {
    try {
      await apiCall('/api/attack/start', 'POST', { nodeId, attackType: 'TrafficSpike', intensity });
      toast.loading(`Traffic spike injected → Node ${nodeId}`, { duration: 2000, icon: '🚀' });
    } catch (e) {
      toast.error(`Failed to start traffic: ${e.message}`);
    }
  }, []);

  const handleStopAttack = useCallback(async () => {
    try {
      await apiCall('/api/attack/stop', 'POST');
      toast.success('Traffic contained', { icon: '⏹' });
    } catch (e) {
      toast.error(`Failed to contain: ${e.message}`);
    }
  }, []);

  const handleNormalTraffic = useCallback(async () => {
    try {
      await apiCall('/api/traffic/normal', 'POST', { intensity: 10 });
      toast.success('Baseline traffic started (10 RPS)', { icon: '〜' });
    } catch (e) {
      toast.error(`Failed to start baseline: ${e.message}`);
    }
  }, []);

  const handleReset = useCallback(async () => {
    try {
      await apiCall('/api/reset', 'POST');
      toast.success('Demo reset complete', { icon: '↺' });
    } catch (e) {
      toast.error(`Reset failed: ${e.message}`);
    }
  }, []);

  const handleManualReroute = useCallback(async () => {
    const from = nodes.find(n => n.isUnderAttack || (n.status || '').toLowerCase() === 'critical');
    const to   = nodes.find(n => !n.isUnderAttack && (n.status || '').toLowerCase() !== 'critical' && n.health > 60);
    if (!from) return toast.error('No degraded node to reroute from');
    if (!to)   return toast.error('No healthy node available');
    try {
      await apiCall('/api/reroute/manual', 'POST', { fromNodeId: from.nodeId, toNodeId: to.nodeId });
      toast.success(`Rerouted: Node ${from.nodeId} → Node ${to.nodeId}`, { icon: '↗' });
    } catch (e) {
      toast.error(`Reroute failed: ${e.message}`);
    }
  }, [nodes]);

  const predictions = {};
  nodes.forEach(n => { if (n.predictedBreach !== null && n.predictedBreach > 0) predictions[n.nodeId] = n.predictedBreach; });

  const isAI = mode === 'AI';
  const criticalCount  = nodes.filter(n => (n.status||'').toLowerCase() === 'critical').length;
  const warningCount   = nodes.filter(n => (n.status||'').toLowerCase() === 'warning').length;
  const healthyCount   = nodes.filter(n => (n.status||'').toLowerCase() === 'healthy').length;
  const incidentActive = incident.state !== 'NORMAL' && incident.state !== 'COOLDOWN';

  const nodeColors = ['#00d4ff','#00e87a','#7c5cfc','#f5a623','#ff3355'];

  // Attack target selector state — lives in bar so DemoControls row is not needed
  const [barTargetId, setBarTargetId] = useState(nodes[0]?.nodeId || 1);
  const [barIntensity, setBarIntensity] = useState(60);
  // keep barTargetId in sync if nodes load after mount
  useEffect(() => {
    if (nodes.length && !nodes.find(n => n.nodeId === barTargetId)) {
      setBarTargetId(nodes[0].nodeId);
    }
  }, [nodes]);

  return (
    <div style={{ padding: '0 0 24px', maxWidth: 1600, margin: '0 auto' }}>

      {/* ── TOP COMMAND BAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(6,6,9,0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        padding: '8px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* brand */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--cyan)', lineHeight: 1.2 }}>
            NEURALFLOW
          </div>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
            AUTONOMOUS INFRA
          </div>
        </div>

        {/* environment selector */}
        <div style={{
          display: 'flex', gap: 3, padding: 3, flexShrink: 0,
          background: 'var(--bg-elevated)',
          border: `1px solid ${environment === 'EXTERNAL' ? 'rgba(124,92,252,0.4)' : 'var(--border)'}`,
          borderRadius: 7,
        }}>
          {[
            { id: 'INTERNAL', label: '🖥 Internal Demo' },
            { id: 'EXTERNAL', label: '🛒 BharatBazaar' },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => handleEnvironmentSwitch(id)}
              style={{
                padding: '3px 10px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700,
                letterSpacing: '0.05em', cursor: 'pointer', transition: 'all 0.15s',
                background: environment === id
                  ? (id === 'EXTERNAL' ? 'rgba(124,92,252,0.85)' : 'rgba(0,212,255,0.15)')
                  : 'transparent',
                color: environment === id
                  ? (id === 'EXTERNAL' ? '#fff' : 'var(--cyan)')
                  : 'var(--text-muted)',
                border: environment === id
                  ? `1px solid ${id === 'EXTERNAL' ? 'transparent' : 'rgba(0,212,255,0.3)'}`
                  : '1px solid transparent',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* system status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 6, flexShrink: 0,
          background: incidentActive ? 'rgba(255,51,85,0.07)' : 'rgba(0,232,122,0.07)',
          border: `1px solid ${incidentActive ? 'rgba(255,51,85,0.2)' : 'rgba(0,232,122,0.15)'}`,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: incidentActive ? 'var(--red)' : 'var(--green)',
            boxShadow: `0 0 6px ${incidentActive ? 'var(--red)' : 'var(--green)'}`,
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', color: incidentActive ? 'var(--red)' : 'var(--green)', whiteSpace: 'nowrap' }}>
            {incidentActive ? `INCIDENT · ${incident.state.replace('_',' ')}` : 'PROTECTED'}
          </span>
        </div>

        {/* mode toggle */}
        <div style={{ display: 'flex', gap: 3, padding: 3, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 7, flexShrink: 0 }}>
          {['MANUAL','AI'].map(m => (
            <button key={m} onClick={() => handleModeSwitch(m)}
              style={{
                padding: '4px 12px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 700,
                letterSpacing: '0.07em', cursor: 'pointer', transition: 'all 0.15s',
                background: mode === m ? (m === 'AI' ? 'var(--cyan)' : 'rgba(245,166,35,0.15)') : 'transparent',
                color: mode === m ? (m === 'AI' ? '#020204' : 'var(--amber)') : 'var(--text-muted)',
                border: mode === m ? `1px solid ${m === 'AI' ? 'transparent' : 'rgba(245,166,35,0.3)'}` : '1px solid transparent',
              }}
            >
              {m === 'AI' ? '🤖 AI' : '👤 MANUAL'}
            </button>
          ))}
        </div>

        {/* divider */}
        <div style={{ width: 1, height: 24, background: 'var(--border)', flexShrink: 0 }} />

        {/* inline load generator controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em', flexShrink: 0 }}>TARGET</span>
          <select value={barTargetId} onChange={e => setBarTargetId(Number(e.target.value))}
            style={{
              padding: '4px 8px', borderRadius: 5, fontSize: '0.68rem',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
              color: 'var(--text-primary)', height: 28,
            }}>
            {nodes.map(n => <option key={n.nodeId} value={n.nodeId}>Node {n.nodeId} — {n.name}</option>)}
          </select>
          <select value={barIntensity} onChange={e => setBarIntensity(Number(e.target.value))}
            style={{
              padding: '4px 8px', borderRadius: 5, fontSize: '0.68rem',
              background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
              color: 'var(--text-primary)', height: 28,
            }}>
            <option value={20}>20 RPS</option>
            <option value={40}>40 RPS</option>
            <option value={60}>60 RPS</option>
            <option value={80}>80 RPS</option>
          </select>
        </div>

        {/* primary action buttons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <QuickBtn label="▶ SIMULATE" onClick={() => handleLaunchAttack(barTargetId, barIntensity)} variant="primary" />
          <QuickBtn label="〜 BASELINE" onClick={handleNormalTraffic} variant="info" />
          <QuickBtn label="⏹ CONTAIN" onClick={handleStopAttack} variant="danger" />
          <QuickBtn label="↺ RESET" onClick={handleReset} variant="ghost" />
        </div>
        {/* safe simulation badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px',
          borderRadius: 4, background: 'rgba(255,170,0,0.06)', border: '1px solid rgba(255,170,0,0.14)',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '0.57rem', color: 'rgba(255,170,0,0.65)', fontWeight: 600, letterSpacing: '0.05em' }}>
            🔒 SAFE LOCAL DEMO
          </span>
        </div>

        {/* explain decision & decision receipt buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => setReceiptModalOpen(true)} style={{
            padding: '4px 12px', height: 28, borderRadius: 5,
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
            color: 'var(--cyan)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            📋 DECISION RECEIPT
          </button>
          {lastAIDecision && (
            <button onClick={() => setShowExplainer(true)} style={{
              padding: '4px 12px', height: 28, borderRadius: 5,
              background: 'var(--cyan-dim)', border: '1px solid rgba(0,212,255,0.2)',
              color: 'var(--cyan)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              🤖 N{lastAIDecision.fromNodeId}→N{lastAIDecision.toNodeId} · EXPLAIN
            </button>
          )}
        </div>
      </div>

      {/* ── EXTERNAL APP CONTEXT BANNER (only in BharatBazaar mode) ── */}
      {environment === 'EXTERNAL' && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(124,92,252,0.12) 0%, rgba(124,92,252,0.04) 100%)',
          borderBottom: '1px solid rgba(124,92,252,0.25)',
          padding: '6px 24px',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.9rem' }}>🛒</span>
            <div>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'rgba(124,92,252,1)' }}>
                BHARATBAZAAR
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                Independent External E-Commerce Application
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginLeft: 8 }}>
            {nodes.map(n => {
              const st  = (n.status || 'healthy').toLowerCase();
              const col = st === 'critical' ? 'var(--red)' : st === 'warning' ? 'var(--amber)' : 'var(--green)';
              return (
                <div key={n.nodeId} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: col, boxShadow: `0 0 5px ${col}` }} />
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {n.name}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: col, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {n.latency}ms
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(124,92,252,0.8)', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '0.6rem', color: 'rgba(124,92,252,0.9)', fontWeight: 700, letterSpacing: '0.06em' }}>
              NEURALFLOW AI PROTECTING THIS APPLICATION
            </span>
            <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 8 }}>
              Router :5100
            </span>
          </div>
        </div>
      )}

      {/* ── BHARATBAZAAR HOSTED MODE WARNING ── */}
      {environment === 'EXTERNAL' && !IS_LOCAL && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(245,166,35,0.12) 0%, rgba(245,166,35,0.04) 100%)',
          borderBottom: '1px solid rgba(245,166,35,0.3)',
          padding: '8px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: '1rem' }}>⚠️</span>
          <div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(245,166,35,1)', letterSpacing: '0.05em' }}>
              EXTERNAL MODE — LOCAL INSTANCE REQUIRED
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginLeft: 10 }}>
              BharatBazaar runs locally. To see the full External mode demo, clone the repo and run <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: 3, fontFamily: 'var(--font-mono)' }}>npm start</code> locally.
            </span>
          </div>
        </div>
      )}

      {/* ── MAIN GRID ── */}
      <div style={{ padding: '12px 24px 0' }}>

        {/* NFV5 Agent Mission & Control Plane Banner */}
        <div style={{ marginBottom: 10 }}>
          <AgentMissionPanel />
        </div>

        {/* Row 1: Left overview + 3D core + Right log — fixed height so page never grows */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '192px 1fr 252px',
          gap: 10, marginBottom: 10,
          height: 300,
        }}>

          {/* ── LEFT: System Overview ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', overflow: 'hidden' }}>
            {/* overview card */}
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '12px 14px', flex: 1, overflow: 'hidden',
            }}>
              <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                {environment === 'EXTERNAL' ? 'BHARATBAZAAR OVERVIEW' : 'SYSTEM OVERVIEW'}
              </div>
              <OverviewStat label="NODES"    value={nodes.length}    color="var(--cyan)" />
              <OverviewStat label="HEALTHY"  value={healthyCount}    color="var(--green)" />
              <OverviewStat label="WARNING"  value={warningCount}    color="var(--amber)" />
              <OverviewStat label="CRITICAL" value={criticalCount}   color="var(--red)" big={criticalCount > 0} />
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <OverviewStat label="AVG LATENCY"
                value={nodes.length ? `${Math.round(nodes.reduce((a,n)=>a+n.latency,0)/nodes.length)}ms` : '—'}
                color="var(--text-primary)" />
              <OverviewStat label="TOTAL RPS"
                value={nodes.reduce((a,n)=>a+(n.requestsPerSecond||0),0)}
                color="var(--text-primary)" />
            </div>

            {/* last AI action mini-card — only shown when decision exists */}
            {lastAIDecision && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid rgba(0,212,255,0.2)',
                borderRadius: 'var(--radius-lg)', padding: '10px 14px', flexShrink: 0,
              }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 5 }}>
                  LAST AI ACTION
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 700, marginBottom: 2 }}>
                  N{lastAIDecision.fromNodeId} → N{lastAIDecision.toNodeId}
                </div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  {lastAIDecision.responseTimeMs}ms · {lastAIDecision.confidence}% conf
                </div>
              </div>
            )}
            {!lastAIDecision && (
              <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '10px 14px', flexShrink: 0,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 5px var(--green)', animation: 'pulse-slow 3s ease-in-out infinite' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Monitoring…</span>
              </div>
            )}
          </div>

          {/* ── CENTER: Cinematic Canvas 2D Topology ── */}
          <div style={{
            background: '#050a14', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative',
            height: '100%',
          }}>
            <NetworkTopologyCanvas 
              nodes={nodes} 
              lastAIDecision={lastAIDecision} 
              incident={incident} 
              onSelectNode={(node) => setSelectedNode(node)} 
            />
          </div>

          {/* ── RIGHT: Live Agent Log — height constrained by fixed grid row ── */}
          <div style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <EventLog events={events} />
          </div>
        </div>

        {/* ── NFV5 CONTROL PLANE TAB NAVIGATION ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'TOPOLOGY', label: '🖥 TOPOLOGY & TELEMETRY' },
            { id: 'EXPLAINABILITY', label: '🎯 CANDIDATE EXPLAINABILITY' },
            { id: 'ADAPTATION', label: '🔄 FAILURE ADAPTATION PATH' },
            { id: 'ACTIVITY', label: '⚡ LIVE AGENT ACTIVITY' },
            { id: 'BENCHMARK', label: '📊 RESILIENCE BENCHMARK' },
            { id: 'RELIABILITY', label: '📈 SLO & RELIABILITY' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCenterTab(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
                letterSpacing: '0.07em', cursor: 'pointer', transition: 'all 0.15s',
                background: activeCenterTab === tab.id ? 'var(--cyan)' : 'var(--bg-elevated)',
                color: activeCenterTab === tab.id ? '#020204' : 'var(--text-secondary)',
                border: activeCenterTab === tab.id ? 'none' : '1px solid var(--border)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        {activeCenterTab === 'EXPLAINABILITY' && (
          <div style={{ marginBottom: 12 }}>
            <CandidateRanking />
          </div>
        )}

        {activeCenterTab === 'ADAPTATION' && (
          <div style={{ marginBottom: 12 }}>
            <AdaptationTimeline />
          </div>
        )}

        {activeCenterTab === 'ACTIVITY' && (
          <div style={{ marginBottom: 12 }}>
            <LiveAgentActivity />
          </div>
        )}

        {activeCenterTab === 'BENCHMARK' && (
          <div style={{ marginBottom: 12 }}>
            <BenchmarkView />
          </div>
        )}

        {activeCenterTab === 'RELIABILITY' && (
          <div style={{ marginBottom: 12 }}>
            <ReliabilityView />
          </div>
        )}

        {/* Row 2: Node Cards (3 compact modules) */}
        {activeCenterTab === 'TOPOLOGY' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 10 }}>
              {nodes.map(node => (
                <NodeModule 
                  key={node.nodeId} 
                  node={node} 
                  isExternal={environment === 'EXTERNAL'}
                  onClick={() => setSelectedNodeId(node.nodeId)}
                />
              ))}
            </div>

        {/* Row 2b: Human Intervention Panel — fixed reserve space to prevent layout shift */}
        <div style={{ marginBottom: incidentActive && mode === 'MANUAL' ? 10 : 0 }}>
          <AnimatePresence>
            {mode === 'MANUAL' && ['ACTION_PENDING', 'DETECTED', 'PREDICTED', 'VERIFYING'].includes(incident.state) && (
              <motion.div
                key="human-panel"
                initial={{ opacity: 0, scaleY: 0.85, originY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.85 }}
                transition={{ duration: 0.25 }}
                style={{ transformOrigin: 'top' }}
              >
                <HumanInterventionPanel
                  nodes={nodes}
                  incident={incident}
                  manualModeState={manualModeState}
                  mode={mode}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row 2c: AI Decision Explainability — only when AI decision exists */}
        <AnimatePresence>
          {lastAIDecision && (
            <motion.div
              key="ai-decision-summary"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <AIDecisionSummary
                decision={lastAIDecision}
                completedAISession={completedAISession}
                completedManualSession={completedManualSession}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Row 3: Incident Timeline | Latency Chart | Predictive Risk — all in one compact row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
          <IncidentTimeline incident={incident} />

          {/* Latency sparkline */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '11px 14px' }}>
            <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>
              REAL-TIME LATENCY (ms)
            </div>
            <ResponsiveContainer width="100%" height={72}>
              <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="t" hide />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 9 }} width={32} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11 }}
                  labelStyle={{ color: 'var(--text-muted)' }}
                />
                {nodes.map((n, i) => (
                  <Line key={n.nodeId} type="monotone" dataKey={`n${n.nodeId}`}
                    stroke={nodeColors[i % nodeColors.length]} strokeWidth={1.5} dot={false} name={n.name} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
              {nodes.map((n, i) => (
                <div key={n.nodeId} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 14, height: 2, background: nodeColors[i % nodeColors.length], borderRadius: 1 }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{n.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Predictive Risk */}
          <PredictiveCountdown predictions={predictions} nodes={nodes} incidentNodeId={incident.nodeId} />
        </div>

          </>
        )}

        {/* Row 4: BharatBazaar Integration & Recovery Timing */}
        {environment === 'EXTERNAL' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
            <BharatBazaarIntegrationCard 
              nodes={nodes} 
              incident={incident}
              onOpenNode={(nodeId) => setSelectedNodeId(nodeId)}
            />
            {incidentActive && <RecoveryTimingDisplay incident={incident} />}
          </div>
        )}
      </div>

      {/* Node Details Panel Modal */}
      <AnimatePresence>
        {selectedNodeId && (
          <NodeDetailsPanel 
            nodeId={selectedNodeId} 
            onClose={() => setSelectedNodeId(null)} 
          />
        )}
      </AnimatePresence>

      {/* Explainer modal */}
      {showExplainer && lastAIDecision && (
        <AIExplainer decision={lastAIDecision} nodes={nodes} onClose={() => setShowExplainer(false)} />
      )}

      {/* NFV5 Auditable Decision Receipt Modal */}
      <DecisionReceiptModal
        isOpen={receiptModalOpen}
        receipt={latestIncident || {
          id: 'INC-LATEST-AUDIT',
          goal: 'IMMEDIATE_FAILOVER',
          risk: 75,
          confidence: 0.95,
          action: 'REROUTE_TRAFFIC',
          targetNodeId: 2,
          environment,
          verificationOutcome: 'VERIFIED_SUCCESS',
          durationMs: 280,
          timestamp: Date.now(),
        }}
        onClose={() => setReceiptModalOpen(false)}
      />
    </div>
  );
}


// ── Node Module Card ─────────────────────────────────────────
function NodeModule({ node, isExternal = false, onClick }) {
  const status = (node.status || 'healthy').toLowerCase();
  const color  = status === 'critical' ? 'var(--red)' : status === 'warning' ? 'var(--amber)' : 'var(--green)';
  const dimColor = status === 'critical' ? 'var(--red-dim)' : status === 'warning' ? 'var(--amber-dim)' : 'var(--green-dim)';
  const borderColor = status === 'critical'
    ? 'rgba(255,51,85,0.3)' : status === 'warning'
    ? 'rgba(245,166,35,0.2)' : isExternal ? 'rgba(124,92,252,0.18)' : 'rgba(255,255,255,0.07)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1, cursor: 'pointer' }}
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-lg)',
        padding: '12px 14px',
        position: 'relative', overflow: 'hidden',
        boxShadow: status === 'critical' ? '0 0 20px rgba(255,51,85,0.12)' : 'none',
        transition: 'box-shadow 0.4s',
      }}
    >
      {/* top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: status === 'critical' ? 1 : 0.4 }} />

      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 2 }}>
            {isExternal ? '🛒 BHARATBAZAAR' : `NODE ${String(node.nodeId).padStart(2,'0')}`}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {node.name}
          </div>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {node.location}
          </div>
        </div>
        <div style={{
          padding: '3px 8px', borderRadius: 4,
          background: dimColor, color,
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
          border: `1px solid ${borderColor}`,
          animation: status === 'critical' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}>
          {status.toUpperCase()}
        </div>
      </div>

      {/* main metrics grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        <Metric label="LATENCY"  value={`${node.latency}ms`}  color={node.latency > 250 ? 'var(--red)' : node.latency > 100 ? 'var(--amber)' : 'var(--text-primary)'} />
        <Metric label="RPS"      value={node.requestsPerSecond ?? '—'} color="var(--text-primary)" />
        <Metric label="HEALTH"   value={`${node.health}%`}    color={color} />
        <Metric label="ERRORS"   value={`${node.errorRate}%`} color={node.errorRate > 5 ? 'var(--red)' : 'var(--text-muted)'} />
      </div>

      {/* mini bars */}
      <MetricBar label="CPU"    value={node.cpu}    max={100} color="var(--cyan)" />
      <MetricBar label="MEM"    value={node.memory} max={120} color="var(--violet)" />

      {/* traffic weight */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>TRAFFIC WEIGHT</span>
        <span style={{
          fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-mono)',
          color,
        }}>
          {node.traffic}%
        </span>
      </div>

      {/* predicted breach badge */}
      {node.predictedBreach !== null && node.predictedBreach > 0 && (
        <div style={{
          marginTop: 8, padding: '5px 10px', borderRadius: 5, textAlign: 'center',
          background: 'rgba(255,51,85,0.08)', border: '1px solid rgba(255,51,85,0.2)',
          fontSize: '0.68rem', fontWeight: 700, color: 'var(--red)',
        }}>
          ⏱ BREACH IN {node.predictedBreach}s
        </div>
      )}
    </motion.div>
  );
}


// ── Demo Controls ────────────────────────────────────────────
function DemoControls({ nodes, onLaunch, onStop, onReset }) {
  const [targetId, setTargetId] = useState(1);
  const [intensity, setIntensity] = useState(60);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', padding: '14px 16px',
    }}>
      <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 12 }}>
        LOAD GENERATOR
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        {/* target */}
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em' }}>TARGET NODE</div>
          <select value={targetId} onChange={e => setTargetId(Number(e.target.value))}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
              color: 'var(--text-primary)', fontSize: '0.78rem',
            }}
          >
            {nodes.map(n => (
              <option key={n.nodeId} value={n.nodeId}>Node {n.nodeId} — {n.name}</option>
            ))}
          </select>
        </div>
        {/* intensity */}
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.08em' }}>INTENSITY</div>
          <select value={intensity} onChange={e => setIntensity(Number(e.target.value))}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border-light)',
              color: 'var(--text-primary)', fontSize: '0.78rem',
            }}
          >
            <option value={20}>20 RPS — Normal</option>
            <option value={40}>40 RPS — Elevated</option>
            <option value={60}>60 RPS — High</option>
            <option value={80}>80 RPS — Critical</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <button onClick={() => onLaunch(targetId, intensity)} style={{
          height: 36, borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
          background: 'var(--cyan)', color: '#020204', cursor: 'pointer',
          border: 'none', letterSpacing: '0.06em',
          boxShadow: '0 0 12px rgba(0,212,255,0.2)',
        }}>▶ START</button>
        <button onClick={onStop} style={{
          height: 36, borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
          background: 'var(--red-dim)', color: 'var(--red)', cursor: 'pointer',
          border: '1px solid rgba(255,51,85,0.25)', letterSpacing: '0.06em',
        }}>⏹ CONTAIN</button>
        <button onClick={onReset} style={{
          height: 36, borderRadius: 6, fontSize: '0.72rem', fontWeight: 700,
          background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer',
          border: '1px solid var(--border-light)', letterSpacing: '0.06em',
        }}>↺ RESET</button>
      </div>

      <div style={{
        marginTop: 10, padding: '7px 10px', borderRadius: 6,
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.5,
      }}>
        <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>TIP: </span>
        Switch to AI Mode before starting — watch autonomous detection and reroute in action.
      </div>
    </div>
  );
}


// ── Small helpers ────────────────────────────────────────────
function QuickBtn({ label, onClick, variant }) {
  const styles = {
    primary: { bg: 'var(--cyan)', color: '#020204', border: 'none', shadow: '0 0 12px rgba(0,212,255,0.25)' },
    danger:  { bg: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(255,51,85,0.3)', shadow: 'none' },
    amber:   { bg: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.3)', shadow: 'none' },
    ghost:   { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-light)', shadow: 'none' },
    info:    { bg: 'var(--violet-dim)', color: 'var(--violet)', border: '1px solid rgba(124,92,252,0.3)', shadow: 'none' },
  };
  const s = styles[variant] || styles.ghost;
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      style={{
        height: 32, padding: '0 14px', borderRadius: 6,
        background: s.bg, color: s.color, border: s.border,
        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em',
        cursor: 'pointer', boxShadow: s.shadow,
      }}>
      {label}
    </motion.button>
  );
}

function OverviewStat({ label, value, color, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{
        fontSize: big ? '1rem' : '0.82rem', fontWeight: 700,
        fontFamily: 'var(--font-mono)', color,
        textShadow: big ? `0 0 8px ${color}` : 'none',
      }}>{value}</span>
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}

function MetricBar({ label, value, max, color }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 5 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{label}</span>
        <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
          {Math.round(value)}{label === 'MEM' ? 'MB' : '%'}
        </span>
      </div>
      <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, overflow: 'hidden' }}>
        <motion.div animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
          style={{ height: '100%', background: color, borderRadius: 1 }} />
      </div>
    </div>
  );
}
