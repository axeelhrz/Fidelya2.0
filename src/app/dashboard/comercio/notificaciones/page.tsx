'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { ComercioNotifications } from '@/components/comercio/ComercioNotifications';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { 
  Bell, 
  RefreshCw, 
  Settings, 
  CheckCircle,
  AlertCircle,
  Gift,
  UserCheck,
  Send,
  Megaphone,
  TrendingUp,
  Users,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ComercioNotificacionesPage() {
  const { signOut } = useAuth();
  const { 
    stats, 
    loading, 
    markAllAsRead,
    setFilters,
    refreshStats,
    hasUnread,
    hasImportant
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [type, setType] = useState<'all' | 'validation' | 'benefit' | 'system'>('all');

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Error al marcar notificaciones como leídas');
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshStats();
      toast.success('Notificaciones actualizadas');
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      toast.error('Error al actualizar notificaciones');
    }
  };

  const notificationTypes = [
    { value: 'all', label: 'Todas', icon: Bell, color: 'gray' },
    { value: 'validation', label: 'Validaciones', icon: UserCheck, color: 'blue' },
    { value: 'benefit', label: 'Beneficios', icon: Gift, color: 'purple' },
    { value: 'system', label: 'Sistema', icon: Settings, color: 'green' }
  ];

  const filterOptions = [
    { value: 'all', label: 'Todas', count: stats?.total || 0 },
    { value: 'unread', label: 'No leídas', count: stats?.unread || 0 },
    { value: 'read', label: 'Leídas', count: stats?.read || 0 }
  ];

  // Update filters when filter or type changes
  useEffect(() => {
    type NotificationStatus = 'unread' | 'read';
    type NotificationCategory = 'membership' | 'general' | 'system';

    const newFilters: { status?: NotificationStatus[]; category?: NotificationCategory[] } = {};
    
    if (filter !== 'all') {
      newFilters.status = [filter as NotificationStatus];
    }
    
    if (type !== 'all') {
      // Map the type to the notification category
      const categoryMap: Record<string, NotificationCategory> = {
        'validation': 'membership',
        'benefit': 'general',
        'system': 'system'
      };
      newFilters.category = [categoryMap[type as keyof typeof categoryMap]];
    }
    
    setFilters(newFilters);
  }, [filter, type, setFilters]);

  if (loading) {
    return (
      <DashboardLayout
        activeSection="notificaciones"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <RefreshCw size={32} className="text-white animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cargando notificaciones...
            </h3>
            <p className="text-gray-500">Obteniendo centro de notificaciones</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="notificaciones"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Megaphone size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Centro de Notificaciones
                </h1>
                <p className="text-lg text-gray-600 font-medium">
                  Comunícate efectivamente con tus clientes y mantente informado
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw size={16} />}
                onClick={handleRefresh}
              >
                Actualizar
              </Button>
              {hasUnread && (
                <Button
                  size="sm"
                  leftIcon={<CheckCircle size={16} />}
                  onClick={handleMarkAllAsRead}
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg relative overflow-hidden"
              whileHover={{ y: -2 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <Bell size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats?.total || 0}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">Total Notificaciones</div>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg relative overflow-hidden"
              whileHover={{ y: -2 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/30">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats?.unread || 0}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">No Leídas</div>
                </div>
              </div>
              {hasUnread && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg relative overflow-hidden"
              whileHover={{ y: -2 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats?.important || 0}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">Importantes</div>
                </div>
              </div>
              {hasImportant && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
              )}
            </motion.div>

            <motion.div
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg relative overflow-hidden"
              whileHover={{ y: -2 }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/30">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-900">
                    {stats?.read || 0}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">Leídas</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Acciones Rápidas
                </h3>
                <p className="text-gray-600 text-sm">
                  Gestiona tus notificaciones y comunicaciones con clientes
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  leftIcon={<MessageSquare size={16} />}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={() => {
                    // Navigate to send notification tab
                    const event = new CustomEvent('navigateToNotificationTab', { detail: 'enviar' });
                    window.dispatchEvent(event);
                  }}
                >
                  Enviar Notificación
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Users size={16} />}
                  onClick={() => {
                    // Navigate to clients tab
                    if (window.navigateToSocioTab) {
                      window.navigateToSocioTab('clientes');
                    }
                  }}
                >
                  Ver Clientes
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Filtros</h3>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value as 'all' | 'unread' | 'read')}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        filter === option.value
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className="bg-white px-2 py-0.5 rounded-full text-xs">
                        {option.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tipo</h4>
                <div className="flex flex-wrap gap-2">
                  {notificationTypes.map((notifType) => (
                    <button
                      key={notifType.value}
                      onClick={() => setType(notifType.value as 'all' | 'validation' | 'benefit' | 'system')}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                        type === notifType.value
                          ? `bg-${notifType.color}-100 text-${notifType.color}-700 border border-${notifType.color}-200`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <notifType.icon className="w-3 h-3" />
                      <span>{notifType.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <ComercioNotifications />
      </motion.div>
    </DashboardLayout>
  );
}