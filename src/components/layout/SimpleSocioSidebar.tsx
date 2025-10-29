'use client';

import React, { useMemo, useCallback, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  QrCode, 
  Gift, 
  User, 
  LogOut,
  Menu,
  X,
  Scan,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';

interface SimpleSocioSidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  onLogoutClick: () => void;
  activeSection: string;
}

interface SimpleMenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
  badge?: number;
  isPrimary?: boolean;
  description?: string;
}

// Componente de elemento de menú simplificado
const SimpleMenuItemComponent = memo<{
  item: SimpleMenuItem;
  isActive: boolean;
  isOpen: boolean;
  onClick: () => void;
}>(({ item, isActive, isOpen, onClick }) => (
  <button
    onClick={onClick}
    className={`
      group w-full flex items-center space-x-3 px-4 py-4 rounded-2xl text-left transition-all duration-300
      ${isActive 
        ? item.isPrimary
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl transform scale-[1.02]' 
          : 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/50 shadow-lg'
        : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md hover:scale-[1.01]'
      }
      ${!isOpen && 'lg:justify-center lg:px-3'}
      ${item.isPrimary && !isActive && 'hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100'}
    `}
  >
    <div className={`
      flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
      ${isActive 
        ? item.isPrimary
          ? 'bg-white/20 text-white shadow-lg' 
          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
        : item.isPrimary
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white group-hover:shadow-lg'
          : 'text-gray-500 group-hover:bg-gradient-to-r group-hover:from-blue-100 group-hover:to-purple-100 group-hover:text-blue-600'
      }
    `}>
      <item.icon className="w-5 h-5" />
    </div>
    
    {isOpen && (
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`font-bold truncate ${item.isPrimary ? 'text-lg' : 'text-base'}`}>
            {item.label}
          </span>
          {item.isPrimary && (
            <Sparkles className="w-4 h-4 text-yellow-400" />
          )}
        </div>
        {item.description && (
          <p className={`text-xs truncate font-medium ${
            isActive && item.isPrimary ? 'text-white/80' : 'text-gray-500'
          }`}>
            {item.description}
          </p>
        )}
      </div>
    )}
    
    {isOpen && item.badge !== undefined && item.badge > 0 && (
      <span className={`
        inline-flex items-center justify-center px-2 py-1 text-xs font-black rounded-full min-w-[20px] shadow-lg
        ${isActive && item.isPrimary 
          ? 'bg-white/20 text-white' 
          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
        }
      `}>
        {item.badge > 99 ? '99+' : item.badge}
      </span>
    )}
  </button>
));

SimpleMenuItemComponent.displayName = 'SimpleMenuItemComponent';

// Header simplificado
const SimpleHeader = memo<{
  userInfo: {
    name: string;
    initial: string;
  };
  isOpen: boolean;
  onToggle: () => void;
}>(({ userInfo, isOpen, onToggle }) => (
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
        {isOpen ? <X className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
      </button>
    </div>
  </div>
));

SimpleHeader.displayName = 'SimpleHeader';

const SimpleSocioSidebar: React.FC<SimpleSocioSidebarProps> = ({
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

  // Elementos del menú simplificado - Solo lo esencial
  const menuItems: SimpleMenuItem[] = useMemo(() => [
    {
      id: 'validar',
      label: 'Escanear QR',
      icon: QrCode,
      route: '/dashboard/socio/validar',
      isPrimary: true,
      description: 'Validar beneficios'
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
      id: 'perfil',
      label: 'Mi Perfil',
      icon: User,
      route: '/dashboard/socio/perfil',
      description: 'Información personal'
    }
  ], [estadisticasRapidas.disponibles]);

  // Handler de navegación
  const handleNavigation = useCallback((route: string, itemId: string) => {
    if (pathname !== route) {
      router.push(route);
    }
    onMenuClick(itemId);
    // Cerrar sidebar en móvil después de navegar
    if (window.innerWidth < 1024) {
      onToggle();
    }
  }, [router, pathname, onMenuClick, onToggle]);

  // Verificar si un elemento está activo
  const isActiveItem = useCallback((item: SimpleMenuItem) => {
    return pathname === item.route || activeSection === item.id;
  }, [pathname, activeSection]);

  // Información del usuario
  const userInfo = useMemo(() => ({
    name: socio?.nombre || user?.nombre || 'Socio',
    initial: (socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'
  }), [socio?.nombre, user?.nombre]);

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
                <div key={i} className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl"></div>
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
        {/* Header */}
        <SimpleHeader
          userInfo={userInfo}
          isOpen={open}
          onToggle={onToggle}
        />

        {/* Mensaje de bienvenida simplificado */}
        {open && (
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100/50">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-bold text-blue-800">
                ¡Escanea y ahorra al instante!
              </p>
            </div>
          </div>
        )}

        {/* Navegación simplificada */}
        <nav className="flex-1 px-3 py-4 space-y-3 overflow-y-auto min-h-0">
          {menuItems.map((item) => (
            <SimpleMenuItemComponent
              key={item.id}
              item={item}
              isActive={isActiveItem(item)}
              isOpen={open}
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

        {/* Botón de logout */}
        <div className="px-3 py-4 border-t border-gray-100/50 flex-shrink-0">
          {open ? (
            <button
              onClick={onLogoutClick}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 rounded-2xl transition-all duration-300 border border-red-200/50 hover:border-red-300 hover:shadow-lg font-bold"
            >
              <LogOut className="w-5 h-5" />
              <span>Cerrar Sesión</span>
            </button>
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
      </div>
    </>
  );
};

export { SimpleSocioSidebar };
export default SimpleSocioSidebar;