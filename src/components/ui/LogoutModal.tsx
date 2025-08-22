'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  isLoading,
  onConfirm,
  onCancel
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/50 p-8 max-w-md w-full mx-4"
          >
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center">
                <LogOut className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Confirmar Cierre de Sesión
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  ¿Estás seguro de que deseas cerrar tu sesión?
                </p>
              </div>
            </div>
            
            <p className="text-slate-600 mb-8">
              Se cerrará tu sesión actual y serás redirigido a la página de inicio de sesión. 
              Cualquier trabajo no guardado se perderá.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-colors duration-200 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-semibold transition-all duration-200 disabled:opacity-60"
              >
                {isLoading ? 'Cerrando Sesión...' : 'Cerrar Sesión'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
