import { z } from 'zod';

export const comercioFormSchema = z.object({
  nombreComercio: z
    .string()
    .min(2, 'El nombre del comercio debe tener al menos 2 caracteres')
    .max(100, 'El nombre del comercio no puede exceder 100 caracteres')
    .trim(),
  
  email: z
    .string()
    .email('Debe ser un email válido')
    .min(1, 'El email es obligatorio'),
  
  categoria: z
    .string()
    .min(1, 'La categoría es obligatoria'),
  
  telefono: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'El teléfono no es válido')
    .optional()
    .or(z.literal('')),
  
  direccion: z
    .string()
    .max(200, 'La dirección no puede exceder 200 caracteres')
    .optional()
    .or(z.literal('')),
  
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  
  sitioWeb: z
    .string()
    .url('Debe ser una URL válida')
    .optional()
    .or(z.literal('')),
  
  horario: z
    .string()
    .max(100, 'El horario no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  cuit: z
    .string()
    .regex(/^\d{2}-\d{8}-\d{1}$/, 'El CUIT debe tener el formato XX-XXXXXXXX-X')
    .optional()
    .or(z.literal('')),
  
  configuracion: z.object({
    notificacionesEmail: z.boolean().default(true),
    notificacionesWhatsApp: z.boolean().default(false),
    autoValidacion: z.boolean().default(false),
    requiereAprobacion: z.boolean().default(true),
  }).optional(),
});

export const comercioUpdateSchema = comercioFormSchema.partial();

export const comercioStatusSchema = z.object({
  estado: z.enum(['activo', 'inactivo', 'suspendido']),
});

export const comercioSearchSchema = z.object({
  termino: z.string().min(1, 'El término de búsqueda es obligatorio'),
  categoria: z.string().optional(),
  estado: z.enum(['activo', 'inactivo', 'suspendido']).optional(),
  soloActivos: z.boolean().optional(),
});

export const comercioFiltersSchema = z.object({
  estado: z.enum(['activo', 'inactivo', 'suspendido']).optional(),
  categoria: z.string().optional(),
  busqueda: z.string().optional(),
  soloActivos: z.boolean().optional(),
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
});

export const qrGenerationSchema = z.object({
  comercioId: z.string().min(1, 'El ID del comercio es obligatorio'),
  beneficioId: z.string().optional(),
  tipo: z.enum(['individual', 'masivo']).default('individual'),
});

export const validationFiltersSchema = z.object({
  fechaDesde: z.date().optional(),
  fechaHasta: z.date().optional(),
  estado: z.enum(['exitosa', 'fallida', 'pendiente']).optional(),
  beneficioId: z.string().optional(),
  socioId: z.string().optional(),
  pageSize: z.number().min(1).max(100).default(20),
});

// Validation helper functions
export const validateComercioForm = (data: unknown) => {
  return comercioFormSchema.safeParse(data);
};

export const validateComercioUpdate = (data: unknown) => {
  return comercioUpdateSchema.safeParse(data);
};

export const validateComercioStatus = (data: unknown) => {
  return comercioStatusSchema.safeParse(data);
};

export const validateComercioSearch = (data: unknown) => {
  return comercioSearchSchema.safeParse(data);
};

export const validateComercioFilters = (data: unknown) => {
  return comercioFiltersSchema.safeParse(data);
};

export const validateQRGeneration = (data: unknown) => {
  return qrGenerationSchema.safeParse(data);
};

export const validateValidationFilters = (data: unknown) => {
  return validationFiltersSchema.safeParse(data);
};

// Error messages in Spanish
export const comercioErrorMessages = {
  nombreComercio: {
    required: 'El nombre del comercio es obligatorio',
    minLength: 'El nombre debe tener al menos 2 caracteres',
    maxLength: 'El nombre no puede exceder 100 caracteres',
  },
  email: {
    required: 'El email es obligatorio',
    invalid: 'Debe ser un email válido',
    exists: 'Ya existe un comercio con este email',
  },
  categoria: {
    required: 'La categoría es obligatoria',
    invalid: 'Categoría no válida',
  },
  telefono: {
    invalid: 'El teléfono no es válido',
  },
  direccion: {
    maxLength: 'La dirección no puede exceder 200 caracteres',
  },
  descripcion: {
    maxLength: 'La descripción no puede exceder 500 caracteres',
  },
  sitioWeb: {
    invalid: 'Debe ser una URL válida',
  },
  horario: {
    maxLength: 'El horario no puede exceder 100 caracteres',
  },
  cuit: {
    invalid: 'El CUIT debe tener el formato XX-XXXXXXXX-X',
  },
  general: {
    required: 'Este campo es obligatorio',
    invalid: 'Valor no válido',
    networkError: 'Error de conexión. Inténtalo de nuevo.',
    serverError: 'Error del servidor. Inténtalo más tarde.',
  },
};

// Categories for comercios
export const CATEGORIAS_COMERCIO = [
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
] as const;

export type CategoriaComercio = typeof CATEGORIAS_COMERCIO[number];

// Status options
export const ESTADOS_COMERCIO = [
  { value: 'activo', label: 'Activo', color: 'green' },
  { value: 'inactivo', label: 'Inactivo', color: 'red' },
  { value: 'suspendido', label: 'Suspendido', color: 'yellow' },
] as const;

export type EstadoComercio = typeof ESTADOS_COMERCIO[number]['value'];

// Validation status options
export const ESTADOS_VALIDACION = [
  { value: 'exitosa', label: 'Exitosa', color: 'green' },
  { value: 'fallida', label: 'Fallida', color: 'red' },
  { value: 'pendiente', label: 'Pendiente', color: 'yellow' },
] as const;

export type EstadoValidacion = typeof ESTADOS_VALIDACION[number]['value'];