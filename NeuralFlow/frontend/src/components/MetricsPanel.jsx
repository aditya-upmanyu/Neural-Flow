export default function MetricsPanel({ stats, manualTimer, nodes }) {
  const avgLatency = nodes.length
    ? Math.round(nodes.reduce((s, n) => s + (n.latency || 0), 0) / nodes.length) : 0;
  const aiLatency  = nodes.find(n => n.status === 'healthy')?.latency || 0;
  const failedReqs = Math.floor(manualTimer * 12);

  const rows = [
    { label: 'Reaction Time',    manual: `${manualTimer.toFixed(1)}s`,  ai: '<1s (auto)' },
    { label: 'Avg Latency',      manual: `${avgLatency}ms`,              ai: `${aiLatency}ms` },
    { label: 'Failed Requests',  manual: `~${failedReqs}`,               ai: '0' },
    { label: 'Human Errors',     manual: 'Possible',                     ai: 'None' },
  ];

  return (
    <div style={{
      padding: 16, borderRadius: 14,
      background: 'var(--bg-card)', border: '1px solid var(--border)'
    }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--neon-blue)', marginBottom: 12 }}>
        📊 METRICS COMPARISON
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8, fontSize: 11, fontWeight: 700 }}>
        <div style={{ color: 'var(--text-muted)' }}>Metric</div>
        <div style={{ textAlign: 'center', color: 'var(--neon-yellow)' }}>👤 Manual</div>
        <div style={{ textAlign: 'center', color: 'var(--neon-blue)'   }}>🤖 AI</div>
      </div>

      {rows.map(row => (
        <div key={row.label} style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
          fontSize: 12, padding: '8px 0',
          borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ color: 'var(--text-muted)' }}>{row.label}</div>
          <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--neon-orange)' }}>
            {row.manual}
          </div>
          <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--neon-green)' }}>
            {row.ai}
          </div>
        </div>
      ))}
    </div>
  );
}
