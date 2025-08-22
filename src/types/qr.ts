import { Timestamp } from 'firebase/firestore';

export interface QRData {
  comercioId: string;
  beneficioId?: string;
  timestamp: number;
  type: 'beneficio_validation' | 'comercio_info';
  version?: string;
}

export interface QRValidationRequest {
  socioId: string;
  comercioId: string;
  beneficioId?: string;
  asociacionId?: string;
  timestamp?: number;
}

export interface QRValidationResponse {
  success: boolean;
  message: string;
  resultado: 'habilitado' | 'no_habilitado' | 'vencido' | 'suspendido';
  data?: {
    comercio: {
      id: string;
      nombre: string;
      categoria: string;
      direccion?: string;
      logo?: string;
    };
    beneficio?: {
      id: string;
      titulo: string;
      descripcion: string;
      descuento: number;
      tipo: 'porcentaje' | 'monto_fijo' | 'producto_gratis';
      condiciones?: string;
    };
    socio: {
      id: string;
      nombre: string;
      numeroSocio: string;
      estadoMembresia: string;
    };
    validacion: {
      id: string;
      fechaValidacion: Date;
      montoDescuento: number;
      codigoValidacion: string;
    };
  };
  error?: string;
  motivo?: string;
}

export interface QRScannerConfig {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  aspectRatio?: number;
  frameRate?: number;
}

export const DEFAULT_QR_CONFIG: QRScannerConfig = {
  width: 1280,
  height: 720,
  facingMode: 'environment',
  aspectRatio: 16/9,
  frameRate: 30
};

export interface QRValidation {
  id: string;
  comercioId: string;
  socioId: string;
  qrScanId?: string;
  beneficioId?: string;
  exitoso: boolean;
  montoDescuento?: number;
  fechaValidacion: Timestamp;
  codigoValidacion: string;
  codigoUso?: string;
  estado: 'pendiente' | 'usado' | 'expirado';
  creadoEn: Timestamp;
}

export interface QRStatsData {
  totalScans: number;
  totalValidations: number;
  uniqueUsers: number;
  conversionRate: number;
  scansGrowth: number;
  validationsGrowth: number;
  usersGrowth: number;
  conversionGrowth: number;
  dailyScans: Array<{
    date: string;
    scans: number;
    validations: number;
    uniqueUsers: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    scans: number;
  }>;
  deviceStats: Array<{
    name: string;
    value: number;
  }>;
  topLocations: Array<{
    city: string;
    country: string;
    scans: number;
  }>;
  recentActivity: Array<{
    time: string;
    location: string;
    device: string;
    type: 'scan' | 'validation';
  }>;
}

export interface QRConfig {
  size: number;
  margin: number;
  color: string;
  backgroundColor: string;
  includeText: boolean;
  includeLogo: boolean;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

export interface QRGenerationOptions {
  comercioId: string;
  beneficioId?: string;
  customization?: Partial<QRConfig>;
  format?: 'png' | 'svg' | 'pdf';
}

export interface QRUsageStats {
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
  validationsToday: number;
  validationsThisWeek: number;
  validationsThisMonth: number;
  conversionRate: number;
  topDevices: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
  topLocations: Array<{
    city: string;
    country: string;
    count: number;
  }>;
  peakHours: Array<{
    hour: number;
    count: number;
  }>;
}

// Constants
export const QR_SCAN_STATES = {
  PENDING: 'pendiente',
  VALIDATED: 'validado',
  EXPIRED: 'expirado',
} as const;

export const QR_VALIDATION_STATES = {
  PENDING: 'pendiente',
  USED: 'usado',
  EXPIRED: 'expirado',
} as const;

export const QR_DEVICE_TYPES = {
  IPHONE: 'iPhone',
  IPAD: 'iPad',
  ANDROID: 'Android',
  WINDOWS: 'Windows',
  MAC: 'Mac',
  OTHER: 'Otro',
} as const;

export type QRScanState = typeof QR_SCAN_STATES[keyof typeof QR_SCAN_STATES];
export type QRValidationState = typeof QR_VALIDATION_STATES[keyof typeof QR_VALIDATION_STATES];
export type QRDeviceType = typeof QR_DEVICE_TYPES[keyof typeof QR_DEVICE_TYPES];