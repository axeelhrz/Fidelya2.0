import { Timestamp } from 'firebase/firestore';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: Timestamp;
  asociacionId: string;
  userId?: string;
  userName?: string;
  metadata?: ActivityMetadata;
  severity?: 'info' | 'success' | 'warning' | 'error';
  category?: 'member' | 'commerce' | 'benefit' | 'system' | 'validation' | 'notification';
}

export type ActivityType = 
  | 'member_added'
  | 'member_updated' 
  | 'member_deleted'
  | 'member_status_changed'
  | 'commerce_added'
  | 'commerce_updated'
  | 'commerce_linked'
  | 'commerce_unlinked'
  | 'benefit_created'
  | 'benefit_updated'
  | 'benefit_expired'
  | 'validation_completed'
  | 'validation_failed'
  | 'payment_received'
  | 'backup_completed'
  | 'backup_failed'
  | 'import_completed'
  | 'export_completed'
  | 'system_alert'
  | 'notification_sent'
  | 'qr_generated'
  | 'bulk_operation';

export interface ActivityMetadata {
  // Datos del socio
  socioId?: string;
  socioNombre?: string;
  socioEmail?: string;
  numeroSocio?: string;
  
  // Datos del comercio
  comercioId?: string;
  comercioNombre?: string;
  comercioCategoria?: string;
  
  // Datos del beneficio
  beneficioId?: string;
  beneficioTitulo?: string;
  beneficioDescuento?: number;
  
  // Datos de validación
  validacionId?: string;
  montoDescuento?: number;
  codigoValidacion?: string;
  
  // Datos del sistema
  operationType?: string;
  recordsAffected?: number;
  fileSize?: number;
  duration?: number;
  
  // Datos de notificación
  notificationId?: string;
  notificationType?: string;
  recipients?: number;
  
  // Datos adicionales
  previousValue?: unknown;
  newValue?: unknown;
  changes?: Record<string, { from: unknown; to: unknown }>;
  location?: {
    lat: number;
    lng: number;
    city?: string;
  };
  device?: {
    type: string;
    browser?: string;
    os?: string;
  };
}

export interface ActivityFilter {
  type?: ActivityType[];
  category?: string[];
  severity?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  userId?: string;
  search?: string;
}

export interface ActivityStats {
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byType: Record<ActivityType, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface CreateActivityRequest {
  type: ActivityType;
  title: string;
  description: string;
  asociacionId: string;
  userId?: string;
  userName?: string;
  metadata?: ActivityMetadata;
  severity?: 'info' | 'success' | 'warning' | 'error';
  category?: 'member' | 'commerce' | 'benefit' | 'system' | 'validation' | 'notification';
}
