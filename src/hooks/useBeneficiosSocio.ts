'use client';

import { useState, useEffect, useCallback } from 'react';
import { BeneficiosService } from '@/services/beneficios.service';
import { Beneficio, BeneficioUso } from '@/types/beneficio';
import { useAuth } from './useAuth';
import toast from 'react-hot-toast';

export const useBeneficiosSocio = () => {
  const { user } = useAuth();
  
  // Estados simples
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [beneficiosUsados, setBeneficiosUsados] = useState<BeneficioUso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar beneficios disponibles
  const cargarBeneficios = useCallback(async () => {
    if (!user || user.role !== 'socio') {
      console.log('❌ Usuario no válido para cargar beneficios');
      return;
    }

    console.log('🚀 Cargando beneficios para socio:', user.uid);
    setLoading(true);
    setError(null);

    try {
      let beneficiosData: Beneficio[] = [];

      if (user.asociacionId) {
        console.log('🏢 Socio con asociación:', user.asociacionId);
        beneficiosData = await BeneficiosService.obtenerBeneficiosDisponibles(
          user.uid,
          user.asociacionId
        );
      } else {
        console.log('👤 Socio sin asociación');
        beneficiosData = await BeneficiosService.obtenerBeneficiosDisponibles(
          user.uid
        );
      }

      console.log('📦 Beneficios obtenidos:', beneficiosData.length);
      
      // Filtrar solo beneficios válidos
      const now = new Date();
      const beneficiosValidos = beneficiosData.filter(beneficio => {
        // Solo beneficios activos
        if (beneficio.estado !== 'activo') return false;
        
        // Verificar fechas
        try {
          const fechaFin = (beneficio.fechaFin && typeof beneficio.fechaFin.toDate === 'function')
            ? beneficio.fechaFin.toDate()
            : (typeof beneficio.fechaFin === 'string' || typeof beneficio.fechaFin === 'number')
              ? new Date(beneficio.fechaFin)
              : beneficio.fechaFin;
          const fechaInicio = (beneficio.fechaInicio && typeof beneficio.fechaInicio.toDate === 'function')
            ? beneficio.fechaInicio.toDate()
            : (typeof beneficio.fechaInicio === 'string' || typeof beneficio.fechaInicio === 'number')
              ? new Date(beneficio.fechaInicio)
              : beneficio.fechaInicio;
          
          if (fechaFin <= now || fechaInicio > now) return false;
        } catch (error) {
          console.warn('Error procesando fechas del beneficio:', beneficio.id, error);
          return false;
        }
        
        // Verificar límites
        if (beneficio.limiteTotal && beneficio.usosActuales >= beneficio.limiteTotal) {
          return false;
        }
        
        return true;
      });

      console.log('✅ Beneficios válidos:', beneficiosValidos.length);
      setBeneficios(beneficiosValidos);
      
    } catch (err) {
      console.error('❌ Error cargando beneficios:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar beneficios';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar historial de beneficios usados
  const cargarHistorialUsos = useCallback(async () => {
    if (!user || user.role !== 'socio') return;

    try {
      console.log('📋 Cargando historial de usos para:', user.uid);
      const usos = await BeneficiosService.obtenerHistorialUsos(user.uid);
      console.log('✅ Usos cargados:', usos.length);
      setBeneficiosUsados(usos);
    } catch (err) {
      console.error('❌ Error cargando historial:', err);
    }
  }, [user]);

  // Usar un beneficio
  const usarBeneficio = useCallback(async (beneficioId: string, comercioId: string) => {
    if (!user || user.role !== 'socio') {
      toast.error('Solo los socios pueden usar beneficios');
      return false;
    }

    if (!user.asociacionId) {
      toast.error('Debes estar asociado a una asociación para usar beneficios');
      return false;
    }

    try {
      setLoading(true);
      
      const socioData = {
        nombre: user.nombre || user.email || 'Usuario',
        email: user.email || ''
      };

      await BeneficiosService.usarBeneficio(
        beneficioId,
        user.uid,
        socioData,
        comercioId,
        user.asociacionId
      );
      
      toast.success('¡Beneficio usado exitosamente!');
      
      // Recargar datos
      await Promise.all([
        cargarBeneficios(),
        cargarHistorialUsos()
      ]);
      
      return true;
    } catch (err) {
      console.error('❌ Error usando beneficio:', err);
      const message = err instanceof Error ? err.message : 'Error al usar beneficio';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, cargarBeneficios, cargarHistorialUsos]);

  // Refrescar datos
  const refrescar = useCallback(async () => {
    console.log('🔄 Refrescando datos...');
    await Promise.all([
      cargarBeneficios(),
      cargarHistorialUsos()
    ]);
    toast.success('Datos actualizados');
  }, [cargarBeneficios, cargarHistorialUsos]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user && user.role === 'socio') {
      console.log('🎯 Cargando datos iniciales para socio');
      cargarBeneficios();
      cargarHistorialUsos();
    }
  }, [user, cargarBeneficios, cargarHistorialUsos]);

  // Estadísticas simples
  const estadisticas = {
    disponibles: beneficios.length,
    usados: beneficiosUsados.length,
    ahorroTotal: beneficiosUsados.reduce((total, uso) => total + (uso.montoDescuento || 0), 0)
  };

  return {
    beneficios,
    beneficiosUsados,
    loading,
    error,
    estadisticas,
    usarBeneficio,
    refrescar
  };
};