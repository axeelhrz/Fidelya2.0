'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface UseSimpleAsociacionNavigationOptions {
  debounceMs?: number;
}

export const useSimpleAsociacionNavigation = (
  options: UseSimpleAsociacionNavigationOptions = {}
) => {
  const { 
    debounceMs = 200
  } = options;
  const router = useRouter();
  const pathname = usePathname();
  
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isNavigating, setIsNavigating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Route mapping
  const routeMap: Record<string, string> = useMemo(() => ({
    'dashboard': '/dashboard/asociacion',
    'socios': '/dashboard/asociacion/socios',
    'comercios': '/dashboard/asociacion/comercios',
    'beneficios': '/dashboard/asociacion/beneficios',
    'analytics': '/dashboard/asociacion/analytics',
    'notificaciones': '/dashboard/asociacion/notificaciones'
  }), []);

  const reverseRouteMap: Record<string, string> = useMemo(() => ({
    '/dashboard/asociacion': 'dashboard',
    '/dashboard/asociacion/socios': 'socios',
    '/dashboard/asociacion/comercios': 'comercios',
    '/dashboard/asociacion/beneficios': 'beneficios',
    '/dashboard/asociacion/analytics': 'analytics',
    '/dashboard/asociacion/notificaciones': 'notificaciones'
  }), []);

  // Helper function to get active section from pathname
  const getActiveSectionFromPath = useCallback((path: string): string => {
    return reverseRouteMap[path] || 'dashboard';
  }, [reverseRouteMap]);

  // Detect mobile/desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update active section when pathname changes
  useEffect(() => {
    const newActiveSection = getActiveSectionFromPath(pathname);
    setActiveSection(newActiveSection);
    setIsNavigating(false);
  }, [pathname, getActiveSectionFromPath]);

  // Navigation function
  const navigateToSection = useCallback((section: string) => {
    setIsNavigating(true);
    
    setTimeout(() => {
      const targetRoute = routeMap[section];
      
      if (targetRoute && pathname !== targetRoute) {
        setActiveSection(section);
        router.push(targetRoute);
      } else {
        setActiveSection(section);
        setIsNavigating(false);
      }
    }, debounceMs);
  }, [router, pathname, routeMap, debounceMs]);

  // Check if a section is active
  const isActiveSection = useCallback((section: string) => {
    return activeSection === section;
  }, [activeSection]);

  // Check if a route is active
  const isActiveRoute = useCallback((route: string) => {
    return pathname === route;
  }, [pathname]);

  return {
    // State
    activeSection,
    isNavigating,
    isMobile,
    pathname,
    
    // Actions
    navigateToSection,
    isActiveSection,
    isActiveRoute,
    
    // Utils
    routeMap,
    reverseRouteMap
  };
};