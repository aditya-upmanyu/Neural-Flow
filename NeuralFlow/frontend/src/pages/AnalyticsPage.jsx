// NeuralFlow V5 - Analytics Page with Prediction Accuracy and Attack Heatmap
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useStore from '../store/useStore';

export default function AnalyticsPage() {
  const nodes = useStore(state => state.nodes);
  const events = useStore(state => state.events);
  const stats = useStore(state => state.stats);

  // Latency trend: derive from real events (AI_DECISION or METRIC_SPIKE carry node latency context)
  // Fall back to last-known node latency repeated across 24 time slots so the chart is never random
  const latencyData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const entry = { time: `${i}:00` };
      nodes.forEach((node, ni) => {
        // Use real node latency as a stable baseline; no Math.random()
        entry[`node${ni + 1}`] = node.latency ?? 0;
      });
      return entry;
    });
  }, [nodes]);

  // Status distribution — store normalises status to lowercase
  const statusData = [
    { name: 'Healthy', value: nodes.filter(n => (n.status || '').toLowerCase() === 'healthy').length, color: '#10b981' },
    { name: 'Warning', value: nodes.filter(n => (n.status || '').toLowerCase() === 'warning').length, color: '#f59e0b' },
    { name: 'Critical', value: nodes.filter(n => (n.status || '').toLowerCase() === 'critical').length, color: '#ef4444' }
  ];

  // Node performance — real telemetry
  const performanceData = nodes.map(node => ({
    name: node.name,
    health: node.health,
    cpu: node.cpu,
    memory: node.memory
  }));

  // AI prediction accuracy — derived from real store stats when available
  const { total: predTotal, correct: predCorrect, falsePositives: predFP } =
    stats.predictions || { total: 0, correct: 0, falsePositives: 0 };
  const hasPredStats = predTotal > 0;

  // Attack heatmap (7 days x 24 hours)
  // Values are zeroed — real session data would require persistent attack history.
  // The heatmap shows the pattern structure; individual cell values filled by real
  // eventStore counts once that data is persisted across sessions.
  const attackHeatmap = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
      hour: hour,
      attacks: 0
    }))
  ).flat();

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          marginBottom: 8,
          color: 'var(--text-primary)'
        }}>
          Analytics Dashboard
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '0.95rem'
        }}>
          Comprehensive system metrics and AI performance analysis
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 20,
        marginBottom: 32
      }}>
        <SummaryCard
          title="Total Events"
          value={events.length}
          icon="📊"
          color="var(--accent-primary)"
        />
        <SummaryCard
          title="Attacks Blocked"
          value={stats.attacksBlocked || 0}
          icon="🛡️"
          color="var(--accent-success)"
        />
        <SummaryCard
          title="Avg Response Time"
          value={`${((stats.avgResponseTime || 0.2) * 1000).toFixed(0)}ms`}
          icon="⚡"
          color="var(--accent-warning)"
        />
        <SummaryCard
          title="System Uptime"
          value={`${(stats.uptime || 99.9).toFixed(1)}%`}
          icon="⏱️"
          color="var(--accent-primary)"
        />
      </div>

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth >= 1200 ? 'repeat(2, 1fr)' : '1fr',
        gap: 24,
        marginBottom: 24
      }}>
        {/* Latency Trends */}
        <ChartCard title="📈 Latency Trends (current snapshot)">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="time" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" unit="ms" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8
                }}
              />
              <Legend />
              {nodes.map((node, ni) => {
                const colors = ['#00ffd1', '#7c3aed', '#f59e0b', '#ef4444', '#a855f7'];
                return (
                  <Area
                    key={node.nodeId}
                    type="monotone"
                    dataKey={`node${ni + 1}`}
                    stroke={colors[ni % colors.length]}
                    fill={`${colors[ni % colors.length]}22`}
                    name={node.name}
                    strokeWidth={2}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status Distribution */}
        <ChartCard title="🎯 Status Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Node Performance */}
        <ChartCard title="💻 Node Performance Comparison">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8
                }}
              />
              <Legend />
              <Bar dataKey="health" fill="#10b981" name="Health %" />
              <Bar dataKey="cpu" fill="#00ffd1" name="CPU %" />
              <Bar dataKey="memory" fill="#f59e0b" name="Memory %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* AI Prediction Accuracy */}
        <ChartCard title="🤖 AI Prediction Accuracy">
          {hasPredStats ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { label: 'Correct', value: predCorrect },
                { label: 'Incorrect', value: predTotal - predCorrect - predFP },
                { label: 'False Pos', value: predFP }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="label" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 8
                  }}
                />
                <Bar dataKey="value" fill="#00ffd1" name="Predictions" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 300,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              gap: 12
            }}>
              <div style={{ fontSize: '2.5rem' }}>📊</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>No prediction data yet</div>
              <div style={{ fontSize: '0.8rem', textAlign: 'center', maxWidth: 260 }}>
                Prediction stats accumulate once the AI model starts making decisions this session.
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Attack Heatmap */}
      <ChartCard title="🔥 Attack Frequency Heatmap (7 Days × 24 Hours)">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'auto repeat(24, 1fr)',
          gap: 2,
          fontSize: '0.7rem',
          marginTop: 20
        }}>
          {/* Hour labels */}
          <div />
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              {i}
            </div>
          ))}

          {/* Heatmap cells */}
          {Array.from({ length: 7 }, (_, day) => (
            <>
              <div key={`day-${day}`} style={{ padding: '4px 8px', color: 'var(--text-secondary)' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]}
              </div>
              {Array.from({ length: 24 }, (_, hour) => {
                const attacks = attackHeatmap.find(h => h.day === ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day] && h.hour === hour)?.attacks || 0;
                const intensity = attacks / 5;
                return (
                  <motion.div
                    key={`${day}-${hour}`}
                    whileHover={{ scale: 1.2 }}
                    style={{
                      aspectRatio: '1',
                      background: `rgba(239, 68, 68, ${intensity})`,
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={`${attacks} attacks`}
                  >
                    {attacks > 0 && <span style={{ fontSize: '0.6rem' }}>{attacks}</span>}
                  </motion.div>
                );
              })}
            </>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

// Helper Components
function SummaryCard({ title, value, icon, color }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
      <div style={{
        fontSize: '2rem',
        fontWeight: 800,
        color: color,
        marginBottom: 4
      }}>
        {value}
      </div>
      <div style={{
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        fontWeight: 600
      }}>
        {title}
      </div>
    </motion.div>
  );
}

function ChartCard({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
        padding: 24
      }}
    >
      <h3 style={{
        fontSize: '1.1rem',
        fontWeight: 700,
        marginBottom: 20,
        color: 'var(--text-primary)'
      }}>
        {title}
      </h3>
      {children}
    </motion.div>
  );
}
