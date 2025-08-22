'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'text' | 'circle' | 'button' | 'stat';
  lines?: number;
  height?: string;
  width?: string;
  animate?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'text',
  lines = 1,
  height,
  width,
  animate = true
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded';
  
  const variants = {
    card: 'h-48 w-full rounded-2xl',
    text: 'h-4 w-full rounded-lg',
    circle: 'h-12 w-12 rounded-full',
    button: 'h-10 w-24 rounded-xl',
    stat: 'h-32 w-full rounded-2xl'
  };

  const skeletonClasses = cn(
    baseClasses,
    variants[variant],
    animate && 'animate-pulse',
    className
  );

  const style = {
    ...(height && { height }),
    ...(width && { width })
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={skeletonClasses}
      style={style}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    />
  );
};

// Specialized skeleton components
export const BenefitCardSkeleton: React.FC<{ view?: 'grid' | 'list' }> = ({ view = 'grid' }) => (
  <div className={cn(
    'bg-white rounded-2xl border border-gray-100 overflow-hidden',
    view === 'list' ? 'flex items-center p-6 h-32' : 'h-96'
  )}>
    <div className="p-6 space-y-4 flex-1">
      {/* Badges */}
      <div className="flex gap-2">
        <LoadingSkeleton variant="button" width="80px" height="24px" />
        <LoadingSkeleton variant="button" width="60px" height="24px" />
      </div>
      
      {/* Title */}
      <LoadingSkeleton variant="text" height="24px" width="85%" />
      
      {/* Description */}
      <LoadingSkeleton variant="text" lines={2} height="16px" />
      
      {/* Meta info */}
      <div className="flex gap-4">
        <LoadingSkeleton variant="text" width="120px" height="14px" />
        <LoadingSkeleton variant="text" width="80px" height="14px" />
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <LoadingSkeleton variant="button" width="100px" />
        <LoadingSkeleton variant="button" width="90px" />
        <LoadingSkeleton variant="button" width="40px" />
      </div>
    </div>
    
    {view === 'grid' && (
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <LoadingSkeleton variant="circle" width="40px" height="40px" />
          <div className="flex-1 space-y-2">
            <LoadingSkeleton variant="text" width="120px" height="16px" />
            <LoadingSkeleton variant="text" width="100px" height="14px" />
          </div>
        </div>
      </div>
    )}
  </div>
);

export const StatCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100">
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <LoadingSkeleton variant="circle" width="48px" height="48px" />
        <div className="space-y-2">
          <LoadingSkeleton variant="text" width="60px" height="32px" />
          <LoadingSkeleton variant="text" width="100px" height="16px" />
        </div>
      </div>
      <LoadingSkeleton variant="text" width="80px" height="14px" />
      <LoadingSkeleton variant="text" width="120px" height="20px" />
    </div>
  </div>
);

export const FilterSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100">
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LoadingSkeleton variant="circle" width="48px" height="48px" />
          <div className="space-y-2">
            <LoadingSkeleton variant="text" width="150px" height="20px" />
            <LoadingSkeleton variant="text" width="200px" height="16px" />
          </div>
        </div>
        <LoadingSkeleton variant="button" width="80px" height="40px" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <LoadingSkeleton variant="text" width="100%" height="48px" />
        </div>
        <LoadingSkeleton variant="text" width="100%" height="48px" />
        <LoadingSkeleton variant="text" width="100%" height="48px" />
      </div>
      
      <div className="flex gap-2">
        <LoadingSkeleton variant="button" width="120px" height="32px" />
        <LoadingSkeleton variant="button" width="100px" height="32px" />
        <LoadingSkeleton variant="button" width="110px" height="32px" />
      </div>
    </div>
  </div>
);