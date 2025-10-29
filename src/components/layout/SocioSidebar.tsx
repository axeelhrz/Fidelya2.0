'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  QrCode, 
  Gift, 
  History,
  LogOut,
  Menu,
  X,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface SocioSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick: () => void;
  activeSection: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: number;
  mobileOnly?: boolean;
  desktopDisabled?: boolean;
}

// Componente de elemento de menú ultra-compacto
const MenuItemComponent = memo<{
  item: MenuItem;
  isActive: boolean;
  isOpen: boolean;
  isMobile: boolean;
  onClick: () => void;
}>(({ item, isActive, isOpen, isMobile, onClick }) => {
  // Si es desktop y el item está deshabilitado para desktop, mostrar deshabilitado
  if (!isMobile && item.desktopDisabled) {
    return (
      <div className={`
        w-full flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed text-sm
        ${!isOpen && 'lg:justify-center lg:px-2'}
      `}>
        <item.icon className="w-4 h-4" />
        {isOpen && (
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs">{item.label}</span>
            <Monitor className="w-3 h-3" />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-all duration-200 text-sm
        ${isActive 
          ? 'bg-blue-500 text-white shadow-sm' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
        ${!isOpen && 'lg:justify-center lg:px-2'}
      `}
    >
      <item.icon className="w-4 h-4 flex-shrink-0" />
      
      {isOpen && (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className="font-medium truncate">{item.label}</span>
          <div className="flex items-center gap-1">
            {item.badge !== undefined && item.badge > 0 && (
              <span className={`
                px-1.5 py-0.5 text-xs rounded-full min-w-[18px] text-center
                ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500 text-white'}
              `}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            {item.mobileOnly && <Smartphone className="w-3 h-3" />}
          </div>
        </div>
      )}
    </button>
  );
});

MenuItemComponent.displayName = 'MenuItemComponent';

// Header ultra-compacto
const SidebarHeader = memo<{
  userInfo: {
    name: string;
    initial: string;
  };
  isOpen: boolean;
  isMobile: boolean;
  onToggle: () => void;
}>(({ userInfo, isOpen, isMobile, onToggle }) => (
  <div className="px-3 py-3 border-b border-gray-100 flex-shrink-0">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">{userInfo.initial}</span>
        </div>
        
        {isOpen && (
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">
              {userInfo.name}
            </h2>
            <p className="text-xs text-blue-600 font-medium">
              Socio
            </p>
          </div>
        )}
      </div>
      
      <button
        onClick={onToggle}
        className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        {isMobile && isOpen ? <X className="w-4 h-4 text-gray-500" /> : <Menu className="w-4 h-4 text-gray-500" />}
      </button>
    </div>
  </div>
));

SidebarHeader.displayName = 'SidebarHeader';

// Sección de usuario ultra-compacta
const UserSection = memo<{
  isOpen: boolean;
  onLogoutClick: () => void;
}>(({ isOpen, onLogoutClick }) => (
  <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
    {isOpen ? (
      <button
        onClick={onLogoutClick}
        className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium text-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>Salir</span>
      </button>
    ) : (
      <button
        onClick={onLogoutClick}
        className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
        title="Cerrar Sesión"
      >
        <LogOut className="w-4 h-4" />
      </button>
    )}
  </div>
));

UserSection.displayName = 'UserSection';

const SocioSidebar: React.FC<SocioSidebarProps> = ({
  open,
  onToggle,
  onMenuClick,
  onLogoutClick,
  activeSection
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { socio, loading: socioLoading } = useSocioProfile();
  const { estadisticasRapidas } = useBeneficios();
  const { isMobile } = useDeviceDetection();

  // Elementos del menú ultra-simplificado
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'validar',
      label: 'Escanear QR',
      icon: QrCode,
      route: '/dashboard/socio/validar',
      mobileOnly: true,
      desktopDisabled: true
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
  ], [estadisticasRapidas.disponibles, estadisticasRapidas.usados]);

  // Handler de navegación optimizado
  const handleNavigation = useCallback((route: string, itemId: string) => {
    // Prevenir navegación a validar en desktop
    if (!isMobile && itemId === 'validar') {
      return;
    }

    if (pathname !== route) {
      router.push(route);
    }
    onMenuClick(itemId);
    
    // Auto-cerrar sidebar en móvil después de navegar
    if (isMobile) {
      onToggle();
    }
  }, [router, pathname, onMenuClick, isMobile, onToggle]);

  // Verificar si un elemento está activo
  const isActiveItem = useCallback((item: MenuItem) => {
    return pathname === item.route || activeSection === item.id;
  }, [pathname, activeSection]);

  // Información del usuario
  const userInfo = useMemo(() => ({
    name: socio?.nombre || user?.nombre || 'Socio',
    initial: (socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'
  }), [socio?.nombre, user?.nombre]);

  // Loading skeleton ultra-compacto
  if (socioLoading) {
    return (
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300
        ${open ? 'w-64' : 'w-0 lg:w-16'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-3 space-y-2">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded-lg mb-3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop móvil */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden transition-all duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar principal ultra-compacto */}
      <div className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300
        ${open ? 'w-64' : 'w-0 lg:w-16'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        {/* Header */}
        <SidebarHeader
          userInfo={userInfo}
          isOpen={open}
          isMobile={isMobile}
          onToggle={onToggle}
        />

        {/* Navegación ultra-compacta */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto min-h-0">
          {menuItems.map((item) => (
            <MenuItemComponent
              key={item.id}
              item={item}
              isActive={isActiveItem(item)}
              isOpen={open}
              isMobile={isMobile}
              onClick={() => handleNavigation(item.route, item.id)}
            />
          ))}
        </nav>

        {/* Stats ultra-compactas */}
        {open && estadisticasRapidas.disponibles > 0 && (
          <div className="px-3 py-2 border-t border-gray-100">
            <div className="bg-green-50 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-green-800">
                  {estadisticasRapidas.disponibles} disponibles
                </span>
                <Gift className="w-3 h-3 text-green-600" />
              </div>
            </div>
          </div>
        )}

        {/* Mensaje informativo para desktop - ultra-compacto */}
        {!isMobile && open && (
          <div className="px-3 py-2 border-t border-gray-100">
            <div className="bg-amber-50 rounded-lg p-2">
              <p className="text-xs text-amber-700 text-center">
                📱 QR solo en móvil
              </p>
            </div>
          </div>
        )}

        {/* Sección de usuario */}
        <UserSection
          isOpen={open}
          onLogoutClick={onLogoutClick}
        />
      </div>
    </>
  );
};

export { SocioSidebar };
export default SocioSidebar;