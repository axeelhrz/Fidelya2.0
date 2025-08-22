// Firebase collection names
export const COLLECTIONS = {
  USERS: 'users',
  COMERCIOS: 'comercios',
  SOCIOS: 'socios',
  ASOCIACIONES: 'asociaciones',
  BENEFICIOS: 'beneficios',
  VALIDACIONES: 'validaciones',
  NOTIFICATIONS: 'notifications',
  BACKUPS: 'backups',
  BACKUP_CONFIGS: 'backupConfigs',
  ACTIVITIES: 'activities',
  CLIENTE_ACTIVITIES: 'cliente_activities',
  CLIENTE_SEGMENTS: 'cliente_segments',
  SOLICITUDES_ADHESION: 'solicitudes_adhesion',
} as const;

// Export type for collection names
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// Helper function to get the correct base URL - DETECTA AUTOMÁTICAMENTE EL DOMINIO
const getBaseUrl = (): string => {
  // En el cliente (navegador), usar el dominio actual
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  // En el servidor, usar variables de entorno o fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // Fallback para desarrollo
  return 'http://localhost:3001';
};

// Helper function to get the development URL (for non-QR purposes)
const getDevUrl = (): string => {
  // In production, use the environment variable or Vercel URL
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    // Fallback for production
    return 'https://fidelya.vercel.app';
  }
  
  // In development, use localhost
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
};

// Helper function to get the production URL (for password reset and email verification)
export const getProductionUrl = (): string => {
  // En producción, siempre usar el dominio de la plataforma
  if (process.env.NODE_ENV === 'production') {
    // Priorizar la URL configurada en variables de entorno
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    // Si está en Vercel, usar la URL de Vercel
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    // Fallback al dominio principal de la plataforma
    return 'https://fidelya.vercel.app';
  }
  
  // En desarrollo, usar localhost solo si no hay URL configurada
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
};

// App configuration
export const APP_CONFIG = {
  name: 'Fidelya',
  version: '1.0.0',
  description: 'Sistema de Gestión de Socios y Beneficios',
  url: getDevUrl(), // Usar getDevUrl para la URL de la app
  supportEmail: 'soporte@fidelya.com',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
} as const;

// Enhanced CORS and Storage configuration
export const STORAGE_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  maxFileSize: APP_CONFIG.maxFileSize,
  allowedTypes: APP_CONFIG.allowedImageTypes,
  corsOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://127.0.0.1:3000',
    'https://127.0.0.1:3001',
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : null,
    'https://fidelya.vercel.app',
  ].filter(Boolean),
  // Enhanced fallback strategies for CORS issues
  useDataUrlFallback: true,
  enableStorageBackup: true,
  uploadTimeout: 10000, // 10 seconds
  corsRetryAttempts: 3,
  corsRetryDelay: 2000, // 2 seconds
} as const;

// User roles and permissions
export const USER_ROLES = {
  ADMIN: 'admin',
  ASOCIACION: 'asociacion',
  COMERCIO: 'comercio',
  SOCIO: 'socio',
} as const;

export const USER_STATES = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  PENDIENTE: 'pendiente',
  SUSPENDIDO: 'suspendido',
} as const;

// Beneficio types and states
export const BENEFICIO_TYPES = {
  PORCENTAJE: 'porcentaje',
  MONTO_FIJO: 'monto_fijo',
  PRODUCTO_GRATIS: 'producto_gratis',
} as const;

export const BENEFICIO_STATES = {
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  VENCIDO: 'vencido',
} as const;

// Validation states
export const VALIDACION_STATES = {
  EXITOSA: 'exitosa',
  FALLIDA: 'fallida',
  PENDIENTE: 'pendiente',
} as const;

// Notification types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  REMINDER: 'reminder',
} as const;

// Dashboard routes by role
export const DASHBOARD_ROUTES = {
  [USER_ROLES.ADMIN]: '/dashboard/admin',
  [USER_ROLES.ASOCIACION]: '/dashboard/asociacion',
  [USER_ROLES.COMERCIO]: '/dashboard/comercio',
  [USER_ROLES.SOCIO]: '/dashboard/socio',
} as const;

// Enhanced QR Code configuration with dynamic URL detection
export const QR_CONFIG = {
  size: 256,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF',
  },
  errorCorrectionLevel: 'M' as const,
  baseUrl: getBaseUrl(), // DETECTA AUTOMÁTICAMENTE EL DOMINIO ACTUAL
  validationPath: '/validar-beneficio',
  // Enhanced QR options for better quality and CORS handling
  quality: 0.92,
  type: 'image/png' as const,
  rendererOpts: {
    quality: 0.92,
  },
  // Fallback options
  useFallbackGeneration: true,
  enableBatchProcessing: true,
  batchSize: 5,
  batchDelay: 500, // milliseconds between batches
} as const;

// Pagination defaults
export const PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultPage: 1,
} as const;

// Date formats
export const DATE_FORMATS = {
  display: 'dd/MM/yyyy',
  displayWithTime: 'dd/MM/yyyy HH:mm',
  iso: 'yyyy-MM-dd',
  timestamp: 'yyyy-MM-dd HH:mm:ss',
} as const;

