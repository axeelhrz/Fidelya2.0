'use client';

import React, { useState, useCallback, useMemo, memo, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  QrCode, 
  Gift, 
  User,
  Scan,
  Sparkles
} from 'lucide-react';

// Lazy load components - Solo los esenciales
const SocioValidar = lazy(() => 
  import('@/components/socio/SocioValidar').then(module => ({ 
    default: module.SocioValidar 
  }))
);

const SocioBeneficios = lazy(() => 
  import('@/components/socio/SocioBeneficios').then(module => ({ 
    default: module.SocioBeneficios 
  }))
);

const SocioProfile = lazy(() => 
  import('@/components/socio/SocioProfile').then(module => ({ 
    default: module.SocioProfile 
  }))
);

// Tab configuration simplificada
interface SimpleTabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  gradient: string;
  description: string;
  badge?: number;
  isPrimary?: boolean;
}

// Loading component optimizado
const SimpleTabLoadingState = memo<{ tabId: string }>(({ tabId }) => {
  const loadingConfigs = {
    validar: { color: 'blue', text: 'Preparando Escáner', icon: QrCode },
    beneficios: { color: 'purple', text: 'Cargando Beneficios', icon: Gift },
    perfil: { color: 'emerald', text: 'Cargando Perfil', icon: User }
  };

  const config = loadingConfigs[tabId as keyof typeof loadingConfigs] || loadingConfigs.validar;
  const IconComponent = config.icon;

  return (
    <div className="flex items-center justify-center min-h-[500px] bg-gradient-to-br from-slate-50 to-white rounded-3xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative mb-6">
          <div className={`w-20 h-20 border-4 border-${config.color}-200 border-t-${config.color}-500 rounded-full animate-spin mx-auto`} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className={`absolute inset-0 w-20 h-20 border-4 border-transparent border-r-${config.color}-400 rounded-full mx-auto`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <IconComponent className={`w-8 h-8 text-${config.color}-600`} />
          </div>
        </div>
        <h3 className={`text-2xl font-bold text-${config.color}-700 mb-2`}>
          {config.text}
        </h3>
        <p className="text-slate-600">Un momento por favor...</p>
      </motion.div>
    </div>
  );
});

SimpleTabLoadingState.displayName = 'SimpleTabLoadingState';

// Tab button simplificado
const SimpleTabButton = memo<{
  tab: SimpleTabConfig;
  isActive: boolean;
  onClick: () => void;
}>(({ tab, isActive, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 flex-1
        ${isActive 
          ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl scale-105` 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:scale-102'
        }
        ${tab.isPrimary && !isActive ? 'border-2 border-blue-200 hover:border-blue-300' : ''}
      `}
      whileHover={{ scale: isActive ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Background glow for active tab */}
      {isActive && (
        <motion.div
          layoutId="activeSimpleTabGlow"
          className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-2xl blur-lg opacity-40`}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      {/* Icon container */}
      <div className={`
        relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
        ${isActive ? 'bg-white/20' : tab.isPrimary ? 'bg-blue-100 group-hover:bg-blue-200' : 'bg-slate-100 group-hover:bg-slate-200'}
      `}>
        <tab.icon className={`w-6 h-6 transition-colors duration-300 ${
          isActive ? 'text-white' : tab.isPrimary ? 'text-blue-600' : 'text-slate-600 group-hover:text-slate-700'
        }`} />
        
        {/* Primary indicator */}
        {tab.isPrimary && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-white" />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex-1 text-left">
        <span className="relative z-10 text-base font-bold block">
          {tab.label}
        </span>
        <span className={`relative z-10 text-xs block ${
          isActive ? 'text-white/80' : 'text-slate-500'
        }`}>
          {tab.description}
        </span>
      </div>

      {/* Badge */}
      {tab.badge !== undefined && tab.badge > 0 && (
        <div className={`
          relative z-10 flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold min-w-[24px]
          ${isActive 
            ? 'bg-white/20 text-white' 
            : 'bg-blue-500 text-white group-hover:bg-blue-600'
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

SimpleTabButton.displayName = 'SimpleTabButton';

// Main component
interface SimpleSocioTabSystemProps {
  onNavigate?: (section: string) => void;
  onQuickScan?: () => void;
  initialTab?: string;
  stats?: {
    totalBeneficios?: number;
    beneficiosUsados?: number;
    [key: string]: number | undefined;
  };
}

const SimpleSocioTabSystemComponent: React.FC<SimpleSocioTabSystemProps> = ({ 
  onNavigate, 
  onQuickScan,
  initialTab = 'validar', // Cambiar default a validar (escanear QR)
  stats
}) => {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Check for URL parameters
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  // Tab configuration simplificada - Solo 3 tabs esenciales
  const tabs = useMemo<SimpleTabConfig[]>(() => [
    {
      id: 'validar',
      label: 'Escanear QR',
      icon: QrCode,
      component: SocioValidar as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-blue-500 to-purple-600',
      description: 'Validar beneficios',
      isPrimary: true
    },
    {
      id: 'beneficios',
      label: 'Mis Beneficios',
      icon: Gift,
      component: SocioBeneficios as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-purple-500 to-pink-600',
      description: 'Ver ofertas',
      badge: stats?.totalBeneficios || 0
    },
    {
      id: 'perfil',
      label: 'Mi Perfil',
      icon: User,
      component: SocioProfile as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Información personal'
    }
  ], [stats]);

  // Tab change handler
  const handleTabChange = useCallback((tabId: string) => {
    if (tabId === activeTab) return;

    setActiveTab(tabId);
    
    // Update URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', tabId);
    window.history.pushState({}, '', newUrl.toString());
    
    if (onNavigate) {
      onNavigate(tabId);
    }
  }, [activeTab, onNavigate]);

  // Get current tab
  const currentTab = useMemo(() => 
    tabs.find(tab => tab.id === activeTab) || tabs[0], 
    [tabs, activeTab]
  );

  // Component props
  const componentProps = useMemo(() => ({
    onNavigate: handleTabChange,
    onQuickScan,
    stats
  }), [handleTabChange, onQuickScan, stats]);

  return (
    <div className="space-y-6">
      {/* Header simplificado */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl p-6">
        {/* Título dinámico */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 bg-gradient-to-r ${currentTab.gradient} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300`}>
              <currentTab.icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 transition-all duration-300">
                {currentTab.label}
              </h1>
              <p className="text-slate-600 text-lg transition-all duration-300">
                {currentTab.description}
              </p>
            </div>
          </div>

          {/* Quick action indicator */}
          {currentTab.isPrimary && (
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
              <Scan className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-700">Acción Principal</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        {/* Tab buttons - Layout responsivo */}
        <div className="flex flex-col sm:flex-row gap-3">
          {tabs.map((tab) => (
            <SimpleTabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[600px]">
        {/* Background decoration */}
        <div className={`absolute inset-0 bg-gradient-to-br ${currentTab.gradient} opacity-5 rounded-3xl blur-3xl transition-all duration-500`} />
        
        {/* Content container */}
        <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="p-6"
            >
              <Suspense fallback={<SimpleTabLoadingState tabId={activeTab} />}>
                <currentTab.component {...componentProps} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const SimpleSocioTabSystem = memo(SimpleSocioTabSystemComponent);

SimpleSocioTabSystem.displayName = 'SimpleSocioTabSystem';

export default SimpleSocioTabSystem;