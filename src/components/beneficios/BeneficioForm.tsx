'use client';

import React, { useState, useEffect } from 'react';
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
  Building2,
  Sparkles,
  Target,
  Users,
  Clock,
  Tag,
  Settings
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Beneficio, BeneficioFormData, CATEGORIAS_BENEFICIOS } from '@/types/beneficio';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BeneficiosService } from '@/services/beneficios.service';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

// Schema de validación mejorado
const beneficioSchema = z.object({
  titulo: z
    .string()
    .min(1, 'El título es requerido')
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  descripcion: z
    .string()
    .min(1, 'La descripción es requerida')
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres'),
  tipo: z.enum(['porcentaje', 'monto_fijo', 'producto_gratis']),
  descuento: z
    .number()
    .min(0, 'El descuento debe ser mayor a 0'),
  fechaInicio: z
    .date()
    .refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: 'La fecha de inicio debe ser hoy o posterior'
    }),
  fechaFin: z
    .date(),
  limitePorSocio: z
    .number()
    .min(1, 'El límite por socio debe ser mayor a 0')
    .optional()
    .or(z.literal(undefined)),
  limiteTotal: z
    .number()
    .min(1, 'El límite total debe ser mayor a 0')
    .optional()
    .or(z.literal(undefined)),
  condiciones: z
    .string()
    .max(300, 'Las condiciones no pueden exceder 300 caracteres')
    .optional(),
  categoria: z
    .string()
    .min(1, 'La categoría es requerida'),
  tags: z
    .array(z.string())
    .optional(),
  destacado: z
    .boolean()
    .optional(),
  asociacionesDisponibles: z
    .array(z.string())
    .optional()
}).refine((data) => data.fechaFin > data.fechaInicio, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['fechaFin']
}).refine((data) => {
  if (data.tipo === 'porcentaje' && data.descuento > 100) {
    return false;
  }
  return true;
}, {
  message: 'El porcentaje no puede ser mayor a 100%',
  path: ['descuento']
});

interface BeneficioFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BeneficioFormData) => Promise<boolean>;
  beneficio?: Beneficio | null;
  loading?: boolean;
}

