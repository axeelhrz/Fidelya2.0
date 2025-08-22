import { Timestamp } from 'firebase/firestore';

export interface Pago {
  fecha: Timestamp;
  monto: number;
}

export interface SocioConfiguration {
  // Notificaciones
  notificaciones: boolean;
  notificacionesPush: boolean;
  notificacionesEmail: boolean;
  notificacionesSMS: boolean;
  
  // Apariencia
  tema: 'light' | 'dark' | 'auto';
  idioma: 'es' | 'en';
  moneda: 'ARS' | 'USD' | 'EUR';
  timezone: string;
  
  // Privacidad
  perfilPublico: boolean;
  mostrarEstadisticas: boolean;
  mostrarActividad: boolean;
  compartirDatos: boolean;
  
  // Preferencias
  beneficiosFavoritos: string[];
  comerciosFavoritos: string[];
  categoriasFavoritas: string[];
}

export interface SocioActivity {
  id: string;
  tipo: 'beneficio' | 'validacion' | 'registro' | 'actualizacion' | 'configuracion' | 'vinculacion' | 'desvinculacion';
  titulo: string;
  descripcion: string;
  fecha: Timestamp;
  metadata?: {
    comercioId?: string;
    comercioNombre?: string;
    beneficioId?: string;
    beneficioNombre?: string;
    asociacionId?: string;
    asociacionNombre?: string;
    montoDescuento?: number;
    categoria?: string;
    ubicacion?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

export interface SocioLevel {
  nivel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  puntos: number;
  puntosParaProximoNivel: number;
  proximoNivel: string;
  beneficiosDesbloqueados: string[];
  descuentoAdicional: number;
}

export interface SocioProfile {
  // Información básica
  nombre: string;
  email: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  fechaNacimiento?: Timestamp;
  
  // Imágenes
  avatar?: string;
  avatarThumbnail?: string;
  
  // Configuración
  configuracion: SocioConfiguration;
  
  // Nivel y gamificación
  nivel: SocioLevel;
  
  // Metadata
  ultimoAcceso?: Timestamp;
  dispositivosConectados?: string[];
  ubicacionActual?: {
    lat: number;
    lng: number;
    ciudad: string;
    provincia: string;
  };
}

export interface Socio {
  id: string;
  uid: string;
  nombre: string;
  email: string;
  dni: string;
  telefono?: string;
  direccion?: string;
  asociacionId: string;
  numeroSocio: string;
  estado: 'activo' | 'inactivo' | 'pendiente' | 'suspendido' | 'vencido';
  estadoMembresia: string;
  montoCuota: number;
  beneficiosUsados?: number;
  validacionesRealizadas?: number;
  creadoEn: Timestamp;
  actualizadoEn?: Timestamp;
  fechaNacimiento?: Timestamp;
  fechaIngreso: Timestamp;
  fechaVencimiento?: Timestamp;
  ultimoPago?: Timestamp;
  metadata?: Record<string, string | number | boolean | undefined>;
  avatar?: string | null;
  avatarThumbnail?: string;
  configuracion?: SocioConfiguration;
  ultimoAcceso?: Timestamp;
  dispositivosConectados?: string[];
  ubicacionActual?: {
    lat: number;
    lng: number;
    ciudad: string;
    provincia: string;
  };
  asociacion: string;
  nivel?: {
    nivel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    puntos: number;
    puntosParaProximoNivel: number;
    proximoNivel: string;
    beneficiosDesbloqueados: string[];
    descuentoAdicional: number;
  };
  pagos?: Pago[];
  fotoPerfil?: string; // URL de la foto de perfil
  
  // Relaciones bidireccionales con asociaciones
  asociaciones?: string[]; // IDs de asociaciones vinculadas
  asociacionPrincipal?: string; // ID de la asociación principal
  fechaVinculacion?: Timestamp; // Fecha de vinculación a la asociación actual
  vinculadoPor?: string; // ID del usuario que realizó la vinculación
}

// Tipo simplificado para el formulario de creación/edición de socios
export interface SocioFormData {
  nombre: string;
  email: string;
  estado: 'activo' | 'inactivo' | 'suspendido' | 'pendiente' | 'vencido';
  estadoMembresia?: 'al_dia' | 'vencido' | 'pendiente';
  telefono?: string;
  dni?: string;
  direccion?: string;
  fechaNacimiento?: Date | Timestamp;
  montoCuota?: number;
  fechaVencimiento?: Date | Timestamp;
  numeroSocio?: string;
  asociacionId?: string;
  password?: string;
}

export interface SocioStats {
  // Estadísticas básicas
  total: number;
  activos: number;
  vencidos: number;
  inactivos: number;
  ingresosMensuales?: number;
  
  // Estadísticas detalladas para perfil individual
  beneficiosUsados?: number;
  ahorroTotal?: number;
  beneficiosEsteMes?: number;
  asociacionesActivas?: number;
  racha?: number;
  comerciosVisitados?: number;
  validacionesExitosas?: number;
  descuentoPromedio?: number;
  ahorroEsteMes?: number;
  beneficiosFavoritos?: number;
  tiempoComoSocio?: number;
  
  // Estadísticas avanzadas
  actividadPorMes?: { [mes: string]: number };
  beneficiosPorCategoria?: { [categoria: string]: number };
  comerciosMasVisitados?: Array<{
    id: string;
    nombre: string;
    visitas: number;
    ultimaVisita: Timestamp;
  }>;
  beneficiosMasUsados?: Array<{
    id: string;
    nombre: string;
    usos: number;
    ahorroTotal: number;
  }>;
  
  [key: string]: number | undefined | string | boolean | object | unknown[];
}

export interface SocioAsociacion {
  id: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  estado: 'activo' | 'vencido' | 'pendiente' | 'suspendido';
  fechaInicio: Timestamp;
  fechaVencimiento: Timestamp;
  tipo: 'mensual' | 'anual' | 'vitalicia';
  beneficiosIncluidos: number;
  descuentoMaximo: number;
  comerciosAfiliados: number;
}

// Tipos para la vinculación bidireccional
export interface VinculacionSocioAsociacion {
  socioId: string;
  asociacionId: string;
  fechaVinculacion: Timestamp;
  vinculadoPor: string; // UID del usuario que realizó la vinculación
  estado: 'activo' | 'inactivo' | 'pendiente';
  tipo: 'principal' | 'secundaria'; // Tipo de vinculación
  metadata?: {
    numeroSocio?: string;
    montoCuota?: number;
    fechaVencimiento?: Timestamp;
    observaciones?: string;
  };
}

export interface SocioVinculado {
  id: string;
  nombre: string;
  email: string;
  dni?: string;
  telefono?: string;
  numeroSocio?: string;
  estado: 'activo' | 'inactivo' | 'pendiente' | 'suspendido' | 'vencido';
  estadoMembresia: string;
  fechaVinculacion: Timestamp;
  vinculadoPor: string;
  avatar?: string;
  asociacionId: string;
  montoCuota?: number;
  fechaVencimiento?: Timestamp;
}

// Tipos para formularios y actualizaciones
export interface UpdateSocioProfileData {
  nombre?: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  fechaNacimiento?: Date | Timestamp | string;
  avatar?: string;
  fotoPerfil?: string; // Added to match the Socio interface
  configuracion?: Partial<SocioConfiguration>;
}

export interface SocioActivityFilter {
  tipo?: SocioActivity['tipo'][];
  fechaDesde?: Date;
  fechaHasta?: Date;
  comercioId?: string;
  asociacionId?: string;
  limit?: number;
  offset?: number;
}

// Tipos para exportación de datos
export interface SocioDataExport {
  perfil: Socio;
  estadisticas: SocioStats;
  asociaciones: SocioAsociacion[];
  actividad: SocioActivity[];
  configuracion: SocioConfiguration;
  fechaExportacion: Timestamp;
}

// Tipos para búsqueda y filtrado de socios
export interface SocioSearchFilters {
  nombre?: string;
  email?: string;
  dni?: string;
  estado?: Socio['estado'][];
  estadoMembresia?: string[];
  asociacionId?: string;
  fechaIngresoDesde?: Date;
  fechaIngresoHasta?: Date;
  limit?: number;
  offset?: number;
}

export interface SocioSearchResult {
  socios: Socio[];
  total: number;
  hasMore: boolean;
}