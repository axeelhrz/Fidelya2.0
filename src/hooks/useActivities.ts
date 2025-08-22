import { useState, useEffect, useCallback, useMemo } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { ActivityService } from '@/services/activity.service';
import { 
  ActivityLog, 
  ActivityFilter, 
  ActivityStats, 
  CreateActivityRequest 
} from '@/types/activity';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

interface UseActivitiesReturn {
  // Data
  activities: ActivityLog[];
  stats: ActivityStats | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  
  // Actions
  loadActivities: () => Promise<void>;
  loadMoreActivities: () => Promise<void>;
  refreshActivities: () => Promise<void>;
  createActivity: (request: CreateActivityRequest) => Promise<void>;
  getFilteredActivities: (filter: ActivityFilter) => Promise<ActivityLog[]>;
  
  // Utilities
  clearError: () => void;
  subscribeToRealtime: (limitCount?: number) => () => void;
}

export function useActivities(): UseActivitiesReturn {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | undefined>();

  const asociacionId = user?.uid;

  /**
   * Cargar actividades iniciales
   */
  const loadActivities = useCallback(async () => {
    if (!asociacionId || loading) return;

    try {
      setLoading(true);
      setError(null);

      const result = await ActivityService.getActivitiesByAsociacion(asociacionId, 20);
      
      setActivities(result.activities);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading activities:', err);
      setError('Error al cargar las actividades');
    } finally {
      setLoading(false);
    }
  }, [asociacionId, loading]);

  /**
   * Cargar más actividades (paginación)
   */
  const loadMoreActivities = useCallback(async () => {
    if (!asociacionId || loadingMore || !hasMore || !lastDoc) return;

    try {
      setLoadingMore(true);
      setError(null);

      const result = await ActivityService.getActivitiesByAsociacion(
        asociacionId, 
        20, 
        lastDoc
      );
      
      setActivities(prev => [...prev, ...result.activities]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading more activities:', err);
      setError('Error al cargar más actividades');
    } finally {
      setLoadingMore(false);
    }
  }, [asociacionId, loadingMore, hasMore, lastDoc]);

  /**
   * Refrescar actividades
   */
  const refreshActivities = useCallback(async () => {
    if (!asociacionId) return;

    try {
      setError(null);
      
      // Resetear estado de paginación
      setLastDoc(undefined);
      setHasMore(true);
      
      const result = await ActivityService.getActivitiesByAsociacion(asociacionId, 20);
      
      setActivities(result.activities);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      
      // También cargar estadísticas
      const statsData = await ActivityService.getActivityStats(asociacionId);
      setStats(statsData);
    } catch (err) {
      console.error('Error refreshing activities:', err);
      setError('Error al actualizar las actividades');
    }
  }, [asociacionId]);

  /**
   * Crear nueva actividad
   */
  const createActivity = useCallback(async (request: CreateActivityRequest) => {
    if (!asociacionId) return;

    try {
      setError(null);
      
      await ActivityService.createActivity({
        ...request,
        asociacionId
      });
      
      // Refrescar actividades después de crear una nueva
      await refreshActivities();
      
      toast.success('Actividad registrada correctamente');
    } catch (err) {
      console.error('Error creating activity:', err);
      setError('Error al crear la actividad');
      toast.error('Error al registrar la actividad');
      throw err;
    }
  }, [asociacionId, refreshActivities]);

  /**
   * Obtener actividades filtradas
   */
  const getFilteredActivities = useCallback(async (filter: ActivityFilter): Promise<ActivityLog[]> => {
    if (!asociacionId) return [];

    try {
      setError(null);
      return await ActivityService.getFilteredActivities(asociacionId, filter);
    } catch (err) {
      console.error('Error filtering activities:', err);
      setError('Error al filtrar las actividades');
      return [];
    }
  }, [asociacionId]);

  /**
   * Suscribirse a actualizaciones en tiempo real
   */
  const subscribeToRealtime = useCallback((limitCount: number = 10) => {
    if (!asociacionId) return () => {};

    return ActivityService.subscribeToActivities(
      asociacionId,
      limitCount,
      (realtimeActivities) => {
        // Solo actualizar si hay cambios significativos
        setActivities(prev => {
          const newIds = realtimeActivities.map(a => a.id);
          const existingIds = prev.slice(0, limitCount).map(a => a.id);
          
          // Si los IDs son diferentes, actualizar
          if (JSON.stringify(newIds) !== JSON.stringify(existingIds)) {
            return realtimeActivities;
          }
          
          return prev;
        });
      },
      (err) => {
        console.error('Error in realtime activities:', err);
        setError('Error en la conexión en tiempo real');
      }
    );
  }, [asociacionId]);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Cargar estadísticas
   */
  const loadStats = useCallback(async () => {
    if (!asociacionId) return;

    try {
      const statsData = await ActivityService.getActivityStats(asociacionId);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading activity stats:', err);
    }
  }, [asociacionId]);

  // Cargar datos iniciales
  useEffect(() => {
    if (asociacionId) {
      loadActivities();
      loadStats();
    }
  }, [asociacionId, loadActivities, loadStats]);

  // Memoizar el valor de retorno para evitar re-renders innecesarios
  return useMemo(() => ({
    // Data
    activities,
    stats,
    loading,
    loadingMore,
    error,
    hasMore,
    
    // Actions
    loadActivities,
    loadMoreActivities,
    refreshActivities,
    createActivity,
    getFilteredActivities,
    
    // Utilities
    clearError,
    subscribeToRealtime
  }), [
    activities,
    stats,
    loading,
    loadingMore,
    error,
    hasMore,
    loadActivities,
    loadMoreActivities,
    refreshActivities,
    createActivity,
    getFilteredActivities,
    clearError,
    subscribeToRealtime
  ]);
}

export default useActivities;
