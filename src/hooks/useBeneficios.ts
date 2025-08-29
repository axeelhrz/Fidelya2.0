'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Unsubscribe } from 'firebase/firestore';
import { BeneficiosService } from '@/services/beneficios.service';
import { 
  Beneficio, 
  BeneficioUso, 
  BeneficioStats, 
  BeneficioFormData, 
  BeneficioFilter 
} from '@/types/beneficio';
import { useAuth } from './useAuth';
import { optimizedNotifications } from '@/lib/optimized-notifications';

interface UseBeneficiosOptions {
  autoLoad?: boolean;
  useRealtime?: boolean;
  cacheEnabled?: boolean;
}

export const useBeneficios = (options: UseBeneficiosOptions = {}) => {
  const { 
    autoLoad = true, 
    useRealtime = false, 
  } = options;

  const { user } = useAuth();
  
  // Estados principales con referencias estables
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [beneficiosUsados, setBeneficiosUsados] = useState<BeneficioUso[]>([]);
  const [stats, setStats] = useState<BeneficioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Referencias para optimización
  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  const mountedRef = useRef(true);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Cargar beneficios con cache y optimizaciones - CON LOGS DETALLADOS
  const cargarBeneficios = useCallback(async (filtros?: BeneficioFilter) => {
    console.log('🚀 INICIANDO cargarBeneficios', { 
      user: user ? { uid: user.uid, role: user.role, asociacionId: user.asociacionId } : null, 
      loading, 
      filtros 
    });

    if (!user) {
      console.log('❌ No hay usuario, no se pueden cargar beneficios');
      return;
    }

    if (loading) {
      console.log('⏳ Ya está cargando, saltando...');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Estado de loading establecido a true');

      let beneficiosData: Beneficio[] = [];

      console.log('👤 Usuario actual:', {
        uid: user.uid,
        role: user.role,
        asociacionId: user.asociacionId,
        email: user.email
      });

      switch (user.role) {
        case 'socio':
          console.log('🏃‍♂️ Procesando como SOCIO');
          if (user.asociacionId) {
            console.log('🏢 Socio CON asociación:', user.asociacionId);
            beneficiosData = await BeneficiosService.obtenerBeneficiosDisponibles(
              user.uid,
              user.asociacionId,
              filtros
            );
          } else {
            console.log('👤 Socio SIN asociación');
            beneficiosData = await BeneficiosService.obtenerBeneficiosDisponibles(
              user.uid,
              undefined,
              filtros
            );
          }
          break;

        case 'comercio':
          console.log('🏪 Procesando como COMERCIO');
          beneficiosData = await BeneficiosService.obtenerBeneficiosPorComercio(user.uid);
          break;

        case 'asociacion':
          console.log('🏛️ Procesando como ASOCIACION');
          beneficiosData = await BeneficiosService.obtenerBeneficiosPorAsociacion(user.uid);
          break;

        default:
          console.warn('⚠️ Rol de usuario no reconocido:', user.role);
      }

      console.log('📦 Beneficios RAW obtenidos del servicio:', {
        cantidad: beneficiosData.length,
        beneficios: beneficiosData.map(b => ({
          id: b.id,
          titulo: b.titulo,
          estado: b.estado,
          fechaInicio: b.fechaInicio?.toDate?.() || b.fechaInicio,
          fechaFin: b.fechaFin?.toDate?.() || b.fechaFin,
          comercioNombre: b.comercioNombre
        }))
      });
      
      // Actualización directa sin debounce
      if (mountedRef.current) {
        console.log('✅ Componente montado, estableciendo beneficios:', beneficiosData.length);
        setBeneficios(beneficiosData);
        console.log(`✅ Se cargaron ${beneficiosData.length} beneficios RAW para ${user.role}`);
      } else {
        console.log('❌ Componente desmontado, no se establecen beneficios');
      }
    } catch (err) {
      console.error('❌ ERROR cargando beneficios:', err);
      if (mountedRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Error al cargar beneficios';
        setError(errorMessage);
        optimizedNotifications.error(errorMessage);
      }
    } finally {
      if (mountedRef.current) {
        console.log('🏁 Finalizando carga, estableciendo loading a false');
        setLoading(false);
      }
    }
  }, [user, loading]);

  // Cargar historial de usos optimizado - SIN DEBOUNCE
  const cargarHistorialUsos = useCallback(async () => {
    if (!user || user.role !== 'socio') return;

    try {
      console.log('📚 Cargando historial de usos para socio:', user.uid);
      const usos = await BeneficiosService.obtenerHistorialUsos(user.uid);
      if (mountedRef.current) {
        setBeneficiosUsados(usos);
        console.log(`✅ Se cargaron ${usos.length} usos del historial`);
      }
    } catch (err) {
      console.error('Error cargando historial de usos:', err);
      if (mountedRef.current) {
        optimizedNotifications.error('Error al cargar el historial de beneficios');
      }
    }
  }, [user]);

  // NUEVO: Función específica para refrescar el historial después de una validación
  const refrescarHistorialDespuesValidacion = useCallback(async () => {
    if (!user || user.role !== 'socio') return;

    try {
      console.log('🔄 Refrescando historial después de validación QR...');
      
      // Esperar un poco para que se procese la validación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const usos = await BeneficiosService.obtenerHistorialUsos(user.uid);
      if (mountedRef.current) {
        setBeneficiosUsados(usos);
        console.log(`✅ Historial actualizado: ${usos.length} usos totales`);
        
        // También actualizar estadísticas
        await cargarEstadisticas();
      }
    } catch (err) {
      console.error('Error refrescando historial después de validación:', err);
    }
  }, [user]);

  // Cargar estadísticas optimizado - SIN DEBOUNCE
  const cargarEstadisticas = useCallback(async () => {
    if (!user) return;

    try {
      const filtros: { comercioId?: string; asociacionId?: string; socioId?: string } = {};
      
      if (user.role === 'comercio') {
        filtros.comercioId = user.uid;
      } else if (user.role === 'asociacion') {
        filtros.asociacionId = user.uid;
      } else if (user.role === 'socio' && user.asociacionId) {
        filtros.socioId = user.uid;
        filtros.asociacionId = user.asociacionId;
      }

      console.log('📊 Cargando estadísticas con filtros:', filtros);
      const estadisticas = await BeneficiosService.obtenerEstadisticas(filtros);
      if (mountedRef.current) {
        setStats(estadisticas);
        console.log('✅ Estadísticas cargadas:', estadisticas);
      }
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    }
  }, [user]);

  // Configurar listener en tiempo real optimizado - SIN DEBOUNCE
  const configurarRealtime = useCallback(() => {
    if (!user || !useRealtime) return;

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    switch (user.role) {
      case 'socio':
        if (user.asociacionId) {
          console.log('🔄 Configurando listener en tiempo real para socio');
          unsubscribeRef.current = BeneficiosService.suscribirBeneficiosDisponibles(
            user.uid,
            user.asociacionId,
            (beneficiosData) => {
              if (mountedRef.current) {
                setBeneficios(beneficiosData);
                console.log(`🔄 Beneficios actualizados en tiempo real: ${beneficiosData.length}`);
              }
            }
          );
        }
        break;

      case 'comercio':
        unsubscribeRef.current = BeneficiosService.suscribirBeneficiosComercio(
          user.uid,
          (beneficiosData) => {
            if (mountedRef.current) {
              setBeneficios(beneficiosData);
            }
          }
        );
        break;
    }
  }, [user, useRealtime]);

  // Efecto principal optimizado
  useEffect(() => {
    console.log('🎯 useEffect principal ejecutándose', { autoLoad, user: !!user, useRealtime });
    
    if (autoLoad && user) {
      if (useRealtime) {
        console.log('📡 Configurando tiempo real');
        configurarRealtime();
      } else {
        console.log('📥 Cargando beneficios normalmente');
        cargarBeneficios();
      }
      
      if (user.role === 'socio') {
        console.log('👤 Cargando historial para socio');
        cargarHistorialUsos();
      }
      
      console.log('📊 Cargando estadísticas');
      cargarEstadisticas();
    }
  }, [user, autoLoad, useRealtime, cargarBeneficios, cargarHistorialUsos, cargarEstadisticas, configurarRealtime]);

  // Datos derivados memoizados para evitar recálculos - APLICAR FILTROS AQUÍ
  const beneficiosActivos = useMemo(() => {
    console.log('🔍 Calculando beneficiosActivos desde', beneficios.length, 'beneficios RAW');
    console.log('📋 Beneficios RAW antes de filtrar:', beneficios.map(b => ({
      id: b.id,
      titulo: b.titulo,
      estado: b.estado,
      fechaInicio: b.fechaInicio?.toDate?.() || b.fechaInicio,
      fechaFin: b.fechaFin?.toDate?.() || b.fechaFin
    })));
    
    const beneficiosValidos = BeneficiosService.aplicarFiltrosBasicos(beneficios);
    console.log('🔍 Resultado: ', beneficiosValidos.length, 'beneficios activos válidos');
    console.log('✅ Beneficios válidos después de filtrar:', beneficiosValidos.map(b => ({
      id: b.id,
      titulo: b.titulo,
      estado: b.estado
    })));
    
    return beneficiosValidos;
  }, [beneficios]);

  const beneficiosInactivos = useMemo(() => 
    beneficios.filter(b => b.estado === 'inactivo'), 
    [beneficios]
  );

  const beneficiosVencidos = useMemo(() => {
    const now = new Date();
    return beneficios.filter(b => {
      if (b.estado === 'vencido') return true;
      // También incluir beneficios que técnicamente están vencidos pero aún marcados como activos
      try {
        let fechaFin: Date | null = null;
        if (b.fechaFin) {
          if (typeof b.fechaFin === 'object' && typeof b.fechaFin.toDate === 'function') {
            fechaFin = b.fechaFin.toDate();
          } else if (typeof b.fechaFin === 'string' || typeof b.fechaFin === 'number') {
            fechaFin = new Date(b.fechaFin);
          } else if (b.fechaFin instanceof Date) {
            fechaFin = b.fechaFin;
          }
        }
        return fechaFin && fechaFin <= now;
      } catch {
        return false;
      }
    });
  }, [beneficios]);

  const beneficiosAgotados = useMemo(() => {
    return beneficios.filter(b => {
      if (b.estado === 'agotado') return true;
      // También incluir beneficios que técnicamente están agotados pero aún marcados como activos
      return b.limiteTotal && b.usosActuales >= b.limiteTotal;
    });
  }, [beneficios]);

  const beneficiosDestacados = useMemo(() => 
    beneficiosActivos.filter(b => b.destacado), 
    [beneficiosActivos]
  );

  // Estadísticas rápidas memoizadas y estables - CORREGIDO CÁLCULO MENSUAL
  const estadisticasRapidas = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    console.log('🔍 Calculando estadísticas rápidas:', {
      beneficiosUsados: beneficiosUsados.length,
      fechaActual: now.toLocaleDateString(),
      mesActual: currentMonth,
      añoActual: currentYear
    });

    // Calcular ahorro del mes actual con manejo robusto de fechas
    const ahorroEsteMes = beneficiosUsados
      .filter(uso => {
        try {
          let fecha: Date;
          
          if (!uso.fechaUso) {
            return false;
          }
          
          // Verificar si es un Timestamp de Firebase
          if (typeof uso.fechaUso === 'object' && uso.fechaUso !== null && 'toDate' in uso.fechaUso && typeof uso.fechaUso.toDate === 'function') {
            fecha = uso.fechaUso.toDate();
          } 
          // Verificar si ya es un Date usando duck typing
          else if (typeof uso.fechaUso === 'object' && uso.fechaUso !== null && 'getTime' in uso.fechaUso && typeof uso.fechaUso.getTime === 'function') {
            fecha = uso.fechaUso as unknown as Date;
          } 
          // Es un string, número o algo que se puede convertir a Date
          else {
            fecha = new Date(uso.fechaUso as unknown as string | number);
            // Verificar que la fecha sea válida
            if (isNaN(fecha.getTime())) {
              return false;
            }
          }
          
          const esDelMesActual = fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
          
          if (esDelMesActual) {
            console.log('✅ Beneficio del mes actual:', {
              fecha: fecha.toLocaleDateString(),
              titulo: uso.beneficioTitulo,
              monto: uso.montoDescuento
            });
          }
          
          return esDelMesActual;
        } catch (error) {
          console.error('Error procesando fecha de uso:', error, uso);
          return false;
        }
      })
      .reduce((total, uso) => total + (uso.montoDescuento || 0), 0);

    // Calcular beneficios usados este mes (cantidad, no monto)
    const beneficiosUsadosEsteMes = beneficiosUsados.filter(uso => {
      try {
        let fecha: Date;
        
        if (!uso.fechaUso) {
          return false;
        }
        
        if (typeof uso.fechaUso === 'object' && uso.fechaUso !== null && 'toDate' in uso.fechaUso && typeof uso.fechaUso.toDate === 'function') {
          fecha = uso.fechaUso.toDate();
        } else if (typeof uso.fechaUso === 'object' && uso.fechaUso !== null && 'getTime' in uso.fechaUso && typeof uso.fechaUso.getTime === 'function') {
          fecha = uso.fechaUso as unknown as Date;
        } else {
          fecha = new Date(uso.fechaUso as unknown as string | number);
          if (isNaN(fecha.getTime())) {
            return false;
          }
        }
        
        return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
      } catch {
        return false;
      }
    }).length;

    const estadisticas = {
      total: beneficiosActivos.length,
      disponibles: beneficiosActivos.length, // Beneficios disponibles para usar
      activos: beneficiosActivos.length,
      usados: beneficiosUsados.length, // Beneficios que ya ha usado el socio
      usadosEsteMes: beneficiosUsadosEsteMes, // NUEVO: Cantidad de beneficios usados este mes
      ahorroTotal: beneficiosUsados.reduce((total, uso) => total + (uso.montoDescuento || 0), 0),
      ahorroEsteMes
    };

    console.log('📊 Estadísticas calculadas:', estadisticas);

    return estadisticas;
  }, [beneficiosActivos.length, beneficiosUsados]);

  // Funciones de acción optimizadas
  const crearBeneficio = useCallback(async (data: BeneficioFormData): Promise<boolean> => {
    if (!user || (user.role !== 'comercio' && user.role !== 'asociacion')) {
      optimizedNotifications.error('No tienes permisos para crear beneficios');
      return false;
    }

    try {
      setLoading(true);
      
      await BeneficiosService.crearBeneficio(data, user.uid, user.role);
      optimizedNotifications.success('Beneficio creado exitosamente');
      
      if (!useRealtime) {
        await cargarBeneficios();
      }
      await cargarEstadisticas();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear beneficio';
      optimizedNotifications.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarEstadisticas, useRealtime]);

  const actualizarBeneficio = useCallback(async (id: string, data: Partial<BeneficioFormData>): Promise<boolean> => {
    if (!user || (user.role !== 'comercio' && user.role !== 'asociacion')) {
      optimizedNotifications.error('No tienes permisos para actualizar beneficios');
      return false;
    }

    try {
      setLoading(true);
      await BeneficiosService.actualizarBeneficio(id, data);
      
      optimizedNotifications.success('Beneficio actualizado exitosamente');
      
      if (!useRealtime) {
        await cargarBeneficios();
      }
      await cargarEstadisticas();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar beneficio';
      optimizedNotifications.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarEstadisticas, useRealtime]);

  const eliminarBeneficio = useCallback(async (id: string): Promise<boolean> => {
    if (!user || (user.role !== 'comercio' && user.role !== 'asociacion')) {
      optimizedNotifications.error('No tienes permisos para eliminar beneficios');
      return false;
    }

    try {
      setLoading(true);
      await BeneficiosService.eliminarBeneficio(id);
      
      optimizedNotifications.success('Beneficio eliminado exitosamente');
      
      if (!useRealtime) {
        await cargarBeneficios();
      }
      await cargarEstadisticas();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar beneficio';
      optimizedNotifications.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarEstadisticas, useRealtime]);

  const cambiarEstadoBeneficio = useCallback(async (
    id: string, 
    estado: 'activo' | 'inactivo' | 'vencido' | 'agotado'
  ): Promise<boolean> => {
    if (!user || (user.role !== 'comercio' && user.role !== 'asociacion')) {
      optimizedNotifications.error('No tienes permisos para cambiar el estado del beneficio');
      return false;
    }

    try {
      setLoading(true);
      await BeneficiosService.actualizarEstadoBeneficio(id, estado);
      
      const estadoTexto = {
        'activo': 'activado',
        'inactivo': 'desactivado',
        'vencido': 'marcado como vencido',
        'agotado': 'marcado como agotado'
      }[estado];
      
      optimizedNotifications.success(`Beneficio ${estadoTexto} exitosamente`);
      
      if (!useRealtime) {
        await cargarBeneficios();
      }
      await cargarEstadisticas();
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cambiar estado del beneficio';
      optimizedNotifications.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarEstadisticas, useRealtime]);

  const usarBeneficio = useCallback(async (
    beneficioId: string, 
    comercioId: string,
    montoOriginal?: number
  ): Promise<boolean> => {
    if (!user || user.role !== 'socio') {
      optimizedNotifications.error('Solo los socios pueden usar beneficios');
      return false;
    }

    if (!user.asociacionId) {
      optimizedNotifications.error('Debes estar asociado a una asociación para usar beneficios');
      return false;
    }

    try {
      setLoading(true);
      
      const socioData = {
        nombre: user.nombre || user.email || 'Usuario',
        email: user.email || ''
      };

      await BeneficiosService.usarBeneficio(
        beneficioId,
        user.uid,
        socioData,
        comercioId,
        user.asociacionId,
        montoOriginal
      );
      
      optimizedNotifications.success('¡Beneficio usado exitosamente!');
      
      await Promise.all([
        cargarHistorialUsos(),
        cargarEstadisticas(),
        !useRealtime && cargarBeneficios()
      ].filter(Boolean));
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al usar beneficio';
      optimizedNotifications.error(message);
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarHistorialUsos, cargarEstadisticas, useRealtime]);

  const buscarBeneficios = useCallback(async (
    termino: string, 
    filtros?: BeneficioFilter
  ): Promise<Beneficio[]> => {
    try {
      const resultados = await BeneficiosService.buscarBeneficios(termino, filtros);
      return resultados;
    } catch (err) {
      console.error('Error en búsqueda:', err);
      optimizedNotifications.error('Error al buscar beneficios');
      return [];
    }
  }, []);

  const refrescar = useCallback(async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      setError(null);
      console.log('🔄 REFRESCANDO datos...');
      
      await Promise.all([
        cargarBeneficios(),
        user?.role === 'socio' && cargarHistorialUsos(),
        cargarEstadisticas()
      ].filter(Boolean));
      
      optimizedNotifications.success('Datos actualizados');
    } catch (err) {
      console.error('Error al refrescar:', err);
      optimizedNotifications.error('Error al actualizar datos');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, cargarBeneficios, cargarHistorialUsos, cargarEstadisticas, user]);

  const filtrarBeneficios = useCallback(async (filtros: BeneficioFilter) => {
    await cargarBeneficios(filtros);
  }, [cargarBeneficios]);

  return {
    // Estados
    beneficios: beneficiosActivos, // CAMBIO IMPORTANTE: Devolver beneficios ya filtrados
    beneficiosUsados,
    stats,
    loading,
    error,
    refreshing,

    // Datos derivados memoizados
    beneficiosActivos,
    beneficiosInactivos,
    beneficiosVencidos,
    beneficiosAgotados,
    beneficiosDestacados,
    estadisticasRapidas,

    // Acciones
    crearBeneficio,
    actualizarBeneficio,
    eliminarBeneficio,
    cambiarEstadoBeneficio,
    usarBeneficio,
    buscarBeneficios,
    filtrarBeneficios,
    refrescar,

    // Funciones de carga manual
    cargarBeneficios,
    cargarHistorialUsos,
    cargarEstadisticas,
    
    // NUEVO: Función específica para refrescar después de validación QR
    refrescarHistorialDespuesValidacion
  };
};

// Hook especializado para socios optimizado
export const useBeneficiosSocio = () => {
  return useBeneficios({
    autoLoad: true,
    useRealtime: true,
    cacheEnabled: true
  });
};

// Hook especializado para comercios optimizado
export const useBeneficiosComercios = () => {
  return useBeneficios({
    autoLoad: true,
    useRealtime: true,
    cacheEnabled: false
  });
};

// Hook especializado para asociaciones optimizado
export const useBeneficiosAsociacion = () => {
  return useBeneficios({
    autoLoad: true,
    useRealtime: false,
    cacheEnabled: false
  });
};