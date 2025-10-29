'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  onSnapshot, 
  doc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface RealtimeConfig {
  enableToasts?: boolean;
  enableRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastSync: Date | null;
  error: string | null;
  retryCount: number;
}

interface UseRealtimeFirebaseReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  connectionState: ConnectionState;
  retry: () => void;
  forceRefresh: () => void;
}

export function useRealtimeDocument<T>(
  path: string,
  config: RealtimeConfig = {}
): UseRealtimeFirebaseReturn<T> {
  const {
    enableToasts = true,
    enableRetry = true,
    retryDelay = 3000,
    maxRetries = 3
  } = config;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastSync: null,
    error: null,
    retryCount: 0
  });

  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);

  const setupListener = useCallback(() => {
    if (!path) return;

    setLoading(true);
    setConnectionState(prev => ({ ...prev, isReconnecting: true }));

    const docRef = doc(db, path);
    
    const unsubscribe = onSnapshot(
      docRef,
      {
        includeMetadataChanges: true
      },
      (snapshot: DocumentSnapshot) => {
        try {
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';
          
          if (snapshot.exists()) {
            const docData = { id: snapshot.id, ...snapshot.data() } as T;
            setData(docData);
            setError(null);
            
            if (source === 'server') {
              setConnectionState({
                isConnected: true,
                isReconnecting: false,
                lastSync: new Date(),
                error: null,
                retryCount: 0
              });
              
              if (enableToasts && connectionState.retryCount > 0) {
                toast.success('Conexión restaurada');
              }
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

        if (enableToasts) {
          toast.error('Error de conexión');
        }

        // Auto-retry logic
        if (enableRetry && connectionState.retryCount < maxRetries) {
          const timeout = setTimeout(() => {
            setConnectionState(prev => ({ ...prev, isReconnecting: true }));
            setupListener();
          }, retryDelay);
          
          setRetryTimeout(timeout);
        }
      }
    );

    return unsubscribe;
  }, [path, enableToasts, enableRetry, retryDelay, maxRetries, connectionState.retryCount]);

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
    setLoading(true);
    retry();
  }, [retry]);

  useEffect(() => {
    const unsubscribe = setupListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [setupListener, retryTimeout]);

  return {
    data,
    loading,
    error,
    connectionState,
    retry,
    forceRefresh
  };
}

export function useRealtimeCollection<T>(
  collectionPath: string,
  queryConstraints: import('firebase/firestore').QueryConstraint[] = [],
  config: RealtimeConfig = {}
): UseRealtimeFirebaseReturn<T[]> {
  const {
    enableToasts = true,
    enableRetry = true,
    retryDelay = 3000,
    maxRetries = 3
  } = config;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastSync: null,
    error: null,
    retryCount: 0
  });

  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  const [previousDataLength, setPreviousDataLength] = useState(0);

  const setupListener = useCallback(() => {
    if (!collectionPath) return;

    setLoading(true);
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
        try {
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';
          
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as T[];
          
          setData(docs);
          setError(null);
          
          if (source === 'server') {
            setConnectionState({
              isConnected: true,
              isReconnecting: false,
              lastSync: new Date(),
              error: null,
              retryCount: 0
            });
            
            // Show toast for new items
            if (enableToasts && docs.length > previousDataLength && previousDataLength > 0) {
              const newItems = docs.length - previousDataLength;
              toast.success(`${newItems} nuevo${newItems > 1 ? 's' : ''} elemento${newItems > 1 ? 's' : ''}`, {
                icon: '🔄',
                duration: 2000,
              });
            }
            
            setPreviousDataLength(docs.length);
            
            if (connectionState.retryCount > 0) {
              toast.success('Conexión restaurada');
            }
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error processing collection snapshot:', err);
          setError('Error al procesar datos');
          setLoading(false);
        }
      },
      (err) => {
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

        if (enableToasts) {
          toast.error('Error de conexión');
        }

        // Auto-retry logic
        if (enableRetry && connectionState.retryCount < maxRetries) {
          const timeout = setTimeout(() => {
            setConnectionState(prev => ({ ...prev, isReconnecting: true }));
            setupListener();
          }, retryDelay);
          
          setRetryTimeout(timeout);
        }
      }
    );

    return unsubscribe;
  }, [collectionPath, queryConstraints, enableToasts, enableRetry, retryDelay, maxRetries, connectionState.retryCount, previousDataLength]);

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
    setLoading(true);
    retry();
  }, [retry]);

  useEffect(() => {
    const unsubscribe = setupListener();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [setupListener, retryTimeout]);

  return {
    data,
    loading,
    error,
    connectionState,
    retry,
    forceRefresh
  };
}

// Hook for real-time validaciones specific to comercio
export function useRealtimeValidaciones(comercioId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return useRealtimeCollection(
    'validaciones',
    [
      where('comercioId', '==', comercioId),
      where('fechaHora', '>=', Timestamp.fromDate(today)),
      orderBy('fechaHora', 'desc'),
      limit(50)
    ],
    {
      enableToasts: true,
      enableRetry: true,
      retryDelay: 2000,
      maxRetries: 5
    }
  );
}

// Hook for real-time comercio data
export function useRealtimeComercio(comercioId: string) {
  return useRealtimeDocument(
    `comercios/${comercioId}`,
    {
      enableToasts: false,
      enableRetry: true,
      retryDelay: 3000,
      maxRetries: 3
    }
  );
}
