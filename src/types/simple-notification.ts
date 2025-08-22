export type SimpleNotificationType = 'info' | 'success' | 'warning' | 'error';
export type SimpleNotificationChannel = 'email' | 'whatsapp' | 'app';

export interface SimpleNotification {
  id: string;
  title: string;
  message: string;
  type: SimpleNotificationType;
  channels: SimpleNotificationChannel[];
  recipientIds: string[];
  createdAt: Date;
  createdBy: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
}

export interface SimpleNotificationFormData {
  title: string;
  message: string;
  type: SimpleNotificationType;
  channels: SimpleNotificationChannel[];
  recipientIds: string[];
}

export interface SimpleNotificationSettings {
  userId: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  appEnabled: boolean;
  updatedAt: Date;
}

export interface SimpleNotificationResult {
  success: boolean;
  sentCount: number;
  failedCount: number;
  errors: string[];
}

export interface RecipientInfo {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'socio' | 'comercio' | 'asociacion';
}
