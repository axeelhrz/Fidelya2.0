'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { OptimizedTabSystem } from '@/components/layout/OptimizedTabSystem';
import { useAuth } from '@/hooks/useAuth';
import { useSocios } from '@/hooks/useSocios';
import { useComercios } from '@/hooks/useComercios';
import { useBeneficiosAsociacion } from '@/hooks/useBeneficios';
import { 
  Building2,
  TrendingUp,
  Shield,
  LogOut
} from 'lucide-react';

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
        Cargando tu panel de control...
      </motion.p>
    </motion.div>
  </div>
));

OptimizedLoadingState.displayName = 'OptimizedLoadingState';

// Memoized header component
interface User {
  nombre?: string;
  role?: string;
  // Add other user properties as needed
}

interface Stats {
  [key: string]: number;
}

const DashboardHeader = memo<{
  user: User;
  stats: Stats;
  onAddMember: () => void;
  onLogout: () => void;
}>(({ user, onAddMember, onLogout }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl border border-white/30 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6">
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl sm:shadow-2xl">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full border-2 sm:border-3 border-white shadow-lg flex items-center justify-center">
              <TrendingUp className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
            </div>
          </div>
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-1 sm:mb-2"
            >
              Hola, {user?.nombre || 'Administrador'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base lg:text-lg xl:text-xl text-slate-600"
            >
              Panel de control de asociación
            </motion.p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddMember}
            className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-800 hover:to-slate-900 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-xl sm:rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl group text-sm sm:text-base"
          >
            <span>Nuevo Socio</span>
          </motion.button>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-emerald-50 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-emerald-200">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              <span className="text-xs sm:text-sm font-medium text-emerald-700">Seguro</span>
            </div>
            
            {/* Solo botón de Logout - ELIMINADO el botón de Settings/Configuración */}
            <div className="flex items-center gap-2">
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="p-2.5 sm:p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl sm:rounded-2xl transition-all duration-200"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

// Main component
export default function OptimizedAsociacionDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  
  // Hooks for stats
  const { stats: sociosStats} = useSocios();
  const { stats: comerciosStats} = useComercios();
  const { stats: beneficiosStats } = useBeneficiosAsociacion();
  
  // State management - optimized to prevent unnecessary re-renders
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [triggerNewSocio, setTriggerNewSocio] = useState(false);

  // Memoized consolidated stats
  const consolidatedStats = useMemo(() => ({
    totalSocios: sociosStats?.total || 0,
    sociosActivos: sociosStats?.activos || 0,
    comerciosActivos: comerciosStats?.comerciosActivos || 0,
    beneficiosActivos: beneficiosStats?.beneficiosActivos || 0,
    ingresosMensuales: sociosStats?.ingresosMensuales || 0
  }), [sociosStats, comerciosStats, beneficiosStats]);

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

  // Enhanced add member handler that triggers the new socio dialog
  const handleAddMember = useCallback(() => {
    console.log('🔥 handleAddMember called - navigating to socios and triggering dialog');
    setCurrentSection('socios');
    setTriggerNewSocio(true);
  }, []);

  // Callback to reset the trigger after the dialog is opened
  const handleNewSocioTriggered = useCallback(() => {
    console.log('🔥 New socio dialog triggered - resetting trigger');
    setTriggerNewSocio(false);
  }, []);

  // Redirect if not authenticated or not association
  if (!authLoading && (!user || user.role !== 'asociacion')) {
    router.push('/auth/login');
    return null;
  }

  // Loading state
  if (authLoading) {
    return <OptimizedLoadingState />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          {/* Optimized Header */}
          <DashboardHeader
            user={user ?? {}}
            stats={consolidatedStats}
            onAddMember={handleAddMember}
            onLogout={handleLogoutClick}
          />

          {/* Ultra Optimized Tab System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <OptimizedTabSystem
              onNavigate={handleNavigate}
              onAddMember={handleAddMember}
              initialTab={currentSection}
              stats={consolidatedStats}
              triggerNewSocio={triggerNewSocio}
              onNewSocioTriggered={handleNewSocioTriggered}
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