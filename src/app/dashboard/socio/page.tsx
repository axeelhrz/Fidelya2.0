'use client';

import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { SocioWelcomeCard } from '@/components/socio/SocioWelcomeCard';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { BeneficiosSimple } from '@/components/socio/BeneficiosSimple';
import { SocioValidar } from '@/components/socio/SocioValidar';
import { SocioHistorial } from '@/components/socio/SocioHistorial';
import { 
  QrCode, 
  Gift, 
  History,
  Smartphone,
  Monitor,
  Sparkles
} from 'lucide-react';

// Enhanced loading component with modern design
const OptimizedLoadingState = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="relative mb-8">
        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full mx-auto"
        />
      </div>
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-700 bg-clip-text text-transparent mb-3"
      >
        Cargando Dashboard
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-600 text-lg"
      >
        Preparando tu experiencia como socio...
      </motion.p>
    </motion.div>
  </div>
));

OptimizedLoadingState.displayName = 'OptimizedLoadingState';

// Tab configuration
interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<object>;
  mobileOnly?: boolean;
  desktopDisabled?: boolean;
  gradient?: string;
}

// Enhanced tab button
const TabButton = memo<{
  tab: TabConfig;
  isActive: boolean;
  onClick: () => void;
  isMobile: boolean;
}>(({ tab, isActive, onClick, isMobile }) => {
  // Si es desktop y el tab está deshabilitado, mostrar deshabilitado
  if (!isMobile && tab.desktopDisabled) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 text-slate-400 cursor-not-allowed text-sm border border-slate-200">
        <tab.icon className="w-4 h-4" />
        <span className="hidden sm:inline font-medium">{tab.label}</span>
        <Monitor className="w-3 h-3" />
      </div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm transition-all duration-300 relative overflow-hidden
        ${isActive 
          ? `bg-gradient-to-r ${tab.gradient || 'from-blue-500 to-indigo-500'} text-white shadow-lg border border-white/20` 
          : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-slate-200 bg-white/60 backdrop-blur-sm'
        }
      `}
    >
      {/* Background effect for active tab */}
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      
      <div className="relative z-10 flex items-center gap-2">
        <tab.icon className="w-4 h-4" />
        <span className="hidden sm:inline">{tab.label}</span>
        {tab.mobileOnly && <Smartphone className="w-3 h-3" />}
      </div>
    </motion.button>
  );
});

TabButton.displayName = 'TabButton';

// Main component with enhanced design and simplified loading
export default function EnhancedSocioDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isMobile } = useDeviceDetection();
  
  // State management optimized
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentSection, setCurrentSection] = useState(() => {
    return isMobile ? 'validar' : 'beneficios';
  });
  const [dashboardReady, setDashboardReady] = useState(false);

  // Tab configuration
  const tabs = useMemo<TabConfig[]>(() => [
    {
      id: 'validar',
      label: 'Escanear',
      icon: QrCode,
      component: SocioValidar,
      mobileOnly: true,
      desktopDisabled: true,
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      component: BeneficiosSimple,
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      component: SocioHistorial,
      gradient: 'from-purple-500 to-pink-500'
    }
  ], []);

  // Enhanced handlers
  const handleLogout = useCallback(() => {
    setLogoutModalOpen(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  }, [signOut, router]);

  const handleLogoutCancel = useCallback(() => {
    setLogoutModalOpen(false);
  }, []);

  // Tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    // Prevenir acceso a validar en desktop
    if (!isMobile && tabId === 'validar') {
      return;
    }

    if (tabId === currentSection) return;

    setCurrentSection(tabId);
    
    // Update URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabId);
    window.history.pushState({}, '', newUrl.toString());
  }, [currentSection, isMobile]);

  // Get current tab
  const currentTab = useMemo(() => {
    const tab = tabs.find(tab => tab.id === currentSection);
    // Si es desktop y el tab actual es validar, cambiar a beneficios
    if (!isMobile && tab?.id === 'validar') {
      return tabs.find(tab => tab.id === 'beneficios') || tabs[1];
    }
    return tab || tabs[isMobile ? 0 : 1];
  }, [tabs, currentSection, isMobile]);

  // Effect to handle dashboard readiness
  useEffect(() => {
    if (!authLoading && user && user.role === 'socio') {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        setDashboardReady(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]);

  // Redirect if not authenticated or not socio
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'socio')) {
      console.log('🔐 Redirecting: user not authenticated or not socio', { user: user?.role });
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Auto-redirect si es desktop y está en validar
  useEffect(() => {
    if (!isMobile && currentSection === 'validar') {
      setCurrentSection('beneficios');
    }
  }, [isMobile, currentSection]);

  // Show loading state
  if (authLoading || !dashboardReady) {
    return <OptimizedLoadingState />;
  }

  // Don't render if user is not valid
  if (!user || user.role !== 'socio') {
    return null;
  }

  const CurrentComponent = currentTab.component;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        {/* Enhanced header for mobile */}
        <div className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {user.nombre?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    Panel de Socio
                  </h1>
                  <p className="text-sm text-slate-600">
                    {isMobile ? 'Escanea y ahorra' : 'Explora tus beneficios'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          {/* Enhanced Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SocioWelcomeCard
              user={{
                nombre: user.nombre || 'Socio',
                numeroSocio: user.uid?.slice(-6) || '000000',
                avatar: user.avatar
              }}
              onLogout={handleLogout}
            />
          </motion.div>

          {/* Enhanced Tab System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-3xl -z-10" />
            
            <div className="w-full max-w-6xl mx-auto">
              {/* Enhanced Header */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-xl border border-slate-200/50 p-6 mb-6 overflow-hidden relative"
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -translate-y-16 translate-x-16" />
                </div>

                <div className="relative z-10">
                  {/* Tab buttons mejorados */}
                  <div className="flex gap-2 p-2 bg-slate-100/50 rounded-2xl backdrop-blur-sm">
                    {tabs.map((tab) => (
                      <TabButton
                        key={tab.id}
                        tab={tab}
                        isActive={currentSection === tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>

                  {/* Enhanced mensaje informativo para desktop */}
                  {!isMobile && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <p className="text-sm text-amber-700 font-medium">
                          📱 El escáner QR está optimizado para dispositivos móviles
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Enhanced Content Area */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative"
              >
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-3xl -z-10" />
                
                <div className="bg-gradient-to-br from-white via-slate-50 to-white rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
                  <motion.div
                    key={currentSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <CurrentComponent />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Enhanced Logout Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}