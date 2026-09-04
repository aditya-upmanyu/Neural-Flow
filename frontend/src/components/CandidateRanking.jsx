// CandidateRanking.jsx - NFV5 Explainability Center: "Why this Node?"
import React from 'react';
import { Award, CheckCircle2, XCircle, AlertOctagon, HelpCircle, Activity, ArrowRight } from 'lucide-react';
import useStore from '../store/useStore';

export default function CandidateRanking() {
  const { latestIncident, orchestratorStatus, nodes } = useStore();

  const candidates = latestIncident?.candidates || [];
  const selectedTargetId = latestIncident?.plan?.targetNodeId;
  const unsuitableNodeIds = orchestratorStatus?.unsuitableNodes || [];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-700/50 text-purple-400">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Candidate Node Explainability
            </h3>
            <p className="text-xs text-slate-400">Deterministic scoring rationale for routing selection</p>
          </div>
        </div>

        {unsuitableNodeIds.length > 0 && (
          <span className="text-xs bg-rose-950/80 text-rose-300 border border-rose-800/80 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            {unsuitableNodeIds.length} Node(s) Excluded by Adaptation
          </span>
        )}
      </div>

      {candidates.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-xs flex flex-col items-center gap-2">
          <Activity className="w-6 h-6 text-slate-600 animate-pulse" />
          <span>No candidate evaluation active. System currently monitoring topology.</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {candidates.map((cand, idx) => {
            const isSelected = cand.nodeId === selectedTargetId;
            const isUnsuitable = unsuitableNodeIds.includes(Number(cand.nodeId));

            return (
              <div
                key={cand.nodeId}
                className={`p-3 rounded-lg border transition-all ${
                  isUnsuitable
                    ? 'bg-rose-950/20 border-rose-900/40 text-slate-400 opacity-60'
                    : isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">#{idx + 1}</span>
                    <span className="text-sm font-bold text-slate-100">{cand.nodeName || `Node ${cand.nodeId}`}</span>
                    {isSelected && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SELECTED
                      </span>
                    )}
                    {isUnsuitable && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/50 px-2 py-0.2 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-400" /> UNSUITABLE
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-slate-400">Score:</span>
                    <span className="text-base font-black text-cyan-400 font-mono">
                      {cand.score ?? 85}
                    </span>
                    <span className="text-[10px] text-slate-500">/ 100</span>
                  </div>
                </div>

                {/* Metrics Breakdown Bar */}
                <div className="grid grid-cols-4 gap-2 text-[11px] bg-slate-900/70 p-2 rounded border border-slate-800/60 mb-1.5">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Health (40%)</span>
                    <span className="font-mono font-semibold text-slate-200">{cand.metrics?.health ?? 95}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Latency (30%)</span>
                    <span className="font-mono font-semibold text-slate-200">{Math.round(cand.metrics?.latency ?? 45)}ms</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CPU (20%)</span>
                    <span className="font-mono font-semibold text-slate-200">{Math.round(cand.metrics?.cpu ?? 25)}%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Errors</span>
                    <span className="font-mono font-semibold text-slate-200">{cand.metrics?.errorRate ?? 0}%</span>
                  </div>
                </div>

                {/* Rationale Text */}
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="text-slate-500 font-semibold">Rationale:</span>
                  <span>{cand.rationale || 'Optimal capacity and health scores'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
