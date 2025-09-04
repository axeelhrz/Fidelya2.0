'use client';

import React, { useState, useCallback, useMemo, memo, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  QrCode, 
  Gift, 
  History,
  Smartphone,
  Monitor,
  Sparkles
} from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// Lazy load components - Solo los 3 esenciales
const SocioValidar = lazy(() => 
  import('@/components/socio/SocioValidar').then(module => ({ 
    default: module.SocioValidar 
  }))
);

const BeneficiosSimple = lazy(() => 
  import('@/components/socio/BeneficiosSimple').then(module => ({ 
    default: module.BeneficiosSimple 
  }))
);

const SocioHistorial = lazy(() => 
  import('@/components/socio/SocioHistorial').then(module => ({ 
    default: module.SocioHistorial 
  }))
);

// Tab configuration simplificada
interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  badge?: number;
  mobileOnly?: boolean;
  desktopDisabled?: boolean;
  gradient?: string;
}

// Enhanced loading component
const TabLoadingState = memo<{ tabId: string }>(({ tabId }) => (
  <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-white via-blue-50 to-white rounded-3xl border border-blue-200/50">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="relative mb-6">
        <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-12 h-12 border-3 border-transparent border-t-purple-500 rounded-full mx-auto"
        />
      </div>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-slate-600 font-medium"
      >
        Cargando {tabId}...
      </motion.p>
    </motion.div>
  </div>
));

TabLoadingState.displayName = 'TabLoadingState';

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
        {tab.badge !== undefined && tab.badge > 0 && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`
              px-2 py-0.5 text-xs rounded-full min-w-[20px] text-center font-bold
              ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500 text-white'}
            `}
          >
            {tab.badge > 99 ? '99+' : tab.badge}
          </motion.span>
        )}
        {tab.mobileOnly && <Smartphone className="w-3 h-3" />}
      </div>
    </motion.button>
  );
});

TabButton.displayName = 'TabButton';

// Main component ultra-responsivo
interface OptimizedSocioTabSystemProps {
  onNavigate?: (section: string) => void;
  onQuickScan?: () => void;
  initialTab?: string;
  stats?: {
    totalBeneficios?: number;
    beneficiosUsados?: number;
    [key: string]: number | undefined;
  };
}

const OptimizedSocioTabSystemComponent: React.FC<OptimizedSocioTabSystemProps> = ({ 
  onNavigate, 
  onQuickScan,
  initialTab,
  stats
}) => {
  const searchParams = useSearchParams();
  const { isMobile } = useDeviceDetection();
  
  // Determinar tab inicial basado en dispositivo
  const defaultTab = isMobile ? 'validar' : 'beneficios';
  const [activeTab, setActiveTab] = useState(initialTab || defaultTab);

  // Check for URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      // Si es desktop y trata de acceder a validar, redirigir a beneficios
      if (!isMobile && tabFromUrl === 'validar') {
        setActiveTab('beneficios');
      } else {
        setActiveTab(tabFromUrl);
      }
    }
  }, [searchParams, activeTab, isMobile]);

  // Enhanced tab configuration
  const tabs = useMemo<TabConfig[]>(() => [
    {
      id: 'validar',
      label: 'Escanear',
      icon: QrCode,
      component: SocioValidar as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      mobileOnly: true,
      desktopDisabled: true,
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      component: BeneficiosSimple as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      badge: stats?.totalBeneficios || 0,
      gradient: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      component: SocioHistorial as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      badge: stats?.beneficiosUsados || 0,
      gradient: 'from-purple-500 to-pink-500'
    }
  ], [stats]);

  // Tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    // Prevenir acceso a validar en desktop
    if (!isMobile && tabId === 'validar') {
      return;
    }

    if (tabId === activeTab) return;

    setActiveTab(tabId);
    
    // Update URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabId);
    window.history.pushState({}, '', newUrl.toString());
    
    if (onNavigate) {
      onNavigate(tabId);
    }
  }, [activeTab, onNavigate, isMobile]);

  // Get current tab
  const currentTab = useMemo(() => {
    const tab = tabs.find(tab => tab.id === activeTab);
    // Si es desktop y el tab actual es validar, cambiar a beneficios
    if (!isMobile && tab?.id === 'validar') {
      return tabs.find(tab => tab.id === 'beneficios') || tabs[1];
    }
    return tab || tabs[isMobile ? 0 : 1];
  }, [tabs, activeTab, isMobile]);

  // Component props
  const componentProps = useMemo(() => ({
    onNavigate: handleTabChange,
    onQuickScan,
    stats
  }), [handleTabChange, onQuickScan, stats]);

  // Auto-redirect si es desktop y está en validar
  useEffect(() => {
    if (!isMobile && activeTab === 'validar') {
      setActiveTab('beneficios');
    }
  }, [isMobile, activeTab]);

  return (
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
                isActive={activeTab === tab.id}
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Suspense fallback={<TabLoadingState tabId={activeTab} />}>
                <currentTab.component {...componentProps} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export const OptimizedSocioTabSystem = memo(OptimizedSocioTabSystemComponent);

OptimizedSocioTabSystem.displayName = 'OptimizedSocioTabSystem';

export default OptimizedSocioTabSystem;