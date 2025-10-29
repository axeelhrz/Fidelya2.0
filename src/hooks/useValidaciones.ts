import { useState, useEffect, useCallback } from 'react';
import type { DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { validacionesService } from '@/services/validaciones.service';
import { ValidacionResponse, Validacion } from '@/types/validacion';
import { ValidacionStats } from '@/types/comercio';
import { Timestamp, collection, query, where, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UseValidacionesReturn {
  validaciones: Validacion[];
  loading: boolean;
  error: string | null;
  refrescar: () => Promise<void>;
  validarQR: (qrData: string) => Promise<ValidacionResponse>;
  refresh: () => Promise<void>;
  getStats: () => ValidacionStats;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export const useValidaciones = (): UseValidacionesReturn => {
  const { user } = useAuth();
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [, setLastDoc] = useState<DocumentSnapshot<DocumentData> | undefined>(undefined);

  // Transform real validation data to Validacion interface
  interface ValidacionFirestoreData {
    socioId?: string;
    socioNombre?: string;
    asociacionId?: string;
    asociacionNombre?: string;
    comercioId?: string;
    comercioNombre?: string;
    beneficioUsado?: { id?: string; titulo?: string };
    beneficioId?: string;
    beneficioTitulo?: string;
    fechaValidacion?: Timestamp;
    estado?: 'exitosa' | 'fallida' | 'vencido' | string;
    montoDescuento?: number;
    codigoValidacion?: string;
    dispositivo?: { tipo?: string };
    montoCompra?: number;
  }

  const transformValidacionData = useCallback((data: ValidacionFirestoreData, id: string): Validacion => {
    return {
      id,
      socioId: data.socioId || '',
      socioNombre: data.socioNombre || 'Usuario',
      asociacionId: data.asociacionId || '',
      asociacionNombre: data.asociacionNombre || '',
      comercioId: data.comercioId || '',
      comercioNombre: data.comercioNombre || '',
      beneficioId: data.beneficioUsado?.id || data.beneficioId || '',
      beneficioTitulo: data.beneficioUsado?.titulo || data.beneficioTitulo || '',
      fechaHora: data.fechaValidacion || Timestamp.now(),
      resultado: data.estado === 'exitosa' ? 'habilitado' : 
                 data.estado === 'fallida' ? 'no_habilitado' : 'vencido',
      motivo: data.estado === 'exitosa' ? 'Validación exitosa' : 'Validación fallida',
      montoDescuento: data.montoDescuento || 0,
      metadata: {
        qrData: data.codigoValidacion || '',
        dispositivo: data.dispositivo?.tipo || 'mobile',
        ip: '0.0.0.0'
      },
      estado: data.estado === 'exitosa' ? 'completado' : 'fallido',
      monto: data.montoCompra || data.montoDescuento || 0,
      ahorro: data.montoDescuento || 0
    };
  }, []);

  // Load validaciones using fallback approach
  const cargarValidaciones = useCallback(async (reset = false) => {
    if (!user) {
      setValidaciones([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Cargando validaciones para usuario:', user.uid, 'rol:', user.role);

      // Determinar el campo de filtro basado en el rol del usuario
      let whereField = 'socioId';
      if (user.role === 'comercio') {
        whereField = 'comercioId';
      } else if (user.role === 'asociacion') {
        whereField = 'asociacionId';
      }

      // Crear query
      const validacionesRef = collection(db, 'validaciones');
      const q = query(
        validacionesRef,
        where(whereField, '==', user.uid),
        orderBy('fechaValidacion', 'desc'),
        limit(50)
      );

      // Intentar usar listener en tiempo real primero
      let useRealtime = true;
      
      const setupRealtime = () => {
        return onSnapshot(q, 
          (snapshot) => {
            console.log('📊 Validaciones encontradas (realtime):', snapshot.size);
            
            const validacionesData = snapshot.docs.map(doc => {
              const data = doc.data();
              return transformValidacionData(data, doc.id);
            });

            setValidaciones(validacionesData);
            setHasMore(snapshot.docs.length >= 50);
            setLoading(false);
            setError(null);
          }, 
          (err) => {
            console.error('❌ Error en listener de validaciones:', err);
            
            // Si falla el listener, usar fallback
            if (useRealtime) {
              console.log('🔄 Fallback a consulta única');
              useRealtime = false;
              loadWithFallback();
            } else {
              setError('Error al cargar validaciones: ' + err.message);
              setLoading(false);
            }
          }
        );
      };

      const loadWithFallback = async () => {
        try {
          console.log('📊 Cargando validaciones (fallback)...');
          const snapshot = await getDocs(q);
          
          console.log('📊 Validaciones encontradas (fallback):', snapshot.size);
          
          const validacionesData = snapshot.docs.map(doc => {
            const data = doc.data();
            return transformValidacionData(data, doc.id);
          });

          setValidaciones(validacionesData);
          setHasMore(snapshot.docs.length >= 50);
          setLoading(false);
          setError(null);
        } catch (fallbackError) {
          console.error('❌ Error en fallback:', fallbackError);
          setError('Error al cargar validaciones');
          setLoading(false);
          setValidaciones([]);
        }
      };

      // Timeout para evitar loading infinito
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('⏰ Timeout alcanzado, usando fallback');
          useRealtime = false;
          loadWithFallback();
        }
      }, 10000); // 10 segundos timeout

      // Intentar setup realtime
      let unsubscribe: (() => void) | undefined;
      
      try {
        unsubscribe = setupRealtime();
        
        // Limpiar timeout si el realtime funciona
        clearTimeout(timeoutId);
      } catch (realtimeError) {
        console.error('❌ Error configurando realtime:', realtimeError);
        clearTimeout(timeoutId);
        useRealtime = false;
        loadWithFallback();
      }

      return () => {
        clearTimeout(timeoutId);
        if (unsubscribe) {
          unsubscribe();
        }
      };
      
    } catch (err) {
      console.error('❌ Error loading validaciones:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar validaciones');
      if (reset) {
        setValidaciones([]);
      }
      setLoading(false);
    }
  }, [user, transformValidacionData, loading]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    // TODO: Implementar paginación si es necesario
  }, [hasMore, loading]);

  const refrescar = useCallback(async () => {
    setLastDoc(undefined);
    await cargarValidaciones(true);
  }, [cargarValidaciones]);

  const validarQR = useCallback(async (qrData: string): Promise<ValidacionResponse> => {
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    try {
      const parsedData = validacionesService.parseQRData(qrData);
      if (!parsedData) {
        throw new Error('Código QR inválido');
      }

      const result = await validacionesService.validarAcceso({
        socioId: user.uid,
        comercioId: parsedData.comercioId,
        beneficioId: parsedData.beneficioId,
        asociacionId: user.asociacionId
      });

      // Transform result to match ValidacionResponse interface
      const transformedResult: ValidacionResponse = {
        resultado: result.success ? 'habilitado' : 'no_habilitado',
        motivo: result.message,
        fechaHora: new Date(),
        montoDescuento: result.data?.validacion?.montoDescuento || 0,
        beneficioTitulo: result.data?.beneficio?.titulo,
        comercioNombre: result.data?.comercio?.nombre,
        socio: {
          nombre: result.data?.socio?.nombre || user.nombre || 'Usuario',
          estado: result.data?.socio?.estadoMembresia || 'activo',
          asociacion: user.asociacionId || 'independiente'
        },
        id: result.data?.validacion?.id
      };

      // Refrescar validaciones después de una nueva validación
      setTimeout(() => {
        refrescar();
      }, 1000);

      return transformedResult;
    } catch (err) {
      console.error('Error validating QR:', err);
      throw err;
    }
  }, [user, refrescar]);

  const refresh = useCallback(async () => {
    await refrescar();
  }, [refrescar]);

  // Calcular estadísticas basándose en las validaciones reales
  const getStats = useCallback(() => {
    console.log('📊 Calculando stats con', validaciones.length, 'validaciones');
    
    const stats = {
      totalValidaciones: validaciones.length,
      validacionesExitosas: validaciones.filter(v => v.resultado === 'habilitado').length,
      validacionesFallidas: validaciones.filter(v => v.resultado === 'no_habilitado').length,
      clientesUnicos: new Set(validaciones.map(v => v.socioId)).size,
      montoTotalDescuentos: validaciones.reduce((sum, v) => sum + (v.montoDescuento || 0), 0),
      porAsociacion: validaciones.reduce((acc, v) => {
        const key = v.asociacionId || 'sin_asociacion';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porBeneficio: validaciones.reduce((acc, v) => {
        const beneficioId = v.beneficioId || 'sin_beneficio';
        acc[beneficioId] = (acc[beneficioId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      porDia: validaciones.reduce((acc, v) => {
        const fecha = v.fechaHora.toDate().toISOString().split('T')[0];
        acc[fecha] = (acc[fecha] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      promedioValidacionesDiarias: validaciones.length > 0 ? 
        Math.round(validaciones.length / Math.max(1, Object.keys(validaciones.reduce((acc, v) => {
          const fecha = v.fechaHora.toDate().toISOString().split('T')[0];
          acc[fecha] = true;
          return acc;
        }, {} as Record<string, boolean>)).length)) : 0
    };
    
    console.log('📈 Stats calculadas:', stats);
    return stats;
  }, [validaciones]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    if (user) {
      cargarValidaciones(true).then((cleanupFn) => {
        if (typeof cleanupFn === 'function') {
          cleanup = cleanupFn;
        }
      });
    } else {
      // Si no hay usuario, limpiar estado inmediatamente
      setValidaciones([]);
      setLoading(false);
      setError(null);
    }

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [user, cargarValidaciones]);

  return {
    validaciones,
    loading,
    error,
    refrescar,
    validarQR,
    refresh,
    getStats,
    loadMore,
    hasMore
  };
};