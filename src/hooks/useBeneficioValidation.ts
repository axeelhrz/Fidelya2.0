'use client';

import { useState, useCallback } from 'react';
import { validacionesService } from '@/services/validaciones.service';
import { useAuth } from './useAuth';
import { optimizedNotifications } from '@/lib/optimized-notifications';

interface ValidacionResult {
  success: boolean;
  message: string;
  data?: {
    comercio: {
      id: string;
      nombre: string;
      categoria: string;
      direccion?: string;
      logo?: string;
    };
    beneficio: {
      id: string;
      titulo: string;
      descripcion: string;
      descuento: number;
      tipo: string;
      condiciones?: string;
    };
    socio: {
      id: string;
      nombre: string;
      numeroSocio: string;
      estadoMembresia: string;
    };
    validacion: {
      id: string;
      fechaValidacion: Date;
      montoDescuento: number;
      codigoValidacion: string;
    };
  };
}

export const useBeneficioValidation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validarBeneficio = useCallback(async (
    beneficioId: string, 
    comercioId: string
  ): Promise<ValidacionResult> => {
    if (!user || user.role !== 'socio') {
      const errorMsg = 'Solo los socios pueden validar beneficios';
      optimizedNotifications.error(errorMsg);
      return { success: false, message: errorMsg };
    }

    if (!user.asociacionId) {
      const errorMsg = 'Debes estar asociado a una asociación para validar beneficios';
      optimizedNotifications.error(errorMsg);
      return { success: false, message: errorMsg };
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Iniciando validación de beneficio:', {
        beneficioId,
        comercioId,
        socioId: user.uid,
        asociacionId: user.asociacionId
      });

      const validacionRequest = {
        socioId: user.uid,
        comercioId,
        beneficioId,
        asociacionId: user.asociacionId
      };

      const result = await validacionesService.validarAcceso(validacionRequest);

      if (result.success) {
        console.log('✅ Validación exitosa:', result);
        optimizedNotifications.success(result.message);
        // Ensure beneficio is always defined for ValidacionResult
        if (
          result.data &&
          result.data.comercio &&
          result.data.beneficio &&
          result.data.socio &&
          result.data.validacion
        ) {
          return {
            success: result.success,
            message: result.message,
            data: {
              comercio: result.data.comercio,
              beneficio: result.data.beneficio,
              socio: result.data.socio,
              validacion: result.data.validacion,
            },
          };
        } else {
          const errorMsg = 'Datos de validación incompletos';
          setError(errorMsg);
          optimizedNotifications.error(errorMsg);
          return { success: false, message: errorMsg };
        }
      } else {
        console.error('❌ Validación fallida:', result.error);
        setError(result.error || result.message);
        optimizedNotifications.error(result.message);
        return { success: false, message: result.message };
      }
    } catch (err) {
      console.error('❌ Error durante la validación:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al validar beneficio';
      setError(errorMessage);
      optimizedNotifications.error(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    validarBeneficio,
    loading,
    error,
    clearError
  };
};