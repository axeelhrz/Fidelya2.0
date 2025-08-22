'use client';

import React, { useState, useCallback, useMemo, memo, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  Home, 
  User, 
  Gift, 
  QrCode, 
  History,
  Building2,
  Sparkles,
  Activity
} from 'lucide-react';

// Lazy load real components from the individual pages
const SocioOverviewDashboard = lazy(() => 
  import('@/components/socio/SocioOverviewDashboard').then(module => ({ 
    default: module.SocioOverviewDashboard 
  }))
);

const SocioProfile = lazy(() => 
  import('@/components/socio/SocioProfile').then(module => ({ 
    default: module.SocioProfile 
  }))
);

const SocioBeneficios = lazy(() => 
  import('@/components/socio/SocioBeneficios').then(module => ({ 
    default: module.SocioBeneficios 
  }))
);

const SocioAsociacionesList = lazy(() => 
  import('@/components/socio/AsociacionesList').then(module => ({ 
    default: module.AsociacionesList 
  }))
);

const SocioValidar = lazy(() => 
  import('@/components/socio/SocioValidar').then(module => ({ 
    default: module.SocioValidar 
  }))
);

const SocioHistorial = lazy(() => 
  import('@/components/socio/SocioHistorial').then(module => ({ 
    default: module.SocioHistorial 
  }))
);

// Tab configuration with optimized structure
interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  gradient: string;
  description: string;
  badge?: number;
  isNew?: boolean;
}

// Optimized loading component
const TabLoadingState = memo<{ tabId: string }>(({ tabId }) => {
  const loadingConfigs = {
    dashboard: { color: 'blue', text: 'Cargando Dashboard' },
    perfil: { color: 'emerald', text: 'Cargando Perfil' },
    beneficios: { color: 'purple', text: 'Cargando Beneficios' },
    asociaciones: { color: 'orange', text: 'Cargando Asociaciones' },
    validar: { color: 'indigo', text: 'Cargando Validador' },
    historial: { color: 'red', text: 'Cargando Historial' }
  };

  const config = loadingConfigs[tabId as keyof typeof loadingConfigs] || loadingConfigs.dashboard;

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-slate-50 to-white rounded-3xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative mb-6">
          <div className={`w-16 h-16 border-4 border-${config.color}-200 border-t-${config.color}-500 rounded-full animate-spin mx-auto`} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`absolute inset-0 w-16 h-16 border-4 border-transparent border-r-${config.color}-400 rounded-full mx-auto`}
          />
        </div>
        <h3 className={`text-xl font-bold text-${config.color}-700 mb-2`}>
          {config.text}
        </h3>
        <p className="text-slate-600">Optimizando contenido...</p>
      </motion.div>
    </div>
  );
});

TabLoadingState.displayName = 'TabLoadingState';

