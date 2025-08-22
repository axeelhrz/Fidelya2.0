'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { ProfileForm } from '@/components/comercio/perfil/ProfileForm';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useComercios } from '@/hooks/useComercios';
import { 
  Store, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

// Sidebar personalizado que maneja el logout
const ComercioSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <ComercioSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

// Loading component
const LoadingState = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <div className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl animate-pulse"></div>
          <div className="absolute inset-2 bg-white rounded-xl flex items-center justify-center">
            <RefreshCw size={24} className="text-blue-500 animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Cargando perfil...
        </h3>
        <p className="text-gray-600">Obteniendo información del comercio</p>
      </motion.div>
    </div>
  </div>
);

// Main component content
const ComercioPerfilContent: React.FC = () => {
  const { signOut } = useAuth();
  const { loading } = useComercios();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (loading) {
    return (
      <DashboardLayout
        activeSection="perfil"
        sidebarComponent={(props) => (
          <ComercioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <LoadingState />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="perfil"
      sidebarComponent={(props) => (
        <ComercioSidebarWithLogout
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            {/* Title and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center justify-center lg:justify-start gap-3 mb-4"
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Mi Perfil
                    </h1>
                    <p className="text-lg text-gray-600 font-medium mt-1">
                      Gestiona la información de tu comercio
                    </p>
                  </div>
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center lg:justify-end"
              >
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<RefreshCw size={18} />}
                  onClick={() => window.location.reload()}
                  className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:border-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Actualizar
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Profile Form Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="relative"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
              <ProfileForm />
            </div>
          </motion.div>

          {/* Floating Elements */}
          <div className="fixed top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse hidden lg:block"></div>
          <div className="fixed bottom-20 right-10 w-32 h-32 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse hidden lg:block"></div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Main page component with Suspense boundary
export default function ComercioPerfilPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ComercioPerfilContent />
    </Suspense>
  );
}