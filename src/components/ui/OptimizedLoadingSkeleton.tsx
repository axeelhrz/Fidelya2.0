'use client';

import React, { memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OptimizedLoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'button' | 'stat' | 'dashboard';
  lines?: number;
  height?: string;
  width?: string;
  animate?: boolean;
  delay?: number;
}

const OptimizedLoadingSkeleton: React.FC<OptimizedLoadingSkeletonProps> = memo(({
  className,
  variant = 'text',
  lines = 1,
  height,
  width,
  animate = true,
  delay = 0
}) => {
  const baseClasses = 'bg-gradient-to-r from-slate-200/60 via-slate-300/40 to-slate-200/60 rounded-lg';
  
  const variants = {
    card: 'h-48 w-full rounded-2xl',
    text: 'h-4 w-full rounded-lg',
    circle: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-xl',
    stat: 'h-32 w-full rounded-2xl',
    dashboard: 'h-96 w-full rounded-3xl'
  };

  const skeletonClasses = cn(
    baseClasses,
    variants[variant],
    className
  );

  const style = {
    ...(height && { height }),
    ...(width && { width })
  };

  const shimmerVariants: Variants = {
    initial: { x: '-100%' },
    animate: { 
      x: '100%',
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }
    }
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <motion.div
            key={index}
            className={skeletonClasses}
            style={{
              ...style,
              width: index === lines - 1 ? '75%' : '100%'
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              delay: delay + (index * 0.1),
              duration: 0.3,
              ease: "easeInOut"
            }}
          >
            {animate && (
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
              />
            )}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={cn(skeletonClasses, 'relative overflow-hidden')}
      style={style}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        delay,
        duration: 0.3,
        ease: "easeInOut"
      }}
    >
      {animate && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
          variants={shimmerVariants}
          initial="initial"
          animate="animate"
        />
      )}
    </motion.div>
  );
});

OptimizedLoadingSkeleton.displayName = 'OptimizedLoadingSkeleton';

// Componentes especializados optimizados
export const DashboardSkeleton: React.FC = memo(() => (
  <div className="space-y-8">
    {/* Header */}
    <OptimizedLoadingSkeleton variant="dashboard" delay={0} />
    
    {/* KPI Cards */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[0, 1, 2].map((index) => (
        <OptimizedLoadingSkeleton 
          key={index}
          variant="stat" 
          delay={0.1 + (index * 0.1)} 
        />
      ))}
    </div>
    
    {/* Content Grid */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2">
        <OptimizedLoadingSkeleton variant="dashboard" delay={0.5} />
      </div>
      <div>
        <OptimizedLoadingSkeleton variant="dashboard" delay={0.6} />
      </div>
    </div>
  </div>
));

DashboardSkeleton.displayName = 'DashboardSkeleton';

export const BenefitCardSkeleton: React.FC<{ view?: 'grid' | 'list' }> = memo(({ view = 'grid' }) => (
  <motion.div 
    className={cn(
      'bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 overflow-hidden',
      view === 'list' ? 'flex items-center p-6 h-32' : 'h-96'
    )}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="p-6 space-y-4 flex-1">
      {/* Badges */}
      <div className="flex gap-2">
        <OptimizedLoadingSkeleton variant="button" width="80px" height="24px" />
        <OptimizedLoadingSkeleton variant="button" width="60px" height="24px" delay={0.1} />
      </div>
      
      {/* Title */}
      <OptimizedLoadingSkeleton variant="text" height="24px" width="85%" delay={0.2} />
      
      {/* Description */}
      <OptimizedLoadingSkeleton variant="text" lines={2} height="16px" delay={0.3} />
      
      {/* Meta info */}
      <div className="flex gap-4">
        <OptimizedLoadingSkeleton variant="text" width="120px" height="14px" delay={0.4} />
        <OptimizedLoadingSkeleton variant="text" width="80px" height="14px" delay={0.5} />
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <OptimizedLoadingSkeleton variant="button" width="100px" delay={0.6} />
        <OptimizedLoadingSkeleton variant="button" width="90px" delay={0.7} />
        <OptimizedLoadingSkeleton variant="button" width="40px" delay={0.8} />
      </div>
    </div>
    
    {view === 'grid' && (
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <OptimizedLoadingSkeleton variant="circle" width="40px" height="40px" delay={0.9} />
          <div className="flex-1 space-y-2">
            <OptimizedLoadingSkeleton variant="text" width="120px" height="16px" delay={1} />
            <OptimizedLoadingSkeleton variant="text" width="100px" height="14px" delay={1.1} />
          </div>
        </div>
      </div>
    )}
  </motion.div>
));

BenefitCardSkeleton.displayName = 'BenefitCardSkeleton';

export { OptimizedLoadingSkeleton };