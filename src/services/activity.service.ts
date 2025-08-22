import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';
import { 
  ActivityLog, 
  CreateActivityRequest, 
  ActivityFilter, 
  ActivityStats,
  ActivityType 
} from '@/types/activity';

export class ActivityService {
  private static readonly COLLECTION = COLLECTIONS.ACTIVITIES;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  private static cache = new Map<string, { data: unknown; timestamp: number }>();

  /**
   * Crear una nueva actividad
   */
  static async createActivity(request: CreateActivityRequest): Promise<string> {
    try {
      const activityData = {
        ...request,
        timestamp: serverTimestamp(),
        creadoEn: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.COLLECTION), activityData);
      
      // Limpiar cache relacionado
      this.clearCacheForAsociacion(request.asociacionId);
      
      console.log('✅ Activity created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating activity:', error);
      handleError(error, 'Create Activity');
      throw error;
    }
  }

  /**
   * Obtener actividades de una asociación
   */
  static async getActivitiesByAsociacion(
    asociacionId: string,
    limitCount: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<{ activities: ActivityLog[]; lastDoc?: DocumentSnapshot; hasMore: boolean }> {
    try {
      const cacheKey = `activities_${asociacionId}_${limitCount}_${lastDoc?.id || 'first'}`;
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as { activities: ActivityLog[]; lastDoc?: DocumentSnapshot; hasMore: boolean };
      }

      let q = query(
        collection(db, this.COLLECTION),
        where('asociacionId', '==', asociacionId),
        orderBy('timestamp', 'desc'),
        limit(limitCount + 1) // +1 para verificar si hay más
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > limitCount;
      
      if (hasMore) {
        docs.pop(); // Remover el documento extra
      }

      const activities: ActivityLog[] = docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp || Timestamp.now()
      })) as ActivityLog[];

      const result = {
        activities,
        lastDoc: docs.length > 0 ? docs[docs.length - 1] : undefined,
        hasMore
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('❌ Error getting activities:', error);
      handleError(error, 'Get Activities');
      return { activities: [], hasMore: false };
    }
  }

  /**
   * Suscribirse a actividades en tiempo real
   */
  static subscribeToActivities(
    asociacionId: string,
    limitCount: number = 10,
    onUpdate: (activities: ActivityLog[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('asociacionId', '==', asociacionId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      return onSnapshot(q, 
        (snapshot) => {
          const activities: ActivityLog[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp || Timestamp.now()
          })) as ActivityLog[];

          onUpdate(activities);
        },
        (error) => {
          console.error('❌ Error in activities subscription:', error);
          if (onError) {
            onError(error);
          }
        }
      );
    } catch (error) {
      console.error('❌ Error setting up activities subscription:', error);
      if (onError) {
        onError(error as Error);
      }
      return () => {}; // Return empty unsubscribe function
    }
  }

  /**
   * Obtener estadísticas de actividades
   */
  static async getActivityStats(asociacionId: string): Promise<ActivityStats> {
    try {
      const cacheKey = `activity_stats_${asociacionId}`;
      
      if (this.isValidCache(cacheKey)) {
        return this.getCache(cacheKey) as ActivityStats;
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Obtener todas las actividades del mes
      const q = query(
        collection(db, this.COLLECTION),
        where('asociacionId', '==', asociacionId),
        where('timestamp', '>=', Timestamp.fromDate(thisMonth)),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp || Timestamp.now()
      })) as ActivityLog[];

      // Calcular estadísticas
      const stats: ActivityStats = {
        total: activities.length,
        today: activities.filter(a => a.timestamp.toDate() >= today).length,
        thisWeek: activities.filter(a => a.timestamp.toDate() >= thisWeek).length,
        thisMonth: activities.length,
        byType: {} as Record<ActivityType, number>,
        byCategory: {},
        bySeverity: {}
      };

      // Contar por tipo
      activities.forEach(activity => {
        stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;
        
        if (activity.category) {
          stats.byCategory[activity.category] = (stats.byCategory[activity.category] || 0) + 1;
        }
        
        if (activity.severity) {
          stats.bySeverity[activity.severity] = (stats.bySeverity[activity.severity] || 0) + 1;
        }
      });

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting activity stats:', error);
      return {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        byType: {} as Record<ActivityType, number>,
        byCategory: {},
        bySeverity: {}
      };
    }
  }

  /**
   * Filtrar actividades
   */
  static async getFilteredActivities(
    asociacionId: string,
    filter: ActivityFilter,
    limitCount: number = 20
  ): Promise<ActivityLog[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION),
        where('asociacionId', '==', asociacionId)
      );

      // Aplicar filtros
      if (filter.dateFrom) {
        q = query(q, where('timestamp', '>=', Timestamp.fromDate(filter.dateFrom)));
      }

      if (filter.dateTo) {
        q = query(q, where('timestamp', '<=', Timestamp.fromDate(filter.dateTo)));
      }

      if (filter.userId) {
        q = query(q, where('userId', '==', filter.userId));
      }

      q = query(q, orderBy('timestamp', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);
      let activities: ActivityLog[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp || Timestamp.now()
      })) as ActivityLog[];

      // Filtros adicionales en memoria (para arrays)
      if (filter.type && filter.type.length > 0) {
        activities = activities.filter(a => filter.type!.includes(a.type));
      }

      if (filter.category && filter.category.length > 0) {
        activities = activities.filter(a => a.category && filter.category!.includes(a.category));
      }

      if (filter.severity && filter.severity.length > 0) {
        activities = activities.filter(a => a.severity && filter.severity!.includes(a.severity));
      }

      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        activities = activities.filter(a => 
          a.title.toLowerCase().includes(searchTerm) ||
          a.description.toLowerCase().includes(searchTerm) ||
          (a.userName && a.userName.toLowerCase().includes(searchTerm))
        );
      }

      return activities;
    } catch (error) {
      console.error('❌ Error filtering activities:', error);
      return [];
    }
  }

  /**
   * Limpiar actividades antiguas (más de 90 días)
   */
  static async cleanupOldActivities(asociacionId: string): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const q = query(
        collection(db, this.COLLECTION),
        where('asociacionId', '==', asociacionId),
        where('timestamp', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      console.log(`✅ Cleaned up ${snapshot.docs.length} old activities`);
      return snapshot.docs.length;
    } catch (error) {
      console.error('❌ Error cleaning up activities:', error);
      return 0;
    }
  }

  /**
   * Métodos de utilidad para actividades específicas
   */
  static async logMemberActivity(
    asociacionId: string,
    type: 'member_added' | 'member_updated' | 'member_deleted' | 'member_status_changed',
    socioData: { id: string; nombre: string; email?: string; numeroSocio?: string },
    userId?: string,
    userName?: string,
    changes?: Record<string, { from: unknown; to: unknown }>
  ): Promise<void> {
    const titles = {
      member_added: 'Nuevo socio registrado',
      member_updated: 'Socio actualizado',
      member_deleted: 'Socio eliminado',
      member_status_changed: 'Estado de socio modificado'
    };

    const descriptions = {
      member_added: `Se registró el socio ${socioData.nombre}`,
      member_updated: `Se actualizó la información de ${socioData.nombre}`,
      member_deleted: `Se eliminó el socio ${socioData.nombre}`,
      member_status_changed: `Se modificó el estado del socio ${socioData.nombre}`
    };

    await this.createActivity({
      type,
      title: titles[type],
      description: descriptions[type],
      asociacionId,
      userId,
      userName,
      category: 'member',
      severity: type === 'member_deleted' ? 'warning' : 'success',
      metadata: {
        socioId: socioData.id,
        socioNombre: socioData.nombre,
        socioEmail: socioData.email,
        numeroSocio: socioData.numeroSocio,
        changes
      }
    });
  }

  static async logCommerceActivity(
    asociacionId: string,
    type: 'commerce_added' | 'commerce_updated' | 'commerce_linked' | 'commerce_unlinked',
    comercioData: { id: string; nombre: string; categoria?: string },
    userId?: string,
    userName?: string
  ): Promise<void> {
    const titles = {
      commerce_added: 'Nuevo comercio agregado',
      commerce_updated: 'Comercio actualizado',
      commerce_linked: 'Comercio vinculado',
      commerce_unlinked: 'Comercio desvinculado'
    };

    const descriptions = {
      commerce_added: `Se agregó el comercio ${comercioData.nombre}`,
      commerce_updated: `Se actualizó ${comercioData.nombre}`,
      commerce_linked: `Se vinculó el comercio ${comercioData.nombre}`,
      commerce_unlinked: `Se desvinculó el comercio ${comercioData.nombre}`
    };

    await this.createActivity({
      type,
      title: titles[type],
      description: descriptions[type],
      asociacionId,
      userId,
      userName,
      category: 'commerce',
      severity: 'success',
      metadata: {
        comercioId: comercioData.id,
        comercioNombre: comercioData.nombre,
        comercioCategoria: comercioData.categoria
      }
    });
  }

  static async logValidationActivity(
    asociacionId: string,
    validacionData: {
      id: string;
      socioNombre: string;
      comercioNombre: string;
      beneficioTitulo?: string;
      montoDescuento: number;
      exitoso: boolean;
    }
  ): Promise<void> {
    await this.createActivity({
      type: validacionData.exitoso ? 'validation_completed' : 'validation_failed',
      title: validacionData.exitoso ? 'Validación exitosa' : 'Validación fallida',
      description: `${validacionData.socioNombre} ${validacionData.exitoso ? 'utilizó' : 'intentó utilizar'} ${validacionData.beneficioTitulo || 'un beneficio'} en ${validacionData.comercioNombre}`,
      asociacionId,
      category: 'validation',
      severity: validacionData.exitoso ? 'success' : 'error',
      metadata: {
        validacionId: validacionData.id,
        socioNombre: validacionData.socioNombre,
        comercioNombre: validacionData.comercioNombre,
        beneficioTitulo: validacionData.beneficioTitulo,
        montoDescuento: validacionData.montoDescuento
      }
    });
  }

  static async logSystemActivity(
    asociacionId: string,
    type: 'backup_completed' | 'backup_failed' | 'import_completed' | 'export_completed' | 'system_alert',
    title: string,
    description: string,
    metadata?: Record<string, unknown>,
    severity: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<void> {
    await this.createActivity({
      type,
      title,
      description,
      asociacionId,
      category: 'system',
      severity,
      metadata
    });
  }

  // Métodos de cache
  private static getCacheKey(key: string): string {
    return `activity_${key}`;
  }

  private static isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.CACHE_TTL;
  }

  private static getCache(key: string): unknown {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  private static setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private static clearCacheForAsociacion(asociacionId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(asociacionId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Exportar instancia singleton
export const activityService = ActivityService;
export default ActivityService;
