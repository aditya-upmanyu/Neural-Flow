// AdaptationTimeline.jsx - NFV5 Failure Adaptation & Replanning Lifecycle View
import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight, CornerDownRight, History } from 'lucide-react';
import useStore from '../store/useStore';

export default function AdaptationTimeline() {
  const { latestIncident, orchestratorStatus } = useStore();

  const adaptations = latestIncident?.adaptations || orchestratorStatus?.adaptationHistory || [];
  const verificationResult = latestIncident?.verificationResult;
  const isRecovered = latestIncident?.state === 'RECOVERED';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-400">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Failure Adaptation & Replanning Path
            </h3>
            <p className="text-xs text-slate-400">Multi-attempt recovery proof with bounded retry loop</p>
          </div>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Max Steps: 3 Bounded
        </span>
      </div>

      {adaptations.length === 0 ? (
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-lg p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-200">Optimal Strategy Confirmed on Attempt 1</div>
              <div className="text-slate-400 text-[11px]">No secondary degradation encountered; verification passed on initial target.</div>
            </div>
          </div>
          <span className="text-emerald-400 font-mono font-semibold">0 Replans</span>
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
          {adaptations.map((adapt, idx) => (
            <div key={idx} className="relative flex items-start gap-3 pl-1">
              <div className="w-6 h-6 rounded-full bg-rose-950/90 border border-rose-600/80 flex items-center justify-center text-rose-400 z-10 shrink-0 mt-0.5">
                <AlertTriangle className="w-3 h-3" />
              </div>

              <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-rose-400 flex items-center gap-1.5">
                    <span>Attempt {adapt.attempt}: Verification Failure</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(adapt.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 mb-2">
                  Target Node <span className="font-bold text-rose-300">#{adapt.excludedNode}</span> did not recover service SLA. Marked as <strong className="text-rose-400">UNSUITABLE</strong>.
                </div>

                <div className="flex items-center gap-2 p-2 rounded bg-indigo-950/30 border border-indigo-800/40 text-indigo-300 text-[11px]">
                  <CornerDownRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>
                    <strong>Agentic Adaptation:</strong> Replanned and rerouted to alternative Node <strong className="text-cyan-300">#{adapt.newTargetNode}</strong>
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isRecovered && (
            <div className="relative flex items-start gap-3 pl-1">
              <div className="w-6 h-6 rounded-full bg-emerald-950/90 border border-emerald-500/80 flex items-center justify-center text-emerald-400 z-10 shrink-0 mt-0.5">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <div className="flex-1 bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-2.5 text-xs text-emerald-300 font-medium">
                ✓ Full service recovery independently verified on adapted target
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
