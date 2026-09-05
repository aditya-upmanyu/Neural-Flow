// HumanInterventionPanel — Live human operator response panel
// Shows real incident telemetry, live elapsed timer, REROUTE / CONTAIN actions
import { useState, useEffect, useCallback } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { API_URL } from '../config';
async function apiCall(path, method, body) {
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

export default function HumanInterventionPanel({ nodes, incident, manualModeState, mode }) {
  const [elapsed, setElapsed] = useState(0);
  const [actionResult, setActionResult] = useState(null);

  const isManual    = mode === 'MANUAL';
  const incState    = incident?.state || 'NORMAL';
  const actionPending = incState === 'ACTION_PENDING' || incState === 'DETECTED' || incState === 'PREDICTED';
  const verifying   = incState === 'VERIFYING';
  const resolved    = incState === 'COOLDOWN' || incState === 'NORMAL';

  // Find the degraded node from real state
  const attackedNodeId = incident?.nodeId || manualModeState?.attackedNodeId;
  const attackedNode   = nodes.find(n => n.nodeId === attackedNodeId);
  const targetNode     = nodes.find(n => n.nodeId === incident?.targetNodeId);

  // Live elapsed timer — derived from real attackStartTime
  useEffect(() => {
    if (!manualModeState?.attackStartTime || !manualModeState?.isActive) {
      setElapsed(manualModeState?.elapsedTime || 0);
      return;
    }
    const tick = () => {
      const e = (Date.now() - manualModeState.attackStartTime) / 1000;
      setElapsed(e);
    };
    tick();
    const iv = setInterval(tick, 100);
    return () => clearInterval(iv);
  }, [manualModeState?.attackStartTime, manualModeState?.isActive]);

  const handleReroute = useCallback(async () => {
    const from = nodes.find(n => n.nodeId === attackedNodeId) ||
                 nodes.find(n => n.isUnderAttack || (n.status||'').toLowerCase() === 'critical');
    const to   = nodes.find(n => n.nodeId !== from?.nodeId && !n.isUnderAttack &&
                 (n.status||'').toLowerCase() !== 'critical' && n.health > 60);
    if (!from) return toast.error('No degraded node detected');
    if (!to)   return toast.error('No healthy target available');
    try {
      const result = await apiCall('/api/reroute/manual', 'POST',
        { fromNodeId: from.nodeId, toNodeId: to.nodeId });
      setActionResult({
        type: 'reroute',
        fromNode: from,
        toNode: to,
        reactionTime: elapsed,
        ...result,
      });
      toast.success(`Rerouted: ${from.name} → ${to.name} in ${elapsed.toFixed(1)}s`, { icon: '↗' });
    } catch (e) { toast.error(`Reroute failed: ${e.message}`); }
  }, [nodes, attackedNodeId, elapsed]);

  const handleContain = useCallback(async () => {
    try {
      await apiCall('/api/attack/stop', 'POST');
      setActionResult({ type: 'contain', reactionTime: elapsed });
      toast.success('Traffic contained — node recovering', { icon: '⏹' });
    } catch (e) { toast.error(`Contain failed: ${e.message}`); }
  }, [elapsed]);

  // Don't render at all if not in manual mode or no incident
  if (!isManual) return null;
  if (incState === 'NORMAL' && !actionResult) return null;

  const latency  = attackedNode?.latency ?? 0;
  const rps      = attackedNode?.requestsPerSecond ?? 0;
  const health   = attackedNode?.health ?? 100;
  const trend    = attackedNode?.latencyTrend ?? 0;
  const isCrit   = latency >= 300;
  const urgency  = isCrit ? 'critical' : latency > 150 ? 'warning' : 'info';
  const urgColor = urgency === 'critical' ? 'var(--red)' : urgency === 'warning' ? 'var(--amber)' : 'var(--cyan)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${urgency === 'critical' ? 'rgba(255,51,85,0.35)' : 'rgba(245,166,35,0.25)'}`,
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: urgency === 'critical' ? '0 0 30px rgba(255,51,85,0.1)' : 'none',
      }}
    >
      {/* top accent bar */}
      <div style={{ height: 2, background: urgColor, opacity: urgency === 'critical' ? 1 : 0.6,
        animation: urgency === 'critical' ? 'pulse-line 1.5s ease-in-out infinite' : 'none' }} />

      {/* header */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid var(--border)',
        background: urgency === 'critical' ? 'rgba(255,51,85,0.05)' : 'rgba(245,166,35,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: urgColor,
            boxShadow: `0 0 6px ${urgColor}`,
            animation: actionPending ? 'pulse 1.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: urgColor, letterSpacing: '0.08em' }}>
            {actionPending ? '⚠ HUMAN INTERVENTION REQUIRED' :
             verifying     ? '◎ VERIFYING RECOVERY' :
                             '✓ INCIDENT RESOLVED'}
          </span>
        </div>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          👤 MANUAL CONTROL
        </span>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Action result panel — shown after operator acts */}
        <AnimatePresence>
          {actionResult && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 12,
                background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.2)',
              }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>
                {actionResult.type === 'reroute' ? '↗ MANUAL REROUTE EXECUTED' : '⏹ TRAFFIC CONTAINED'}
              </div>
              {actionResult.type === 'reroute' && actionResult.fromNode && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <SmallStat label="FROM"     value={actionResult.fromNode.name}         color="var(--red)"   />
                  <SmallStat label="TO"       value={actionResult.toNode?.name || '—'}   color="var(--green)" />
                  <SmallStat label="REACTION" value={`${actionResult.reactionTime.toFixed(1)}s`} color="var(--amber)" />
                </div>
              )}
              {verifying && (
                <div style={{ marginTop: 8, fontSize: '0.7rem', color: 'var(--cyan)', fontWeight: 600 }}>
                  ◎ Recovery verifying…
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active incident panel */}
        {actionPending && attackedNode && (
          <>
            {/* Node name + status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 2 }}>
                  DEGRADED NODE
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {attackedNode.name}
                </div>
              </div>
              <div style={{
                padding: '4px 10px', borderRadius: 5,
                background: isCrit ? 'var(--red-dim)' : 'var(--amber-dim)',
                border: `1px solid ${isCrit ? 'rgba(255,51,85,0.3)' : 'rgba(245,166,35,0.25)'}`,
                fontSize: '0.65rem', fontWeight: 700, color: urgColor,
                animation: isCrit ? 'pulse 1.5s ease-in-out infinite' : 'none',
              }}>
                {isCrit ? '🔴 CRITICAL RISK' : '⚠ ELEVATED RISK'}
              </div>
            </div>

            {/* Live metrics row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 12 }}>
              <LiveMetric label="LATENCY"    value={`${latency}ms`}
                color={isCrit ? 'var(--red)' : latency > 150 ? 'var(--amber)' : 'var(--text-primary)'}
                warn={isCrit} />
              <LiveMetric label="RPS"        value={rps}       color="var(--text-primary)" />
              <LiveMetric label="HEALTH"     value={`${health}%`}
                color={health < 40 ? 'var(--red)' : health < 70 ? 'var(--amber)' : 'var(--green)'} />
              <LiveMetric label="TREND"
                value={`${trend > 0 ? '+' : ''}${trend}ms/s`}
                color={trend > 8 ? 'var(--red)' : trend > 3 ? 'var(--amber)' : 'var(--green)'} />
            </div>

            {/* Threshold bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                  LATENCY vs THRESHOLD (300ms)
                </span>
                <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: urgColor, fontWeight: 700 }}>
                  {latency}ms / 300ms
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${Math.min(100, (latency / 300) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                  style={{
                    height: '100%', borderRadius: 3,
                    background: isCrit
                      ? 'linear-gradient(90deg,var(--amber),var(--red))'
                      : 'linear-gradient(90deg,var(--green),var(--amber))',
                  }}
                />
              </div>
              {isCrit && (
                <div style={{ fontSize: '0.62rem', color: 'var(--red)', marginTop: 3, fontWeight: 600 }}>
                  ● Critical threshold exceeded — degradation ongoing
                </div>
              )}
            </div>

            {/* Elapsed timer */}
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 12, textAlign: 'center',
              background: 'rgba(255,51,85,0.05)', border: '1px solid rgba(255,51,85,0.12)',
            }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 4 }}>
                INCIDENT DURATION
              </div>
              <motion.div
                animate={{ color: elapsed > 10 ? 'var(--red)' : elapsed > 5 ? 'var(--amber)' : 'var(--amber)' }}
                style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', lineHeight: 1 }}
              >
                {elapsed.toFixed(1)}s
              </motion.div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {isCrit
                  ? `Node ${attackedNode.name} has been above the 300ms threshold for ${elapsed.toFixed(1)}s`
                  : `Node ${attackedNode.name} is degrading — human action may be required`}
              </div>
              {manualModeState?.failedRequests > 0 && (
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'center', gap: 16 }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--red)', fontWeight: 700 }}>
                    {manualModeState.failedRequests} failed reqs
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--amber)', fontWeight: 700 }}>
                    ~${(manualModeState.revenueLoss || 0).toFixed(2)} est. impact
                  </span>
                </div>
              )}
            </div>

            {/* REROUTE / CONTAIN action buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                onClick={handleReroute}
                style={{
                  height: 42, borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(245,166,35,0.1)', color: 'var(--amber)',
                  border: '1px solid rgba(245,166,35,0.35)',
                  fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                ↗ REROUTE TRAFFIC
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
                onClick={handleContain}
                style={{
                  height: 42, borderRadius: 8, cursor: 'pointer',
                  background: 'var(--red-dim)', color: 'var(--red)',
                  border: '1px solid rgba(255,51,85,0.3)',
                  fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                ⏹ CONTAIN TRAFFIC
              </motion.button>
            </div>
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--amber)', lineHeight: 1.4 }}>
                Shifts load to healthy node. Traffic continues.
              </div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Stops load generator. Node recovers.
              </div>
            </div>
          </>
        )}

        {/* Recovery verifying state */}
        {verifying && !actionPending && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '1.8rem', marginBottom: 8, display: 'inline-block' }}
            >⟳</motion.div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--violet)', marginBottom: 4 }}>
              Recovery Verifying…
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {targetNode ? `Monitoring ${targetNode.name} for stability` : 'Monitoring node stability'}
            </div>
          </div>
        )}

        {/* Resolved state */}
        {resolved && actionResult && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>✓</div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--green)' }}>
              Recovery Verified
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 3 }}>
              Operator response: <span style={{ color: 'var(--amber)', fontWeight: 700 }}>
                {actionResult.reactionTime?.toFixed(1)}s
              </span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LiveMetric({ label, value, color, warn }) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 7,
      background: warn ? 'rgba(255,51,85,0.06)' : 'var(--bg-elevated)',
      border: `1px solid ${warn ? 'rgba(255,51,85,0.15)' : 'var(--border)'}`,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color }}>{value}</div>
    </div>
  );
}

function SmallStat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  );
}
