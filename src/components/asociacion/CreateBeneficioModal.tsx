'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Calendar, DollarSign, Tag, Store, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useComercios } from '@/hooks/useComercios';
import { BeneficiosService } from '@/services/beneficios.service';
import { CATEGORIAS_BENEFICIOS, BeneficioFormData } from '@/types/beneficio';
import toast from 'react-hot-toast';

interface CreateBeneficioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateBeneficioModal: React.FC<CreateBeneficioModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const { comerciosVinculados, loadComercios, loading: comerciosLoading } = useComercios();
  
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [formData, setFormData] = useState<BeneficioFormData>({
    titulo: '',
    descripcion: '',
    descuento: 0,
    tipo: 'porcentaje',
    fechaInicio: new Date(),
    fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
    categoria: CATEGORIAS_BENEFICIOS[0],
    limitePorSocio: undefined,
    limiteTotal: undefined,
    condiciones: '',
    tags: [],
    destacado: false,
    asociacionesDisponibles: user ? [user.uid] : []
  });

  const [selectedComercio, setSelectedComercio] = useState('');
  const [newTag, setNewTag] = useState('');

  // Debug function
  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugInfo(prev => `${prev}\n[${timestamp}] ${info}`);
    console.log(`[CreateBeneficioModal] ${info}`);
  };

  // Cargar comercios vinculados cuando se abre el modal
  useEffect(() => {
    if (isOpen && user && user.role === 'asociacion') {
      addDebugInfo(`Modal abierto para asociación: ${user.uid}`);
      addDebugInfo('Cargando comercios vinculados...');
      loadComercios();
    }
  }, [isOpen, user, loadComercios]);

  // Monitor comercios loading
  useEffect(() => {
    if (isOpen) {
      addDebugInfo(`Comercios vinculados: ${comerciosVinculados.length}`);
      if (comerciosVinculados.length > 0) {
        addDebugInfo(`Comercios disponibles: ${comerciosVinculados.map(c => c.nombreComercio).join(', ')}`);
      }
    }
  }, [comerciosVinculados, isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      addDebugInfo('Reseteando formulario...');
      setFormData({
        titulo: '',
        descripcion: '',
        descuento: 0,
        tipo: 'porcentaje',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        categoria: CATEGORIAS_BENEFICIOS[0],
        limitePorSocio: undefined,
        limiteTotal: undefined,
        condiciones: '',
        tags: [],
        destacado: false,
        asociacionesDisponibles: user ? [user.uid] : []
      });
      setSelectedComercio('');
      setNewTag('');
      setDebugInfo(''); // Clear debug info when modal opens
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    addDebugInfo('Iniciando proceso de creación de beneficio...');
    
    if (!user) {
      const error = 'Debes iniciar sesión para crear un beneficio';
      addDebugInfo(`Error: ${error}`);
      toast.error(error);
      return;
    }

    if (!selectedComercio) {
      const error = 'Selecciona un comercio para el beneficio';
      addDebugInfo(`Error: ${error}`);
      toast.error(error);
      return;
    }

    if (formData.fechaInicio >= formData.fechaFin) {
      const error = 'La fecha de fin debe ser posterior a la fecha de inicio';
      addDebugInfo(`Error: ${error}`);
      toast.error(error);
      return;
    }

    if (formData.titulo.trim().length < 3) {
      const error = 'El título debe tener al menos 3 caracteres';
      addDebugInfo(`Error: ${error}`);
      toast.error(error);
      return;
    }

    if (formData.descripcion.trim().length < 10) {
      const error = 'La descripción debe tener al menos 10 caracteres';
      addDebugInfo(`Error: ${error}`);
      toast.error(error);
      return;
    }

    if (formData.tipo !== 'producto_gratis' && formData.descuento <= 0) {
      const error = 'El descuento debe ser mayor a 0';
      addDebugInfo(`Error: ${error}`);
      toast.error(error);
      return;
    }

    if (formData.tipo === 'porcentaje' && formData.descuento > 100) {
      const error = 'El descuento porcentual no puede ser mayor a 100%';
      addDebugInfo(`Error: ${error}`);
      toast.error(error);
      return;
    }

    setLoading(true);
    try {
      // Asegurarse de que asociacionesDisponibles incluya el ID de la asociación actual
      const updatedFormData = {
        ...formData,
        comercioId: selectedComercio,
        asociacionesDisponibles: user.role === 'asociacion' ? [user.uid] : formData.asociacionesDisponibles
      };

      addDebugInfo(`Datos del beneficio: ${JSON.stringify({
        titulo: updatedFormData.titulo,
        comercioId: selectedComercio,
        tipo: updatedFormData.tipo,
        descuento: updatedFormData.descuento,
        userRole: user.role,
        userId: user.uid
      })}`);

      await BeneficiosService.crearBeneficio(updatedFormData, user.uid, user.role);
      
      addDebugInfo('✅ Beneficio creado exitosamente');
      toast.success('Beneficio creado exitosamente');
      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      addDebugInfo(`❌ Error al crear beneficio: ${errorMessage}`);
      console.error('Error creating beneficio:', error);
      toast.error('Error al crear el beneficio: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
      addDebugInfo(`Tag agregado: ${newTag.trim()}`);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
    addDebugInfo(`Tag removido: ${tagToRemove}`);
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Crear Nuevo Beneficio
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configura un nuevo beneficio para tus socios
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Debug Info (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Debug Info</h4>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {debugInfo}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Status de comercios */}
              {comerciosLoading && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-blue-700 text-sm">Cargando comercios vinculados...</span>
                  </div>
                </div>
              )}

              {!comerciosLoading && comerciosVinculados.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-yellow-800 font-medium">No hay comercios vinculados</h4>
                      <p className="text-yellow-700 text-sm mt-1">
                        Debes vincular al menos un comercio antes de crear beneficios. 
                        Ve a la sección de Comercios para vincular comercios a tu asociación.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!comerciosLoading && comerciosVinculados.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="text-green-800 font-medium">
                        {comerciosVinculados.length} comercio{comerciosVinculados.length !== 1 ? 's' : ''} disponible{comerciosVinculados.length !== 1 ? 's' : ''}
                      </h4>
                      <p className="text-green-700 text-sm mt-1">
                        Puedes crear beneficios para cualquiera de estos comercios vinculados.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Información básica */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="form-label">
                    <Gift className="w-4 h-4 inline mr-2" />
                    Título del beneficio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    className="form-input"
                    placeholder="Ej: 20% de descuento en productos seleccionados"
                    minLength={3}
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="form-label">Descripción *</label>
                  <textarea
                    required
                    value={formData.descripcion}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="form-input h-24 resize-none"
                    placeholder="Describe los detalles del beneficio..."
                    minLength={10}
                  />
                </div>

                <div>
                  <label className="form-label">
                    <Store className="w-4 h-4 inline mr-2" />
                    Comercio *
                  </label>
                  <select
                    required
                    value={selectedComercio}
                    onChange={(e) => {
                      setSelectedComercio(e.target.value);
                      addDebugInfo(`Comercio seleccionado: ${e.target.value}`);
                    }}
                    className="form-select"
                    disabled={comerciosLoading || comerciosVinculados.length === 0}
                  >
                    <option value="">
                      {comerciosLoading ? 'Cargando comercios...' : 'Seleccionar comercio'}
                    </option>
                    {comerciosVinculados.length > 0 ? (
                      comerciosVinculados.map(comercio => (
                        <option key={comercio.id} value={comercio.id}>
                          {comercio.nombreComercio}
                        </option>
                      ))
                    ) : (
                      !comerciosLoading && (
                        <option value="" disabled>No hay comercios disponibles</option>
                      )
                    )}
                  </select>
                  {!comerciosLoading && comerciosVinculados.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No hay comercios vinculados. Debes vincular comercios antes de crear beneficios.
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    <Tag className="w-4 h-4 inline mr-2" />
                    Categoría *
                  </label>
                  <select
                    required
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                    className="form-select"
                  >
                    {CATEGORIAS_BENEFICIOS.map(categoria => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Configuración del descuento */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <DollarSign className="w-5 h-5 inline mr-2" />
                  Configuración del Descuento
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Tipo de descuento *</label>
                    <select
                      required
                      value={formData.tipo}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        tipo: e.target.value as 'porcentaje' | 'monto_fijo' | 'producto_gratis',
                        descuento: e.target.value === 'producto_gratis' ? 0 : prev.descuento
                      }))}
                      className="form-select"
                    >
                      <option value="porcentaje">Porcentaje</option>
                      <option value="monto_fijo">Monto fijo</option>
                      <option value="producto_gratis">Producto gratis</option>
                    </select>
                  </div>

                  {formData.tipo !== 'producto_gratis' && (
                    <div>
                      <label className="form-label">
                        Valor del descuento *
                      </label>
                      <div className="relative">
                        {formData.tipo === 'porcentaje' && (
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            %
                          </span>
                        )}
                        {formData.tipo === 'monto_fijo' && (
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                            $
                          </span>
                        )}
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          max={formData.tipo === 'porcentaje' ? 100 : undefined}
                          value={formData.descuento}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            descuento: parseFloat(e.target.value) || 0 
                          }))}
                          className={`form-input ${
                            formData.tipo === 'monto_fijo' ? 'pl-8' : 
                            formData.tipo === 'porcentaje' ? 'pr-8' : ''
                          }`}
                          placeholder="0"
                        />
                      </div>
                      {formData.tipo === 'porcentaje' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Máximo 100%
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Fechas y límites */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Calendar className="w-5 h-5 inline mr-2" />
                  Vigencia y Límites
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Fecha de inicio *</label>
                    <input
                      type="date"
                      required
                      value={formatDateForInput(formData.fechaInicio)}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        fechaInicio: new Date(e.target.value) 
                      }))}
                      className="form-input"
                      min={formatDateForInput(new Date())}
                    />
                  </div>

                  <div>
                    <label className="form-label">Fecha de fin *</label>
                    <input
                      type="date"
                      required
                      value={formatDateForInput(formData.fechaFin)}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        fechaFin: new Date(e.target.value) 
                      }))}
                      className="form-input"
                      min={formatDateForInput(formData.fechaInicio)}
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      <Users className="w-4 h-4 inline mr-2" />
                      Límite por socio
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.limitePorSocio || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        limitePorSocio: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="form-input"
                      placeholder="Sin límite"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo de usos por socio (opcional)
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Límite total</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.limiteTotal || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        limiteTotal: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      className="form-input"
                      placeholder="Sin límite"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Máximo de usos totales (opcional)
                    </p>
                  </div>
                </div>
              </div>

              {/* Condiciones y tags */}
              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Condiciones y términos</label>
                    <textarea
                      value={formData.condiciones}
                      onChange={(e) => setFormData(prev => ({ ...prev, condiciones: e.target.value }))}
                      className="form-input h-20 resize-none"
                      placeholder="Términos y condiciones del beneficio..."
                    />
                  </div>

                  <div>
                    <label className="form-label">Etiquetas</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        className="form-input flex-1"
                        placeholder="Agregar etiqueta..."
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="btn-secondary"
                        disabled={!newTag.trim()}
                      >
                        Agregar
                      </button>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="destacado"
                      checked={formData.destacado}
                      onChange={(e) => setFormData(prev => ({ ...prev, destacado: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="destacado" className="text-sm font-medium text-gray-700">
                      Marcar como beneficio destacado
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || comerciosVinculados.length === 0}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creando...
                  </div>
                ) : (
                  'Crear Beneficio'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};