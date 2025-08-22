'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AsociacionSidebar } from '@/components/layout/AsociacionSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { AdvancedAnalytics } from '@/components/asociacion/AdvancedAnalytics';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';

// Enhanced Sidebar with logout functionality
const AsociacionSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <AsociacionSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

export default function AsociacionAnalyticsPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  
  // State management
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger visibility for staggered animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if not authenticated or not association
  if (!authLoading && (!user || user.role !== 'asociacion')) {
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

  const handleLogoutCancel = () => {
    setLogoutModalOpen(false);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-indigo-500 animate-pulse" />
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Cargando Analytics Avanzado
          </h2>
          <p className="text-gray-600 text-lg">
            Preparando métricas y análisis profundo...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <DashboardLayout 
        activeSection="analytics" 
        onSectionChange={() => {}}
        sidebarComponent={(props) => (
          <AsociacionSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Enhanced Header */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -30 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="text-center mb-8"
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                {/* Enhanced logo icon */}
                <div className="relative group">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                    <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-white transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-3xl blur-lg animate-pulse"></div>
                  <TrendingUp className="absolute -top-2 -right-2 w-6 h-6 text-emerald-400 animate-bounce" />
                  <Sparkles className="absolute -bottom-1 -left-1 w-5 h-5 text-yellow-400 animate-pulse" />
                </div>
                
                <div className="text-center sm:text-left">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-playfair tracking-tight leading-none py-2">
                    Analytics Avanzado
                  </h1>
                  <p className="text-lg sm:text-xl text-slate-600 font-jakarta mt-2">
                    Métricas detalladas y análisis profundo de tu asociación
                  </p>
                </div>
              </div>

              {/* Real-time indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-indigo-200/50 rounded-2xl px-6 py-3 shadow-lg"
              >
                <div className="relative">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                </div>
                <span className="text-slate-700 font-semibold text-sm">
                  Datos en tiempo real
                </span>
                <div className="w-px h-4 bg-slate-300"></div>
                <span className="text-slate-500 text-sm">
                  Actualizado automáticamente
                </span>
              </motion.div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="relative"
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/20 to-purple-100/20 rounded-3xl blur-3xl -z-10"></div>
              
              <AdvancedAnalytics />
            </motion.div>
          </div>
        </div>
      </DashboardLayout>

      {/* Enhanced Modal de Logout */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      {/* Enhanced scroll to top button */}
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/40 transform hover:-translate-y-2 hover:scale-110 transition-all duration-500 group relative overflow-hidden"
        >
          <svg className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-full" />
        </button>
      </motion.div>
    </>
  );
}