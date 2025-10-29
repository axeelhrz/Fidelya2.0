// Tipos básicos para el sistema de notificaciones simplificado
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'announcement';
export type NotificationStatus = 'unread' | 'read' | 'archived';

// Para compatibilidad con el código existente que pueda referenciar estos tipos
// DEPRECATED: La prioridad ya no se utiliza en el sistema de notificaciones
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationCategory = 'system' | 'membership' | 'payment' | 'event' | 'general';

// Notificación básica en la app
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  // REMOVED: priority - Las notificaciones se procesan por orden de ejecución
  category?: NotificationCategory;
  createdAt: Date;
  updatedAt?: Date;
  readAt?: Date;
  recipientId: string;
  read: boolean;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    senderName?: string;
    tags?: string[];
    recipientCount?: number;
    [key: string]: unknown;
  };
}

// Filtros para notificaciones
export interface NotificationFilters {
  search?: string;
  status?: NotificationStatus[];
  type?: NotificationType[];
  // REMOVED: priority - Ya no se filtra por prioridad
  category?: NotificationCategory[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// Configuración básica de notificaciones (mantener para compatibilidad)
export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  categories: Record<NotificationCategory, boolean>;
  // REMOVED: priorities - Ya no se configuran prioridades
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  updatedAt: Date;
}

// Datos básicos para crear notificación (mantener para compatibilidad)
export interface NotificationFormData {
  title: string;
  message: string;
  type: NotificationType;
  // REMOVED: priority - Las notificaciones se envían por orden de ejecución
  category?: NotificationCategory;
  recipientIds?: string[];
  tags?: string[];
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    senderName?: string;
    tags?: string[];
    recipientCount?: number;
    [key: string]: unknown;
  };
}
