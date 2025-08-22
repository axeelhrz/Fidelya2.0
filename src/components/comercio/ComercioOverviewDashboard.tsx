import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  QrCode,
  BarChart3,
  Activity,
  Clock,
  ArrowUpRight,
  Shield,
  Minus,
  Calendar,
  Award,
  Download,
  Sparkles,
  Star,
  Target,
  Flame,
  ChevronRight
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
import { useComercio } from '@/hooks/useComercio';
import { useBeneficios } from '@/hooks/useBeneficios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ValidacionesDebug } from '@/components/debug/ValidacionesDebug';

interface ComercioOverviewDashboardProps {
  onNavigate?: (section: string) => void;
}

interface ActivityLog {
  id: string;
  type: 'validation_completed' | 'benefit_used' | 'qr_generated' | 'profile_updated' | 'system_alert';
  title: string;
  description: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
  userId?: string;
  userName?: string;
}

interface ComercioHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  qrCodeStatus: 'active' | 'expired' | 'missing';
  benefitsActive: number;
  validationsToday: number;
  responseTime: number;
}

// Modern KPI Card Component with enhanced animations
const KPICard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
  badge?: string;
  delay?: number;
}> = ({
  title,
  value,
  icon,
  gradient,
  subtitle,
  onClick,
  loading = false,
  badge,
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
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
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      {/* Badge */}
      {badge && (
        <div className="absolute top-4 right-4 z-10">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg"
          >
            <Sparkles className="w-3 h-3 inline mr-1" />
            {badge}
          </motion.div>
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center text-white shadow-xl bg-gradient-to-br ${gradient}`}
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-6 h-6 lg:w-7 lg:h-7" />
              </motion.div>
            ) : (
              icon
            )}
          </motion.div>
          
          <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.1 }}
            className="text-sm font-semibold text-slate-500 uppercase tracking-wider"
          >
            {title}
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + 0.2 }}
            className="text-3xl lg:text-4xl font-bold text-slate-900"
          >
            {loading ? (
              <div className="animate-pulse bg-slate-200 h-8 w-20 rounded" />
            ) : (
              value
            )}
          </motion.p>
          {subtitle && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.3 }}
              className="text-sm text-slate-600 flex items-center"
            >
              <Target className="w-3 h-3 mr-1" />
              {subtitle}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Activity Timeline Component
const ActivityTimeline: React.FC<{
  activities: ActivityLog[];
  loading: boolean;
  onViewAll?: () => void;
}> = ({ activities, loading }) => {
  const getActivityIcon = (type: ActivityLog['type']) => {
    const icons = {
      validation_completed: <CheckCircle className="w-4 h-4" />,
      benefit_used: <Award className="w-4 h-4" />,
      qr_generated: <QrCode className="w-4 h-4" />,
      profile_updated: <Users className="w-4 h-4" />,
      system_alert: <AlertCircle className="w-4 h-4" />,
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getActivityGradient = (type: ActivityLog['type']) => {
    const gradients = {
      validation_completed: 'from-emerald-500 to-teal-500',
      benefit_used: 'from-blue-500 to-indigo-500',
      qr_generated: 'from-purple-500 to-pink-500',
      profile_updated: 'from-sky-500 to-cyan-500',
      system_alert: 'from-red-500 to-orange-500',
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
      transition={{ delay: 0.6 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-xl">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl lg:text-2xl font-bold text-slate-900">Actividad Reciente</h3>
            <p className="text-slate-600">Últimas validaciones y acciones</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex justify-center py-12">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-3 border-slate-200 border-t-slate-500 rounded-full"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {activities.slice(0, 5).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-slate-50/80 transition-all duration-300 group cursor-pointer"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br ${getActivityGradient(activity.type)}`}
                >
                  {getActivityIcon(activity.type)}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 group-hover:text-slate-700 transition-colors">
                    {activity.title}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-3">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <p className="text-xs text-slate-500 font-medium">
                      {formatActivityTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {activities.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-slate-400" />
              </div>
              <p className="text-slate-500 font-semibold text-lg mb-2">No hay actividad reciente</p>
              <p className="text-slate-400">Las validaciones aparecerán aquí automáticamente</p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Enhanced Comercio Status Card
const ComercioStatusCard: React.FC<{
  health: ComercioHealth;
  loading: boolean;
  comercio: {
    qrCode?: string;
    nombreComercio?: string;
  };
  onGenerateQR?: () => void;
}> = ({ health, loading, comercio, onGenerateQR }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'excellent': 
        return { 
          color: 'text-emerald-600 bg-emerald-100 border-emerald-200', 
          text: 'Excelente',
          icon: <Star className="w-4 h-4" />
        };
      case 'good': 
        return { 
          color: 'text-blue-600 bg-blue-100 border-blue-200', 
          text: 'Operativo',
          icon: <CheckCircle className="w-4 h-4" />
        };
      case 'warning': 
        return { 
          color: 'text-amber-600 bg-amber-100 border-amber-200', 
          text: 'Advertencia',
          icon: <AlertCircle className="w-4 h-4" />
        };
      case 'critical': 
        return { 
          color: 'text-red-600 bg-red-100 border-red-200', 
          text: 'Crítico',
          icon: <AlertCircle className="w-4 h-4" />
        };
      default: 
        return { 
          color: 'text-slate-600 bg-slate-100 border-slate-200', 
          text: 'Desconocido',
          icon: <Minus className="w-4 h-4" />
        };
    }
  };

  const getQRStatusConfig = (status: string) => {
    switch (status) {
      case 'active': 
        return { 
          color: 'text-emerald-600 bg-emerald-100 border-emerald-200', 
          text: 'Activo',
          icon: <CheckCircle className="w-3 h-3" />
        };
      case 'expired': 
        return { 
          color: 'text-amber-600 bg-amber-100 border-amber-200', 
          text: 'Expirado',
          icon: <Clock className="w-3 h-3" />
        };
      case 'missing': 
        return { 
          color: 'text-red-600 bg-red-100 border-red-200', 
          text: 'Faltante',
          icon: <AlertCircle className="w-3 h-3" />
        };
      default: 
        return { 
          color: 'text-slate-600 bg-slate-100 border-slate-200', 
          text: 'Desconocido',
          icon: <Minus className="w-3 h-3" />
        };
    }
  };

  const statusConfig = getStatusConfig(health.status);
  const qrStatusConfig = getQRStatusConfig(health.qrCodeStatus);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-xl">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl lg:text-2xl font-bold text-slate-900">Estado del Comercio</h3>
            <p className="text-slate-600">Monitoreo en tiempo real</p>
          </div>
        </div>
        
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.8 }}
          className={`px-4 py-2 rounded-2xl font-semibold border flex items-center space-x-2 ${statusConfig.color}`}
        >
          {statusConfig.icon}
          <span>{statusConfig.text}</span>
        </motion.div>
      </div>

      <div className="space-y-6">
        {/* QR Code Status */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200/50"
        >
          <div className="flex items-center space-x-3">
            <QrCode className="w-5 h-5 text-slate-600" />
            <div>
              <p className="text-slate-700 font-semibold">Código QR</p>
              <p className="text-slate-500 text-sm">Estado de validación</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-xl text-sm font-semibold border flex items-center space-x-1 ${qrStatusConfig.color}`}>
            {qrStatusConfig.icon}
            <span>{qrStatusConfig.text}</span>
          </div>
        </motion.div>

        {/* QR Code Display */}
        {comercio?.qrCode ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="text-center p-6 bg-slate-50/80 rounded-2xl border border-slate-200/50"
          >
            <div className="relative inline-block mb-4">
              <Image
                src={comercio.qrCode}
                alt="QR Code"
                width={140}
                height={140}
                className="w-35 h-35 mx-auto rounded-2xl shadow-lg"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGenerateQR}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-slate-300 rounded-2xl font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-all duration-300"
              >
                {loading ? 'Regenerando...' : 'Regenerar'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = comercio.qrCode ?? '';
                  link.download = `qr-${comercio.nombreComercio}.png`;
                  link.click();
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl font-semibold hover:from-slate-700 hover:to-slate-800 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4" />
                <span>Descargar</span>
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 }}
            className="text-center p-6 bg-slate-50/80 rounded-2xl border border-slate-200/50"
          >
            <QrCode className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 font-semibold mb-4">No tienes código QR generado</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGenerateQR}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-2xl font-semibold hover:from-slate-700 hover:to-slate-800 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {loading ? 'Generando...' : 'Generar QR'}
            </motion.button>
          </motion.div>
        )}

        {/* Metrics Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="grid grid-cols-2 gap-4"
        >
          <div className="text-center p-4 bg-blue-50/80 rounded-2xl border border-blue-200/50">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
            <p className="text-blue-700 font-semibold mb-1">Beneficios Activos</p>
            <p className="text-blue-900 font-bold text-xl">
              {loading ? '...' : health.benefitsActive}
            </p>
          </div>

          <div className="text-center p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/50">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <p className="text-emerald-700 font-semibold mb-1">Validaciones Hoy</p>
            <p className="text-emerald-900 font-bold text-xl">
              {loading ? '...' : health.validationsToday}
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Main Component
const ComercioOverviewDashboard: React.FC<ComercioOverviewDashboardProps> = ({
  onNavigate
}) => {
  const { user } = useAuth();
  const { comercio, stats, loading: comercioLoading, generateQRCode } = useComercio();
  const { stats: beneficiosStats } = useBeneficios();
  
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculate comercio health
  const comercioHealth = useMemo<ComercioHealth>(() => {
    const qrCodeStatus = comercio?.qrCode ? 'active' : 'missing';
    const benefitsActive = beneficiosStats?.activos || 0;
    const validationsToday = stats?.validacionesHoy || 0;
    
    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    
    if (qrCodeStatus === 'missing' || benefitsActive === 0) {
      status = 'warning';
    } else if (validationsToday > 10 && benefitsActive > 3) {
      status = 'excellent';
    }

    return {
      status,
      qrCodeStatus,
      benefitsActive,
      validationsToday,
      responseTime: 120,
    };
  }, [comercio, beneficiosStats, stats]);

  // Fetch real-time activities from Firebase
  useEffect(() => {
    if (!user) return;

    const activitiesRef = collection(db, 'validaciones');
    const activitiesQuery = query(
      activitiesRef,
      where('comercioId', '==', user.uid),
      orderBy('fechaValidacion', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'validation_completed' as const,
          title: 'Validación completada',
          description: `Beneficio validado para ${data.socioNombre || 'cliente'}`,
          timestamp: data.fechaValidacion || Timestamp.now(),
          metadata: data
        };
      }) as ActivityLog[];
      
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const kpiMetrics = useMemo(() => [
    {
      title: 'Validaciones Hoy',
      value: stats?.validacionesHoy?.toLocaleString() || '0',
      icon: <Calendar className="w-6 h-6 lg:w-7 lg:h-7" />,
      gradient: 'from-blue-500 to-indigo-500',
      subtitle: 'Beneficios validados',
      onClick: () => onNavigate?.('validaciones'),
      loading: comercioLoading,
      delay: 0.1
    },
    {
      title: 'Validaciones del Mes',
      value: stats?.validacionesMes?.toLocaleString() || '0',
      icon: <TrendingUp className="w-6 h-6 lg:w-7 lg:h-7" />,
      gradient: 'from-emerald-500 to-teal-500',
      subtitle: 'Total mensual',
      onClick: () => onNavigate?.('analytics'),
      loading: comercioLoading,
      delay: 0.2
    },
    {
      title: 'Clientes Únicos',
      value: stats?.clientesUnicos?.toString() || '0',
      icon: <Users className="w-6 h-6 lg:w-7 lg:h-7" />,
      gradient: 'from-purple-500 to-pink-500',
      subtitle: 'Este mes',
      onClick: () => onNavigate?.('clientes'),
      loading: comercioLoading,
      delay: 0.3
    }
  ], [stats, comercioLoading, onNavigate]);

  const handleGenerateQR = async () => {
    await generateQRCode();
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* COMPONENTE DE DEBUG TEMPORAL */}
      <ValidacionesDebug />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-6 lg:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center space-x-4 lg:space-x-6 mb-4">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-3xl flex items-center justify-center shadow-2xl"
              >
                <BarChart3 className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-1">
                  Vista General
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 flex items-center">
                  <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
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
              className="w-12 h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
              >
                <RefreshCw className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {kpiMetrics.map((metric, index) => (
          <KPICard key={index} {...metric} />
        ))}
      </div>

      {/* Secondary Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2">
          <ActivityTimeline
            activities={activities}
            loading={loading}
            onViewAll={() => onNavigate?.('validaciones')}
          />
        </div>
        <div>
          <ComercioStatusCard
            health={comercioHealth}
            loading={comercioLoading}
            comercio={comercio ?? {}}
            onGenerateQR={handleGenerateQR}
          />
        </div>
      </div>

      {/* Performance Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-br from-blue-50/80 via-indigo-50/80 to-purple-50/80 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-blue-200/50 shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center space-x-4 lg:space-x-6">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-xl"
            >
              <Award className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-1">
                Rendimiento del Mes
              </h3>
              <p className="text-slate-600 lg:text-lg">
                Resumen de tu actividad comercial
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center">
              <motion.p 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9 }}
                className="text-3xl lg:text-4xl font-bold text-blue-600 mb-1"
              >
                {beneficiosStats?.activos || 0}
              </motion.p>
              <p className="text-sm text-slate-600 font-semibold">Beneficios Activos</p>
            </div>
            
            <div className="text-center">
              <motion.p 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1 }}
                className="text-3xl lg:text-4xl font-bold text-emerald-600 mb-1"
              >
                {stats?.validacionesMes || 0}
              </motion.p>
              <p className="text-sm text-slate-600 font-semibold">Validaciones</p>
            </div>
            
            <div className="text-center">
              <motion.p 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.1 }}
                className="text-3xl lg:text-4xl font-bold text-purple-600 mb-1"
              >
                {stats?.clientesUnicos || 0}
              </motion.p>
              <p className="text-sm text-slate-600 font-semibold">Clientes</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export { ComercioOverviewDashboard };