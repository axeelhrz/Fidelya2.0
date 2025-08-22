'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { ComercioAnalytics } from '@/components/comercio/ComercioAnalytics';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { 
  TrendingUp, 
  UserCheck, 
  Gift, 
  Calendar,
  Building2,
  RefreshCw,
  Download,
  Eye,
  Users,
  DollarSign,
  Target,
} from 'lucide-react';
import toast from 'react-hot-toast';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ComercioAnalyticsContent() {
  const { user, signOut } = useAuth();
  // Calculate date range based on selected period
  const getDateRange = (period: 'week' | 'month' | 'year') => {
    const end = new Date();
    const start = new Date();
    if (period === 'week') {
      start.setDate(end.getDate() - 7);
    } else if (period === 'month') {
      start.setMonth(end.getMonth() - 1);
    } else if (period === 'year') {
      start.setFullYear(end.getFullYear() - 1);
    }
    return { startDate: start, endDate: end };
  };

  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [exporting, setExporting] = useState(false);

  const dateRange = getDateRange(period);

  const { analyticsData, loading, exportToCSV, refresh } = useAnalytics({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'general';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToCSV();
      toast.success('Reporte de analytics exportado exitosamente');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    {
      id: 'general',
      label: 'Vista General',
      icon: TrendingUp,
      description: 'Métricas principales'
    },
    {
      id: 'validaciones',
      label: 'Análisis de Validaciones',
      icon: UserCheck,
      description: 'Tendencias de validaciones'
    },
    {
      id: 'beneficios',
      label: 'Rendimiento de Beneficios',
      icon: Gift,
      description: 'Análisis de beneficios'
    },
    {
      id: 'horarios',
      label: 'Horarios de Actividad',
      icon: Calendar,
      description: 'Patrones de uso por horario'
    },
    {
      id: 'asociaciones',
      label: 'Por Asociación',
      icon: Building2,
      description: 'Análisis por asociación'
    }
  ];

  // Load analytics data
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, period, refresh]);

  if (loading) {
    return (
      <DashboardLayout
        activeSection="analytics"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-2xl flex items-center justify-center">
              <RefreshCw size={32} className="text-orange-500 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cargando analytics...
            </h3>
            <p className="text-gray-500">Procesando datos analíticos</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="analytics"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
                Analytics Avanzado
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Análisis detallado del rendimiento de tu comercio
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'year')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={16} />}
                onClick={refresh}
              >
                Actualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Download size={16} />}
                onClick={handleExport}
                loading={exporting}
              >
                Exportar
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white">
                  <Eye size={20} />
                </div>
                <div>
                  <div className="text-xl font-black text-gray-900">
                    {analyticsData?.totalViews || 0}
                  </div>
                  <div className="text-xs font-semibold text-gray-600">Visualizaciones</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="text-xl font-black text-gray-900">
                    {analyticsData?.totalValidaciones || 0}
                  </div>
                  <div className="text-xs font-semibold text-gray-600">Validaciones</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white">
                  <Users size={20} />
                </div>
                <div>
                  <div className="text-xl font-black text-gray-900">
                    {analyticsData?.clientesUnicos || 0}
                  </div>
                  <div className="text-xs font-semibold text-gray-600">Clientes</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
                  <DollarSign size={20} />
                </div>
                <div>
                  <div className="text-xl font-black text-gray-900">
                    ${analyticsData?.ingresosTotales || 0}
                  </div>
                  <div className="text-xs font-semibold text-gray-600">Ingresos</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg"
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white">
                  <Target size={20} />
                </div>
                <div>
                  <div className="text-xl font-black text-gray-900">
                    {analyticsData?.tasaConversion || 0}%
                  </div>
                  <div className="text-xs font-semibold text-gray-600">Conversión</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('tab', tab.id);
                  window.history.pushState({}, '', url.toString());
                  window.location.reload();
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Content - Fixed: Only pass the section prop */}
        <ComercioAnalytics section={activeTab} />
      </motion.div>
    </DashboardLayout>
  );
}

// Loading fallback component
function ComercioAnalyticsLoading() {
  return (
    <DashboardLayout
      activeSection="analytics"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-2xl flex items-center justify-center">
            <RefreshCw size={32} className="text-orange-500 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando analytics...
          </h3>
          <p className="text-gray-500">Procesando datos analíticos</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ComercioAnalyticsPage() {
  return (
    <Suspense fallback={<ComercioAnalyticsLoading />}>
      <ComercioAnalyticsContent />
    </Suspense>
  );
}