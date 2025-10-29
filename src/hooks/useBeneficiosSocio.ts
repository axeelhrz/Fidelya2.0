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
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('📱 Viewport:', window.innerWidth, 'x', window.innerHeight);
    
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

      console.log('📦 Beneficios RAW obtenidos:', beneficiosData.length);
      console.log('📦 Beneficios RAW:', beneficiosData.map(b => ({
        id: b.id,
        titulo: b.titulo,
        estado: b.estado,
        fechaInicio: b.fechaInicio?.toDate ? b.fechaInicio.toDate().toISOString() : b.fechaInicio,
        fechaFin: b.fechaFin?.toDate ? b.fechaFin.toDate().toISOString() : b.fechaFin,
        limiteTotal: b.limiteTotal,
        usosActuales: b.usosActuales
      })));
      
      // Aplicar filtros básicos usando el método del servicio
      const beneficiosValidos = BeneficiosService.aplicarFiltrosBasicos(beneficiosData);
      
      console.log('✅ Beneficios válidos después de filtros:', beneficiosValidos.length);
      console.log('✅ Beneficios válidos:', beneficiosValidos.map(b => ({
        id: b.id,
        titulo: b.titulo,
        estado: b.estado,
        fechaInicio: b.fechaInicio?.toDate ? b.fechaInicio.toDate().toISOString() : b.fechaInicio,
        fechaFin: b.fechaFin?.toDate ? b.fechaFin.toDate().toISOString() : b.fechaFin
      })));
      
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

  // Debug log para verificar el estado
  useEffect(() => {
    console.log('🔍 Estado actual del hook:');
    console.log('  - Loading:', loading);
    console.log('  - Error:', error);
    console.log('  - Beneficios disponibles:', beneficios.length);
    console.log('  - Beneficios usados:', beneficiosUsados.length);
    console.log('  - Estadísticas:', estadisticas);
  }, [loading, error, beneficios.length, beneficiosUsados.length, estadisticas]);

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