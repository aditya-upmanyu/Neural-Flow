// Skeleton.jsx - Consistent loading skeleton component
import { motion } from 'framer-motion';
import clsx from 'clsx';

const Skeleton = ({ 
  className, 
  variant = 'default', // default, card, text, circle, chart
  rows = 1,
  animate = true 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return 'h-32 rounded-xl';
      case 'text':
        return 'h-4 rounded-md';
      case 'circle':
        return 'rounded-full aspect-square';
      case 'chart':
        return 'h-64 rounded-lg';
      default:
        return 'h-20 rounded-lg';
    }
  };

  const baseClasses = clsx(
    'bg-gradient-to-r from-[#1a1b1e] via-[#202124] to-[#1a1b1e]',
    'bg-[length:200%_100%]',
    'border border-gray-800/50',
    getVariantStyles(),
    className
  );

  const animationClasses = animate ? 'animate-shimmer' : '';

  if (rows > 1 && variant === 'text') {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className={clsx(baseClasses, animationClasses)}
            style={{ width: i === rows - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx(baseClasses, animationClasses)}
    />
  );
};

// Specialized skeleton components
export const SkeletonCard = ({ className }) => (
  <Skeleton variant="card" className={className} />
);

export const SkeletonText = ({ rows = 3, className }) => (
  <Skeleton variant="text" rows={rows} className={className} />
);

export const SkeletonCircle = ({ className }) => (
  <Skeleton variant="circle" className={className} />
);

export const SkeletonChart = ({ className }) => (
  <Skeleton variant="chart" className={className} />
);

// Node card skeleton
export const SkeletonNodeCard = () => (
  <div className="bg-[#1a1b1e] border border-gray-800 rounded-xl p-4 space-y-3">
    <div className="flex items-center gap-3">
      <SkeletonCircle className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-24 h-4" />
        <Skeleton variant="text" className="w-32 h-3" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full h-3" />
      <Skeleton variant="text" className="w-3/4 h-3" />
    </div>
  </div>
);

// Metrics panel skeleton
export const SkeletonMetrics = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-[#1a1b1e] border border-gray-800 rounded-lg p-4 space-y-2">
        <Skeleton variant="text" className="w-20 h-3" />
        <Skeleton variant="text" className="w-16 h-6" />
      </div>
    ))}
  </div>
);

// Timeline skeleton
export const SkeletonTimeline = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <SkeletonCircle className="w-10 h-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-32 h-4" />
          <Skeleton variant="text" className="w-full h-3" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
