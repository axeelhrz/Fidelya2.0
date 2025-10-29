'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { socioAsociacionService } from '@/services/socio-asociacion.service';
import { Socio } from '@/types/socio';
import toast from 'react-hot-toast';

export const useSocioAsociacion = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socios, setSocios] = useState<Socio[]>([]);

  // Cargar socios de una asociación
  const loadSocios = useCallback(async (asociacionId?: string) => {
    if (!user) return;
    
    const targetAsociacionId = asociacionId || user.uid;
    
    try {
      setLoading(true);
      setError(null);
      
      const sociosData = await socioAsociacionService.getSociosByAsociacion(targetAsociacionId);
      setSocios(sociosData);
      
    } catch (err) {
      console.error('Error cargando socios:', err);
      setError('Error al cargar los socios de la asociación');
      toast.error('Error al cargar los socios');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Vincular socio a asociación
  const vincularSocio = useCallback(async (socioId: string, asociacionId?: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para vincular socios');
      return false;
    }
    
    const targetAsociacionId = asociacionId || user.uid;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔗 Iniciando vinculación:', { socioId, targetAsociacionId });
      
      const result = await socioAsociacionService.vincularSocioAsociacion(socioId, targetAsociacionId);
      
      if (result) {
        toast.success('Socio vinculado exitosamente');
        // Recargar la lista de socios
        await loadSocios(targetAsociacionId);
        return true;
      } else {
        toast.error('Error al vincular el socio');
        return false;
      }
    } catch (err) {
      console.error('Error vinculando socio:', err);
      setError('Error al vincular el socio a la asociación');
      toast.error('Error al vincular el socio');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, loadSocios]);

  // Desvincular socio de asociación
  const desvincularSocio = useCallback(async (socioId: string, asociacionId?: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para desvincular socios');
      return false;
    }
    
    const targetAsociacionId = asociacionId || user.uid;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await socioAsociacionService.desvincularSocioAsociacion(socioId, targetAsociacionId);
      
      if (result) {
        toast.success('Socio desvinculado exitosamente');
        // Recargar la lista de socios
        await loadSocios(targetAsociacionId);
        return true;
      } else {
        toast.error('Error al desvincular el socio');
        return false;
      }
    } catch (err) {
      console.error('Error desvinculando socio:', err);
      setError('Error al desvincular el socio de la asociación');
      toast.error('Error al desvincular el socio');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, loadSocios]);

  // Verificar si un socio está vinculado a una asociación
  const verificarVinculacion = useCallback(async (socioId: string, asociacionId?: string) => {
    if (!user) return false;
    
    const targetAsociacionId = asociacionId || user.uid;
    
    try {
      return await socioAsociacionService.isSocioVinculado(socioId, targetAsociacionId);
    } catch (err) {
      console.error('Error verificando vinculación:', err);
      return false;
    }
  }, [user]);

  // Sincronizar asociación entre colecciones
  const sincronizarAsociacion = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const result = await socioAsociacionService.sincronizarAsociacionUsuario(userId);
      
      if (result) {
        toast.success('Asociación sincronizada correctamente');
      }
      
      return result;
    } catch (err) {
      console.error('Error sincronizando asociación:', err);
      toast.error('Error al sincronizar la asociación');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Debug de vinculación
  const debugVinculacion = useCallback(async (socioId: string) => {
    await socioAsociacionService.debugSocioVinculacion(socioId);
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estado
    socios,
    loading,
    error,
    
    // Acciones
    loadSocios,
    vincularSocio,
    desvincularSocio,
    verificarVinculacion,
    sincronizarAsociacion,
    debugVinculacion,
    clearError
  };
};

export default useSocioAsociacion;