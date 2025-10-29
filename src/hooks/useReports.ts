'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { reportsService, ReportData, AnalyticsMetrics } from '@/services/reports.service';
import { Timestamp } from 'firebase/firestore';
import { subDays } from 'date-fns';
import toast from 'react-hot-toast';

export interface UseReportsOptions {
  autoFetch?: boolean;
  limit?: number;
}

export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
  label: string;
}

export const useReports = (options: UseReportsOptions = {}) => {
  const { autoFetch = true, limit = 50 } = options;
  const { user } = useAuth();
  
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null);

  // Subscribe to user reports
  useEffect(() => {
    if (!user || !autoFetch) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = reportsService.subscribeToUserReports(user.uid, (userReports) => {
      setReports(userReports);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, [user, autoFetch]);

  // Generate a new report
  const generateReport = useCallback(async (
    templateId: string,
    parameters: {
      dateRange: string;
      categoryFilter: string;
      startDate?: Date;
      endDate?: Date;
      includeCharts?: boolean;
      format?: 'pdf' | 'excel' | 'csv';
    }
  ): Promise<string | null> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      setGeneratingReports(prev => new Set([...prev, templateId]));
      setError(null);

      const reportId = await reportsService.generateReport(
        templateId,
        user.uid,
        user.uid, // Using user.uid as asociacionId
        {
          ...parameters,
          startDate: parameters.startDate ? Timestamp.fromDate(parameters.startDate) : undefined,
          endDate: parameters.endDate ? Timestamp.fromDate(parameters.endDate) : undefined,
        }
      );

      toast.success('Reporte iniciado exitosamente');
      return reportId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al generar el reporte';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      // Remove from generating set after a delay
      setTimeout(() => {
        setGeneratingReports(prev => {
          const newSet = new Set(prev);
          newSet.delete(templateId);
          return newSet;
        });
      }, 3000);
    }
  }, [user]);

  // Delete a report
  const deleteReport = useCallback(async (reportId: string): Promise<boolean> => {
    try {
      await reportsService.deleteReport(reportId);
      toast.success('Reporte eliminado exitosamente');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al eliminar el reporte';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    }
  }, []);

  // Get analytics metrics for a date range
  const getAnalyticsMetrics = useCallback(async (
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      const metrics = await reportsService.getAnalyticsMetrics(
        user.uid, // Using user.uid as asociacionId
        startDate,
        endDate
      );
      setAnalyticsMetrics(metrics);
      return metrics;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener métricas';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh reports data
  const refreshReports = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userReports = await reportsService.getUserReports(user.uid, limit);
      setReports(userReports);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar reportes';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  // Get predefined date ranges
  const getDateRanges = useCallback((): DateRangeFilter[] => {
    const now = new Date();
    return [
      {
        startDate: subDays(now, 7),
        endDate: now,
        label: 'Últimos 7 días'
      },
      {
        startDate: subDays(now, 30),
        endDate: now,
        label: 'Últimos 30 días'
      },
      {
        startDate: subDays(now, 90),
        endDate: now,
        label: 'Últimos 3 meses'
      },
      {
        startDate: subDays(now, 180),
        endDate: now,
        label: 'Últimos 6 meses'
      },
      {
        startDate: subDays(now, 365),
        endDate: now,
        label: 'Último año'
      },
      {
        startDate: new Date(2020, 0, 1),
        endDate: now,
        label: 'Todo el tiempo'
      }
    ];
  }, []);

  // Export reports to CSV
  const exportReportsToCSV = useCallback(() => {
    if (reports.length === 0) {
      toast.error('No hay reportes para exportar');
      return;
    }

    const csvData = [
      ['ID', 'Título', 'Estado', 'Fecha de Generación', 'Tamaño', 'Categoría'],
      ...reports.map(report => [
        report.id || '',
        report.title,
        report.status,
        report.generatedAt.toDate().toLocaleDateString(),
        report.fileSize || 'N/A',
        report.parameters.categoryFilter
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reportes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Reportes exportados exitosamente');
  }, [reports]);

  // Get report statistics
  const getReportStats = useCallback(() => {
    const completed = reports.filter(r => r.status === 'completed').length;
    const generating = reports.filter(r => r.status === 'generating').length;
    const failed = reports.filter(r => r.status === 'failed').length;

    return {
      total: reports.length,
      completed,
      generating,
      failed,
      completionRate: reports.length > 0 ? (completed / reports.length) * 100 : 0
    };
  }, [reports]);

  // Check if a template is currently generating
  const isGenerating = useCallback((templateId: string): boolean => {
    return generatingReports.has(templateId);
  }, [generatingReports]);

  // Get reports by status
  const getReportsByStatus = useCallback((status: ReportData['status']) => {
    return reports.filter(report => report.status === status);
  }, [reports]);

  // Get recent reports
  const getRecentReports = useCallback((count: number = 5) => {
    return reports
      .sort((a, b) => b.generatedAt.toMillis() - a.generatedAt.toMillis())
      .slice(0, count);
  }, [reports]);

  return {
    // Data
    reports,
    analyticsMetrics,
    loading,
    error,
    
    // Actions
    generateReport,
    deleteReport,
    getAnalyticsMetrics,
    refreshReports,
    exportReportsToCSV,
    
    // Utilities
    getDateRanges,
    getReportStats,
    isGenerating,
    getReportsByStatus,
    getRecentReports,
    
    // State
    generatingReports: Array.from(generatingReports)
  };
};

// Hook for analytics-specific functionality
export const useAnalyticsReports = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async (startDate: Date, endDate: Date) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const analyticsMetrics = await reportsService.getAnalyticsMetrics(
        user.uid,
        startDate,
        endDate
      );
      setMetrics(analyticsMetrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener métricas';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const exportMetricsToCSV = useCallback(() => {
    if (!metrics) {
      toast.error('No hay métricas para exportar');
      return;
    }

    const csvData = [
      ['Métrica', 'Valor'],
      ['Total Socios', metrics.totalSocios.toString()],
      ['Socios Activos', metrics.sociosActivos.toString()],
      ['Socios Vencidos', metrics.sociosVencidos.toString()],
      ['Total Validaciones', metrics.totalValidaciones.toString()],
      ['Validaciones Exitosas', metrics.validacionesExitosas.toString()],
      ['Tasa de Éxito (%)', metrics.tasaExito.toFixed(2)],
      ['Crecimiento Mensual (%)', metrics.crecimientoMensual.toFixed(2)],
      ['Ingresos Totales', metrics.ingresosTotales.toString()],
      [''],
      ['Beneficios Más Usados'],
      ['Nombre', 'Usos'],
      ...metrics.beneficiosMasUsados.map(beneficio => [
        beneficio.nombre,
        beneficio.usos.toString()
      ]),
      [''],
      ['Actividad por Día'],
      ['Fecha', 'Validaciones', 'Socios'],
      ...metrics.actividadPorDia.map(dia => [
        dia.fecha,
        dia.validaciones.toString(),
        dia.socios.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Métricas exportadas exitosamente');
  }, [metrics]);

  return {
    metrics,
    loading,
    error,
    fetchMetrics,
    exportMetricsToCSV
  };
};
