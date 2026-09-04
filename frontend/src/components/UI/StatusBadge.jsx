// StatusBadge.jsx - Status indicator badge
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function StatusBadge({ status, showDot = true, size = 'md', className = '' }) {
  const getStatusConfig = () => {
    switch (status?.toUpperCase()) {
      case 'HEALTHY':
      case 'NORMAL':
      case 'READY':
        return {
          text: status,
          bgColor: 'bg-neural-glow/10',
          textColor: 'text-neural-glow',
          borderColor: 'border-neural-glow/30',
          dotColor: 'bg-neural-glow'
        };
      case 'WARNING':
        return {
          text: status,
          bgColor: 'bg-neural-yellow/10',
          textColor: 'text-neural-yellow',
          borderColor: 'border-neural-yellow/30',
          dotColor: 'bg-neural-yellow'
        };
      case 'CRITICAL':
      case 'ERROR':
        return {
          text: status,
          bgColor: 'bg-neural-red/10',
          textColor: 'text-neural-red',
          borderColor: 'border-neural-red/30',
          dotColor: 'bg-neural-red'
        };
      case 'AI':
        return {
          text: 'AI Mode',
          bgColor: 'bg-neural-cyan/10',
          textColor: 'text-neural-cyan',
          borderColor: 'border-neural-cyan/30',
          dotColor: 'bg-neural-cyan'
        };
      case 'MANUAL':
        return {
          text: 'Manual Mode',
          bgColor: 'bg-neural-yellow/10',
          textColor: 'text-neural-yellow',
          borderColor: 'border-neural-yellow/30',
          dotColor: 'bg-neural-yellow'
        };
      default:
        return {
          text: status || 'Unknown',
          bgColor: 'bg-gray-500/10',
          textColor: 'text-gray-400',
          borderColor: 'border-gray-500/30',
          dotColor: 'bg-gray-400'
        };
    }
  };

  const config = getStatusConfig();
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border font-semibold uppercase tracking-wider',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={clsx('w-2 h-2 rounded-full', config.dotColor)}
          style={{ boxShadow: `0 0 8px currentColor` }}
        />
      )}
      <span>{config.text}</span>
    </motion.div>
  );
}
