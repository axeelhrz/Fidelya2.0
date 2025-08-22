'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { ValidacionesHistory } from '@/components/comercio/ValidacionesHistory';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useValidaciones } from '@/hooks/useValidaciones';
import { ValidacionStats } from '@/types/comercio';
import { 
  UserCheck, 
  FileText, 
  Download, 
  RefreshCw,
  CheckCircle,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  Filter,
  Search,
  BarChart3,
  Eye,
  AlertCircle,
  Star,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  Award,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ComercioValidacionesContent() {
  const { user, signOut } = useAuth();
  const { loading, refresh, getStats } = useValidaciones();
  const [stats, setStats] = useState<ValidacionStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'recientes';

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      toast.success('✅ Datos actualizados correctamente', {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('❌ Error al actualizar los datos');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Show loading toast
      const loadingToast = toast.loading('📊 Preparando exportación...');
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Remove loading toast
      toast.dismiss(loadingToast);
      
      // Success toast
      toast.success('📥 Reporte exportado exitosamente', {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          color: 'white',
          fontWeight: '600',
          borderRadius: '12px',
          padding: '16px 20px',
        },
      });
    } catch (error) {
      console.error('Error exporting validaciones:', error);
      toast.error('❌ Error al exportar el reporte');
    } finally {
      setExporting(false);
    }
  };

  const tabs = [
    {
      id: 'recientes',
      label: 'Recientes',
      icon: Clock,
      description: 'Validaciones de hoy y ayer',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100'
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: FileText,
      description: 'Todas las validaciones',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Análisis detallado',
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-50 to-green-100'
    }
  ];

  // Load stats on component mount
  useEffect(() => {
    async function fetchStats() {
      if (user) {
        try {
          const statsResult = getStats();
          setStats(statsResult);
        } catch (error) {
          console.error('Error fetching stats:', error);
        }
      }
    }
    fetchStats();
  }, [user, getStats]);

  if (loading && !stats) {
    return (
      <DashboardLayout
        activeSection="validaciones"
        sidebarComponent={(props) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <RefreshCw size={40} className="text-white animate-spin" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 mb-4">
              Cargando Validaciones
            </h3>
            <p className="text-slate-600 text-lg">Obteniendo historial de validaciones...</p>
            <div className="mt-8 flex justify-center">
              <div className="flex space-x-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-purple-500 rounded-full"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="validaciones"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Header */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-violet-600/90"></div>
          
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 bg-white/5 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  x: [0, 30, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          <div className="relative px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                      <UserCheck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <span className="text-white/80 font-medium text-lg">Dashboard</span>
                      <p className="text-white/60 text-sm">Gestión de Validaciones</p>
                    </div>
                  </div>
                  
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                    Validaciones
                    <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                      Inteligentes
                    </span>
                  </h1>
                  
                  <p className="text-xl text-white/90 mb-8 leading-relaxed">
                    Monitorea, analiza y gestiona todas las validaciones de beneficios 
                    con herramientas avanzadas y reportes en tiempo real.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                      leftIcon={refreshing ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                      onClick={handleRefresh}
                      disabled={refreshing}
                    >
                      {refreshing ? 'Actualizando...' : 'Actualizar Datos'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="lg"
                      className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                      leftIcon={exporting ? <RefreshCw size={20} className="animate-spin" /> : <Download size={20} />}
                      onClick={handleExport}
                      disabled={exporting}
                    >
                      {exporting ? 'Exportando...' : 'Exportar Reporte'}
                    </Button>
                  </div>
                </motion.div>

                <motion.div
                  className="relative"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  {/* Stats Preview Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-400 rounded-2xl flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-white">{stats?.totalValidaciones || 0}</p>
                          <p className="text-white/70 text-sm font-medium">Total Validaciones</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-400 rounded-2xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-white">{stats?.clientesUnicos || 0}</p>
                          <p className="text-white/70 text-sm font-medium">Clientes Únicos</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-emerald-400 rounded-2xl flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-white">
                            {stats?.validacionesExitosas || 0}
                          </p>
                          <p className="text-white/70 text-sm font-medium">Exitosas</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-violet-400 rounded-2xl flex items-center justify-center">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-white">
                            ${stats?.montoTotalDescuentos?.toLocaleString() || 0}
                          </p>
                          <p className="text-white/70 text-sm font-medium">Descuentos</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 py-4 overflow-x-auto scrollbar-hide">
              {tabs.map((tab, index) => (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', tab.id);
                    window.history.pushState({}, '', url.toString());
                  }}
                  className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg shadow-purple-500/25 scale-105`
                      : 'bg-white/60 text-gray-600 hover:bg-white hover:text-gray-900 border border-gray-200/50'
                  }`}
                  whileHover={{ scale: activeTab === tab.id ? 1.05 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <tab.icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="hidden sm:block">{tab.label}</div>
                    <div className="sm:hidden">{tab.label.slice(0, 3)}</div>
                    {activeTab === tab.id && (
                      <div className="text-xs opacity-80 hidden lg:block">{tab.description}</div>
                    )}
                  </div>
                  {activeTab === tab.id && (
                    <motion.div
                      className="w-2 h-2 bg-white rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Recent Tab */}
              {activeTab === 'recientes' && (
                <div className="space-y-8">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      {
                        title: 'Hoy',
                        value: stats?.validacionesExitosas || 0,
                        icon: Activity,
                        color: 'from-blue-500 to-blue-600',
                        bgColor: 'from-blue-50 to-blue-100',
                        change: '+12',
                        changeType: 'up'
                      },
                      {
                        title: 'Exitosas',
                        value: stats?.validacionesExitosas || 0,
                        icon: CheckCircle,
                        color: 'from-green-500 to-green-600',
                        bgColor: 'from-green-50 to-green-100',
                        change: '+8',
                        changeType: 'up'
                      },
                      {
                        title: 'Fallidas',
                        value: stats?.validacionesFallidas || 0,
                        icon: AlertCircle,
                        color: 'from-red-500 to-red-600',
                        bgColor: 'from-red-50 to-red-100',
                        change: '-3',
                        changeType: 'down'
                      },
                      {
                        title: 'Promedio',
                        value: stats?.promedioValidacionesDiarias || 0,
                        icon: Target,
                        color: 'from-purple-500 to-purple-600',
                        bgColor: 'from-purple-50 to-purple-100',
                        change: '+5',
                        changeType: 'up'
                      }
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.title}
                        className={`bg-gradient-to-br ${stat.bgColor} rounded-3xl p-6 border border-white/50 shadow-xl`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.05, y: -5 }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className={`flex items-center space-x-1 text-sm font-semibold px-2 py-1 rounded-full ${
                            stat.changeType === 'up' 
                              ? 'text-green-600 bg-green-100' 
                              : 'text-red-600 bg-red-100'
                          }`}>
                            {stat.changeType === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                            <span>{stat.change}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Validaciones History Component */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <ValidacionesHistory />
                  </motion.div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'historial' && (
                <div className="space-y-8">
                  {/* Filters Section */}
                  <motion.div
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                          <Filter className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Filtros Avanzados</h3>
                          <p className="text-sm text-gray-600">Personaliza tu búsqueda</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Search size={16} />}
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Buscar
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Fecha Desde</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Fecha Hasta</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Estado</label>
                        <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                          <option>Todos los estados</option>
                          <option>Exitosas</option>
                          <option>Fallidas</option>
                          <option>Pendientes</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Beneficio</label>
                        <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all">
                          <option>Todos los beneficios</option>
                          <option>Descuento 20%</option>
                          <option>2x1 Especial</option>
                          <option>Envío Gratis</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>

                  {/* Full History */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <ValidacionesHistory />
                  </motion.div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-8">
                  {/* Performance Overview */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Chart */}
                    <motion.div
                      className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Tendencia de Validaciones</h3>
                          <p className="text-gray-600">Últimos 30 días</p>
                        </div>
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                          <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Simple Chart Representation */}
                      <div className="space-y-4">
                        {[
                          { day: 'Lun', value: 45, percentage: 90 },
                          { day: 'Mar', value: 38, percentage: 76 },
                          { day: 'Mié', value: 52, percentage: 100 },
                          { day: 'Jue', value: 41, percentage: 82 },
                          { day: 'Vie', value: 48, percentage: 96 },
                          { day: 'Sáb', value: 35, percentage: 70 },
                          { day: 'Dom', value: 28, percentage: 56 }
                        ].map((data, index) => (
                          <motion.div
                            key={data.day}
                            className="flex items-center space-x-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <span className="text-sm font-medium text-gray-600 w-12">{data.day}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${data.percentage}%` }}
                                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                              />
                            </div>
                            <span className="text-sm font-bold text-gray-900 w-12">{data.value}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>

                    {/* Side Stats */}
                    <motion.div
                      className="space-y-6"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {/* Top Performer */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl p-6 border border-green-200/50">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-green-900">Mejor Día</h4>
                            <p className="text-sm text-green-700">Esta semana</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-900">Miércoles</p>
                          <p className="text-sm text-green-700">52 validaciones</p>
                        </div>
                      </div>

                      {/* Peak Hours */}
                      <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-3xl p-6 border border-purple-200/50">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-purple-900">Hora Pico</h4>
                            <p className="text-sm text-purple-700">Más actividad</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-purple-900">14:00</p>
                          <p className="text-sm text-purple-700">Promedio: 8 validaciones/hora</p>
                        </div>
                      </div>

                      {/* Success Rate */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-6 border border-blue-200/50">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                            <Star className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-blue-900">Tasa de Éxito</h4>
                            <p className="text-sm text-blue-700">Promedio mensual</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-blue-900">
                            {stats && stats.totalValidaciones && stats.totalValidaciones > 0 
                              ? `${Math.round((stats.validacionesExitosas / stats.totalValidaciones) * 100)}`
                              : '0'
                            }
                          </p>
                          <p className="text-sm text-blue-700">+2.3 vs mes anterior</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Detailed Analytics */}
                  <motion.div
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div className="flex items-center space-x-4 mb-8">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Análisis Detallado</h3>
                        <p className="text-gray-600">Insights y métricas avanzadas</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        {
                          title: 'Beneficio Más Popular',
                          value: 'Descuento 20%',
                          subtitle: '45 de todas las validaciones',
                          icon: '🏆',
                          color: 'from-yellow-400 to-orange-500'
                        },
                        {
                          title: 'Horario Preferido',
                          value: '12:00 - 15:00',
                          subtitle: '38 de la actividad diaria',
                          icon: '⏰',
                          color: 'from-blue-400 to-indigo-500'
                        },
                        {
                          title: 'Día Más Activo',
                          value: 'Viernes',
                          subtitle: 'Promedio: 48 validaciones',
                          icon: '📅',
                          color: 'from-green-400 to-emerald-500'
                        },
                        {
                          title: 'Cliente Recurrente',
                          value: '67',
                          subtitle: 'Socios que regresan',
                          icon: '🔄',
                          color: 'from-purple-400 to-violet-500'
                        },
                        {
                          title: 'Tiempo Promedio',
                          value: '2.3 min',
                          subtitle: 'Por validación',
                          icon: '⚡',
                          color: 'from-pink-400 to-rose-500'
                        },
                        {
                          title: 'Satisfacción',
                          value: '4.8/5',
                          subtitle: 'Rating promedio',
                          icon: '⭐',
                          color: 'from-amber-400 to-yellow-500'
                        }
                      ].map((metric, index) => (
                        <motion.div
                          key={metric.title}
                          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200/50"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`w-10 h-10 bg-gradient-to-br ${metric.color} rounded-xl flex items-center justify-center text-lg`}>
                              {metric.icon}
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm">{metric.title}</h4>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
                            <p className="text-xs text-gray-600">{metric.subtitle}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Loading fallback component
function ComercioValidacionesLoading() {
  return (
    <DashboardLayout
      activeSection="validaciones"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <RefreshCw size={40} className="text-white animate-spin" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-4">
            Cargando Validaciones
          </h3>
          <p className="text-slate-600 text-lg">Obteniendo historial de validaciones...</p>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function ComercioValidacionesPage() {
  return (
    <Suspense fallback={<ComercioValidacionesLoading />}>
      <ComercioValidacionesContent />
    </Suspense>
  );
}