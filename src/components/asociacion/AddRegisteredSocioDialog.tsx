'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserPlus,
  X,
  AlertCircle,
  CheckCircle,
  Bug,
  RefreshCw
} from 'lucide-react';
import { VincularSocioDialog } from './VincularSocioDialog';
import { useSocioAsociacion } from '@/hooks/useSocioAsociacion';
import toast from 'react-hot-toast';

interface AddRegisteredSocioDialogProps {
  onSocioAdded?: () => void;
}

export const AddRegisteredSocioDialog: React.FC<AddRegisteredSocioDialogProps> = ({
  onSocioAdded
}) => {
  const { sincronizarAsociacion, debugVinculacion } = useSocioAsociacion();
  const [showVincularDialog, setShowVincularDialog] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugUserId, setDebugUserId] = useState('');
  const [syncing, setSyncing] = useState(false);

  const handleSocioAdded = () => {
    setShowVincularDialog(false);
    onSocioAdded?.();
  };

  const handleSyncUser = async () => {
    if (!debugUserId.trim()) {
      toast.error('Ingresa un ID de usuario válido');
      return;
    }

    setSyncing(true);
    try {
      const result = await sincronizarAsociacion(debugUserId);
      if (result) {
        toast.success('Sincronización completada');
        onSocioAdded?.(); // Refrescar la lista
      }
    } catch {
      toast.error('Error en la sincronización');
    } finally {
      setSyncing(false);
    }
  };

  const handleDebugUser = async () => {
    if (!debugUserId.trim()) {
      toast.error('Ingresa un ID de usuario válido');
      return;
    }

    await debugVinculacion(debugUserId);
    toast.success('Información de debug enviada a la consola');
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowVincularDialog(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Vincular Socio Existente
        </button>
        
        <button
          onClick={() => setShowDebugDialog(true)}
          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Herramientas de debug"
        >
          <Bug className="w-4 h-4" />
        </button>
      </div>

      {/* Dialog de vinculación */}
      <VincularSocioDialog
        open={showVincularDialog}
        onClose={() => setShowVincularDialog(false)}
        onSuccess={handleSocioAdded}
      />

      {/* Dialog de debug */}
      <AnimatePresence>
        {showDebugDialog && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 transition-opacity bg-black bg-opacity-25"
                onClick={() => setShowDebugDialog(false)}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-xl shadow-2xl sm:my-8 sm:align-middle sm:max-w-md sm:w-full border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bug className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Herramientas de Debug
                        </h3>
                        <p className="text-sm text-gray-600">
                          Diagnosticar problemas de vinculación
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDebugDialog(false)}
                      className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID del Usuario/Socio
                      </label>
                      <input
                        type="text"
                        value={debugUserId}
                        onChange={(e) => setDebugUserId(e.target.value)}
                        placeholder="Ingresa el ID del usuario o socio"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-700">
                          <p className="font-medium mb-1">Información de Debug</p>
                          <p>Estas herramientas te ayudan a diagnosticar problemas cuando un socio no aparece vinculado correctamente.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleDebugUser}
                        disabled={!debugUserId.trim()}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Bug className="w-4 h-4" />
                        <span>Ver Info en Consola</span>
                      </button>

                      <button
                        onClick={handleSyncUser}
                        disabled={!debugUserId.trim() || syncing}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {syncing ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        <span>{syncing ? 'Sincronizando...' : 'Sincronizar Asociación'}</span>
                      </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-sm text-blue-700">
                        <p className="font-medium mb-2">Pasos para resolver problemas:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Usa &quot;Ver Info en Consola&quot; para revisar el estado actual</li>
                          <li>Usa &quot;Sincronizar Asociación&quot; para corregir inconsistencias</li>
                          <li>Verifica que el usuario tenga role &quot;socio&quot;</li>
                          <li>Asegúrate de que el email coincida en ambas colecciones</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDebugDialog(false)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};