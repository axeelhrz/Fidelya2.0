'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { useValidaciones } from './useValidaciones';
import { useBeneficios } from './useBeneficios';
import { format, startOfDay, endOfDay, eachDayOfInterval, getHours, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsData {
  // KPI Data
  totalValidaciones: number;
  promedioDiario: number;
  asociacionesActivas: number;
  beneficioMasUsado: {
    nombre: string;
    usos: number;
  } | null;
  totalBeneficios?: number;
  usuariosUnicos?: number;
  totalViews?: number;
  clientesUnicos?: number;
  tasaConversion?: number;
  
  // Additional KPI Data for KpiCards
  tasaExito: number;
  crecimientoMensual: number;
  eficienciaOperativa: number;
  ingresosTotales?: number;
  sociosAlcanzados?: number;
  
  // Chart Data
  dailyValidations: Array<{
    fecha: string;
    validaciones: number;
    exitosas: number;
    fallidas: number;
  }>;
  
  byAssociation: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
  
  hourlyActivity: Array<{
    hora: string;
    total: number;
  }>;
  
  topDays: Array<{
    fecha: string;
    validaciones: number;
    isRecord: boolean;
  }>;
  
  topBenefits: Array<{
    id: string;
    nombre: string;
    asociacion: string;
    usos: number;
    estado: 'activo' | 'inactivo';
  }>;
}

const CHART_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

// Default analytics data to prevent undefined errors
const DEFAULT_ANALYTICS_DATA: AnalyticsData = {
  totalValidaciones: 0,
  promedioDiario: 0,
  asociacionesActivas: 0,
  beneficioMasUsado: null,
  tasaExito: 0,
  crecimientoMensual: 0,
  eficienciaOperativa: 0,
  ingresosTotales: 0,
  sociosAlcanzados: 0,
  dailyValidations: [],
  byAssociation: [],
  hourlyActivity: [],
  topDays: [],
  topBenefits: [],
};

export const useAnalytics = (dateRange: DateRange) => {
  const { user } = useAuth();
  const { validaciones } = useValidaciones();
  const { beneficios } = useBeneficios();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>(DEFAULT_ANALYTICS_DATA);
  const [loading, setLoading] = useState(true);

  // Memoize date range to prevent unnecessary recalculations
  const memoizedDateRange = useMemo(() => dateRange, [dateRange]);

  const processAnalyticsData = useCallback(() => {
    if (!user || !validaciones.length) {
      setAnalyticsData(DEFAULT_ANALYTICS_DATA);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Filter validaciones by date range
      const filteredValidaciones = validaciones.filter(v => {
        const vDate = v.fechaHora.toDate();
        return vDate >= startOfDay(memoizedDateRange.startDate) && vDate <= endOfDay(memoizedDateRange.endDate);
      });

      // Calculate KPIs
      const totalValidaciones = filteredValidaciones.length;
      const daysDiff = Math.max(1, Math.ceil((memoizedDateRange.endDate.getTime() - memoizedDateRange.startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const promedioDiario = totalValidaciones / daysDiff;

      // Get unique associations
      const asociacionesActivas = new Set(filteredValidaciones.map(v => v.asociacionId)).size;

      // Calculate most used benefit
      const beneficioUsos: Record<string, number> = {};
      filteredValidaciones.forEach(v => {
        if (typeof v.beneficioId !== 'undefined' && v.beneficioId !== null) {
          beneficioUsos[v.beneficioId] = (beneficioUsos[v.beneficioId] || 0) + 1;
        }
      });

      const beneficioMasUsadoId = Object.entries(beneficioUsos).sort(([,a], [,b]) => b - a)[0];
      const beneficioMasUsado = beneficioMasUsadoId ? {
        nombre: beneficios.find(b => b.id === beneficioMasUsadoId[0])?.titulo || 'Desconocido',
        usos: beneficioMasUsadoId[1]
      } : null;

      // Calculate success rate - FIXED: filteredValidaciones instead of filteredValidations
      const validacionesExitosas = filteredValidaciones.filter(v => v.resultado === 'habilitado').length;
      const tasaExito = totalValidaciones > 0 ? (validacionesExitosas / totalValidaciones) * 100 : 0;

      // Calculate monthly growth
      const previousMonthStart = subMonths(memoizedDateRange.startDate, 1);
      const previousMonthEnd = subMonths(memoizedDateRange.endDate, 1);
      const previousMonthValidaciones = validaciones.filter(v => {
        const vDate = v.fechaHora.toDate();
        return vDate >= startOfDay(previousMonthStart) && vDate <= endOfDay(previousMonthEnd);
      }).length;
      
      const crecimientoMensual = previousMonthValidaciones > 0 
        ? ((totalValidaciones - previousMonthValidaciones) / previousMonthValidaciones) * 100 
        : totalValidaciones > 0 ? 100 : 0;

      // Calculate operational efficiency (based on success rate and average daily validations)
      const eficienciaOperativa = Math.min((tasaExito * 0.7) + (Math.min(promedioDiario / 10, 10) * 3), 100);

      // Calculate estimated revenue (assuming average value per validation)
      const ingresosTotales = totalValidaciones * 15; // Assuming $15 average per validation

      // Calculate unique members reached
      const sociosAlcanzados = new Set(filteredValidaciones.map(v => v.socioId)).size;

      // Daily validations chart data
      const allDays = eachDayOfInterval({ start: memoizedDateRange.startDate, end: memoizedDateRange.endDate });
      const dailyValidations = allDays.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);
        
        const dayValidaciones = filteredValidaciones.filter(v => {
          const vDate = v.fechaHora.toDate();
          return vDate >= dayStart && vDate <= dayEnd;
        });

        const exitosas = dayValidaciones.filter(v => v.resultado === 'habilitado').length;
        const fallidas = dayValidaciones.length - exitosas;

        return {
          fecha: format(day, 'dd/MM', { locale: es }),
          validaciones: dayValidaciones.length,
          exitosas,
          fallidas,
        };
      });

      // By association chart data
      const asociacionCounts: Record<string, number> = {};
      filteredValidaciones.forEach(v => {
        asociacionCounts[v.asociacionId] = (asociacionCounts[v.asociacionId] || 0) + 1;
      });

      const byAssociation = Object.entries(asociacionCounts)
        .map(([asociacionId, count], index) => ({
          name: `Asociación ${asociacionId.substring(0, 8)}...`,
          value: count,
          percentage: totalValidaciones > 0 ? (count / totalValidaciones) * 100 : 0,
          color: CHART_COLORS[index % CHART_COLORS.length],
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      // Hourly activity data
      const hourlyActivity = Array.from({ length: 24 }, (_, hour) => {
        const hourValidaciones = filteredValidaciones.filter(v => 
          getHours(v.fechaHora.toDate()) === hour
        );

        return {
          hora: `${hour.toString().padStart(2, '0')}:00`,
          total: hourValidaciones.length,
        };
      });

      // Top days data
      const topDays = dailyValidations
        .filter(day => day.validaciones > 0)
        .sort((a, b) => b.validaciones - a.validaciones)
        .slice(0, 5)
        .map((day, index) => ({
          fecha: day.fecha,
          validaciones: day.validaciones,
          isRecord: index === 0,
        }));

      // Top benefits data
      const topBenefits = Object.entries(beneficioUsos)
        .map(([beneficioId, usos]) => {
          const beneficio = beneficios.find(b => b.id === beneficioId);
          // Ensure asociacion is always a string (e.g., association name or ID)
          let asociacionNombre = 'N/A';
          if (beneficio?.asociacionesVinculadas && beneficio.asociacionesVinculadas.length > 0) {
            const asociacion = beneficio.asociacionesVinculadas[0];
            // If asociacion is an object, use its 'nombre' or 'id', otherwise use as string
            if (typeof asociacion === 'string') {
              asociacionNombre = asociacion;
            } else if (typeof asociacion === 'object' && asociacion !== null) {
              asociacionNombre = asociacion.nombre || asociacion.id || 'N/A';
            }
          }
          return {
            id: beneficioId,
            nombre: beneficio?.titulo || 'Beneficio Desconocido',
            asociacion: asociacionNombre,
            usos,
            estado: (beneficio?.estado || 'inactivo') as 'activo' | 'inactivo',
          };
        })
        .sort((a, b) => b.usos - a.usos)
        .slice(0, 10);

      setAnalyticsData({
        totalValidaciones,
        promedioDiario,
        asociacionesActivas,
        beneficioMasUsado,
        tasaExito,
        crecimientoMensual,
        eficienciaOperativa,
        ingresosTotales,
        sociosAlcanzados,
        dailyValidations,
        byAssociation,
        hourlyActivity,
        topDays,
        topBenefits,
      });

    } catch (error) {
      console.error('Error processing analytics data:', error);
      setAnalyticsData(DEFAULT_ANALYTICS_DATA);
    } finally {
      setLoading(false);
    }
  }, [user, validaciones, beneficios, memoizedDateRange]);

  useEffect(() => {
    processAnalyticsData();
  }, [processAnalyticsData]);

  // Export functionality
  const exportToCSV = useCallback(() => {
    const csvData = [
      ['Métrica', 'Valor'],
      ['Total Validaciones', analyticsData.totalValidaciones.toString()],
      ['Promedio Diario', analyticsData.promedioDiario.toFixed(2)],
      ['Asociaciones Activas', analyticsData.asociacionesActivas.toString()],
      ['Beneficio Más Usado', analyticsData.beneficioMasUsado?.nombre || 'N/A'],
      ['Usos del Beneficio Más Usado', analyticsData.beneficioMasUsado?.usos.toString() || '0'],
      ['Tasa de Éxito (%)', analyticsData.tasaExito.toFixed(2)],
      ['Crecimiento Mensual (%)', analyticsData.crecimientoMensual.toFixed(2)],
      ['Eficiencia Operativa (%)', analyticsData.eficienciaOperativa.toFixed(2)],
      ['Ingresos Totales', analyticsData.ingresosTotales?.toString() || '0'],
      ['Socios Alcanzados', analyticsData.sociosAlcanzados?.toString() || '0'],
      [''],
      ['Validaciones Diarias'],
      ['Fecha', 'Total', 'Exitosas', 'Fallidas'],
      ...analyticsData.dailyValidations.map(day => [
        day.fecha,
        day.validaciones.toString(),
        day.exitosas.toString(),
        day.fallidas.toString(),
      ]),
      [''],
      ['Top Beneficios'],
      ['Nombre', 'Usos', 'Estado'],
      ...analyticsData.topBenefits.map(benefit => [
        benefit.nombre,
        benefit.usos.toString(),
        benefit.estado,
      ]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [analyticsData]);

  return {
    analyticsData,
    loading,
    exportToCSV,
    refresh: processAnalyticsData,
  };
};