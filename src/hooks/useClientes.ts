'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { ClienteService } from '@/services/cliente.service';
import {
  Cliente,
  ClienteFormData,
  ClienteStats,
  ClienteActivity,
  ClienteFilter,
} from '@/types/cliente';
import toast from 'react-hot-toast';

interface UseClientesReturn {
  // Data
  clientes: Cliente[];
  clienteSeleccionado: Cliente | null;
  stats: ClienteStats | null;
  activities: ClienteActivity[];
  clientesPendientes: Cliente[]; // Clientes pendientes de completar
  loading: boolean;
  loadingStats: boolean;
  loadingActivities: boolean;
  loadingPendientes: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;

  // Actions
  loadClientes: (filtros?: ClienteFilter) => Promise<void>;
  loadMoreClientes: () => Promise<void>;
  loadClientesPendientes: () => Promise<void>;
  selectCliente: (clienteId: string) => Promise<void>;
  createCliente: (clienteData: ClienteFormData) => Promise<string | null>;
  updateCliente: (clienteId: string, clienteData: Partial<ClienteFormData>) => Promise<boolean>;
  completarDatosCliente: (clienteId: string, datosCompletos: Partial<ClienteFormData>) => Promise<boolean>;
  deleteCliente: (clienteId: string) => Promise<boolean>;
  updateEstadoCliente: (clienteId: string, estado: 'activo' | 'inactivo' | 'suspendido') => Promise<boolean>;
  uploadClienteImage: (clienteId: string, file: File) => Promise<string | null>;
  searchClientes: (searchTerm: string) => Promise<Cliente[]>;
  exportData: () => Promise<void>;
  refreshStats: () => Promise<void>;
  loadClienteActivities: (clienteId: string) => Promise<void>;
  updateClienteCompra: (clienteId: string, montoCompra: number, beneficioUsado?: boolean) => Promise<boolean>;

  // Filters
  filtros: ClienteFilter;
  setFiltros: (filtros: ClienteFilter) => void;
  clearFiltros: () => void;
}

