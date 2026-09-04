// GlowButton.jsx - Animated button with glow effects
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function GlowButton({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  onClick, 
  loading = false, 
  disabled = false,
  className = '',
  icon = null,
  ...props 
}) {
  const baseClasses = 'relative font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-neural-glow to-neural-cyan text-neural-bg hover:shadow-glow-green active:scale-95',
    danger: 'bg-gradient-to-r from-neural-red to-neural-orange text-white hover:shadow-glow-red active:scale-95',
    ghost: 'bg-transparent border-2 border-neural-glow text-neural-glow hover:bg-neural-glow/10 hover:shadow-glow-green',
    outline: 'bg-transparent border border-neural-border text-gray-300 hover:border-neural-glow hover:text-neural-glow'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed hover:scale-100';

  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled || loading}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && disabledClasses,
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
}
