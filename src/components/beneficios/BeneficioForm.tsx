'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  X,
  Calendar,
  DollarSign,
  Percent,
  Gift,
  AlertCircle,
  Info,
  Star,
  Tag,
  Clock,
  Users,
  Package
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { BeneficiosService } from '@/services/beneficios.service';
import type { Beneficio } from '@/types/beneficio';
import toast from 'react-hot-toast';

interface BeneficioFormProps {
  isOpen: boolean;
  onClose: () => void;
  beneficio?: Beneficio | null;
  comercioId: string;
}

export const BeneficioForm: React.FC<BeneficioFormProps> = ({
  isOpen,
  onClose,
  beneficio,
  comercioId
}) => {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    tipo: 'porcentaje' as 'porcentaje' | 'monto_fijo' | 'producto_gratis',
    descuento: '',
    fechaInicio: '',
    fechaFin: '',
    limitePorSocio: '',
    limiteTotal: '',
    condiciones: '',
    destacado: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '0px';
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (beneficio) {
      // Formatear fechas para inputs de tipo date
      const formatearFechaParaInput = (timestamp: unknown) => {
        try {
          let fecha: Date;
          
          // Verificar si es un Timestamp de Firebase
          if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
            fecha = (timestamp as Timestamp).toDate();
          } else if (timestamp instanceof Date) {
            fecha = timestamp;
          } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            fecha = new Date(timestamp);
          } else {
            return '';
          }
          
          // Verificar que la fecha sea válida
          if (isNaN(fecha.getTime())) {
            return '';
          }
          
          return fecha.toISOString().split('T')[0];
        } catch (error) {
          console.warn('Error formatting date:', error);
          return '';
        }
      };

      setFormData({
        titulo: beneficio.titulo || '',
        descripcion: beneficio.descripcion || '',
        categoria: beneficio.categoria || '',
        tipo: beneficio.tipo || 'porcentaje',
        descuento: beneficio.descuento?.toString() || '',
        fechaInicio: formatearFechaParaInput(beneficio.fechaInicio),
        fechaFin: formatearFechaParaInput(beneficio.fechaFin),
        limitePorSocio: beneficio.limitePorSocio?.toString() || '',
        limiteTotal: beneficio.limiteTotal?.toString() || '',
        condiciones: beneficio.condiciones || '',
        destacado: beneficio.destacado || false
      });
    } else {
      // Valores por defecto para nuevo beneficio
      const hoy = new Date();
      const enUnMes = new Date();
      enUnMes.setMonth(enUnMes.getMonth() + 1);

      setFormData({
        titulo: '',
        descripcion: '',
        categoria: '',
        tipo: 'porcentaje',
        descuento: '',
        fechaInicio: hoy.toISOString().split('T')[0],
        fechaFin: enUnMes.toISOString().split('T')[0],
        limitePorSocio: '',
        limiteTotal: '',
        condiciones: '',
        destacado: false
      });
    }
  }, [beneficio]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validaciones básicas
    const newErrors: Record<string, string> = {};
    if (!formData.titulo.trim()) newErrors.titulo = 'El título es requerido';
    if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida';
    if (!formData.categoria.trim()) newErrors.categoria = 'La categoría es requerida';
    if (!formData.descuento.trim()) newErrors.descuento = 'El descuento es requerido';
    if (!formData.fechaInicio) newErrors.fechaInicio = 'La fecha de inicio es requerida';
    if (!formData.fechaFin) newErrors.fechaFin = 'La fecha de fin es requerida';

    // Validar que la fecha de fin sea posterior a la de inicio
    if (formData.fechaInicio && formData.fechaFin) {
      const fechaInicio = new Date(formData.fechaInicio);
      const fechaFin = new Date(formData.fechaFin);
      if (fechaFin <= fechaInicio) {
        newErrors.fechaFin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }

    // Validar descuento según el tipo
    const descuentoNum = parseFloat(formData.descuento);
    if (isNaN(descuentoNum) || descuentoNum <= 0) {
      newErrors.descuento = 'El descuento debe ser un número mayor a 0';
    } else if (formData.tipo === 'porcentaje' && descuentoNum > 100) {
      newErrors.descuento = 'El porcentaje no puede ser mayor a 100';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const beneficioData = {
        titulo: formData.titulo.trim(),
        descripcion: formData.descripcion.trim(),
        categoria: formData.categoria.trim(),
        tipo: formData.tipo,
        descuento: parseFloat(formData.descuento),
        fechaInicio: new Date(formData.fechaInicio),
        fechaFin: new Date(formData.fechaFin),
        limitePorSocio: formData.limitePorSocio ? parseInt(formData.limitePorSocio) : undefined,
        limiteTotal: formData.limiteTotal ? parseInt(formData.limiteTotal) : undefined,
        condiciones: formData.condiciones.trim() || undefined,
        destacado: formData.destacado
      };

      if (beneficio?.id) {
        await BeneficiosService.actualizarBeneficio(beneficio.id, beneficioData);
        toast.success('Beneficio actualizado exitosamente');
      } else {
        await BeneficiosService.crearBeneficio(beneficioData, comercioId, 'comercio');
        toast.success('Beneficio creado exitosamente');
      }
      
      onClose();
    } catch (error) {
      console.error('Error al guardar beneficio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el beneficio';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      categoria: '',
      tipo: 'porcentaje',
      descuento: '',
      fechaInicio: '',
      fechaFin: '',
      limitePorSocio: '',
      limiteTotal: '',
      condiciones: '',
      destacado: false
    });
    setErrors({});
    onClose();
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {beneficio ? 'Editar Beneficio' : 'Crear Nuevo Beneficio'}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {beneficio ? 'Modifica los detalles del beneficio' : 'Completa la información del beneficio'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Información Básica */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    Información Básica
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título del Beneficio *
                      </label>
                      <input
                        type="text"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors.titulo ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="Ej: 20% de descuento en toda la tienda"
                      />
                      {errors.titulo && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.titulo}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría *
                      </label>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.categoria}
                          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.categoria ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                          placeholder="Ej: Alimentación, Ropa, Servicios"
                        />
                      </div>
                      {errors.categoria && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.categoria}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      rows={3}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                        errors.descripcion ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Describe los detalles del beneficio, términos y condiciones..."
                    />
                    {errors.descripcion && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.descripcion}
                      </p>
                    )}
                  </div>
                </div>

                {/* Configuración del Descuento */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Configuración del Descuento
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Beneficio *
                      </label>
                      <select
                        value={formData.tipo}
                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'porcentaje' | 'monto_fijo' | 'producto_gratis' })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="porcentaje">Porcentaje de descuento</option>
                        <option value="monto_fijo">Monto fijo de descuento</option>
                        <option value="producto_gratis">Producto/Servicio gratis</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor del Descuento *
                      </label>
                      <div className="relative">
                        {formData.tipo === 'porcentaje' ? (
                          <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        ) : formData.tipo === 'monto_fijo' ? (
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        ) : (
                          <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        )}
                        <input
                          type="number"
                          value={formData.descuento}
                          onChange={(e) => setFormData({ ...formData, descuento: e.target.value })}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.descuento ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                          placeholder={
                            formData.tipo === 'porcentaje' ? '20' : 
                            formData.tipo === 'monto_fijo' ? '1000' : '1'
                          }
                          min="0"
                          max={formData.tipo === 'porcentaje' ? '100' : undefined}
                          step={formData.tipo === 'porcentaje' ? '0.1' : '1'}
                        />
                      </div>
                      {errors.descuento && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.descuento}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fechas y Límites */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-500" />
                    Fechas y Límites
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Inicio *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.fechaInicio ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        />
                      </div>
                      {errors.fechaInicio && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.fechaInicio}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Fin *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.fechaFin}
                          onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                          className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors.fechaFin ? 'border-red-300 bg-red-50' : 'border-gray-200'
                          }`}
                        />
                      </div>
                      {errors.fechaFin && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {errors.fechaFin}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Límite por Socio
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.limitePorSocio}
                          onChange={(e) => setFormData({ ...formData, limitePorSocio: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Sin límite"
                          min="1"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Máximo de veces que un socio puede usar este beneficio</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Límite Total
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.limiteTotal}
                          onChange={(e) => setFormData({ ...formData, limiteTotal: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Sin límite"
                          min="1"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Máximo total de usos para este beneficio</p>
                    </div>
                  </div>
                </div>

                {/* Condiciones Adicionales */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Condiciones Adicionales
                    </label>
                    <textarea
                      value={formData.condiciones}
                      onChange={(e) => setFormData({ ...formData, condiciones: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      placeholder="Términos y condiciones específicos del beneficio..."
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="destacado"
                      checked={formData.destacado}
                      onChange={(e) => setFormData({ ...formData, destacado: e.target.checked })}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="destacado" className="text-sm font-medium text-gray-700">
                      Marcar como beneficio destacado
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {beneficio ? 'Actualizar' : 'Crear'} Beneficio
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};