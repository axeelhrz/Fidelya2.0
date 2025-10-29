'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical';
  lastBackup: Date | null;
  storageUsed: number;
  storageLimit: number;
  uptime: number;
  responseTime: number;
}

interface ModernSystemStatusCardProps {
  health: SystemHealth;
  loading: boolean;
}

const ModernSystemStatusCard = memo<ModernSystemStatusCardProps>(({ health, loading }) => {
  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'excellent': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'good': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'warning': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  }, []);

  const getStatusText = useMemo(() => (status: string) => {
    switch (status) {
      case 'excellent': return 'Excelente';
      case 'good': return 'Operativo';
      case 'warning': return 'Advertencia';
      case 'critical': return 'Crítico';
      default: return 'Desconocido';
    }
  }, []);

  const storagePercentage = useMemo(() => 
    (health.storageUsed / health.storageLimit) * 100, 
    [health.storageUsed, health.storageLimit]
  );

  const uptimeGradient = useMemo(() => {
    if (health.uptime > 99) return 'from-emerald-500 to-teal-500';
    if (health.uptime > 95) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  }, [health.uptime]);

  const storageGradient = useMemo(() => {
    if (storagePercentage > 80) return 'from-red-500 to-pink-500';
    if (storagePercentage > 60) return 'from-amber-500 to-orange-500';
    return 'from-emerald-500 to-teal-500';
  }, [storagePercentage]);

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
              className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${uptimeGradient}`}
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
              className={`h-3 rounded-full transition-all duration-500 bg-gradient-to-r ${storageGradient}`}
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
});

ModernSystemStatusCard.displayName = 'ModernSystemStatusCard';

export default ModernSystemStatusCard;
