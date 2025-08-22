'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  X,
  Store,
  Mail,
  Phone,
  MapPin,
  Globe,
  Clock,
  FileText,
  Building,
  AlertCircle,
  Check,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Settings,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ComercioFormData } from '@/services/comercio.service';

const CATEGORIAS_COMERCIO = [
  'Alimentación',
  'Librería y Papelería',
  'Farmacia y Salud',
  'Restaurantes y Gastronomía',
  'Retail y Moda',
  'Salud y Belleza',
  'Deportes y Fitness',
  'Tecnología',
  'Hogar y Decoración',
  'Automotriz',
  'Educación',
  'Entretenimiento',
  'Servicios Profesionales',
  'Turismo y Viajes',
  'Otros'
];

// Esquema de validación
const comercioSchema = z.object({
  nombreComercio: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  categoria: z.string().min(1, 'La categoría es requerida'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  descripcion: z.string().optional(),
  sitioWeb: z.string().url('URL inválida').optional().or(z.literal('')),
  horario: z.string().optional(),
  cuit: z.string().optional(),
});

type ComercioFormInputs = z.infer<typeof comercioSchema>;

// Configuración de pasos del formulario
const FORM_STEPS = [
  {
    id: 'basic',
    title: 'Información Básica',
    subtitle: 'Datos principales del comercio',
    icon: Store,
    color: 'from-green-500 to-emerald-500',
    fields: ['nombreComercio', 'email', 'categoria', 'descripcion']
  },
  {
    id: 'contact',
    title: 'Contacto y Ubicación',
    subtitle: 'Información de contacto',
    icon: Phone,
    color: 'from-blue-500 to-cyan-500',
    fields: ['telefono', 'direccion', 'sitioWeb', 'horario', 'cuit']
  },
  {
    id: 'config',
    title: 'Configuración',
    subtitle: 'Configuración inicial',
    icon: Settings,
    color: 'from-purple-500 to-pink-500',
    fields: ['configuracion']
  }
];

// Componente de campo de formulario
interface FormFieldProps {
  field: {
    name: string;
    label: string;
    type: string;
    icon?: React.ElementType;
    placeholder?: string;
    options?: { value: string; label: string }[];
  };
  register: ReturnType<typeof useForm<ComercioFormInputs>>['register'];
  error?: { message?: string };
  watch: ReturnType<typeof useForm<ComercioFormInputs>>['watch'];
  formData: ComercioFormData;
  handleConfigChange: (field: string, value: boolean) => void;
}

const FormField = React.memo(({
  field,
  register,
  error,
  watch,
  formData,
  handleConfigChange
}: FormFieldProps) => {
  const fieldValue = watch(field.name as keyof ComercioFormInputs);
  const hasError = !!error;
  const hasValue = fieldValue && fieldValue.length > 0;
  const isValid = hasValue && !hasError;

  const getFieldIcon = () => {
    if (hasError) return <AlertCircle className="w-5 h-5 text-red-500" />;
    if (isValid) return <Check className="w-5 h-5 text-green-500" />;
    return field.icon ? <field.icon className="w-5 h-5 text-gray-400" /> : null;
  };

  const getFieldClasses = () => {
    const baseClasses = "w-full px-4 py-3 pl-12 pr-12 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200";
    
    if (hasError) {
      return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50`;
    }
    if (isValid) {
      return `${baseClasses} border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50`;
    }
    return `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-200 bg-white`;
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
            {...register(field.name as keyof ComercioFormInputs)}
            className={getFieldClasses()}
          >
            <option value="">Seleccionar...</option>
            {field.options?.map((option: { value: string; label: string }) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {getFieldIcon()}
          </div>
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {error.message}
          </motion.p>
        )}
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
        </label>
        <div className="relative">
          <div className="absolute top-4 left-4 flex items-center pointer-events-none">
            {getFieldIcon()}
          </div>
          <textarea
            {...register(field.name as keyof ComercioFormInputs)}
            rows={3}
            placeholder={field.placeholder}
            className={`${getFieldClasses()} resize-none`}
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-sm text-red-600"
          >
            {error.message}
          </motion.p>
        )}
      </div>
    );
  }

  if (field.type === 'config') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div>
            <h5 className="font-semibold text-gray-900">Notificaciones por Email</h5>
            <p className="text-sm text-gray-600">Recibir notificaciones de validaciones por email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.configuracion?.notificacionesEmail || false}
              onChange={(e) => handleConfigChange('notificacionesEmail', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
          <div>
            <h5 className="font-semibold text-gray-900">Notificaciones por WhatsApp</h5>
            <p className="text-sm text-gray-600">Recibir notificaciones de validaciones por WhatsApp</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.configuracion?.notificacionesWhatsApp || false}
              onChange={(e) => handleConfigChange('notificacionesWhatsApp', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <div>
            <h5 className="font-semibold text-gray-900">Auto-validación</h5>
            <p className="text-sm text-gray-600">Validar automáticamente los beneficios sin confirmación manual</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.configuracion?.autoValidacion || false}
              onChange={(e) => handleConfigChange('autoValidacion', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
          <div>
            <h5 className="font-semibold text-gray-900">Requiere Aprobación</h5>
            <p className="text-sm text-gray-600">Los beneficios requieren aprobación antes de ser publicados</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.configuracion?.requiereAprobacion || false}
              onChange={(e) => handleConfigChange('requiereAprobacion', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {field.label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {getFieldIcon()}
        </div>
        <input
          {...register(field.name as keyof ComercioFormInputs)}
          type={field.type}
          placeholder={field.placeholder}
          className={getFieldClasses()}
        />
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          {getFieldIcon()}
        </div>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600"
        >
          {error.message}
        </motion.p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

interface CreateComercioDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ComercioFormData) => Promise<boolean>;
  loading?: boolean;
}

export const CreateComercioDialog: React.FC<CreateComercioDialogProps> = ({
  open,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<ComercioFormData>({
    nombreComercio: '',
    categoria: '',
    email: '',
    telefono: '',
    direccion: '',
    descripcion: '',
    sitioWeb: '',
    horario: '',
    cuit: '',
    configuracion: {
      notificacionesEmail: true,
      notificacionesWhatsApp: false,
      autoValidacion: false,
      requiereAprobacion: true,
    }
  });

  const currentStepData = FORM_STEPS[currentStep];

  // Asegurar que el componente esté montado
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
    trigger,
  } = useForm<ComercioFormInputs>({
    resolver: zodResolver(comercioSchema),
    mode: 'onChange',
    defaultValues: {
      nombreComercio: '',
      email: '',
      categoria: '',
      telefono: '',
      direccion: '',
      descripcion: '',
      sitioWeb: '',
      horario: '',
      cuit: '',
    }
  });

  // Validación debounced

  // Resetear formulario
  useEffect(() => {
    if (open) {
      reset({
        nombreComercio: '',
        email: '',
        categoria: '',
        telefono: '',
        direccion: '',
        descripcion: '',
        sitioWeb: '',
        horario: '',
        cuit: '',
      });
      setFormData({
        nombreComercio: '',
        categoria: '',
        email: '',
        telefono: '',
        direccion: '',
        descripcion: '',
        sitioWeb: '',
        horario: '',
        cuit: '',
        configuracion: {
          notificacionesEmail: true,
          notificacionesWhatsApp: false,
          autoValidacion: false,
          requiereAprobacion: true,
        }
      });
      setCurrentStep(0);
    }
  }, [open, reset]);

  // Navegación entre pasos
  const nextStep = useCallback(async () => {
    const currentFields = FORM_STEPS[currentStep].fields.filter(field => field !== 'configuracion');
    const isValid = await trigger(currentFields as Array<keyof ComercioFormInputs>);
    
    if (isValid && currentStep < FORM_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, trigger]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  // Manejar cambios de configuración
  const handleConfigChange = useCallback((field: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      configuracion: {
        notificacionesEmail: prev.configuracion?.notificacionesEmail ?? true,
        notificacionesWhatsApp: prev.configuracion?.notificacionesWhatsApp ?? false,
        autoValidacion: prev.configuracion?.autoValidacion ?? false,
        requiereAprobacion: prev.configuracion?.requiereAprobacion ?? true,
        [field]: value
      }
    }));
  }, []);

  // Envío del formulario
  const onSubmitForm = useCallback(async (data: ComercioFormInputs) => {
    try {
      setIsSubmitting(true);
      
      const finalData: ComercioFormData = {
        ...data,
        configuracion: formData.configuracion
      };

      const success = await onSubmit(finalData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error al crear comercio:', error);
      toast.error('Error al crear el comercio');
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onClose, formData.configuracion]);

  // Campos del formulario por paso
  const getStepFields = useMemo(() => {
    const fieldConfigs = {
      nombreComercio: { name: 'nombreComercio', label: 'Nombre del Comercio', type: 'text', icon: Store, placeholder: 'Ej: Supermercado Central' },
      email: { name: 'email', label: 'Email', type: 'email', icon: Mail, placeholder: 'comercio@ejemplo.com' },
      categoria: { 
        name: 'categoria', 
        label: 'Categoría', 
        type: 'select', 
        icon: Building,
        options: CATEGORIAS_COMERCIO.map(cat => ({ value: cat, label: cat }))
      },
      descripcion: { name: 'descripcion', label: 'Descripción', type: 'textarea', icon: FileText, placeholder: 'Describe brevemente el comercio y sus servicios...' },
      telefono: { name: 'telefono', label: 'Teléfono', type: 'tel', icon: Phone, placeholder: '+54 11 1234-5678' },
      direccion: { name: 'direccion', label: 'Dirección', type: 'text', icon: MapPin, placeholder: 'Av. Corrientes 1234, CABA' },
      sitioWeb: { name: 'sitioWeb', label: 'Sitio Web', type: 'url', icon: Globe, placeholder: 'https://www.ejemplo.com' },
      horario: { name: 'horario', label: 'Horario de Atención', type: 'text', icon: Clock, placeholder: 'Lun-Vie 9:00-18:00' },
      cuit: { name: 'cuit', label: 'CUIT', type: 'text', icon: Building, placeholder: 'XX-XXXXXXXX-X' },
      configuracion: { name: 'configuracion', label: 'Configuración', type: 'config', icon: Settings },
    };

    return currentStepData.fields.map(fieldName => fieldConfigs[fieldName as keyof typeof fieldConfigs]);
  }, [currentStepData]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
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
              <div className={`relative bg-gradient-to-br ${currentStepData.color} px-8 py-8`}>
                {/* Elementos decorativos */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                  <div className="absolute -top-4 -left-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                  <div className="absolute top-8 right-8 w-24 h-24 bg-white/5 rounded-full blur-lg"></div>
                  <div className="absolute bottom-4 left-1/3 w-28 h-28 bg-white/5 rounded-full blur-xl"></div>
                </div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <currentStepData.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        Nuevo Comercio
                      </h2>
                      <p className="text-white/80 text-lg">
                        {currentStepData.title} - {currentStepData.subtitle}
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

                {/* Navegación por iconos */}
                <div className="relative mt-6 flex justify-center space-x-4">
                  {FORM_STEPS.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => goToStep(index)}
                        className={`relative p-4 rounded-2xl transition-all duration-200 ${
                          isActive 
                            ? 'bg-white/30 scale-110 shadow-lg' 
                            : isCompleted 
                              ? 'bg-white/20 hover:bg-white/25' 
                              : 'bg-white/10 hover:bg-white/15'
                        }`}
                      >
                        <StepIcon className={`w-6 h-6 ${
                          isActive || isCompleted ? 'text-white' : 'text-white/60'
                        }`} />
                        
                        {/* Indicador de completado */}
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
                <form onSubmit={handleSubmit(onSubmitForm)} className="p-8">
                  <div key={currentStep} className="space-y-8">
                    {currentStep === 2 ? (
                      // Paso de configuración - layout especial
                      <div className="space-y-8">
                        <div className="text-center">
                          <h4 className="text-2xl font-bold text-gray-900 mb-2">
                            Configuración Inicial
                          </h4>
                          <p className="text-gray-600 text-lg">
                            Estas configuraciones se pueden cambiar más tarde desde el panel del comercio.
                          </p>
                        </div>
                        
                        {getStepFields.map((field) => (
                          <FormField
                            key={field.name}
                            field={field}
                            register={register}
                            error={errors[field.name as keyof typeof errors]}
                            watch={watch}
                            formData={formData}
                            handleConfigChange={handleConfigChange}
                          />
                        ))}
                        
                        {/* Resumen */}
                        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                          <h5 className="font-bold text-green-900 mb-4 flex items-center text-lg">
                            <Check className="w-5 h-5 mr-3" />
                            Resumen del Comercio
                          </h5>
                          <div className="text-sm text-green-800 space-y-2">
                            <p><strong>Nombre:</strong> {watch('nombreComercio') || 'Sin especificar'}</p>
                            <p><strong>Email:</strong> {watch('email') || 'Sin especificar'}</p>
                            <p><strong>Categoría:</strong> {watch('categoria') || 'Sin especificar'}</p>
                            {watch('telefono') && <p><strong>Teléfono:</strong> {watch('telefono')}</p>}
                            {watch('direccion') && <p><strong>Dirección:</strong> {watch('direccion')}</p>}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Pasos normales - grid layout
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {getStepFields.map((field) => (
                          <div key={field.name} className={field.name === 'descripcion' ? 'xl:col-span-2' : ''}>
                            <FormField
                              field={field}
                              register={register}
                              error={errors[field.name as keyof typeof errors]}
                              watch={watch}
                              formData={formData}
                              handleConfigChange={handleConfigChange}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="flex items-center space-x-2 px-6 py-3 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>Anterior</span>
                    </button>

                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancelar
                      </button>

                      {currentStep < FORM_STEPS.length - 1 ? (
                        <button
                          type="button"
                          onClick={nextStep}
                          className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        >
                          <span>Siguiente</span>
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting || loading}
                          className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                        >
                          {isSubmitting || loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              <span>Creando...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              <span>Crear Comercio</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};