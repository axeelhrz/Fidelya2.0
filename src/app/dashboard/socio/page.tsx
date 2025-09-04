'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { OptimizedSocioTabSystem } from '@/components/layout/OptimizedSocioTabSystem';
import { SocioWelcomeCard } from '@/components/socio/SocioWelcomeCard';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// Enhanced loading component with modern design
const OptimizedLoadingState = memo(() => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="relative mb-8">
        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-500 rounded-full mx-auto"
        />
      </div>
      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-purple-700 bg-clip-text text-transparent mb-3"
      >
        Cargando Dashboard
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-slate-600 text-lg"
      >
        Preparando tu experiencia como socio...
      </motion.p>
    </motion.div>
  </div>
));

OptimizedLoadingState.displayName = 'OptimizedLoadingState';

// Main component with enhanced design
export default function EnhancedSocioDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { socio, estadisticas, loading: socioLoading } = useSocioProfile();
  const { estadisticasRapidas, beneficiosActivos, loading: beneficiosLoading } = useBeneficios();
  const { isMobile } = useDeviceDetection();
  
  // State management optimized
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentSection, setCurrentSection] = useState(() => {
    return isMobile ? 'validar' : 'beneficios';
  });

  // Enhanced consolidated stats
  const consolidatedStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const beneficiosEstesMes = estadisticas?.validacionesPorMes?.find(mes => {
      const [year, month] = mes.mes.split('-').map(Number);
      return year === currentYear && month === currentMonth + 1;
    })?.validaciones || 0;

    const beneficiosValidos = beneficiosActivos.filter(beneficio => {
      const fechaFin = beneficio.fechaFin.toDate();
      const fechaInicio = beneficio.fechaInicio.toDate();
      
      if (fechaFin <= now || fechaInicio > now) return false;
      if (beneficio.limiteTotal && beneficio.usosActuales >= beneficio.limiteTotal) {
        return false;
      }
      
      return true;
    });

    return {
      totalBeneficios: beneficiosValidos.length,
      beneficiosUsados: estadisticasRapidas.usados || 0,
      beneficiosEstesMes,
      ahorroTotal: estadisticasRapidas.ahorroTotal || 0,
      asociacionesVinculadas: socio?.asociaciones?.length || 0
    };
  }, [beneficiosActivos, estadisticasRapidas, estadisticas, socio]);

  // Enhanced handlers
  const handleLogout = useCallback(() => {
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

  const handleNavigate = useCallback((section: string) => {
    setCurrentSection(section);
  }, []);

  const handleQuickScan = useCallback(() => {
    setCurrentSection('validar');
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        {/* Enhanced header for mobile */}
        <div className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-sm">
                    {(socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'}
                  </span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900">
                    Panel de Socio
                  </h1>
                  <p className="text-sm text-slate-600">
                    {isMobile ? 'Escanea y ahorra' : 'Explora tus beneficios'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          {/* Enhanced Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <SocioWelcomeCard
              user={{
                nombre: socio?.nombre || user?.nombre || 'Socio',
                numeroSocio: socio?.numeroSocio || user?.uid?.slice(-6) || '000000',
                avatar: socio?.avatar || user?.avatar
              }}
              onLogout={handleLogout}
            />
          </motion.div>

          {/* Enhanced Tab System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-indigo-500/5 rounded-3xl -z-10" />
            
            <OptimizedSocioTabSystem
              onNavigate={handleNavigate}
              onQuickScan={handleQuickScan}
              initialTab={currentSection}
              stats={consolidatedStats}
            />
          </motion.div>
        </div>
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