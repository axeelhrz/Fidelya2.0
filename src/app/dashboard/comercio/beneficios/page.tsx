'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  RefreshCw, 
  Download, 
  Gift,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  Search,
  BarChart3,
  Star,
  Eye,
  Target,
  Users,
  Zap,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { BeneficiosList } from '@/components/beneficios/BeneficiosList';
import { BeneficioForm } from '@/components/beneficios/BeneficioForm';
import { BeneficiosStats } from '@/components/beneficios/BeneficiosStats';
import { Button } from '@/components/ui/Button';
import { useBeneficiosComercios } from '@/hooks/useBeneficios';
import { useAuth } from '@/hooks/useAuth';
import { Beneficio } from '@/types/beneficio';
import toast from 'react-hot-toast';

// Componente para métricas principales mejoradas
const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}> = ({ title, value, subtitle, icon, gradient, trend, onClick }) => (
  <motion.div
    className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 ${
      onClick ? 'cursor-pointer' : ''
    }`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, scale: 1.02 }}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-14 h-14 ${gradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
          trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <TrendingUp size={12} className={trend.isPositive ? '' : 'rotate-180'} />
          {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
        </div>
      )}
    </div>
    
    <div className="space-y-2">
      <div className="text-3xl font-black text-gray-900">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <div className="text-sm font-semibold text-gray-600">
        {title}
      </div>
      <div className="text-xs text-gray-500">
        {subtitle}
      </div>
    </div>
  </motion.div>
);

// Componente para acciones rápidas
const QuickActions: React.FC<{
  onCreateBenefit: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onViewAnalytics: () => void;
  loading: boolean;
}> = ({ onCreateBenefit, onRefresh, onExport, onViewAnalytics, loading }) => {
  const actions = [
    {
      id: 'create',
      title: 'Crear Beneficio',
      description: 'Nuevo beneficio atractivo',
      icon: Plus,
      gradient: 'bg-gradient-to-r from-blue-500 to-purple-600',
      action: onCreateBenefit,
      primary: true
    },
    {
      id: 'analytics',
      title: 'Ver Análisis',
      description: 'Estadísticas detalladas',
      icon: BarChart3,
      gradient: 'bg-gradient-to-r from-green-500 to-emerald-600',
      action: onViewAnalytics
    },
    {
      id: 'refresh',
      title: 'Actualizar',
      description: 'Recargar datos',
      icon: RefreshCw,
      gradient: 'bg-gradient-to-r from-cyan-500 to-blue-600',
      action: onRefresh
    },
    {
      id: 'export',
      title: 'Exportar',
      description: 'Descargar reporte',
      icon: Download,
      gradient: 'bg-gradient-to-r from-orange-500 to-red-600',
      action: onExport
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const IconComponent = action.icon;
        return (
          <motion.button
            key={action.id}
            onClick={action.action}
            disabled={loading}
            className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 text-left group disabled:opacity-50 disabled:cursor-not-allowed ${
              action.primary ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${action.gradient} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                <IconComponent 
                  size={24} 
                  className={action.id === 'refresh' && loading ? 'animate-spin' : ''} 
                />
              </div>
              {action.primary && (
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {action.title}
              </div>
              <div className="text-sm text-gray-500">
                {action.description}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

// Componente para filtros mejorado
const FilterSection: React.FC<{
  beneficios: Beneficio[];
  activeFilter: string;
  searchTerm: string;
  onFilterChange: (filter: string) => void;
  onSearchChange: (search: string) => void;
}> = ({ beneficios, activeFilter, searchTerm, onFilterChange, onSearchChange }) => {
  const now = new Date();
  
  const filters = [
    {
      id: 'todos',
      title: 'Todos',
      count: beneficios.length,
      icon: Gift,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    },
    {
      id: 'activos',
      title: 'Activos',
      count: beneficios.filter(b => b.estado === 'activo' && b.fechaFin.toDate() > now).length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 'vencidos',
      title: 'Vencidos',
      count: beneficios.filter(b => b.estado === 'vencido' || (b.estado === 'activo' && b.fechaFin.toDate() <= now)).length,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      id: 'destacados',
      title: 'Destacados',
      count: beneficios.filter(b => b.destacado).length,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      id: 'populares',
      title: 'Populares',
      count: beneficios.filter(b => (b.usosActuales || 0) > 5).length,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Filtros y Búsqueda</h3>
            <p className="text-sm text-gray-500">Organiza y encuentra tus beneficios</p>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar beneficios..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {filters.map((filter) => {
          const IconComponent = filter.icon;
          const isActive = activeFilter === filter.id;
          
          return (
            <motion.button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 ${isActive ? 'bg-indigo-500' : filter.bgColor} rounded-lg flex items-center justify-center`}>
                  <IconComponent size={18} className={isActive ? 'text-white' : filter.color} />
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${isActive ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {filter.count}
                  </div>
                  <div className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>
                    {filter.title}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Componente principal con Suspense
function ComercioBeneficiosContent() {
  const { user } = useAuth();
  const {
    beneficios,
    beneficiosUsados,
    stats,
    loading,
    error,
    eliminarBeneficio,
    refrescar,
    estadisticasRapidas
  } = useBeneficiosComercios();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBeneficio, setEditingBeneficio] = useState<Beneficio | null>(null);
  const [activeFilter, setActiveFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Filtrar beneficios según el filtro activo y búsqueda
  const filteredBeneficios = useMemo(() => {
    const now = new Date();
    let filtered = beneficios;

    // Aplicar filtro por categoría
    switch (activeFilter) {
      case 'activos':
        filtered = beneficios.filter(b => 
          b.estado === 'activo' && 
          b.fechaFin.toDate() > now
        );
        break;
      case 'vencidos':
        filtered = beneficios.filter(b => 
          b.estado === 'vencido' || 
          (b.estado === 'activo' && b.fechaFin.toDate() <= now)
        );
        break;
      case 'destacados':
        filtered = beneficios.filter(b => b.destacado);
        break;
      case 'populares':
        filtered = beneficios.filter(b => (b.usosActuales || 0) > 5);
        break;
      default:
        filtered = beneficios;
    }

    // Aplicar búsqueda por texto
    if (searchTerm) {
      filtered = filtered.filter(beneficio =>
        beneficio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficio.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [beneficios, activeFilter, searchTerm]);

  const handleCreateNew = () => {
    setEditingBeneficio(null);
    setFormOpen(true);
  };

  const handleEdit = (beneficio: Beneficio) => {
    setEditingBeneficio(beneficio);
    setFormOpen(true);
  };

  const handleDelete = async (beneficioId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este beneficio?')) {
      try {
        await eliminarBeneficio(beneficioId);
        toast.success('Beneficio eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando beneficio:', error);
        toast.error('Error al eliminar el beneficio');
      }
    }
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingBeneficio(null);
  };

  const handleExport = () => {
    const csvContent = [
      ['Título', 'Categoría', 'Tipo', 'Descuento', 'Estado', 'Usos', 'Fecha Creación', 'Fecha Vencimiento'],
      ...beneficios.map(beneficio => [
        beneficio.titulo,
        beneficio.categoria,
        beneficio.tipo,
        beneficio.descuento.toString(),
        beneficio.estado,
        beneficio.usosActuales.toString(),
        beneficio.creadoEn.toDate().toLocaleDateString(),
        beneficio.fechaFin.toDate().toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `beneficios-comercio-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Datos exportados exitosamente');
  };

  const handleMetricClick = (metric: string) => {
    switch (metric) {
      case 'activos':
        setActiveFilter('activos');
        break;
      case 'usados':
        setShowAnalytics(true);
        break;
      case 'ahorro':
        setShowAnalytics(true);
        break;
      default:
        setActiveFilter('todos');
    }
  };

  if (error) {
    return (
      <DashboardLayout
        activeSection="beneficios"
        sidebarComponent={(props: React.ComponentProps<typeof ComercioSidebar>) => (
          <ComercioSidebar
            {...props}
            onLogoutClick={() => {
              window.location.href = '/logout';
            }}
          />
        )}
      >
        <div className="flex items-center justify-center min-h-screen">
          <motion.div 
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-3xl flex items-center justify-center">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Error al cargar beneficios
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={refrescar} leftIcon={<RefreshCw size={16} />}>
              Reintentar
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="beneficios"
      sidebarComponent={(props: React.ComponentProps<typeof ComercioSidebar>) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {
            window.location.href = '/logout';
          }}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header principal mejorado */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-lg">
            <Gift className="w-10 h-10 text-white" />
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Zap className="w-3 h-3 text-white" />
            </motion.div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Gestión de Beneficios
          </h1>
          
          <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto mb-6">
            Crea y administra beneficios atractivos para fidelizar a tus clientes
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
              <span>{beneficios.length} beneficios totales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{estadisticasRapidas.activos} activos</span>
            </div>
          </div>
        </motion.div>

        {/* Métricas principales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Beneficios"
              value={estadisticasRapidas.total}
              subtitle="Beneficios creados"
              icon={<Gift size={28} />}
              gradient="bg-gradient-to-r from-blue-500 to-purple-600"
              onClick={() => handleMetricClick('total')}
            />
            <MetricCard
              title="Beneficios Activos"
              value={estadisticasRapidas.activos}
              subtitle="Disponibles ahora"
              icon={<CheckCircle size={28} />}
              gradient="bg-gradient-to-r from-green-500 to-emerald-600"
              trend={{ value: 12.5, isPositive: true }}
              onClick={() => handleMetricClick('activos')}
            />
            <MetricCard
              title="Total Usos"
              value={estadisticasRapidas.usados}
              subtitle="Veces utilizados"
              icon={<Users size={28} />}
              gradient="bg-gradient-to-r from-purple-500 to-pink-600"
              trend={{ value: 8.3, isPositive: true }}
              onClick={() => handleMetricClick('usados')}
            />
            <MetricCard
              title="Ahorro Generado"
              value={`$${estadisticasRapidas.ahorroTotal.toLocaleString()}`}
              subtitle="Valor para clientes"
              icon={<Target size={28} />}
              gradient="bg-gradient-to-r from-orange-500 to-red-600"
              trend={{ value: 15.7, isPositive: true }}
              onClick={() => handleMetricClick('ahorro')}
            />
          </div>
        </motion.div>

        {/* Acciones rápidas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <QuickActions
            onCreateBenefit={handleCreateNew}
            onRefresh={refrescar}
            onExport={handleExport}
            onViewAnalytics={() => setShowAnalytics(true)}
            loading={loading}
          />
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-8"
        >
          <FilterSection
            beneficios={beneficios}
            activeFilter={activeFilter}
            searchTerm={searchTerm}
            onFilterChange={setActiveFilter}
            onSearchChange={setSearchTerm}
          />
        </motion.div>

        {/* Lista de beneficios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <BeneficiosList
            beneficios={filteredBeneficios}
            loading={loading}
            userRole="comercio"
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={refrescar}
            showFilters={false}
          />
        </motion.div>

        {/* Estadísticas detalladas */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
              className="mt-12"
            >
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Estadísticas Detalladas</h3>
                      <p className="text-gray-600">Análisis completo de rendimiento</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setShowAnalytics(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye size={16} className="mr-2" />
                    Ocultar
                  </Button>
                </div>
                
                <BeneficiosStats
                  stats={stats}
                  loading={loading}
                  userRole="comercio"
                  beneficios={beneficios}
                  beneficiosUsados={beneficiosUsados}
                  estadisticasRapidas={estadisticasRapidas}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulario de beneficio */}
        <BeneficioForm
          isOpen={formOpen}
          onClose={handleFormClose}
          beneficio={editingBeneficio}
          comercioId={user?.uid || ''}
        />
      </motion.div>
    </DashboardLayout>
  );
}

// Loading component mejorado
function ComercioBeneficiosLoading() {
  return (
    <DashboardLayout
      activeSection="beneficios"
      sidebarComponent={(props: React.ComponentProps<typeof ComercioSidebar>) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
            <RefreshCw size={40} className="text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Cargando beneficios...
          </h3>
          <p className="text-gray-600 mb-6">Preparando tu gestión de beneficios</p>
          <div className="flex justify-center space-x-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-indigo-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default function ComercioBeneficiosPage() {
  return (
    <Suspense fallback={<ComercioBeneficiosLoading />}>
      <ComercioBeneficiosContent />
    </Suspense>
  );
}