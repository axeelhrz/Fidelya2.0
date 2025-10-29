'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedDialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const EnhancedDialog: React.FC<EnhancedDialogProps> = ({ 
  open, 
  onClose, 
  children, 
  className,
  size = 'md'
}) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ 
              duration: 0.3,
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            className={cn(
              "relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-hidden",
              "border border-slate-200/50",
              sizeClasses[size],
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-full z-10",
                "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
                "transition-all duration-200 ease-out",
                "focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              )}
            >
              <X size={20} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => (
  <div className={cn("p-6 overflow-y-auto max-h-[calc(90vh-8rem)]", className)}>
    {children}
  </div>
);

export const DialogHeader: React.FC<DialogHeaderProps> = ({ 
  children, 
  className, 
  gradient = false 
}) => (
  <div className={cn(
    "px-6 py-6 border-b border-slate-100",
    gradient && "bg-gradient-to-r from-primary-500 to-violet-500 text-white border-none",
    className
  )}>
    {children}
  </div>
);

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => (
  <h2 className={cn(
    "text-xl font-bold text-slate-900 font-jakarta leading-tight",
    className
  )}>
    {children}
  </h2>
);

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => (
  <p className={cn(
    "text-sm text-slate-600 mt-2 leading-relaxed",
    className
  )}>
    {children}
  </p>
);

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (
  <div className={cn(
    "flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/50 border-t border-slate-100",
    className
  )}>
    {children}
  </div>
);
