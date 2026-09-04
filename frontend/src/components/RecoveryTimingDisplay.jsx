import { motion } from 'framer-motion';
import { Clock, Zap, CheckCircle2 } from 'lucide-react';

/**
 * RecoveryTimingDisplay - Shows real measured recovery times (T1, T2, T3)
 * NOT a fake countdown timer
 */
export default function RecoveryTimingDisplay({ incident }) {
  if (!incident) return null;

  const { detectionTime, rerouteStartTime, recoveryTime } = incident;

  // Calculate actual elapsed times
  const detectionDelay = detectionTime ? 0 : null; // T1 is reference point
  const rerouteDelay = rerouteStartTime && detectionTime
    ? ((rerouteStartTime - detectionTime) / 1000).toFixed(1)
    : null;
  const recoveryDelay = recoveryTime && detectionTime
    ? ((recoveryTime - detectionTime) / 1000).toFixed(1)
    : null;
  const totalTime = recoveryTime && detectionTime
    ? ((recoveryTime - detectionTime) / 1000).toFixed(1)
    : null;

  // Don't show if no timing data available
  if (!detectionTime) return null;

  const timings = [
    {
      label: 'Detection',
      value: detectionTime ? '✓' : '—',
      delay: '0.0s',
      icon: <Zap className="w-4 h-4" />,
      color: 'text-yellow-400',
      completed: !!detectionTime
    },
    {
      label: 'Reroute Start',
      value: rerouteStartTime ? '✓' : '—',
      delay: rerouteDelay ? `${rerouteDelay}s` : '—',
      icon: <Zap className="w-4 h-4" />,
      color: 'text-cyan-400',
      completed: !!rerouteStartTime
    },
    {
      label: 'Recovery Confirmed',
      value: recoveryTime ? '✓' : 'In Progress',
      delay: recoveryDelay ? `${recoveryDelay}s` : '—',
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-green-400',
      completed: !!recoveryTime
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-cyan-400" />
        <h4 className="text-sm font-semibold text-white">Recovery Timing</h4>
        {totalTime && (
          <span className="ml-auto text-sm text-cyan-400 font-mono">
            Total: {totalTime}s
          </span>
        )}
      </div>

      <div className="space-y-3">
        {timings.map((timing, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <div className={`${timing.color} ${timing.completed ? 'opacity-100' : 'opacity-40'}`}>
                {timing.icon}
              </div>
              <span className={`text-sm ${timing.completed ? 'text-white' : 'text-slate-400'}`}>
                {timing.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-mono ${timing.completed ? 'text-cyan-400' : 'text-slate-500'}`}>
                {timing.delay}
              </span>
              <span className={`text-sm font-semibold ${timing.completed ? timing.color : 'text-slate-500'}`}>
                {timing.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {!recoveryTime && rerouteStartTime && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-400 italic">
            ⏱ Measuring actual recovery time... (not a simulation)
          </p>
        </div>
      )}

      {recoveryTime && (
        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2 text-xs text-green-400">
          <CheckCircle2 className="w-3 h-3" />
          <span>Recovery complete • Real measured time: {totalTime}s</span>
        </div>
      )}
    </motion.div>
  );
}
