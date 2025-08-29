import { useState, useEffect, useCallback, useMemo } from 'react';
import { SocioStats } from '@/types/socio';
import { useSocios } from './useSocios';

interface UseRealtimeSocioStatsReturn {
  stats: SocioStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  lastUpdated: Date | null;
}

/**
 * Hook que calcula las estadísticas de socios en tiempo real
 * basándose EXACTAMENTE en los mismos datos que se muestran en la tabla de socios
 */
export const useRealtimeSocioStats = (): UseRealtimeSocioStatsReturn => {
  const { socios, loading, error, forceReload } = useSocios();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Calcular estadísticas basándose EXACTAMENTE en lo que muestra la tabla
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

    console.log(`🔍 Calculando estadísticas para ${socios.length} socios...`);

    socios.forEach(socio => {
      // Contar por estado (EXACTAMENTE como se muestra en la tabla)
      if (socio.estado === 'activo') {
        activos++;
      } else if (socio.estado === 'inactivo') {
        inactivos++;
      } else if (socio.estado === 'vencido') {
        vencidos++;
        console.log(`⚠️ Socio vencido detectado: ${socio.nombre} - estado: ${socio.estado}`);
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

    console.log('📊 Estadísticas calculadas (basadas en tabla):', {
      total: calculatedStats.total,
      activos: calculatedStats.activos,
      vencidos: calculatedStats.vencidos,
      inactivos: calculatedStats.inactivos,
      porcentajeVencidos: calculatedStats.porcentajeVencidos
    });

    // Log detallado de socios vencidos
    if (vencidos > 0) {
      const sociosVencidos = socios.filter(s => s.estado === 'vencido');
      console.log('🔍 Socios vencidos encontrados (por estado):', sociosVencidos.map(s => ({
        nombre: s.nombre,
        estado: s.estado,
        estadoMembresia: s.estadoMembresia,
        fechaVencimiento: s.fechaVencimiento?.toDate()
      })));
    } else {
      console.log('✅ No hay socios con estado "vencido" detectados');
    }

    return calculatedStats;
  }, [socios]);

  // Actualizar timestamp cuando cambien las estadísticas
  useEffect(() => {
    if (socios && socios.length > 0) {
      setLastUpdated(new Date());
    }
  }, [stats.total, stats.activos, stats.vencidos, stats.inactivos, socios]);

  // Log cuando cambien las estadísticas de vencidos
  useEffect(() => {
    if (stats.vencidos > 0) {
      console.log(`⚠️ ${stats.vencidos} socios vencidos detectados en tiempo real (usando campo estado)`);
    } else {
      console.log('✅ No hay socios vencidos detectados');
    }
  }, [stats.vencidos]);

  // Función para refrescar estadísticas
  const refreshStats = useCallback(async () => {
    try {
      console.log('🔄 Refreshing socio stats...');
      await forceReload();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('❌ Error refreshing socio stats:', error);
    }
  }, [forceReload]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    lastUpdated
  };
};