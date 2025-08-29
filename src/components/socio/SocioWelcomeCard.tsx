'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  TrendingUp, 
  Shield, 
  QrCode,
  Eye,
  LogOut
} from 'lucide-react';

interface SocioWelcomeCardProps {
  user: {
    nombre?: string;
    email?: string;
    role?: string;
  };
  socio?: {
    nombre?: string;
    numeroSocio?: string;
    estadoMembresia?: string;
    fechaVinculacion?: Date | { toDate: () => Date } | null;
  };
  stats: {
    totalBeneficios?: number;
    beneficiosUsados?: number;
    asociacionesActivas?: number;
    beneficiosEstesMes?: number;
  };
  onQuickScan: () => void;
  onViewProfile: () => void;
  onLogout: () => void;
}

const SocioWelcomeCard = memo<SocioWelcomeCardProps>(({ 
  user, 
  socio, 
  onQuickScan, 
  onViewProfile,
  onLogout
}) => {
  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case 'activo':
        return 'from-emerald-500 to-teal-500';
      case 'pendiente':
        return 'from-amber-500 to-orange-500';
      case 'suspendido':
        return 'from-red-500 to-rose-500';
      default:
        return 'from-blue-500 to-indigo-500';
    }
  };

  const getEstadoText = (estado?: string) => {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'pendiente':
        return 'Pendiente';
      case 'suspendido':
        return 'Suspendido';
      default:
        return 'Verificando';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-white/30 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl sm:shadow-2xl">
              <User className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <div className={`absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r ${getEstadoColor(socio?.estadoMembresia)} rounded-full border-2 sm:border-3 border-white shadow-lg flex items-center justify-center`}>
              <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
            </div>
          </div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-1 sm:mb-2"
            >
              Hola, {socio?.nombre || user?.nombre || 'Socio'}
            </motion.h1>
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
            >
              <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-600">
                Panel de beneficios y servicios
              </p>
              {socio?.numeroSocio && (
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1 rounded-full border border-blue-200">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                  <span className="text-xs sm:text-sm font-bold text-blue-700">
                    Socio #{socio.numeroSocio}
                  </span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onQuickScan}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl group text-sm sm:text-base"
          >
            <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Escanear QR</span>
          </motion.button>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 bg-gradient-to-r ${getEstadoColor(socio?.estadoMembresia).replace('from-', 'from-').replace('to-', 'to-').replace('-500', '-50').replace('-500', '-50')} px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border ${getEstadoColor(socio?.estadoMembresia).replace('from-', 'border-').replace('to-', '').replace('-500', '-200')}`}>
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span className="text-xs sm:text-sm font-medium text-emerald-700">
                {getEstadoText(socio?.estadoMembresia)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onViewProfile}
                className="p-2.5 sm:p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl sm:rounded-2xl transition-all duration-200"
                title="Ver perfil"
              >
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>

              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="p-2.5 sm:p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl sm:rounded-2xl transition-all duration-200"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

SocioWelcomeCard.displayName = 'SocioWelcomeCard';

export { SocioWelcomeCard };
export default SocioWelcomeCard;