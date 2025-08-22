'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { validacionesService } from '@/services/validaciones.service';
import { ValidacionResponse, ValidacionRequest } from '@/types/validacion';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

interface ValidationStats {
  validacionesHoy: number;
  validacionesExitosas: number;
  validacionesFallidas: number;
  ahorroTotal: number;
  ultimaValidacion: Date | null;
  tasaExito: number;
}

interface RecentValidation {
  id: string;
  comercioNombre: string;
  beneficioTitulo?: string;
  resultado: string;
  fechaHora: Date;
  montoDescuento?: number;
  motivo?: string;
}

export const useSocioValidaciones = () => {
  const { user } = useAuth();
  const [validaciones, setValidaciones] = useState<RecentValidation[]>([]);
  const [stats, setStats] = useState<ValidationStats>({
    validacionesHoy: 0,
    validacionesExitosas: 0,
    validacionesFallidas: 0,
    ahorroTotal: 0,
    ultimaValidacion: null,
    tasaExito: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calcular estadísticas
  const calculateStats = useCallback((validacionesData: RecentValidation[]) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Validaciones de hoy
    const validacionesHoy = validacionesData.filter(v => 
      v.fechaHora >= startOfDay
    ).length;

    // Validaciones exitosas y fallidas
    const validacionesExitosas = validacionesData.filter(v => 
      v.resultado === 'habilitado'
    ).length;

    const validacionesFallidas = validacionesData.length - validacionesExitosas;

    // Ahorro total
    const ahorroTotal = validacionesData
      .filter(v => v.resultado === 'habilitado')
      .reduce((total, v) => total + (v.montoDescuento || 0), 0);

    // Última validación
    const ultimaValidacion = validacionesData.length > 0 
      ? validacionesData[0].fechaHora 
      : null;

    // Tasa de éxito
    const tasaExito = validacionesData.length > 0 
      ? (validacionesExitosas / validacionesData.length) * 100 
      : 0;

    setStats({
      validacionesHoy,
      validacionesExitosas,
      validacionesFallidas,
      ahorroTotal,
      ultimaValidacion,
      tasaExito
    });
  }, []);

  // Cargar validaciones del socio
  useEffect(() => {
    if (!user || user.role !== 'socio') {
      setLoading(false);
      return;
    }

    const validacionesQuery = query(
      collection(db, 'validaciones'),
      where('socioId', '==', user.uid),
      orderBy('fechaHora', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(validacionesQuery, (snapshot) => {
      try {
        const validacionesData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            comercioNombre: data.comercioNombre || 'Comercio',
            beneficioTitulo: data.beneficioTitulo,
            resultado: data.resultado,
            fechaHora: data.fechaHora.toDate(),
            montoDescuento: data.montoDescuento,
            motivo: data.motivo
          };
        }) as RecentValidation[];

        setValidaciones(validacionesData);
        calculateStats(validacionesData);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error processing validaciones:', error);
        setError('Error al cargar las validaciones');
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching validaciones:', error);
      setError('Error al cargar las validaciones');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, calculateStats]);

  // Validar QR
  const validarQR = useCallback(async (qrData: string): Promise<ValidacionResponse | null> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      const parsedData = validacionesService.parseQRData(qrData);
      if (!parsedData) {
        throw new Error('Código QR inválido');
      }

      const request: ValidacionRequest = {
        socioId: user.uid,
        comercioId: parsedData.comercioId,
        beneficioId: parsedData.beneficioId
      };

      const result = await validacionesService.validarAcceso(request);
      
      if (result.success) {
        toast.success('¡Validación exitosa!');
        // Convert service response to ValidacionResponse format
        return {
          resultado: 'habilitado',
          beneficio: result.data?.beneficio ? {
            id: result.data.beneficio.id,
            titulo: result.data.beneficio.titulo,
            descuento: result.data.beneficio.descuento,
            tipo: result.data.beneficio.tipo,
            comercioNombre: result.data.comercio.nombre,
            descripcion: result.data.beneficio.descripcion
          } : undefined,
          socio: {
            nombre: result.data?.socio.nombre || '',
            estado: result.data?.socio.estadoMembresia || '',
            asociacion: ''
          },
          validacionId: result.data?.validacion.id,
          fechaHora: result.data?.validacion.fechaValidacion || new Date(),
          montoDescuento: result.data?.validacion.montoDescuento,
          beneficioTitulo: result.data?.beneficio?.titulo,
          id: result.data?.validacion.id,
          comercioNombre: result.data?.comercio.nombre
        };
      } else {
        toast.error(result.message || 'Validación fallida');
        return {
          resultado: 'no_habilitado',
          motivo: result.message,
          socio: {
            nombre: '',
            estado: '',
            asociacion: ''
          },
          fechaHora: new Date()
        };
      }
    } catch (error) {
      console.error('Error validating QR:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al validar el código QR';
      toast.error(errorMessage);
      return null;
    }
  }, [user]);

  // Obtener validaciones recientes
  const getRecentValidations = useCallback((limit?: number) => {
    return limit ? validaciones.slice(0, limit) : validaciones;
  }, [validaciones]);

  // Filtrar validaciones por resultado
  const getValidationsByResult = useCallback((resultado: string) => {
    return validaciones.filter(v => v.resultado === resultado);
  }, [validaciones]);

  // Obtener validaciones por rango de fechas
  const getValidationsByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return validaciones.filter(v => 
      v.fechaHora >= startDate && v.fechaHora <= endDate
    );
  }, [validaciones]);

  // Refrescar datos
  const refresh = useCallback(async () => {
    if (!user || user.role !== 'socio') return;

    try {
      setLoading(true);
      const historialResult = await validacionesService.getHistorialValidaciones(user.uid);
      
      const validacionesData = historialResult.validaciones.map(v => ({
        id: v.id,
        comercioNombre: v.comercioNombre || 'Comercio',
        beneficioTitulo: v.beneficioTitulo,
        resultado: v.estado === 'exitosa' ? 'habilitado' : 'no_habilitado',
        fechaHora: v.fechaValidacion,
        montoDescuento: v.montoDescuento,
        motivo: v.estado === 'fallida' ? 'Validación fallida' : undefined
      }));

      setValidaciones(validacionesData);
      calculateStats(validacionesData);
      setError(null);
    } catch (error) {
      console.error('Error refreshing validaciones:', error);
      setError('Error al actualizar las validaciones');
    } finally {
      setLoading(false);
    }
  }, [user, calculateStats]);

  return {
    // Datos
    validaciones,
    stats,
    loading,
    error,
    
    // Acciones
    validarQR,
    refresh,
    
    // Utilidades
    getRecentValidations,
    getValidationsByResult,
    getValidationsByDateRange
  };
};