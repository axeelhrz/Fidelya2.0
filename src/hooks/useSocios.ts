import { useState, useEffect, useCallback, useMemo } from 'react';
import { socioService, SocioFilters, ImportResult } from '@/services/socio.service';
import { Socio, SocioStats, SocioFormData } from '@/types/socio';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

interface UseSociosReturn {
  bulkUpdateEstado: (socioIds: string[], nuevoEstado: Socio['estado']) => Promise<{updated: number; failed: string[]}>;
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<import('firebase/firestore').QueryDocumentSnapshot<import('firebase/firestore').DocumentData> | null>(null);
  const [filters, setFilters] = useState<SocioFilters>({});

  const asociacionId = user?.uid || '';

  // Calcular estadísticas localmente basándose EXACTAMENTE en lo que muestra la tabla
  const stats = useMemo((): SocioStats => {
    if (!socios || socios.length === 0) {
      return {
        total: 0,
        activos: 0,
        vencidos: 0,
        inactivos: 0,
        beneficiosUsados: 0,
        ahorroTotal: 0,
        comerciosVisitados: 0,
        ingresosMensuales: 0,
        alDia: 0,
        pendientes: 0,
        porcentajeVencidos: 0,
        sociosAnalizados: 0,
        sociosConEstadoMembresia: 0
      };
    }

    let activos = 0;
    let inactivos = 0;
    let vencidos = 0;
    let pendientes = 0;
    let alDia = 0;
    let beneficiosUsados = 0;
    let ingresosMensuales = 0;

    console.log(`🔍 [useSocios] Calculando estadísticas para ${socios.length} socios...`);

    socios.forEach(socio => {
      // Contar por estado (EXACTAMENTE como se muestra en la tabla)
      if (socio.estado === 'activo') {
        activos++;
      } else if (socio.estado === 'inactivo') {
        inactivos++;
      } else if (socio.estado === 'vencido') {
        vencidos++;
        console.log(`⚠️ [useSocios] Socio vencido detectado: ${socio.nombre} - estado: ${socio.estado}`);
      } else if (socio.estado === 'pendiente') {
        pendientes++;
      } else if (socio.estado === 'suspendido') {
        inactivos++; // Contar suspendidos como inactivos para las métricas
      }

      // Para estadoMembresia (si existe), pero esto es secundario
      const estadoMembresia = socio.estadoMembresia;
      if (estadoMembresia === 'al_dia') {
        alDia++;
        // Solo contar ingresos de socios activos y al día
        if (socio.estado === 'activo') {
          ingresosMensuales += socio.montoCuota || 0;
        }
      } else if (estadoMembresia === 'vencido') {
        // Ya contado arriba por estado
      } else if (estadoMembresia === 'pendiente') {
        // Ya contado arriba por estado
      } else {
        // Si no tiene estadoMembresia definido, usar el estado principal
        if (socio.estado === 'activo') {
          alDia++;
          ingresosMensuales += socio.montoCuota || 0;
        }
      }

      // Sumar beneficios usados
      beneficiosUsados += socio.beneficiosUsados || 0;
    });

    const total = socios.length;
    const porcentajeVencidos = total > 0 ? Math.round((vencidos / total) * 100) : 0;

    const calculatedStats = {
      total,
      activos,
      vencidos, // ESTE ES EL CAMPO CLAVE - basado en socio.estado === 'vencido'
      inactivos,
      beneficiosUsados,
      ahorroTotal: 0, // Se calcula desde validaciones
      comerciosVisitados: 0, // Se calcula desde validaciones
      ingresosMensuales,
      alDia,
      pendientes,
      porcentajeVencidos,
      sociosAnalizados: socios.length,
      sociosConEstadoMembresia: socios.filter(s => s.estadoMembresia).length
    };

    console.log('📊 [useSocios] Estadísticas calculadas (basadas en tabla):', {
      total: calculatedStats.total,
      activos: calculatedStats.activos,
      vencidos: calculatedStats.vencidos,
      inactivos: calculatedStats.inactivos,
      porcentajeVencidos: calculatedStats.porcentajeVencidos
    });

    // Log detallado de socios vencidos
    if (vencidos > 0) {
      const sociosVencidos = socios.filter(s => s.estado === 'vencido');
      console.log('🔍 [useSocios] Socios vencidos encontrados (por estado):', sociosVencidos.map(s => ({
        nombre: s.nombre,
        estado: s.estado,
        estadoMembresia: s.estadoMembresia,
        fechaVencimiento: s.fechaVencimiento?.toDate()
      })));
    } else {
      console.log('✅ [useSocios] No hay socios con estado "vencido" detectados');
    }

    return calculatedStats;
  }, [socios]); // bulkUpdateEstado is not used inside; ignore lint false positive

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
      
      console.log('🔄 [useSocios] Datos recargados, estadísticas se calcularán automáticamente');
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

