import { Timestamp } from 'firebase/firestore';

export interface Beneficio {
  id: string;
  titulo: string;
  descripcion: string;
  descuento: number;
  tipo: 'porcentaje' | 'monto_fijo' | 'producto_gratis';
  comercioId: string;
  comercioNombre: string;
  comercioLogo?: string;
  asociacionId: string;
  asociacionNombre: string;
  asociacionesDisponibles: string[];
  tipoAcceso?: 'asociacion' | 'publico' | 'directo'; // NEW FIELD
  fechaInicio: Timestamp;
  fechaFin: Timestamp;
  estado: 'activo' | 'inactivo' | 'vencido' | 'agotado';
  limitePorSocio?: number;
  limiteTotal?: number;
  usosActuales: number;
  condiciones?: string;
  categoria: string;
  tags?: string[];
  destacado?: boolean;
  imagenUrl?: string;
  qrCode?: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
  creadoPor: string;
  asociacionesVinculadas?: Array<{
    id: string;
    nombre: string;
    logo?: string;
  }>;
  activo?: boolean; // Para compatibilidad con el frontend
}

export interface BeneficioUso {
  id: string;
  beneficioId: string;
  beneficioTitulo: string;
  socioId: string;
  socioNombre: string;
  socioEmail: string;
  comercioId: string;
  comercioNombre: string;
  asociacionId: string | null; // Can be null for independent socios
  asociacionNombre: string | null; // Can be null for independent socios
  fechaUso: Timestamp;
  montoOriginal?: number;
  montoDescuento: number;
  montoFinal?: number;
  estado: 'usado' | 'pendiente' | 'cancelado' | 'validado';
  validacionId?: string;
  validadoPor?: string;
  fechaValidacion?: Timestamp;
  notas?: string;
  detalles?: string;
  metodoPago?: string;
  ubicacion?: {
    lat: number;
    lng: number;
    direccion: string;
  };
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface BeneficioStats {
  totalBeneficios: number;
  beneficiosActivos: number;
  beneficiosUsados: number;
  beneficiosVencidos: number;
  ahorroTotal: number;
  ahorroEsteMes: number;
  usosPorMes: Array<{
    mes: string;
    usos: number;
    ahorro: number;
  }>;
  topBeneficios: Array<{
    id: string;
    titulo: string;
    usos: number;
    ahorro: number;
  }>;
  categorias: Array<{
    nombre: string;
    cantidad: number;
    usos: number;
  }>;
  comercios: Array<{
    id: string;
    nombre: string;
    beneficios: number;
    usos: number;
  }>;
  activos: number;
}

export interface BeneficioFormData {
  titulo: string;
  descripcion: string;
  descuento: number;
  tipo: 'porcentaje' | 'monto_fijo' | 'producto_gratis';
  fechaInicio: Date;
  fechaFin: Date;
  limitePorSocio?: number;
  limiteTotal?: number;
  condiciones?: string;
  categoria: string;
  tags?: string[];
  destacado?: boolean;
  tipoAcceso?: 'asociacion' | 'publico' | 'directo'; // NEW FIELD
  asociacionesDisponibles?: string[];
  comercioId?: string; // Para cuando las asociaciones crean beneficios
}

export interface BeneficioFilter {
  categoria?: string;
  comercio?: string;
  asociacion?: string;
  estado?: string;
  fechaInicio?: Date;
  fechaFin?: Date;
  soloDestacados?: boolean;
  soloNuevos?: boolean;
  proximosAVencer?: boolean;
  busqueda?: string;
  tipoAcceso?: 'asociacion' | 'publico' | 'directo'; // NEW FIELD
}

export interface BeneficioValidacion {
  id: string;
  beneficioId: string;
  usoId: string;
  socioId: string;
  comercioId: string;
  codigoValidacion: string;
  qrCode: string;
  fechaCreacion: Timestamp;
  fechaExpiracion: Timestamp;
  fechaUso?: Timestamp;
  estado: 'activo' | 'usado' | 'expirado';
  ubicacion?: {
    lat: number;
    lng: number;
  };
  validadoPor?: string;
  notas?: string;
}

// Constantes
export const CATEGORIAS_BENEFICIOS = [
  'Alimentación',
  'Restaurantes',
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
  'Farmacia',
  'Librería y Papelería',
  'Otros'
] as const;

export const ESTADOS_BENEFICIO = [
  'activo',
  'inactivo',
  'vencido',
  'agotado'
] as const;

export const TIPOS_BENEFICIO = [
  'porcentaje',
  'monto_fijo',
  'producto_gratis'
] as const;

export const TIPOS_ACCESO_BENEFICIO = [
  'asociacion',
  'publico',
  'directo'
] as const;

export type CategoriaBeneficio = typeof CATEGORIAS_BENEFICIOS[number];
export type EstadoBeneficio = typeof ESTADOS_BENEFICIO[number];
export type TipoBeneficio = typeof TIPOS_BENEFICIO[number];
export type TipoAccesoBeneficio = typeof TIPOS_ACCESO_BENEFICIO[number];