import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  comercioSolicitudesService, 
  SolicitudAsociacion, 
  SolicitudAsociacionStats 
} from '@/services/comercio-solicitudes.service';

export const useComercioSolicitudes = () => {
  const { user } = useAuth();
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudAsociacion[]>([]);
  const [todasSolicitudes, setTodasSolicitudes] = useState<SolicitudAsociacion[]>([]);
  const [stats, setStats] = useState<SolicitudAsociacionStats>({
    totalSolicitudes: 0,
    solicitudesPendientes: 0,
    solicitudesAprobadas: 0,
    solicitudesRechazadas: 0,
    asociacionesVinculadas: 0,
    solicitudesEsteMes: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const comercioId = user?.uid;

  // Cargar solicitudes pendientes
  const loadSolicitudesPendientes = useCallback(async () => {
    if (!comercioId) return;

    try {
      setError(null);
      const solicitudes = await comercioSolicitudesService.getSolicitudesPendientes(comercioId);
      setSolicitudesPendientes(solicitudes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar solicitudes pendientes';
      setError(errorMessage);
      console.error('Error loading pending requests:', err);
    }
  }, [comercioId]);

  // Cargar todas las solicitudes
  const loadTodasSolicitudes = useCallback(async () => {
    if (!comercioId) return;

    try {
      setError(null);
      const solicitudes = await comercioSolicitudesService.getSolicitudesComercio(comercioId);
      setTodasSolicitudes(solicitudes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar solicitudes';
      setError(errorMessage);
      console.error('Error loading all requests:', err);
    }
  }, [comercioId]);

  // Cargar estadísticas
  const loadStats = useCallback(async () => {
    if (!comercioId) return;

    try {
      setError(null);
      const solicitudesStats = await comercioSolicitudesService.getSolicitudesStats(comercioId);
      setStats(solicitudesStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar estadísticas';
      setError(errorMessage);
      console.error('Error loading stats:', err);
    }
  }, [comercioId]);

  // Aprobar solicitud
  const aprobarSolicitud = useCallback(async (solicitudId: string): Promise<boolean> => {
    if (!comercioId) {
      toast.error('No se pudo identificar el comercio');
      return false;
    }

    setLoading(true);
    try {
      setError(null);
      const success = await comercioSolicitudesService.aprobarSolicitud(solicitudId);

      if (success) {
        toast.success('Solicitud aprobada exitosamente');
        // Recargar datos
        await Promise.all([
          loadSolicitudesPendientes(),
          loadTodasSolicitudes(),
          loadStats()
        ]);
        return true;
      } else {
        toast.error('Error al aprobar la solicitud');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al aprobar solicitud';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [comercioId, loadSolicitudesPendientes, loadTodasSolicitudes, loadStats]);

  // Rechazar solicitud
  const rechazarSolicitud = useCallback(async (solicitudId: string, motivo: string): Promise<boolean> => {
    if (!comercioId) {
      toast.error('No se pudo identificar el comercio');
      return false;
    }

    setLoading(true);
    try {
      setError(null);
      const success = await comercioSolicitudesService.rechazarSolicitud(solicitudId, motivo);

      if (success) {
        toast.success('Solicitud rechazada');
        // Recargar datos
        await Promise.all([
          loadSolicitudesPendientes(),
          loadTodasSolicitudes(),
          loadStats()
        ]);
        return true;
      } else {
        toast.error('Error al rechazar la solicitud');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al rechazar solicitud';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [comercioId, loadSolicitudesPendientes, loadTodasSolicitudes, loadStats]);

  // Eliminar solicitud
  const eliminarSolicitud = useCallback(async (solicitudId: string): Promise<boolean> => {
    if (!comercioId) {
      toast.error('No se pudo identificar el comercio');
      return false;
    }

    setLoading(true);
    try {
      setError(null);
      const success = await comercioSolicitudesService.eliminarSolicitud(solicitudId);

      if (success) {
        toast.success('Solicitud eliminada');
        // Recargar datos
        await Promise.all([
          loadSolicitudesPendientes(),
          loadTodasSolicitudes(),
          loadStats()
        ]);
        return true;
      } else {
        toast.error('Error al eliminar la solicitud');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar solicitud';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [comercioId, loadSolicitudesPendientes, loadTodasSolicitudes, loadStats]);

  // Obtener información de asociación
  const getAsociacionInfo = useCallback(async (asociacionId: string) => {
    try {
      return await comercioSolicitudesService.getAsociacionInfo(asociacionId);
    } catch (err) {
      console.error('Error getting association info:', err);
      return null;
    }
  }, []);

  // Refrescar todos los datos
  const refresh = useCallback(async () => {
    if (!comercioId) return;

    setLoading(true);
    try {
      await Promise.all([
        loadSolicitudesPendientes(),
        loadTodasSolicitudes(),
        loadStats()
      ]);
    } finally {
      setLoading(false);
    }
  }, [comercioId, loadSolicitudesPendientes, loadTodasSolicitudes, loadStats]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Efecto para cargar datos iniciales y configurar listeners
  useEffect(() => {
    if (!comercioId) return;

    // Cargar datos iniciales
    refresh();

    // Configurar listener para solicitudes pendientes en tiempo real
    const unsubscribe = comercioSolicitudesService.onSolicitudesPendientesChange(
      comercioId,
      (solicitudes) => {
        setSolicitudesPendientes(solicitudes);
        // Actualizar stats cuando cambien las solicitudes
        loadStats();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [comercioId, refresh, loadStats]);

  return {
    // Data
    solicitudesPendientes,
    todasSolicitudes,
    stats,
    loading,
    error,

    // Actions
    aprobarSolicitud,
    rechazarSolicitud,
    eliminarSolicitud,
    getAsociacionInfo,

    // Utility Actions
    refresh,
    loadSolicitudesPendientes,
    loadTodasSolicitudes,
    loadStats,
    clearError
  };
};
