'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { AsociacionSidebar } from '@/components/layout/AsociacionSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { ComercioManagement } from '@/components/asociacion/ComercioManagement';
import { useAuth } from '@/hooks/useAuth';
import { Store, Sparkles, TrendingUp} from 'lucide-react';

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

// Modern loading component
const PageLoading = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 flex items-center justify-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="relative mb-8">
        <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin mx-auto" 
             style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Cargando Comercios
        </h2>
        <p className="text-slate-600 text-base md:text-lg">
          Preparando tu panel de gestión...
        </p>
        <div className="flex justify-center space-x-1 mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </motion.div>
  </div>
);

// Main component that uses useSearchParams
function AsociacionComerciosContent() {
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

  // Navigation handlers
  const handleNavigate = (section: string) => {
    const sectionRoutes: Record<string, string> = {
      'dashboard': '/dashboard/asociacion',
      'socios': '/dashboard/asociacion/socios',
      'comercios': '/dashboard/asociacion/comercios',
      'analytics': '/dashboard/asociacion/analytics',
      'notificaciones': '/dashboard/asociacion/notificaciones',
      'reportes': '/dashboard/asociacion/reportes',
      'configuracion': '/dashboard/asociacion/configuracion',
      'beneficios': '/dashboard/asociacion/beneficios',
      'pagos': '/dashboard/asociacion/pagos'
    };

    const route = sectionRoutes[section];
    if (route && route !== '/dashboard/asociacion/comercios') {
      router.push(route);
    }
  };

  // Loading state
  if (authLoading) {
    return <PageLoading />;
  }

  return (
    <>
      <DashboardLayout 
        activeSection="comercios" 
        onSectionChange={() => {}}
        sidebarComponent={(props) => (
          <AsociacionSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
            {/* Modern Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="relative"
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-blue-600/5 rounded-2xl lg:rounded-3xl blur-3xl" />
              
              <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl border border-white/20 shadow-xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-6">
                    {/* Enhanced icon */}
                    <div className="relative group">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-0 transition-all duration-500">
                        <Store className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl sm:rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-purple-700 bg-clip-text text-transparent leading-tight">
                        Gestión de Comercios
                      </h1>
                      <p className="text-sm sm:text-base lg:text-lg text-slate-600 mt-1 sm:mt-2 font-medium">
                        Administra tu red de comercios afiliados y sus beneficios
                      </p>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg sm:rounded-xl">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      <span className="text-xs sm:text-sm font-semibold text-blue-700">Activo</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-purple-50 px-3 py-2 rounded-lg sm:rounded-xl">
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      <span className="text-xs sm:text-sm font-semibold text-purple-700">Optimizado</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <ComercioManagement onNavigate={handleNavigate} />
            </motion.div>
          </div>
        </div>
      </DashboardLayout>

      {/* Enhanced Logout Modal */}
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
        className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50"
      >
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group relative bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-2 hover:scale-110 transition-all duration-500 overflow-hidden"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6 relative z-10 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
          </svg>
          
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-xl sm:rounded-2xl" />
        </button>
      </motion.div>
    </>
  );
}

// Main exported component with Suspense boundary
export default function AsociacionComerciosPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <AsociacionComerciosContent />
    </Suspense>
  );
}