// Validation rules
export const VALIDATION_RULES = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  password: {
    minLength: 6,
    maxLength: 128,
  },
  name: {
    minLength: 2,
    maxLength: 100,
  },
  description: {
    maxLength: 500,
  },
} as const;

// Enhanced error messages with CORS-specific handling
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu internet.',
  UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  VALIDATION_ERROR: 'Los datos ingresados no son válidos.',
  SERVER_ERROR: 'Error interno del servidor. Intenta más tarde.',
  FILE_TOO_LARGE: `El archivo es muy grande. Máximo ${APP_CONFIG.maxFileSize / 1024 / 1024}MB.`,
  INVALID_FILE_TYPE: 'Tipo de archivo no permitido.',
  CORS_ERROR: 'Error de configuración CORS. Usando método alternativo.',
  STORAGE_ERROR: 'Error al acceder al almacenamiento. Usando método local.',
  UPLOAD_TIMEOUT: 'Tiempo de espera agotado. Reintentando con método alternativo.',
  STORAGE_QUOTA_EXCEEDED: 'Cuota de almacenamiento excedida.',
  NETWORK_TIMEOUT: 'Tiempo de espera de red agotado.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Creado exitosamente',
  UPDATED: 'Actualizado exitosamente',
  DELETED: 'Eliminado exitosamente',
  SAVED: 'Guardado exitosamente',
  SENT: 'Enviado exitosamente',
  UPLOADED: 'Subido exitosamente',
  QR_GENERATED: 'Código QR generado exitosamente',
  BATCH_PROCESSED: 'Procesamiento por lotes completado',
  FALLBACK_SUCCESS: 'Operación completada usando método alternativo',
} as const;

// Environment helpers
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isClient = typeof window !== 'undefined';
export const isServer = typeof window === 'undefined';

// Enhanced feature flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_BACKUPS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_PWA: true,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_CORS_FALLBACK: true, // Enable CORS fallback strategies
  ENABLE_STORAGE_RETRY: true, // Enable retry logic for storage operations
  ENABLE_BATCH_PROCESSING: true, // Enable batch processing for QR codes
  ENABLE_DEBUG_LOGGING: isDevelopment, // Enable debug logging in development
} as const;

// Cache configuration
export const CACHE_CONFIG = {
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  longTTL: 60 * 60 * 1000, // 1 hour
  shortTTL: 30 * 1000, // 30 seconds
} as const;

// Rate limiting
export const RATE_LIMITS = {
  login: {
    attempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  api: {
    requests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  upload: {
    files: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  qrGeneration: {
    requests: 50,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

// Adhesion states
export const ESTADOS_ADHESION = {
  PENDIENTE: 'pendiente',
  APROBADA: 'aprobada',
  RECHAZADA: 'rechazada',
} as const;

export type EstadoAdhesion = typeof ESTADOS_ADHESION[keyof typeof ESTADOS_ADHESION];

// CORS debugging helpers
export const CORS_DEBUG = {
  logRequests: isDevelopment,
  logErrors: true,
  logFallbacks: true,
  showUserFriendlyMessages: true,
} as const;

// Storage bucket helpers
export const getStorageBucket = () => {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const customBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  
  if (customBucket) {
    return customBucket;
  }
  
  if (projectId) {
    return `${projectId}.appspot.com`;
  }
  
  console.warn('⚠️ Firebase project ID not found. Storage operations may fail.');
  return null;
};

// CORS configuration validation
export const validateCorsConfig = () => {
  const bucket = getStorageBucket();
  const hasValidOrigins = STORAGE_CONFIG.corsOrigins.length > 0;
  const hasValidBucket = bucket !== null;
  
  if (!hasValidBucket) {
    console.warn('⚠️ Invalid storage bucket configuration');
  }
  
  if (!hasValidOrigins) {
    console.warn('⚠️ No CORS origins configured');
  }
  
  return {
    isValid: hasValidBucket && hasValidOrigins,
    bucket,
    origins: STORAGE_CONFIG.corsOrigins,
    recommendations: [
      !hasValidBucket ? 'Set NEXT_PUBLIC_FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET' : null,
      !hasValidOrigins ? 'Configure CORS origins in STORAGE_CONFIG' : null,
    ].filter(Boolean),
  };
};

// Helper function to get the current URL (client-side only) - FUNCIÓN PARA DETECTAR DOMINIO ACTUAL
export const getCurrentUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  return getDevUrl();
};

// Función para obtener la URL base dinámicamente (para usar en componentes)
export const getDynamicBaseUrl = (): string => {
  return getBaseUrl();
};

// Función para obtener la URL de producción (para reseteo de contraseña y verificación de email)
export const getProductionUrlForAuth = (): string => {
  // En producción, siempre usar el dominio de la plataforma
  if (process.env.NODE_ENV === 'production') {
    // Priorizar la URL configurada en variables de entorno
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    // Si está en Vercel, usar la URL de Vercel
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    // Fallback al dominio principal de la plataforma
    return 'https://fidelya.vercel.app';
  }
  
  // En desarrollo, usar localhost solo si no hay URL configurada
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
};