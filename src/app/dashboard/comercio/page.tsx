'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { OptimizedComercioTabSystem } from '@/components/layout/OptimizedComercioTabSystem';
import { ComercioWelcomeCard } from '@/components/comercio/ComercioWelcomeCard';
import { useAuth } from '@/hooks/useAuth';
import { useComercio } from '@/hooks/useComercio';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell } from 'lucide-react';

declare global {
  interface Window {
    navigateToComercioTab?: (tabId: string) => void;
  }
}

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
        Cargando tu panel de comercio...
      </motion.p>
    </motion.div>
  </div>
));

OptimizedLoadingState.displayName = 'OptimizedLoadingState';

// Notification Badge Component
const NotificationBadge = memo(() => {
  const { hasUnread, stats } = useNotifications();
  
  if (!hasUnread || !stats.unread) return null;
  
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
        <Bell className="w-4 h-4" />
        <span className="text-sm font-medium">
          {stats.unread} notificación{stats.unread !== 1 ? 'es' : ''} nueva{stats.unread !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => {
            if (window.navigateToComercioTab) {
              window.navigateToComercioTab('notificaciones');
            }
          }}
          className="bg-white/20 hover:bg-white/30 px-2 py-1 rounded-full text-xs transition-colors"
        >
          Ver
        </button>
      </div>
    </motion.div>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

// Main component
export default function OptimizedComercioDashboard() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { comercio, stats, loading: comercioLoading } = useComercio();
  const { stats: notificationStats } = useNotifications();
  
  // State management - optimized to prevent unnecessary re-renders
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentSection, setCurrentSection] = useState('dashboard');

  // Memoized consolidated stats including notifications
  const consolidatedStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate stats from the useComercio hook
    const validacionesHoy = stats?.validacionesHoy || 0;
    const validacionesMes = stats?.validacionesMes || 0;
    const beneficiosActivos = stats?.beneficiosActivos || 0;
    const clientesUnicos = stats?.clientesUnicos || 0;
    const qrEscaneos = 0; // This will always be 0 unless you add it to ComercioStats
    const notificacionesNoLeidas = notificationStats?.unread || 0;
    
    return {
      validacionesHoy,
      validacionesMes,
      beneficiosActivos,
      clientesUnicos,
      qrEscaneos,
      notificacionesNoLeidas
    };
  }, [stats, notificationStats]);

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

  // Quick action handler
  const handleQuickAction = useCallback((action: string) => {
    setCurrentSection(action);
  }, []);

  // View profile handler
  const handleViewProfile = useCallback(() => {
    setCurrentSection('perfil');
  }, []);

  // Redirect if not authenticated or not comercio
  if (!authLoading && (!user || user.role !== 'comercio')) {
    router.push('/auth/login');
    return null;
  }

  // Loading state
  if (authLoading || comercioLoading) {
    return <OptimizedLoadingState />;
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="p-3 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6 lg:space-y-8 max-w-7xl mx-auto">
          {/* Optimized Welcome Card */}
          <ComercioWelcomeCard
            user={user ?? {}}
            comercio={comercio ?? undefined}
            stats={consolidatedStats}
            onQuickAction={handleQuickAction}
            onViewProfile={handleViewProfile}
            onLogout={handleLogoutClick}
          />

          {/* Ultra Optimized Tab System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <OptimizedComercioTabSystem
              onNavigate={handleNavigate}
              initialTab={currentSection}
              stats={consolidatedStats}
            />
          </motion.div>
        </div>
      </div>

      {/* Notification Badge */}
      <NotificationBadge />

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