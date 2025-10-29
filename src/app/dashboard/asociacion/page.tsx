'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { useRealtimeSocioStats } from '@/hooks/useRealtimeSocioStats';
import { useComercios } from '@/hooks/useComercios';
import { OptimizedTabSystem } from '@/components/layout/OptimizedTabSystem';
import { AsociacionWelcomeCard } from '@/components/asociacion/AsociacionWelcomeCard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LogoutModal } from '@/components/ui/LogoutModal';

const AsociacionDashboard: React.FC = () => {
  const router = useRouter();
  const { user, signOut, loading: authLoading, refreshUser } = useAuth();
  
  // Usar el nuevo hook de estadísticas en tiempo real
  const { 
    stats: sociosStats, 
  } = useRealtimeSocioStats();
  
  const { stats: comerciosStats } = useComercios();
  
  // Initialize membership status monitoring
  const {
    isUpdating: isMembershipUpdating,
    lastUpdateTime,
    updateCount,
  } = useMembershipStatus();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // KPIs se calculan directamente donde se necesitan; sin bienvenida ni indicadores globales aquí.

  // Simple welcome banner with only logout
  const handleLogoutClick = useCallback(() => {
    setLogoutModalOpen(true);
  }, []);

  // Handle navigation between tabs
  const handleNavigate = useCallback((section: string) => {
    console.log('🧭 Navigating to section:', section);
    setActiveTab(section);
  }, []);

  // Handle logout confirmation
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

  // Handle logout cancel
  const handleLogoutCancel = useCallback(() => {
    setLogoutModalOpen(false);
  }, []);

  // Ensure user has latest profile (including nombreAsociacion)
  useEffect(() => {
    if (user && !user.nombreAsociacion) {
      refreshUser();
    }
  }, [user, refreshUser]);

  // Show membership update status in console for debugging
  useEffect(() => {
    if (lastUpdateTime && updateCount > 0) {
      console.log(`🔄 Membership status updated: ${updateCount} socios updated at ${lastUpdateTime.toLocaleTimeString()}`);
    }
  }, [lastUpdateTime, updateCount]);


  // Handle redirect for unauthorized users
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'asociacion')) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Prepare stats for the tab system using realtime data
  const tabStats = {
    totalSocios: sociosStats.total,
    comerciosActivos: comerciosStats.comerciosActivos,
  };

  // Show loading while auth is loading or user is not authorized
  if (authLoading || !user || user.role !== 'asociacion') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['asociacion']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header with membership status indicator */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-slate-900">
                  {user?.nombreAsociacion || 'Panel de Asociación'}
                </h1>
                {isMembershipUpdating && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Actualizando membresías...</span>
                  </div>
                )}
                {lastUpdateTime && !isMembershipUpdating && (
                  <div className="text-xs text-slate-500">
                    Última actualización: {lastUpdateTime.toLocaleTimeString()}
                    {updateCount > 0 && ` (${updateCount} actualizadas)`}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {/* Welcome Card (only greeting and logout) */}
          <AsociacionWelcomeCard
            user={user}
            onLogout={handleLogoutClick}
          />

          {/* Tab System */}
          <OptimizedTabSystem
            onNavigate={handleNavigate}
            initialTab={activeTab}
            stats={tabStats}
          />
        </div>

        {/* Logout Modal */}
        <LogoutModal
          isOpen={logoutModalOpen}
          isLoading={loggingOut}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />
      </div>
    </ProtectedRoute>
  );
};

export default AsociacionDashboard;