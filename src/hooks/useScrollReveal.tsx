import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export const useScrollReveal = (options: ScrollRevealOptions = {}) => {
  const { threshold = 0.1, rootMargin = '0px 0px -50px 0px', once = true } = options;
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = ref.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
};

// Hook for staggered children animations
export const useStaggeredReveal = (itemCount: number, baseDelay: number = 0, staggerDelay: number = 60) => {
  const { ref, isVisible } = useScrollReveal();
  
  const getItemStyle = useCallback((index: number) => ({
    opacity: 0,
    animationDelay: `${baseDelay + (index * staggerDelay)}ms`,
    animationFillMode: 'forwards' as const,
  }), [baseDelay, staggerDelay]);

  return { ref, isVisible, getItemStyle };
};
