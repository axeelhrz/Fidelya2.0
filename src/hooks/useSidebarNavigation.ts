'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseSidebarNavigationOptions {
  autoCloseOnMobile?: boolean;
  persistState?: boolean;
  onMenuClick?: (section: string) => void;
  debounceMs?: number;
}

export const useSidebarNavigation = (options: UseSidebarNavigationOptions = {}) => {
  const { 
    autoCloseOnMobile = true, 
    persistState = true, 
    onMenuClick,
    debounceMs = 150 
  } = options;
  
  const router = useRouter();
  const pathname = usePathname();
  
  // Estado persistente del sidebar
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    if (persistState) {
      const saved = localStorage.getItem('sidebar-open');
      if (saved !== null) {
        return JSON.parse(saved);
      }
    }
    
    // Default: abierto en desktop, cerrado en mobile
    return window.innerWidth >= 1024;
  });

  const [isMobile, setIsMobile] = useState(false);
  const lastPathnameRef = useRef(pathname);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar cambios de tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Auto-ajustar sidebar según el tamaño de pantalla
      if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      } else if (mobile && sidebarOpen && autoCloseOnMobile) {
        setSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, autoCloseOnMobile]);

  // Persistir estado del sidebar
  useEffect(() => {
    if (persistState && typeof window !== 'undefined') {
      localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen, persistState]);

  // Toggle del sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev: boolean) => !prev);
  }, []);

  // Navegación optimizada con debounce
  const navigateTo = useCallback((route: string, section?: string) => {
    // Limpiar timeout anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Aplicar debounce
    debounceTimeoutRef.current = setTimeout(() => {
      // Solo navegar si la ruta es diferente
      if (pathname !== route) {
        router.push(route);
      }
      
      // Llamar al callback de menú si existe
      if (onMenuClick && section) {
        onMenuClick(section);
      }
      
      // Auto-cerrar en mobile después de navegación
      if (isMobile && autoCloseOnMobile) {
        setSidebarOpen(false);
      }
      
      lastPathnameRef.current = route;
    }, debounceMs);
  }, [router, pathname, isMobile, autoCloseOnMobile, onMenuClick, debounceMs]);

  // Alias para compatibilidad
  const navigate = navigateTo;

  // Verificar si una ruta está activa
  const isActiveRoute = useCallback((route: string) => {
    return pathname === route;
  }, [pathname]);

  // Cerrar sidebar en mobile al cambiar de ruta
  useEffect(() => {
    if (pathname !== lastPathnameRef.current && isMobile && autoCloseOnMobile) {
      setSidebarOpen(false);
    }
    lastPathnameRef.current = pathname;
  }, [pathname, isMobile, autoCloseOnMobile]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    sidebarOpen,
    isMobile,
    toggleSidebar,
    navigateTo,
    navigate, // Alias para compatibilidad
    isActiveRoute,
    setSidebarOpen
  };
};