import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification, NotificationFormData, NotificationFilters } from '@/types/notification';

const COLLECTION_NAME = 'notifications';

// Convertir Firestore timestamp a Date
const convertTimestamp = (
  timestamp: Timestamp | { seconds: number } | Date | string | number | null | undefined
): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (
    typeof timestamp === 'object' &&
    timestamp !== null &&
    'seconds' in timestamp &&
    typeof (timestamp as Record<string, unknown>).seconds === 'number'
  ) {
    return new Date((timestamp as { seconds: number }).seconds * 1000);
  }
  if (timestamp === null || timestamp === undefined) {
    return new Date(0);
  }
  if (typeof timestamp === 'string' || typeof timestamp === 'number' || timestamp instanceof Date) {
    return new Date(timestamp);
  }
  // fallback for unexpected types
  return new Date(0);
};

// Convertir documento de Firestore a Notification
import { DocumentSnapshot } from 'firebase/firestore';

const convertFirestoreDoc = (doc: DocumentSnapshot): Notification => {
  const data = doc.data() || {};
  return {
    id: doc.id,
    recipientId: data.recipientId || '',
    title: data.title || '',
    message: data.message || '',
    type: data.type || '',
    priority: data.priority || '',
    category: data.category || '',
    status: data.status || '',
    metadata: data.metadata || {},
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    readAt: data.readAt ? convertTimestamp(data.readAt) : undefined,
    expiresAt: data.expiresAt ? convertTimestamp(data.expiresAt) : undefined,
    read: data.status === 'read' || !!data.readAt,
  };
};

// Crear nueva notificación
export const createNotification = async (data: NotificationFormData): Promise<string> => {
  try {
    const notificationData = {
      ...data,
      status: 'unread',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        senderName: 'Administrador',
        tags: data.tags || [],
        ...data.metadata,
      },
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), notificationData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Error al crear la notificación');
  }
};

// Obtener todas las notificaciones con filtros
export const getNotifications = async (filters?: NotificationFilters): Promise<Notification[]> => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    // Aplicar filtros
    if (filters?.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }
    if (filters?.type && filters.type.length > 0) {
      constraints.push(where('type', 'in', filters.type));
    }
    if (filters?.priority && filters.priority.length > 0) {
      constraints.push(where('priority', 'in', filters.priority));
    }
    if (filters?.category && filters.category.length > 0) {
      constraints.push(where('category', 'in', filters.category));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    
    let notifications = querySnapshot.docs.map(convertFirestoreDoc);

    // Filtros adicionales que no se pueden hacer en Firestore
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      notifications = notifications.filter(notification =>
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower) ||
        notification.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (filters?.dateRange) {
      notifications = notifications.filter(notification => {
        const notificationDate = new Date(notification.createdAt);
        return notificationDate >= filters.dateRange!.start && notificationDate <= filters.dateRange!.end;
      });
    }

    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw new Error('Error al obtener las notificaciones');
  }
};

// Suscribirse a notificaciones en tiempo real
export const subscribeToNotifications = (
  callback: (notifications: Notification[]) => void,
  filters?: NotificationFilters
) => {
  try {
    const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(100)];

    // Aplicar filtros básicos
    if (filters?.status && filters.status.length > 0) {
      constraints.push(where('status', 'in', filters.status));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    
    return onSnapshot(q, (querySnapshot) => {
      let notifications = querySnapshot.docs.map(convertFirestoreDoc);

      // Aplicar filtros adicionales
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        notifications = notifications.filter(notification =>
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower) ||
          notification.metadata?.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filters?.type && filters.type.length > 0) {
        notifications = notifications.filter(n => filters.type!.includes(n.type));
      }

      if (filters?.priority && filters.priority.length > 0) {
        notifications = notifications.filter(n => n.priority !== undefined && filters.priority!.includes(n.priority));
      }

      if (filters?.category && filters.category.length > 0) {
        notifications = notifications.filter(n => n.category !== undefined && filters.category!.includes(n.category));
      }

      if (filters?.dateRange) {
        notifications = notifications.filter(notification => {
          const notificationDate = new Date(notification.createdAt);
          return notificationDate >= filters.dateRange!.start && notificationDate <= filters.dateRange!.end;
        });
      }

      callback(notifications);
    }, (error) => {
      console.error('Error in notifications subscription:', error);
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    throw new Error('Error al suscribirse a las notificaciones');
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status: 'read',
      readAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Error al marcar la notificación como leída');
  }
};

// Marcar notificación como no leída
export const markNotificationAsUnread = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status: 'unread',
      readAt: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error marking notification as unread:', error);
    throw new Error('Error al marcar la notificación como no leída');
  }
};

// Archivar notificación
export const archiveNotification = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      status: 'archived',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error archiving notification:', error);
    throw new Error('Error al archivar la notificación');
  }
};

// Eliminar notificación
export const deleteNotification = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Error al eliminar la notificación');
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('status', '==', 'unread')
    );
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: 'read',
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Error al marcar todas las notificaciones como leídas');
  }
};

// Acción en lote
export const bulkNotificationAction = async (
  ids: string[],
  action: 'read' | 'unread' | 'archive' | 'delete'
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    for (const id of ids) {
      const docRef = doc(db, COLLECTION_NAME, id);
      
      switch (action) {
        case 'read':
          batch.update(docRef, {
            status: 'read',
            readAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          break;
        case 'unread':
          batch.update(docRef, {
            status: 'unread',
            readAt: null,
            updatedAt: serverTimestamp(),
          });
          break;
        case 'archive':
          batch.update(docRef, {
            status: 'archived',
            updatedAt: serverTimestamp(),
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error in bulk notification action:', error);
    throw new Error('Error al ejecutar la acción en lote');
  }
};

// Obtener estadísticas de notificaciones
export const getNotificationStats = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const notifications = querySnapshot.docs.map(convertFirestoreDoc);
    
    return {
      total: notifications.length,
      unread: notifications.filter(n => n.status === 'unread').length,
      read: notifications.filter(n => n.status === 'read').length,
      archived: notifications.filter(n => n.status === 'archived').length,
      byType: {
        info: notifications.filter(n => n.type === 'info').length,
        success: notifications.filter(n => n.type === 'success').length,
        warning: notifications.filter(n => n.type === 'warning').length,
        error: notifications.filter(n => n.type === 'error').length,
        announcement: notifications.filter(n => n.type === 'announcement').length,
      },
      byPriority: {
        low: notifications.filter(n => n.priority === 'low').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        high: notifications.filter(n => n.priority === 'high').length,
        urgent: notifications.filter(n => n.priority === 'urgent').length,
      },
      byCategory: {
        system: notifications.filter(n => n.category === 'system').length,
        membership: notifications.filter(n => n.category === 'membership').length,
        payment: notifications.filter(n => n.category === 'payment').length,
        event: notifications.filter(n => n.category === 'event').length,
        general: notifications.filter(n => n.category === 'general').length,
      }
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw new Error('Error al obtener las estadísticas');
  }
};

// Limpiar notificaciones expiradas
export const cleanupExpiredNotifications = async (): Promise<void> => {
  try {
    const now = new Date();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('expiresAt', '<=', now)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    querySnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error cleaning up expired notifications:', error);
    throw new Error('Error al limpiar notificaciones expiradas');
  }
};
