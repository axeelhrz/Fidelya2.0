'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { OptimizedSocioTabSystem } from '@/components/layout/OptimizedSocioTabSystem';
import { SimpleSocioTabSystem } from '@/components/layout/SimpleSocioTabSystem';
import { SocioWelcomeCard } from '@/components/socio/SocioWelcomeCard';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// Optimized loading component
const OptimizedLoadingState = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="relative mb-8">
        <div className="w-20 h-20 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-blue-500 rounded-full mx-auto"
        />
      </div>
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-700 bg-clip-text text-transparent mb-3"
      >
        Inicializando Dashboard
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-600 text-lg"
      >
        Cargando tu panel de beneficios...
      </motion.p>
    </motion.div>
  </div>
));

OptimizedLoadingState.displayName = 'OptimizedLoadingState';

// Main component
export default function OptimizedSocioDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { socio, estadisticas, loading: socioLoading } = useSocioProfile();
  const { estadisticasRapidas, beneficiosActivos, loading: beneficiosLoading } = useBeneficios();
  const { isMobile, isTablet } = useDeviceDetection();
  
  // State management - optimized to prevent unnecessary re-renders
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentSection, setCurrentSection] = useState('validar'); // Cambiar default a 'validar' para móviles

  // Determinar qué sistema de tabs usar
  const useSimpleTabSystem = isMobile || isTablet;

  // Memoized consolidated stats
  const consolidatedStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calcular beneficios del mes actual
    const beneficiosEstesMes = estadisticas?.validacionesPorMes?.find(mes => {
      const [year, month] = mes.mes.split('-').map(Number);
      return year === currentYear && month === currentMonth + 1;
    })?.validaciones || 0;

    // Filtrar beneficios activos y válidos (igual que en BeneficiosList)
    const beneficiosValidos = beneficiosActivos.filter(beneficio => {
      const fechaFin = beneficio.fechaFin.toDate();
      const fechaInicio = beneficio.fechaInicio.toDate();
      
      // Verificar que esté dentro del rango de fechas válido
      if (fechaFin <= now || fechaInicio > now) return false;
      
      // Verificar límite total si existe
      if (beneficio.limiteTotal && beneficio.usosActuales >= beneficio.limiteTotal) {
        return false;
      }
      
      return true;
    });

    return {
      totalBeneficios: beneficiosValidos.length, // Beneficios realmente disponibles y válidos
      beneficiosUsados: estadisticasRapidas.usados || 0, // Beneficios que ya ha usado
      asociacionesActivas: 1, // Por ahora asumimos 1 asociación
      beneficiosEstesMes
    };
  }, [beneficiosActivos, estadisticasRapidas, estadisticas]);

  // Optimized logout handlers
  const handleLogoutClick = useCallback(() => {
    setLogoutModalOpen(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  }, [signOut, router]);

  const handleLogoutCancel = useCallback(() => {
    setLogoutModalOpen(false);
  }, []);

  // Optimized navigation handler
  const handleNavigate = useCallback((section: string) => {
    setCurrentSection(section);
  }, []);

  // Quick scan handler
  const handleQuickScan = useCallback(() => {
    setCurrentSection('validar');
  }, []);

  // View profile handler
  const handleViewProfile = useCallback(() => {
    setCurrentSection('perfil');
  }, []);

  // Redirect if not authenticated or not socio
  if (!authLoading && (!user || user.role !== 'socio')) {
    router.push('/auth/login');
    return null;
  }

  // Loading state
  if (authLoading || socioLoading || beneficiosLoading) {
    return <OptimizedLoadingState />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          {/* Welcome Card - Solo mostrar en desktop o cuando no esté en la sección de validar en móvil */}
          {(!useSimpleTabSystem || currentSection !== 'validar') && (
            <SocioWelcomeCard
              user={user ?? {}}
              socio={socio ?? undefined}
              stats={consolidatedStats}
              onQuickScan={handleQuickScan}
              onViewProfile={handleViewProfile}
              onLogout={handleLogoutClick}
            />
          )}

          {/* Tab System - Usar versión simplificada en móvil/tablet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: useSimpleTabSystem ? 0.1 : 0.3 }}
          >
            {useSimpleTabSystem ? (
              <SimpleSocioTabSystem
                onNavigate={handleNavigate}
                onQuickScan={handleQuickScan}
                initialTab={currentSection}
                stats={consolidatedStats}
              />
            ) : (
              <OptimizedSocioTabSystem
                onNavigate={handleNavigate}
                onQuickScan={handleQuickScan}
                initialTab={currentSection}
                stats={consolidatedStats}
              />
            )}
          </motion.div>
        </div>

        {/* Indicador de modo simplificado (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && useSimpleTabSystem && (
          <div className="fixed top-4 right-4 z-10 bg-blue-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Modo Simplificado</span>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Logout Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}