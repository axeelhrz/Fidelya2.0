'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  QrCode, 
  Gift, 
  History,
  LogOut,
  ChevronRight,
  Menu,
  Sparkles,
  Smartphone,
  Monitor,
  X
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
  description?: string;
  mobileOnly?: boolean;
  desktopDisabled?: boolean;
}

// Componente de elemento de menú memoizado
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
        w-full flex items-center space-x-3 px-3 py-3 rounded-2xl text-left bg-gray-100 text-gray-400 cursor-not-allowed
        ${!isOpen && 'lg:justify-center lg:px-2'}
      `}>
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gray-200">
          <item.icon className="w-5 h-5 text-gray-400" />
        </div>
        
        {isOpen && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold truncate">{item.label}</span>
              <Monitor className="w-3 h-3 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 truncate font-medium">Solo móvil</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        group w-full flex items-center space-x-3 px-3 py-3 rounded-2xl text-left transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50 shadow-lg transform scale-[1.02]' 
          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md hover:scale-[1.01]'
        }
        ${!isOpen && 'lg:justify-center lg:px-2'}
      `}
    >
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300
        ${isActive 
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
          : 'text-gray-500 group-hover:bg-gradient-to-r group-hover:from-blue-100 group-hover:to-purple-100 group-hover:text-blue-600'
        }
      `}>
        <item.icon className="w-5 h-5" />
      </div>
      
      {isOpen && (
        <>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="font-bold truncate">{item.label}</span>
              {item.mobileOnly && (
                <Smartphone className="w-3 h-3 text-blue-500" />
              )}
            </div>
            {item.description && (
              <p className="text-xs text-gray-500 truncate font-medium">{item.description}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {item.badge !== undefined && item.badge > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-black text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full min-w-[20px] shadow-lg">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
            <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
              isActive ? 'text-blue-600 transform rotate-90' : 'text-gray-400 group-hover:text-blue-500'
            }`} />
          </div>
        </>
      )}
    </button>
  );
});

MenuItemComponent.displayName = 'MenuItemComponent';

// Header del sidebar memoizado
const SidebarHeader = memo<{
  userInfo: {
    name: string;
    initial: string;
  };
  isOpen: boolean;
  isMobile: boolean;
  onToggle: () => void;
}>(({ userInfo, isOpen, isMobile, onToggle }) => (
  <div className="px-4 py-4 border-b border-gray-100/50 flex-shrink-0">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">{userInfo.initial}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-2 border-white shadow-lg">
            <div className="w-full h-full bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {isOpen && (
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-gray-900 truncate">
              {userInfo.name}
            </h2>
            <p className="text-sm text-blue-600 font-bold">
              Socio Activo
            </p>
          </div>
        )}
      </div>
      
      <button
        onClick={onToggle}
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
      >
        {isMobile && isOpen ? <X className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
      </button>
    </div>
  </div>
));

SidebarHeader.displayName = 'SidebarHeader';

// Sección de usuario memoizada
const UserSection = memo<{
  userInfo: {
    name: string;
    initial: string;
  };
  isOpen: boolean;
  onLogoutClick: () => void;
}>(({ userInfo, isOpen, onLogoutClick }) => (
  <div className="px-3 py-4 border-t border-gray-100/50 flex-shrink-0">
    {isOpen ? (
      <div className="space-y-3">
        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-sm">
              {userInfo.initial}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {userInfo.name}
            </p>
            <p className="text-xs text-gray-500 truncate font-medium">
              Socio Activo
            </p>
          </div>
          <div className="flex items-center space-x-1">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
        </div>
        
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-2xl transition-all duration-300 border border-red-200/50 hover:border-red-300 hover:shadow-lg font-bold"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    ) : (
      <button
        onClick={onLogoutClick}
        className="w-full flex items-center justify-center p-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-2xl transition-all duration-300 hover:shadow-lg"
        title="Cerrar Sesión"
      >
        <LogOut className="w-5 h-5" />
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

  // Elementos del menú ultra-simplificado - Solo 3 opciones esenciales
  const menuItems: MenuItem[] = useMemo(() => [
    {
      id: 'validar',
      label: 'Escanear QR',
      icon: QrCode,
      route: '/dashboard/socio/validar',
      description: 'Validar beneficios',
      mobileOnly: true,
      desktopDisabled: true
    },
    {
      id: 'beneficios',
      label: 'Mis Beneficios',
      icon: Gift,
      route: '/dashboard/socio/beneficios',
      badge: estadisticasRapidas.disponibles,
      description: 'Ver ofertas disponibles'
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      route: '/dashboard/socio/historial',
      badge: estadisticasRapidas.usados,
      description: 'Beneficios utilizados'
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

  // Información del usuario memoizada
  const userInfo = useMemo(() => ({
    name: socio?.nombre || user?.nombre || 'Socio',
    initial: (socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'
  }), [socio?.nombre, user?.nombre]);

  // Loading skeleton optimizado
  if (socioLoading) {
    return (
      <div className={`
        fixed left-0 top-0 h-full bg-white/95 backdrop-blur-md border-r border-gray-200/50 shadow-2xl z-40 transition-all duration-300
        ${open ? 'w-80' : 'w-0 lg:w-20'}
        lg:relative lg:translate-x-0
      `}>
        <div className="p-4 space-y-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
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
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden transition-all duration-300"
          onClick={onToggle}
        />
      )}

      {/* Sidebar principal */}
      <div className={`
        fixed left-0 top-0 h-full bg-white/95 backdrop-blur-md border-r border-gray-200/50 shadow-2xl z-40 transition-all duration-300
        ${open ? 'w-80' : 'w-0 lg:w-20'}
        lg:relative lg:translate-x-0 flex flex-col
      `}>
        {/* Header memoizado */}
        <SidebarHeader
          userInfo={userInfo}
          isOpen={open}
          isMobile={isMobile}
          onToggle={onToggle}
        />

        {/* Mensaje informativo simplificado */}
        {open && (
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100/50">
            <div className="flex items-center gap-2">
              {isMobile ? (
                <>
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-bold text-blue-800">
                    ¡Escanea y ahorra al instante!
                  </p>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-bold text-purple-800">
                    Explora tus beneficios disponibles
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navegación ultra-simplificada */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto min-h-0">
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

        {/* Estadística rápida */}
        {open && estadisticasRapidas.disponibles > 0 && (
          <div className="px-4 py-3 border-t border-gray-100/50">
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-800">
                    {estadisticasRapidas.disponibles} beneficios
                  </span>
                </div>
                <span className="text-xs text-emerald-600 font-medium">
                  disponibles
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje informativo para desktop */}
        {!isMobile && open && (
          <div className="px-4 py-3 border-t border-gray-100/50">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-800">
                <Monitor className="w-4 h-4" />
                <span className="text-xs font-medium">
                  Escaneo QR disponible solo en móvil
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Sección de usuario memoizada */}
        <UserSection
          userInfo={userInfo}
          isOpen={open}
          onLogoutClick={onLogoutClick}
        />
      </div>
    </>
  );
};

export { SocioSidebar };
export default SocioSidebar;