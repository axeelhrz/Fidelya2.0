'use client';

import React, { useState, useCallback, useMemo, memo, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  QrCode, 
  Gift, 
  History,
  Scan,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// Lazy load components - Solo los 3 esenciales
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

const SocioHistorial = lazy(() => 
  import('@/components/socio/SocioHistorial').then(module => ({ 
    default: module.SocioHistorial 
  }))
);

// Tab configuration ultra-simplificada
interface UltraSimpleTabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  gradient: string;
  description: string;
  badge?: number;
  mobileOnly?: boolean;
  desktopDisabled?: boolean;
}

// Loading component optimizado
const UltraSimpleLoadingState = memo<{ tabId: string }>(({ tabId }) => {
  const loadingConfigs = {
    validar: { color: 'blue', text: 'Preparando Escáner', icon: QrCode },
    beneficios: { color: 'purple', text: 'Cargando Beneficios', icon: Gift },
    historial: { color: 'emerald', text: 'Cargando Historial', icon: History }
  };

  const config = loadingConfigs[tabId as keyof typeof loadingConfigs] || loadingConfigs.beneficios;
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

UltraSimpleLoadingState.displayName = 'UltraSimpleLoadingState';

// Tab button ultra-simplificado
const UltraSimpleTabButton = memo<{
  tab: UltraSimpleTabConfig;
  isActive: boolean;
  onClick: () => void;
  isMobile: boolean;
}>(({ tab, isActive, onClick, isMobile }) => {
  // Si es desktop y el tab está deshabilitado para desktop, no mostrar
  if (!isMobile && tab.desktopDisabled) {
    return (
      <div className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-gray-100 text-gray-400 cursor-not-allowed">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-200">
          <tab.icon className="w-6 h-6 text-gray-400" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-base font-bold block">{tab.label}</span>
          <span className="text-xs block flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            Solo móvil
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all duration-300 flex-1
        ${isActive 
          ? `bg-gradient-to-r ${tab.gradient} text-white shadow-xl scale-105` 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:scale-102'
        }
        ${tab.mobileOnly && !isMobile ? 'opacity-50' : ''}
      `}
      whileHover={{ scale: isActive ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      {/* Background glow for active tab */}
      {isActive && (
        <motion.div
          layoutId="activeUltraSimpleTabGlow"
          className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} rounded-2xl blur-lg opacity-40`}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}

      {/* Icon container */}
      <div className={`
        relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300
        ${isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-slate-200'}
      `}>
        <tab.icon className={`w-6 h-6 transition-colors duration-300 ${
          isActive ? 'text-white' : 'text-slate-600 group-hover:text-slate-700'
        }`} />
        
        {/* Mobile indicator */}
        {tab.mobileOnly && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center">
            <Smartphone className="w-2 h-2 text-white" />
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
          {tab.mobileOnly && !isMobile && ' (Solo móvil)'}
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

UltraSimpleTabButton.displayName = 'UltraSimpleTabButton';

// Main component
interface UltraSimpleSocioTabSystemProps {
  onNavigate?: (section: string) => void;
  onQuickScan?: () => void;
  initialTab?: string;
  stats?: {
    totalBeneficios?: number;
    beneficiosUsados?: number;
    [key: string]: number | undefined;
  };
}

const UltraSimpleSocioTabSystemComponent: React.FC<UltraSimpleSocioTabSystemProps> = ({ 
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

  // Tab configuration ultra-simplificada - Solo 3 tabs esenciales
  const tabs = useMemo<UltraSimpleTabConfig[]>(() => [
    {
      id: 'validar',
      label: 'Escanear QR',
      icon: QrCode,
      component: SocioValidar as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-blue-500 to-purple-600',
      description: 'Validar beneficios',
      mobileOnly: true,
      desktopDisabled: true
    },
    {
      id: 'beneficios',
      label: 'Mis Beneficios',
      icon: Gift,
      component: SocioBeneficios as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-purple-500 to-pink-600',
      description: 'Ver ofertas disponibles',
      badge: stats?.totalBeneficios || 0
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      component: SocioHistorial as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      gradient: 'from-emerald-500 to-teal-600',
      description: 'Beneficios utilizados',
      badge: stats?.beneficiosUsados || 0
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
    <div className="space-y-6">
      {/* Header ultra-simplificado */}
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

          {/* Device indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
            isMobile 
              ? 'bg-blue-50 border-blue-200 text-blue-700' 
              : 'bg-gray-50 border-gray-200 text-gray-700'
          }`}>
            {isMobile ? (
              <>
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-bold">Móvil</span>
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-bold">Desktop</span>
              </>
            )}
          </div>
        </div>

        {/* Tab buttons - Layout responsivo */}
        <div className="flex flex-col sm:flex-row gap-3">
          {tabs.map((tab) => (
            <UltraSimpleTabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onClick={() => handleTabChange(tab.id)}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Mensaje informativo para desktop */}
        {!isMobile && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800">
              <Scan className="w-4 h-4" />
              <span className="text-sm font-medium">
                El escaneo de códigos QR está disponible solo en dispositivos móviles
              </span>
            </div>
          </div>
        )}
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
              <Suspense fallback={<UltraSimpleLoadingState tabId={activeTab} />}>
                <currentTab.component {...componentProps} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export const UltraSimpleSocioTabSystem = memo(UltraSimpleSocioTabSystemComponent);

UltraSimpleSocioTabSystem.displayName = 'UltraSimpleSocioTabSystem';

export default UltraSimpleSocioTabSystem;