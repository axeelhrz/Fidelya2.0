'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface SmoothPageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

const SmoothPageTransition: React.FC<SmoothPageTransitionProps> = ({ 
  children, 
  className = '' 
}) => {
  const pathname = usePathname();
  useEffect(() => {
    const timer = setTimeout(() => {
      // Transition effect placeholder
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname]);

  const pageVariants = {
    initial: {
      opacity: 0,
      y: 10,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -10,
      scale: 1.02
    }
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: 'anticipate' as const,
    duration: 0.3
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default SmoothPageTransition;