'use client';

import { toast } from 'react-hot-toast';

interface NotificationConfig {
  enableBatch?: boolean;
  batchDelay?: number;
  maxNotifications?: number;
  enableDebounce?: boolean;
  debounceMs?: number;
}

class OptimizedNotificationManager {
  private config: Required<NotificationConfig>;
  private notificationQueue: Array<{ message: string; type: 'success' | 'error' | 'info'; timestamp: number }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private lastNotificationTime = 0;
  private recentNotifications = new Set<string>();

  constructor(config: NotificationConfig = {}) {
    this.config = {
      enableBatch: true,
      batchDelay: 2000,
      maxNotifications: 3,
      enableDebounce: true,
      debounceMs: 1000,
      ...config
    };
  }

  private shouldShowNotification(message: string): boolean {
    const now = Date.now();
    
    // Debounce: evitar notificaciones muy frecuentes
    if (this.config.enableDebounce && now - this.lastNotificationTime < this.config.debounceMs) {
      return false;
    }

    // Evitar duplicados recientes
    if (this.recentNotifications.has(message)) {
      return false;
    }

    return true;
  }

  private addToRecentNotifications(message: string) {
    this.recentNotifications.add(message);
    
    // Limpiar después de 30 segundos
    setTimeout(() => {
      this.recentNotifications.delete(message);
    }, 30000);
  }

  private processBatch() {
    if (this.notificationQueue.length === 0) return;

    const now = Date.now();
    const validNotifications = this.notificationQueue.filter(
      notif => now - notif.timestamp < this.config.batchDelay
    );

    if (validNotifications.length === 0) {
      this.notificationQueue = [];
      return;
    }

    // Agrupar por tipo
    const grouped = validNotifications.reduce((acc, notif) => {
      if (!acc[notif.type]) acc[notif.type] = [];
      acc[notif.type].push(notif.message);
      return acc;
    }, {} as Record<string, string[]>);

    // Mostrar notificaciones agrupadas
    Object.entries(grouped).forEach(([type, messages]) => {
      if (messages.length === 1) {
        this.showSingleNotification(messages[0], type as 'success' | 'error' | 'info');
      } else {
        this.showBatchNotification(messages, type as 'success' | 'error' | 'info');
      }
    });

    this.notificationQueue = [];
  }

  private showSingleNotification(message: string, type: 'success' | 'error' | 'info') {
    switch (type) {
      case 'success':
        toast.success(message, { duration: 3000 });
        break;
      case 'error':
        toast.error(message, { duration: 4000 });
        break;
      case 'info':
        toast(message, { duration: 3000 });
        break;
    }
    
    this.lastNotificationTime = Date.now();
    this.addToRecentNotifications(message);
  }

  private showBatchNotification(messages: string[], type: 'success' | 'error' | 'info') {
    const count = messages.length;
    const firstMessage = messages[0];
    const batchMessage = count > 1 ? `${firstMessage} (+${count - 1} más)` : firstMessage;

    this.showSingleNotification(batchMessage, type);
  }

  public notify(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (!this.shouldShowNotification(message)) {
      return;
    }

    if (this.config.enableBatch) {
      this.notificationQueue.push({
        message,
        type,
        timestamp: Date.now()
      });

      // Limitar cola
      if (this.notificationQueue.length > this.config.maxNotifications) {
        this.notificationQueue = this.notificationQueue.slice(-this.config.maxNotifications);
      }

      // Configurar batch timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.config.batchDelay);
    } else {
      this.showSingleNotification(message, type);
    }
  }

  public success(message: string) {
    this.notify(message, 'success');
  }

  public error(message: string) {
    this.notify(message, 'error');
  }

  public info(message: string) {
    this.notify(message, 'info');
  }

  public clearQueue() {
    this.notificationQueue = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  public updateConfig(newConfig: Partial<NotificationConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Instancia global
export const optimizedNotifications = new OptimizedNotificationManager({
  enableBatch: true,
  batchDelay: 1500,
  maxNotifications: 3,
  enableDebounce: true,
  debounceMs: 800
});

// Funciones de conveniencia
export const showSuccess = (message: string) => optimizedNotifications.success(message);
export const showError = (message: string) => optimizedNotifications.error(message);
export const showInfo = (message: string) => optimizedNotifications.info(message);
