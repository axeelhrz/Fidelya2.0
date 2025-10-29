'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  MoreVertical,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  TrendingUp,
  Star,
  DollarSign,
  Percent,
  Tag,
  Settings
} from 'lucide-react';
import { useBeneficiosAsociacion } from '@/hooks/useBeneficios';
import { Beneficio, CATEGORIAS_BENEFICIOS } from '@/types/beneficio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface BeneficiosManagementProps {
  onCreateBeneficio?: () => void;
}

export const BeneficiosManagement: React.FC<BeneficiosManagementProps> = ({
  onCreateBeneficio
}) => {
  const {
    beneficios,
    loading,
    error,
    estadisticasRapidas,
    eliminarBeneficio,
    cambiarEstadoBeneficio,
    refrescar
  } = useBeneficiosAsociacion();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBeneficio, setSelectedBeneficio] = useState<Beneficio | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Función mejorada para manejar la creación de beneficios
  const handleCreateBeneficioClick = () => {
    console.log('🎯 Botón Nuevo Beneficio clickeado');
    
    if (onCreateBeneficio && typeof onCreateBeneficio === 'function') {
      try {
        console.log('✅ Ejecutando función onCreateBeneficio');
        onCreateBeneficio();
        toast.success('Abriendo formulario de creación...');
      } catch (error) {
        console.error('❌ Error al ejecutar onCreateBeneficio:', error);
        toast.error('Error al abrir el formulario de creación');
      }
    } else {
      console.warn('⚠️ onCreateBeneficio no está definido o no es una función');
      toast.error('Función de creación no disponible');
    }
  };

  // Filtrar beneficios
  const filteredBeneficios = useMemo(() => {
    return beneficios.filter(beneficio => {
      const matchesSearch = searchTerm === '' || 
        beneficio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficio.comercioNombre.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === '' || beneficio.categoria === selectedCategory;
      const matchesStatus = selectedStatus === '' || beneficio.estado === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [beneficios, searchTerm, selectedCategory, selectedStatus]);

  // Manejar eliminación de beneficio
  const handleDeleteBeneficio = async (beneficioId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este beneficio?')) return;
    
    setActionLoading(beneficioId);
    try {
      await eliminarBeneficio(beneficioId);
      toast.success('Beneficio eliminado exitosamente');
    } catch {
      toast.error('Error al eliminar el beneficio');
    } finally {
      setActionLoading(null);
    }
  };

  // Manejar cambio de estado
  const handleChangeStatus = async (beneficioId: string, newStatus: 'activo' | 'inactivo') => {
    setActionLoading(beneficioId);
    try {
      await cambiarEstadoBeneficio(beneficioId, newStatus);
      toast.success(`Beneficio ${newStatus === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
    } catch {
      toast.error('Error al cambiar el estado del beneficio');
    } finally {
      setActionLoading(null);
    }
  };

  // Obtener color del estado
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      case 'inactivo': return 'text-slate-700 bg-slate-100 border-slate-200';
      case 'vencido': return 'text-red-700 bg-red-100 border-red-200';
      case 'agotado': return 'text-orange-700 bg-orange-100 border-orange-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'activo': return <CheckCircle className="w-4 h-4" />;
      case 'inactivo': return <Clock className="w-4 h-4" />;
      case 'vencido': return <AlertCircle className="w-4 h-4" />;
      case 'agotado': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Obtener icono del tipo de descuento
  const getDiscountIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return <Percent className="w-5 h-5" />;
      case 'monto_fijo': return <DollarSign className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <Gift className="absolute inset-0 m-auto w-6 h-6 text-purple-500 animate-pulse" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando beneficios</h3>
          <p className="text-gray-600">Obteniendo las mejores ofertas...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-900 mb-2">Error al cargar beneficios</h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={refrescar}
            className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            Reintentar
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Estadísticas mejoradas */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
      >
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Beneficios</p>
              <p className="text-3xl font-bold text-slate-900">{estadisticasRapidas.total}</p>
              <p className="text-xs text-slate-500 mt-1">Ofertas creadas</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <Gift className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Activos</p>
              <p className="text-3xl font-bold text-emerald-600">{estadisticasRapidas.activos}</p>
              <p className="text-xs text-emerald-600 mt-1">Disponibles ahora</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Usos Totales</p>
              <p className="text-3xl font-bold text-blue-600">{estadisticasRapidas.usados}</p>
              <p className="text-xs text-blue-600 mt-1">Beneficios utilizados</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">Ahorro Total</p>
              <p className="text-3xl font-bold text-emerald-600">
                ${estadisticasRapidas.ahorroTotal.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-1">Valor generado</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controles mejorados */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Búsqueda mejorada */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar beneficios, comercios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 placeholder-slate-400"
            />
          </div>

          {/* Controles de vista y acciones */}
          <div className="flex items-center gap-3">
            {/* Toggle de vista */}
            <div className="hidden sm:flex bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="w-4 h-4 flex flex-col gap-1">
                  <div className="h-0.5 bg-current rounded"></div>
                  <div className="h-0.5 bg-current rounded"></div>
                  <div className="h-0.5 bg-current rounded"></div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
                showFilters 
                  ? 'bg-purple-50 border-purple-200 text-purple-700' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
            </button>
            
            {/* Botón Nuevo mejorado con mejor debugging */}
            <button
              onClick={handleCreateBeneficioClick}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium transform hover:-translate-y-0.5 active:scale-95"
              type="button"
              title="Crear nuevo beneficio"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo Beneficio</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </div>
        </div>

        {/* Panel de filtros mejorado */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-6 border-t border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Categoría
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Todas las categorías</option>
                      {CATEGORIAS_BENEFICIOS.map(categoria => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Todos los estados</option>
                      <option value="activo">Activo</option>
                      <option value="inactivo">Inactivo</option>
                      <option value="vencido">Vencido</option>
                      <option value="agotado">Agotado</option>
                    </select>
                  </div>
                  
                  <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                    <button
                      onClick={() => {
                        setSelectedCategory('');
                        setSelectedStatus('');
                        setSearchTerm('');
                      }}
                      className="w-full px-4 py-2 text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Lista/Grid de beneficios */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {filteredBeneficios.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                {beneficios.length === 0 ? 'No hay beneficios' : 'No se encontraron beneficios'}
              </h3>
              <p className="text-slate-600 mb-6">
                {beneficios.length === 0 
                  ? 'Crea tu primer beneficio para comenzar a ofrecer promociones exclusivas'
                  : 'Intenta ajustar los filtros de búsqueda para encontrar lo que buscas'
                }
              </p>
              {beneficios.length === 0 && (
                <button
                  onClick={handleCreateBeneficioClick}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium transform hover:-translate-y-0.5"
                >
                  Crear Primer Beneficio
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={`${
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' 
              : 'space-y-4'
          }`}>
            {filteredBeneficios.map((beneficio, index) => (
              <motion.div
                key={beneficio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                  viewMode === 'list' ? 'p-6' : 'p-0'
                }`}
              >
                {viewMode === 'grid' ? (
                  // Vista de tarjeta
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${getStatusColor(beneficio.estado)}`}>
                          {getDiscountIcon(beneficio.tipo)}
                        </div>
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(beneficio.estado)}`}>
                            {getStatusIcon(beneficio.estado)}
                            {beneficio.estado.charAt(0).toUpperCase() + beneficio.estado.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Menú de acciones */}
                      <div className="relative group/menu">
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                setSelectedBeneficio(beneficio);
                                setShowDetailModal(true);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver detalles
                            </button>
                            
                            <button
                              onClick={() => handleChangeStatus(
                                beneficio.id, 
                                beneficio.estado === 'activo' ? 'inactivo' : 'activo'
                              )}
                              disabled={actionLoading === beneficio.id}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === beneficio.id ? (
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                              ) : (
                                <Settings className="w-4 h-4" />
                              )}
                              {beneficio.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteBeneficio(beneficio.id)}
                              disabled={actionLoading === beneficio.id}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === beneficio.id ? (
                                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-1">
                        {beneficio.titulo}
                      </h3>
                      {beneficio.destacado && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-xs font-medium text-yellow-700">Destacado</span>
                        </div>
                      )}
                      <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                        {beneficio.descripcion}
                      </p>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{beneficio.comercioNombre}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Tag className="w-4 h-4" />
                        <span>{beneficio.categoria}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users className="w-4 h-4" />
                        <span>{beneficio.usosActuales} usos</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="text-sm text-slate-500">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        Vence: {format(beneficio.fechaFin.toDate(), 'dd/MM/yy', { locale: es })}
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-purple-600">
                          {beneficio.tipo === 'porcentaje' ? `${beneficio.descuento}%` : 
                           beneficio.tipo === 'monto_fijo' ? `$${beneficio.descuento}` : 
                           'Gratis'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Vista de lista
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl ${getStatusColor(beneficio.estado)}`}>
                        {getDiscountIcon(beneficio.tipo)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900 truncate">
                            {beneficio.titulo}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(beneficio.estado)}`}>
                            {getStatusIcon(beneficio.estado)}
                            {beneficio.estado.charAt(0).toUpperCase() + beneficio.estado.slice(1)}
                          </span>
                          {beneficio.destacado && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        
                        <p className="text-slate-600 text-sm line-clamp-1 mb-2">
                          {beneficio.descripcion}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {beneficio.comercioNombre}
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            {beneficio.categoria}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {beneficio.usosActuales} usos
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Vence: {format(beneficio.fechaFin.toDate(), 'dd/MM/yyyy', { locale: es })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-600">
                          {beneficio.tipo === 'porcentaje' ? `${beneficio.descuento}%` : 
                           beneficio.tipo === 'monto_fijo' ? `$${beneficio.descuento}` : 
                           'Gratis'}
                        </div>
                        <div className="text-sm text-slate-500">
                          {beneficio.tipo === 'porcentaje' ? 'Descuento' : 
                           beneficio.tipo === 'monto_fijo' ? 'Descuento fijo' : 
                           'Producto gratis'}
                        </div>
                      </div>
                      
                      {/* Menú de acciones para vista lista */}
                      <div className="relative group/menu">
                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                setSelectedBeneficio(beneficio);
                                setShowDetailModal(true);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Ver detalles
                            </button>
                            
                            <button
                              onClick={() => handleChangeStatus(
                                beneficio.id, 
                                beneficio.estado === 'activo' ? 'inactivo' : 'activo'
                              )}
                              disabled={actionLoading === beneficio.id}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === beneficio.id ? (
                                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                              ) : (
                                <Settings className="w-4 h-4" />
                              )}
                              {beneficio.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                            
                            <button
                              onClick={() => handleDeleteBeneficio(beneficio.id)}
                              disabled={actionLoading === beneficio.id}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === beneficio.id ? (
                                <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal de detalles mejorado */}
      <AnimatePresence>
        {showDetailModal && selectedBeneficio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-slate-900">
                    Detalles del Beneficio
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-2xl font-bold text-slate-900">
                        {selectedBeneficio.titulo}
                      </h3>
                      {selectedBeneficio.destacado && (
                        <Star className="w-6 h-6 text-yellow-500 fill-current" />
                      )}
                    </div>
                    <p className="text-slate-600 text-lg leading-relaxed">
                      {selectedBeneficio.descripcion}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Comercio
                        </label>
                        <p className="text-slate-900 text-lg">{selectedBeneficio.comercioNombre}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Categoría
                        </label>
                        <p className="text-slate-900">{selectedBeneficio.categoria}</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Tipo de descuento
                        </label>
                        <p className="text-slate-900">
                          {selectedBeneficio.tipo === 'porcentaje' ? 'Porcentaje' : 
                           selectedBeneficio.tipo === 'monto_fijo' ? 'Monto fijo' : 
                           'Producto gratis'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Descuento
                        </label>
                        <p className="text-2xl font-bold text-purple-600">
                          {selectedBeneficio.tipo === 'porcentaje' ? `${selectedBeneficio.descuento}%` : 
                           selectedBeneficio.tipo === 'monto_fijo' ? `$${selectedBeneficio.descuento}` : 
                           'Gratis'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Fecha de inicio
                        </label>
                        <p className="text-slate-900">
                          {format(selectedBeneficio.fechaInicio.toDate(), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Fecha de fin
                        </label>
                        <p className="text-slate-900">
                          {format(selectedBeneficio.fechaFin.toDate(), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Usos actuales
                        </label>
                        <p className="text-slate-900">
                          {selectedBeneficio.usosActuales}
                          {selectedBeneficio.limiteTotal && ` / ${selectedBeneficio.limiteTotal}`}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Estado
                        </label>
                        <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${getStatusColor(selectedBeneficio.estado)}`}>
                          {getStatusIcon(selectedBeneficio.estado)}
                          {selectedBeneficio.estado.charAt(0).toUpperCase() + selectedBeneficio.estado.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedBeneficio.condiciones && (
                    <div className="bg-slate-50 rounded-xl p-6">
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Condiciones y términos
                      </label>
                      <p className="text-slate-600 leading-relaxed">
                        {selectedBeneficio.condiciones}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};