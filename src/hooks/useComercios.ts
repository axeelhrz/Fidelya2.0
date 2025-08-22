import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { 
  adhesionService, 
  ComercioDisponible, 
  AdhesionStats, 
  SolicitudAdhesion 
} from '@/services/adhesion.service';
import { comercioService, ComercioFormData, ValidationData } from '@/services/comercio.service';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export const useComercios = () => {
  const { user } = useAuth();
  const [comerciosVinculados, setComerciossVinculados] = useState<ComercioDisponible[]>([]);
  const [comerciosDisponibles, setComerciossDisponibles] = useState<ComercioDisponible[]>([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudAdhesion[]>([]);
  const [stats, setStats] = useState<AdhesionStats>({
    totalComercios: 0,
    comerciosActivos: 0,
    solicitudesPendientes: 0,
    adhesionesEsteMes: 0,
    categorias: {},
    valiacionesHoy: 0,
    validacionesMes: 0,
    clientesUnicos: 0,
    beneficiosActivos: 0,
    validacionesHoy: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const asociacionId = user?.uid;

  // Load comercios vinculados
  const loadComercios = useCallback(async () => {
    if (!asociacionId) return;

    setLoading(true);
    setError('');

    try {
      const [comerciosData, statsData] = await Promise.all([
        adhesionService.getComerciossVinculados(asociacionId),
        adhesionService.getAdhesionStats(asociacionId)
      ]);

      setComerciossVinculados(comerciosData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar comercios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [asociacionId]);

  // Load solicitudes pendientes
  const loadSolicitudesPendientes = useCallback(async () => {
    if (!asociacionId) return;

    try {
      const solicitudes = await adhesionService.getSolicitudesPendientes(asociacionId);
      setSolicitudesPendientes(solicitudes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar solicitudes';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [asociacionId]);

  // Create new comercio
  const createComercio = useCallback(async (data: ComercioFormData): Promise<boolean> => {
    if (!asociacionId) {
      toast.error('No se pudo identificar la asociación');
      return false;
    }

    setLoading(true);
    try {
      const comercioId = await comercioService.createComercio(data, asociacionId);
      
      if (comercioId) {
        toast.success('Comercio creado exitosamente');
        await loadComercios(); // Reload the list
        return true;
      } else {
        toast.error('Error al crear el comercio');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear comercio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [asociacionId, loadComercios]);

  // Update comercio
  const updateComercio = useCallback(async (id: string, data: Partial<ComercioFormData>): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await comercioService.updateComercio(id, data);
      
      if (success) {
        toast.success('Comercio actualizado exitosamente');
        await loadComercios(); // Reload the list
        return true;
      } else {
        toast.error('Error al actualizar el comercio');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar comercio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadComercios]);

  // Delete comercio (complete deletion)
  const deleteComercio = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await comercioService.deleteComercio(id);
      
      if (success) {
        toast.success('Comercio eliminado completamente');
        await loadComercios(); // Reload the list
        return true;
      } else {
        toast.error('Error al eliminar el comercio');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar comercio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadComercios]);

  // Change comercio status
  const changeComercioStatus = useCallback(async (id: string, estado: 'activo' | 'inactivo' | 'suspendido'): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await comercioService.changeComercioStatus(id, estado);
      
      if (success) {
        const statusText = estado === 'activo' ? 'activado' : estado === 'inactivo' ? 'desactivado' : 'suspendido';
        toast.success(`Comercio ${statusText} exitosamente`);
        await loadComercios(); // Reload the list
        return true;
      } else {
        toast.error('Error al cambiar el estado del comercio');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cambiar estado del comercio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadComercios]);

  // Approve solicitud
  const aprobarSolicitud = useCallback(async (solicitudId: string): Promise<boolean> => {
    if (!asociacionId) {
      toast.error('No se pudo identificar la asociación');
      return false;
    }

    setLoading(true);
    try {
      const success = await adhesionService.aprobarSolicitud(solicitudId);
      
      if (success) {
        toast.success('Solicitud aprobada exitosamente');
        await Promise.all([loadComercios(), loadSolicitudesPendientes()]);
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
  }, [asociacionId, loadComercios, loadSolicitudesPendientes]);

  // Reject solicitud
  const rechazarSolicitud = useCallback(async (solicitudId: string, motivo: string): Promise<boolean> => {
    if (!asociacionId) {
      toast.error('No se pudo identificar la asociación');
      return false;
    }

    setLoading(true);
    try {
      const success = await adhesionService.rechazarSolicitud(solicitudId, motivo);
      
      if (success) {
        toast.success('Solicitud rechazada');
        await loadSolicitudesPendientes();
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
  }, [asociacionId, loadSolicitudesPendientes]);

  // Search comercios
  const buscarComercios = useCallback(async (termino: string): Promise<ComercioDisponible[]> => {
    if (!asociacionId) return [];

    try {
      const comercios = await adhesionService.buscarComercios(termino, asociacionId);
      setComerciossDisponibles(comercios);
      return comercios;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al buscar comercios';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, [asociacionId]);

  // Vincular comercio
  const vincularComercio = useCallback(async (comercioId: string): Promise<boolean> => {
    if (!asociacionId) {
      toast.error('No se pudo identificar la asociación');
      return false;
    }

    setLoading(true);
    try {
      // Validate before linking
      const validation = await adhesionService.validarVinculacion(comercioId, asociacionId);
      if (!validation.valido) {
        toast.error(validation.motivo || 'No se puede vincular este comercio');
        return false;
      }

      const success = await adhesionService.vincularComercio(comercioId, asociacionId);
      
      if (success) {
        toast.success('Comercio vinculado exitosamente');
        await loadComercios(); // Reload the list
        return true;
      } else {
        toast.error('Error al vincular el comercio');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al vincular comercio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [asociacionId, loadComercios]);

  // Desvincular comercio
  const desvincularComercio = useCallback(async (comercioId: string): Promise<boolean> => {
    if (!asociacionId) {
      toast.error('No se pudo identificar la asociación');
      return false;
    }

    setLoading(true);
    try {
      const success = await adhesionService.desvincularComercio(comercioId, asociacionId);
      
      if (success) {
        toast.success('Comercio desvinculado exitosamente');
        await loadComercios(); // Reload the list
        return true;
      } else {
        toast.error('Error al desvincular el comercio');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al desvincular comercio';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [asociacionId, loadComercios]);

  // Get comercios disponibles
  const getComerciossDisponibles = useCallback(async (filtros: {
    categoria?: string;
    busqueda?: string;
    soloNoVinculados?: boolean;
  } = {}): Promise<ComercioDisponible[]> => {
    if (!asociacionId) return [];

    try {
      const comercios = await adhesionService.getComerciossDisponibles(asociacionId, filtros);
      setComerciossDisponibles(comercios);
      return comercios;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener comercios disponibles';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, [asociacionId]);

  // Generate QR Code for comercio
  const generateQRCode = useCallback(async (comercioId: string, beneficioId?: string): Promise<string | null> => {
    setLoading(true);
    try {
      const qrCodeDataURL = await comercioService.generateQRCode(comercioId, beneficioId);
      
      if (qrCodeDataURL) {
        toast.success('Código QR generado exitosamente');
        return qrCodeDataURL;
      } else {
        toast.error('Error al generar el código QR');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar código QR';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate batch QR codes
  const generateBatchQRCodes = useCallback(async (comercioIds: string[]): Promise<Array<{
    comercioId: string;
    nombreComercio: string;
    qrCodeDataURL: string;
  }>> => {
    setLoading(true);
    try {
      const results = await comercioService.generateBatchQRCodes(comercioIds);
      
      if (results.length > 0) {
        toast.success(`${results.length} códigos QR generados exitosamente`);
      } else {
        toast.error('No se pudieron generar los códigos QR');
      }
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar códigos QR';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get comercio validations
  const getComercioValidations = useCallback(async (
    comercioId: string,
    filters: {
      fechaDesde?: Date;
      fechaHasta?: Date;
      estado?: string;
      beneficioId?: string;
    } = {},
    pageSize = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData, DocumentData> | null
  ): Promise<{ validaciones: ValidationData[]; hasMore: boolean; lastDoc: QueryDocumentSnapshot<DocumentData, DocumentData> | null }> => {
    try {
      return await comercioService.getValidations(comercioId, filters, pageSize, lastDoc);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener validaciones';
      setError(errorMessage);
      toast.error(errorMessage);
      return { validaciones: [], hasMore: false, lastDoc: null };
    }
  }, []);

  // Get active benefits for comercio
  const getActiveBenefits = useCallback(async (comercioId: string) => {
    try {
      return await comercioService.getActiveBenefits(comercioId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener beneficios activos';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    }
  }, []);

  // Refresh stats
  const refreshStats = useCallback(async () => {
    if (!asociacionId) return;

    try {
      const statsData = await adhesionService.getAdhesionStats(asociacionId);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar estadísticas';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [asociacionId]);

  // Clear error
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Set up real-time listeners
  useEffect(() => {
    if (!asociacionId) return;

    const unsubscribers: (() => void)[] = [];

    // Listen to comercios vinculados changes
    const unsubscribeComercios = adhesionService.onComerciosVinculadosChange(
      asociacionId,
      (comercios) => {
        setComerciossVinculados(comercios);
      }
    );
    unsubscribers.push(unsubscribeComercios);

    // Listen to solicitudes pendientes changes
    const unsubscribeSolicitudes = adhesionService.onSolicitudesPendientesChange(
      asociacionId,
      (solicitudes) => {
        setSolicitudesPendientes(solicitudes);
        // Update stats when solicitudes change
        refreshStats();
      }
    );
    unsubscribers.push(unsubscribeSolicitudes);

    // Load initial data
    loadComercios();
    loadSolicitudesPendientes();

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [asociacionId, loadComercios, loadSolicitudesPendientes, refreshStats]);

  return {
    // Data
    comerciosVinculados,
    comerciosDisponibles,
    solicitudesPendientes,
    stats,
    loading,
    error,
    
    // CRUD Actions
    createComercio,
    updateComercio,
    deleteComercio,
    changeComercioStatus,
    
    // Solicitudes Actions
    aprobarSolicitud,
    rechazarSolicitud,
    
    // Association Actions
    loadComercios,
    loadSolicitudesPendientes,
    buscarComercios,
    vincularComercio,
    desvincularComercio,
    getComerciossDisponibles,
    
    // QR Actions
    generateQRCode,
    generateBatchQRCodes,
    
    // Validation Actions
    getComercioValidations,
    getActiveBenefits,
    
    // Utility Actions
    refreshStats,
    clearError
  };
};