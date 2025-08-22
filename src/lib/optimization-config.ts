/**
 * Configuración global para las optimizaciones del sistema
 */

export const OPTIMIZATION_CONFIG = {
  // Cache settings
  CACHE: {
    STATS_TTL: 2 * 60 * 1000, // 2 minutos para estadísticas
    DATA_TTL: 5 * 60 * 1000, // 5 minutos para datos
    NAVIGATION_TTL: 10 * 60 * 1000, // 10 minutos para navegación
    MAX_ENTRIES: 100, // Máximo número de entradas en cache
  },

  // Debounce/Throttle settings
  TIMING: {
    NAVIGATION_DEBOUNCE: 150, // ms para navegación
    STATS_UPDATE_DEBOUNCE: 1000, // ms para actualización de estadísticas
    DATA_UPDATE_DEBOUNCE: 500, // ms para actualización de datos
    SEARCH_DEBOUNCE: 300, // ms para búsquedas
    SCROLL_THROTTLE: 100, // ms para eventos de scroll
  },

  // Auto-refresh settings
  REFRESH: {
    STATS_INTERVAL: 2 * 60 * 1000, // 2 minutos para estadísticas
    DATA_INTERVAL: 5 * 60 * 1000, // 5 minutos para datos
    ENABLED_BY_DEFAULT: true,
  },

  // Performance settings
  PERFORMANCE: {
    ENABLE_MEMOIZATION: true,
    ENABLE_LAZY_LOADING: true,
    ENABLE_VIRTUAL_SCROLLING: false, // Para listas muy grandes
    MAX_CONCURRENT_REQUESTS: 3,
  },

  // UI settings
  UI: {
    ENABLE_TRANSITIONS: true,
    TRANSITION_DURATION: 300, // ms
    ENABLE_ANIMATIONS: true,
    REDUCE_MOTION_RESPECT: true, // Respetar preferencias de accesibilidad
  },

  // Development settings
  DEV: {
    ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
    LOG_CACHE_HITS: process.env.NODE_ENV === 'development',
    LOG_NAVIGATION_EVENTS: process.env.NODE_ENV === 'development',
    SHOW_DEBUG_INFO: process.env.NODE_ENV === 'development',
  }
} as const;

/**
 * Utilidades para verificar configuraciones
 */
export const OptimizationUtils = {
  /**
   * Verifica si las animaciones están habilitadas considerando las preferencias del usuario
   */
  shouldUseAnimations(): boolean {
    if (!OPTIMIZATION_CONFIG.UI.ENABLE_ANIMATIONS) return false;
    
    if (OPTIMIZATION_CONFIG.UI.REDUCE_MOTION_RESPECT && typeof window !== 'undefined') {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    return true;
  },

  /**
   * Obtiene el delay de debounce apropiado para un tipo de operación
   */
  getDebounceDelay(operation: 'navigation' | 'stats' | 'data' | 'search'): number {
    switch (operation) {
      case 'navigation':
        return OPTIMIZATION_CONFIG.TIMING.NAVIGATION_DEBOUNCE;
      case 'stats':
        return OPTIMIZATION_CONFIG.TIMING.STATS_UPDATE_DEBOUNCE;
      case 'data':
        return OPTIMIZATION_CONFIG.TIMING.DATA_UPDATE_DEBOUNCE;
      case 'search':
        return OPTIMIZATION_CONFIG.TIMING.SEARCH_DEBOUNCE;
      default:
        return 300;
    }
  },

  /**
   * Obtiene la configuración de cache para un tipo de datos
   */
  getCacheConfig(type: 'stats' | 'data' | 'navigation') {
    switch (type) {
      case 'stats':
        return {
          ttl: OPTIMIZATION_CONFIG.CACHE.STATS_TTL,
          maxSize: Math.floor(OPTIMIZATION_CONFIG.CACHE.MAX_ENTRIES * 0.3)
        };
      case 'data':
        return {
          ttl: OPTIMIZATION_CONFIG.CACHE.DATA_TTL,
          maxSize: Math.floor(OPTIMIZATION_CONFIG.CACHE.MAX_ENTRIES * 0.6)
        };
      case 'navigation':
        return {
          ttl: OPTIMIZATION_CONFIG.CACHE.NAVIGATION_TTL,
          maxSize: Math.floor(OPTIMIZATION_CONFIG.CACHE.MAX_ENTRIES * 0.1)
        };
      default:
        return {
          ttl: OPTIMIZATION_CONFIG.CACHE.DATA_TTL,
          maxSize: 20
        };
    }
  },

  /**
   * Log de performance para desarrollo
   */
  logPerformance(operation: string, startTime: number, data?: unknown) {
    if (!OPTIMIZATION_CONFIG.DEV.ENABLE_PERFORMANCE_MONITORING) return;
    
    const duration = performance.now() - startTime;
    console.log(`🚀 [Performance] ${operation}: ${duration.toFixed(2)}ms`, data);
  },

  /**
   * Log de cache para desarrollo
   */
  logCacheEvent(event: 'hit' | 'miss' | 'set' | 'invalidate', key: string, data?: unknown) {
    if (!OPTIMIZATION_CONFIG.DEV.LOG_CACHE_HITS) return;
    
    const emoji = {
      hit: '✅',
      miss: '❌',
      set: '💾',
      invalidate: '🗑️'
    }[event];
    
    console.log(`${emoji} [Cache ${event.toUpperCase()}] ${key}`, data);
  }
};
