'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  TrendingUp, 
  Users, 
  Gift, 
  UserCheck,
  LogOut,
  Zap
} from 'lucide-react';

interface ComercioWelcomeCardProps {
  user: {
    nombre?: string;
    // Add other user properties as needed
  };
  comercio?: {
    nombreComercio?: string;
    // Add other comercio properties as needed
  };
  stats?: {
    validacionesHoy?: number;
    beneficiosActivos?: number;
    clientesUnicos?: number;
    qrEscaneos?: number;
    validacionesMes?: number;
  };
  onQuickAction?: (action: string) => void;
  onViewProfile?: () => void;
  onLogout?: () => void;
}

// Stats card component
const StatsCard = memo<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  gradient: string;
  trend?: string;
}>(({ icon: Icon, label, value, gradient, trend }) => (
  <motion.div 
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-lg border border-white/10`}
    whileHover={{ scale: 1.02 }}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-white/20 rounded-xl">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
    <p className="text-sm opacity-90 font-medium">{label}</p>
    {trend && (
      <p className="text-xs opacity-75 mt-1">{trend}</p>
    )}
  </motion.div>
));

StatsCard.displayName = 'StatsCard';

export const ComercioWelcomeCard = memo<ComercioWelcomeCardProps>(({
  user,
  comercio,
  stats = {},
  onQuickAction,
  onViewProfile,
  onLogout
}) => {
  // Get current time for greeting
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Buenos días' : currentHour < 18 ? 'Buenas tardes' : 'Buenas noches';

  // Memoized stats cards
  const statsCards = useMemo(() => [
    {
      icon: UserCheck,
      label: 'Validaciones Hoy',
      value: stats.validacionesHoy || 0,
      gradient: 'from-blue-500 to-indigo-500',
      trend: 'Actividad diaria'
    },
    {
      icon: Gift,
      label: 'Beneficios Activos',
      value: stats.beneficiosActivos || 0,
      gradient: 'from-emerald-500 to-teal-500',
      trend: 'Ofertas disponibles'
    },
    {
      icon: Users,
      label: 'Clientes Únicos',
      value: stats.clientesUnicos || 0,
      gradient: 'from-purple-500 to-pink-500',
      trend: 'Base de clientes'
    },
    {
      icon: TrendingUp,
      label: 'Este Mes',
      value: stats.validacionesMes || 0,
      gradient: 'from-amber-500 to-orange-500',
      trend: 'Validaciones totales'
    }
  ], [stats]);

  // Handlers for button clicks
  const handleProfileClick = () => {
    console.log('Profile button clicked'); // Debug log
    if (onViewProfile) {
      onViewProfile();
    }
  };

  const handleBeneficiosClick = () => {
    console.log('Beneficios button clicked'); // Debug log
    if (onQuickAction) {
      onQuickAction('beneficios');
    }
  };

  const handleLogoutClick = () => {
    console.log('Logout button clicked'); // Debug log
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-xl border border-slate-200/50 p-6 lg:p-8 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -translate-y-20 translate-x-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full translate-y-16 -translate-x-16" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Welcome Section */}
          <div className="flex items-center space-x-4 lg:space-x-6">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="relative"
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center shadow-2xl">
                <Store className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white shadow-lg"
              />
            </motion.div>
            
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl lg:text-4xl font-bold text-slate-900 mb-1"
              >
                {greeting}, {comercio?.nombreComercio || user?.nombre || 'Comercio'}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-base lg:text-lg text-slate-600 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2 text-emerald-500" />
                Panel de control optimizado para tu negocio
              </motion.p>
            </div>
          </div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-3"
          >
            {/* Profile Button (Casa/Home) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleProfileClick}
              className="w-12 h-12 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-200 shadow-lg hover:shadow-xl"
              title="Ver Perfil"
            >
              <Store className="w-5 h-5" />
            </motion.button>
            
            {/* Beneficios Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBeneficiosClick}
              className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-xl hover:shadow-2xl"
              title="Gestionar Beneficios"
            >
              <Gift className="w-5 h-5" />
              <span className="hidden sm:inline">Beneficios</span>
              <span className="sm:hidden">Ofertas</span>
            </motion.button>

            {/* Logout Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogoutClick}
              className="w-12 h-12 bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl flex items-center justify-center text-red-600 hover:text-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <StatsCard {...stat} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
});

ComercioWelcomeCard.displayName = 'ComercioWelcomeCard';

export default ComercioWelcomeCard;