import { useState, useEffect } from 'react';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  Shield,
  Activity,
  Zap
} from 'lucide-react';
import { API_URL } from '../config';

/**
 * BharatBazaarIntegrationCard - Shows BharatBazaar node status
 * with quick open buttons and rerouting visualization
 */
export default function BharatBazaarIntegrationCard({ nodes, incident, onOpenNode }) {
  const [activeNodes, setActiveNodes] = useState([]);

  useEffect(() => {
    // Filter to show only EXTERNAL/BharatBazaar nodes
    const bbNodes = nodes.filter(n => 
      n.name && (n.name.startsWith('BB-NODE') || n.location)
    );
    setActiveNodes(bbNodes);
  }, [nodes]);

  const getNodeStatusIcon = (node) => {
    if (node.health > 70) return <CheckCircle2 className="w-4 h-4 text-green-400" />;
    if (node.health > 40) return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getNodeStatusColor = (node) => {
    if (node.health > 70) return 'text-green-400';
    if (node.health > 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleOpenNode = async (nodeId) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/api/nodes/${nodeId}/url`);
      const data = await response.json();
      
      if (data.success && data.url) {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Failed to open node:', err);
    }

    // Also call parent handler if provided
    if (onOpenNode) {
      onOpenNode(nodeId);
    }
  };

  const handleAttackNode = async (nodeId) => {
    try {
      await fetchWithTimeout(`${API_URL}/api/attack/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, attackType: 'TrafficSpike', intensity: 60 })
      });
    } catch (err) {
      console.error('Failed to trigger attack:', err);
    }
  };

  if (activeNodes.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">BharatBazaar Integration</h3>
        </div>
        <div className="text-center py-8">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            Switch to EXTERNAL mode to see BharatBazaar nodes
          </p>
        </div>
      </div>
    );
  }

  const affectedNode = incident?.nodeId 
    ? activeNodes.find(n => n.nodeId === incident.nodeId)
    : null;
  
  const targetNode = incident?.targetNodeId
    ? activeNodes.find(n => n.nodeId === incident.targetNodeId)
    : null;

  const isIncidentActive = incident && (
    incident.state === 'DETECTED' ||
    incident.state === 'PREDICTED' ||
    incident.state === 'REROUTING' ||
    incident.state === 'VERIFYING' ||
    incident.state === 'ACTION_PENDING'
  );

  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">BharatBazaar Integration</h3>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-slate-400">{activeNodes.length} nodes connected</span>
        </div>
      </div>

      {/* Incident Rerouting Visualization */}
      {isIncidentActive && affectedNode && targetNode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-500/5 border border-red-500/30 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">
              {incident.state === 'REROUTING' || incident.state === 'VERIFYING' 
                ? 'AI REROUTING IN PROGRESS' 
                : 'DEGRADATION DETECTED'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Affected Node */}
            <div className="flex-1 bg-slate-800 rounded-lg p-3 border-2 border-red-500">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">Affected</span>
              </div>
              <p className="text-white font-semibold">{affectedNode.name}</p>
              <p className="text-xs text-red-300 mt-1">{Math.round(affectedNode.latency)}ms latency</p>
              <button
                onClick={() => handleOpenNode(affectedNode.nodeId)}
                className="mt-2 w-full px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Open Affected Node
              </button>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center">
              <ArrowRight className="w-8 h-8 text-cyan-400 animate-pulse" />
              <span className="text-xs text-slate-400 mt-1">rerouting</span>
            </div>

            {/* Target Node */}
            <div className="flex-1 bg-slate-800 rounded-lg p-3 border-2 border-green-500">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">Target</span>
              </div>
              <p className="text-white font-semibold">{targetNode.name}</p>
              <p className="text-xs text-green-300 mt-1">{Math.round(targetNode.latency)}ms latency</p>
              <button
                onClick={() => handleOpenNode(targetNode.nodeId)}
                className="mt-2 w-full px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-300 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Open Target Node
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Normal Node List */}
      {!isIncidentActive && (
        <div className="space-y-2">
          {activeNodes.map((node) => (
            <motion.div
              key={node.nodeId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3 flex-1">
                {getNodeStatusIcon(node)}
                <div className="flex-1">
                  <p className="text-white font-medium">{node.name}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className={getNodeStatusColor(node)}>
                      {Math.round(node.latency)}ms
                    </span>
                    <span>•</span>
                    <span>{node.health}% health</span>
                    <span>•</span>
                    <span>{node.location}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAttackNode(node.nodeId)}
                  className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 text-xs font-semibold rounded transition-colors flex items-center gap-1"
                  title={`Trigger traffic spike against ${node.name}`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  ⚡ Attack
                </button>
                <button
                  onClick={() => handleOpenNode(node.nodeId)}
                  className="px-3 py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 text-xs font-medium rounded transition-colors flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