export const useClientes = (): UseClientesReturn => {
  const { user } = useAuth();
  
  // Estados principales
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [stats, setStats] = useState<ClienteStats | null>(null);
  const [activities, setActivities] = useState<ClienteActivity[]>([]);
  const [clientesPendientes, setClientesPendientes] = useState<Cliente[]>([]);
  
  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingPendientes, setLoadingPendientes] = useState(false);
  
  // Estados de control
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  
  // Filtros
  const [filtros, setFiltros] = useState<ClienteFilter>({
    ordenarPor: 'fechaCreacion',
    orden: 'desc',
    limite: 20,
  });

  // Memoizar comercioId
  const comercioId = useMemo(() => {
    return user?.role === 'comercio' ? user.uid : null;
  }, [user]);

  /**
   * Refrescar estadísticas
   */
  const refreshStats = useCallback(async () => {
    if (!comercioId) return;

    try {
      console.log('🔄 Refrescando estadísticas de socios...');
      setLoadingStats(true);
      const newStats = await ClienteService.getClienteStats(comercioId);
      setStats(newStats);
      console.log('✅ Estadísticas de socios actualizadas:', newStats);
    } catch (error) {
      console.error('❌ Error refreshing stats:', error);
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoadingStats(false);
    }
  }, [comercioId]);

  /**
   * Cargar clientes con filtros
   */
  const loadClientes = useCallback(async (nuevosFiltros?: ClienteFilter) => {
    if (!comercioId) {
      console.log('❌ No hay comercioId disponible');
      return;
    }

    try {
      console.log('🔄 Cargando lista de socios para comercio:', comercioId);
      setLoading(true);
      setError(null);

      const filtrosAplicar = nuevosFiltros || filtros;
      console.log('🔍 Filtros que se aplicarán:', filtrosAplicar);
      
      const resultado = await ClienteService.getClientesByComercio(comercioId, filtrosAplicar);

      console.log('📊 Resultado de la consulta:', {
        clientesEncontrados: resultado.clientes.length,
        total: resultado.total,
        hasMore: resultado.hasMore
      });

      setClientes(resultado.clientes);
      setTotal(resultado.total);
      setHasMore(resultado.hasMore);
      
      console.log('✅ Socios cargados exitosamente:', resultado.clientes.length, 'de', resultado.total);
      
      // Log de los primeros socios para debugging
      if (resultado.clientes.length > 0) {
        console.log('🔍 Primeros socios cargados:', resultado.clientes.slice(0, 3).map(c => ({
          id: c.id,
          nombre: c.nombre,
          email: c.email,
          estado: c.estado
        })));
      }
      
    } catch (error) {
      console.error('❌ Error loading clientes:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar socios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [comercioId, filtros]);

  /**
   * Cargar más clientes (paginación)
   */
  const loadMoreClientes = useCallback(async () => {
    if (!comercioId || !hasMore || loading) return;

    try {
      setLoading(true);
      
      const filtrosConOffset = {
        ...filtros,
        offset: clientes.length,
      };

      const resultado = await ClienteService.getClientesByComercio(comercioId, filtrosConOffset);
      
      setClientes(prev => [...prev, ...resultado.clientes]);
      setHasMore(resultado.hasMore);
    } catch (error) {
      console.error('Error loading more clientes:', error);
      toast.error('Error al cargar más socios');
    } finally {
      setLoading(false);
    }
  }, [comercioId, filtros, clientes.length, hasMore, loading]);

  /**
   * Cargar clientes pendientes de completar datos
   */
  const loadClientesPendientes = useCallback(async () => {
    if (!comercioId) return;

    try {
      setLoadingPendientes(true);
      const pendientes = await ClienteService.getClientesPendientesCompletar(comercioId);
      setClientesPendientes(pendientes);
    } catch (error) {
      console.error('Error loading clientes pendientes:', error);
      setClientesPendientes([]);
    } finally {
      setLoadingPendientes(false);
    }
  }, [comercioId]);

  /**
   * Cargar actividades del cliente
   */
  const loadClienteActivities = useCallback(async (clienteId: string) => {
    try {
      setLoadingActivities(true);
      const clienteActivities = await ClienteService.getClienteActivities(clienteId);
      setActivities(clienteActivities);
    } catch (error) {
      console.error('Error loading cliente activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  }, []);

  /**
   * Seleccionar cliente y cargar detalles
   */
  const selectCliente = useCallback(async (clienteId: string) => {
    try {
      setLoading(true);
      const cliente = await ClienteService.getClienteById(clienteId);
      setClienteSeleccionado(cliente);
      
      if (cliente) {
        // Cargar actividades del cliente
        await loadClienteActivities(clienteId);
        // Actualizar último acceso
        await ClienteService.updateUltimoAcceso(clienteId);
      }
    } catch (error) {
      console.error('Error selecting cliente:', error);
      toast.error('Error al cargar detalles del socio');
    } finally {
      setLoading(false);
    }
  }, [loadClienteActivities]);

  /**
   * Crear nuevo cliente
   */
  const createCliente = useCallback(async (clienteData: ClienteFormData): Promise<string | null> => {
    if (!comercioId) {
      toast.error('No autorizado');
      return null;
    }

    try {
      console.log('🚀 Creando nuevo socio...');
      setLoading(true);
      
      const clienteId = await ClienteService.createCliente(comercioId, clienteData);
      console.log('📝 Socio creado con ID:', clienteId);
      
      if (clienteId) {
        toast.success('Socio creado exitosamente');
        
        console.log('🔄 Actualizando datos después de crear socio...');
        
        // CRÍTICO: Recargar datos en secuencia para asegurar consistencia
        await loadClientes();
        console.log('✅ Lista de socios recargada');
        
        await refreshStats();
        console.log('✅ Estadísticas actualizadas');
        
        return clienteId;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error creating cliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear socio';
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [comercioId, loadClientes, refreshStats]);

  /**
   * Actualizar cliente
   */
  const updateCliente = useCallback(async (
    clienteId: string, 
    clienteData: Partial<ClienteFormData>
  ): Promise<boolean> => {
    try {
      console.log('🔄 Actualizando socio:', clienteId);
      setLoading(true);
      
      await ClienteService.updateCliente(clienteId, clienteData);
      toast.success('Socio actualizado exitosamente');
      
      // Actualizar cliente seleccionado si es el mismo
      if (clienteSeleccionado?.id === clienteId) {
        const clienteActualizado = await ClienteService.getClienteById(clienteId);
        setClienteSeleccionado(clienteActualizado);
      }
      
      // CRÍTICO: Recargar datos
      await loadClientes();
      await refreshStats();
      
      // Recargar pendientes si el cliente estaba en esa lista
      if (clientesPendientes.some(c => c.id === clienteId)) {
        await loadClientesPendientes();
      }
      
      console.log('✅ Socio actualizado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error updating cliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar socio';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [clienteSeleccionado, loadClientes, refreshStats, clientesPendientes, loadClientesPendientes]);

  /**
   * Completar datos de cliente creado automáticamente
   */
  const completarDatosCliente = useCallback(async (
    clienteId: string,
    datosCompletos: Partial<ClienteFormData>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      await ClienteService.completarDatosCliente(clienteId, datosCompletos);
      
      toast.success('Datos del socio completados exitosamente');
      
      // Actualizar cliente seleccionado si es el mismo
      if (clienteSeleccionado?.id === clienteId) {
        const clienteActualizado = await ClienteService.getClienteById(clienteId);
        setClienteSeleccionado(clienteActualizado);
      }
      
      // Recargar listas
      await loadClientes();
      await loadClientesPendientes();
      await refreshStats();
      
      return true;
    } catch (error) {
      console.error('Error completing cliente data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al completar datos del socio';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [clienteSeleccionado, loadClientes, loadClientesPendientes, refreshStats]);

  /**
   * Eliminar cliente
   */
  const deleteCliente = useCallback(async (clienteId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Eliminando socio:', clienteId);
      setLoading(true);
      
      await ClienteService.deleteCliente(clienteId);
      toast.success('Socio eliminado exitosamente');
      
      // Limpiar selección si era el cliente eliminado
      if (clienteSeleccionado?.id === clienteId) {
        setClienteSeleccionado(null);
      }
      
      // CRÍTICO: Recargar datos
      await loadClientes();
      await loadClientesPendientes();
      await refreshStats();
      
      console.log('✅ Socio eliminado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error deleting cliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar socio';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [clienteSeleccionado, loadClientes, loadClientesPendientes, refreshStats]);

  /**
   * Actualizar estado del cliente
   */
  const updateEstadoCliente = useCallback(async (
    clienteId: string, 
    estado: 'activo' | 'inactivo' | 'suspendido'
  ): Promise<boolean> => {
    try {
      console.log('🔄 Cambiando estado del socio:', clienteId, 'a', estado);
      
      await ClienteService.updateEstadoCliente(clienteId, estado);
      toast.success(`Socio ${estado} exitosamente`);
      
      // Actualizar cliente seleccionado si es el mismo
      if (clienteSeleccionado?.id === clienteId) {
        setClienteSeleccionado(prev => prev ? { ...prev, estado } : null);
      }
      
      // CRÍTICO: Actualizar en la lista local inmediatamente
      setClientes(prev => prev.map(cliente => 
        cliente.id === clienteId ? { ...cliente, estado } : cliente
      ));
      
      // Actualizar en pendientes si está ahí
      setClientesPendientes(prev => prev.map(cliente => 
        cliente.id === clienteId ? { ...cliente, estado } : cliente
      ));
      
      // Actualizar estadísticas
      await refreshStats();
      
      console.log('✅ Estado del socio actualizado');
      return true;
    } catch (error) {
      console.error('❌ Error updating cliente estado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar estado';
      toast.error(errorMessage);
      return false;
    }
  }, [clienteSeleccionado, refreshStats]);

  /**
   * Subir imagen del cliente
   */
  const uploadClienteImage = useCallback(async (clienteId: string, file: File): Promise<string | null> => {
    try {
      const imageUrl = await ClienteService.uploadClienteImage(clienteId, file);
      
      toast.success('Imagen actualizada exitosamente');
      
      // Actualizar cliente seleccionado si es el mismo
      if (clienteSeleccionado?.id === clienteId) {
        setClienteSeleccionado(prev => prev ? { ...prev, avatar: imageUrl } : null);
      }
      
      // Actualizar en la lista
      setClientes(prev => prev.map(cliente => 
        cliente.id === clienteId ? { ...cliente, avatar: imageUrl } : cliente
      ));
      
      // Actualizar en pendientes si está ahí
      setClientesPendientes(prev => prev.map(cliente => 
        cliente.id === clienteId ? { ...cliente, avatar: imageUrl } : cliente
      ));
      
      return imageUrl;
    } catch (error) {
      console.error('Error uploading cliente image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir imagen';
      toast.error(errorMessage);
      return null;
    }
  }, [clienteSeleccionado]);

  /**
   * Buscar clientes
   */
  const searchClientes = useCallback(async (searchTerm: string): Promise<Cliente[]> => {
    if (!comercioId) return [];

    try {
      const resultados = await ClienteService.searchClientes(comercioId, searchTerm);
      return resultados;
    } catch (error) {
      console.error('Error searching clientes:', error);
      toast.error('Error en la búsqueda');
      return [];
    }
  }, [comercioId]);

  /**
   * Exportar datos en formato CSV
   */
  const exportData = useCallback(async () => {
    if (!comercioId) return;

    try {
      const exportDataResult = await ClienteService.exportClientesData(comercioId);
      
      // Convertir clientes a CSV
      const csvContent = convertClientesToCSV(exportDataResult.clientes);
      
      // Crear y descargar archivo CSV
      const blob = new Blob([csvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `socios-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Datos exportados exitosamente en formato CSV');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar datos');
    }
  }, [comercioId]);

  /**
   * Convertir clientes a CSV
   */
  const convertClientesToCSV = (clientes: Cliente[]): string => {
    if (clientes.length === 0) return '';

    // Definir encabezados
    const headers = [
      'Nombre',
      'Email',
      'Teléfono',
      'DNI',
      'Dirección',
      'Estado',
      'Fecha de Alta',
      'Total Compras',
      'Monto Total Gastado',
      'Promedio Compra',
      'Beneficios Usados',
      'Validaciones',
      'Última Visita'
    ];

    // Convertir datos a filas CSV
    const rows = clientes.map(cliente => [
      `"${cliente.nombre.replace(/"/g, '""')}"`,
      `"${cliente.email.replace(/"/g, '""')}"`,
      `"${(cliente.telefono || '').replace(/"/g, '""')}"`,
      `"${(cliente.dni || '').replace(/"/g, '""')}"`,
      `"${(cliente.direccion || '').replace(/"/g, '""')}"`,
      cliente.estado,
      cliente.creadoEn.toDate().toLocaleDateString('es-ES'),
      cliente.totalCompras,
      cliente.montoTotalGastado.toFixed(2),
      cliente.promedioCompra.toFixed(2),
      cliente.beneficiosUsados,
      cliente.totalValidaciones || 0,
      cliente.fechaUltimaVisita ? cliente.fechaUltimaVisita.toDate().toLocaleDateString('es-ES') : 'N/A'
    ]);

    // Combinar encabezados y filas
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  };

  /**
   * Actualizar compra del cliente
   */
  const updateClienteCompra = useCallback(async (
    clienteId: string, 
    montoCompra: number, 
    beneficioUsado?: boolean
  ): Promise<boolean> => {
    try {
      await ClienteService.updateClienteCompra(clienteId, montoCompra, beneficioUsado);
      
      toast.success('Compra registrada exitosamente');
      
      // Actualizar cliente seleccionado si es el mismo
      if (clienteSeleccionado?.id === clienteId) {
        await selectCliente(clienteId);
      }
      
      // Refrescar estadísticas
      await refreshStats();
      
      return true;
    } catch (error) {
      console.error('Error updating cliente compra:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar compra';
      toast.error(errorMessage);
      return false;
    }
  }, [clienteSeleccionado, selectCliente, refreshStats]);

  /**
   * Limpiar filtros
   */
  const clearFiltros = useCallback(() => {
    console.log('🧹 Limpiando filtros...');
    const filtrosLimpios = {
      ordenarPor: 'fechaCreacion' as const,
      orden: 'desc' as const,
      limite: 20,
    };
    setFiltros(filtrosLimpios);
    console.log('✅ Filtros limpiados:', filtrosLimpios);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (comercioId) {
      console.log('🚀 Cargando datos iniciales de socios para comercio:', comercioId);
      loadClientes();
      refreshStats();
      loadClientesPendientes();
    } else {
      console.log('⚠️ No hay comercioId disponible para cargar datos');
    }
  }, [comercioId, loadClientes, refreshStats, loadClientesPendientes]);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (comercioId) {
      console.log('🔄 Filtros cambiaron, recargando clientes...');
      loadClientes(filtros);
    }
  }, [filtros, comercioId, loadClientes]);

  return {
    // Data
    clientes,
    clienteSeleccionado,
    stats,
    activities,
    clientesPendientes,
    loading,
    loadingStats,
    loadingActivities,
    loadingPendientes,
    error,
    hasMore,
    total,

    // Actions
    loadClientes,
    loadMoreClientes,
    loadClientesPendientes,
    selectCliente,
    createCliente,
    updateCliente,
    completarDatosCliente,
    deleteCliente,
    updateEstadoCliente,
    uploadClienteImage,
    searchClientes,
    exportData,
    refreshStats,
    loadClienteActivities,
    updateClienteCompra,

    // Filters
    filtros,
    setFiltros,
    clearFiltros,
  };
};