// Modal personalizado para el formulario
const BeneficioModal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ open, onClose, children }) => {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl my-8 min-h-[600px] max-h-[calc(100vh-4rem)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 z-10"
            >
              <X size={24} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// Componente para sección del formulario
const FormSection: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}> = ({ title, description, icon, color, children }) => (
  <motion.div
    className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {children}
  </motion.div>
);

// Componente para tipo de beneficio
const TipoSelector: React.FC<{
  selectedTipo: string;
  onTipoChange: (tipo: string) => void;
}> = ({ selectedTipo, onTipoChange }) => {
  const tipos = [
    {
      id: 'porcentaje',
      titulo: 'Descuento Porcentual',
      descripcion: 'Descuento basado en % del total',
      icono: Percent,
      color: 'from-green-500 to-emerald-600',
      ejemplo: '20% OFF'
    },
    {
      id: 'monto_fijo',
      titulo: 'Descuento Fijo',
      descripcion: 'Descuento de monto fijo en pesos',
      icono: DollarSign,
      color: 'from-blue-500 to-cyan-600',
      ejemplo: '$500 OFF'
    },
    {
      id: 'producto_gratis',
      titulo: 'Producto Gratis',
      descripcion: 'Producto completamente gratuito',
      icono: Gift,
      color: 'from-purple-500 to-pink-600',
      ejemplo: 'GRATIS'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {tipos.map((tipo) => {
        const IconoComponente = tipo.icono;
        const isSelected = selectedTipo === tipo.id;
        
        return (
          <motion.button
            key={tipo.id}
            type="button"
            onClick={() => onTipoChange(tipo.id)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              isSelected
                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 bg-gradient-to-r ${tipo.color} rounded-lg flex items-center justify-center text-white`}>
                <IconoComponente size={20} />
              </div>
              <div className="flex-1">
                <div className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                  {tipo.titulo}
                </div>
                <div className={`text-xs ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {tipo.ejemplo}
                </div>
              </div>
            </div>
            <p className={`text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-600'}`}>
              {tipo.descripcion}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
};

export const BeneficioForm: React.FC<BeneficioFormProps> = ({
  open,
  onClose,
  onSubmit,
  beneficio,
}) => {
  const { user } = useAuth();
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [asociacionesDisponibles, setAsociacionesDisponibles] = useState<Array<{id: string; nombre: string}>>([]);
  const [loadingAsociaciones, setLoadingAsociaciones] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const isEditing = !!beneficio;
  const totalSteps = 4;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<BeneficioFormData>({
    resolver: zodResolver(beneficioSchema),
    mode: 'onChange',
    defaultValues: {
      titulo: '',
      descripcion: '',
      tipo: 'porcentaje',
      descuento: 0,
      fechaInicio: new Date(),
      fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      categoria: '',
      tags: [],
      destacado: false,
      asociacionesDisponibles: []
    }
  });

  const selectedTipo = watch('tipo');
  const destacado = watch('destacado');
  const selectedAsociaciones = watch('asociacionesDisponibles') || [];

  // Cargar asociaciones disponibles para comercios
  useEffect(() => {
    const cargarAsociaciones = async () => {
      if (user?.role === 'comercio' && open) {
        setLoadingAsociaciones(true);
        try {
          const asociaciones = await BeneficiosService.obtenerAsociacionesDisponibles(user.uid);
          setAsociacionesDisponibles(asociaciones);
        } catch (error) {
          console.error('Error cargando asociaciones:', error);
        } finally {
          setLoadingAsociaciones(false);
        }
      }
    };

    cargarAsociaciones();
  }, [user, open]);

  // Cargar datos del beneficio al editar
  useEffect(() => {
    if (beneficio && open) {
      reset({
        titulo: beneficio.titulo,
        descripcion: beneficio.descripcion,
        tipo: beneficio.tipo,
        descuento: beneficio.descuento,
        fechaInicio: beneficio.fechaInicio.toDate(),
        fechaFin: beneficio.fechaFin.toDate(),
        limitePorSocio: beneficio.limitePorSocio,
        limiteTotal: beneficio.limiteTotal,
        condiciones: beneficio.condiciones,
        categoria: beneficio.categoria,
        tags: beneficio.tags || [],
        destacado: beneficio.destacado || false,
        asociacionesDisponibles: beneficio.asociacionesDisponibles || []
      });
      setTagsInput(beneficio.tags?.join(', ') || '');
    } else if (open && !beneficio) {
      reset({
        titulo: '',
        descripcion: '',
        tipo: 'porcentaje',
        descuento: 0,
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        categoria: '',
        tags: [],
        destacado: false,
        asociacionesDisponibles: []
      });
      setTagsInput('');
      setCurrentStep(1);
    }
  }, [beneficio, open, reset]);

  // Manejar tags
  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setValue('tags', tags);
  };

  // Manejar selección de asociaciones
  const handleAsociacionToggle = (asociacionId: string) => {
    const currentSelected = selectedAsociaciones || [];
    const newSelected = currentSelected.includes(asociacionId)
      ? currentSelected.filter(id => id !== asociacionId)
      : [...currentSelected, asociacionId];
    
    setValue('asociacionesDisponibles', newSelected);
  };

  const handleFormSubmit = async (data: BeneficioFormData) => {
    setSubmitting(true);
    try {
      const success = await onSubmit(data);
      if (success) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getFieldsForStep = (step: number): (keyof BeneficioFormData)[] => {
    switch (step) {
      case 1:
        return ['titulo', 'descripcion', 'categoria'];
      case 2:
        return ['tipo', 'descuento'];
      case 3:
        return ['fechaInicio', 'fechaFin'];
      case 4:
        return [];
      default:
        return [];
    }
  };

  const getTipoConfig = (tipo: string) => {
    const configs = {
      porcentaje: {
        label: 'Descuento por Porcentaje',
        icon: <Percent size={20} />,
        color: 'from-green-500 to-emerald-600',
        placeholder: 'Ej: 15',
        suffix: '%',
        maxValue: 100,
        description: 'Descuento basado en porcentaje del total'
      },
      monto_fijo: {
        label: 'Descuento Fijo',
        icon: <DollarSign size={20} />,
        color: 'from-blue-500 to-cyan-600',
        placeholder: 'Ej: 50',
        suffix: '$',
        maxValue: undefined,
        description: 'Descuento de monto fijo en pesos'
      },
      producto_gratis: {
        label: 'Producto Gratis',
        icon: <Gift size={20} />,
        color: 'from-purple-500 to-pink-600',
        placeholder: '0',
        suffix: '',
        maxValue: undefined,
        description: 'Producto completamente gratis'
      }
    };
    return configs[tipo as keyof typeof configs] || configs.porcentaje;
  };

  const tipoConfig = getTipoConfig(selectedTipo);

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FormSection
            title="Información Básica"
            description="Datos principales del beneficio"
            icon={<Info size={20} />}
            color="from-blue-500 to-cyan-600"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Título del Beneficio *
                </label>
                <Input
                  {...register('titulo')}
                  placeholder="Ej: 20% de descuento en toda la tienda"
                  error={errors.titulo?.message}
                  className="text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Descripción Detallada *
                </label>
                <textarea
                  {...register('descripcion')}
                  rows={4}
                  placeholder="Describe los detalles del beneficio, qué incluye, cómo se aplica..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-900 placeholder-gray-500"
                />
                {errors.descripcion && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.descripcion.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Categoría *
                </label>
                <select
                  {...register('categoria')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  <option value="">Selecciona una categoría</option>
                  {CATEGORIAS_BENEFICIOS.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.categoria.message}
                  </p>
                )}
              </div>
            </div>
          </FormSection>
        );

      case 2:
        return (
          <FormSection
            title="Configuración del Descuento"
            description="Define el tipo y valor del beneficio"
            icon={tipoConfig.icon}
            color={tipoConfig.color}
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-4">
                  Tipo de Beneficio *
                </label>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <TipoSelector
                      selectedTipo={field.value}
                      onTipoChange={field.onChange}
                    />
                  )}
                />
              </div>

              {selectedTipo !== 'producto_gratis' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Valor del Descuento *
                  </label>
                  <div className="relative">
                    <Input
                      {...register('descuento', { valueAsNumber: true })}
                      type="number"
                      placeholder={tipoConfig.placeholder}
                      min="0"
                      max={tipoConfig.maxValue}
                      step={selectedTipo === 'porcentaje' ? '0.1' : '1'}
                      error={errors.descuento?.message}
                      className="text-2xl font-bold text-center"
                    />
                    {tipoConfig.suffix && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <span className="text-2xl font-bold text-gray-500">{tipoConfig.suffix}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${tipoConfig.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-indigo-900 mb-1">{tipoConfig.label}</h4>
                    <p className="text-sm text-indigo-700">{tipoConfig.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        );

      case 3:
        return (
          <FormSection
            title="Período de Validez"
            description="Define cuándo estará disponible el beneficio"
            icon={<Calendar size={20} />}
            color="from-green-500 to-emerald-600"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Fecha de Inicio *
                  </label>
                  <Controller
                    name="fechaInicio"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        error={errors.fechaInicio?.message}
                      />
                    )}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Fecha de Fin *
                  </label>
                  <Controller
                    name="fechaFin"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        error={errors.fechaFin?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">Duración del Beneficio</h4>
                    <p className="text-sm text-yellow-700">
                      El beneficio estará disponible desde la fecha de inicio hasta la fecha de fin.
                      Asegúrate de que el período sea suficiente para que tus clientes puedan aprovecharlo.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Asociaciones disponibles - Solo para comercios */}
            {user?.role === 'comercio' && (
              <FormSection
                title="Asociaciones Disponibles"
                description="Selecciona dónde estará disponible"
                icon={<Building2 size={20} />}
                color="from-purple-500 to-pink-600"
              >
                {loadingAsociaciones ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-gray-600">Cargando asociaciones...</span>
                  </div>
                ) : asociacionesDisponibles.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Selecciona las asociaciones donde estará disponible este beneficio:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2">
                      {asociacionesDisponibles.map((asociacion) => (
                        <motion.label
                          key={asociacion.id}
                          className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 cursor-pointer transition-all duration-200"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedAsociaciones.includes(asociacion.id)}
                            onChange={() => handleAsociacionToggle(asociacion.id)}
                            className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-gray-700">
                              {asociacion.nombre}
                            </span>
                          </div>
                        </motion.label>
                      ))}
                    </div>
                    {selectedAsociaciones.length === 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-amber-700">
                            Si no seleccionas ninguna asociación, el beneficio estará disponible para todas las asociaciones vinculadas.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      No tienes asociaciones vinculadas. El beneficio estará disponible universalmente.
                    </p>
                  </div>
                )}
              </FormSection>
            )}

            {/* Configuración avanzada */}
            <FormSection
              title="Configuración Avanzada"
              description="Límites y condiciones especiales"
              icon={<Settings size={20} />}
              color="from-orange-500 to-red-600"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Límite por Socio
                    </label>
                    <Input
                      {...register('limitePorSocio', { valueAsNumber: true })}
                      type="number"
                      placeholder="Ej: 1 (opcional)"
                      min="1"
                      error={errors.limitePorSocio?.message}
                    />
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Target size={12} />
                      Máximo de veces que un socio puede usar este beneficio
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Límite Total
                    </label>
                    <Input
                      {...register('limiteTotal', { valueAsNumber: true })}
                      type="number"
                      placeholder="Ej: 100 (opcional)"
                      min="1"
                      error={errors.limiteTotal?.message}
                    />
                    <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <Users size={12} />
                      Máximo de usos totales del beneficio
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Etiquetas (separadas por comas)
                  </label>
                  <Input
                    value={tagsInput}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="Ej: descuento, promoción, especial"
                  />
                  <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <Tag size={12} />
                    Ayuda a categorizar y buscar el beneficio
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Términos y Condiciones
                  </label>
                  <textarea
                    {...register('condiciones')}
                    rows={3}
                    placeholder="Especifica las condiciones de uso del beneficio..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-900 placeholder-gray-500"
                  />
                  {errors.condiciones && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={16} />
                      {errors.condiciones.message}
                    </p>
                  )}
                </div>

                <div>
                  <motion.label 
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 cursor-pointer"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Controller
                      name="destacado"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                          className="w-5 h-5 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                        />
                      )}
                    />
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${destacado ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-200'} rounded-lg flex items-center justify-center transition-all duration-200`}>
                        <Star size={20} className={destacado ? 'text-white fill-current' : 'text-gray-400'} />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900">
                          Marcar como beneficio destacado
                        </span>
                        <p className="text-sm text-gray-600">
                          Los beneficios destacados aparecen primero en las búsquedas
                        </p>
                      </div>
                    </div>
                  </motion.label>
                </div>
              </div>
            </FormSection>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <BeneficioModal open={open} onClose={onClose}>
      {/* Header fijo */}
      <div className="flex-shrink-0 p-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4 mb-6">
          <div 
            className={`w-14 h-14 bg-gradient-to-r ${tipoConfig.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}
          >
            {tipoConfig.icon}
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Editar Beneficio' : 'Crear Nuevo Beneficio'}
            </h2>
            <p className="text-gray-600 mt-1">
              Paso {currentStep} de {totalSteps} - {
                currentStep === 1 ? 'Información básica' :
                currentStep === 2 ? 'Configuración del descuento' :
                currentStep === 3 ? 'Período de validez' :
                'Configuración avanzada'
              }
            </p>
          </div>
        </div>
        
        {/* Progress bar mejorada */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full shadow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col h-full">
        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer fijo */}
        <div className="flex-shrink-0 p-8 pt-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex gap-3">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={submitting}
                  className="px-6"
                >
                  Anterior
                </Button>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={submitting}
                className="px-6"
              >
                Cancelar
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={submitting}
                  className="px-8"
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="submit"
                  leftIcon={<Save size={16} />}
                  loading={submitting}
                  disabled={!isValid || submitting}
                  className="px-8"
                >
                  {submitting 
                    ? 'Guardando...' 
                    : isEditing 
                      ? 'Actualizar Beneficio' 
                      : 'Crear Beneficio'
                  }
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </BeneficioModal>
  );
};