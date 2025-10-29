'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  onSnapshot, 
  doc, 
  collection, 
  query, 
  DocumentSnapshot,
  QuerySnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useDebounce } from './useDebounce';

interface OptimizedRealtimeConfig {
  enableToasts?: boolean;
  enableRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
  debounceMs?: number;
  cacheTimeout?: number;
  enableOfflineSupport?: boolean;
}

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastSync: Date | null;
  error: string | null;
  retryCount: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  source: 'cache' | 'server';
}

interface UseOptimizedRealtimeReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  connectionState: ConnectionState;
  retry: () => void;
  forceRefresh: () => void;
  isFromCache: boolean;
}

// Cache global para datos
const dataCache = new Map<string, CacheEntry<unknown>>();

// Función para limpiar cache expirado
const cleanExpiredCache = (timeout: number) => {
  const now = Date.now();
  for (const [key, entry] of dataCache.entries()) {
    if (now - entry.timestamp > timeout) {
      dataCache.delete(key);
    }
  }
};

export function useOptimizedRealtimeDocument<T>(
  path: string,
  config: OptimizedRealtimeConfig = {}
): UseOptimizedRealtimeReturn<T> {
  const {
    enableRetry = true,
    retryDelay = 3000,
    maxRetries = 3,
    debounceMs = 300,
    cacheTimeout = 30000, // 30 segundos
    enableOfflineSupport = true
  } = config;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastSync: null,
    error: null,
    retryCount: 0
  });

  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const lastUpdateRef = useRef<number>(0);

  // Debounced update function
  const debouncedUpdate = useDebounce(
    (...args: unknown[]) => {
      if (!mountedRef.current) return;

      const { newData, source } = args[0] as { newData: T; source: 'cache' | 'server' };
      const now = Date.now();

      // Evitar actualizaciones muy frecuentes
      if (now - lastUpdateRef.current < debounceMs && source === 'cache') {
        return;
      }

      lastUpdateRef.current = now;
      setData(newData);
      setIsFromCache(source === 'cache');

      // Actualizar cache
      if (path) {
        dataCache.set(path, {
          data: newData,
          timestamp: now,
          source
        });
      }
    },
    debounceMs
  );

  // Función para obtener datos del cache
  const getCachedData = useCallback((): T | null => {
    if (!path) return null;
    
    const cached = dataCache.get(path);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data as T;
    }
    
    return null;
  }, [path, cacheTimeout]);

  const setupListener = useCallback(() => {
    if (!path || !mountedRef.current) return;

    // Limpiar listener anterior
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Intentar cargar desde cache primero
    const cachedData = getCachedData();
    if (cachedData && enableOfflineSupport) {
      setData(cachedData);
      setIsFromCache(true);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setConnectionState(prev => ({ ...prev, isReconnecting: true }));

    const docRef = doc(db, path);
    
    const unsubscribe = onSnapshot(
      docRef,
      {
        includeMetadataChanges: true
      },
      (snapshot: DocumentSnapshot) => {
        if (!mountedRef.current) return;

        try {
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';
          
          if (snapshot.exists()) {
            const docData = { id: snapshot.id, ...snapshot.data() } as T;
            
            // Solo actualizar si los datos han cambiado realmente
            const currentDataStr = JSON.stringify(data);
            const newDataStr = JSON.stringify(docData);

            if (currentDataStr !== newDataStr || source === 'server') {
              debouncedUpdate({ newData: docData, source });
            }
            
            setError(null);
            
            if (source === 'server') {
              setConnectionState({
                isConnected: true,
                isReconnecting: false,
                lastSync: new Date(),
                error: null,
                retryCount: 0
              });
            }
          } else {
            setData(null);
            setError('Documento no encontrado');
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error processing document snapshot:', err);
          setError('Error al procesar datos');
          setLoading(false);
        }
      },
      (err) => {
        if (!mountedRef.current) return;
        
        console.error('Firestore listener error:', err);
        const errorMessage = 'Error de conexión con Firebase';
        
        setError(errorMessage);
        setLoading(false);
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isReconnecting: false,
          error: errorMessage,
          retryCount: prev.retryCount + 1
        }));

        // Auto-retry logic
        if (enableRetry && connectionState.retryCount < maxRetries) {
          const timeout = setTimeout(() => {
            if (mountedRef.current) {
              setConnectionState(prev => ({ ...prev, isReconnecting: true }));
              setupListener();
            }
          }, retryDelay);
          
          setRetryTimeout(timeout);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [
    path, 
    enableRetry, 
    retryDelay, 
    maxRetries, 
    connectionState.retryCount, 
    getCachedData, 
    enableOfflineSupport,
    debouncedUpdate,
    data
  ]);

  const retry = useCallback(() => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }
    
    setConnectionState(prev => ({ 
      ...prev, 
      retryCount: 0, 
      isReconnecting: true,
      error: null 
    }));
    
    setupListener();
  }, [setupListener, retryTimeout]);

  const forceRefresh = useCallback(() => {
    // Limpiar cache para este path
    if (path) {
      dataCache.delete(path);
    }
    setLoading(true);
    retry();
  }, [retry, path]);

  // Cleanup al desmontar
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  // Configurar listener inicial
  useEffect(() => {
    setupListener();
    
    // Limpiar cache expirado periódicamente
    const cleanupInterval = setInterval(() => {
      cleanExpiredCache(cacheTimeout);
    }, cacheTimeout);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [setupListener, cacheTimeout]);

  return {
    data,
    loading,
    error,
    connectionState,
    retry,
    forceRefresh,
    isFromCache
  };
}

export function useOptimizedRealtimeCollection<T>(
  collectionPath: string,
  queryConstraints: QueryConstraint[] = [],
  config: OptimizedRealtimeConfig = {}
): UseOptimizedRealtimeReturn<T[]> {
  const {
    enableRetry = true,
    retryDelay = 3000,
    maxRetries = 3,
    debounceMs = 500, // Más tiempo para colecciones
    cacheTimeout = 60000, // 1 minuto para colecciones
    enableOfflineSupport = true
  } = config;
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastSync: null,
    error: null,
    retryCount: 0
  });

  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const lastUpdateRef = useRef<number>(0);

  // Cache key basado en path y constraints
  const cacheKey = useMemo(() => {
    const constraintsStr = JSON.stringify(queryConstraints.map(c => c.toString()));
    return `${collectionPath}_${constraintsStr}`;
  }, [collectionPath, queryConstraints]);

  // Debounced update function
  const debouncedUpdate = useDebounce((...args: unknown[]) => {
    if (!mountedRef.current) return;

    const { newData, source } = args[0] as { newData: T[]; source: 'cache' | 'server' };
    const now = Date.now();

    // Evitar actualizaciones muy frecuentes
    if (now - lastUpdateRef.current < debounceMs && source === 'cache') {
      return;
    }

    lastUpdateRef.current = now;
    setData(newData);
    setIsFromCache(source === 'cache');

    // Actualizar cache
    dataCache.set(cacheKey, {
      data: newData,
      timestamp: now,
      source
    });
  }, debounceMs);

  const getCachedData = useCallback((): T[] | null => {
    const cached = dataCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data as T[];
    }
    return null;
  }, [cacheKey, cacheTimeout]);

  const setupListener = useCallback(() => {
    if (!collectionPath || !mountedRef.current) return;

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // Intentar cargar desde cache primero
    const cachedData = getCachedData();
    if (cachedData && enableOfflineSupport) {
      setData(cachedData);
      setIsFromCache(true);
      setLoading(false);
    } else {
      setLoading(true);
    }

    setConnectionState(prev => ({ ...prev, isReconnecting: true }));

    const collectionRef = collection(db, collectionPath);
    const q = queryConstraints.length > 0 
      ? query(collectionRef, ...queryConstraints)
      : query(collectionRef);
    
    const unsubscribe = onSnapshot(
      q,
      {
        includeMetadataChanges: true
      },
      (snapshot: QuerySnapshot) => {
        if (!mountedRef.current) return;

        try {
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';
          
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          
          // Solo actualizar si los datos han cambiado realmente
          const currentDataStr = JSON.stringify(data);
          const newDataStr = JSON.stringify(docs);
          
          if (currentDataStr !== newDataStr || source === 'server') {
            debouncedUpdate(docs, source);
          }
          
          setError(null);
          
          if (source === 'server') {
            setConnectionState({
              isConnected: true,
              isReconnecting: false,
              lastSync: new Date(),
              error: null,
              retryCount: 0
            });
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error processing collection snapshot:', err);
          setError('Error al procesar datos');
          setLoading(false);
        }
      },
      (err) => {
        if (!mountedRef.current) return;
        
        console.error('Firestore collection listener error:', err);
        const errorMessage = 'Error de conexión con Firebase';
        
        setError(errorMessage);
        setLoading(false);
        setConnectionState(prev => ({
          ...prev,
          isConnected: false,
          isReconnecting: false,
          error: errorMessage,
          retryCount: prev.retryCount + 1
        }));

        if (enableRetry && connectionState.retryCount < maxRetries) {
          const timeout = setTimeout(() => {
            if (mountedRef.current) {
              setConnectionState(prev => ({ ...prev, isReconnecting: true }));
              setupListener();
            }
          }, retryDelay);
          
          setRetryTimeout(timeout);
        }
      }
    );

    unsubscribeRef.current = unsubscribe;
    return unsubscribe;
  }, [
    collectionPath, 
    queryConstraints, 
    enableRetry, 
    retryDelay, 
    maxRetries, 
    connectionState.retryCount,
    getCachedData,
    enableOfflineSupport,
    debouncedUpdate,
    data
  ]);

  const retry = useCallback(() => {
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      setRetryTimeout(null);
    }
    
    setConnectionState(prev => ({ 
      ...prev, 
      retryCount: 0, 
      isReconnecting: true,
      error: null 
    }));
    
    setupListener();
  }, [setupListener, retryTimeout]);

  const forceRefresh = useCallback(() => {
    dataCache.delete(cacheKey);
    setLoading(true);
    retry();
  }, [retry, cacheKey]);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  useEffect(() => {
    setupListener();
    
    const cleanupInterval = setInterval(() => {
      cleanExpiredCache(cacheTimeout);
    }, cacheTimeout);
    
    return () => {
      clearInterval(cleanupInterval);
    };
  }, [setupListener, cacheTimeout]);

  return {
    data,
    loading,
    error,
    connectionState,
    retry,
    forceRefresh,
    isFromCache
  };
}
