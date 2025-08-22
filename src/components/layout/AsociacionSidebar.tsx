'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { 
  Home, 
  Users, 
  Store, 
  LogOut,
  Building2,
  Bell,
  Settings,
  TrendingUp,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocios } from '@/hooks/useSocios';
import { useComercios } from '@/hooks/useComercios';

interface AsociacionSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick: () => void;
  activeSection: string;
  isMobile?: boolean;
}

interface RealtimeStats {
  totalSocios: number;
  sociosActivos: number;
  sociosVencidos: number;
  totalComercios: number;
  comerciosActivos: number;
  ingresosMensuales: number;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isNew?: boolean;
  description?: string;
  color: string;
  priority?: number;
}

interface ConsolidatedStats {
  totalSocios: number;
  sociosActivos: number;
  sociosVencidos: number;
  sociosAlDia: number;
  totalComercios: number;
  comerciosActivos: number;
  ingresosMensuales: number;
}

// Componente de estadísticas ultra optimizado
const OptimizedStatsCards = memo<{
  realtimeStats: RealtimeStats;
  consolidatedStats: ConsolidatedStats;
  isLoadingStats: boolean;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number) => string;
}>(({ realtimeStats, isLoadingStats, formatNumber, formatCurrency }) => (
  <div className="px-6 py-4 border-b border-gray-100">
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-blue-900">
              {isLoadingStats ? '...' : formatNumber(realtimeStats.totalSocios)}
            </p>
            <p className="text-xs text-blue-600 font-medium">Socios</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 border border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-emerald-500 rounded-lg">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-emerald-900">
              {isLoadingStats ? '...' : formatNumber(realtimeStats.comerciosActivos)}
            </p>
            <p className="text-xs text-emerald-600 font-medium">Comercios</p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Enhanced Activity Summary */}
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">Sistema Optimizado</span>
        </div>
        <div className="flex items-center space-x-1">
          <Zap className="w-3 h-3 text-yellow-500" />
          <span className="text-xs text-yellow-600 font-medium">100%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900">
            {isLoadingStats ? '...' : formatNumber(realtimeStats.sociosActivos)}
          </p>
          <p className="text-xs text-gray-600">Socios Activos</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">
            {isLoadingStats ? '...' : formatNumber(realtimeStats.comerciosActivos)}
          </p>
          <p className="text-xs text-gray-600">Comercios Activos</p>
        </div>
      </div>

      {/* Revenue indicators */}
      {realtimeStats.ingresosMensuales > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Ingresos del mes</span>
            <span className="text-sm font-bold text-green-700">
              {formatCurrency(realtimeStats.ingresosMensuales)}
            </span>
          </div>
        </div>
      )}
    </div>
  </div>
));

OptimizedStatsCards.displayName = 'OptimizedStatsCards';

// Componente de elemento de menú ultra optimizado
const OptimizedMenuItemComponent = memo<{
  item: MenuItem;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
  formatNumber: (num: number) => string;
}>(({ item, isActive, isOpen, onClick, formatNumber }) => (
  <button
    onClick={onClick}
    className={`
      group w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-200 ease-out
      ${isActive 
        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-md border border-blue-200 scale-[1.02]' 
        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:scale-[1.01]'
      }
      ${!isOpen && 'justify-center px-3'}
    `}
  >
    <div className={`
      relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200
      ${isActive 
        ? `bg-gradient-to-br ${item.color} shadow-lg` 
        : 'bg-gray-100 group-hover:bg-gray-200'
      }
    `}>
      <item.icon className={`w-5 h-5 transition-colors duration-200 ${
        isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-700'
      }`} />
      
      {item.isNew && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
      )}
    </div>
    
    {isOpen && (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm truncate">{item.label}</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
          </div>
          
          {item.badge !== undefined && item.badge > 0 && (
            <div className={`
              inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold min-w-[24px] transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'bg-gray-200 text-gray-700 group-hover:bg-gray-300'
              }
            `}>
              {item.badge > 99 ? '99+' : formatNumber(item.badge)}
            </div>
          )}
        </div>
      </div>
    )}
  </button>
));

OptimizedMenuItemComponent.displayName = 'OptimizedMenuItemComponent';

