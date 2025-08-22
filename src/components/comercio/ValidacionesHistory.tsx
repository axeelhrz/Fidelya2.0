'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useValidaciones } from '@/hooks/useValidaciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Download,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  MoreVertical,
  ArrowUpDown,
  Zap,
  Target,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Validacion } from '@/types/validacion';
import { Timestamp } from 'firebase/firestore';

const ITEMS_PER_PAGE = 12;

const RESULTADO_CONFIG = {
  habilitado: {
    label: 'Habilitado',
    icon: CheckCircle,
    color: '#10b981',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  no_habilitado: {
    label: 'No Habilitado',
    icon: XCircle,
    color: '#ef4444',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  },
  vencido: {
    label: 'Vencido',
    icon: Clock,
    color: '#f59e0b',
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  suspendido: {
    label: 'Suspendido',
    icon: AlertTriangle,
    color: '#f97316',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200'
  }
};

// Helper function to safely convert Timestamp to Date
const toDate = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  return new Date();
};

export const ValidacionesHistory: React.FC = () => {
  const { validaciones, loading, getStats, loadMore, hasMore, refresh, error } = useValidaciones();
  const [searchTerm, setSearchTerm] = useState('');
  const [resultadoFilter, setResultadoFilter] = useState<string>('all');
  const [fechaFilter, setFechaFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'fecha' | 'resultado' | 'monto'>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const stats = getStats();

  // Filter and sort validaciones
  const filteredAndSortedValidaciones = useMemo(() => {
    if (!Array.isArray(validaciones)) {
      return [];
    }

    const filtered = validaciones.filter((validacion: Validacion) => {
      if (!validacion) return false;

      // Search filter - handle different data structures safely
      const matchesSearch = searchTerm === '' || 
        (validacion.id && validacion.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (validacion.socioNombre && validacion.socioNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (validacion.socioId && validacion.socioId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (validacion.beneficioTitulo && validacion.beneficioTitulo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (validacion.beneficioId && validacion.beneficioId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (validacion.comercioNombre && validacion.comercioNombre.toLowerCase().includes(searchTerm.toLowerCase()));

      // Result filter
      const matchesResultado = resultadoFilter === 'all' || validacion.resultado === resultadoFilter;

      // Date filter
      let matchesFecha = true;
      if (fechaFilter !== 'all' && validacion.fechaHora) {
        const now = new Date();
        const validacionDate = toDate(validacion.fechaHora);
        
        switch (fechaFilter) {
          case 'today':
            matchesFecha = validacionDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesFecha = validacionDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesFecha = validacionDate >= monthAgo;
            break;
        }
      }

      return matchesSearch && matchesResultado && matchesFecha;
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'fecha':
          const dateA = toDate(a.fechaHora);
          const dateB = toDate(b.fechaHora);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'resultado':
          comparison = (a.resultado || '').localeCompare(b.resultado || '');
          break;
        case 'monto':
          comparison = (a.montoDescuento || a.monto || 0) - (b.montoDescuento || b.monto || 0);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [validaciones, searchTerm, resultadoFilter, fechaFilter, sortBy, sortOrder]);

  // Paginate results
  const totalPages = Math.ceil(filteredAndSortedValidaciones.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedValidaciones = filteredAndSortedValidaciones.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSort = (field: 'fecha' | 'resultado' | 'monto') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportValidaciones = () => {
    try {
      if (!filteredAndSortedValidaciones.length) {
        toast.error('No hay datos para exportar');
        return;
      }

      const csvContent = [
        ['Fecha', 'Hora', 'Socio', 'Beneficio', 'Comercio', 'Resultado', 'Monto', 'Descuento'].join(','),
        ...filteredAndSortedValidaciones.map(v => [
          format(toDate(v.fechaHora), 'dd/MM/yyyy', { locale: es }),
          format(toDate(v.fechaHora), 'HH:mm', { locale: es }),
          v.socioNombre || v.socioId || '',
          v.beneficioTitulo || v.beneficioId || '',
          v.comercioNombre || '',
          RESULTADO_CONFIG[v.resultado as keyof typeof RESULTADO_CONFIG]?.label || v.resultado,
          v.monto || 0,
          v.montoDescuento || 0,
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `validaciones-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('📥 Reporte exportado exitosamente', {
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
      console.error('Error exporting:', error);
      toast.error('❌ Error al exportar el reporte');
    }
  };

  const handleRefresh = async () => {
    try {
      await refresh();
      toast.success('✅ Datos actualizados correctamente');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('❌ Error al actualizar los datos');
    }
  };

  if (loading && validaciones.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12">
        <div className="flex flex-col items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mb-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-lg"
          >
            <RefreshCw size={32} className="text-white" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Cargando validaciones...</h3>
          <p className="text-gray-600">Obteniendo historial completo</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-12">
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 mb-6 bg-red-100 rounded-3xl flex items-center justify-center">
            <XCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar validaciones</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all duration-300"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* Header with Stats */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Historial de Validaciones
            </h2>
            <p className="text-gray-600 text-lg">
              Gestiona y analiza todas las validaciones de beneficios
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={exportValidaciones}
              disabled={!filteredAndSortedValidaciones.length}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Download size={20} />
              <span className="font-semibold">Exportar</span>
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              <span className="font-semibold">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Total Validaciones',
              value: stats.totalValidaciones,
              icon: Activity,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'from-blue-50 to-blue-100'
            },
            {
              title: 'Validaciones Exitosas',
              value: stats.validacionesExitosas,
              icon: CheckCircle,
              color: 'from-green-500 to-green-600',
              bgColor: 'from-green-50 to-green-100'
            },
            {
              title: 'Clientes Únicos',
              value: stats.clientesUnicos || 0,
              icon: Users,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'from-purple-50 to-purple-100'
            },
            {
              title: 'Tasa de Éxito',
              value: stats.totalValidaciones > 0 ? Math.round((stats.validacionesExitosas / stats.totalValidaciones) * 100) : 0,
              icon: Target,
              color: 'from-orange-500 to-orange-600',
              bgColor: 'from-orange-50 to-orange-100'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`bg-gradient-to-br ${stat.bgColor} rounded-2xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300`}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por ID, socio, beneficio o comercio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={resultadoFilter}
              onChange={(e) => setResultadoFilter(e.target.value)}
              className="px-4 py-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm min-w-[160px]"
            >
              <option value="all">Todos los resultados</option>
              {Object.entries(RESULTADO_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            
            <select
              value={fechaFilter}
              onChange={(e) => setFechaFilter(e.target.value)}
              className="px-4 py-4 rounded-2xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 bg-white/50 backdrop-blur-sm min-w-[160px]"
            >
              <option value="all">Todos los períodos</option>
              <option value="today">Hoy</option>
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                  viewMode === 'cards'
                    ? 'bg-white shadow-md text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                  <div className="bg-current rounded-sm"></div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                  viewMode === 'table'
                    ? 'bg-white shadow-md text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Results count and sorting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-4 sm:mb-0">
            Mostrando {paginatedValidaciones.length} de {filteredAndSortedValidaciones.length} validaciones
          </p>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <div className="flex space-x-2">
              {[
                { key: 'fecha', label: 'Fecha' },
                { key: 'resultado', label: 'Resultado' },
                { key: 'monto', label: 'Monto' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSort(option.key as 'fecha' | 'resultado' | 'monto')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-xl transition-all duration-300 ${
                    sortBy === option.key
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  {sortBy === option.key && (
                    <ArrowUpDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Validations Display */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 overflow-hidden">
        {filteredAndSortedValidaciones.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Eye className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No se encontraron validaciones
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || resultadoFilter !== 'all' || fechaFilter !== 'all'
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Las validaciones aparecerán aquí cuando los socios usen tus beneficios'
              }
            </p>
            {(searchTerm || resultadoFilter !== 'all' || fechaFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setResultadoFilter('all');
                  setFechaFilter('all');
                  setCurrentPage(1);
                }}
                className="px-6 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 transition-all duration-300"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              /* Cards View */
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {paginatedValidaciones.map((validacion, index) => {
                      const config = RESULTADO_CONFIG[validacion.resultado as keyof typeof RESULTADO_CONFIG];
                      const IconComponent = config?.icon || CheckCircle;
                      
                      return (
                        <motion.div
                          key={validacion.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300"
                          whileHover={{ scale: 1.02, y: -5 }}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 ${config?.bgColor || 'bg-gray-50'} rounded-xl flex items-center justify-center`}>
                                <IconComponent className={`w-5 h-5 ${config?.textColor || 'text-gray-600'}`} />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {format(toDate(validacion.fechaHora), 'dd/MM/yyyy', { locale: es })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(toDate(validacion.fechaHora), 'HH:mm', { locale: es })}
                                </p>
                              </div>
                            </div>
                            
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config?.bgColor || 'bg-gray-50'} ${config?.textColor || 'text-gray-600'}`}>
                              {config?.label || validacion.resultado}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Socio:</span>
                              <span className="text-sm font-mono text-gray-900 truncate max-w-[120px]">
                                {validacion.socioNombre || (validacion.socioId ? `${validacion.socioId.substring(0, 8)}...` : 'N/A')}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Beneficio:</span>
                              <span className="text-sm font-mono text-gray-900 truncate max-w-[120px]">
                                {validacion.beneficioTitulo || (validacion.beneficioId ? `${validacion.beneficioId.substring(0, 8)}...` : 'N/A')}
                              </span>
                            </div>

                            {validacion.comercioNombre && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Comercio:</span>
                                <span className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                                  {validacion.comercioNombre}
                                </span>
                              </div>
                            )}
                            
                            {(validacion.monto || validacion.montoDescuento) && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Monto:</span>
                                <span className="text-sm font-bold text-gray-900">
                                  ${(validacion.monto || validacion.montoDescuento || 0).toFixed(2)}
                                </span>
                              </div>
                            )}
                            
                            {validacion.ahorro && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Ahorro:</span>
                                <span className="text-sm font-bold text-green-600">
                                  ${validacion.ahorro.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                ID: {validacion.id ? `${validacion.id.substring(0, 8)}...` : 'N/A'}
                              </span>
                              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                                <MoreVertical size={16} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha y Hora</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Socio</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Beneficio</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Comercio</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Resultado</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <AnimatePresence>
                      {paginatedValidaciones.map((validacion, index) => {
                        const config = RESULTADO_CONFIG[validacion.resultado as keyof typeof RESULTADO_CONFIG];
                        const IconComponent = config?.icon || CheckCircle;
                        
                        return (
                          <motion.tr
                            key={validacion.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="hover:bg-blue-50/50 transition-colors duration-200"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {format(toDate(validacion.fechaHora), 'dd/MM/yyyy', { locale: es })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {format(toDate(validacion.fechaHora), 'HH:mm', { locale: es })}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {validacion.socioNombre || (validacion.socioId ? `${validacion.socioId.substring(0, 8)}...` : 'N/A')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {validacion.beneficioTitulo || (validacion.beneficioId ? `${validacion.beneficioId.substring(0, 8)}...` : 'N/A')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600">
                                {validacion.comercioNombre || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <IconComponent className={`w-4 h-4 ${config?.textColor || 'text-gray-600'}`} />
                                <span className={`text-sm font-semibold ${config?.textColor || 'text-gray-600'}`}>
                                  {config?.label || validacion.resultado}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-gray-900">
                                {(validacion.monto || validacion.montoDescuento) ? `$${(validacion.monto || validacion.montoDescuento || 0).toFixed(2)}` : '-'}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t border-gray-200">
                <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                  Página {currentPage} de {totalPages}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <ChevronLeft size={16} />
                    <span>Anterior</span>
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-xl transition-all duration-300 ${
                            currentPage === page
                              ? 'bg-blue-500 text-white shadow-lg'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    <span>Siguiente</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center p-6 border-t border-gray-200">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 mx-auto"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      <span>Cargando...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={20} />
                      <span>Cargar más validaciones</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};