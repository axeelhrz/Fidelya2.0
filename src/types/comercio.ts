import { Timestamp } from 'firebase/firestore';

export interface SolicitudAsociacion {
  id: string;
  comercioId: string;
  asociacionId: string;
  nombreAsociacion: string;
  emailAsociacion: string;
  telefonoAsociacion?: string;
  descripcionAsociacion?: string;
  logoAsociacion?: string;
  mensaje: string;
  beneficiosOfrecidos?: string[];
  condicionesEspeciales?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: Timestamp;
  fechaRespuesta?: Timestamp;
  motivoRechazo?: string;
  datosAsociacion?: {
    totalSocios?: number;
    totalComercios?: number;
    categoriasPrincipales?: string[];
    ubicacion?: string;
    sitioWeb?: string;
  };
  creadoEn: Timestamp;
  actualizadoEn?: Timestamp;
}

export interface SolicitudAsociacionStats {
  totalSolicitudes: number;
  solicitudesPendientes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  asociacionesVinculadas: number;
  solicitudesEsteMes: number;
}

export interface SolicitudAsociacionFormData {
  comercioId: string;
  mensaje: string;
  beneficiosOfrecidos?: string[];
  condicionesEspeciales?: string;
}

export interface Comercio {
  id: string;
  nombreComercio: string;
  categoria: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email: string;
  sitioWeb?: string;
  horario?: string;
  cuit?: string;
  logo?: string;
  banner?: string;
  estado: 'activo' | 'inactivo' | 'pendiente' | 'suspendido';
  visible: boolean;
  asociacionesVinculadas: string[];
  qrCode?: string;
  qrCodeUrl?: string;
  beneficiosActivos: number;
  validacionesRealizadas: number;
  clientesAtendidos: number;
  ingresosMensuales: number;
  rating: number;
  configuracion: {
    notificacionesEmail: boolean;
    notificacionesWhatsApp: boolean;
    autoValidacion: boolean;
    requiereAprobacion: boolean;
  };
  creadoEn: Date | Timestamp;
  actualizadoEn: Date | Timestamp;
  metadata?: Record<string, unknown>;
}

export interface ComercioFormData {
  nombreComercio: string;
  categoria: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email: string;
  sitioWeb?: string;
  horario?: string;
  cuit?: string;
  logo?: string;
  banner?: string;
  visible?: boolean;
}

export interface ComercioStats {
  totalBeneficios: number;
  beneficiosActivos: number;
  validacionesHoy: number;
  validacionesMes: number;
  clientesUnicos: number;
  ingresosMensuales: number;
  promedioValidacionesDiarias: number;
  crecimientoMensual: number;
}