  // Refresh stats (ahora se calculan automáticamente)
  const refreshStats = useCallback(async () => {
    console.log('🔄 [useSocios] refreshStats llamado - las estadísticas se calculan automáticamente desde los datos locales');
    // Las estadísticas se calculan automáticamente en el useMemo
    // No necesitamos hacer nada aquí, pero mantenemos la función para compatibilidad
  }, []);

  // Create new socio
  const createSocio = useCallback(async (data: SocioFormData): Promise<boolean> => {
    if (!asociacionId) return false;

    try {
      setLoading(true);
      setError(null);

      const socioId = await socioService.createSocio(asociacionId, data);
      
      if (socioId) {
        toast.success('Socio creado exitosamente');
        await loadSocios(); // Refresh list (las estadísticas se actualizarán automáticamente)
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
  }, [asociacionId, loadSocios]);

  // Update socio
  const updateSocio = useCallback(async (id: string, data: Partial<SocioFormData>): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await socioService.updateSocio(id, data);
      
      if (success) {
        toast.success('Socio actualizado exitosamente');
        await loadSocios(); // Refresh list (las estadísticas se actualizarán automáticamente)
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
  }, [loadSocios]);

  // Delete socio completely (hard delete) - MEJORADO con eliminación de Firebase Auth
  const deleteSocio = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      console.log(`🗑️ Iniciando eliminación completa del socio: ${id}`);

      // Usar la función mejorada que elimina tanto de Firestore como de Firebase Auth
      const success = await socioService.deleteSocioCompletely(id);
      
      if (success) {
        console.log('✅ Socio eliminado completamente de la base de datos y Firebase Auth');
        toast.success('Socio eliminado completamente. El email ahora puede ser reutilizado.');
        await loadSocios(); // Refresh list (las estadísticas se actualizarán automáticamente)
        return true;
      } else {
        throw new Error('Error al eliminar socio completamente');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar socio';
      setError(errorMessage);
      console.error('❌ Error en eliminación completa:', error);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadSocios]);

  // Bulk update estado
  const bulkUpdateEstado = useCallback(async (socioIds: string[], nuevoEstado: Socio['estado']) => {
    if (!user?.uid || socioIds.length === 0) return { updated: 0, failed: socioIds };
    try {
      setLoading(true);
      setError(null);
      const res = await socioService.bulkUpdateEstado(user.uid, socioIds, nuevoEstado);
      if (res.updated > 0) {
        toast.success(`Estado actualizado para ${res.updated} socio(s)`);
      }
      if (res.failed.length > 0) {
        toast(`${res.failed.length} no se pudieron actualizar`, { icon: '⚠️' });
      }
      await loadSocios();
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error en actualización masiva';
      setError(msg);
      toast.error(msg);
      return { updated: 0, failed: socioIds };
    } finally {
      setLoading(false);
    }
  }, [user?.uid, loadSocios]);

  // Toggle socio status (activate/deactivate)
  const toggleSocioStatus = useCallback(async (id: string, currentStatus: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const newStatus = currentStatus === 'activo' ? 'inactivo' : 'activo';
      const success = await socioService.updateSocio(id, { estado: newStatus });
      
      if (success) {
        toast.success(`Socio ${newStatus === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
        await loadSocios(); // Refresh list (las estadísticas se actualizarán automáticamente)
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
  }, [loadSocios]);

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
        
        await loadSocios(); // Refresh list (las estadísticas se actualizarán automáticamente)
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
  }, [asociacionId, loadSocios]);

  // Register payment
  const registerPayment = useCallback(async (socioId: string, amount: number, months = 1): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await socioService.registerPayment(socioId, amount, months);
      
      if (success) {
        toast.success('Pago registrado exitosamente');
        await loadSocios(); // Refresh list (las estadísticas se actualizarán automáticamente)
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
  }, [loadSocios]);

  // Update membership status
  const updateMembershipStatus = useCallback(async (): Promise<number> => {
    if (!asociacionId) return 0;

    try {
      setLoading(true);
      setError(null);

      const updatedCount = await socioService.updateMembershipStatus(asociacionId);
      
      if (updatedCount > 0) {
        toast.success(`${updatedCount} membresías actualizadas`);
        await loadSocios(); // Refresh list (las estadísticas se actualizarán automáticamente)
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
  }, [asociacionId, loadSocios]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (asociacionId) {
      loadSocios();
    }
  }, [asociacionId, loadSocios]);

  // Reload when filters change
  useEffect(() => {
    if (asociacionId) {
      loadSocios();
    }
  }, [asociacionId, filters, loadSocios]);

  // Log cuando cambien las estadísticas de vencidos
  useEffect(() => {
    if (stats.vencidos > 0) {
      console.log(`⚠️ [useSocios] ${stats.vencidos} socios vencidos detectados en la pestaña Socios`);
    } else {
      console.log('✅ [useSocios] No hay socios vencidos detectados en la pestaña Socios');
    }
  }, [stats.vencidos]);

  return {
    bulkUpdateEstado,
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