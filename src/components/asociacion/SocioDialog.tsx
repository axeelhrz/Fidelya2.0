'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  MapPin, 
  Calendar,
  Eye,
  EyeOff,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  Shield,
  Save
} from 'lucide-react';
import { Socio, SocioFormData } from '@/types/socio';
import { Timestamp } from 'firebase/firestore';

// Esquema de validación para creación (más estricto)
const createSocioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido']),
  telefono: z.string().optional(),
  dni: z.string().optional(),
  direccion: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la contraseña'),
}).refine((data) => {
  return data.password === data.confirmPassword;
}, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Esquema de validación para edición (más flexible)
const editSocioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  email: z.string().email('Email inválido').optional(),
  estado: z.enum(['activo', 'inactivo', 'suspendido', 'pendiente', 'vencido']).optional(),
  telefono: z.string().optional(),
  dni: z.string().optional(),
  direccion: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type SocioFormInputs = z.infer<typeof createSocioSchema>;
type EditSocioFormInputs = z.infer<typeof editSocioSchema>;

// Configuración de pasos del formulario
const FORM_STEPS = [
  {
    id: 'personal',
    title: 'Información Personal',
    subtitle: 'Datos básicos del socio',
    icon: User,
    color: 'from-blue-500 to-cyan-500',
    fields: ['nombre', 'email', 'dni', 'fechaNacimiento']
  },
  {
    id: 'contact',
    title: 'Contacto y Ubicación',
    subtitle: 'Información de contacto',
    icon: Phone,
    color: 'from-green-500 to-emerald-500',
    fields: ['telefono', 'direccion', 'estado']
  },
  {
    id: 'access',
    title: 'Acceso y Seguridad',
    subtitle: 'Credenciales de acceso',
    icon: Lock,
    color: 'from-orange-500 to-red-500',
    fields: ['password', 'confirmPassword']
  }
];

// Componente de campo de formulario simple
interface SimpleFormFieldProps {
  field: {
    name: string;
    label: string;
    type: string;
    icon?: React.ComponentType<{ className?: string }>;
    placeholder?: string;
    options?: { value: string; label: string }[];
  };
  register: ReturnType<typeof useForm>['register'];
  error?: { message?: string };
  watch: (name: string) => string;
  showPassword: boolean;
  onTogglePassword: () => void;
  isEditing?: boolean;
}

const SimpleFormField = React.memo(({
  field,
  register,
  error,
  watch,
  showPassword,
  onTogglePassword,
}: SimpleFormFieldProps) => {
  const fieldValue = watch(field.name);
  const hasError = !!error;
  const hasValue = fieldValue && fieldValue.length > 0;
  const isValid = hasValue && !hasError;

  const getFieldIcon = () => {
    if (hasError) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (isValid) return <Check className="w-4 h-4 text-green-500" />;
    return field.icon ? <field.icon className="w-4 h-4 text-gray-400" /> : null;
  };

  const getFieldClasses = () => {
    const baseClasses = "w-full pl-10 pr-4 py-3 border-2 rounded-xl transition-colors duration-100 bg-white";
    
    if (hasError) {
      return `${baseClasses} border-red-300 focus:border-red-500`;
    }
    if (isValid) {
      return `${baseClasses} border-green-300 focus:border-green-500`;
    }
    return `${baseClasses} border-gray-200 focus:border-blue-500`;
  };

  if (field.type === 'select') {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {getFieldIcon()}
          </div>
          <select
            {...register(field.name)}
            className={getFieldClasses()}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {getFieldIcon()}
        </div>
        <input
          {...register(field.name, { 
            valueAsNumber: field.type === 'number' ? true : false 
          })}
          type={field.type === 'password' && showPassword ? 'text' : field.type}
          placeholder={field.placeholder}
          className={getFieldClasses()}
        />
        {field.type === 'password' && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-gray-400" />
            ) : (
              <Eye className="w-4 h-4 text-gray-400" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error.message}
        </p>
      )}
    </div>
  );
});

SimpleFormField.displayName = 'SimpleFormField';

interface SocioDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SocioFormData) => Promise<void>;
  socio?: Socio | null;
  loading?: boolean;
}

