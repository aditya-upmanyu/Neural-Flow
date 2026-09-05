import { useState, useEffect } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  X,
  TrendingUp,
  Cpu,
  HardDrive,
  Zap,
  AlertOctagon
} from 'lucide-react';
import { API_URL } from '../config';

/**
 * NodeDetailsPanel - Shows detailed metrics for a selected node
 * with "Open BharatBazaar" button for EXTERNAL nodes
 */
export default function NodeDetailsPanel({ nodeId, onClose }) {
  const [nodeDetails, setNodeDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!nodeId) return;
    fetchNodeDetails();
    const interval = setInterval(fetchNodeDetails, 2000);
    return () => clearInterval(interval);
  }, [nodeId]);

  const fetchNodeDetails = async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/nodes/${nodeId}/details`);
      const data = await response.json();
      
      if (data.success) {
        setNodeDetails(data.node);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch node details');
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch node details:', err);
      setError('Network error');
      setLoading(false);
    }
  };

  const handleOpenNode = async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/nodes/${nodeId}/url`);
      const data = await response.json();
      
      if (data.success && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        alert('Node URL not available');
      }
    } catch (err) {
      console.error('Failed to get node URL:', err);
      alert('Failed to open node');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'HEALTHY': return 'text-green-400 bg-green-500/20 border-green-500';
      case 'WARNING': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500';
      case 'CRITICAL': return 'text-red-400 bg-red-500/20 border-red-500';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'HEALTHY': return <CheckCircle2 className="w-5 h-5" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5" />;
      case 'CRITICAL': return <XCircle className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-2xl w-full mx-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <p className="text-slate-300">Loading node details...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-2xl w-full mx-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-red-400">Error</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={fetchNodeDetails}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  if (!nodeDetails) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div 
        className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg border ${getStatusColor(nodeDetails.status)}`}>
              {getStatusIcon(nodeDetails.status)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{nodeDetails.name}</h2>
              <p className="text-sm text-slate-400">
                {nodeDetails.environment === 'EXTERNAL' ? 'BharatBazaar Node' : 'Internal Node'} • {nodeDetails.location}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(nodeDetails.status)}`}>
            {getStatusIcon(nodeDetails.status)}
            <span className="font-semibold">{nodeDetails.status}</span>
          </div>

          {/* Attack Warning */}
          {nodeDetails.isUnderAttack && (
            <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-start gap-3">
              <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-semibold">Under Attack</p>
                <p className="text-sm text-red-300 mt-1">
                  Type: {nodeDetails.attackType || 'Unknown'} • Simulated attack in progress
                </p>
              </div>
            </div>
          )}

          {/* Primary Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              icon={<Activity className="w-5 h-5" />}
              label="Latency"
              value={`${nodeDetails.latency}ms`}
              status={nodeDetails.latency < 100 ? 'good' : nodeDetails.latency < 300 ? 'warning' : 'critical'}
            />
            <MetricCard
              icon={<Zap className="w-5 h-5" />}
              label="Requests/sec"
              value={nodeDetails.requestsPerSecond}
              status="info"
            />
            <MetricCard
              icon={<AlertTriangle className="w-5 h-5" />}
              label="Error Rate"
              value={`${nodeDetails.errorRate}%`}
              status={nodeDetails.errorRate < 1 ? 'good' : nodeDetails.errorRate < 5 ? 'warning' : 'critical'}
            />
            <MetricCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Health Score"
              value={`${nodeDetails.health}%`}
              status={nodeDetails.health > 70 ? 'good' : nodeDetails.health > 40 ? 'warning' : 'critical'}
            />
          </div>

          {/* System Resources */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">System Resources</h3>
            <div className="grid grid-cols-2 gap-4">
              <ResourceBar
                icon={<Cpu className="w-4 h-4" />}
                label="CPU Usage"
                value={nodeDetails.cpu}
                max={100}
              />
              <ResourceBar
                icon={<HardDrive className="w-4 h-4" />}
                label="Memory Usage"
                value={nodeDetails.memory}
                max={100}
              />
            </div>
          </div>

          {/* Traffic Allocation */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Traffic Allocation</h3>
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Current Traffic</span>
                <span className="text-2xl font-bold text-cyan-400">{nodeDetails.traffic}%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${nodeDetails.traffic}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Predicted Breach */}
          {nodeDetails.predictedBreach !== null && nodeDetails.predictedBreach >= 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-400 font-semibold mb-1">Predicted Breach</p>
              <p className="text-sm text-yellow-300">
                {nodeDetails.predictedBreach === 0 
                  ? 'Already breached threshold'
                  : `Expected breach in ~${nodeDetails.predictedBreach}s`
                }
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            {nodeDetails.environment === 'EXTERNAL' && (
              <button
                onClick={handleOpenNode}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all shadow-lg shadow-cyan-500/20"
              >
                <ExternalLink className="w-5 h-5" />
                Open BharatBazaar
              </button>
            )}
            <button
              onClick={fetchNodeDetails}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Metadata */}
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
            Node ID: {nodeDetails.nodeId} • Last updated: {new Date(nodeDetails.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({ icon, label, value, status }) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'warning': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'critical': return 'text-red-400 border-red-500/30 bg-red-500/10';
      default: return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm opacity-80">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ResourceBar({ icon, label, value, max }) {
  const percentage = Math.min((value / max) * 100, 100);
  const getColor = () => {
    if (percentage < 60) return 'from-green-500 to-emerald-500';
    if (percentage < 80) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm text-slate-400">{label}</span>
        <span className="ml-auto text-sm font-semibold text-white">{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${getColor()}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