export interface Beneficio {
  id: string;
  comercioId: string;
  titulo: string;
  descripcion: string;
  tipo: 'descuento_porcentaje' | 'descuento_fijo' | '2x1' | 'envio_gratis' | 'regalo' | 'puntos';
  valor: number; // Porcentaje o monto fijo
  asociacionesVinculadas: string[];
  fechaInicio: Timestamp;
  fechaFin: Timestamp;
  diasValidez?: string[]; // ['lunes', 'martes', etc.]
  horariosValidez?: {
    inicio: string; // HH:MM
    fin: string; // HH:MM
  };
  mediosPagoHabilitados?: string[];
  limitePorSocio?: number;
  limiteTotal?: number;
  usosActuales: number;
  estado: 'activo' | 'inactivo' | 'vencido' | 'agotado';
  condiciones?: string;
  imagenUrl?: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface Validacion {
  id: string;
  comercioId: string;
  socioId: string;
  asociacionId: string;
  beneficioId: string;
  fechaHora: Timestamp;
  resultado: 'valido' | 'invalido' | 'vencido' | 'agotado' | 'no_autorizado';
  montoTransaccion?: number;
  descuentoAplicado?: number;
  metodoPago?: string;
  ubicacion?: {
    lat: number;
    lng: number;
  };
  dispositivo?: string;
  notas?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface ComercioFormData {
  nombre?: string;
  nombreComercio: string;
  email: string;
  categoria: string;
  direccion?: string;
  telefono?: string;
  horario?: string;
  descripcion?: string;
  sitioWeb?: string;
  // Nuevos campos extendidos
  razonSocial?: string;
  cuit?: string;
  ubicacion?: string;
  emailContacto?: string;
  visible?: boolean;
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  configuracion?: {
    notificacionesEmail: boolean;
    notificacionesWhatsApp: boolean;
    autoValidacion: boolean;
    requiereAprobacion: boolean;
  };
}

export interface BeneficioFormData {
  titulo: string;
  descripcion: string;
  tipo: 'descuento_porcentaje' | 'descuento_fijo' | '2x1' | 'envio_gratis' | 'regalo' | 'puntos';
  valor: number;
  asociacionesVinculadas: string[];
  fechaInicio: Date;
  fechaFin: Date;
  diasValidez?: string[];
  horariosValidez?: {
    inicio: string;
    fin: string;
  };
  mediosPagoHabilitados?: string[];
  limitePorSocio?: number;
  limiteTotal?: number;
  condiciones?: string;
}

export interface ValidacionStats {
  totalValidaciones: number;
  validacionesExitosas: number;
  validacionesFallidas: number;
  clientesUnicos: number;
  montoTotalDescuentos: number;
  porAsociacion: Record<string, number>;
  porBeneficio: Record<string, number>;
  porDia: Record<string, number>;
  promedioValidacionesDiarias: number;
}

export interface QRData {
  comercioId: string;
  timestamp: number;
  signature: string;
  beneficioId?: string;
  version?: string;
}

// Enhanced interfaces for management
export interface ComercioManagementData extends Comercio {
  activeBenefits?: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    descuento: number;
    tipo: string;
    fechaFin: Date;
    usosActuales: number;
    limiteTotal?: number;
  }>;
  recentValidations?: Array<{
    id: string;
    socioNombre: string;
    beneficioTitulo: string;
    fechaValidacion: Date;
    montoDescuento: number;
    estado: string;
  }>;
  stats?: ComercioStats;
}

export interface ComercioFilters {
  estado?: 'activo' | 'inactivo' | 'suspendido';
  categoria?: string;
  busqueda?: string;
  soloActivos?: boolean;
  fechaDesde?: Date;
  fechaHasta?: Date;
  asociacionId?: string;
}

export interface ValidationFilters {
  fechaDesde?: Date;
  fechaHasta?: Date;
  estado?: 'exitosa' | 'fallida' | 'pendiente';
  beneficioId?: string;
  socioId?: string;
  comercioId?: string;
  asociacionId?: string;
}

export interface QRGenerationOptions {
  comercioId: string;
  beneficioId?: string;
  tipo: 'individual' | 'masivo';
  formato?: 'png' | 'svg' | 'pdf';
  tamaño?: 'pequeño' | 'mediano' | 'grande';
  incluirLogo?: boolean;
  incluirTexto?: boolean;
}

export interface BatchQRResult {
  comercioId: string;
  nombreComercio: string;
  qrCodeDataURL: string;
  success: boolean;
  error?: string;
}

// Categorías predefinidas para comercios
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

// Tipos de beneficios con sus configuraciones
export const TIPOS_BENEFICIO = {
  descuento_porcentaje: {
    label: 'Descuento por Porcentaje',
    icon: 'Percent',
    color: '#10b981',
    requiresValue: true,
    valueLabel: 'Porcentaje (%)',
    maxValue: 100
  },
  descuento_fijo: {
    label: 'Descuento Fijo',
    icon: 'DollarSign',
    color: '#6366f1',
    requiresValue: true,
    valueLabel: 'Monto ($)',
    maxValue: null
  },
  '2x1': {
    label: '2x1',
    icon: 'Gift',
    color: '#f59e0b',
    requiresValue: false,
    valueLabel: null,
    maxValue: null
  },
  envio_gratis: {
    label: 'Envío Gratis',
    icon: 'Truck',
    color: '#06b6d4',
    requiresValue: false,
    valueLabel: null,
    maxValue: null
  },
  regalo: {
    label: 'Regalo',
    icon: 'Gift',
    color: '#ec4899',
    requiresValue: false,
    valueLabel: 'Descripción del regalo',
    maxValue: null
  },
  puntos: {
    label: 'Puntos Extra',
    icon: 'Star',
    color: '#8b5cf6',
    requiresValue: true,
    valueLabel: 'Puntos',
    maxValue: null
  }
} as const;

export type TipoBeneficio = keyof typeof TIPOS_BENEFICIO;

// Estados de comercio
export const ESTADOS_COMERCIO = {
  activo: {
    label: 'Activo',
    color: '#10b981',
    description: 'Comercio operativo y visible para socios'
  },
  inactivo: {
    label: 'Inactivo',
    color: '#ef4444',
    description: 'Comercio temporalmente deshabilitado'
  },
  pendiente: {
    label: 'Pendiente',
    color: '#f59e0b',
    description: 'Esperando verificación o aprobación'
  },
  suspendido: {
    label: 'Suspendido',
    color: '#f97316',
    description: 'Comercio suspendido por incumplimiento'
  }
} as const;

export type EstadoComercio = keyof typeof ESTADOS_COMERCIO;

// Estados de validación
export const ESTADOS_VALIDACION = {
  exitosa: {
    label: 'Exitosa',
    color: '#10b981',
    description: 'Validación completada correctamente'
  },
  fallida: {
    label: 'Fallida',
    color: '#ef4444',
    description: 'Validación falló por algún motivo'
  },
  pendiente: {
    label: 'Pendiente',
    color: '#f59e0b',
    description: 'Validación en proceso'
  }
} as const;

export type EstadoValidacion = keyof typeof ESTADOS_VALIDACION;

// Métodos de pago
export const METODOS_PAGO = [
  'efectivo',
  'tarjeta_debito',
  'tarjeta_credito',
  'transferencia',
  'mercado_pago',
  'paypal',
  'crypto',
  'otro'
] as const;

export type MetodoPago = typeof METODOS_PAGO[number];

// Días de la semana
export const DIAS_SEMANA = [
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'domingo'
] as const;

export type DiaSemana = typeof DIAS_SEMANA[number];

// Configuración de QR
export interface QRConfig {
  size: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  baseUrl: string;
  validationPath: string;
}

// Analytics data structures
export interface AnalyticsData {
  validacionesPorDia: Array<{
    fecha: string;
    validaciones: number;
    ingresos: number;
  }>;
  beneficiosMasUsados: Array<{
    beneficioId: string;
    titulo: string;
    usos: number;
  }>;
  clientesPorAsociacion: Array<{
    asociacionId: string;
    nombre: string;
    clientes: number;
  }>;
  horariosActividad: Array<{
    hora: number;
    validaciones: number;
  }>;
}

// Export and import structures
export interface ComercioExportData {
  comercios: Comercio[];
  beneficios: Beneficio[];
  validaciones: Validacion[];
  stats: ComercioStats;
  exportDate: Date;
  asociacionId: string;
  totalRecords: number;
}

export interface ComercioImportData {
  comercios: Partial<ComercioFormData>[];
  validateData?: boolean;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

// Pagination and sorting
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SortOptions {
  field: 'nombreComercio' | 'categoria' | 'estado' | 'creadoEn' | 'validacionesRealizadas';
  order: 'asc' | 'desc';
}

// API Response types
export interface ComercioResponse {
  comercios: Comercio[];
  total: number;
  hasMore: boolean;
  lastDoc?: unknown;
  page: number;
  pageSize: number;
}

export interface ValidationResponse {
  validaciones: Validacion[];
  total: number;
  hasMore: boolean;
  lastDoc?: unknown;
  page: number;
  pageSize: number;
}

// Error types
export interface ComercioError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// Success response
export interface ComercioSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

// Error response
export interface ComercioErrorResponse {
  success: false;
  error: ComercioError;
  message: string;
}

export type ComercioApiResponse<T = unknown> = ComercioSuccessResponse<T> | ComercioErrorResponse;