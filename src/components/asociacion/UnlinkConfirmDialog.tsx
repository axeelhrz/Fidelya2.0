'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  X,
  Unlink,
} from 'lucide-react';

interface UnlinkConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const UnlinkConfirmDialog: React.FC<UnlinkConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Desvincular',
  cancelText = 'Cancelar',
  loading = false,
}) => {
  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Dialog sin fondo oscurecido */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl border border-orange-200 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-orange-50 px-6 py-4 border-b border-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-orange-900">
                        {title}
                      </h3>
                      <p className="text-orange-700 text-sm">
                        El socio mantendrá su cuenta pero perderá acceso a los beneficios
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="text-orange-400 hover:text-orange-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="text-gray-700 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 px-6 py-4 flex flex-col gap-3 sm:flex-row-reverse">
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Desvinculando...
                    </>
                  ) : (
                    <>
                      <Unlink className="w-4 h-4 mr-2" />
                      {confirmText}
                    </>
                  )}
                </button>
                
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};