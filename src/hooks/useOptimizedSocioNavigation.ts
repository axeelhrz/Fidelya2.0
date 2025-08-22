'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

interface UseOptimizedSocioNavigationOptions {
  initialTab?: string;
  debounceMs?: number;
  enableTransitions?: boolean;
}

export const useOptimizedSocioNavigation = (
  options: UseOptimizedSocioNavigationOptions = {}
) => {
  const { 
    initialTab = 'dashboard', 
    debounceMs = 100,
    enableTransitions = true
  } = options;
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousTab, setPreviousTab] = useState<string | null>(null);

  // Tab configuration memoized
  const tabConfig = useMemo(() => ({
    dashboard: { 
      label: 'Dashboard', 
      preload: true,
      cacheTime: 300000 // 5 minutes
    },
    perfil: { 
      label: 'Mi Perfil', 
      preload: false,
      cacheTime: 180000 // 3 minutes
    },
    beneficios: { 
      label: 'Beneficios', 
      preload: false,
      cacheTime: 180000 // 3 minutes
    },
    asociaciones: { 
      label: 'Asociaciones', 
      preload: false,
      cacheTime: 120000 // 2 minutes
    },
    validar: { 
      label: 'Validar QR', 
      preload: false,
      cacheTime: 60000 // 1 minute
    },
    historial: { 
      label: 'Historial', 
      preload: false,
      cacheTime: 120000 // 2 minutes
    }
  }), []);

  // Ultra optimized navigation function
  const navigateToTab = useCallback((tabId: string) => {
    if (tabId === activeTab || isTransitioning) return;

    if (enableTransitions) {
      setIsTransitioning(true);
      setPreviousTab(activeTab);
      
      // Ultra fast transition
      setTimeout(() => {
        setActiveTab(tabId);
        setIsTransitioning(false);
      }, debounceMs);
    } else {
      // Instant navigation
      setPreviousTab(activeTab);
      setActiveTab(tabId);
    }
  }, [activeTab, isTransitioning, enableTransitions, debounceMs]);

  // Check if tab is active
  const isActiveTab = useCallback((tabId: string) => {
    return activeTab === tabId;
  }, [activeTab]);

  // Get tab configuration
  const getTabConfig = useCallback((tabId: string) => {
    return tabConfig[tabId as keyof typeof tabConfig] || tabConfig.dashboard;
  }, [tabConfig]);

  // Preload next likely tab (predictive loading)
  const preloadTab = useCallback((tabId: string) => {
    const config = getTabConfig(tabId);
    if (config.preload) {
      // Implement preloading logic here if needed
      console.log(`Preloading tab: ${tabId}`);
    }
  }, [getTabConfig]);

  // Navigation history for back/forward
  const [navigationHistory, setNavigationHistory] = useState<string[]>([initialTab]);

  useEffect(() => {
    if (activeTab && !navigationHistory.includes(activeTab)) {
      setNavigationHistory(prev => [...prev.slice(-4), activeTab]); // Keep last 5 tabs
    }
  }, [activeTab, navigationHistory]);

  // Go back to previous tab
  const goBack = useCallback(() => {
    if (previousTab && previousTab !== activeTab) {
      navigateToTab(previousTab);
    }
  }, [previousTab, activeTab, navigateToTab]);

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    navigationCount: 0,
    averageTransitionTime: 0,
    lastNavigationTime: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const transitionTime = endTime - startTime;
      
      setPerformanceMetrics(prev => ({
        navigationCount: prev.navigationCount + 1,
        averageTransitionTime: (prev.averageTransitionTime + transitionTime) / 2,
        lastNavigationTime: transitionTime
      }));
    };
  }, [activeTab]);

  return {
    // State
    activeTab,
    isTransitioning,
    previousTab,
    navigationHistory,
    performanceMetrics,
    
    // Actions
    navigateToTab,
    isActiveTab,
    goBack,
    preloadTab,
    
    // Utils
    tabConfig,
    getTabConfig
  };
};