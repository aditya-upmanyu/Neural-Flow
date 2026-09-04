import { useState, useEffect, useRef } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { API_URL } from '../config';

/**
 * BharatBazaarLiveView - Real-time latency monitoring for BB nodes
 * Shows embedded BB instances with performance overlay
 */
export default function BharatBazaarLiveView({ showComparison = false }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchMetrics();
    intervalRef.current = setInterval(fetchMetrics, 2000); // Poll every 2s
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/bharatbazaar/metrics`);
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.metrics);
        if (!selectedNode && data.metrics.length > 0) {
          setSelectedNode(data.metrics[0].nodeId);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch BB metrics:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'degraded': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'slow': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'error': return 'text-red-400 bg-red-500/20 border-red-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4" />;
      case 'degraded': return <Activity className="w-4 h-4" />;
      case 'slow': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatLatency = (ms) => {
    if (ms < 0) return 'Error';
    if (ms < 100) return `${ms}ms`;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-xl border border-slate-700">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-slate-400">Loading BharatBazaar metrics...</p>
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-900/50 rounded-xl border border-slate-700">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-yellow-400" />
          <p className="text-slate-400">No BharatBazaar nodes available</p>
          <p className="text-sm text-slate-500">Switch to EXTERNAL mode to see BB nodes</p>
        </div>
      </div>
    );
  }

  const selectedMetric = metrics.find(m => m.nodeId === selectedNode);

  return (
    <div className="space-y-4">
      {/* Node Selector & Metrics Cards */}
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric) => (
          <motion.button
            key={metric.nodeId}
            onClick={() => setSelectedNode(metric.nodeId)}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              selectedNode === metric.nodeId
                ? 'border-cyan-500 bg-cyan-500/10'
                : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Status Badge */}
            <div className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${getStatusColor(metric.status)}`}>
              {getStatusIcon(metric.status)}
              <span className="uppercase">{metric.status}</span>
            </div>

            <div className="text-left space-y-2">
              <h3 className="text-lg font-bold text-white">{metric.name}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-cyan-400">
                  {formatLatency(metric.responseTime)}
                </span>
                {metric.responseTime >= 0 && (
                  <span className="text-xs text-slate-400">response time</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Activity className="w-3 h-3" />
                <span>Port {metric.port}</span>
              </div>
            </div>

            {/* Latency Bar */}
            {metric.responseTime >= 0 && (
              <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    metric.status === 'healthy' ? 'bg-green-500' :
                    metric.status === 'degraded' ? 'bg-yellow-500' :
                    metric.status === 'slow' ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((metric.responseTime / 1000) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Live Preview - Open in New Tab */}
      {selectedMetric && (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative rounded-xl border-2 border-cyan-500/50 bg-slate-900/70 overflow-hidden p-8"
          >
            {/* Header */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className={`w-4 h-4 rounded-full ${
                selectedMetric.isHealthy ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              }`} />
              <h3 className="text-2xl font-bold text-white">
                {selectedMetric.name}
              </h3>
            </div>

            {/* Main CTA */}
            <div className="flex flex-col items-center gap-6 py-12">
              <motion.button
                onClick={async () => {
                  try {
                    const response = await fetchWithTimeout(`${API_URL}/api/nodes/${selectedMetric.nodeId}/url`);
                    const data = await response.json();
                    if (data.success) {
                      window.open(data.url, '_blank', 'noopener,noreferrer');
                    }
                  } catch (error) {
                    console.error('Failed to open node:', error);
                  }
                }}
                className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold rounded-xl text-lg transition-all shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400/70"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔗 OPEN BHARATBAZAAR IN NEW TAB
              </motion.button>

              <div className="text-center max-w-md space-y-2">
                <p className="text-slate-300">
                  Opens <span className="font-mono text-cyan-400">http://localhost:{selectedMetric.port}</span> in a new browser tab.
                </p>
                <p className="text-sm text-slate-400">
                  Shop, add to cart, checkout — while NeuralFlow monitors this node in the background. 
                  Trigger an attack from the Dashboard and watch this card update live.
                </p>
              </div>

              {/* Performance Stats */}
              <div className="mt-6 p-6 rounded-xl bg-slate-800/50 border border-slate-700 w-full max-w-md">
                <div className="space-y-3">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Live Performance</div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-300">Response Time</span>
                    <span className="text-2xl font-bold text-cyan-400">
                      {formatLatency(selectedMetric.responseTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Status</span>
                    <div className={`flex items-center gap-2 text-sm ${
                      selectedMetric.status === 'healthy' ? 'text-green-400' :
                      selectedMetric.status === 'degraded' ? 'text-yellow-400' :
                      selectedMetric.status === 'slow' ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {getStatusIcon(selectedMetric.status)}
                      <span className="capitalize">{selectedMetric.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
