import { motion } from 'framer-motion';
import { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { exportIncidentPDF, exportIncidentCSV } from '../utils/reportExporter';
import toast from 'react-hot-toast';

export default function IncidentReport({ stats, manualTimer, nodes, attackState }) {
  const [expanded, setExpanded] = useState(false);

  // Calculate metrics
  const avgLatency = nodes.length
    ? Math.round(nodes.reduce((s, n) => s + (n.latency || 0), 0) / nodes.length)
    : 0;
  
  const healthyNode = nodes.find(n => n.status === 'healthy');
  const aiLatency = healthyNode?.latency || 0;
  
  const manualFailedReqs = stats.manual?.failedRequests || Math.floor(manualTimer * 12);
  const aiFailedReqs = stats.ai?.failedRequests || 0;
  
  const manualReactionTime = stats.manual?.reactionTime || manualTimer;
  const aiReactionTime = stats.ai?.reactionTime || 0.2;

  // Calculate cost impact (based on downtime)
  const manualCostPerHour = Math.round(manualReactionTime * 120);
  const aiCostPerHour = Math.round(aiReactionTime * 80);

  // Calculate efficiency improvement
  const timeImprovement = manualReactionTime > 0 
    ? Math.round(((manualReactionTime - aiReactionTime) / manualReactionTime) * 100)
    : 0;

  const metrics = [
    {
      label: 'Reaction Time',
      manual: `${manualReactionTime.toFixed(1)}s`,
      ai: `${aiReactionTime.toFixed(2)}s`,
      unit: 'seconds',
      icon: '⏱️',
      improvement: timeImprovement,
      isLower: true
    },
    {
      label: 'Avg Latency',
      manual: `${avgLatency}ms`,
      ai: `${aiLatency}ms`,
      unit: 'milliseconds',
      icon: '📊',
      improvement: avgLatency > 0 ? Math.round(((avgLatency - aiLatency) / avgLatency) * 100) : 0,
      isLower: true
    },
    {
      label: 'Failed Requests',
      manual: `${manualFailedReqs}`,
      ai: `${aiFailedReqs}`,
      unit: 'requests',
      icon: '❌',
      improvement: manualFailedReqs > 0 ? Math.round(((manualFailedReqs - aiFailedReqs) / manualFailedReqs) * 100) : 0,
      isLower: true
    },
    {
      label: 'Cost Impact',
      manual: `$${manualCostPerHour}/hr`,
      ai: `$${aiCostPerHour}/hr`,
      unit: 'per hour',
      icon: '💰',
      improvement: manualCostPerHour > 0 ? Math.round(((manualCostPerHour - aiCostPerHour) / manualCostPerHour) * 100) : 0,
      isLower: true
    },
    {
      label: 'System Uptime',
      manual: `${Math.max(0, 100 - manualReactionTime * 0.5).toFixed(1)}%`,
      ai: '99.9%',
      unit: 'percentage',
      icon: '✅',
      improvement: 0,
      isLower: false
    },
    {
      label: 'Human Errors',
      manual: 'Possible',
      ai: 'None',
      unit: 'risk level',
      icon: '⚠️',
      improvement: 100,
      isLower: true
    }
  ];

  // Handle PDF export
  const handleExportPDF = async () => {
    toast.loading('Generating PDF...', { id: 'pdf-export' });
    try {
      const incident = {
        id: `comparison-${Date.now()}`,
        state: attackState.active ? 'ACTIVE' : 'RESOLVED',
        startTime: Date.now() - (manualReactionTime * 1000),
        endTime: Date.now(),
        duration: manualReactionTime * 1000,
        affectedNodes: nodes.filter(n => n.status !== 'healthy').map(n => n.name),
        mitigationStrategy: `AI automated response vs Manual intervention. AI achieved ${timeImprovement}% faster response time.`,
        aiDecision: {
          confidence: 0.95,
          reasoning: `Comparison analysis shows AI reduces reaction time from ${manualReactionTime.toFixed(1)}s to ${aiReactionTime.toFixed(2)}s, eliminating ${manualFailedReqs} failed requests.`
        }
      };

      const events = metrics.map((m, i) => ({
        timestamp: Date.now() - (metrics.length - i) * 1000,
        severity: m.improvement > 50 ? 'INFO' : 'WARN',
        message: `${m.label}: Manual ${m.manual} vs AI ${m.ai} (${m.improvement}% improvement)`
      }));

      await exportIncidentPDF(incident, events);
      toast.success('PDF exported successfully', { id: 'pdf-export' });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    }
  };

  // Handle CSV export
  const handleExportCSV = () => {
    toast.loading('Generating CSV...', { id: 'csv-export' });
    try {
      const incident = {
        id: `comparison-${Date.now()}`,
        state: attackState.active ? 'ACTIVE' : 'RESOLVED',
        startTime: Date.now() - (manualReactionTime * 1000),
        endTime: Date.now(),
        duration: manualReactionTime * 1000,
        affectedNodes: nodes.filter(n => n.status !== 'healthy').map(n => n.name),
        mitigationStrategy: `AI automated response vs Manual intervention`,
        aiDecision: {
          confidence: 0.95,
          reasoning: `AI achieved ${timeImprovement}% faster response`
        }
      };

      const events = metrics.map((m, i) => ({
        timestamp: Date.now() - (metrics.length - i) * 1000,
        severity: 'INFO',
        message: `${m.label}: Manual ${m.manual} vs AI ${m.ai}`
      }));

      exportIncidentCSV(incident, events);
      toast.success('CSV exported successfully', { id: 'csv-export' });
    } catch (error) {
      console.error('CSV export failed:', error);
      toast.error('Failed to export CSV', { id: 'csv-export' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: 20,
        borderRadius: 16,
        background: 'var(--bg-card)',
        border: '2px solid rgba(0,212,255,0.3)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18,
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>📊</span>
          <div>
            <div style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: 'var(--text-primary)'
            }}>
              INCIDENT METRICS REPORT
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: 2
            }}>
              Manual vs AI Performance Comparison
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportPDF}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'rgba(255,51,85,0.1)',
              color: '#ff3355',
              border: '1px solid rgba(255,51,85,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileText size={14} />
            PDF
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportCSV}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'rgba(0,232,122,0.1)',
              color: '#00e87a',
              border: '1px solid rgba(0,232,122,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Download size={14} />
            CSV
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'rgba(0,212,255,0.1)',
              color: '#00d4ff',
              border: '1px solid rgba(0,212,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            {expanded ? '▼ Collapse' : '▶ Expand'}
          </motion.button>
        </div>
      </div>

      {/* Summary Stats */}
      {!attackState.active && timeImprovement > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: 14,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(0,255,136,0.1), rgba(0,212,255,0.1))',
            border: '2px solid rgba(0,255,136,0.3)',
            marginBottom: 16,
            textAlign: 'center'
          }}
        >
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: 6,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            AI Efficiency Improvement
          </div>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#00ff88',
            fontFamily: 'var(--font-data)',
            textShadow: '0 0 20px rgba(0,255,136,0.5)'
          }}>
            {timeImprovement}%
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            marginTop: 4
          }}>
            Faster response time than manual intervention
          </div>
        </motion.div>
      )}

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 12,
        marginBottom: 10,
        paddingBottom: 10,
        borderBottom: '2px solid var(--border)',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <div style={{ color: 'var(--text-muted)' }}>Metric</div>
        <div style={{ textAlign: 'center', color: '#ffaa00' }}>👤 Manual</div>
        <div style={{ textAlign: 'center', color: '#00d4ff' }}>🤖 AI</div>
      </div>

      {/* Metrics Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {metrics.slice(0, expanded ? metrics.length : 4).map((metric, index) => (
          <MetricRow key={metric.label} metric={metric} index={index} />
        ))}
      </div>

      {/* Footer */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}
        >
          💡 AI reduces incident response time by {timeImprovement}% while eliminating human error
        </motion.div>
      )}
    </motion.div>
  );
}

