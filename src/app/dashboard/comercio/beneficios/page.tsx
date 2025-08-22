'use client';

import React, { useState, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
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
  Zap,
  Star,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ComercioSidebar } from '@/components/layout/ComercioSidebar';
import { BeneficiosList } from '@/components/beneficios/BeneficiosList';
import { BeneficioForm } from '@/components/beneficios/BeneficioForm';
import { BeneficiosStats } from '@/components/beneficios/BeneficiosStats';
import { Button } from '@/components/ui/Button';
import { useBeneficiosComercios } from '@/hooks/useBeneficios';
import { Beneficio, BeneficioFormData } from '@/types/beneficio';
import toast from 'react-hot-toast';

// Componente para métricas rápidas mejoradas
interface EstadisticasRapidas {
  total: number;
  activos: number;
  usados: number;
}

const MetricasRapidas: React.FC<{
  estadisticas: EstadisticasRapidas;
  beneficios: Beneficio[];
}> = ({ estadisticas, beneficios }) => {
  const metricas = [
    {
      id: 'total',
      titulo: 'Total Beneficios',
      valor: estadisticas.total,
      icono: Gift,
      color: 'from-blue-500 to-blue-600',
      colorFondo: 'bg-blue-50',
      colorTexto: 'text-blue-700',
      descripcion: 'Beneficios creados'
    },
    {
      id: 'activos',
      titulo: 'Activos',
      valor: estadisticas.activos,
      icono: CheckCircle,
      color: 'from-green-500 to-green-600',
      colorFondo: 'bg-green-50',
      colorTexto: 'text-green-700',
      descripcion: 'Disponibles ahora'
    },
    {
      id: 'usados',
      titulo: 'Total Usos',
      valor: estadisticas.usados,
      icono: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      colorFondo: 'bg-purple-50',
      colorTexto: 'text-purple-700',
      descripcion: 'Veces utilizados'
    },
    {
      id: 'nuevos',
      titulo: 'Nuevos (7 días)',
      valor: beneficios.filter(b => {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return b.creadoEn.toDate() > sevenDaysAgo;
      }).length,
      icono: Zap,
      color: 'from-yellow-500 to-orange-500',
      colorFondo: 'bg-yellow-50',
      colorTexto: 'text-yellow-700',
      descripcion: 'Creados recientemente'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {metricas.map((metrica, index) => {
        const IconoComponente = metrica.icono;
        return (
          <motion.div
            key={metrica.id}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-14 h-14 bg-gradient-to-r ${metrica.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                <IconoComponente size={28} />
              </div>
              <div className={`px-3 py-1 ${metrica.colorFondo} ${metrica.colorTexto} rounded-full text-xs font-semibold`}>
                +{Math.floor(Math.random() * 15)}%
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-black text-gray-900">
                {metrica.valor.toLocaleString()}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                {metrica.titulo}
              </div>
              <div className="text-xs text-gray-500">
                {metrica.descripcion}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Componente para acciones rápidas
const AccionesRapidas: React.FC<{
  onNuevoBeneficio: () => void;
  onRefresh: () => void;
  onExport: () => void;
  loading: boolean;
}> = ({ onNuevoBeneficio, onRefresh, onExport, loading }) => {
  const acciones = [
    {
      id: 'nuevo',
      titulo: 'Nuevo Beneficio',
      descripcion: 'Crear beneficio atractivo',
      icono: Plus,
      color: 'from-indigo-500 to-purple-600',
      accion: onNuevoBeneficio
    },
    {
      id: 'refresh',
      titulo: 'Actualizar',
      descripcion: 'Recargar datos',
      icono: RefreshCw,
      color: 'from-blue-500 to-cyan-600',
      accion: onRefresh
    },
    {
      id: 'export',
      titulo: 'Exportar',
      descripcion: 'Descargar reporte',
      icono: Download,
      color: 'from-green-500 to-emerald-600',
      accion: onExport
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {acciones.map((accion, index) => {
        const IconoComponente = accion.icono;
        return (
          <motion.button
            key={accion.id}
            onClick={accion.accion}
            disabled={loading}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-r ${accion.color} rounded-xl flex items-center justify-center text-white shadow-lg group-hover:shadow-xl transition-shadow`}>
                <IconoComponente size={24} className={accion.id === 'refresh' && loading ? 'animate-spin' : ''} />
              </div>
              <div className="w-2 h-2 bg-gray-300 rounded-full group-hover:bg-gray-400 transition-colors"></div>
            </div>
            
            <div className="space-y-1">
              <div className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {accion.titulo}
              </div>
              <div className="text-sm text-gray-500">
                {accion.descripcion}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

// Componente para filtros avanzados
const FiltrosAvanzados: React.FC<{
  beneficios: Beneficio[];
  filtroActivo: string;
  onFiltroChange: (filtro: string) => void;
}> = ({ beneficios, filtroActivo, onFiltroChange }) => {
  const now = new Date();
  
  const filtros = [
    {
      id: 'todos',
      titulo: 'Todos',
      cantidad: beneficios.length,
      icono: Gift,
      color: 'text-gray-600',
      colorFondo: 'bg-gray-100'
    },
    {
      id: 'activos',
      titulo: 'Activos',
      cantidad: beneficios.filter(b => b.estado === 'activo' && b.fechaFin.toDate() > now).length,
      icono: CheckCircle,
      color: 'text-green-600',
      colorFondo: 'bg-green-100'
    },
    {
      id: 'vencidos',
      titulo: 'Vencidos',
      cantidad: beneficios.filter(b => b.estado === 'vencido' || (b.estado === 'activo' && b.fechaFin.toDate() <= now)).length,
      icono: Clock,
      color: 'text-red-600',
      colorFondo: 'bg-red-100'
    },
    {
      id: 'destacados',
      titulo: 'Destacados',
      cantidad: beneficios.filter(b => b.destacado).length,
      icono: Star,
      color: 'text-yellow-600',
      colorFondo: 'bg-yellow-100'
    },
    {
      id: 'populares',
      titulo: 'Populares',
      cantidad: beneficios.filter(b => (b.usosActuales || 0) > 10).length,
      icono: TrendingUp,
      color: 'text-purple-600',
      colorFondo: 'bg-purple-100'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Filtros</h3>
            <p className="text-sm text-gray-500">Organiza tus beneficios</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {filtros.map((filtro) => {
          const IconoComponente = filtro.icono;
          const isActive = filtroActivo === filtro.id;
          
          return (
            <motion.button
              key={filtro.id}
              onClick={() => onFiltroChange(filtro.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className={`w-8 h-8 ${isActive ? 'bg-indigo-500' : filtro.colorFondo} rounded-lg flex items-center justify-center`}>
                  <IconoComponente size={18} className={isActive ? 'text-white' : filtro.color} />
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${isActive ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {filtro.cantidad}
                  </div>
                  <div className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>
                    {filtro.titulo}
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

// Component that uses useSearchParams - needs to be wrapped in Suspense
function ComercioBeneficiosContent() {

  const {
    beneficios,
    beneficiosUsados,
    stats,
    loading,
    error,
    crearBeneficio,
    actualizarBeneficio,
    eliminarBeneficio,
    refrescar,
    estadisticasRapidas
  } = useBeneficiosComercios();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBeneficio, setEditingBeneficio] = useState<Beneficio | null>(null);
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar beneficios según el filtro activo
  const beneficiosFiltrados = useMemo(() => {
    const now = new Date();
    let filtered = beneficios;

    // Aplicar filtro por categoría
    switch (filtroActivo) {
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
        filtered = beneficios.filter(b => (b.usosActuales || 0) > 10);
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
  }, [beneficios, filtroActivo, searchTerm]);

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

  const handleFormSubmit = async (data: BeneficioFormData) => {
    try {
      if (editingBeneficio) {
        const updateData: Partial<BeneficioFormData> = {
          titulo: data.titulo,
          descripcion: data.descripcion,
          tipo: data.tipo,
          descuento: data.descuento,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          limitePorSocio: data.limitePorSocio,
          limiteTotal: data.limiteTotal,
          condiciones: data.condiciones,
          categoria: data.categoria,
          tags: data.tags,
          destacado: data.destacado,
          asociacionesDisponibles: data.asociacionesDisponibles
        };

        await actualizarBeneficio(editingBeneficio.id, updateData);
        toast.success('Beneficio actualizado exitosamente');
      } else {
        await crearBeneficio(data);
        toast.success('Beneficio creado exitosamente');
      }
      setFormOpen(false);
      setEditingBeneficio(null);
      return true;
    } catch (error) {
      console.error('Error en formulario:', error);
      toast.error('Error al guardar el beneficio');
      return false;
    }
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

  if (error) {
    return (
      <DashboardLayout
        activeSection="beneficios"
        sidebarComponent={(props) => (
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
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {
            window.location.href = '/logout';
          }}
        />
      )}
    >
      <motion.div
        className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header principal mejorado */}
        <div className="mb-8">
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl mb-4 shadow-lg">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Gestión de Beneficios
            </h1>
            <p className="text-xl text-gray-600 font-medium max-w-2xl mx-auto">
              Crea y administra beneficios atractivos para fidelizar a tus clientes
            </p>
          </motion.div>

          {/* Métricas rápidas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <MetricasRapidas estadisticas={estadisticasRapidas} beneficios={beneficios} />
          </motion.div>

          {/* Acciones rápidas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-8"
          >
            <AccionesRapidas
              onNuevoBeneficio={handleCreateNew}
              onRefresh={refrescar}
              onExport={handleExport}
              loading={loading}
            />
          </motion.div>

          {/* Filtros avanzados */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-8"
          >
            <FiltrosAvanzados
              beneficios={beneficios}
              filtroActivo={filtroActivo}
              onFiltroChange={setFiltroActivo}
            />
          </motion.div>

          {/* Barra de búsqueda */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg mb-8"
          >
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar beneficios por título, descripción o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
          </motion.div>
        </div>

        {/* Lista de beneficios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <BeneficiosList
            beneficios={beneficiosFiltrados}
            loading={loading}
            userRole="comercio"
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={refrescar}
            showFilters={false}
          />
        </motion.div>

        {/* Estadísticas detalladas - AHORA CON DATOS REALES */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-12"
        >
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Estadísticas Detalladas</h3>
                <p className="text-gray-600">Análisis completo de rendimiento</p>
              </div>
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

        {/* Formulario de beneficio (modal mejorado) */}
        <BeneficioForm
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingBeneficio(null);
          }}
          onSubmit={handleFormSubmit}
          beneficio={editingBeneficio}
          loading={loading}
        />
      </motion.div>
    </DashboardLayout>
  );
}

// Loading fallback component mejorado
function ComercioBeneficiosLoading() {
  return (
    <DashboardLayout
      activeSection="beneficios"
      sidebarComponent={(props) => (
        <ComercioSidebar
          {...props}
          onLogoutClick={() => {}}
        />
      )}
    >
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
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