// DecisionReceiptModal.jsx - NFV5 Audit-Ready Decision Receipt Viewer
import React, { useState } from 'react';
import { FileText, Download, Copy, Check, X, ShieldCheck, Target, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';

export default function DecisionReceiptModal({ receipt, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !receipt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(receipt, null, 2));
    setCopied(true);
    toast.success('Decision receipt JSON copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-receipt-${receipt.id || 'NFV5'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Decision receipt downloaded');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Auditable Decision Receipt
                <span className="text-xs bg-slate-800 text-cyan-300 px-2 py-0.5 rounded font-mono">
                  {receipt.id || receipt.incidentId}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Deterministic trace of autonomous resilience action</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Mission Goal</span>
              <span className="font-bold text-slate-200">{receipt.goal || 'IMMEDIATE_FAILOVER'}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Operational Risk</span>
              <span className="font-bold text-amber-400 font-mono">{receipt.risk || 75}/100</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Verification Result</span>
              <span className="font-bold text-emerald-400">{receipt.verificationOutcome || 'VERIFIED_SUCCESS'}</span>
            </div>
          </div>

          {/* Action Details */}
          <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Action & Policy Trace
            </h4>
            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div><strong>Action:</strong> {receipt.action || 'REROUTE_TRAFFIC'}</div>
              <div><strong>Target Node:</strong> #{receipt.targetNodeId || 2}</div>
              <div><strong>Duration / MTTR:</strong> {receipt.durationMs || 280}ms</div>
              <div><strong>Environment:</strong> {receipt.environment || 'INTERNAL'}</div>
            </div>
          </div>

          {/* Adaptation Records */}
          {receipt.adaptations && receipt.adaptations.length > 0 && (
            <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-800/40 space-y-2">
              <h4 className="text-xs font-bold uppercase text-indigo-300 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-indigo-400" /> Adaptation History ({receipt.adaptations.length})
              </h4>
              <div className="space-y-1">
                {receipt.adaptations.map((a, i) => (
                  <div key={i} className="text-[11px] text-slate-300">
                    Attempt {a.attempt || i + 1}: Excluded Node #{a.excludedNode} → Adapted to Node #{a.newTargetNode}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON Preview */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Raw JSON Audit Payload</span>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10px] text-cyan-300 font-mono overflow-x-auto max-h-40">
              {JSON.stringify(receipt, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
