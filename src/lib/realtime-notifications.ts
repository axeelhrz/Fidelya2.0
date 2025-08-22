import React from 'react';
import toast from 'react-hot-toast';

export interface RealtimeNotification {
  id: string;
  type: 'validation' | 'benefit' | 'system' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  data?: Record<string, unknown>;
  persistent?: boolean;
}

class RealtimeNotificationManager {
  private notifications: RealtimeNotification[] = [];
  private listeners: ((notifications: RealtimeNotification[]) => void)[] = [];

  // Add a new notification
  addNotification(notification: Omit<RealtimeNotification, 'id' | 'timestamp'>) {
    const newNotification: RealtimeNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();
    this.showToast(newNotification);

    // Auto-remove non-persistent notifications after 10 seconds
    if (!newNotification.persistent) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, 10000);
    }

    return newNotification.id;
  }

  // Remove a notification
  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Get all notifications
  getNotifications(): RealtimeNotification[] {
    return [...this.notifications];
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: RealtimeNotification[]) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      listener([...this.notifications]);
    });
  }

  private showToast(notification: RealtimeNotification) {
    const toastOptions = {
      duration: notification.persistent ? Infinity : 4000,
      position: 'top-right' as const,
    };

    switch (notification.type) {
      case 'validation':
        toast.success(notification.message, {
          ...toastOptions,
          icon: '✅',
        });
        break;
      
      case 'benefit':
        toast.success(notification.message, {
          ...toastOptions,
          icon: '🎁',
        });
        break;
      
      case 'system':
        toast(notification.message, {
          ...toastOptions,
          icon: '🔔',
        });
        break;
      
      case 'error':
        toast.error(notification.message, {
          ...toastOptions,
          icon: '❌',
        });
        break;
      
      case 'success':
        toast.success(notification.message, {
          ...toastOptions,
          icon: '🎉',
        });
        break;
      
      default:
        toast(notification.message, toastOptions);
    }
  }

  // Predefined notification creators
  validationReceived(socioName: string, benefitTitle: string) {
    return this.addNotification({
      type: 'validation',
      title: 'Nueva Validación',
      message: `${socioName} canjeó: ${benefitTitle}`,
      data: { socioName, benefitTitle }
    });
  }

  connectionRestored() {
    return this.addNotification({
      type: 'success',
      title: 'Conexión Restaurada',
      message: 'La conexión con Firebase se ha restablecido',
    });
  }

  connectionLost() {
    return this.addNotification({
      type: 'error',
      title: 'Conexión Perdida',
      message: 'Se perdió la conexión con Firebase. Reintentando...',
      persistent: true
    });
  }

  dataUpdated(type: string) {
    return this.addNotification({
      type: 'system',
      title: 'Datos Actualizados',
      message: `${type} actualizado en tiempo real`,
    });
  }

  benefitCreated(benefitTitle: string) {
    return this.addNotification({
      type: 'benefit',
      title: 'Nuevo Beneficio',
      message: `Beneficio "${benefitTitle}" creado exitosamente`,
    });
  }

  systemAlert(message: string) {
    return this.addNotification({
      type: 'system',
      title: 'Alerta del Sistema',
      message,
      persistent: true
    });
  }
}

// Export singleton instance
export const realtimeNotifications = new RealtimeNotificationManager();

// React hook for using notifications
export function useRealtimeNotifications() {
  const [notifications, setNotifications] = React.useState<RealtimeNotification[]>([]);

  React.useEffect(() => {
    const unsubscribe = realtimeNotifications.subscribe(setNotifications);
    
    // Get initial notifications
    setNotifications(realtimeNotifications.getNotifications());
    
    return unsubscribe;
  }, []);

  return {
    notifications,
    addNotification: realtimeNotifications.addNotification.bind(realtimeNotifications),
    removeNotification: realtimeNotifications.removeNotification.bind(realtimeNotifications),
    clearAll: realtimeNotifications.clearAll.bind(realtimeNotifications),
  };
}
