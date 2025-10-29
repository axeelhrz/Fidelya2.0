import { useState, useCallback } from 'react';
import { BeneficioUso } from '@/types/beneficio';
import { BeneficiosService } from '@/services/beneficios.service';
import { useAuth } from './useAuth';

interface UseBeneficioValidacionesReturn {
  validaciones: BeneficioUso[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getValidacionesPorAsociacion: (beneficioId: string, asociacionId: string) => Promise<void>;
}

export function useBeneficioValidaciones(): UseBeneficioValidacionesReturn {
  const [validaciones, setValidaciones] = useState<BeneficioUso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getValidacionesPorAsociacion = useCallback(async (beneficioId: string, asociacionId: string) => {
    if (!user || !beneficioId || !asociacionId) {
      console.warn('⚠️ Faltan parámetros para obtener validaciones:', { user: !!user, beneficioId, asociacionId });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Obteniendo validaciones del beneficio filtradas por asociación:', beneficioId, asociacionId);
      
      const validacionesFiltradas = await BeneficiosService.obtenerValidacionesBeneficioPorAsociacion(
        beneficioId,
        asociacionId,
        50 // límite de validaciones
      );

      console.log(`✅ Se obtuvieron ${validacionesFiltradas.length} validaciones filtradas`);
      setValidaciones(validacionesFiltradas);
    } catch (err) {
      console.error('❌ Error obteniendo validaciones del beneficio:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener las validaciones del beneficio';
      setError(errorMessage);
      setValidaciones([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const refresh = useCallback(async () => {
    // Para refrescar, necesitaríamos mantener los parámetros de la última consulta
    // Por simplicidad, limpiamos el cache y permitimos que se vuelva a cargar
    BeneficiosService.clearCache('validaciones_beneficio_asociacion');
    console.log('🔄 Cache de validaciones limpiado');
  }, []);

  return {
    validaciones,
    loading,
    error,
    refresh,
    getValidacionesPorAsociacion
  };
}