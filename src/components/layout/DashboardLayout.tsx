'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSidebar } from './DashboardSidebar';
import { SocioSidebar } from './SocioSidebar';
import { ArrowUp, X, Menu, QrCode } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import SmoothPageTransition from './SmoothPageTransition';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
  isMobile: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  sidebarComponent?: React.ComponentType<SidebarProps> | ((props: SidebarProps) => React.ReactElement);
  onLogout?: () => void;
  enableTransitions?: boolean;
}

// Componente de sidebar memoizado
const MemoizedSidebar = memo<{
  SidebarComponent: React.ComponentType<SidebarProps>;
  sidebarProps: SidebarProps;
}>(({ SidebarComponent, sidebarProps }) => {
  return <SidebarComponent {...sidebarProps} />;
});

MemoizedSidebar.displayName = 'MemoizedSidebar';

// Componente de contenido principal memoizado
const MemoizedMainContent = memo<{
  children: React.ReactNode;
  enableTransitions: boolean;
}>(({ children, enableTransitions }) => {
  return (
    <main className="flex-1 overflow-auto">
      {enableTransitions ? (
        <SmoothPageTransition className="min-h-full">
          {children}
        </SmoothPageTransition>
      ) : (
        <div className="min-h-full">
          {children}
        </div>
      )}
    </main>
  );
});

MemoizedMainContent.displayName = 'MemoizedMainContent';

// Botones flotantes ultra-compactos
const FloatingButtons = memo<{
  showScrollTop: boolean;
  isMobile: boolean;
  isSocio: boolean;
  onScrollTop: () => void;
  onQuickScan: () => void;
}>(({ showScrollTop, isMobile, isSocio, onScrollTop, onQuickScan }) => (
  <div className="fixed bottom-4 right-4 flex flex-col space-y-2 z-20">
    {/* Scroll to Top Button */}
    <AnimatePresence>
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onScrollTop}
          className="w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        >
          <ArrowUp className="w-4 h-4 text-gray-600" />
        </motion.button>
      )}
    </AnimatePresence>

    {/* Quick Scan Button (Solo para socios en móvil) */}
    {isMobile && isSocio && (
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onQuickScan}
        className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center relative overflow-hidden"
      >
        <QrCode className="w-6 h-6 text-white relative z-10" />
        <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
      </motion.button>
    )}
  </div>
));

FloatingButtons.displayName = 'FloatingButtons';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeSection = 'overview',
  onSectionChange,
  sidebarComponent: CustomSidebarComponent,
  onLogout,
  enableTransitions = true
}) => {
  const { user } = useAuth();
  const { isMobile } = useDeviceDetection();
  
  // Estados optimizados
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Determinar si es socio
  const isSocio = user?.role === 'socio';

  // Determinar qué sidebar usar
  const SidebarComponent = useMemo(() => {
    if (CustomSidebarComponent) {
      return CustomSidebarComponent;
    }
    
    // Para socios, SIEMPRE usar el sidebar simplificado
    if (isSocio) {
      return SocioSidebar;
    }
    
    return DashboardSidebar;
  }, [CustomSidebarComponent, isSocio]);

  // Handlers memoizados
  const handleSidebarToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleMenuClick = useCallback((section: string) => {
    if (onSectionChange) {
      onSectionChange(section);
    }
    // Auto-close sidebar on mobile after selection
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [onSectionChange, isMobile]);

  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/auth/login';
    }
  }, [onLogout]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuickScan = useCallback(() => {
    if (isSocio) {
      handleMenuClick('validar');
    }
  }, [handleMenuClick, isSocio]);

  // Handle responsive breakpoints
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    handleResize();
    setIsInitialized(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll to top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Props del sidebar memoizadas
  const sidebarProps = useMemo<SidebarProps>(() => ({
    open: sidebarOpen,
    onToggle: handleSidebarToggle,
    onMenuClick: handleMenuClick,
    activeSection: activeSection,
    onLogoutClick: handleLogout,
    isMobile: isMobile,
  }), [sidebarOpen, handleSidebarToggle, handleMenuClick, activeSection, handleLogout, isMobile]);

  // Loading state ultra-compacto
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button ultra-compacto */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSidebarToggle}
          className="fixed top-3 left-3 z-50 w-10 h-10 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </motion.button>
      )}

      {/* Main Layout Container */}
      <div className="flex min-h-screen">
        {/* Mobile Sidebar Backdrop */}
        <AnimatePresence>
          {isMobile && sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={handleSidebarToggle}
            />
          )}
        </AnimatePresence>

        {/* Sidebar Container ultra-compacto */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          ${!isMobile && !sidebarOpen ? 'w-16' : 'w-64'}
          transition-all duration-300 ease-in-out
          bg-white border-r border-gray-200 shadow-sm
          ${isMobile ? 'lg:relative lg:translate-x-0 lg:shadow-none' : ''}
        `}>
          {/* Mobile Close Button */}
          {isMobile && sidebarOpen && (
            <div className="absolute top-3 right-3 z-10 lg:hidden">
              <button
                onClick={handleSidebarToggle}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
          
          {/* Sidebar Content */}
          <div className="h-full">
            <MemoizedSidebar 
              SidebarComponent={SidebarComponent}
              sidebarProps={sidebarProps}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <MemoizedMainContent 
            enableTransitions={enableTransitions}
          >
            {children}
          </MemoizedMainContent>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <FloatingButtons
        showScrollTop={showScrollTop}
        isMobile={isMobile}
        isSocio={isSocio}
        onScrollTop={scrollToTop}
        onQuickScan={handleQuickScan}
      />
    </div>
  );
};