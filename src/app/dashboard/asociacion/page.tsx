'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { useRealtimeSocioStats } from '@/hooks/useRealtimeSocioStats';
import { useComercios } from '@/hooks/useComercios';
import { OptimizedTabSystem } from '@/components/layout/OptimizedTabSystem';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AsociacionWelcomeCard } from '@/components/asociacion/AsociacionWelcomeCard';
import { LogoutModal } from '@/components/ui/LogoutModal';
import AddSocioModal from '@/components/asociacion/AddSocioModal';
import { SocioFormData } from '@/types/socio';
import { useSocios } from '@/hooks/useSocios';

const AsociacionDashboard: React.FC = () => {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { createSocio, refreshStats } = useSocios();
  
  // Usar el nuevo hook de estadísticas en tiempo real
  const { 
    stats: sociosStats, 
    refreshStats: refreshRealtimeStats 
  } = useRealtimeSocioStats();
  
  const { stats: comerciosStats } = useComercios();
  
  // Initialize membership status monitoring
  const {
    isUpdating: isMembershipUpdating,
    lastUpdateTime,
    updateCount,
    updateMembershipStatus
  } = useMembershipStatus();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAddSocioModal, setShowAddSocioModal] = useState(false);
  const [triggerNewSocio, setTriggerNewSocio] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Memoized consolidated stats for the welcome card
  const consolidatedStats = useMemo(() => ({
    totalSocios: sociosStats.total || 0,
    sociosActivos: sociosStats.activos || 0,
    sociosVencidos: sociosStats.vencidos || 0,
    totalComercios: comerciosStats.totalComercios || 0,
    comerciosActivos: comerciosStats.comerciosActivos || 0,
    ingresosMensuales: sociosStats.ingresosMensuales || 0
  }), [sociosStats, comerciosStats]);

  // Handle navigation between tabs
  const handleNavigate = useCallback((section: string) => {
    console.log('🧭 Navigating to section:', section);
    setActiveTab(section);
  }, []);

  // Handle add member action
  const handleAddMember = useCallback(() => {
    console.log('👤 Add member triggered');
    setShowAddSocioModal(true);
    setTriggerNewSocio(true);
  }, []);

  // Handle quick actions from welcome card
  const handleQuickAction = useCallback((action: string) => {
    console.log('⚡ Quick action triggered:', action);
    setActiveTab(action);
  }, []);

  // Handle logout click
  const handleLogoutClick = useCallback(() => {
    setLogoutModalOpen(true);
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

  // Handle new socio creation
  const handleCreateSocio = useCallback(async (data: SocioFormData): Promise<boolean> => {
    try {
      console.log('📝 Creating new socio:', data.nombre);
      const success = await createSocio(data);
      
      if (success) {
        toast.success('Socio creado exitosamente');
        setShowAddSocioModal(false);
        
        // Refresh stats after creating a new socio
        await refreshStats();
        await refreshRealtimeStats();
        
        // Trigger membership status update to ensure new socio is properly categorized
        setTimeout(() => {
          updateMembershipStatus();
        }, 2000);
        
        return true;
      } else {
        toast.error('Error al crear socio');
        return false;
      }
    } catch (error) {
      console.error('Error creating socio:', error);
      toast.error('Error al crear socio');
      return false;
    }
  }, [createSocio, refreshStats, refreshRealtimeStats, updateMembershipStatus]);

  // Reset trigger when modal closes
  useEffect(() => {
    if (!showAddSocioModal) {
      setTriggerNewSocio(false);
    }
  }, [showAddSocioModal]);

  // Show membership update status in console for debugging
  useEffect(() => {
    if (lastUpdateTime && updateCount > 0) {
      console.log(`🔄 Membership status updated: ${updateCount} socios updated at ${lastUpdateTime.toLocaleTimeString()}`);
    }
  }, [lastUpdateTime, updateCount]);

  // Log when vencidos stats change
  useEffect(() => {
    if (sociosStats.vencidos > 0) {
      console.log(`⚠️ Dashboard detected ${sociosStats.vencidos} socios vencidos from realtime stats`);
    }
  }, [sociosStats.vencidos]);

  // Prepare stats for the tab system using realtime data
  const tabStats = {
    totalSocios: sociosStats.total,
    comerciosActivos: comerciosStats.comerciosActivos,
  };

  // Redirect if not authenticated or not asociacion
  if (!user || user.role !== 'asociacion') {
    router.push('/auth/login');
    return null;
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
                  Panel de Asociación
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
          {/* Welcome Card */}
          <AsociacionWelcomeCard
            user={user}
            stats={consolidatedStats}
            onQuickAction={handleQuickAction}
            onLogout={handleLogoutClick}
          />

          {/* Tab System */}
          <OptimizedTabSystem
            onNavigate={handleNavigate}
            onAddMember={handleAddMember}
            initialTab={activeTab}
            stats={tabStats}
            triggerNewSocio={triggerNewSocio}
            onNewSocioTriggered={() => setTriggerNewSocio(false)}
          />
        </div>

        {/* Add Socio Modal */}
        <AddSocioModal
          isOpen={showAddSocioModal}
          onClose={() => setShowAddSocioModal(false)}
          onSubmit={handleCreateSocio}
        />

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
