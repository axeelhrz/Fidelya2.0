'use client';

import React, { useState } from 'react';
import { 
  Gift, 
  History, 
  QrCode,
  TrendingUp,
  Store,
  Calendar,
  Award,
  Target,
  Zap,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SocioWelcomeCard } from './SocioWelcomeCard';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface SocioOverviewDashboardProps {
  onNavigate?: (section: string) => void;
  onLogout: () => void;
}

export const SocioOverviewDashboard: React.FC<SocioOverviewDashboardProps> = ({
  onNavigate,
  onLogout
}) => {
  const { socio, refreshData } = useSocioProfile();
  const { beneficiosUsados, estadisticasRapidas, refrescar } = useBeneficios();
  const [showWelcome,] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Calculate enhanced stats
  const stats = React.useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const beneficiosEsteMes = beneficiosUsados.filter(uso => {
      const fechaUso = uso.fechaUso.toDate();
      return fechaUso >= thisMonth;
    }).length;

    const comerciosUnicos = new Set(beneficiosUsados.map(uso => uso.comercioId)).size;
    
    const creadoEn = socio?.creadoEn?.toDate() || new Date();
    const diasComoSocio = differenceInDays(now, creadoEn);

    return {
      beneficiosDisponibles: estadisticasRapidas.disponibles,
      beneficiosUsados: estadisticasRapidas.usados,
      beneficiosEsteMes,
      comerciosUnicos,
      diasComoSocio
    };
  }, [beneficiosUsados, estadisticasRapidas, socio]);

  // Recent activity
  const recentActivity = React.useMemo(() => {
    return beneficiosUsados
      .sort((a, b) => b.fechaUso.toDate().getTime() - a.fechaUso.toDate().getTime())
      .slice(0, 3);
  }, [beneficiosUsados]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshData(), refrescar()]);
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const handleNavigation = (section: string) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Panel principal</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="p-2"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Welcome Card */}
        {showWelcome && (
          <SocioWelcomeCard
            user={{
              nombre: socio?.nombre || 'Socio',
              numeroSocio: socio?.numeroSocio,
              avatar: socio?.avatar || undefined
            }}
            onLogout={onLogout}
          />
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Gift size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.beneficiosDisponibles}</p>
                <p className="text-sm text-gray-600">Disponibles</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <History size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.beneficiosUsados}</p>
                <p className="text-sm text-gray-600">Usados</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Store size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.comerciosUnicos}</p>
                <p className="text-sm text-gray-600">Comercios</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Calendar size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{stats.beneficiosEsteMes}</p>
                <p className="text-sm text-gray-600">Este mes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => handleNavigation('validar')}
              className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors text-left"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <QrCode size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Escanear QR</h4>
                <p className="text-sm text-gray-600">Validar beneficios</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            <button
              onClick={() => handleNavigation('beneficios')}
              className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors text-left"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Gift size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Mis Beneficios</h4>
                <p className="text-sm text-gray-600">{stats.beneficiosDisponibles} disponibles</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            <button
              onClick={() => handleNavigation('historial')}
              className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 transition-colors text-left"
            >
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <History size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Historial</h4>
                <p className="text-sm text-gray-600">{stats.beneficiosUsados} usos</p>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Actividad Reciente</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleNavigation('historial')}
              >
                Ver todo
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>

            <div className="space-y-3">
              {recentActivity.map((uso) => (
                <div key={uso.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    <Award size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {uso.beneficioTitulo || 'Beneficio usado'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {uso.comercioNombre} • {format(uso.fechaUso.toDate(), 'dd MMM', { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-600">
                      ${uso.montoDescuento || 0}
                    </p>
                    <p className="text-xs text-gray-500">ahorrado</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <Target size={20} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tu Progreso</h3>
              <p className="text-sm text-gray-600">Llevas {stats.diasComoSocio} días como socio</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Beneficios este mes</span>
                <span className="text-sm font-bold text-gray-900">{stats.beneficiosEsteMes}/10</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.beneficiosEsteMes / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Meta mensual</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Comercios visitados</span>
                <span className="text-sm font-bold text-gray-900">{stats.comerciosUnicos}/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((stats.comerciosUnicos / 5) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Diversidad de uso</p>
            </div>
          </div>
        </div>

        {/* Tips Card */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Zap size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">💡 Consejo del día</h3>
              <p className="text-white/90 text-sm leading-relaxed mb-4">
                {stats.beneficiosDisponibles > 0 
                  ? 'Recuerda revisar la fecha de vencimiento de tus beneficios para no perder ninguna oportunidad de ahorro.'
                  : 'Mantente atento a las notificaciones para ser el primero en conocer los nuevos beneficios disponibles.'
                }
              </p>
              <div className="flex items-center gap-2 text-white/80 text-xs">
                <TrendingUp size={12} />
                <span>Actualizado hoy</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocioOverviewDashboard;