import { motion } from 'framer-motion';

/**
 * ChartSkeleton - Loading placeholder for charts
 * Provides smooth skeleton screen while data loads
 */
export default function ChartSkeleton({ height = 200, type = 'line' }) {
  return (
    <div 
      className="relative w-full rounded-lg bg-slate-900/50 border border-slate-700/50 overflow-hidden"
      style={{ height: `${height}px` }}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/20 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
      />

      {/* Chart-specific skeleton patterns */}
      {type === 'line' && <LineChartSkeleton />}
      {type === 'bar' && <BarChartSkeleton />}
      {type === 'pie' && <PieChartSkeleton />}
      {type === 'area' && <AreaChartSkeleton />}
    </div>
  );
}

function LineChartSkeleton() {
  return (
    <div className="absolute inset-0 p-4">
      {/* Y-axis labels */}
      <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-8 h-2 bg-slate-700/50 rounded" />
        ))}
      </div>

      {/* X-axis labels */}
      <div className="absolute left-12 right-4 bottom-2 flex justify-between">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-10 h-2 bg-slate-700/50 rounded" />
        ))}
      </div>

      {/* Line path simulation */}
      <svg className="absolute left-12 top-4 right-4 bottom-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path
          d="M 0,80 Q 20,60 25,50 T 50,45 T 75,55 T 100,40"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-700/50"
        />
        <path
          d="M 0,60 Q 20,40 25,35 T 50,30 T 75,40 T 100,25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-700/30"
          strokeDasharray="4"
        />
      </svg>
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="absolute inset-0 p-4 flex items-end justify-around gap-2">
      {[60, 80, 45, 90, 55, 70, 85].map((height, i) => (
        <div
          key={i}
          className="flex-1 bg-slate-700/50 rounded-t"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function PieChartSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120">
        {/* Pie segments */}
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeDasharray="78.5 235.5"
          className="text-slate-700/50"
        />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeDasharray="94.2 219.8"
          strokeDashoffset="-78.5"
          className="text-slate-700/30"
        />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="currentColor"
          strokeWidth="20"
          strokeDasharray="62.8 251.2"
          strokeDashoffset="-172.7"
          className="text-slate-700/20"
        />
      </svg>
    </div>
  );
}

function AreaChartSkeleton() {
  return (
    <div className="absolute inset-0 p-4">
      {/* Grid lines */}
      <div className="absolute left-12 top-4 right-4 bottom-10 flex flex-col justify-between">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full h-px bg-slate-700/20" />
        ))}
      </div>

      {/* Area fill simulation */}
      <svg className="absolute left-12 top-4 right-4 bottom-10" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="skeletonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d="M 0,100 L 0,70 Q 20,50 25,45 T 50,40 T 75,50 T 100,35 L 100,100 Z"
          fill="url(#skeletonGrad)"
          className="text-slate-700"
        />
        <path
          d="M 0,70 Q 20,50 25,45 T 50,40 T 75,50 T 100,35"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-slate-700/50"
        />
      </svg>
    </div>
  );
}
