// MetricCard.jsx - Card for displaying key metrics
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ 
  icon, 
  title, 
  value, 
  unit = '', 
  trend = null, 
  trendDirection = 'up',
  color = 'text-neural-glow',
  delay = 0,
  className = ''
}) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    const isGood = (trendDirection === 'up' && trend > 0) || (trendDirection === 'down' && trend < 0);
    const Icon = trend > 0 ? TrendingUp : TrendingDown;
    const colorClass = isGood ? 'text-neural-glow' : 'text-neural-red';
    
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="w-3 h-3" />
        <span>{Math.abs(trend)}%</span>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-neural-card/80 backdrop-blur-sm border border-neural-border rounded-xl p-4 hover:border-neural-glow transition-all duration-300 hover:shadow-glow-green ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && <span className={`${color}`}>{icon}</span>}
          <span className="text-xs text-gray-400 uppercase tracking-wider">{title}</span>
        </div>
        {getTrendIcon()}
      </div>
      
      <div className={`text-3xl font-bold font-mono ${color}`}>
        <AnimatedCounter value={value} decimals={typeof value === 'number' && value % 1 !== 0 ? 1 : 0} />
        {unit && <span className="text-xl ml-1">{unit}</span>}
      </div>
    </motion.div>
  );
}