export const SocioDialog: React.FC<SocioDialogProps> = ({
  open,
  onClose,
  onSave,
  socio,
  loading = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isEditing = !!socio;
  const currentStepData = FORM_STEPS[currentStep];

  // Asegurar que el componente esté montado
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Función para convertir Date/Timestamp a string para input date
  const formatDateForInput = useCallback((date: Date | Timestamp | undefined): string => {
    if (!date) return '';
    
    let jsDate: Date;
    if (date instanceof Timestamp) {
      jsDate = date.toDate();
    } else if (date instanceof Date) {
      jsDate = date;
    } else {
      return '';
    }
    
    return jsDate.toISOString().split('T')[0];
  }, []);
  type SocioFormType = SocioFormInputs | EditSocioFormInputs;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    trigger,
    getValues
  } = useForm<SocioFormType>({
    resolver: isEditing
      ? (zodResolver(editSocioSchema) as import('react-hook-form').Resolver<SocioFormType>)
      : (zodResolver(createSocioSchema) as import('react-hook-form').Resolver<SocioFormType>),
    mode: 'onChange',
    defaultValues: isEditing
      ? {
          nombre: socio?.nombre ?? '',
          email: socio?.email ?? '',
          estado: socio?.estado ?? 'activo',
          telefono: socio?.telefono ?? '',
          dni: socio?.dni ?? '',
          direccion: socio?.direccion ?? '',
          fechaNacimiento: socio?.fechaNacimiento
            ? formatDateForInput(socio.fechaNacimiento)
            : '',
        }
      : {
          nombre: '',
          email: '',
          estado: 'activo',
          telefono: '',
          dni: '',
          direccion: '',
          fechaNacimiento: '',
        }
  });

  // Validación debounced
  // const debouncedTrigger = useDebounce(trigger, 300);

  // Resetear formulario
  useEffect(() => {
    if (open) {
      if (socio) {
        reset({
          nombre: socio.nombre || '',
          email: socio.email || '',
          estado: socio.estado || 'activo',
          telefono: socio.telefono || '',
          dni: socio.dni || '',
          direccion: socio.direccion || '',
          fechaNacimiento: formatDateForInput(socio.fechaNacimiento),
        });
      } else {
        reset({
          nombre: '',
          email: '',
          estado: 'activo',
          telefono: '',
          dni: '',
          direccion: '',
          fechaNacimiento: '',
        });
      }
      setCurrentStep(0);
    }
  }, [open, socio, reset, formatDateForInput]);

  // Navegación entre pasos
  const nextStep = useCallback(async () => {
    // En modo edición, permitir navegar sin validación estricta
    if (isEditing) {
      if (currentStep < FORM_STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
      return;
    }

    // En modo creación, validar antes de continuar
    const currentFields = FORM_STEPS[currentStep].fields as Array<
      "nombre" | "email" | "estado" | "telefono" | "dni" | "direccion" | "fechaNacimiento" | "password" | "confirmPassword"
    >;
    const isValid = await trigger(currentFields);
    
    if (isValid && currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, trigger, isEditing]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  // Función para guardar cambios en modo edición sin validación completa
  const handleQuickSave = useCallback(async () => {
    if (!isEditing) return;

    try {
      setIsSubmitting(true);
      
      const currentValues = getValues();
      const formData: SocioFormData = {
        nombre: currentValues.nombre || socio?.nombre || '',
        email: currentValues.email || socio?.email || '',
        estado: currentValues.estado || socio?.estado || 'activo',
        telefono: currentValues.telefono || '',
        dni: currentValues.dni || '',
        direccion: currentValues.direccion || '',
        fechaNacimiento: currentValues.fechaNacimiento ? new Date(currentValues.fechaNacimiento) : undefined,
        password: currentValues.password || '',
      };

      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar socio:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [isEditing, getValues, socio, onSave, onClose]);

  // Envío del formulario completo
  const onSubmit = useCallback(async (
    data: SocioFormInputs | EditSocioFormInputs
  ) => {
    try {
      setIsSubmitting(true);

      const formData: SocioFormData = {
        nombre: data.nombre || '',
        email: data.email || '',
        estado: data.estado || 'activo',
        telefono: data.telefono || '',
        dni: data.dni || '',
        direccion: data.direccion || '',
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : undefined,
        password: data.password || '',
      };

      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error al guardar socio:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [onSave, onClose]);

  // Configuración de campos para cada paso
  const getStepFields = useMemo(() => {
    const fieldConfigs = {
      nombre: { name: 'nombre', label: 'Nombre completo', type: 'text', icon: User, placeholder: 'Ingrese el nombre completo' },
      email: { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'correo@ejemplo.com' },
      dni: { name: 'dni', label: 'DNI', type: 'text', icon: CreditCard, placeholder: '12345678' },
      fechaNacimiento: { name: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', icon: Calendar },
      telefono: { name: 'telefono', label: 'Teléfono', type: 'tel', icon: Phone, placeholder: '+54 9 11 1234-5678' },
      direccion: { name: 'direccion', label: 'Dirección', type: 'text', icon: MapPin, placeholder: 'Calle 123, Ciudad' },
      estado: { 
        name: 'estado', 
        label: 'Estado', 
        type: 'select', 
        icon: Shield,
        options: [
          { value: 'activo', label: 'Activo' },
          { value: 'inactivo', label: 'Inactivo' },
          { value: 'suspendido', label: 'Suspendido' },
          { value: 'pendiente', label: 'Pendiente' },
          { value: 'vencido', label: 'Vencido' }
        ]
      },
      password: { name: 'password', label: 'Contraseña', type: 'password', icon: Lock, placeholder: 'Mínimo 6 caracteres' },
      confirmPassword: { name: 'confirmPassword', label: 'Confirmar contraseña', type: 'password', icon: Lock, placeholder: 'Repita la contraseña' },
    };

    return currentStepData.fields.map(fieldName => fieldConfigs[fieldName as keyof typeof fieldConfigs]);
  }, [currentStepData]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="fixed inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`relative px-6 py-4 bg-gradient-to-r ${currentStepData.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <currentStepData.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {isEditing ? 'Editar Socio' : 'Nuevo Socio'}
                      </h2>
                      <p className="text-white/80 text-sm">
                        {currentStepData.title} - {currentStepData.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Botón de guardado rápido para edición */}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleQuickSave}
                        disabled={isSubmitting || loading}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors disabled:opacity-50"
                        title="Guardar cambios actuales"
                      >
                        {isSubmitting || loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">Guardar</span>
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Navegación por iconos */}
                <div className="mt-4 flex justify-center space-x-4">
                  {FORM_STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => goToStep(index)}
                        className={`relative p-3 rounded-xl transition-all duration-100 ${
                          isActive 
                            ? 'bg-white/30 scale-110' 
                            : isCompleted 
                              ? 'bg-white/20 hover:bg-white/25' 
                              : 'bg-white/10 hover:bg-white/15'
                        }`}
                      >
                        <StepIcon className={`w-5 h-5 ${
                          isActive || isCompleted ? 'text-white' : 'text-white/60'
                        }`} />
                        
                        {/* Indicador de completado */}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6">
                <div key={currentStep} className="space-y-6">
                  {/* Información especial para el paso de contraseña */}
                  {currentStep === 2 && !isEditing && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-orange-900">Credenciales de Acceso (Obligatorio)</h4>
                          <p className="text-sm text-orange-700 mt-1">
                            Se requiere una contraseña para crear la cuenta del socio. Esto permitirá que el socio 
                            pueda iniciar sesión en la aplicación con su email y contraseña para acceder a sus beneficios.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {getStepFields.map((field) => (
                      <div key={field.name} className={field.name === 'direccion' ? 'md:col-span-2' : ''}>
                        <SimpleFormField
                          field={field}
                          register={register}
                          error={errors[field.name as keyof typeof errors]}
                          watch={watch}
                          showPassword={field.name === 'password' ? showPassword : field.name === 'confirmPassword' ? showConfirmPassword : false}
                          onTogglePassword={() => {
                            if (field.name === 'password') setShowPassword(!showPassword);
                            if (field.name === 'confirmPassword') setShowConfirmPassword(!showConfirmPassword);
                          }}
                          isEditing={isEditing}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>

                    {/* En modo edición, mostrar botón de guardado rápido también aquí */}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={handleQuickSave}
                        disabled={isSubmitting || loading}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting || loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>Guardar Cambios</span>
                          </>
                        )}
                      </button>
                    )}

                    {currentStep < FORM_STEPS.length - 1 ? (
                      <button
                        type="button"
                        onClick={nextStep}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting || loading}
                        className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmitting || loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Guardando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{isEditing ? 'Actualizar' : 'Crear'} Socio</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};