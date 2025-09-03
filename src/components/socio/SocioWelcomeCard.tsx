'use client';

import React, { useState } from 'react';
import { 
  LogOut, 
  X, 
  Sparkles,
  Award,
  Gift,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SocioWelcomeCardProps {
  onLogout: () => void;
  onNavigate?: (section: string) => void;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export const SocioWelcomeCard: React.FC<SocioWelcomeCardProps> = ({
  onLogout,
  onNavigate,
  onDismiss,
  showDismiss = true
}) => {
  const { user } = useAuth();
  const { socio } = useSocioProfile();
  const { estadisticasRapidas } = useBeneficios();
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const handleViewBeneficios = () => {
    if (onNavigate) {
      onNavigate('beneficios');
    }
  };

  if (!isVisible) return null;

  const userInfo = {
    name: socio?.nombre || user?.nombre || 'Socio',
    initial: (socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S',
    status: socio?.estado || 'activo',
    numeroSocio: socio?.numeroSocio || '',
    email: socio?.email || user?.email || ''
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-500';
      case 'vencido':
        return 'bg-amber-500';
      case 'pendiente':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'vencido':
        return 'Vencido';
      case 'pendiente':
        return 'Pendiente';
      default:
        return 'Inactivo';
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
      
      {/* Dismiss button */}
      {showDismiss && (
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-colors duration-200"
        >
          <X size={16} className="text-white/80" />
        </button>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
            <span className="text-2xl font-bold text-white">{userInfo.initial}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-yellow-300" />
              <h2 className="text-xl font-bold text-white">
                {getGreeting()}, {userInfo.name}!
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-white/90 text-sm font-medium">
                Socio #{userInfo.numeroSocio}
              </span>
              <div className="flex items-center gap-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor(userInfo.status)
                )} />
                <span className="text-white/80 text-xs font-medium">
                  {getStatusText(userInfo.status)}
                </span>
              </div>
            </div>

            <p className="text-white/80 text-sm">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: es })}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Gift size={16} className="text-white/80" />
              <span className="text-white/80 text-xs font-medium">Disponibles</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {estadisticasRapidas.disponibles}
            </div>
          </div>

          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-white/80" />
              <span className="text-white/80 text-xs font-medium">Usados</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {estadisticasRapidas.usados}
            </div>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 mb-6">
          <p className="text-white/90 text-sm leading-relaxed">
            {estadisticasRapidas.disponibles > 0 
              ? `Tienes ${estadisticasRapidas.disponibles} beneficios disponibles para usar. ¡Aprovecha tus descuentos exclusivos!`
              : 'Mantente atento a nuevos beneficios que estarán disponibles pronto.'
            }
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {estadisticasRapidas.disponibles > 0 && (
            <Button
              onClick={handleViewBeneficios}
              variant="outline"
              className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
            >
              <Gift size={16} className="mr-2" />
              Ver Beneficios
              <ChevronRight size={16} className="ml-auto" />
            </Button>
          )}
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-red-500/20 border-red-300/50 text-white hover:bg-red-500/30 backdrop-blur-sm"
          >
            <LogOut size={16} className="mr-2" />
            Cerrar Sesión
          </Button>
        </div>

        {/* User Info Footer */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <div className="flex items-center justify-between text-white/70 text-xs">
            <span>Conectado como: {userInfo.email}</span>
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>Hoy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocioWelcomeCard;