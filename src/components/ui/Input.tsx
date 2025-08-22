'use client';

import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    label, 
    error, 
    icon, 
    type = 'text',
    helperText,
    disabled,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const id = useId();
    
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        {label && (
          <label
            htmlFor={id}
            className={cn(
              'block text-sm font-medium',
              error ? 'text-red-500' : 'text-gray-700'
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              <span className="w-4 h-4 block">{icon}</span>
            </div>
          )}

          <input
            ref={ref}
            id={id}
            type={inputType}
            className={cn(
              'w-full px-4 py-3 rounded-xl border text-sm transition-colors',
              'placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none',
              'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
              icon && 'pl-12',
              isPassword && 'pr-12',
              error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:border-indigo-500',
              className
            )}
            disabled={disabled}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}

          {error && !isPassword && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <AlertCircle size={16} className="text-red-500" />
            </div>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-red-500 mt-1"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {!error && helperText && (
          <p className="text-sm text-gray-500 mt-1">{helperText}</p>
        )}
      </motion.div>
    );
  }
);

Input.displayName = "Input";