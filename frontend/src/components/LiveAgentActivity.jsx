// LiveAgentActivity.jsx - Real-Time Autonomous Agent Lifecycle Execution Feed
import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight, Eye, Search, Target, Zap, RefreshCw } from 'lucide-react';
import useStore from '../store/useStore';

export default function LiveAgentActivity() {
  const { events, latestIncident, incident } = useStore();

  // Filter last 10 agent/system events
  const agentEvents = (events || [])
    .filter(e => e.type !== 'TELEMETRY_RECEIVED')
    .slice(0, 8);

  const getEventIcon = (type) => {
    switch (type) {
      case 'ANOMALY_DETECTED':
      case 'ALERT':
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />;
      case 'INVESTIGATION_STARTED':
      case 'EVIDENCE_COLLECTED':
        return <Search className="w-3.5 h-3.5 text-cyan-400" />;
      case 'GOAL_ESTABLISHED':
      case 'RISK_CALCULATED':
        return <Target className="w-3.5 h-3.5 text-purple-400" />;
      case 'POLICY_APPROVED':
      case 'POLICY_CHECK_STARTED':
      case 'SAFETY_GATE':
        return <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'ACTION_STARTED':
      case 'ACTION_COMPLETED':
      case 'REROUTE':
      case 'AI_DECISION':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'ADAPTATION_STARTED':
      case 'REPLAN_COMPLETED':
      case 'NODE_MARKED_UNSUITABLE':
        return <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />;
      case 'VERIFICATION_PASSED':
      case 'RECOVERY':
      case 'RECOVERY_CONFIRMED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Eye className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-700/50 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Live Agent Execution Stream
            </h3>
            <p className="text-xs text-slate-400">Real-time perception, reasoning, policy, and action log</p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Stream
        </span>
      </div>

      {agentEvents.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-2">
          <Activity className="w-6 h-6 text-slate-600 animate-pulse" />
          <span>Listening for autonomous agent events...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {agentEvents.map((evt, idx) => (
            <div
              key={evt.id || idx}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs hover:border-slate-700/80 transition-all"
            >
              <div className="mt-0.5 p-1 rounded bg-slate-900 border border-slate-800 shrink-0">
                {getEventIcon(evt.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-200 text-[11px] font-mono truncate">
                    {evt.type}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(evt.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5 line-clamp-2">
                  {evt.message}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
