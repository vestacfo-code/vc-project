import { useState, useEffect } from 'react';

interface CountUpAnimationProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  animate?: boolean;
}

const CountUpAnimation = ({ 
  end, 
  duration = 2000, 
  decimals = 0, 
  prefix = '', 
  suffix = '',
  className = '',
  animate = true,
}: CountUpAnimationProps) => {
  const [count, setCount] = useState(0);

useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    if (!animate) {
      setCount(end);
      return;
    }

    const run = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setCount(end * easeOut);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(run);
      }
    };

    animationFrame = requestAnimationFrame(run);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, animate]);

  const formatNumber = (num: number) => {
    return prefix + num.toFixed(decimals) + suffix;
  };

  return <span className={className}>{formatNumber(count)}</span>;
};

export default CountUpAnimation;