import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/**
 * CopyButton - Reusable copy-to-clipboard button
 * @param {string} text - Text to copy
 * @param {string} label - Optional label for toast message
 * @param {string} size - Button size: 'sm', 'md', 'lg'
 * @param {string} variant - Style variant: 'default', 'ghost', 'minimal'
 */
export default function CopyButton({ 
  text, 
  label = 'Text', 
  size = 'sm',
  variant = 'default',
  className = ''
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation(); // Prevent triggering parent click handlers
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied to clipboard`, { 
        duration: 2000,
        icon: '📋'
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  const sizes = {
    sm: { icon: 12, padding: '4px 8px', fontSize: '0.7rem' },
    md: { icon: 14, padding: '6px 10px', fontSize: '0.75rem' },
    lg: { icon: 16, padding: '8px 12px', fontSize: '0.8rem' }
  };

  const variants = {
    default: {
      background: 'rgba(0,212,255,0.1)',
      border: '1px solid rgba(0,212,255,0.3)',
      color: '#00d4ff',
      hover: 'rgba(0,212,255,0.2)'
    },
    ghost: {
      background: 'transparent',
      border: '1px solid var(--border)',
      color: 'var(--text-secondary)',
      hover: 'var(--bg-elevated)'
    },
    minimal: {
      background: 'transparent',
      border: 'none',
      color: 'var(--text-muted)',
      hover: 'rgba(255,255,255,0.05)'
    }
  };

  const sizeStyle = sizes[size];
  const variantStyle = variants[variant];

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className={className}
      title={`Copy ${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: sizeStyle.padding,
        borderRadius: 6,
        fontSize: sizeStyle.fontSize,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: variantStyle.background,
        border: variantStyle.border,
        color: variantStyle.color,
        outline: 'none'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = variantStyle.hover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = variantStyle.background;
      }}
    >
      {copied ? (
        <>
          <Check size={sizeStyle.icon} />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy size={sizeStyle.icon} />
          {size !== 'sm' && <span>Copy</span>}
        </>
      )}
    </motion.button>
  );
}

/**
 * CopyText - Inline text with copy icon
 * @param {string} text - Text to display and copy
 * @param {boolean} truncate - Whether to truncate long text
 * @param {number} maxLength - Max length before truncation
 */
export function CopyText({ 
  text, 
  truncate = false, 
  maxLength = 20,
  showIcon = true,
  className = ''
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard', { 
        duration: 1500,
        icon: '📋'
      });
      
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const displayText = truncate && text.length > maxLength
    ? text.substring(0, maxLength) + '...'
    : text;

  return (
    <span
      onClick={handleCopy}
      className={className}
      title={truncate && text.length > maxLength ? text : 'Click to copy'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        color: 'var(--text-primary)',
        padding: '2px 8px',
        borderRadius: 4,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-subtle)',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0,212,255,0.1)';
        e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
      }}
    >
      <span>{displayText}</span>
      {showIcon && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {copied ? (
            <Check size={12} style={{ color: '#00e87a' }} />
          ) : (
            <Copy size={12} style={{ color: 'var(--text-muted)' }} />
          )}
        </motion.span>
      )}
    </span>
  );
}
