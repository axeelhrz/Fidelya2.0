'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { OptimizedSocioTabSystem } from '@/components/layout/OptimizedSocioTabSystem';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

// Loading component ultra-compacto
const OptimizedLoadingState = memo(() => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
      <h2 className="text-lg font-semibold text-gray-900 mb-2">
        Cargando Dashboard
      </h2>
      <p className="text-gray-600">
        Preparando tu experiencia...
      </p>
    </div>
  </div>
));

OptimizedLoadingState.displayName = 'OptimizedLoadingState';

// Main component ultra-responsivo
export default function SimplifiedSocioDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { socio, estadisticas, loading: socioLoading } = useSocioProfile();
  const { estadisticasRapidas, beneficiosActivos, loading: beneficiosLoading } = useBeneficios();
  const { isMobile } = useDeviceDetection();
  
  // State management ultra-simplificado
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentSection, setCurrentSection] = useState(() => {
    return isMobile ? 'validar' : 'beneficios';
  });

  // Stats consolidadas ultra-compactas
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
      beneficiosEstesMes
    };
  }, [beneficiosActivos, estadisticasRapidas, estadisticas]);

  // Handlers optimizados
  const handleLogoutClick = useCallback(() => {
    setLogoutModalOpen(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Sesión cerrada');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
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
      <div className="min-h-screen bg-gray-50">
        <div className="p-3 sm:p-4 lg:p-6 max-w-6xl mx-auto">
          {/* Header ultra-compacto - Solo mostrar cuando no esté en validar en móvil */}
          {(!isMobile || currentSection !== 'validar') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border p-4 mb-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-white font-bold text-sm">
                      {(socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">
                      {socio?.nombre || user?.nombre || 'Socio'}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {isMobile ? 'Escanea y ahorra' : 'Explora tus beneficios'}
                    </p>
                  </div>
                </div>

                {/* Stats ultra-compactas */}
                <div className="flex gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">
                      {consolidatedStats.totalBeneficios}
                    </div>
                    <div className="text-xs text-gray-500">
                      Disponibles
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-green-600">
                      {consolidatedStats.beneficiosUsados}
                    </div>
                    <div className="text-xs text-gray-500">
                      Usados
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Sistema de tabs ultra-responsivo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <OptimizedSocioTabSystem
              onNavigate={handleNavigate}
              onQuickScan={handleQuickScan}
              initialTab={currentSection}
              stats={consolidatedStats}
            />
          </motion.div>
        </div>
      </div>

      {/* Modal de logout ultra-compacto */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}