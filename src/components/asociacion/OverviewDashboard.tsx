'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Store,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UserPlus,
  BarChart3,
  Activity,
  Clock,
  DollarSign,
  Zap,
  ArrowUpRight,
  Shield,
  Minus,
  Eye
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
import { useSocios } from '@/hooks/useSocios';
import { useComercios } from '@/hooks/useComercios';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastBackup: Date | null;
  storageUsed: number;
  storageLimit: number;
  uptime: number;
  responseTime: number;
}

// Modern KPI Card Component with enhanced design
const ModernKPICard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  loading?: boolean;
  badge?: string;
  delay?: number;
}> = ({
  title,
  value,
  change,
  icon,
  gradient,
  subtitle,
  trend = 'neutral',
  onClick,
  loading = false,
  badge,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8 cursor-pointer transition-all duration-300 hover:shadow-2xl group overflow-hidden"
      onClick={onClick}
    >
      {/* Animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-3xl`} />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-4 right-4 w-1 h-1 bg-blue-400 rounded-full animate-ping" />
        <div className="absolute top-8 right-8 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-8 left-8 w-1 h-1 bg-emerald-400 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
      </div>

      {/* Badge */}
      {badge && (
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.2 }}
          className="absolute top-4 right-4"
        >
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            {badge}
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: delay + 0.1, type: "spring", stiffness: 200 }}
          className={`
            relative flex items-center justify-center w-14 h-14 lg:w-16 lg:h-16 rounded-2xl transition-all duration-300
            bg-gradient-to-br ${gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110
          `}
        >
          {loading ? (
            <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7 text-white animate-spin" />
          ) : (
            <div className="text-white group-hover:scale-110 transition-transform duration-300">
              {icon}
            </div>
          )}
          
          {/* Icon glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
        </motion.div>
        
        {/* Trend Indicator */}
        <motion.div 
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.3 }}
          className="flex items-center space-x-2"
        >
          <div className={`p-2 rounded-xl transition-all duration-300 ${
            trend === 'up' ? 'bg-emerald-100 text-emerald-600' : 
            trend === 'down' ? 'bg-red-100 text-red-600' : 
            'bg-slate-100 text-slate-500'
          }`}>
            {trend === 'up' && <TrendingUp className="w-4 h-4" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4" />}
            {trend === 'neutral' && <Minus className="w-4 h-4" />}
          </div>
          <span className={`text-sm font-bold ${
            trend === 'up' ? 'text-emerald-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-slate-500'
          }`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        </motion.div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.2 }}
          className="text-sm font-semibold text-slate-500 uppercase tracking-wider"
        >
          {title}
        </motion.p>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + 0.3 }}
          className="text-3xl lg:text-4xl font-bold text-slate-900 group-hover:text-slate-800 transition-colors duration-300"
        >
          {loading ? (
            <div className="flex space-x-1">
              <div className="w-8 h-8 bg-slate-200 rounded animate-pulse" />
              <div className="w-12 h-8 bg-slate-200 rounded animate-pulse" />
            </div>
          ) : value}
        </motion.p>
        {subtitle && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.4 }}
            className="text-sm text-slate-600 group-hover:text-slate-700 transition-colors duration-300"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Action Arrow */}
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 0, scale: 1 }}
        whileHover={{ opacity: 1, scale: 1.1 }}
        className="absolute bottom-4 right-4 transition-all duration-300"
      >
        <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors duration-300">
          <ArrowUpRight className="w-4 h-4 text-slate-600" />
        </div>
      </motion.div>
    </motion.div>
  );
};

