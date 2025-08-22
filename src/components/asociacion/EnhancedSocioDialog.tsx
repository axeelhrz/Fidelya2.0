'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  MapPin, 
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Socio, SocioFormData } from '@/types/socio';
import { Timestamp } from 'firebase/firestore';

// Schema de validación
const socioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido']),
  estadoMembresia: z.enum(['al_dia', 'vencido', 'pendiente']).optional(),
  telefono: z.string().optional(),
  dni: z.string().optional(),
  numeroSocio: z.string().optional(),
  montoCuota: z.number().min(0, 'El monto debe ser mayor o igual a 0').optional(),
  direccion: z.string().optional(),
  fechaNacimiento: z.date().optional(),
  fechaVencimiento: z.date().optional(),
});

type SocioFormInputs = z.infer<typeof socioSchema>;

interface EnhancedSocioDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SocioFormData) => Promise<void>;
  socio?: Socio | null;
  loading?: boolean;
}

// Función helper para convertir Timestamp a Date
const timestampToDate = (timestamp: Timestamp | Date | undefined): Date | undefined => {
  if (!timestamp) return undefined;
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

export const EnhancedSocioDialog: React.FC<EnhancedSocioDialogProps> = ({
  open,
  onClose,
  onSave,
  socio,
  loading = false
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const isEditing = !!socio;

  // Asegurar que el componente esté montado antes de usar createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm<SocioFormInputs>({
    resolver: zodResolver(socioSchema),
    defaultValues: {
      nombre: '',
      email: '',
      estado: 'activo',
      estadoMembresia: 'al_dia',
      telefono: '',
      dni: '',
      numeroSocio: '',
      montoCuota: 0,
      direccion: '',
    }
  });

  // Resetear formulario cuando se abre/cierra o cambia el socio
  useEffect(() => {
    if (open) {
      if (socio) {
        // Modo edición
        reset({
          nombre: socio.nombre || '',
          email: socio.email || '',
          estado: socio.estado || 'activo',
          estadoMembresia: socio.estadoMembresia as 'al_dia' | 'vencido' | 'pendiente' | undefined || 'al_dia',
          telefono: socio.telefono || '',
          dni: socio.dni || '',
          numeroSocio: socio.numeroSocio || '',
          montoCuota: socio.montoCuota || 0,
          direccion: socio.direccion || '',
          fechaNacimiento: timestampToDate(socio.fechaNacimiento),
          fechaVencimiento: timestampToDate(socio.fechaVencimiento),
        });
      } else {
        // Modo creación
        reset({
          nombre: '',
          email: '',
          estado: 'activo',
          estadoMembresia: 'al_dia',
          telefono: '',
          dni: '',
          numeroSocio: '',
          montoCuota: 0,
          direccion: '',
          fechaNacimiento: undefined,
          fechaVencimiento: undefined,
        });
      }
    }
  }, [open, socio, reset]);

  const handleFormSubmit: SubmitHandler<SocioFormInputs> = async (data) => {
    setIsSubmitting(true);
    try {
      const socioData: SocioFormData = {
        nombre: data.nombre,
        email: data.email,
        estado: data.estado,
        estadoMembresia: data.estadoMembresia,
        telefono: data.telefono,
        dni: data.dni,
        numeroSocio: data.numeroSocio,
        montoCuota: data.montoCuota,
        direccion: data.direccion,
        fechaNacimiento: data.fechaNacimiento,
        fechaVencimiento: data.fechaVencimiento,
      };

      await onSave(socioData);
    } catch (error) {
      console.error('Error saving socio:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldValidationState = (fieldName: keyof SocioFormInputs) => {
    if (errors[fieldName]) return 'error';
    const value = watch(fieldName);
    if (value && value.toString().length > 0) return 'success';
    return 'default';
  };

  const getFieldIcon = (fieldName: keyof SocioFormInputs) => {
    const state = getFieldValidationState(fieldName);
    if (state === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (state === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
    return null;
  };

  const getFieldClasses = (fieldName: keyof SocioFormInputs) => {
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
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">
                      {isEditing ? 'Editar Socio' : 'Nuevo Socio'}
                    </h2>
                    <p className="text-blue-100 text-lg">
                      {isEditing ? 'Actualiza la información del socio' : 'Completa los datos del nuevo socio'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting || loading}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 disabled:opacity-50 group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
              <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
                  {/* Información Personal */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Información Personal
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          {...register('nombre')}
                          className={getFieldClasses('nombre')}
                          placeholder="Ingresa el nombre completo"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('nombre')}
                        </div>
                      </div>
                      {errors.nombre && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-600"
                        >
                          {errors.nombre.message}
                        </motion.p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Correo Electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          {...register('email')}
                          type="email"
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
                          {errors.email.message}
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
                          {...register('telefono')}
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
                        DNI/Documento
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          {...register('dni')}
                          className={getFieldClasses('dni')}
                          placeholder="12345678"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('dni')}
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
                          {...register('direccion')}
                          className={getFieldClasses('direccion')}
                          placeholder="Dirección completa"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('direccion')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Nacimiento
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          {...register('fechaNacimiento', { valueAsDate: true })}
                          type="date"
                          className={getFieldClasses('fechaNacimiento')}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configuración de Membresía */}
                  <div className="space-y-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Configuración de Membresía
                      </h3>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado del Socio
                      </label>
                      <select
                        {...register('estado')}
                        className={getFieldClasses('estado')}
                      >
                        <option value="activo">✅ Activo - Puede acceder a todos los beneficios</option>
                        <option value="inactivo">⏸️ Inactivo - Sin acceso temporal</option>
                        <option value="suspendido">🚫 Suspendido - Acceso bloqueado</option>
                        <option value="pendiente">⏳ Pendiente - Esperando activación</option>
                        <option value="vencido">⚠️ Vencido - Membresía expirada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Estado de Membresía
                      </label>
                      <select
                        {...register('estadoMembresia')}
                        className={getFieldClasses('estadoMembresia')}
                      >
                        <option value="al_dia">💚 Al día - Membresía activa</option>
                        <option value="vencido">🔴 Vencido - Requiere renovación</option>
                        <option value="pendiente">🟡 Pendiente - En proceso</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Socio
                      </label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          {...register('numeroSocio')}
                          className={getFieldClasses('numeroSocio')}
                          placeholder="SOC001 (opcional)"
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {getFieldIcon('numeroSocio')}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Monto de Cuota ($)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          {...register('montoCuota', { valueAsNumber: true })}
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 pl-12 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white border-gray-300"
                          placeholder="0.00"
                        />
                      </div>
                      {errors.montoCuota && (
                        <motion.p
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 text-sm text-red-600"
                        >
                          {errors.montoCuota.message}
                        </motion.p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fecha de Vencimiento
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          {...register('fechaVencimiento', { valueAsDate: true })}
                          type="date"
                          className={getFieldClasses('fechaVencimiento')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center mt-12 pt-8 border-t border-gray-200 space-x-4">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting || loading}
                    className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all duration-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isSubmitting || loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>{isEditing ? 'Actualizar' : 'Crear'} Socio</span>
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

  // Usar createPortal para renderizar el modal en el body
  return createPortal(modalContent, document.body);
};
