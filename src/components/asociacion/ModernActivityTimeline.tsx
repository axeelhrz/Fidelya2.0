'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Users,
  DollarSign,
  Shield,
  Activity,
  AlertCircle,
  Clock,
  Eye
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

interface ModernActivityTimelineProps {
  activities: ActivityLog[];
  loading: boolean;
  onViewAll?: () => void;
}

const ModernActivityTimelineComponent: React.FC<ModernActivityTimelineProps> = ({ 
  activities, 
  loading, 
  onViewAll 
}) => {
  const getActivityIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'member_added':
        return <UserPlus className="w-6 h-6" />;
      case 'member_updated':
        return <Users className="w-6 h-6" />;
      case 'payment_received':
        return <DollarSign className="w-6 h-6" />;
      case 'backup_completed':
        return <Shield className="w-6 h-6" />;
      case 'import_completed':
        return <Activity className="w-6 h-6" />;
      case 'system_alert':
        return <AlertCircle className="w-6 h-6" />;
      default:
        return <Activity className="w-6 h-6" />;
    }
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

  const displayActivities = useMemo(() => activities.slice(0, 5), [activities]);

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
          {displayActivities.map((activity, index) => (
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

ModernActivityTimelineComponent.displayName = 'ModernActivityTimelineComponent';

const ModernActivityTimeline = memo(ModernActivityTimelineComponent);
ModernActivityTimeline.displayName = 'ModernActivityTimeline';

export default ModernActivityTimeline;