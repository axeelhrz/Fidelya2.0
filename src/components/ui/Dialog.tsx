'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({ open, onClose, children, className, fullScreen = false }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (open) {
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px'; // Evitar salto de layout
    } else {
      // Restaurar scroll del body cuando el modal se cierra
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = 'unset';
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = 'unset';
    };
  }, [open]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className={cn(
          "fixed inset-0",
          // Z-index ultra alto para estar por encima de todo
          fullScreen ? "z-[999999]" : "z-[99999] flex items-center justify-center"
        )}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "fixed inset-0",
              fullScreen ? "bg-black/80 backdrop-blur-lg" : "bg-black/60 backdrop-blur-sm"
            )}
            onClick={onClose}
          />
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: fullScreen ? 0.98 : 0.95, 
              y: fullScreen ? 10 : 20 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0 
            }}
            exit={{ 
              opacity: 0, 
              scale: fullScreen ? 0.98 : 0.95, 
              y: fullScreen ? 10 : 20 
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "relative bg-white shadow-2xl overflow-hidden",
              fullScreen 
                ? "fixed inset-0 w-screen h-screen" 
                : "rounded-2xl max-w-md w-full mx-4 max-h-[90vh]",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className={cn(
                "absolute p-3 text-gray-400 hover:text-gray-600 transition-colors hover:bg-white/90 rounded-full",
                // Z-index alto para el botón de cerrar
                "z-[999999]",
                fullScreen 
                  ? "top-8 right-8 bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white" 
                  : "top-4 right-4 bg-white/80 backdrop-blur-sm"
              )}
            >
              <X size={fullScreen ? 28 : 20} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Usar portal para renderizar el modal directamente en el body
  return createPortal(modalContent, document.body);
};

export const DialogContent: React.FC<DialogContentProps> = ({ children, className, fullScreen = false }) => (
  <div className={cn(
    fullScreen 
      ? "h-full overflow-y-auto p-8 pt-24" 
      : "p-6", 
    className
  )}>
    {children}
  </div>
);

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => (
  <div className={cn("pb-6", className)}>
    {children}
  </div>
);

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => (
  <h2 className={cn("text-2xl font-bold text-gray-900", className)}>
    {children}
  </h2>
);

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => (
  <div className={cn(
    "flex gap-4 pt-6 border-t border-gray-200 bg-gray-50/80 backdrop-blur-sm sticky bottom-0 p-8 mt-8", 
    className
  )}>
    {children}
  </div>
);