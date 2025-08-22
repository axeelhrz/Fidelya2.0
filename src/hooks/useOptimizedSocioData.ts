import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { socioService } from '@/services/socio.service';
import { SocioStats } from '@/types/socio';
import { useAuth } from './useAuth';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class DataCache<T = unknown> {
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

    return entry.data;
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

const dataCache = new DataCache<SocioStats>();

interface UseOptimizedSocioDataReturn {
  stats: SocioStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  invalidateCache: () => void;
  lastUpdated: Date | null;
}

export function useOptimizedSocioData(): UseOptimizedSocioDataReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<SocioStats>({
    total: 0,
    activos: 0,
    inactivos: 0,
    alDia: 0,
    vencidos: 0,
    pendientes: 0,
    ingresosMensuales: 0,
    beneficiosUsados: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const asociacionId = user?.uid || '';
  const cacheKey = useMemo(() => `socio-stats-${asociacionId}`, [asociacionId]);

  const refreshStats = useCallback(async (forceRefresh = false) => {
    if (!asociacionId) return;

    // Check cache first
    if (!forceRefresh && dataCache.has(cacheKey)) {
      const cachedStats = dataCache.get(cacheKey);
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

      const newStats = await socioService.getAsociacionStats(asociacionId);
      
      // Update state and cache
      setStats(newStats);
      setLastUpdated(new Date());
      dataCache.set(cacheKey, newStats, 3 * 60 * 1000); // 3 minutes cache
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err.message || 'Error al cargar estadísticas';
        setError(errorMessage);
        console.error('Error loading socio stats:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [asociacionId, cacheKey]);

  const invalidateCache = useCallback(() => {
    dataCache.invalidate('socio-stats');
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
