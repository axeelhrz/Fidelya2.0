'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { toast } from 'react-hot-toast';

interface RealtimeValidacion {
  id: string;
  comercioId: string;
  comercioNombre: string;
  comercioLogo?: string;
  beneficioId: string;
  beneficioTitulo: string;
  beneficioDescripcion: string;
  descuento: number;
  tipoDescuento: string;
  fechaValidacion: Timestamp;
  montoDescuento: number;
  estado: 'exitosa' | 'fallida' | 'pendiente' | 'cancelada';
  codigoValidacion: string;
}

interface RealtimeStats {
  totalValidaciones: number;
  ahorroTotal: number;
  beneficiosEsteMes: number;
  ahorroEsteMes: number;
  comerciosVisitados: number;
  beneficiosMasUsados: Array<{ titulo: string; usos: number }>;
  comerciosFavoritos: Array<{ nombre: string; visitas: number }>;
  validacionesPorMes: Array<{ mes: string; validaciones: number; ahorro: number }>;
}

interface ActivityLog {
  id: string;
  type: 'benefit_used' | 'profile_updated' | 'level_up' | 'achievement_earned' | 'system_alert';
  title: string;
  description: string;
  timestamp: Timestamp;
  metadata?: Record<string, unknown>;
}

export type { ActivityLog };

interface ConnectionState {
  isConnected: boolean;
  isReconnecting: boolean;
  lastSync: Date | null;
  error: string | null;
}

interface UseRealtimeSocioDataReturn {
  validaciones: RealtimeValidacion[];
  stats: RealtimeStats;
  activities: ActivityLog[];
  connectionState: ConnectionState;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
  hasNewActivity: boolean;
  markActivityAsRead: () => void;
}

