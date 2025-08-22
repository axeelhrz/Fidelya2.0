'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses = {
  primary: cn(
    "bg-gradient-to-r from-primary-500 to-violet-500 text-white",
    "hover:from-primary-600 hover:to-violet-600",
    "focus:ring-2 focus:ring-primary-500/20",
    "shadow-lg shadow-primary-500/25"
  ),
  secondary: cn(
    "bg-white text-slate-700 border border-slate-200",
    "hover:bg-slate-50 hover:border-slate-300",
    "focus:ring-2 focus:ring-slate-500/20"
  ),
  danger: cn(
    "bg-gradient-to-r from-red-500 to-red-600 text-white",
    "hover:from-red-600 hover:to-red-700",
    "focus:ring-2 focus:ring-red-500/20",
    "shadow-lg shadow-red-500/25"
  ),
  ghost: cn(
    "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
    "focus:ring-2 focus:ring-slate-500/20"
  ),
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export const ModalButton: React.FC<ModalButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}) => {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
        "transition-all duration-200 ease-out",
        "focus:outline-none focus:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
};
