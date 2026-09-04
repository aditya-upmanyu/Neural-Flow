// AgentMissionPanel.jsx - NFV5 Autonomous Mission, Risk vs Confidence, and Policy Overview
import React from 'react';
import { Shield, Target, AlertTriangle, CheckCircle2, RefreshCw, Cpu, Activity, Zap, Compass } from 'lucide-react';
import useStore from '../store/useStore';

export default function AgentMissionPanel() {
  const { latestIncident, incident, orchestratorStatus, modelPerformance } = useStore();

  const activeData = latestIncident || {};
  const currentRisk = activeData.risk || { score: incident?.detectedLatency > 200 ? 75 : 15, severity: incident?.detectedLatency > 200 ? 'HIGH' : 'LOW' };
  const currentGoal = activeData.goal?.primaryGoal || (incident?.state === 'NORMAL' ? 'MONITOR_AND_OPTIMIZE' : 'IMMEDIATE_FAILOVER');
  const currentConfidence = activeData.risk?.confidence || modelPerformance?.accuracy / 100 || 0.95;
  const currentPhase = activeData.state || incident?.state || 'MONITORING';
  const targetNodeId = activeData.plan?.targetNodeId || incident?.targetNodeId;
  const selectedAction = activeData.plan?.action || (targetNodeId ? `REROUTE → Node ${targetNodeId}` : 'OBSERVE');

  const isAutonomousEligible = currentConfidence >= 0.80;
  const shouldAbstain = currentConfidence < 0.65;

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'CRITICAL': return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
      case 'HIGH': return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-950/60 border-yellow-800/80';
      default: return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
    }
  };

  const getPhaseBadge = (phase) => {
    if (phase === 'RECOVERED') return { text: 'RECOVERED', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    if (phase === 'ADAPTING' || phase === 'REPLANNING') return { text: 'ADAPTING STRATEGY', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 animate-pulse' };
    if (phase === 'VERIFYING') return { text: 'VERIFYING OUTCOME', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse' };
    if (phase === 'EXECUTING') return { text: 'EXECUTING ACTION', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
    if (phase === 'POLICY_CHECK') return { text: 'POLICY CHECK', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
    if (phase === 'PLANNING') return { text: 'PLANNING', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
    if (phase === 'ANOMALY_DETECTED' || phase === 'DETECTED') return { text: 'ANOMALY DETECTED', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse' };
    return { text: 'MONITORING', color: 'bg-slate-700/40 text-slate-300 border-slate-600/50' };
  };

  const phaseInfo = getPhaseBadge(currentPhase);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Agent Mission & Control Plane
            </h3>
            <p className="text-xs text-slate-400">NFV5 Closed-Loop Autonomous Resilience Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${phaseInfo.color}`}>
            {phaseInfo.text}
          </span>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mission Goal Card */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" /> Operational Mission
            </span>
            {activeData.incidentId && (
              <span className="text-[10px] bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded font-mono">
                {activeData.incidentId}
              </span>
            )}
          </div>
          <div className="text-sm font-bold text-slate-100 my-1">
            {currentGoal.replace(/_/g, ' ')}
          </div>
          <div className="text-[11px] text-slate-400">
            {activeData.nodeName ? (
              <span className="text-rose-400 font-medium">Protecting {activeData.nodeName}</span>
            ) : (
              <span>All nodes operating within SLA</span>
            )}
          </div>
        </div>

        {/* Operational Risk Score */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Operational Risk
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${getSeverityColor(currentRisk.severity)}`}>
              {currentRisk.severity || 'LOW'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-black text-slate-100 font-mono">{currentRisk.score ?? 15}</span>
            <span className="text-xs text-slate-500">/ 100 danger index</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (currentRisk.score || 15) > 70 ? 'bg-rose-500' : (currentRisk.score || 15) > 40 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, currentRisk.score || 15))}%` }}
            />
          </div>
        </div>

        {/* ML Confidence & Abstention */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" /> Model Confidence
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                isAutonomousEligible
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                  : shouldAbstain
                  ? 'bg-rose-950/80 text-rose-400 border border-rose-700/60'
                  : 'bg-yellow-950/80 text-yellow-400 border border-yellow-700/60'
              }`}
            >
              {isAutonomousEligible ? 'AUTONOMOUS' : shouldAbstain ? 'ABSTAIN' : 'ASSISTED'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-1">
            <span className="text-2xl font-black text-slate-100 font-mono">
              {(currentConfidence * 100).toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500">ML certainty</span>
          </div>
          <div className="text-[11px] text-slate-400">
            {isAutonomousEligible ? '≥80% gate passed' : shouldAbstain ? 'Confidence <65% (safe abstention)' : '65-80% assisted'}
          </div>
        </div>

        {/* Selected Action & Strategy */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" /> Action & Strategy
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
              <Shield className="w-3 h-3" /> SAFE GATE
            </span>
          </div>
          <div className="text-sm font-bold text-emerald-400 truncate my-1">
            {selectedAction}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              {activeData.verificationResult ? (
                <span className="text-emerald-400 font-medium">✓ Verified Recovered</span>
              ) : activeData.adaptations?.length > 0 ? (
                <span className="text-indigo-400 font-medium">{activeData.adaptations.length} Adaptation(s)</span>
              ) : (
                <span>Closed-loop verified</span>
              )}
            </span>
            {orchestratorStatus?.unsuitableNodes?.length > 0 && (
              <span className="text-[10px] text-rose-400 bg-rose-950/80 px-1 rounded border border-rose-800/60">
                {orchestratorStatus.unsuitableNodes.length} Excluded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Risk Contributors Drawer (if contributors exist) */}
      {currentRisk.contributors && currentRisk.contributors.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px] uppercase font-semibold">Risk Drivers:</span>
          {currentRisk.contributors.map((c, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 text-[11px] border border-slate-700/60">
              <strong className="text-slate-200 capitalize">{c.factor}:</strong> +{c.contribution}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
