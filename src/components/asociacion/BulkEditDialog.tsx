'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Users, 
  Shield,
  Calendar,
  DollarSign,
  Loader2,
  Save,
  AlertCircle
} from 'lucide-react';

interface BulkEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (updates: BulkUpdateData) => Promise<void>;
  selectedCount: number;
  loading?: boolean;
}

export interface BulkUpdateData {
  estado?: string;
  estadoMembresia?: string;
  montoCuota?: number;
  fechaVencimiento?: Date;
}

export const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  open,
  onClose,
  onSave,
  selectedCount,
  loading = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateFields, setUpdateFields] = useState({
    updateEstado: false,
    updateEstadoMembresia: false,
    updateMontoCuota: false,
    updateFechaVencimiento: false
  });

  const [formData, setFormData] = useState<BulkUpdateData>({
    estado: 'activo',
    estadoMembresia: 'al_dia',
    montoCuota: 0,
    fechaVencimiento: undefined
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construir objeto solo con los campos seleccionados
    const updates: BulkUpdateData = {};
    
    if (updateFields.updateEstado) {
      updates.estado = formData.estado;
    }
    if (updateFields.updateEstadoMembresia) {
      updates.estadoMembresia = formData.estadoMembresia;
    }
    if (updateFields.updateMontoCuota) {
      updates.montoCuota = formData.montoCuota;
    }
    if (updateFields.updateFechaVencimiento && formData.fechaVencimiento) {
      updates.fechaVencimiento = formData.fechaVencimiento;
    }

    // Validar que al menos un campo esté seleccionado
    if (Object.keys(updates).length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(updates);
      onClose();
    } catch (error) {
      console.error('Error in bulk update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting || loading) return;
    setUpdateFields({
      updateEstado: false,
      updateEstadoMembresia: false,
      updateMontoCuota: false,
      updateFechaVencimiento: false
    });
    setFormData({
      estado: 'activo',
      estadoMembresia: 'al_dia',
      montoCuota: 0,
      fechaVencimiento: undefined
    });
    onClose();
  };

  if (!open) return null;

  const hasSelectedFields = Object.values(updateFields).some(v => v);

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ 
              type: "spring", 
              duration: 0.6,
              bounce: 0.3
            }}
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-8 py-8">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute -top-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute top-8 right-8 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
              </div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">
                      Edición Masiva
                    </h2>
                    <p className="text-blue-100 text-lg">
                      Actualizar {selectedCount} {selectedCount === 1 ? 'socio' : 'socios'} seleccionados
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSubmitting || loading}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-50 group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
              <form onSubmit={handleSubmit} className="p-8">
                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-blue-900">Edición Masiva</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Selecciona los campos que deseas actualizar. Solo los campos marcados serán modificados en los {selectedCount} socios seleccionados.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Estado del Socio */}
                  <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="updateEstado"
                        checked={updateFields.updateEstado}
                        onChange={(e) => setUpdateFields(prev => ({ ...prev, updateEstado: e.target.checked }))}
                        className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="updateEstado" className="flex items-center space-x-2 cursor-pointer">
                          <Shield className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium text-slate-900">Estado del Socio</span>
                        </label>
                        <select
                          value={formData.estado}
                          onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                          disabled={!updateFields.updateEstado}
                          className="mt-2 w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                        >
                          <option value="activo">✅ Activo</option>
                          <option value="inactivo">⏸️ Inactivo</option>
                          <option value="suspendido">🚫 Suspendido</option>
                          <option value="pendiente">⏳ Pendiente</option>
                          <option value="vencido">⚠️ Vencido</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Estado de Membresía */}
                  <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="updateEstadoMembresia"
                        checked={updateFields.updateEstadoMembresia}
                        onChange={(e) => setUpdateFields(prev => ({ ...prev, updateEstadoMembresia: e.target.checked }))}
                        className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="updateEstadoMembresia" className="flex items-center space-x-2 cursor-pointer">
                          <Shield className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-slate-900">Estado de Membresía</span>
                        </label>
                        <select
                          value={formData.estadoMembresia}
                          onChange={(e) => setFormData(prev => ({ ...prev, estadoMembresia: e.target.value }))}
                          disabled={!updateFields.updateEstadoMembresia}
                          className="mt-2 w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                        >
                          <option value="al_dia">💚 Al día</option>
                          <option value="vencido">🔴 Vencido</option>
                          <option value="pendiente">🟡 Pendiente</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Monto de Cuota */}
                  <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="updateMontoCuota"
                        checked={updateFields.updateMontoCuota}
                        onChange={(e) => setUpdateFields(prev => ({ ...prev, updateMontoCuota: e.target.checked }))}
                        className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="updateMontoCuota" className="flex items-center space-x-2 cursor-pointer">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium text-slate-900">Monto de Cuota ($)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.montoCuota}
                          onChange={(e) => setFormData(prev => ({ ...prev, montoCuota: parseFloat(e.target.value) || 0 }))}
                          disabled={!updateFields.updateMontoCuota}
                          className="mt-2 w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fecha de Vencimiento */}
                  <div className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="updateFechaVencimiento"
                        checked={updateFields.updateFechaVencimiento}
                        onChange={(e) => setUpdateFields(prev => ({ ...prev, updateFechaVencimiento: e.target.checked }))}
                        className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="updateFechaVencimiento" className="flex items-center space-x-2 cursor-pointer">
                          <Calendar className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium text-slate-900">Fecha de Vencimiento</span>
                        </label>
                        <input
                          type="date"
                          value={formData.fechaVencimiento ? formData.fechaVencimiento.toISOString().split('T')[0] : ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, fechaVencimiento: e.target.value ? new Date(e.target.value) : undefined }))}
                          disabled={!updateFields.updateFechaVencimiento}
                          className="mt-2 w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center mt-8 pt-6 border-t border-slate-200 space-x-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting || loading}
                    className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || loading || !hasSelectedFields}
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting || loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Actualizando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Actualizar {selectedCount} {selectedCount === 1 ? 'Socio' : 'Socios'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
