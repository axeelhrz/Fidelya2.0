'use client';

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { SocioFormData } from '@/types/socio';
import { toast } from 'react-hot-toast';

interface AddSocioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SocioFormData) => Promise<boolean>;
  loading?: boolean;
}

const AddSocioModal = memo<AddSocioModalProps>(({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false 
}) => {
  const [formData, setFormData] = useState<SocioFormData>({
    nombre: '',
    email: '',
    estado: 'activo',
    estadoMembresia: 'al_dia',
    telefono: '',
    dni: '',
    direccion: '',
    montoCuota: 0,
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation function
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Optional but validated fields
    if (formData.telefono && !/^\+?[\d\s\-\(\)]+$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono no es válido';
    }

    if (formData.dni && formData.dni.length < 7) {
      newErrors.dni = 'El DNI debe tener al menos 7 caracteres';
    }

    if (formData.montoCuota && formData.montoCuota < 0) {
      newErrors.montoCuota = 'El monto de cuota no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof SocioFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onSubmit(formData);
      
      if (success) {
        // Reset form
        setFormData({
          nombre: '',
          email: '',
          estado: 'activo',
          estadoMembresia: 'al_dia',
          telefono: '',
          dni: '',
          direccion: '',
          montoCuota: 0,
          password: ''
        });
        setErrors({});
        onClose();
        toast.success('¡Socio creado exitosamente!');
      }
    } catch (error) {
      console.error('Error creating socio:', error);
      toast.error('Error al crear el socio');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit, onClose]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (isSubmitting || loading) return;
    
    setFormData({
      nombre: '',
      email: '',
      estado: 'activo',
      estadoMembresia: 'al_dia',
      telefono: '',
      dni: '',
      direccion: '',
      montoCuota: 0,
      password: ''
    });
    setErrors({});
    onClose();
  }, [isSubmitting, loading, onClose]);

  // Generate random password
  const generatePassword = useCallback(() => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    handleInputChange('password', password);
    toast.success('Contraseña generada automáticamente');
  }, [handleInputChange]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          transition={{ type: "spring", duration: 0.3 }}
          className="relative bg-white rounded-3xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-600 to-slate-800 px-6 py-4 sm:px-8 sm:py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Nuevo Socio</h2>
                  <p className="text-slate-200 text-sm">Agregar un nuevo miembro a la asociación</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleClose}
                disabled={isSubmitting || loading}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition-colors duration-200 disabled:opacity-50"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-slate-600" />
                  <span>Información Personal</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nombre Completo *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => handleInputChange('nombre', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 ${
                          errors.nombre ? 'border-red-300 bg-red-50' : 'border-slate-300'
                        }`}
                        placeholder="Ingresa el nombre completo"
                        disabled={isSubmitting || loading}
                      />
                    </div>
                    {errors.nombre && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.nombre}</span>
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 ${
                          errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
                        }`}
                        placeholder="correo@ejemplo.com"
                        disabled={isSubmitting || loading}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* DNI */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      DNI
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.dni || ''}
                        onChange={(e) => handleInputChange('dni', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 ${
                          errors.dni ? 'border-red-300 bg-red-50' : 'border-slate-300'
                        }`}
                        placeholder="12345678"
                        disabled={isSubmitting || loading}
                      />
                    </div>
                    {errors.dni && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.dni}</span>
                      </p>
                    )}
                  </div>

                  {/* Teléfono */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.telefono || ''}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 ${
                          errors.telefono ? 'border-red-300 bg-red-50' : 'border-slate-300'
                        }`}
                        placeholder="+54 11 1234-5678"
                        disabled={isSubmitting || loading}
                      />
                    </div>
                    {errors.telefono && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.telefono}</span>
                      </p>
                    )}
                  </div>

                  {/* Monto Cuota */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Monto de Cuota
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-medium">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.montoCuota || ''}
                        onChange={(e) => handleInputChange('montoCuota', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 ${
                          errors.montoCuota ? 'border-red-300 bg-red-50' : 'border-slate-300'
                        }`}
                        placeholder="0.00"
                        disabled={isSubmitting || loading}
                      />
                    </div>
                    {errors.montoCuota && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.montoCuota}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Dirección
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <textarea
                      value={formData.direccion || ''}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 resize-none"
                      placeholder="Dirección completa (opcional)"
                      disabled={isSubmitting || loading}
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-slate-600" />
                  <span>Información de Cuenta</span>
                </h3>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password || ''}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full pl-4 pr-20 py-3 border rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all duration-200 ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                      disabled={isSubmitting || loading}
                    />
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={generatePassword}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                        title="Generar contraseña"
                        disabled={isSubmitting || loading}
                      >
                        <Calendar className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors duration-200"
                        disabled={isSubmitting || loading}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </motion.button>
                    </div>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleClose}
                  disabled={isSubmitting || loading}
                  className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSubmitting || loading}
                  className="flex-1 bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creando...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Crear Socio</span>
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

AddSocioModal.displayName = 'AddSocioModal';

export default AddSocioModal;