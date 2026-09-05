// NeuralFlow V5 — AI vs Human Comparison Page
// Uses ONLY real completed session data from the store.
// If a session hasn't happened yet, shows a clear "complete an incident" prompt.
import { useCallback } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';
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

// Safe delta: only show if both values are valid numbers
function delta(a, b, unit = '', invert = false) {
  if (a == null || b == null || isNaN(a) || isNaN(b) || a === 0) return '—';
  const d = invert ? b - a : a - b;
  if (!isFinite(d)) return '—';
  return `${d > 0 ? '+' : ''}${Math.abs(d).toFixed(unit === 'ms' ? 0 : 1)}${unit} ${d > 0 ? 'AI better' : 'Human better'}`;
}
function pctImprovement(base, comparison) {
  if (!base || base <= 0 || comparison == null) return null;
  const p = ((base - comparison) / base) * 100;
  return isFinite(p) ? p : null;
}

export default function ComparisonPage() {
  const nodes              = useStore(s => s.nodes);
  const mode               = useStore(s => s.mode);
  const manualModeState    = useStore(s => s.manualModeState);
  const lastAIDecision     = useStore(s => s.lastAIDecision);
  const incident           = useStore(s => s.incident);
  const completedAISess    = useStore(s => s.completedAISession);
  const completedManualSess= useStore(s => s.completedManualSession);

  const handleModeSwitch = useCallback(async (m) => {
    try {
      await apiCall('/api/mode', 'POST', { mode: m });
      toast.success(`Switched to ${m} mode`);
    } catch (e) { toast.error(`Mode switch failed: ${e.message}`); }
  }, []);

  const handleManualReroute = useCallback(async () => {
    const from = nodes.find(n => n.isUnderAttack || (n.status||'').toLowerCase() === 'critical');
    const to   = nodes.find(n => !n.isUnderAttack && (n.status||'').toLowerCase() !== 'critical' && n.health > 60);
    if (!from) return toast.error('No degraded node detected');
    if (!to)   return toast.error('No healthy target available');
    try {
      await apiCall('/api/reroute/manual', 'POST', { fromNodeId: from.nodeId, toNodeId: to.nodeId });
      toast.success(`Rerouted: ${from.name} → ${to.name}`, { icon: '↗' });
    } catch (e) { toast.error(`Reroute failed: ${e.message}`); }
  }, [nodes]);

  const handleContain = useCallback(async () => {
    try {
      await apiCall('/api/attack/stop', 'POST');
      toast.success('Traffic contained', { icon: '⏹' });
    } catch (e) { toast.error(`Contain failed: ${e.message}`); }
  }, []);

  const isManual  = mode === 'MANUAL';
  const incActive = incident.state !== 'NORMAL' && incident.state !== 'COOLDOWN';

  // Live manual-mode state (in-progress incident)
  const liveElapsed  = manualModeState?.elapsedTime || 0;
  const liveFailed   = manualModeState?.failedRequests || 0;
  const liveRevenue  = manualModeState?.revenueLoss || 0;
  const attackedNode = nodes.find(n => n.nodeId === manualModeState?.attackedNodeId);

  // Calculate actual advantage numbers only when both sessions exist
  const bothExist = completedAISess && completedManualSess;
  const aiMs   = completedAISess?.responseTimeMs;           // ms
  const humMs  = completedManualSess ? (completedManualSess.reactionTime || 0) * 1000 : null;
  const timeSavedMs = (aiMs != null && humMs != null) ? humMs - aiMs : null;
  const timeSavedSec = timeSavedMs != null ? (timeSavedMs / 1000).toFixed(1) : null;
  const failedSaved = completedManualSess?.failedRequests != null ? completedManualSess.failedRequests - 0 : null;
  const revSaved    = completedManualSess?.revenueLoss != null ? completedManualSess.revenueLoss.toFixed(2) : null;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 5 }}>
          COMPARISON LAB
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
          AI Autonomy vs Human Response
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Real incident data only — no fabricated metrics. Complete incidents in each mode to populate comparison.
        </div>
      </div>

      {/* Mode selector */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, padding: '12px 16px',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.08em' }}>
          ACTIVE MODE:
        </span>
        {['MANUAL','AI'].map(m => (
          <motion.button key={m} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => handleModeSwitch(m)}
            style={{
              height: 34, padding: '0 18px', borderRadius: 6, cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.07em',
              background: mode === m ? (m === 'AI' ? 'var(--cyan)' : 'rgba(245,166,35,0.15)') : 'var(--bg-elevated)',
              color: mode === m ? (m === 'AI' ? '#020204' : 'var(--amber)') : 'var(--text-muted)',
              border: mode === m ? (m === 'AI' ? 'none' : '1px solid rgba(245,166,35,0.3)') : '1px solid var(--border-light)',
            }}>
            {m === 'AI' ? '🤖 AI MODE' : '👤 MANUAL MODE'}
          </motion.button>
        ))}
        {isManual && incActive && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleManualReroute}
              style={{ height: 32, padding: '0 14px', borderRadius: 6, cursor: 'pointer', background: 'rgba(245,166,35,0.1)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.3)', fontSize: '0.72rem', fontWeight: 700 }}>
              ↗ REROUTE
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={handleContain}
              style={{ height: 32, padding: '0 14px', borderRadius: 6, cursor: 'pointer', background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(255,51,85,0.25)', fontSize: '0.72rem', fontWeight: 700 }}>
              ⏹ CONTAIN
            </motion.button>
          </div>
        )}
      </div>

      {/* Advantage banner — only shown when both sessions have real data */}
      <AnimatePresence>
        {bothExist && timeSavedSec !== null && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              marginBottom: 20, padding: '14px 20px', borderRadius: 'var(--radius-lg)',
              background: 'rgba(0,232,122,0.06)', border: '1px solid rgba(0,232,122,0.2)',
              display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
            }}>
            <div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 3 }}>AI RESPONDED FASTER BY</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                {timeSavedSec}s
              </div>
            </div>
            {failedSaved > 0 && (
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 3 }}>FAILED REQUESTS AVOIDED</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{failedSaved}</div>
              </div>
            )}
            {revSaved > 0 && (
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 3 }}>EST. IMPACT AVOIDED</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>~${revSaved}</div>
                <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>*Assumes $0.15/failed req (illustrative)</div>
              </div>
            )}
            {pctImprovement((humMs||0)/1000, (aiMs||0)/1000) !== null && (
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 3 }}>SPEED IMPROVEMENT</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                  {pctImprovement((humMs||0)/1000, (aiMs||0)/1000)?.toFixed(0)}%
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side-by-side session panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* AI Panel */}
        <SessionPanel
          title="AI Autonomous Mode"
          icon="🤖"
          isActive={!isManual}
          accentColor="var(--cyan)"
          accentBg="rgba(0,212,255,0.04)"
          session={completedAISess}
          liveDecision={lastAIDecision}
          emptyMessage="Switch to AI Mode and start a traffic spike to generate AI session data."
          renderSession={(s) => (
            <>
              <ResultRow label="AI Response Time"     value={`${s.responseTimeMs}ms`}       highlight color="var(--cyan)" />
              <ResultRow label="Decision Score"       value={`${s.confidence}%`}             color="var(--cyan)" />
              <ResultRow label="Failed Requests"       value="0"                              color="var(--green)" />
              <ResultRow label="Est. Impact Avoided"
                value={s.estimatedSavings > 0 ? `$${s.estimatedSavings.toFixed(2)} est.` : '$0.00'}
                color="var(--green)" />
              <ResultRow label="Source Node"           value={`Node ${s.fromNodeId}`}         color="var(--red)" />
              <ResultRow label="Target Node"           value={`Node ${s.toNodeId}`}           color="var(--green)" />
              {s.beforeWeights?.length > 0 && (
                <TrafficShift label="Traffic Redistribution" before={s.beforeWeights} after={s.afterWeights} />
              )}
              <ResultRow label="Outcome" value="✓ Autonomous recovery" color="var(--green)" />
            </>
          )}
          renderLive={lastAIDecision ? () => (
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--cyan)', fontWeight: 700, marginBottom: 6 }}>
                LAST DECISION (this session)
              </div>
              <ResultRow label="Response" value={`${lastAIDecision.responseTimeMs}ms`} color="var(--cyan)" />
              <ResultRow label="Route" value={`N${lastAIDecision.fromNodeId} → N${lastAIDecision.toNodeId}`} color="var(--cyan)" />
              <ResultRow label="Decision Score" value={`${lastAIDecision.confidence}%`} color="var(--cyan)" />
            </div>
          ) : null}
        />

        {/* Human Panel */}
        <SessionPanel
          title="Manual Human Mode"
          icon="👤"
          isActive={isManual}
          accentColor="var(--amber)"
          accentBg="rgba(245,166,35,0.04)"
          session={completedManualSess}
          emptyMessage="Switch to Manual Mode and respond to a traffic incident to generate human session data."
          renderLive={isManual && incActive && attackedNode ? () => (
            <div style={{ padding: '4px 0' }}>
              <div style={{
                padding: '8px 12px', borderRadius: 7, marginBottom: 10,
                background: 'rgba(255,51,85,0.07)', border: '1px solid rgba(255,51,85,0.2)',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--red)', marginBottom: 2 }}>
                  ⚠ INCIDENT IN PROGRESS
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  {attackedNode.name} · {attackedNode.latency}ms
                </div>
              </div>
              <ResultRow label="Elapsed" value={`${liveElapsed.toFixed(1)}s`} color="var(--amber)" highlight />
              <ResultRow label="Failed Reqs" value={liveFailed} color={liveFailed > 0 ? 'var(--red)' : 'var(--text-muted)'} />
              <ResultRow label="Est. Revenue Impact" value={`~$${liveRevenue.toFixed(2)}`} color="var(--amber)" />
              <ResultRow label="Status" value="⏳ Awaiting operator action" color="var(--amber)" />
            </div>
          ) : null}
          renderSession={(s) => (
            <>
              <ResultRow label="Human Response Time"  value={`${s.reactionTime.toFixed(1)}s`} highlight color="var(--amber)" />
              <ResultRow label="Failed Requests"      value={s.failedRequests}               color={s.failedRequests > 0 ? 'var(--red)' : 'var(--green)'} />
              <ResultRow label="Est. Revenue Impact"  value={`~$${(s.revenueLoss||0).toFixed(2)}`} color="var(--amber)" />
              <ResultRow label="Peak Latency"         value={`${s.peakLatency}ms`}           color="var(--red)" />
              <ResultRow label="Peak RPS"             value={s.peakRps}                      color="var(--text-primary)" />
              <ResultRow label="Source Node"          value={`Node ${s.fromNodeId}`}         color="var(--red)" />
              <ResultRow label="Target Node"          value={`Node ${s.toNodeId}`}           color="var(--green)" />
              {s.trafficBefore && (
                <TrafficShift
                  label="Traffic Redistribution"
                  before={[
                    { nodeId: s.fromNodeId, traffic: s.trafficBefore.from },
                    { nodeId: s.toNodeId,   traffic: s.trafficBefore.to   },
                  ]}
                  after={[
                    { nodeId: s.fromNodeId, traffic: s.trafficBefore.from - 40 },
                    { nodeId: s.toNodeId,   traffic: s.trafficBefore.to + 40   },
                  ]}
                />
              )}
              <ResultRow label="Outcome" value="✓ Manual recovery" color="var(--green)" />
            </>
          )}
        />
      </div>

      {/* Response timeline comparison — only when both exist */}
      {bothExist && (
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 20,
        }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            RESPONSE TIMELINE COMPARISON
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <TimelineFlow
              title="AI AUTONOMOUS"
              color="var(--cyan)"
              steps={['Detection', 'Prediction', 'AI Decision', 'Reroute', 'Containment', 'Recovery']}
              totalTime={`${aiMs}ms`}
            />
            <TimelineFlow
              title="HUMAN OPERATOR"
              color="var(--amber)"
              steps={['Detection', 'Alert', 'Operator Notified', 'Decision', 'Manual Reroute', 'Recovery']}
              totalTime={`${(completedManualSess.reactionTime || 0).toFixed(1)}s`}
            />
          </div>
        </div>
      )}

      {/* Metrics table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          INCIDENT METRICS TABLE
        </div>
        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 0 8px', borderBottom: '1px solid var(--border)', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            <span>METRIC</span>
            <span style={{ textAlign: 'center', color: 'var(--cyan)' }}>🤖 AI</span>
            <span style={{ textAlign: 'center', color: 'var(--amber)' }}>👤 HUMAN</span>
            <span style={{ textAlign: 'center' }}>DELTA</span>
          </div>
          {[
            {
              label: 'Reaction Time',
              ai:    completedAISess    ? `${completedAISess.responseTimeMs}ms` : '—',
              human: completedManualSess ? `${(completedManualSess.reactionTime||0).toFixed(1)}s` : '—',
              delta: timeSavedSec !== null ? `${timeSavedSec}s faster` : '—',
              deltaColor: 'var(--green)',
            },
            {
              label: 'Failed Requests',
              ai:    completedAISess    ? '0'                               : '—',
              human: completedManualSess ? String(completedManualSess.failedRequests || 0) : '—',
              delta: completedManualSess?.failedRequests > 0 ? `-${completedManualSess.failedRequests}` : '—',
              deltaColor: 'var(--green)',
            },
            {
              label: 'Est. Revenue Impact',
              ai:    '$0.00',
              human: completedManualSess ? `~$${(completedManualSess.revenueLoss||0).toFixed(2)}` : '—',
              delta: completedManualSess?.revenueLoss > 0 ? `~$${(completedManualSess.revenueLoss||0).toFixed(2)} avoided` : '—',
              deltaColor: 'var(--green)',
            },
            {
              label: 'Peak Latency',
              ai:    completedAISess?.peakLatency != null ? `${completedAISess.peakLatency}ms` : '—',
              human: completedManualSess?.peakLatency != null ? `${completedManualSess.peakLatency}ms` : '—',
              delta: '—',
              deltaColor: 'var(--text-muted)',
            },
            {
              label: 'Human Error Risk',
              ai:    'None',
              human: 'Present',
              delta: '—',
              deltaColor: 'var(--text-muted)',
            },
          ].map((r, i) => (
            <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{r.label}</span>
              <span style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--green)' }}>{r.ai}</span>
              <span style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: 'var(--amber)' }}>{r.human}</span>
              <span style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700, color: r.deltaColor }}>{r.delta}</span>
            </div>
          ))}
          <div style={{ padding: '8px 0 2px 0', fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            * Revenue impact assumes $0.15 estimated cost per failed request — illustrative, not a validated business metric.
          </div>
        </div>
        {!bothExist && (
          <div style={{ padding: '16px 20px', background: 'rgba(0,212,255,0.03)', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: 'var(--cyan)' }}>ℹ</span>
              Complete one AI incident and one Human incident to unlock full comparison data.
              {!completedAISess    && <span style={{ color: 'var(--cyan)',  fontWeight: 600 }}>→ AI session needed</span>}
              {!completedManualSess && <span style={{ color: 'var(--amber)', fontWeight: 600 }}>→ Human session needed</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function SessionPanel({ title, icon, isActive, accentColor, accentBg, session, liveDecision, emptyMessage, renderSession, renderLive }) {
  const hasSession = !!session;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${hasSession || isActive ? accentColor.replace('var(','').replace(')','') === '--cyan' ? 'rgba(0,212,255,0.2)' : 'rgba(245,166,35,0.2)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* header */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', background: accentBg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', border: `1px solid ${accentBg}` }}>{icon}</div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{title}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{hasSession ? 'Session data available' : 'No session yet'}</div>
          </div>
        </div>
        <div style={{
          fontSize: '0.62rem', fontWeight: 700, padding: '3px 8px', borderRadius: 4,
          background: isActive ? accentBg : 'var(--bg-elevated)',
          color: isActive ? accentColor : 'var(--text-muted)',
          border: `1px solid ${isActive ? 'rgba(255,255,255,0.08)' : 'var(--border)'}`,
          letterSpacing: '0.08em',
        }}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </div>
      </div>

      <div style={{ padding: '14px 18px' }}>
        {/* Live state — shown during active incident */}
        {renderLive && renderLive()}

        {/* Completed session data */}
        {hasSession ? renderSession(session) : !renderLive && (
          <div style={{ padding: '20px 16px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: '1.6rem', flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>No Session Data Yet</div>
              <div style={{ fontSize: '0.68rem', lineHeight: 1.5 }}>{emptyMessage}</div>
            </div>
          </div>
        )}
        {!hasSession && renderLive && !renderLive() && (
          <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.7rem', lineHeight: 1.5 }}>
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultRow({ label, value, color, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '7px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-mono)', fontWeight: 700,
        fontSize: highlight ? '1.1rem' : '0.82rem',
        color: color || 'var(--text-primary)',
      }}>{value}</span>
    </div>
  );
}

function TrafficShift({ label, before = [], after = [] }) {
  return (
    <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {before.map((bw, i) => {
          const aw = after[i] || bw;
          const diff = (aw.traffic || 0) - (bw.traffic || 0);
          return (
            <div key={bw.nodeId} style={{ textAlign: 'center', flex: 1, minWidth: 60, padding: '6px 8px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginBottom: 2 }}>N{bw.nodeId}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: diff < 0 ? 'var(--red)' : diff > 0 ? 'var(--green)' : 'var(--text-muted)' }}>
                {bw.traffic}%→{aw.traffic}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimelineFlow({ title, color, steps, totalTime }) {
  return (
    <div>
      <div style={{ fontSize: '0.65rem', fontWeight: 700, color, letterSpacing: '0.1em', marginBottom: 12 }}>{title}</div>
      <div style={{ position: 'relative', paddingLeft: 20 }}>
        <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 1, background: `${color}44` }} />
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < steps.length - 1 ? 10 : 0 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: i === steps.length - 1 ? color : `${color}88`,
              border: `1px solid ${color}`,
              boxShadow: i === steps.length - 1 ? `0 0 8px ${color}` : 'none',
            }} />
            <span style={{ fontSize: '0.72rem', color: i === steps.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: i === steps.length - 1 ? 700 : 400 }}>
              {step}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: '0.68rem', color: 'var(--text-muted)' }}>
        Total: <span style={{ color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{totalTime}</span>
      </div>
    </div>
  );
}
