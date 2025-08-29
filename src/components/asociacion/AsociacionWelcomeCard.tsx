'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Store, 
  TrendingUp, 
  LogOut,
  Bell,
  Settings,
  Activity,
  Zap,
  Crown
} from 'lucide-react';

interface User {
  uid?: string;
  nombre?: string;
  email?: string;
  role?: string;
}

interface AsociacionData {
  id?: string;
  nombre?: string;
  descripcion?: string;
  logo?: string;
  email?: string;
  telefono?: string;
  totalSocios?: number;
  totalComercios?: number;
  totalBeneficios?: number;
}

interface AsociacionStats {
  totalSocios: number;
  sociosActivos: number;
  sociosVencidos: number;
  totalComercios: number;
  comerciosActivos: number;
  ingresosMensuales: number;
}

interface AsociacionWelcomeCardProps {
  user: User;
  asociacion?: AsociacionData;
  stats: AsociacionStats;
  onQuickAction: (action: string) => void;
  onViewProfile?: () => void;
  onLogout: () => void;
}

// Componente de estadística individual
const StatCard = memo<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  change?: number;
  color: string;
  onClick?: () => void;
}>(({ icon: Icon, label, value, change, color, onClick }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      bg-gradient-to-br ${color} rounded-2xl p-4 cursor-pointer
      border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300
      backdrop-blur-sm
    `}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-white/20 rounded-xl">
        <Icon className="w-5 h-5 text-white" />
      </div>
      {change !== undefined && (
        <div className={`text-xs font-medium px-2 py-1 rounded-full ${
          change >= 0 ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
        }`}>
          {change >= 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-white mb-1">
      {value.toLocaleString()}
    </div>
    <div className="text-white/80 text-sm font-medium">
      {label}
    </div>
  </motion.div>
));

StatCard.displayName = 'StatCard';

// Componente de acción rápida
const QuickActionButton = memo<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}>(({ icon: Icon, label, description, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`
      group relative overflow-hidden bg-gradient-to-br ${color} 
      rounded-2xl p-4 text-left transition-all duration-300
      border border-white/20 shadow-lg hover:shadow-xl
      backdrop-blur-sm
    `}
  >
    <div className="relative z-10">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/20 rounded-xl">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-white font-semibold text-sm">{label}</div>
          <div className="text-white/70 text-xs">{description}</div>
        </div>
      </div>
    </div>
    
    {/* Hover effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 
                    transform -skew-x-12 group-hover:animate-pulse" />
  </motion.button>
));

QuickActionButton.displayName = 'QuickActionButton';

export const AsociacionWelcomeCard: React.FC<AsociacionWelcomeCardProps> = memo(({
  user,
  asociacion,
  stats,
  onQuickAction,
  onViewProfile,
  onLogout
}) => {
  // Formatear números grandes


  // Calcular cambios porcentuales (simulados para demo)
  const sociosChange = useMemo(() => Math.random() * 20 - 10, []);
  const comerciosChange = useMemo(() => Math.random() * 15 - 5, []);

  // Obtener saludo basado en la hora
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-100/50 
                 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl 
                 overflow-hidden relative"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-2xl" />

      <div className="relative z-10 p-6 lg:p-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          {/* User Info */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 
                            rounded-2xl flex items-center justify-center shadow-lg">
                {asociacion?.logo ? (
                  <img 
                    src={asociacion.logo} 
                    alt="Logo" 
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 
                            rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                <Crown className="w-3 h-3 text-white" />
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-700 
                             bg-clip-text text-transparent">
                  {getGreeting()}, {user.nombre || 'Administrador'}
                </h1>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold 
                              bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200">
                  <Zap className="w-3 h-3 mr-1" />
                  Asociación
                </div>
              </div>
              <p className="text-slate-600 text-lg">
                {asociacion?.nombre || 'Panel de Administración'}
              </p>
              {asociacion?.descripcion && (
                <p className="text-slate-500 text-sm mt-1 max-w-md">
                  {asociacion.descripcion}
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onQuickAction('notificaciones')}
              className="p-3 bg-white/80 hover:bg-white border border-gray-200 rounded-2xl 
                       shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <Bell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </motion.button>

            {onViewProfile && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onViewProfile}
                className="p-3 bg-white/80 hover:bg-white border border-gray-200 rounded-2xl 
                         shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Settings className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 
                       text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 
                       font-medium group"
            >
              <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </motion.button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Socios Totales"
            value={stats.totalSocios}
            change={sociosChange}
            color="from-blue-500 to-blue-600"
            onClick={() => onQuickAction('socios')}
          />
          <StatCard
            icon={Activity}
            label="Socios Activos"
            value={stats.sociosActivos}
            color="from-emerald-500 to-emerald-600"
            onClick={() => onQuickAction('socios')}
          />
          <StatCard
            icon={Store}
            label="Comercios"
            value={stats.comerciosActivos}
            change={comerciosChange}
            color="from-purple-500 to-purple-600"
            onClick={() => onQuickAction('comercios')}
          />
          <StatCard
            icon={TrendingUp}
            label="Ingresos"
            value={stats.ingresosMensuales}
            color="from-orange-500 to-orange-600"
            onClick={() => onQuickAction('analytics')}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            icon={Users}
            label="Gestionar Socios"
            description="Agregar y administrar miembros"
            color="from-blue-500 to-blue-600"
            onClick={() => onQuickAction('socios')}
          />
          <QuickActionButton
            icon={Store}
            label="Red de Comercios"
            description="Administrar comercios afiliados"
            color="from-purple-500 to-purple-600"
            onClick={() => onQuickAction('comercios')}
          />
          <QuickActionButton
            icon={Bell}
            label="Notificaciones"
            description="Centro de comunicaciones"
            color="from-red-500 to-red-600"
            onClick={() => onQuickAction('notificaciones')}
          />
          <QuickActionButton
            icon={TrendingUp}
            label="Dashboard"
            description="Vista general del sistema"
            color="from-emerald-500 to-emerald-600"
            onClick={() => onQuickAction('dashboard')}
          />
        </div>

        {/* Status Indicator */}
        <div className="flex items-center justify-center mt-6 pt-6 border-t border-gray-200/50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Sistema operativo y optimizado</span>
            <div className="w-1 h-1 bg-slate-400 rounded-full mx-2" />
            <span>Última actualización: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

AsociacionWelcomeCard.displayName = 'AsociacionWelcomeCard';