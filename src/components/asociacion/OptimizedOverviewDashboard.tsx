'use client';

import React, { useState, useEffect, useMemo, useCallback, memo, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Store,
  RefreshCw,
  UserPlus,
  BarChart3,
  UserCheck,
  UserX
} from 'lucide-react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedSocioData } from '@/hooks/useOptimizedSocioData';
import { useOptimizedComercioData } from '@/hooks/useOptimizedComercioData';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Lazy load heavy components
const ModernActivityTimeline = lazy(() => import('./ModernActivityTimeline'));

interface OverviewDashboardProps {
  onNavigate: (section: string) => void;
  onAddMember: () => void;
}

interface ActivityLog {
  id: string;
  type: 'member_added' | 'member_updated' | 'payment_received' | 'backup_completed' | 'import_completed' | 'system_alert';
  title: string;
  description: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
}

// Memoized Quick Stats Component - Mobile Optimized
const OptimizedQuickStats = memo<{
  totalSocios: number;
  activosSocios: number;
  vencidosSocios: number;
  totalComercios: number;
  loading: boolean;
}>(({ totalSocios, activosSocios, vencidosSocios, totalComercios, loading }) => {
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

    // Only add vencidos if there are any
    if (vencidosSocios > 0) {
      baseStats.splice(2, 0, {
        label: 'Socios Vencidos',
        value: vencidosSocios,
        icon: <UserX className="w-4 h-4 sm:w-5 sm:h-5" />,
        gradient: 'from-red-500 to-pink-500',
        bgGradient: 'from-red-50 to-pink-50',
        borderColor: 'border-red-100'
      });
    }

    return baseStats;
  }, [totalSocios, activosSocios, vencidosSocios, totalComercios]);

  const gridCols = vencidosSocios > 0 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8`}>
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`bg-gradient-to-br ${stat.bgGradient} rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-md sm:shadow-lg border ${stat.borderColor} p-3 sm:p-4 lg:p-6 transition-all duration-300 hover:shadow-lg sm:hover:shadow-xl`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${stat.gradient} shadow-lg mx-auto sm:mx-0`}>
              {stat.icon}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mb-1">{stat.label}</p>
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900">
                {loading ? (
                  <div className="w-12 h-6 sm:w-16 sm:h-8 bg-slate-200 rounded animate-pulse mx-auto sm:mx-0" />
                ) : (
                  stat.value.toLocaleString()
                )}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
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
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {[1, 2, 3].map((i) => (
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

    {/* Activity Timeline Skeleton */}
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-center py-8 sm:py-12">
        <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
      </div>
    </div>
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Main Component
const OptimizedOverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate,
  onAddMember
}) => {
  const { user } = useAuth();
  const { 
    stats: socioStats, 
    loading: sociosLoading, 
    refreshStats: refreshSocioStats,
    lastUpdated: socioLastUpdated 
  } = useOptimizedSocioData();
  
  const { 
    stats: comercioStats, 
    loading: comerciosLoading,
    refreshStats: refreshComercioStats,
    lastUpdated: comercioLastUpdated 
  } = useOptimizedComercioData();
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const debouncedRefresh = useDebounce(() => {
    handleRefresh();
  }, 1000);

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
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

  // Enhanced add member handler
  const handleAddMemberClick = useCallback(() => {
    console.log('🔥 Add member clicked from overview dashboard');
    // First navigate to socios tab
    onNavigate('socios');
    // Then trigger the new socio dialog
    setTimeout(() => {
      onAddMember();
    }, 100);
  }, [onNavigate, onAddMember]);

  // Optimized activities listener
  useEffect(() => {
    if (!user?.uid) return;

    const activitiesRef = collection(db, 'activities');
    const activitiesQuery = query(
      activitiesRef,
      where('asociacionId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ActivityLog[];
      
      setActivities(activitiesData);
      setActivitiesLoading(false);
    }, (error) => {
      console.error('Error listening to activities:', error);
      setActivitiesLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Show loading skeleton while initial data loads
  if (sociosLoading && comerciosLoading && activitiesLoading) {
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
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddMemberClick}
              className="bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl text-sm sm:text-base"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Socio</span>
              <span className="sm:hidden">Nuevo</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <OptimizedQuickStats
        totalSocios={socioStats.total}
        activosSocios={socioStats.activos}
        vencidosSocios={socioStats.vencidos}
        totalComercios={comercioStats.comerciosActivos}
        loading={sociosLoading || comerciosLoading}
      />

      {/* Activity Timeline - Full Width */}
      <Suspense fallback={
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-white/20 p-4 sm:p-6 lg:p-8">
          <div className="flex justify-center py-8 sm:py-12">
            <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
          </div>
        </div>
      }>
        <ModernActivityTimeline
          activities={activities}
          loading={activitiesLoading}
          onViewAll={() => onNavigate('notificaciones')}
        />
      </Suspense>
    </div>
  );
};

export default memo(OptimizedOverviewDashboard);