// Optimized tab button component - MEMOIZED to prevent re-renders
const TabButton = memo<{
  tab: TabConfig;
  isActive: boolean;
  onClick: () => void;
  index: number;
}>(({ tab, isActive, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all duration-300
        ${isActive 
          ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105` 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:scale-102'
        }
      `}
      whileHover={{ scale: isActive ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Background glow for active tab */}
      {isActive && (
        <motion.div
          layoutId="activeTabGlow"
          className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-2xl blur-lg opacity-30`}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      {/* Icon container */}
      <div className={`
        relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300
        ${isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}
      `}>
        <tab.icon className={`w-5 h-5 transition-colors duration-300 ${
          isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-700'
        }`} />
        
        {/* New indicator */}
        {tab.isNew && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </div>

      {/* Label */}
      <span className="relative z-10 text-sm font-medium">
        {tab.label}
      </span>

      {/* Badge */}
      {tab.badge !== undefined && tab.badge > 0 && (
        <div className={`
          relative z-10 flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold min-w-[20px]
          ${isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
          }
        `}>
          {tab.badge > 99 ? '99+' : tab.badge}
        </div>
      )}

      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    </motion.button>
  );
});

TabButton.displayName = 'TabButton';

// Main optimized tab system component
interface OptimizedSocioTabSystemProps {
  onNavigate?: (section: string) => void;
  onQuickScan?: () => void;
  initialTab?: string;
  stats?: {
    totalBeneficios?: number;
    beneficiosUsados?: number;
    asociacionesActivas?: number;
    [key: string]: number | undefined;
  };
}

// Extend Window interface to include navigateToSocioTab
declare global {
  interface Window {
    navigateToSocioTab?: (tabId: string) => void;
  }
}

const OptimizedSocioTabSystemComponent: React.FC<OptimizedSocioTabSystemProps> = ({ 
  onNavigate, 
  onQuickScan,
  initialTab = 'dashboard',
  stats
}) => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Check for URL parameters to set initial tab
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Memoized tab configuration - STABLE reference
  const tabs = useMemo<TabConfig[]>(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      component: SocioOverviewDashboard as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Vista general de beneficios'
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: User,
      component: SocioProfile as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Información personal'
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      component: SocioBeneficios as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Ofertas disponibles',
      badge: stats?.totalBeneficios || 0
    },
    {
      id: 'asociaciones',
      label: 'Asociaciones',
      icon: Building2,
      component: SocioAsociacionesList as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-orange-500 to-orange-600',
      description: 'Organizaciones disponibles',
      badge: stats?.asociacionesActivas || 0
    },
    {
      id: 'validar',
      label: 'Validar QR',
      icon: QrCode,
      component: SocioValidar as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-indigo-500 to-indigo-600',
      description: 'Escanear código',
      isNew: true
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      component: SocioHistorial as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-red-500 to-red-600',
      description: 'Beneficios utilizados',
      badge: stats?.beneficiosUsados || 0
    }
  ], [stats]);

  // Optimized tab change handler with URL update
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab) return;

    setActiveTab(tabId);
    
    // Update URL without page reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabId);
    window.history.pushState({}, '', newUrl.toString());
    
    if (onNavigate) {
      onNavigate(tabId);
    }
  }, [activeTab, onNavigate]);

  // Store navigation function globally so other components can use it
  const navigateToTab = handleTabChange;

  useEffect(() => {
    window.navigateToSocioTab = navigateToTab;
    return () => {
      delete window.navigateToSocioTab;
    };
  }, [navigateToTab]);

  // Get current tab configuration - STABLE reference
  const currentTab = useMemo(() => 
    tabs.find(tab => tab.id === activeTab) || tabs[0], 
    [tabs, activeTab]
  );

  // Memoized component props - STABLE reference
  const componentProps = useMemo(() => ({
    onNavigate: navigateToTab,
    onQuickScan,
    stats
  }), [navigateToTab, onQuickScan, stats]);

  return (
    <div className="space-y-6">
      {/* FIXED Tab Navigation - This section will NOT re-render */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
        {/* Header with current tab info - ONLY update text content */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${currentTab.gradient} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300`}>
              <currentTab.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 transition-all duration-300">{currentTab.label}</h2>
              <p className="text-slate-600 transition-all duration-300">{currentTab.description}</p>
            </div>
          </div>

          {/* Activity indicator - STATIC */}
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">Socio Activo</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Tab buttons - MEMOIZED to prevent re-renders */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab, index) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* DYNAMIC Content Area - Only this section changes */}
      <div className="relative min-h-[600px]">
        {/* Background decoration - STATIC */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentTab.gradient} opacity-5 rounded-3xl blur-3xl transition-all duration-500`} />
        
        {/* Content container - ONLY content changes */}
        <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="p-6"
            >
              <Suspense fallback={<TabLoadingState tabId={activeTab} />}>
                <currentTab.component {...componentProps} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Performance indicator - STATIC */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg border border-white/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>Optimizado</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const OptimizedSocioTabSystem = memo(OptimizedSocioTabSystemComponent);

OptimizedSocioTabSystem.displayName = 'OptimizedSocioTabSystem';

export default OptimizedSocioTabSystem;