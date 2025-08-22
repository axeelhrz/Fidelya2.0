'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'danger' | 'warning' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const variants = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl border border-blue-600 hover:border-blue-700',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300 hover:border-slate-400 shadow-sm hover:shadow-md',
  outline: 'border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 bg-white shadow-sm hover:shadow-md',
  ghost: 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200',
  gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl border border-transparent',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl border border-red-600 hover:border-red-700',
  warning: 'bg-orange-600 hover:bg-orange-700 text-white shadow-lg hover:shadow-xl border border-orange-600 hover:border-orange-700',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-xl border border-emerald-600 hover:border-emerald-700'
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-xs',
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
  xl: 'px-8 py-4 text-base'
};

const roundedSizes = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    rounded = 'xl',
    fullWidth = false,
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold',
          'transition-all duration-200 ease-in-out',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
          'active:scale-[0.98] hover:scale-[1.02] transform',
          'relative overflow-hidden',
          variants[variant],
          sizes[size],
          roundedSizes[rounded],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {/* Efecto de brillo en hover */}
        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : leftIcon ? (
          <span className="w-4 h-4 flex items-center justify-center">{leftIcon}</span>
        ) : null}
        
        <span className="relative z-10">{loading ? 'Cargando...' : children}</span>
        
        {rightIcon && !loading && (
          <span className="w-4 h-4 flex items-center justify-center">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";