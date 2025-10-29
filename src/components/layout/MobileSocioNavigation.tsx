'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home,
  QrCode, 
  Gift, 
  History,
  User,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  route: string;
  badge?: number;
}

interface MobileSocioNavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

export const MobileSocioNavigation: React.FC<MobileSocioNavigationProps> = ({
  activeSection,
  onSectionChange,
  onLogout
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { socio } = useSocioProfile();
  const { estadisticasRapidas } = useBeneficios();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation items
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Inicio',
      icon: Home,
      route: '/dashboard/socio',
    },
    {
      id: 'validar',
      label: 'Escanear',
      icon: QrCode,
      route: '/dashboard/socio/validar',
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      route: '/dashboard/socio/beneficios',
      badge: estadisticasRapidas.disponibles
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      route: '/dashboard/socio/historial',
      badge: estadisticasRapidas.usados
    }
  ];

  const sidebarItems: NavigationItem[] = [
    ...navigationItems,
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: User,
      route: '/dashboard/socio/perfil',
    }
  ];

  const handleNavigation = useCallback((item: NavigationItem) => {
    if (pathname !== item.route) {
      router.push(item.route);
    }
    onSectionChange(item.id);
    setSidebarOpen(false);
  }, [router, pathname, onSectionChange]);

  const handleLogout = useCallback(() => {
    setSidebarOpen(false);
    onLogout();
  }, [onLogout]);

  const userInfo = {
    name: socio?.nombre || user?.nombre || 'Socio',
    initial: (socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S',
    status: socio?.estado || 'activo'
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">{userInfo.initial}</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{userInfo.name}</h1>
            <p className="text-xs text-blue-600 font-medium">Socio</p>
          </div>
        </div>
        
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Bottom Navigation - Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const isActive = activeSection === item.id || pathname === item.route;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 min-w-0 flex-1",
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <div className="relative">
                  <Icon size={20} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-full">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={cn(
        "lg:hidden fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Menú</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">{userInfo.initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{userInfo.name}</h3>
              <p className="text-sm text-blue-600 font-medium">Socio</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  userInfo.status === 'activo' ? "bg-green-500" : "bg-amber-500"
                )} />
                <span className="text-xs text-gray-500 capitalize">{userInfo.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-4 space-y-2">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.id || pathname === item.route;
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                  isActive 
                    ? "bg-blue-500 text-white shadow-md" 
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon size={20} />
                <span className="font-medium flex-1">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full font-bold",
                      isActive ? "bg-white/20 text-white" : "bg-blue-500 text-white"
                    )}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <ChevronRight size={16} className="opacity-50" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Stats Section */}
        {estadisticasRapidas.disponibles > 0 && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Beneficios disponibles</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticasRapidas.disponibles}</p>
                </div>
                <Gift size={24} className="text-green-500" />
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileSocioNavigation;