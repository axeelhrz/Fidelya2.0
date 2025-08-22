'use client';

import React, { useState, useCallback, useMemo, memo, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  Home, 
  Store, 
  Gift, 
  QrCode, 
  UserCheck,
  Users,
  Bell,
  Sparkles,
  Activity
} from 'lucide-react';

// Lazy load real components from the individual pages
const ComercioOverviewDashboard = lazy(() => 
  import('@/components/comercio/ComercioOverviewDashboard').then(module => ({ 
    default: module.ComercioOverviewDashboard 
  }))
);

const ComercioProfile = lazy(() => 
  import('@/components/comercio/ComercioProfile').then(module => ({ 
    default: module.ComercioProfile 
  }))
);

const BeneficiosManagement = lazy(() => 
  import('@/components/comercio/BeneficiosManagement').then(module => ({ 
    default: module.BeneficiosManagement 
  }))
);

const QRManagement = lazy(() => 
  import('@/components/comercio/QRManagement').then(module => ({ 
    default: module.QRManagement 
  }))
);

const ValidacionesHistory = lazy(() => 
  import('@/components/comercio/ValidacionesHistory').then(module => ({ 
    default: module.ValidacionesHistory 
  }))
);

const SocioAnalytics = lazy(() => 
  import('@/components/comercio/socios/SocioAnalytics').then(module => ({ 
    default: module.SocioAnalytics 
  }))
);

const ComercioNotifications = lazy(() => 
  import('@/components/comercio/ComercioNotifications').then(module => ({ 
    default: module.ComercioNotifications 
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
  isPro?: boolean;
}

// Optimized loading component
const TabLoadingState = memo<{ tabId: string }>(({ tabId }) => {
  const loadingConfigs = {
    dashboard: { color: 'blue', text: 'Cargando Dashboard' },
    perfil: { color: 'emerald', text: 'Cargando Perfil' },
    beneficios: { color: 'purple', text: 'Cargando Beneficios' },
    qr: { color: 'orange', text: 'Cargando QR' },
    validaciones: { color: 'indigo', text: 'Cargando Validaciones' },
    socios: { color: 'pink', text: 'Cargando Socios' },
    notificaciones: { color: 'amber', text: 'Cargando Notificaciones' }
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

      {/* Pro badge */}
      {tab.isPro && (
        <div className="relative z-10 flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white">
          Pro
        </div>
      )}

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
interface OptimizedComercioTabSystemProps {
  onNavigate?: (section: string) => void;
  initialTab?: string;
  stats?: {
    validacionesHoy?: number;
    beneficiosActivos?: number;
    clientesUnicos?: number;
    qrEscaneos?: number;
    [key: string]: number | undefined;
  };
}

export const OptimizedComercioTabSystem: React.FC<OptimizedComercioTabSystemProps> = memo(({ 
  onNavigate,
  initialTab = 'dashboard',
  stats
}) => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Check for URL parameters to set initial tab
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      // Only set if it's a valid tab
      const validTabs = ['dashboard', 'perfil', 'beneficios', 'qr', 'validaciones', 'socios', 'notificaciones'];
      if (validTabs.includes(tabFromUrl)) {
        setActiveTab(tabFromUrl);
      } else {
        // If invalid tab, redirect to dashboard
        setActiveTab('dashboard');
      }
    }
  }, [searchParams, activeTab]);

  // Memoized tab configuration - STABLE reference
  const tabs = useMemo<TabConfig[]>(() => [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      component: ComercioOverviewDashboard as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-blue-500 to-blue-600',
      description: 'Vista general del negocio'
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: Store,
      component: ComercioProfile as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-emerald-500 to-emerald-600',
      description: 'Información del comercio'
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      component: BeneficiosManagement as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Gestionar ofertas',
      badge: stats?.beneficiosActivos || 0
    },
    {
      id: 'qr',
      label: 'Código QR',
      icon: QrCode,
      component: QRManagement as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-orange-500 to-orange-600',
      description: 'Gestión de códigos QR',
      badge: stats?.qrEscaneos || 0
    },
    {
      id: 'validaciones',
      label: 'Validaciones',
      icon: UserCheck,
      component: ValidacionesHistory as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-indigo-500 to-indigo-600',
      description: 'Historial de validaciones',
      badge: stats?.validacionesHoy || 0
    },
    {
      id: 'socios',
      label: 'Socios',
      icon: Users,
      component: SocioAnalytics as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-pink-500 to-pink-600',
      description: 'Gestión de socios',
      badge: stats?.clientesUnicos || 0
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      icon: Bell,
      component: ComercioNotifications as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-amber-500 to-amber-600',
      description: 'Centro de notificaciones'
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
  // Public method to change tab (can be called from other components)
  const navigateToTab = useCallback((tabId: string) => {
    handleTabChange(tabId);
  }, [handleTabChange]);

  // Expose navigation method globally
  useEffect(() => {
    // Store navigation function globally so other components can use it
    (window as Window & { navigateToComercioTab?: (tabId: string) => void }).navigateToComercioTab = navigateToTab;
    
    return () => {
      delete (window as Window & { navigateToComercioTab?: (tabId: string) => void }).navigateToComercioTab;
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
    stats
  }), [navigateToTab, stats]);

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
            <span className="text-sm font-medium text-emerald-700">Comercio Activo</span>
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
});

OptimizedComercioTabSystem.displayName = 'OptimizedComercioTabSystem';

export default OptimizedComercioTabSystem;