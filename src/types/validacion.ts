import { Timestamp } from 'firebase/firestore';

export interface Validacion {
  id: string;
  socioId: string;
  socioNombre: string;
  asociacionId: string;
  asociacionNombre: string;
  comercioId: string;
  comercioNombre: string;
  beneficioId?: string;
  beneficioTitulo?: string;
  fechaHora: Timestamp;
  resultado: 'habilitado' | 'no_habilitado' | 'vencido' | 'suspendido';
  motivo?: string;
  montoDescuento?: number;
  metadata?: {
    ubicacion?: {
      lat: number;
      lng: number;
    };
    dispositivo?: string;
    ip?: string;
    qrData?: string;
  };
  estado?: 'pendiente' | 'completado' | 'fallido';
  monto: number;
  ahorro: number;
  
}

export interface ValidacionRequest {
  socioId: string;
  comercioId: string;
  beneficioId?: string;
  ubicacion?: {
    lat: number;
    lng: number;
  };
}

export interface ValidacionResponse {
  resultado: 'habilitado' | 'no_habilitado' | 'vencido' | 'suspendido';
  motivo?: string;
  beneficio?: {
    id: string;
    titulo: string;
    descuento: number;
    tipo: string;
    comercioNombre: string;
    descripcion?: string;
    fechaFin?: Date;
  };
  socio: {
    nombre: string;
    estado: string;
    asociacion: string;
  };
  validacionId?: string;
  fechaHora: Timestamp | Date;
  montoDescuento?: number;
  beneficioTitulo?: string;
  id?: string;
  comercioNombre?: string;
}

export interface QRData {
  comercioId: string;
  beneficioId?: string;
  timestamp: number;
  signature?: string;
}