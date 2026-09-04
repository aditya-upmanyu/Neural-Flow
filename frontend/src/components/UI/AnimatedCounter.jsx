// AnimatedCounter.jsx - Smooth counting animation for numbers
import { useEffect, useRef, useState } from 'react';

export default function AnimatedCounter({ 
  value, 
  duration = 800, 
  prefix = '', 
  suffix = '', 
  decimals = 0,
  className = '' 
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef(null);
  const startValueRef = useRef(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValueRef.current + (value - startValueRef.current) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  const formattedValue = typeof displayValue === 'number' 
    ? displayValue.toFixed(decimals)
    : displayValue;

  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}
