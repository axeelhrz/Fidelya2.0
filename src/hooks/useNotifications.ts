'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'validation' | 'benefit' | 'alert' | 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'system' | 'membership' | 'payment' | 'event' | 'general';
  read: boolean;
  createdAt: Date;
  updatedAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionLabel?: string;
  tags?: string[];
  recipientId: string;
  recipientType: 'comercio' | 'socio' | 'asociacion';
  senderId?: string;
  senderName?: string;
  channels?: string[];
  recipientCount?: number;
  status: 'sent' | 'sending' | 'failed' | 'pending';
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  important: number;
  today: number;
  week: number;
}

export interface NotificationFilters {
  status?: ('unread' | 'read')[];
  category?: ('system' | 'membership' | 'payment' | 'event' | 'general')[];
  priority?: ('low' | 'normal' | 'high' | 'urgent')[];
  type?: ('system' | 'validation' | 'benefit' | 'alert' | 'info' | 'success' | 'warning' | 'error')[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    read: 0,
    important: 0,
    today: 0,
    week: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<NotificationFilters>({});

  // Calcular estadísticas
  const calculateStats = useCallback((notificationsList: Notification[]): NotificationStats => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      total: notificationsList.length,
      unread: notificationsList.filter(n => !n.read).length,
      read: notificationsList.filter(n => n.read).length,
      important: notificationsList.filter(n => n.priority === 'high' || n.priority === 'urgent').length,
      today: notificationsList.filter(n => n.createdAt >= today).length,
      week: notificationsList.filter(n => n.createdAt >= weekAgo).length
    };
  }, []);

  // Cargar notificaciones en tiempo real
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', user.uid),
      where('recipientType', '==', user.role),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as Notification);
      });

      setNotifications(notificationsList);
      setStats(calculateStats(notificationsList));
      setLoading(false);
    }, (error) => {
      console.error('Error loading notifications:', error);
      toast.error('Error al cargar notificaciones');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, calculateStats]);

  // Marcar como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp()
      });
      
      // Actualizar estado local inmediatamente
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, updatedAt: new Date() }
            : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Error al marcar como leída');
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      const promises = unreadNotifications.map(notification => {
        const notificationRef = doc(db, 'notifications', notification.id);
        return updateDoc(notificationRef, {
          read: true,
          updatedAt: serverTimestamp()
        });
      });

      await Promise.all(promises);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, updatedAt: new Date() }))
      );

      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar todas como leídas');
    }
  }, [user, notifications]);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      
      // Actualizar estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Error al eliminar notificación');
    }
  }, []);

  // Crear notificación (para comercios que quieran enviar a sus clientes)
  const createNotification = useCallback(async (data: {
    title: string;
    message: string;
    type: Notification['type'];
    priority: Notification['priority'];
    category: Notification['category'];
    recipientIds: string[];
    recipientType: 'socio';
    actionUrl?: string;
    actionLabel?: string;
    tags?: string[];
    channels?: string[];
    expiresAt?: Date;
  }) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      const promises = data.recipientIds.map(recipientId => {
        return addDoc(collection(db, 'notifications'), {
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          category: data.category,
          read: false,
          createdAt: serverTimestamp(),
          recipientId,
          recipientType: data.recipientType,
          senderId: user.uid,
          senderName: (user.email || 'Comercio'),
          actionUrl: data.actionUrl,
          actionLabel: data.actionLabel,
          tags: data.tags || [],
          channels: data.channels || ['app'],
          status: 'sent',
          expiresAt: data.expiresAt ? Timestamp.fromDate(data.expiresAt) : null
        });
      });

      await Promise.all(promises);
      
      toast.success(`Notificación enviada a ${data.recipientIds.length} destinatario${data.recipientIds.length !== 1 ? 's' : ''}`);
    } catch (error) {
      console.error('Error creating notification:', error);
      toast.error('Error al crear notificación');
    }
  }, [user]);

  // Refrescar estadísticas
  const refreshStats = useCallback(async () => {
    if (!user) return;

    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('recipientId', '==', user.uid),
        where('recipientType', '==', user.role)
      );

      const snapshot = await getDocs(q);
      const notificationsList: Notification[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
          expiresAt: data.expiresAt?.toDate(),
        } as Notification);
      });

      setStats(calculateStats(notificationsList));
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  }, [user, calculateStats]);

  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(notification => {
    // Filtro por estado
    if (filters.status && filters.status.length > 0) {
      const status = notification.read ? 'read' : 'unread';
      if (!filters.status.includes(status)) return false;
    }

    // Filtro por categoría
    if (filters.category && filters.category.length > 0) {
      if (!filters.category.includes(notification.category)) return false;
    }

    // Filtro por prioridad
    if (filters.priority && filters.priority.length > 0) {
      if (!filters.priority.includes(notification.priority)) return false;
    }

    // Filtro por tipo
    if (filters.type && filters.type.length > 0) {
      if (!filters.type.includes(notification.type)) return false;
    }

    // Filtro por rango de fechas
    if (filters.dateRange) {
      const notificationDate = notification.createdAt;
      if (notificationDate < filters.dateRange.start || notificationDate > filters.dateRange.end) {
        return false;
      }
    }

    return true;
  });

  return {
    // Datos
    notifications: filteredNotifications,
    allNotifications: notifications,
    stats,
    loading,
    filters,

    // Acciones
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshStats,
    setFilters,

    // Utilidades
    hasUnread: stats.unread > 0,
    hasImportant: stats.important > 0
  };
};