export function useRealtimeSocioData(): UseRealtimeSocioDataReturn {
  const { user } = useAuth();
  const [validaciones, setValidaciones] = useState<RealtimeValidacion[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNewActivity, setHasNewActivity] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    isReconnecting: false,
    lastSync: null,
    error: null
  });

  const socioId = user?.uid || '';

  // Helper function to calculate validaciones por mes
  const calculateValidacionesPorMes = useCallback((validaciones: RealtimeValidacion[]) => {
    const now = new Date();
    const meses: { [key: string]: { validaciones: number; ahorro: number } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = fecha.toISOString().substr(0, 7); // YYYY-MM format
      meses[key] = { validaciones: 0, ahorro: 0 };
    }

    // Process validaciones
    validaciones.forEach(v => {
      const fecha = v.fechaValidacion.toDate();
      const key = fecha.toISOString().substr(0, 7);
      
      if (meses[key]) {
        meses[key].validaciones++;
        meses[key].ahorro += v.montoDescuento || 0;
      }
    });

    return Object.entries(meses).map(([mes, data]) => ({
      mes: new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
      ...data,
    }));
  }, []);

  // Calculate real-time statistics
  const stats = useMemo<RealtimeStats>(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filter validaciones for current month
    const validacionesEsteMes = validaciones.filter(v => {
      const fecha = v.fechaValidacion.toDate();
      return fecha.getMonth() === currentMonth && fecha.getFullYear() === currentYear;
    });

    // Calculate total stats
    const totalValidaciones = validaciones.length;
    const ahorroTotal = validaciones.reduce((total, v) => total + (v.montoDescuento || 0), 0);
    const beneficiosEsteMes = validacionesEsteMes.length;
    const ahorroEsteMes = validacionesEsteMes.reduce((total, v) => total + (v.montoDescuento || 0), 0);

    // Calculate unique comercios visited
    const comerciosUnicos = new Set(validaciones.map(v => v.comercioId));
    const comerciosVisitados = comerciosUnicos.size;

    // Calculate most used benefits
    const beneficiosCount: { [key: string]: { titulo: string; usos: number } } = {};
    validaciones.forEach(v => {
      const key = v.beneficioId;
      if (beneficiosCount[key]) {
        beneficiosCount[key].usos++;
      } else {
        beneficiosCount[key] = { titulo: v.beneficioTitulo, usos: 1 };
      }
    });

    const beneficiosMasUsados = Object.values(beneficiosCount)
      .sort((a, b) => b.usos - a.usos)
      .slice(0, 5);

    // Calculate favorite comercios
    const comerciosCount: { [key: string]: { nombre: string; visitas: number } } = {};
    validaciones.forEach(v => {
      const key = v.comercioId;
      if (comerciosCount[key]) {
        comerciosCount[key].visitas++;
      } else {
        comerciosCount[key] = { nombre: v.comercioNombre, visitas: 1 };
      }
    });

    const comerciosFavoritos = Object.values(comerciosCount)
      .sort((a, b) => b.visitas - a.visitas)
      .slice(0, 5);

    // Calculate validaciones por mes (last 6 months)
    const validacionesPorMes = calculateValidacionesPorMes(validaciones);

    return {
      totalValidaciones,
      ahorroTotal,
      beneficiosEsteMes,
      ahorroEsteMes,
      comerciosVisitados,
      beneficiosMasUsados,
      comerciosFavoritos,
      validacionesPorMes
    };
  }, [validaciones, calculateValidacionesPorMes]);

  // Set up real-time listener for validaciones
  useEffect(() => {
    if (!socioId) return;

    setLoading(true);
    setConnectionState(prev => ({ ...prev, isReconnecting: true }));

    const validacionesRef = collection(db, 'validaciones');
    const validacionesQuery = query(
      validacionesRef,
      where('socioId', '==', socioId),
      where('estado', '==', 'exitosa'),
      orderBy('fechaValidacion', 'desc'),
      limit(100) // Limit to last 100 validaciones for performance
    );

    const unsubscribe = onSnapshot(
      validacionesQuery,
      {
        includeMetadataChanges: true
      },
      (snapshot) => {
        try {
          const source = snapshot.metadata.fromCache ? 'cache' : 'server';
          
          const validacionesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as RealtimeValidacion[];

          // Check for new validaciones
          const previousCount = validaciones.length;
          const newCount = validacionesData.length;
          
          if (source === 'server' && newCount > previousCount && previousCount > 0) {
            setHasNewActivity(true);
            toast.success('¡Nuevo beneficio utilizado!', {
              icon: '🎉',
              duration: 3000,
            });
          }

          setValidaciones(validacionesData);
          setError(null);
          
          if (source === 'server') {
            setConnectionState({
              isConnected: true,
              isReconnecting: false,
              lastSync: new Date(),
              error: null
            });
          }
          
          setLoading(false);
        } catch (err) {
          console.error('Error processing validaciones snapshot:', err);
          setError('Error al procesar datos de validaciones');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Validaciones listener error:', err);
        const errorMessage = 'Error de conexión con validaciones';
        
        setError(errorMessage);
        setLoading(false);
        setConnectionState({
          isConnected: false,
          isReconnecting: false,
          lastSync: null,
          error: errorMessage
        });

        toast.error('Error de conexión');
      }
    );

    return () => unsubscribe();
  }, [socioId, validaciones.length]);

  // Convert validaciones to activity logs
  useEffect(() => {
    const activityLogs: ActivityLog[] = validaciones.slice(0, 10).map(validacion => ({
      id: validacion.id,
      type: 'benefit_used' as const,
      title: 'Beneficio utilizado',
      description: `${validacion.beneficioTitulo} en ${validacion.comercioNombre}`,
      timestamp: validacion.fechaValidacion,
      metadata: {
        comercioId: validacion.comercioId,
        beneficioId: validacion.beneficioId,
        descuento: validacion.descuento,
        montoDescuento: validacion.montoDescuento
      }
    }));

    setActivities(activityLogs);
  }, [validaciones]);

  // Refresh data function
  const refreshData = useCallback(() => {
    setLoading(true);
    setError(null);
    setConnectionState(prev => ({ ...prev, isReconnecting: true }));
    // The useEffect will handle the refresh automatically
  }, []);

  // Mark activity as read
  const markActivityAsRead = useCallback(() => {
    setHasNewActivity(false);
  }, []);

  return {
    validaciones,
    stats,
    activities,
    connectionState,
    loading,
    error,
    refreshData,
    hasNewActivity,
    markActivityAsRead
  };
}