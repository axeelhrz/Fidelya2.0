'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSidebar } from './DashboardSidebar';
import { ArrowUp, X, Menu } from 'lucide-react';
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

// Componente de sidebar memoizado para evitar re-renders
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

// Componente de botones flotantes memoizado
const FloatingButtons = memo<{
  showScrollTop: boolean;
  isMobile: boolean;
  onScrollTop: () => void;
  onQuickAction: () => void;
}>(({ showScrollTop, isMobile, onScrollTop, onQuickAction }) => (
  <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-20">
    {/* Scroll to Top Button */}
    <AnimatePresence>
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 20 }}
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={onScrollTop}
          className="w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        >
          <ArrowUp className="w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors" />
        </motion.button>
      )}
    </AnimatePresence>

    {/* Quick Action Button (Mobile) */}
    {isMobile && (
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={onQuickAction}
        className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        <svg className="w-7 h-7 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </motion.button>
    )}
  </div>
));

FloatingButtons.displayName = 'FloatingButtons';

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeSection = 'overview',
  onSectionChange,
  sidebarComponent: SidebarComponent = DashboardSidebar,
  onLogout,
  enableTransitions = true
}) => {
  // Estados estables que no cambian con las pestañas
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoizar handlers para evitar re-renders del sidebar
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
      // Default logout behavior - redirect to login
      window.location.href = '/auth/login';
    }
  }, [onLogout]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleQuickAction = useCallback(() => {
    handleMenuClick('validaciones');
  }, [handleMenuClick]);

  // Handle responsive breakpoints (solo una vez)
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width < 1024;
      
      setIsMobile(mobile);
      
      // Auto-open sidebar on desktop, closed on mobile/tablet
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
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoizar props del sidebar para evitar re-renders
  const sidebarProps = useMemo<SidebarProps>(() => ({
    open: sidebarOpen,
    onToggle: handleSidebarToggle,
    onMenuClick: handleMenuClick,
    activeSection: activeSection,
    onLogoutClick: handleLogout,
    isMobile: isMobile,
  }), [sidebarOpen, handleSidebarToggle, handleMenuClick, activeSection, handleLogout, isMobile]);

  // Don't render until initialized to prevent hydration issues
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      {isMobile && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSidebarToggle}
          className="fixed top-4 left-4 z-50 w-12 h-12 bg-white border border-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center lg:hidden"
        >
          <Menu className="w-6 h-6 text-gray-600" />
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={handleSidebarToggle}
            />
          )}
        </AnimatePresence>

        {/* Sidebar Container - OPTIMIZADO PARA NO RE-RENDERIZAR */}
        <div className={`
          ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          ${!isMobile && !sidebarOpen ? 'w-20' : 'w-80'}
          transition-all duration-300 ease-in-out
          bg-white border-r border-gray-200 shadow-lg
          ${isMobile ? 'lg:relative lg:translate-x-0 lg:shadow-none' : ''}
        `}>
          {/* Mobile Close Button */}
          {isMobile && sidebarOpen && (
            <div className="absolute top-4 right-4 z-10 lg:hidden">
              <button
                onClick={handleSidebarToggle}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
          
          {/* Sidebar Content Memoizado */}
          <div className="h-full">
            <MemoizedSidebar 
              SidebarComponent={SidebarComponent}
              sidebarProps={sidebarProps}
            />
          </div>
        </div>

        {/* Main Content Area - OPTIMIZADO PARA NO RE-RENDERIZAR */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <MemoizedMainContent 
            enableTransitions={enableTransitions}
          >
            {children}
          </MemoizedMainContent>
        </div>
      </div>

      {/* Floating Action Buttons - MEMOIZADO */}
      <FloatingButtons
        showScrollTop={showScrollTop}
        isMobile={isMobile}
        onScrollTop={scrollToTop}
        onQuickAction={handleQuickAction}
      />

      {/* Development Indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-10 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg border border-white/20">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isMobile ? 'bg-red-400' : 'bg-green-400'
            }`}></div>
            <span>{isMobile ? 'Mobile' : 'Desktop'}</span>
            <span className="text-gray-400">|</span>
            <span className={enableTransitions ? 'text-green-400' : 'text-gray-400'}>
              Transitions: {enableTransitions ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};