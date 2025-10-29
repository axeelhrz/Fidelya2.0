'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Store,
  RefreshCw,
  BarChart3,
  UserCheck,
  UserX
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSocioStats } from '@/hooks/useRealtimeSocioStats';
import { useOptimizedComercioData } from '@/hooks/useOptimizedComercioData';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OverviewDashboardProps {
  onNavigate?: (section: string) => void;
}

// Memoized Quick Stats Component - Mobile Optimized
const OptimizedQuickStats = memo<{
  totalSocios: number;
  activosSocios: number;
  vencidosSocios: number;
  totalComercios: number;
  loading: boolean;
  lastUpdated?: Date | null;
}>(({ totalSocios, activosSocios, vencidosSocios, totalComercios, loading, lastUpdated }) => {
  const stats = useMemo(() => {
    const baseStats = [
      {
        label: 'Total Socios',
        value: totalSocios,
        icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
        gradient: 'from-blue-500 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50',
        borderColor: 'border-blue-100'
      },
      {
        label: 'Socios Activos',
        value: activosSocios,
        icon: <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />,
        gradient: 'from-emerald-500 to-teal-500',
        bgGradient: 'from-emerald-50 to-teal-50',
        borderColor: 'border-emerald-100'
      },
      {
        label: 'Comercios Activos',
        value: totalComercios,
        icon: <Store className="w-4 h-4 sm:w-5 sm:h-5" />,
        gradient: 'from-purple-500 to-violet-500',
        bgGradient: 'from-purple-50 to-violet-50',
        borderColor: 'border-purple-100'
      }
    ];

    // Always add vencidos card, but make it more prominent when there are expired members
    baseStats.splice(2, 0, {
      label: 'Socios Vencidos',
      value: vencidosSocios,
      icon: <UserX className="w-4 h-4 sm:w-5 sm:h-5" />,
      gradient: 'from-red-500 to-pink-500',
      bgGradient: 'from-red-50 to-pink-50',
      borderColor: 'border-red-100'
    });

    return baseStats;
  }, [totalSocios, activosSocios, vencidosSocios, totalComercios]);

  const gridCols = 'grid-cols-2 lg:grid-cols-4'; // Always show 4 columns

  return (
    <div className="space-y-4">
      {/* Last Updated Indicator */}
      {lastUpdated && (
        <div className="flex items-center justify-center">
          <div className="bg-slate-100/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-slate-200/50">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Actualizado: {format(lastUpdated, 'HH:mm:ss')}</span>
              <span className="text-slate-400">•</span>
              <span className="text-green-600 font-medium">Datos de tabla</span>
            </div>
          </div>
        </div>
      )}

      <div className={`grid ${gridCols} gap-3 sm:gap-4 lg:gap-6`}>
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className={`bg-gradient-to-br ${stat.bgGradient} rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-md sm:shadow-lg border ${stat.borderColor} p-3 sm:p-4 lg:p-6 transition-all duration-300 hover:shadow-lg sm:hover:shadow-xl relative overflow-hidden ${
              stat.label === 'Socios Vencidos' && stat.value > 0 ? 'ring-2 ring-red-200 ring-opacity-50' : ''
            }`}
          >
            {/* Animated background for vencidos */}
            {stat.label === 'Socios Vencidos' && stat.value > 0 && (
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-red-400/10 to-pink-400/10"
              />
            )}
            
            {/* Pulse effect for vencidos when > 0 */}
            {stat.label === 'Socios Vencidos' && stat.value > 0 && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-red-500/5 rounded-xl sm:rounded-2xl lg:rounded-3xl"
              />
            )}
            
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4 relative z-10">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${stat.gradient} shadow-lg mx-auto sm:mx-0 ${
                stat.label === 'Socios Vencidos' && stat.value > 0 ? 'animate-pulse' : ''
              }`}>
                {stat.icon}
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">{stat.label}</p>
                <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900">
                  {loading ? (
                    <div className="w-12 h-6 sm:w-16 sm:h-8 bg-slate-200 rounded animate-pulse mx-auto sm:mx-0" />
                  ) : (
                    <motion.span
                      key={stat.value}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className={stat.label === 'Socios Vencidos' && stat.value > 0 ? 'text-red-700' : ''}
                    >
                      {stat.value.toLocaleString()}
                    </motion.span>
                  )}
                </p>
                {/* Show percentage for vencidos */}
                {stat.label === 'Socios Vencidos' && totalSocios > 0 && (
                  <p className={`text-xs font-medium mt-1 ${
                    stat.value > 0 ? 'text-red-600' : 'text-slate-500'
                  }`}>
                    {Math.round((stat.value / totalSocios) * 100)}% del total
                  </p>
                )}
                {/* Show status for vencidos */}
                {stat.label === 'Socios Vencidos' && (
                  <p className={`text-xs font-medium mt-1 ${
                    stat.value > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {stat.value > 0 ? 'Requieren atención' : 'Todo al día'}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

OptimizedQuickStats.displayName = 'OptimizedQuickStats';

// Loading Skeleton Component - Mobile Optimized
const LoadingSkeleton = memo(() => (
  <div className="space-y-6 sm:space-y-8">
    {/* Header Skeleton */}
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-slate-200 rounded-2xl sm:rounded-3xl animate-pulse" />
          <div>
            <div className="w-32 sm:w-48 h-6 sm:h-8 bg-slate-200 rounded animate-pulse mb-2" />
            <div className="w-40 sm:w-64 h-4 sm:h-6 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex space-x-2 sm:space-x-4">
          <div className="w-24 sm:w-32 h-10 sm:h-12 bg-slate-200 rounded-xl sm:rounded-2xl animate-pulse" />
          <div className="w-24 sm:w-32 h-10 sm:h-12 bg-slate-200 rounded-xl sm:rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>

    {/* Quick Stats Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-50 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-md sm:shadow-lg p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-slate-200 rounded-xl sm:rounded-2xl animate-pulse mx-auto sm:mx-0" />
            <div className="text-center sm:text-left">
              <div className="w-16 sm:w-24 h-3 sm:h-4 bg-slate-200 rounded animate-pulse mb-2 mx-auto sm:mx-0" />
              <div className="w-12 sm:w-16 h-6 sm:h-8 bg-slate-200 rounded animate-pulse mx-auto sm:mx-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Main Component
const OptimizedOverviewDashboard: React.FC<OverviewDashboardProps> = ({
  
}) => {
  const { } = useAuth();
  
  // Usar el nuevo hook que calcula estadísticas desde los datos de la tabla
  const { 
    stats: socioStats, 
    loading: sociosLoading, 
    refreshStats: refreshSocioStats,
    lastUpdated: socioLastUpdated 
  } = useRealtimeSocioStats();
  
  const { 
    stats: comercioStats, 
    loading: comerciosLoading,
    refreshStats: refreshComercioStats,
    lastUpdated: comercioLastUpdated 
  } = useOptimizedComercioData();
  
  const [refreshing, setRefreshing] = useState(false);

  const debouncedRefresh = useDebounce(() => {
    handleRefresh();
  }, 1000);

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      console.log('🔄 Manual refresh triggered from dashboard');
      await Promise.all([
        refreshSocioStats(),
        refreshComercioStats()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, refreshSocioStats, refreshComercioStats]);


  // Show loading skeleton while initial data loads
  if (sociosLoading && comerciosLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-white/30 p-4 sm:p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div>
            <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl sm:shadow-2xl">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900">
                  Vista General
                </h1>
                <p className="text-sm sm:text-lg lg:text-xl text-slate-600 mt-1">
                  Panel de control • {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                </p>
                {(socioLastUpdated || comercioLastUpdated) && (
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Última actualización: {format(
                      socioLastUpdated || comercioLastUpdated || new Date(), 
                      'HH:mm:ss'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={debouncedRefresh}
              disabled={refreshing}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white/80 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-300 shadow-md sm:shadow-lg hover:shadow-lg sm:hover:shadow-xl disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats - Now using realtime data from table */}
      <OptimizedQuickStats
        totalSocios={socioStats.total}
        activosSocios={socioStats.activos}
        vencidosSocios={socioStats.vencidos}
        totalComercios={comercioStats.comerciosActivos}
        loading={sociosLoading || comerciosLoading}
        lastUpdated={socioLastUpdated}
      />
    </div>
  );
};

export default memo(OptimizedOverviewDashboard);