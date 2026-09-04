import { useState } from 'react';
import { Shield, ExternalLink, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * NeuralFlowProtectionBanner - Embeddable banner for BharatBazaar
 * Shows protection status and links to NeuralFlow dashboard
 * 
 * Usage: Add to any BharatBazaar page header
 */
export default function NeuralFlowProtectionBanner({ nodeId = 1, compact = false }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState({
    protected: true,
    latency: 45,
    health: 98,
    underAttack: false
  });

  const openNeuralFlow = () => {
    // Open NeuralFlow dashboard with node context
    const url = `http://localhost:5173?node=${nodeId}&source=bharatbazaar`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <button
        onClick={openNeuralFlow}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all"
      >
        <Shield className="w-4 h-4" />
        <span className="text-sm">NeuralFlow Protection</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-cyan-500/30 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Protection Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-semibold text-white">NeuralFlow Protection</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Active</span>
            </div>

            {status.underAttack && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full">
                <Activity className="w-3 h-3 text-red-400 animate-pulse" />
                <span className="text-xs text-red-400 font-medium">Under Load</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>Details</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            <button
              onClick={openNeuralFlow}
              className="flex items-center gap-2 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              <span>Open Dashboard</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-3 mt-3 border-t border-slate-700 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Response Time</p>
                  <p className="text-lg font-bold text-cyan-400">{status.latency}ms</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Health Score</p>
                  <p className="text-lg font-bold text-green-400">{status.health}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Node ID</p>
                  <p className="text-lg font-bold text-white">BB-NODE-{nodeId}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                🤖 AI-powered traffic management • Real-time anomaly detection • Autonomous rerouting
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