function MetricRow({ metric, index }) {
  const hasImprovement = metric.improvement > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: 12,
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid rgba(122,122,138,0.15)',
        fontSize: '0.85rem'
      }}
    >
      {/* Metric Label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <span style={{ fontSize: 20 }}>{metric.icon}</span>
        <div>
          <div style={{
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}>
            {metric.label}
          </div>
          {hasImprovement && (
            <div style={{
              fontSize: '0.7rem',
              color: '#00ff88',
              fontWeight: 600,
              marginTop: 2
            }}>
              ↓ {metric.improvement}% improvement
            </div>
          )}
        </div>
      </div>

      {/* Manual Value */}
      <div style={{
        textAlign: 'center',
        fontWeight: 700,
        fontFamily: 'var(--font-data)',
        color: '#ff6b35',
        fontSize: '0.95rem'
      }}>
        {metric.manual}
      </div>

      {/* AI Value */}
      <div style={{
        textAlign: 'center',
        position: 'relative'
      }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: index * 0.05 + 0.2, type: 'spring' }}
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            borderRadius: 8,
            background: 'rgba(0,255,136,0.15)',
            border: '1px solid rgba(0,255,136,0.3)',
            fontWeight: 800,
            fontFamily: 'var(--font-data)',
            color: '#00ff88',
            fontSize: '0.95rem',
            boxShadow: hasImprovement ? '0 0 10px rgba(0,255,136,0.3)' : 'none'
          }}
        >
          {metric.ai}
        </motion.div>
      </div>
    </motion.div>
  );
}
