'use client';

import React, { memo, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface UltraOptimizedTransitionsProps {
  children: React.ReactNode;
  activeKey: string;
  direction?: 'horizontal' | 'vertical' | 'fade' | 'scale';
  duration?: number;
  className?: string;
}

// Ultra optimized transition variants
const createTransitionVariants = (direction: string, duration: number): Variants => {
  const baseTransition = {
    type: "tween" as const,
    ease: "easeOut" as const, // Using predefined easing function
    duration: duration / 1000
  };

  switch (direction) {
    case 'horizontal':
      return {
        initial: { opacity: 0, x: 20, scale: 0.98 },
        animate: { opacity: 1, x: 0, scale: 1, transition: baseTransition },
        exit: { opacity: 0, x: -20, scale: 0.98, transition: { ...baseTransition, duration: (duration * 0.7) / 1000 } }
      };
    
    case 'vertical':
      return {
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1, transition: baseTransition },
        exit: { opacity: 0, y: -20, scale: 0.98, transition: { ...baseTransition, duration: (duration * 0.7) / 1000 } }
      };
    
    case 'scale':
      return {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1, transition: baseTransition },
        exit: { opacity: 0, scale: 1.05, transition: { ...baseTransition, duration: (duration * 0.7) / 1000 } }
      };
    
    case 'fade':
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: baseTransition },
        exit: { opacity: 0, transition: { ...baseTransition, duration: (duration * 0.7) / 1000 } }
      };
  }
};

export const UltraOptimizedTransitions = memo<UltraOptimizedTransitionsProps>(({
  children,
  activeKey,
  direction = 'horizontal',
  duration = 200,
  className = ''
}) => {
  // Memoize variants to prevent recreation
  const variants = useMemo(() => 
    createTransitionVariants(direction, duration), 
    [direction, duration]
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeKey}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full"
          style={{
            // Hardware acceleration for better performance
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            perspective: 1000
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

UltraOptimizedTransitions.displayName = 'UltraOptimizedTransitions';

export default UltraOptimizedTransitions;