export const AsociacionSidebar: React.FC<AsociacionSidebarProps> = memo(({
  open,
  onToggle,
  onMenuClick,
  onLogoutClick,
  activeSection,
  isMobile = false
}) => {
  const { user, signOut } = useAuth();
  const { stats: sociosStats, loading: sociosLoading } = useSocios();
  const { stats: comerciosStats, loading: comerciosLoading } = useComercios();

  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats>({
    totalSocios: 0,
    sociosActivos: 0,
    sociosVencidos: 0,
    totalComercios: 0,
    comerciosActivos: 0,
    ingresosMensuales: 0
  });

  // Calcular estadísticas consolidadas - memoizado
  const consolidatedStats = useMemo(() => {
    return {
      totalSocios: sociosStats?.total || 0,
      sociosActivos: sociosStats?.activos || 0,
      sociosVencidos: sociosStats?.vencidos || 0,
      sociosAlDia: typeof sociosStats?.alDia === 'number' ? sociosStats.alDia : 0,
      totalComercios: comerciosStats?.totalComercios || 0,
      comerciosActivos: comerciosStats?.comerciosActivos || 0,
      ingresosMensuales: sociosStats?.ingresosMensuales || 0,
    };
  }, [sociosStats, comerciosStats]);

  // Configuración de menú memoizada - SIN Beneficios y Analytics
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Vista general',
      color: 'from-blue-500 to-blue-600',
      priority: 1
    },
    {
      id: 'socios',
      label: 'Socios',
      icon: Users,
      badge: consolidatedStats.totalSocios,
      description: `${consolidatedStats.sociosActivos} activos`,
      color: 'from-emerald-500 to-emerald-600',
      priority: 2
    },
    {
      id: 'comercios',
      label: 'Comercios',
      icon: Store,
      badge: consolidatedStats.comerciosActivos,
      description: `${consolidatedStats.comerciosActivos} afiliados`,
      color: 'from-purple-500 to-purple-600',
      priority: 3
    }
  ], [consolidatedStats]);

  // Actualizar estadísticas en tiempo real - optimizado
  useEffect(() => {
    setRealtimeStats(prev => ({
      ...prev,
      totalSocios: consolidatedStats.totalSocios,
      sociosActivos: consolidatedStats.sociosActivos,
      sociosVencidos: consolidatedStats.sociosVencidos,
      totalComercios: consolidatedStats.totalComercios,
      comerciosActivos: consolidatedStats.comerciosActivos,
      ingresosMensuales: consolidatedStats.ingresosMensuales
    }));
  }, [consolidatedStats]);

  // Verificar si un item está activo - memoizado
  const isActiveItem = useCallback((item: MenuItem) => {
    return activeSection === item.id;
  }, [activeSection]);

  // Handler de navegación ultra optimizado - NO ROUTING
  const handleMenuClick = useCallback((itemId: string) => {
    // Solo cambiar estado, sin navegación
    onMenuClick(itemId);
    
    // Auto-cerrar en mobile
    if (isMobile) {
      onToggle();
    }
  }, [onMenuClick, onToggle, isMobile]);

  // Handler de logout optimizado
  const handleLogout = useCallback(async () => {
    if (onLogoutClick) {
      onLogoutClick();
    } else {
      try {
        await signOut();
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  }, [onLogoutClick, signOut]);

  // Indicador de carga
  const isLoadingStats = sociosLoading || comerciosLoading;

  // Formatear números grandes - memoizado
  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  }, []);

  // Formatear moneda - memoizado
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header optimizado */}
      <div className="relative px-6 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm">
                {isLoadingStats && (
                  <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
            
            {open && (
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {user?.nombre || 'Asociación'}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    <Zap className="w-3 h-3 mr-1" />
                    Optimizado
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            {open ? (
              <X className="w-5 h-5 text-gray-500" />
            ) : (
              <Menu className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {open && (
        <OptimizedStatsCards
          realtimeStats={realtimeStats}
          consolidatedStats={consolidatedStats}
          isLoadingStats={isLoadingStats}
          formatNumber={formatNumber}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <OptimizedMenuItemComponent
            key={item.id}
            item={item}
            isActive={isActiveItem(item)}
            isOpen={open}
            onClick={() => handleMenuClick(item.id)}
            formatNumber={formatNumber}
          />
        ))}
      </nav>

      {/* Quick Actions */}
      {open && (
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => handleMenuClick('notificaciones')}
              className="flex items-center justify-center space-x-2 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300"
            >
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">Alertas</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 px-3 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-gray-300">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">Config</span>
            </button>
          </div>
        </div>
      )}

      {/* User Profile & Logout */}
      <div className="px-4 py-4 border-t border-gray-100">
        {open ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {user?.nombre?.charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.nombre || 'Administrador'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@asociacion.com'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Cerrar Sesión</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors duration-200"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
});

AsociacionSidebar.displayName = 'AsociacionSidebar';

export default AsociacionSidebar;