'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { OptimizedSocioTabSystem } from '@/components/layout/OptimizedSocioTabSystem';
import { UltraOptimizedTransitions } from '@/components/layout/UltraOptimizedTransitions';
import { useAuth } from '@/hooks/useAuth';
import { useSocioProfile } from '@/hooks/useSocioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useOptimizedSocioNavigation } from '@/hooks/useOptimizedSocioNavigation';
import { LogOut, User, Bell, Settings } from 'lucide-react';

export default function SocioDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { socio, loading: socioLoading } = useSocioProfile();
  const { estadisticasRapidas } = useBeneficios();
  
  // Optimized navigation hook
  const {
    activeTab,
    performanceMetrics
  } = useOptimizedSocioNavigation({
    initialTab: 'dashboard',
    debounceMs: 100,
    enableTransitions: true
  });
  
  // State management
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Memoized stats for performance
  const optimizedStats = useMemo(() => ({
    totalBeneficios: estadisticasRapidas.disponibles || 0,
    beneficiosUsados: estadisticasRapidas.usados || 0,
    asociacionesActivas: 1, // Mock data - to be implemented
    ahorroTotal: estadisticasRapidas.ahorroTotal || 0,
    ahorroEsteMes: estadisticasRapidas.ahorroEsteMes || 0
  }), [estadisticasRapidas]);

  // User info for header
  // (Removed duplicate declaration)

  // User info for header
  const userInfo = useMemo(() => ({
    name: socio?.nombre || user?.nombre || 'Socio',
    number: socio?.numeroSocio || 'N/A',
    initial: (socio?.nombre || user?.nombre)?.charAt(0).toUpperCase() || 'S'
  }), [socio?.nombre, socio?.numeroSocio, user?.nombre]);

  // Redirect if not authenticated or not socio
  if (!authLoading && (!user || user.role !== 'socio')) {
    router.push('/auth/login');
    return null;
  }

  // Logout handlers
  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
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
  };

  // Add missing handleLogoutCancel function
  const handleLogoutCancel = () => {
    setLogoutModalOpen(false);
  };

  // Add missing handleNavigate function
  const handleNavigate = (tabKey: string) => {
    // You may want to update activeTab or perform navigation logic here
    // Example: router.push(`/dashboard/asociacion/socios/${tabKey}`);
    // For now, just log the navigation
    console.log('Navigating to tab:', tabKey);
  };

  // Add missing handleQuickScan function
  const handleQuickScan = () => {
    // Implement quick scan logic here
    toast('Funcionalidad de escaneo rápido no implementada.');
  };

  // Memoized stats for performance
  // (Moved above conditional return to avoid conditional hook call)

  // User info for header
  // (Moved above conditional return to avoid conditional hook call)

  // Loading state with modern design
  if (authLoading || socioLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-indigo-300 rounded-full animate-pulse mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Cargando Dashboard
          </h2>
          <p className="text-slate-600 text-lg">
            Preparando tu panel de beneficios...
          </p>
          <div className="mt-6 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Header Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-lg"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">Fidelya</h1>
                <p className="text-sm text-slate-600 font-medium">Panel de Socio</p>
              </div>
            </div>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-2 rounded-2xl border border-slate-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-sm">
                    {userInfo.initial}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {userInfo.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Socio #{userInfo.number}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button className="w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <Bell className="w-5 h-5" />
                </button>
                
                <button className="w-10 h-10 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <Settings className="w-5 h-5" />
                </button>
                
                <button
                  onClick={handleLogoutClick}
                  className="w-10 h-10 bg-red-100 hover:bg-red-200 border border-red-200 rounded-2xl flex items-center justify-center text-red-600 hover:text-red-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl">
          <UltraOptimizedTransitions
            activeKey={activeTab}
            direction="horizontal"
            duration={200}
            className="min-h-screen"
          >
            {/* Performance Header */}
            {process.env.NODE_ENV === 'development' && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-black/80 backdrop-blur-sm text-white text-sm px-4 py-2 rounded-lg border border-white/20 max-w-fit"
              >
                <div className="flex items-center gap-4">
                  <span>Navegaciones: {performanceMetrics.navigationCount}</span>
                  <span>Tiempo promedio: {performanceMetrics.averageTransitionTime.toFixed(2)}ms</span>
                  <span>Tab activo: {activeTab}</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
              </motion.div>
            )}

            {/* Optimized Tab System */}
            <OptimizedSocioTabSystem
              onNavigate={handleNavigate}
              onQuickScan={handleQuickScan}
              initialTab={activeTab}
              stats={optimizedStats}
            />
          </UltraOptimizedTransitions>
        </div>
      </div>

      {/* Modern Logout Modal */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
}
