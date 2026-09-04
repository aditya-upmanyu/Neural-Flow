import { motion, AnimatePresence } from 'framer-motion';

export default function AIExplainer({ decision, nodes, onClose }) {
  if (!decision) return null;

  const from = nodes.find(n => n.id === decision.fromNodeId || n.nodeId === decision.fromNodeId);
  const to   = nodes.find(n => n.id === decision.toNodeId   || n.nodeId === decision.toNodeId);

  const handleDownloadReport = () => {
    const before = decision.beforeWeights || [];
    const after  = decision.afterWeights  || [];

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>NeuralFlow — AI Incident Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,sans-serif;background:#07070e;color:#e8e8f0;padding:40px;line-height:1.6;font-size:13px}
  .brand{font-size:20px;font-weight:900;color:#00d4ff;letter-spacing:.08em}
  .sub{font-size:11px;color:#5a5a78;margin-top:3px;margin-bottom:32px;letter-spacing:.06em}
  h2{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#5a5a78;border-bottom:1px solid #1a1a2e;padding-bottom:5px;margin:24px 0 12px}
  .card{background:#0f0f17;border:1px solid #1a1a2e;border-radius:8px;padding:14px 18px;margin-bottom:10px}
  .row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #0f0f17}
  .row:last-child{border-bottom:none}
  .lbl{color:#5a5a78;font-size:12px}.val{font-weight:700;color:#f0f0f8;font-size:12px}
  .tag-red{background:rgba(255,51,85,.15);color:#ff3355;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700}
  .tag-green{background:rgba(0,232,122,.15);color:#00e87a;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700}
  .tag-cyan{background:rgba(0,212,255,.1);color:#00d4ff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
  th{color:#5a5a78;font-weight:600;text-align:left;padding:7px 10px;border-bottom:1px solid #1a1a2e}
  td{padding:7px 10px;color:#e8e8f0;border-bottom:1px solid #0f0f17}
  .reason{padding:9px 12px;background:#0f0f17;border-left:2px solid #7c5cfc;border-radius:3px;font-size:12px;margin-bottom:7px;color:#9898b0}
  .footer{margin-top:36px;font-size:10px;color:#3a3a52;text-align:center;border-top:1px solid #1a1a2e;padding-top:12px}
  @media print{body{background:#fff;color:#111;padding:20px}.card{background:#f8f8ff;border-color:#d0d0e8}.brand{color:#0077cc}.reason{background:#f4f4ff;border-color:#5533cc}.lbl{color:#888}.val{color:#111}.footer{color:#aaa}}
</style>
</head>
<body>
<div class="brand">NEURALFLOW</div>
<div class="sub">AUTONOMOUS AI INCIDENT REPORT · ${new Date().toLocaleString()} · Decision Score: ${decision.confidence}%</div>

<h2>DECISION SUMMARY</h2>
<div class="card">
  <div class="row"><span class="lbl">Incident Action</span><span class="val">Autonomous Traffic Reroute</span></div>
  <div class="row"><span class="lbl">Source Node (Degraded)</span><span><span class="tag-red">${from?.name || 'Node '+decision.fromNodeId}</span></span></div>
  <div class="row"><span class="lbl">Target Node (Selected)</span><span><span class="tag-green">${to?.name || 'Node '+decision.toNodeId}</span></span></div>
  <div class="row"><span class="lbl">Decision Score</span><span class="val">${decision.confidence}% <span style="font-size:10px;color:#5a5a78">(candidate selection heuristic)</span></span></div>
  <div class="row"><span class="lbl">Response Time</span><span class="val">${decision.responseTimeMs}ms</span></div>
  <div class="row"><span class="lbl">Timestamp</span><span class="val">${decision.timestamp}</span></div>
</div>

<h2>WHY NODE WAS FLAGGED</h2>
${(decision.reasons || []).map(r => `<div class="reason">${r}</div>`).join('')}

<h2>CANDIDATE NODES EVALUATED</h2>
<div class="grid2">
${(decision.comparison || []).filter(n => n.nodeId !== decision.fromNodeId).map(n => `
<div class="card">
  <div class="row"><span class="lbl">Node</span><span class="val">${n.name} (${n.nodeId})</span></div>
  <div class="row"><span class="lbl">Health</span><span class="val">${n.health}%</span></div>
  <div class="row"><span class="lbl">Latency</span><span class="val">${n.latency}ms</span></div>
  <div class="row"><span class="lbl">Load (RPS)</span><span class="val">${n.requestsPerSecond}</span></div>
  <div class="row"><span class="lbl">Error Rate</span><span class="val">${n.errorRate}%</span></div>
  <div class="row"><span class="lbl">Decision</span><span>${n.nodeId === decision.toNodeId ? '<span class="tag-green">SELECTED</span>' : '<span class="tag-cyan">EVALUATED</span>'}</span></div>
</div>`).join('')}
</div>

<h2>TRAFFIC REDISTRIBUTION</h2>
<table>
<thead><tr><th>Node</th><th>Before</th><th>After</th><th>Delta</th></tr></thead>
<tbody>
${before.map(b => {
  const a = after.find(x => x.nodeId === b.nodeId) || b;
  const diff = a.traffic - b.traffic;
  return `<tr><td>${b.nodeId}</td><td>${b.traffic}%</td><td>${a.traffic}%</td><td style="color:${diff > 0 ? '#00e87a' : diff < 0 ? '#ff3355' : '#9898b0'}">${diff > 0 ? '+' : ''}${diff}%</td></tr>`;
}).join('')}
</tbody>
</table>

<h2>EVALUATION NOTES</h2>
${(decision.alternatives || []).map(a => `<div class="reason">${a}</div>`).join('')}

<div class="footer">NeuralFlow V5 · Autonomous Infrastructure Orchestration · AI-generated incident report</div>
<script>window.onload=()=>window.print()</script>
</body></html>`);
    win.document.close();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(2,2,6,0.88)', backdropFilter: 'blur(10px)',
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 660,
            maxHeight: '92vh', overflowY: 'auto', overflowX: 'hidden',
            background: 'var(--bg-card)',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 60px rgba(0,212,255,0.06)',
          }}
          className="thin-scroll"
        >
          {/* top accent */}
          <div style={{
            height: 1,
            background: 'linear-gradient(90deg,transparent,var(--cyan),transparent)',
            opacity: 0.6,
          }} />

          <div style={{ padding: '20px 24px 24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'var(--cyan)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: 5 }}>
                  AUTONOMOUS DECISION · AI INCIDENT REPORT
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Traffic Reroute Executed
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  {decision.timestamp} · Decision Score: <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{decision.confidence}%</span> · Response: <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{decision.responseTimeMs}ms</span>
                </div>
              </div>
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-muted)',
                fontSize: '1rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            {/* Route */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', borderRadius: 10,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-light)',
              marginBottom: 18,
            }}>
              <NodeTag name={from?.name || `Node ${decision.fromNodeId}`} type="source" />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--cyan)' }}>→</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>REDIRECTED</div>
              </div>
              <NodeTag name={to?.name || `Node ${decision.toNodeId}`} type="target" />
            </div>

            {/* Why flagged */}
            <Section label="WHY NODE WAS FLAGGED" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              {(decision.reasons || []).map((r, i) => (
                <motion.div key={i}
                  initial={{ x: -12, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.06 }}
                  style={{
                    display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 8,
                    background: 'var(--bg-elevated)',
                    borderLeft: '2px solid var(--red)',
                    fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: 'var(--red)', flexShrink: 0 }}>⚠</span>
                  {r}
                </motion.div>
              ))}
            </div>

            {/* Candidates */}
            {(decision.comparison || []).filter(n => n.nodeId !== decision.fromNodeId).length > 0 && (
              <>
                <Section label="CANDIDATES EVALUATED" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
                  {(decision.comparison || []).filter(n => n.nodeId !== decision.fromNodeId).map((n, i) => {
                    const sel = n.nodeId === decision.toNodeId;
                    return (
                      <motion.div key={n.nodeId}
                        initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        style={{
                          padding: 12, borderRadius: 8,
                          background: sel ? 'rgba(0,232,122,0.05)' : 'var(--bg-elevated)',
                          border: sel ? '1px solid rgba(0,232,122,0.2)' : '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>{n.name}</span>
                          <span style={{
                            fontSize: '0.6rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                            background: sel ? 'rgba(0,232,122,0.12)' : 'rgba(255,255,255,0.05)',
                            color: sel ? 'var(--green)' : 'var(--text-muted)',
                          }}>{sel ? '✓ SELECTED' : 'EVALUATED'}</span>
                        </div>
                        <SmallMet label="Health"  val={`${n.health}%`} />
                        <SmallMet label="Latency" val={`${n.latency}ms`} />
                        <SmallMet label="Load"    val={`${n.requestsPerSecond} RPS`} />
                        <SmallMet label="Errors"  val={`${n.errorRate}%`} />
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Traffic shift */}
            {(decision.beforeWeights || []).length > 0 && (
              <>
                <Section label="TRAFFIC REDISTRIBUTION" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 18 }}>
                  {(decision.beforeWeights || []).map((bw, i) => {
                    const aw = (decision.afterWeights || [])[i] || bw;
                    const diff = aw.traffic - bw.traffic;
                    const isFrom = bw.nodeId === decision.fromNodeId;
                    const isTo   = bw.nodeId === decision.toNodeId;
                    return (
                      <div key={bw.nodeId} style={{
                        padding: '10px 12px', borderRadius: 8, textAlign: 'center',
                        background: 'var(--bg-elevated)',
                        border: `1px solid ${isFrom ? 'rgba(255,51,85,0.2)' : isTo ? 'rgba(0,232,122,0.2)' : 'var(--border)'}`,
                      }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.08em' }}>
                          NODE {bw.nodeId}
                        </div>
                        <div style={{
                          fontSize: '1.3rem', fontWeight: 800,
                          fontFamily: 'var(--font-mono)',
                          color: isFrom ? 'var(--red)' : isTo ? 'var(--green)' : 'var(--text-primary)',
                        }}>
                          {aw.traffic}%
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          {bw.traffic}% → {aw.traffic}%
                        </div>
                        <div style={{
                          fontSize: '0.68rem', fontWeight: 700, marginTop: 2,
                          color: diff < 0 ? 'var(--red)' : diff > 0 ? 'var(--green)' : 'var(--text-muted)',
                        }}>
                          {diff > 0 ? '+' : ''}{diff}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* Alternatives */}
            {(decision.alternatives || []).length > 0 && (
              <>
                <Section label="EVALUATION NOTES" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
                  {decision.alternatives.map((alt, i) => (
                    <div key={i} style={{
                      padding: '8px 12px', borderRadius: 7,
                      background: 'var(--bg-elevated)',
                      fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5,
                      borderLeft: '2px solid var(--border-light)',
                    }}>
                      {alt}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} className="nf-btn nf-btn-ghost" style={{ flex: 1 }}>
                Close
              </button>
              <button onClick={handleDownloadReport} className="nf-btn nf-btn-primary" style={{ flex: 1.6 }}>
                📄 Download PDF Report
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function NodeTag({ name, type }) {
  const isSource = type === 'source';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em',
        fontWeight: 600, marginBottom: 5, textTransform: 'uppercase',
      }}>
        {isSource ? 'SOURCE' : 'TARGET'}
      </div>
      <div style={{
        padding: '5px 14px', borderRadius: 6, fontWeight: 700, fontSize: '0.82rem',
        background: isSource ? 'rgba(255,51,85,0.1)' : 'rgba(0,232,122,0.1)',
        color: isSource ? 'var(--red)' : 'var(--green)',
        border: `1px solid ${isSource ? 'rgba(255,51,85,0.2)' : 'rgba(0,232,122,0.2)'}`,
      }}>
        {name}
      </div>
    </div>
  );
}

function Section({ label }) {
  return (
    <div style={{
      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em',
      color: 'var(--text-muted)', textTransform: 'uppercase',
      marginBottom: 8, paddingBottom: 6,
      borderBottom: '1px solid var(--border)',
    }}>
      {label}
    </div>
  );
}

function SmallMet({ label, val }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3,
    }}>
      <span>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{val}</span>
    </div>
  );
}
