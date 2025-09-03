'use client';

import React, { useState, useCallback, useMemo, memo, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { 
  QrCode, 
  Gift, 
  History,
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

// Tab configuration simplificada
interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>;
  badge?: number;
  mobileOnly?: boolean;
  desktopDisabled?: boolean;
}

// Loading component ultra-minimalista
const TabLoadingState = memo<{ tabId: string }>(({  }) => (
  <div className="flex items-center justify-center min-h-[300px]">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Cargando...</p>
    </div>
  </div>
));

TabLoadingState.displayName = 'TabLoadingState';

// Tab button ultra-responsivo y minimalista
const TabButton = memo<{
  tab: TabConfig;
  isActive: boolean;
  onClick: () => void;
  isMobile: boolean;
}>(({ tab, isActive, onClick, isMobile }) => {
  // Si es desktop y el tab está deshabilitado, mostrar deshabilitado
  if (!isMobile && tab.desktopDisabled) {
    return (
      <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed text-sm">
        <tab.icon className="w-4 h-4" />
        <span className="hidden sm:inline">{tab.label}</span>
        <Monitor className="w-3 h-3" />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200
        ${isActive 
          ? 'bg-blue-500 text-white shadow-sm' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
        }
      `}
    >
      <tab.icon className="w-4 h-4" />
      <span className="hidden sm:inline">{tab.label}</span>
      {tab.badge !== undefined && tab.badge > 0 && (
        <span className={`
          px-1.5 py-0.5 text-xs rounded-full min-w-[18px] text-center
          ${isActive ? 'bg-white/20 text-white' : 'bg-blue-500 text-white'}
        `}>
          {tab.badge > 99 ? '99+' : tab.badge}
        </span>
      )}
      {tab.mobileOnly && <Smartphone className="w-3 h-3" />}
    </button>
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

  // Tab configuration ultra-simplificada
  const tabs = useMemo<TabConfig[]>(() => [
    {
      id: 'validar',
      label: 'Escanear',
      icon: QrCode,
      component: SocioValidar as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      mobileOnly: true,
      desktopDisabled: true
    },
    {
      id: 'beneficios',
      label: 'Beneficios',
      icon: Gift,
      component: SocioBeneficios as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
      badge: stats?.totalBeneficios || 0
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: History,
      component: SocioHistorial as React.LazyExoticComponent<React.ComponentType<Record<string, unknown>>>,
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
    <div className="w-full max-w-4xl mx-auto">
      {/* Header ultra-compacto */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        {/* Tab buttons compactos */}
        <div className="flex gap-1 p-1 bg-gray-50 rounded-lg">
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

        {/* Mensaje informativo para desktop - ultra-compacto */}
        {!isMobile && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 text-center">
              📱 Escaneo QR disponible solo en móvil
            </p>
          </div>
        )}
      </div>

      {/* Content Area ultra-limpio */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <Suspense fallback={<TabLoadingState tabId={activeTab} />}>
              <currentTab.component {...componentProps} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export const OptimizedSocioTabSystem = memo(OptimizedSocioTabSystemComponent);

OptimizedSocioTabSystem.displayName = 'OptimizedSocioTabSystem';

export default OptimizedSocioTabSystem;