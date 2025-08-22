import { useState, useEffect, useCallback } from 'react';
import { socioService, SocioFilters, ImportResult } from '@/services/socio.service';
import { Socio, SocioStats, SocioFormData } from '@/types/socio';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

interface UseSociosReturn {
  socios: Socio[];
  stats: SocioStats;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  filters: SocioFilters;
  setFilters: (filters: SocioFilters) => void;
  loadSocios: () => Promise<void>;
  loadMoreSocios: () => Promise<void>;
  createSocio: (data: SocioFormData) => Promise<boolean>;
  updateSocio: (id: string, data: Partial<SocioFormData>) => Promise<boolean>;
  deleteSocio: (id: string) => Promise<boolean>;
  toggleSocioStatus: (id: string, currentStatus: string) => Promise<boolean>;
  importSocios: (csvData: SocioFormData[]) => Promise<ImportResult>;
  registerPayment: (socioId: string, amount: number, months?: number) => Promise<boolean>;
  updateMembershipStatus: () => Promise<number>;
  refreshStats: () => Promise<void>;
  forceReload: () => Promise<void>;
  clearError: () => void;
}

export function useSocios(): UseSociosReturn {
  const { user } = useAuth();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [stats, setStats] = useState<SocioStats>({
    total: 0,
    activos: 0,
    inactivos: 0,
    alDia: 0,
    vencidos: 0,
    pendientes: 0,
    ingresosMensuales: 0,
    beneficiosUsados: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData> | null>(null);
  const [filters, setFilters] = useState<SocioFilters>({});

  const asociacionId = user?.uid || '';

  // Load socios with filters
  const loadSocios = useCallback(async () => {
    if (!asociacionId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await socioService.getSociosByAsociacion(asociacionId, filters, 20);
      
      setSocios(result.socios);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar socios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [asociacionId, filters]);

  // Función para forzar recarga inmediata (útil para desvinculaciones)
  const forceReload = useCallback(async () => {
    if (!asociacionId) return;

    try {
      setError(null);
      
      // Limpiar estado actual para forzar recarga
      setSocios([]);
      setLastDoc(null);
      setHasMore(false);

      const result = await socioService.getSociosByAsociacion(asociacionId, filters, 20);
      
      setSocios(result.socios);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
      
      // También actualizar estadísticas
      const newStats = await socioService.getAsociacionStats(asociacionId);
      setStats(newStats);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al recargar socios';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [asociacionId, filters]);

  // Load more socios (pagination)
  const loadMoreSocios = useCallback(async () => {
    if (!asociacionId || !hasMore || loading) return;

    try {
      setLoading(true);

      const result = await socioService.getSociosByAsociacion(asociacionId, filters, 20, lastDoc);
      
      setSocios(prev => [...prev, ...result.socios]);
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar más socios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [asociacionId, filters, hasMore, loading, lastDoc]);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!asociacionId) return;

    try {
      const newStats = await socioService.getAsociacionStats(asociacionId);
      setStats(newStats);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  }, [asociacionId]);

  // Create new socio
  const createSocio = useCallback(async (data: SocioFormData): Promise<boolean> => {
    if (!asociacionId) return false;

    try {
      setLoading(true);
      setError(null);

      const socioId = await socioService.createSocio(asociacionId, data);
      
      if (socioId) {
        toast.success('Socio creado exitosamente');
        await loadSocios(); // Refresh list
        await refreshStats(); // Refresh stats
        return true;
      } else {
        throw new Error('Error al crear socio');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear socio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [asociacionId, loadSocios, refreshStats]);

  // Update socio
  const updateSocio = useCallback(async (id: string, data: Partial<SocioFormData>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await socioService.updateSocio(id, data);
      
      if (success) {
        toast.success('Socio actualizado exitosamente');
        await loadSocios(); // Refresh list
        await refreshStats(); // Refresh stats
        return true;
      } else {
        throw new Error('Error al actualizar socio');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar socio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSocios, refreshStats]);

  // Delete socio completely (hard delete)
  const deleteSocio = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await socioService.deleteSocioCompletely(id);
      
      if (success) {
        toast.success('Socio eliminado completamente');
        await loadSocios(); // Refresh list
        await refreshStats(); // Refresh stats
        return true;
      } else {
        throw new Error('Error al eliminar socio');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar socio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSocios, refreshStats]);

  // Toggle socio status (activate/deactivate)
  const toggleSocioStatus = useCallback(async (id: string, currentStatus: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
      const success = await socioService.updateSocio(id, { estado: newStatus });
      
      if (success) {
        toast.success(`Socio ${newStatus === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
        await loadSocios(); // Refresh list
        await refreshStats(); // Refresh stats
        return true;
      } else {
        throw new Error('Error al cambiar estado del socio');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cambiar estado del socio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSocios, refreshStats]);

  // Import socios from CSV
  const importSocios = useCallback(async (csvData: SocioFormData[]): Promise<ImportResult> => {
    if (!asociacionId) {
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, error: 'No hay asociación seleccionada', data: {} }],
        duplicates: 0,
      };
    }

    try {
      setLoading(true);
      setError(null);

      const result = await socioService.importSocios(asociacionId, csvData as unknown as Record<string, unknown>[]);
      
      if (result.success) {
        toast.success(`${result.imported} socios importados exitosamente`);
        if (result.duplicates > 0) {
          toast(`${result.duplicates} socios duplicados omitidos`);
        }
        if (result.errors.length > 0) {
          toast(`${result.errors.length} errores encontrados`, { icon: '⚠️' });
        }
        
        await loadSocios(); // Refresh list
        await refreshStats(); // Refresh stats
      } else {
        toast.error('Error en la importación');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al importar socios';
      setError(errorMessage);
      toast.error(errorMessage);
      
      return {
        success: false,
        imported: 0,
        errors: [{ row: 0, error: errorMessage, data: {} }],
        duplicates: 0,
      };
    } finally {
      setLoading(false);
    }
  }, [asociacionId, loadSocios, refreshStats]);

  // Register payment
  const registerPayment = useCallback(async (socioId: string, amount: number, months = 1): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await socioService.registerPayment(socioId, amount, months);
      
      if (success) {
        toast.success('Pago registrado exitosamente');
        await loadSocios(); // Refresh list
        await refreshStats(); // Refresh stats
        return true;
      } else {
        throw new Error('Error al registrar pago');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar pago';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSocios, refreshStats]);

  // Update membership status
  const updateMembershipStatus = useCallback(async (): Promise<number> => {
    if (!asociacionId) return 0;

    try {
      setLoading(true);
      setError(null);

      const updatedCount = await socioService.updateMembershipStatus(asociacionId);
      
      if (updatedCount > 0) {
        toast.success(`${updatedCount} membresías actualizadas`);
        await loadSocios(); // Refresh list
        await refreshStats(); // Refresh stats
      } else {
        toast('No hay membresías que actualizar', { icon: 'ℹ️' });
      }
      return updatedCount;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar membresías';
      setError(errorMessage);
      toast.error(errorMessage);
      return 0;
    } finally {
      setLoading(false);
    }
  }, [asociacionId, loadSocios, refreshStats]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (asociacionId) {
      loadSocios();
      refreshStats();
    }
  }, [asociacionId, loadSocios, refreshStats]);

  // Reload when filters change
  useEffect(() => {
    if (asociacionId) {
      loadSocios();
    }
  }, [asociacionId, filters, loadSocios]);

  return {
    socios,
    stats,
    loading,
    error,
    hasMore,
    filters,
    setFilters,
    loadSocios,
    loadMoreSocios,
    createSocio,
    updateSocio,
    deleteSocio,
    toggleSocioStatus,
    importSocios,
    registerPayment,
    updateMembershipStatus,
    refreshStats,
    forceReload,
    clearError,
  };
}