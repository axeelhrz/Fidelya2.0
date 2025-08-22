'use client';

import React, { useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { ClienteProfileView } from '@/components/comercio/clientes/ClienteProfileView';
import { useAuth } from '@/hooks/useAuth';
import { useClientes } from '@/hooks/useClientes';
import { 
  Users, 
  UserPlus, 
  TrendingUp, 
  DollarSign,
  RefreshCw,
} from 'lucide-react';

// Component content that might indirectly use useSearchParams
function ClientesPageContent() {
  const { user, signOut } = useAuth();
  const { stats, loading: statsLoading, refreshStats } = useClientes();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    if (user) {
      refreshStats();
    }
  }, [user, refreshStats]);

  if (statsLoading && !stats) {
    return (
      <DashboardLayout
        activeSection="clientes"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
              <RefreshCw size={32} className="text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Cargando clientes...
            </h3>
            <p className="text-slate-600">Obteniendo información de clientes</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="clientes"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                      Gestión de Clientes
                    </h1>
                    <p className="text-lg text-slate-600 mt-1">
                      Administra y gestiona los perfiles de tus clientes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.totalClientes}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Total Clientes</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.clientesActivos}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Clientes Activos</div>
                    <div className="text-xs text-emerald-600 font-medium">
                      {stats.totalClientes > 0 
                        ? `${Math.round((stats.clientesActivos / stats.totalClientes) * 100)}% del total`
                        : '0% del total'
                      }
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {stats.clientesNuevos}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Nuevos este mes</div>
                    <div className="text-xs text-purple-600 font-medium">
                      {stats.crecimientoMensual > 0 ? '+' : ''}{stats.crecimientoMensual.toFixed(1)}% crecimiento
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
                whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-violet-500/30">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      ${stats.valorVidaPromedio.toLocaleString()}
                    </div>
                    <div className="text-sm font-medium text-slate-600">Valor Vida Promedio</div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ClienteProfileView />
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Loading fallback component
function ClientesPageLoading() {
  return (
    <DashboardLayout
      activeSection="clientes"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
            <RefreshCw size={32} className="text-white animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Cargando clientes...
          </h3>
          <p className="text-slate-600">Obteniendo información de clientes</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ClientesPage() {
  return (
    <Suspense fallback={<ClientesPageLoading />}>
      <ClientesPageContent />
    </Suspense>
  );
}