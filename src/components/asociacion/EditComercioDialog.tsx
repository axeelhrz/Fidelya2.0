'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Store,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  FileText,
  Loader2,
  Building,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Settings
} from 'lucide-react';
import type { Comercio } from '@/services/comercio.service';

interface EditComercioDialogProps {
  open: boolean;
  comercio: Comercio | null;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<Comercio>) => Promise<boolean>;
  loading: boolean;
}

export const EditComercioDialog: React.FC<EditComercioDialogProps> = ({
  open,
  comercio,
  onClose,
  onSubmit,
  loading
}) => {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    nombreComercio: '',
    categoria: '',
    descripcion: '',
    direccion: '',
    telefono: '',
    email: '',
    sitioWeb: '',
    horario: '',
    cuit: '',
    estado: 'activo' as 'activo' | 'inactivo' | 'suspendido',
    visible: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Asegurar que el componente esté montado
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (comercio) {
      setFormData({
        nombreComercio: comercio.nombreComercio || '',
        categoria: comercio.categoria || '',
        descripcion: comercio.descripcion || '',
        direccion: comercio.direccion || '',
        telefono: comercio.telefono || '',
        email: comercio.email || '',
        sitioWeb: comercio.sitioWeb || '',
        horario: comercio.horario || '',
        cuit: comercio.cuit || '',
        estado: ['activo', 'inactivo', 'suspendido'].includes(comercio.estado as string)
          ? (comercio.estado as 'activo' | 'inactivo' | 'suspendido')
          : 'activo',
        visible: comercio.visible !== false
      });
      setErrors({});
    }
  }, [comercio]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombreComercio.trim()) {
      newErrors.nombreComercio = 'El nombre del comercio es requerido';
    }

    if (!formData.categoria.trim()) {
      newErrors.categoria = 'La categoría es requerida';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !comercio) return;

    const success = await onSubmit(comercio.id, formData);
    if (success) {
      onClose();
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getFieldValidationState = (fieldName: string) => {
    if (errors[fieldName]) return 'error';
    const value = formData[fieldName as keyof typeof formData];
    if (value && value.toString().length > 0) return 'success';
    return 'default';
  };

  const getFieldIcon = (fieldName: string) => {
    const state = getFieldValidationState(fieldName);
    if (state === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (state === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    return null;
  };

  const getFieldClasses = (fieldName: string) => {
    const state = getFieldValidationState(fieldName);
    const baseClasses = "w-full px-4 py-3 pl-12 pr-12 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200";
    
    switch (state) {
      case 'error':
        return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50`;
      case 'success':
        return `${baseClasses} border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50`;
      default:
        return `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white`;
    }
  };

  if (!open || !mounted) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-hidden">
        {/* Backdrop con blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Contenedor del modal */}
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
            className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente */}
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 px-8 py-8">
              {/* Elementos decorativos */}
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                <div className="absolute -top-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute top-8 right-8 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
                <div className="absolute bottom-4 left-1/3 w-28 h-28 bg-white/5 rounded-full blur-xl"></div>
              </div>

              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Store className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">
                      Editar Comercio
                    </h2>
                    <p className="text-blue-100 text-lg">
                      Actualiza la información del comercio
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-50 group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <form onSubmit={handleSubmit} className="p-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  {/* Información Personal */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Store className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Información Básica
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre del Comercio *
                      </label>
                      <div className="relative">
                        <Store className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.nombreComercio}
                          onChange={(e) => handleInputChange('nombreComercio', e.target.value)}
                          className={getFieldClasses('nombreComercio')}
                          placeholder="Nombre del comercio"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('nombreComercio')}
                        </div>
                      </div>
                      {errors.nombreComercio && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-600"
                        >
                          {errors.nombreComercio}
                        </motion.p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoría *
                      </label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.categoria}
                          onChange={(e) => handleInputChange('categoria', e.target.value)}
                          className={getFieldClasses('categoria')}
                        >
                          <option value="">Seleccionar categoría</option>
                          <option value="Alimentación">Alimentación</option>
                          <option value="Librería y Papelería">Librería y Papelería</option>
                          <option value="Farmacia y Salud">Farmacia y Salud</option>
                          <option value="Restaurantes y Gastronomía">Restaurantes y Gastronomía</option>
                          <option value="Retail y Moda">Retail y Moda</option>
                          <option value="Salud y Belleza">Salud y Belleza</option>
                          <option value="Deportes y Fitness">Deportes y Fitness</option>
                          <option value="Tecnología">Tecnología</option>
                          <option value="Hogar y Decoración">Hogar y Decoración</option>
                          <option value="Automotriz">Automotriz</option>
                          <option value="Educación">Educación</option>
                          <option value="Entretenimiento">Entretenimiento</option>
                          <option value="Servicios Profesionales">Servicios Profesionales</option>
                          <option value="Turismo y Viajes">Turismo y Viajes</option>
                          <option value="Otros">Otros</option>
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('categoria')}
                        </div>
                      </div>
                      {errors.categoria && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-600"
                        >
                          {errors.categoria}
                        </motion.p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                        <textarea
                          value={formData.descripcion}
                          onChange={(e) => handleInputChange('descripcion', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-all duration-200 resize-none"
                          placeholder="Describe tu comercio..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={getFieldClasses('email')}
                          placeholder="correo@ejemplo.com"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('email')}
                        </div>
                      </div>
                      {errors.email && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-600"
                        >
                          {errors.email}
                        </motion.p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.telefono}
                          onChange={(e) => handleInputChange('telefono', e.target.value)}
                          className={getFieldClasses('telefono')}
                          placeholder="+54 9 11 1234-5678"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('telefono')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dirección
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.direccion}
                          onChange={(e) => handleInputChange('direccion', e.target.value)}
                          className={getFieldClasses('direccion')}
                          placeholder="Dirección completa"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('direccion')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuración Adicional */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Información Adicional
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sitio Web
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          value={formData.sitioWeb}
                          onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
                          className={getFieldClasses('sitioWeb')}
                          placeholder="https://www.ejemplo.com"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('sitioWeb')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horario de Atención
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.horario}
                          onChange={(e) => handleInputChange('horario', e.target.value)}
                          className={getFieldClasses('horario')}
                          placeholder="Lun-Vie 9:00-18:00"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('horario')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CUIT
                      </label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.cuit}
                          onChange={(e) => handleInputChange('cuit', e.target.value)}
                          className={getFieldClasses('cuit')}
                          placeholder="20-12345678-9"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('cuit')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado del Comercio
                      </label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <select
                          value={formData.estado}
                          onChange={(e) => handleInputChange('estado', e.target.value as 'activo' | 'inactivo' | 'suspendido')}
                          className={getFieldClasses('estado')}
                        >
                          <option value="activo">✅ Activo - Operativo y visible</option>
                          <option value="inactivo">⏸️ Inactivo - Temporalmente cerrado</option>
                          <option value="suspendido">🚫 Suspendido - Acceso bloqueado</option>
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('estado')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Configuración de Visibilidad
                      </label>
                      
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-semibold text-gray-900">Visible para Socios</h5>
                            <p className="text-sm text-gray-600">Los socios pueden ver este comercio en la aplicación</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.visible}
                              onChange={(e) => handleInputChange('visible', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Información del comercio */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                      <h5 className="font-bold text-green-900 mb-4 flex items-center text-lg">
                        <CheckCircle className="w-5 h-5 mr-3" />
                        Información del Comercio
                      </h5>
                      <div className="text-sm text-green-800 space-y-2">
                        <p><strong>Nombre:</strong> {formData.nombreComercio || 'Sin especificar'}</p>
                        <p><strong>Email:</strong> {formData.email || 'Sin especificar'}</p>
                        <p><strong>Categoría:</strong> {formData.categoria || 'Sin especificar'}</p>
                        <p><strong>Estado:</strong> {formData.estado || 'Sin especificar'}</p>
                        <p><strong>Visible:</strong> {formData.visible ? 'Sí' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center mt-12 pt-8 border-t border-gray-200 space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Guardar Cambios</span>
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