// Modern Activity Timeline Component
const ModernActivityTimeline: React.FC<{
  activities: ActivityLog[];
  loading: boolean;
  onViewAll?: () => void;
}> = ({ activities, loading, onViewAll }) => {
  const getActivityIcon = (type: ActivityLog['type']) => {
    const icons = {
      member_added: <UserPlus className="w-4 h-4" />,
      member_updated: <Users className="w-4 h-4" />,
      payment_received: <DollarSign className="w-4 h-4" />,
      backup_completed: <Shield className="w-4 h-4" />,
      import_completed: <Activity className="w-4 h-4" />,
      system_alert: <AlertCircle className="w-4 h-4" />,
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getActivityGradient = (type: ActivityLog['type']) => {
    const gradients = {
      member_added: 'from-emerald-500 to-teal-500',
      member_updated: 'from-blue-500 to-cyan-500',
      payment_received: 'from-green-500 to-emerald-500',
      backup_completed: 'from-purple-500 to-violet-500',
      import_completed: 'from-sky-500 to-blue-500',
      system_alert: 'from-red-500 to-pink-500',
    };
    return gradients[type] || 'from-slate-500 to-gray-500';
  };

  const formatActivityTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return format(date, 'dd/MM HH:mm', { locale: es });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl lg:text-2xl font-bold text-slate-900">Actividad Reciente</h3>
            <p className="text-slate-600">Últimas acciones del sistema</p>
          </div>
        </div>
        {onViewAll && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onViewAll}
            className="bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl"
          >
            <Eye className="w-4 h-4" />
            <span>Ver todo</span>
          </motion.button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-blue-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 5).map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-slate-50/80 transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${getActivityGradient(activity.type)} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors duration-300">
                  {activity.title}
                </p>
                <p className="text-slate-600 mt-1 group-hover:text-slate-700 transition-colors duration-300">
                  {activity.description}
                </p>
                <div className="flex items-center space-x-2 mt-3">
                  <div className="p-1 bg-slate-100 rounded-lg">
                    <Clock className="w-3 h-3 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {formatActivityTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
          
          {activities.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 font-semibold text-lg">No hay actividad reciente</p>
              <p className="text-slate-400 mt-2">Las acciones del sistema aparecerán aquí</p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Modern System Status Card
const ModernSystemStatusCard: React.FC<{
  health: SystemHealth;
  loading: boolean;
}> = ({ health, loading }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'good': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'warning': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Operativo';
      case 'warning': return 'Advertencia';
      case 'critical': return 'Crítico';
      default: return 'Desconocido';
    }
  };

  const storagePercentage = (health.storageUsed / health.storageLimit) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl lg:text-2xl font-bold text-slate-900">Estado del Sistema</h3>
            <p className="text-slate-600">Monitoreo en tiempo real</p>
          </div>
        </div>
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: "spring" }}
          className={`px-4 py-2 rounded-2xl font-semibold border ${getStatusColor(health.status)}`}
        >
          {getStatusText(health.status)}
        </motion.div>
      </div>

      <div className="space-y-6">
        {/* Uptime */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-700 font-semibold">Tiempo de actividad</span>
            <span className="text-slate-900 font-bold text-lg">
              {loading ? '...' : `${health.uptime}%`}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: loading ? '0%' : `${health.uptime}%` }}
              transition={{ delay: 0.5, duration: 1 }}
              className={`h-3 rounded-full transition-all duration-500 ${
                health.uptime > 99 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 
                health.uptime > 95 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                'bg-gradient-to-r from-red-500 to-pink-500'
              }`}
            />
          </div>
        </div>

        {/* Storage */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-700 font-semibold">Almacenamiento</span>
            <span className="text-slate-900 font-bold text-lg">
              {loading ? '...' : `${storagePercentage.toFixed(1)}%`}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: loading ? '0%' : `${storagePercentage}%` }}
              transition={{ delay: 0.6, duration: 1 }}
              className={`h-3 rounded-full transition-all duration-500 ${
                storagePercentage > 80 ? 'bg-gradient-to-r from-red-500 to-pink-500' : 
                storagePercentage > 60 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
            />
          </div>
          <p className="text-slate-600 text-sm mt-2">
            {loading ? '...' : `${(health.storageUsed / 1024).toFixed(1)} GB de ${(health.storageLimit / 1024).toFixed(1)} GB utilizados`}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <p className="text-blue-700 text-xs font-semibold mb-1">Último Respaldo</p>
            <p className="text-blue-900 font-bold text-sm">
              {loading ? '...' : health.lastBackup ? format(health.lastBackup, 'dd/MM HH:mm') : 'Nunca'}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <p className="text-emerald-700 text-xs font-semibold mb-1">Respuesta</p>
            <p className="text-emerald-900 font-bold text-sm">
              {loading ? '...' : `${health.responseTime}ms`}
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// Modern Quick Stats Component
const ModernQuickStats: React.FC<{
  totalSocios: number;
  activosSocios: number;
  totalComercios: number;
  loading: boolean;
}> = ({ totalSocios, activosSocios, totalComercios, loading }) => {
  const stats = [
    {
      label: 'Total Socios',
      value: totalSocios,
      icon: <Users className="w-5 h-5" />,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      borderColor: 'border-blue-100'
    },
    {
      label: 'Socios Activos',
      value: activosSocios,
      icon: <CheckCircle className="w-5 h-5" />,
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
      borderColor: 'border-emerald-100'
    },
    {
      label: 'Comercios Activos',
      value: totalComercios,
      icon: <Store className="w-5 h-5" />,
      gradient: 'from-purple-500 to-violet-500',
      bgGradient: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02, y: -2 }}
          className={`bg-gradient-to-br ${stat.bgGradient} rounded-2xl lg:rounded-3xl shadow-lg border ${stat.borderColor} p-6 transition-all duration-300 hover:shadow-xl`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${stat.gradient} shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-600 mb-1">{stat.label}</p>
              <p className="text-2xl lg:text-3xl font-bold text-slate-900">
                {loading ? (
                  <div className="w-16 h-8 bg-slate-200 rounded animate-pulse" />
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
};

// Main Component
const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  onNavigate,
  onAddMember
}) => {
  const { user } = useAuth();
  const { stats, loading: sociosLoading } = useSocios();
  const { stats: comerciosStats, loading: comerciosLoading } = useComercios();
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const systemHealth = useMemo<SystemHealth>(() => ({
    status: 'good',
    lastBackup: subDays(new Date(), 1),
    storageUsed: 1024,
    storageLimit: 5120,
    uptime: 99.9,
    responseTime: 120,
  }), []);
  const [loading, setLoading] = useState(true);

  // Fetch real-time activities from Firebase
  useEffect(() => {
    if (!user) return;

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
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Calculate growth metrics
  const growthMetrics = useMemo(() => {
    const memberGrowth = activities.filter(a => a.type === 'member_added').length;
    const growthRate = stats.total > 0 ? (memberGrowth / stats.total) * 100 : 0;
    const retentionRate = stats.total > 0 ? (stats.activos / stats.total) * 100 : 0;

    return {
      growthRate: Math.round(growthRate * 100) / 100,
      retentionRate: Math.round(retentionRate * 100) / 100,
    };
  }, [activities, stats]);

  // System health calculation
  const healthStatus = useMemo(() => {
    const storagePercentage = (systemHealth.storageUsed / systemHealth.storageLimit) * 100;
    const backupAge = systemHealth.lastBackup 
      ? (Date.now() - systemHealth.lastBackup.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (storagePercentage > 90 || backupAge > 7 || systemHealth.uptime < 95) {
      return 'critical';
    } else if (storagePercentage > 75 || backupAge > 3 || systemHealth.uptime < 98) {
      return 'warning';
    } else if (systemHealth.uptime > 99.5 && backupAge < 1) {
      return 'excellent';
    }
    return 'good';
  }, [systemHealth]);

  const kpiMetrics = useMemo(() => {
    const activosPercentage = stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0;
    const vencidosPercentage = stats.total > 0 ? Math.round((stats.vencidos / stats.total) * 100) : 0;
    
    return [
      {
        title: 'Total Socios',
        value: stats.total.toLocaleString(),
        change: growthMetrics.growthRate,
        icon: <Users className="w-6 h-6 lg:w-7 lg:h-7" />,
        gradient: 'from-blue-500 to-cyan-500',
        subtitle: 'Miembros registrados',
        trend: growthMetrics.growthRate > 0 ? 'up' as const : 'neutral' as const,
        onClick: () => onNavigate('socios'),
        loading: sociosLoading
      },
      {
        title: 'Socios Activos',
        value: `${stats.activos.toLocaleString()} (${activosPercentage}%)`,
        change: activosPercentage,
        icon: <CheckCircle className="w-6 h-6 lg:w-7 lg:h-7" />,
        gradient: 'from-emerald-500 to-teal-500',
        subtitle: 'Estado vigente',
        trend: activosPercentage > 80 ? 'up' as const : activosPercentage > 60 ? 'neutral' as const : 'down' as const,
        onClick: () => onNavigate('socios'),
        loading: sociosLoading
      },
      {
        title: 'Socios Vencidos',
        value: `${stats.vencidos.toString()} (${vencidosPercentage}%)`,
        change: vencidosPercentage > 0 ? -vencidosPercentage : 0,
        icon: <AlertCircle className="w-6 h-6 lg:w-7 lg:h-7" />,
        gradient: 'from-red-500 to-pink-500',
        subtitle: 'Requieren atención',
        trend: vencidosPercentage > 20 ? 'up' as const : vencidosPercentage > 10 ? 'neutral' as const : 'down' as const,
        onClick: () => onNavigate('socios'),
        loading: sociosLoading,
        badge: vencidosPercentage > 15 ? 'Crítico' : undefined
      }
    ];
  }, [stats, growthMetrics, sociosLoading, onNavigate]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-600 to-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
                <BarChart3 className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900">
                  Vista General
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 mt-1">
                  Panel de control • {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="w-12 h-12 bg-white/80 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddMember}
              className="bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-xl hover:shadow-2xl"
            >
              <UserPlus className="w-5 h-5" />
              <span>Nuevo Socio</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <ModernQuickStats
        totalSocios={stats.total}
        activosSocios={stats.activos}
        totalComercios={comerciosStats.comerciosActivos}
        loading={sociosLoading || comerciosLoading}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {kpiMetrics.map((metric, index) => (
          <ModernKPICard key={index} {...metric} delay={index * 0.1} />
        ))}
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2">
          <ModernActivityTimeline
            activities={activities}
            loading={loading}
            onViewAll={() => onNavigate('notificaciones')}
          />
        </div>
        <div>
          <ModernSystemStatusCard
            health={{ ...systemHealth, status: healthStatus }}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export { OverviewDashboard };