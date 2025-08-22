import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { adhesionService, AdhesionStats } from '@/services/adhesion.service';
import { useAuth } from './useAuth';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class ComercioDataCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: T, expiry = this.DEFAULT_EXPIRY): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T | null;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}

const comercioCache = new ComercioDataCache<AdhesionStats>();

interface UseOptimizedComercioDataReturn {
  stats: AdhesionStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  invalidateCache: () => void;
  lastUpdated: Date | null;
}

export function useOptimizedComercioData(): UseOptimizedComercioDataReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdhesionStats>({
    totalComercios: 0,
    comerciosActivos: 0,
    solicitudesPendientes: 0,
    adhesionesEsteMes: 0,
    categorias: {},
    valiacionesHoy: 0,
    validacionesMes: 0,
    clientesUnicos: 0,
    beneficiosActivos: 0,
    validacionesHoy: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const asociacionId = user?.uid || '';
  const cacheKey = useMemo(() => `comercio-stats-${asociacionId}`, [asociacionId]);

  const refreshStats = useCallback(async (forceRefresh = false) => {
    if (!asociacionId) return;

    // Check cache first
    if (!forceRefresh && comercioCache.has(cacheKey)) {
      const cachedStats = comercioCache.get(cacheKey);
      if (cachedStats) {
        setStats(cachedStats);
        return;
      }
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const newStats = await adhesionService.getAdhesionStats(asociacionId);
      
      // Update state and cache
      setStats(newStats);
      setLastUpdated(new Date());
      comercioCache.set(cacheKey, newStats, 3 * 60 * 1000); // 3 minutes cache
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err.message || 'Error al cargar estadísticas de comercios';
        setError(errorMessage);
        console.error('Error loading comercio stats:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [asociacionId, cacheKey]);

  const invalidateCache = useCallback(() => {
    comercioCache.invalidate('comercio-stats');
    setLastUpdated(null);
  }, []);

  // Load initial data
  useEffect(() => {
    if (asociacionId) {
      refreshStats();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [asociacionId, refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats: () => refreshStats(true),
    invalidateCache,
    lastUpdated,
  };
}
