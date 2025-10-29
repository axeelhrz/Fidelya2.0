import { Timestamp } from 'firebase/firestore';

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  fechaNacimiento?: Timestamp;
  avatar?: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  comercioId: string;
  asociacionId?: string;
  socioId?: string; // ID del socio que generó este cliente
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
  ultimoAcceso?: Timestamp;
  
  // Información sobre creación automática
  creadoAutomaticamente: boolean; // Si fue creado por validación QR
  datosCompletos: boolean; // Si el comercio completó la información
  fechaPrimeraVisita?: Timestamp; // Primera vez que validó QR
  
  // Estadísticas del cliente
  totalCompras: number;
  montoTotalGastado: number;
  beneficiosUsados: number;
  ahorroTotal: number;
  frecuenciaVisitas: number;
  totalValidaciones: number; // Número de veces que validó QR
  
  // Preferencias
  categoriasFavoritas: string[];
  metodoPagoPreferido?: string;
  horarioPreferido?: string;
  
  // Información adicional
  notas?: string;
  tags?: string[];
  fechaUltimaCompra?: Timestamp;
  fechaUltimaVisita?: Timestamp; // Última validación QR
  promedioCompra: number;
  
  // Configuración de comunicación
  configuracion: {
    recibirNotificaciones: boolean;
    recibirPromociones: boolean;
    recibirEmail: boolean;
    recibirSMS: boolean;
  };
}

export interface ClienteFormData {
  nombre: string;
  email: string;
  telefono?: string;
  dni?: string;
  direccion?: string;
  fechaNacimiento?: string;
  notas?: string;
  tags?: string[];
  configuracion: {
    recibirNotificaciones: boolean;
    recibirPromociones: boolean;
    recibirEmail: boolean;
    recibirSMS: boolean;
  };
}

export interface ClienteStats {
  totalClientes: number;
  clientesActivos: number;
  clientesNuevos: number;
  clientesInactivos: number;
  clientesPendientesCompletar: number; // Clientes creados automáticamente sin completar
  clientesCompletados: number; // Clientes con datos completos
  promedioComprasPorCliente: number;
  montoPromedioCompra: number;
  clientesMasActivos: Cliente[];
  crecimientoMensual: number;
  retencionClientes: number;
  valorVidaPromedio: number;
  validacionesTotales: number; // Total de validaciones QR
}

export interface ClienteActivity {
  id: string;
  clienteId: string;
  tipo: 'compra' | 'beneficio' | 'visita' | 'registro' | 'actualizacion' | 'validacion_qr';
  descripcion: string;
  monto?: number;
  beneficioId?: string;
  validacionId?: string; // ID de la validación QR
  fecha: Timestamp;
  metadata?: Record<string, unknown>;
}

export interface ClienteFilter {
  estado?: 'activo' | 'inactivo' | 'suspendido';
  datosCompletos?: boolean; // Filtrar por datos completos/incompletos
  creadoAutomaticamente?: boolean; // Filtrar por creación automática
  fechaDesde?: Date;
  fechaHasta?: Date;
  montoMinimo?: number;
  montoMaximo?: number;
  categorias?: string[];
  tags?: string[];
  busqueda?: string;
  ordenarPor?: 'nombre' | 'fechaCreacion' | 'ultimaCompra' | 'totalGastado' | 'ultimaVisita';
  orden?: 'asc' | 'desc';
  limite?: number;
  offset?: number;
}

export interface ClienteSegment {
  id: string;
  nombre: string;
  descripcion: string;
  criterios: ClienteFilter;
  clientesCount: number;
  valorTotal: number;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface ClienteExport {
  clientes: Cliente[];
  estadisticas: ClienteStats;
  actividades: ClienteActivity[];
  fechaExportacion: Timestamp;
  comercioId: string;
  totalRegistros: number;
}

// Datos mínimos para crear cliente automáticamente
export interface ClienteAutoData {
  socioId: string;
  socioNombre: string;
  socioEmail?: string;
  asociacionId: string;
  comercioId: string;
}