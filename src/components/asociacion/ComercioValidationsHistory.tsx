import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Gift,
  DollarSign,
  ChevronRight,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ValidationData } from '@/services/comercio.service';

interface ComercioValidationsHistoryProps {
  open: boolean;
  comercioId: string;
  comercioNombre: string;
  onClose: () => void;
  onLoadValidations: (
    comercioId: string,
    filters: {
      fechaDesde?: Date;
      fechaHasta?: Date;
      estado?: string;
      beneficioId?: string;
    },
    pageSize?: number,
    lastDoc?: unknown
  ) => Promise<{ validaciones: ValidationData[]; hasMore: boolean; lastDoc: unknown }>;
}

export const ComercioValidationsHistory: React.FC<ComercioValidationsHistoryProps> = ({
  open,
  comercioId,
  comercioNombre,
  onClose,
  onLoadValidations
}) => {
  const [validaciones, setValidaciones] = useState<ValidationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<unknown>(null);
  const [filters, setFilters] = useState({
    fechaDesde: undefined as Date | undefined,
    fechaHasta: undefined as Date | undefined,
    estado: '',
    beneficioId: '',
    busqueda: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const loadValidaciones = React.useCallback(
    async (reset = false) => {
      setLoading(true);
      try {
        const result = await onLoadValidations(
          comercioId,
          {
            fechaDesde: filters.fechaDesde,
            fechaHasta: filters.fechaHasta,
            estado: filters.estado || undefined,
            beneficioId: filters.beneficioId || undefined,
          },
          pageSize,
          reset ? null : lastDoc
        );

        if (reset) {
          setValidaciones(result.validaciones);
          setCurrentPage(1);
        } else {
          setValidaciones(prev => [...prev, ...result.validaciones]);
        }

        setHasMore(result.hasMore);
        setLastDoc(result.lastDoc);
      } catch (error) {
        console.error('Error loading validaciones:', error);
      } finally {
        setLoading(false);
      }
    },
    [
      comercioId,
      filters.fechaDesde,
      filters.fechaHasta,
      filters.estado,
      filters.beneficioId,
      onLoadValidations,
      pageSize,
      lastDoc
    ]
  );

  useEffect(() => {
    if (open && comercioId) {
      loadValidaciones(true);
    }
  }, [open, comercioId, loadValidaciones]);

  const handleFilterChange = () => {
    setLastDoc(null);
    loadValidaciones(true);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadValidaciones(false);
      setCurrentPage(prev => prev + 1);
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'fallida':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return 'bg-green-100 text-green-800';
      case 'fallida':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredValidaciones = validaciones.filter(validacion => {
    if (!filters.busqueda) return true;
    const searchTerm = filters.busqueda.toLowerCase();
    return (
      validacion.socioNombre.toLowerCase().includes(searchTerm) ||
      validacion.beneficioTitulo.toLowerCase().includes(searchTerm) ||
      validacion.id.toLowerCase().includes(searchTerm)
    );
  });

  const exportToCSV = () => {
    const headers = [
      'Fecha',
      'Socio',
      'Beneficio',
      'Estado',
      'Descuento',
      'Método de Pago',
      'Notas'
    ];

    const csvData = filteredValidaciones.map(validacion => [
      format(validacion.fechaValidacion, 'dd/MM/yyyy HH:mm', { locale: es }),
      validacion.socioNombre,
      validacion.beneficioTitulo,
      validacion.estado,
      `$${validacion.montoDescuento.toFixed(2)}`,
      validacion.metodoPago || 'N/A',
      validacion.notas || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `validaciones_${comercioNombre}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Historial de Validaciones
                  </h3>
                  <p className="text-purple-100 text-sm">
                    {comercioNombre}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportToCSV}
                  className="px-3 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </button>
                <button
                  onClick={onClose}
                  className="text-white hover:text-purple-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por socio, beneficio o ID..."
                    value={filters.busqueda}
                    onChange={(e) => setFilters(prev => ({ ...prev, busqueda: e.target.value }))}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-80"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    showFilters 
                      ? 'bg-purple-50 border-purple-200 text-purple-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4 mr-2 inline" />
                  Filtros
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {filteredValidaciones.length} validaciones encontradas
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Desde
                    </label>
                    <input
                      type="date"
                      value={filters.fechaDesde ? format(filters.fechaDesde, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        fechaDesde: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha Hasta
                    </label>
                    <input
                      type="date"
                      value={filters.fechaHasta ? format(filters.fechaHasta, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        fechaHasta: e.target.value ? new Date(e.target.value) : undefined 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={filters.estado}
                      onChange={(e) => setFilters(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Todos los estados</option>
                      <option value="exitosa">Exitosa</option>
                      <option value="fallida">Fallida</option>
                      <option value="pendiente">Pendiente</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleFilterChange}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Aplicar Filtros
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {loading && validaciones.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Cargando validaciones...</span>
              </div>
            ) : filteredValidaciones.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No hay validaciones
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No se encontraron validaciones con los filtros aplicados.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredValidaciones.map((validacion, index) => (
                  <motion.div
                    key={validacion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getEstadoIcon(validacion.estado)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900">
                              {validacion.socioNombre}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(validacion.estado)}`}>
                              {validacion.estado}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(validacion.fechaValidacion, 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-green-600 font-medium">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${validacion.montoDescuento.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-500">
                          ID: {validacion.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Gift className="w-4 h-4 mr-1" />
                            {validacion.beneficioTitulo}
                          </div>
                          {validacion.metodoPago && (
                            <div className="text-sm text-gray-600">
                              Método: {validacion.metodoPago}
                            </div>
                          )}
                        </div>
                        {validacion.notas && (
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {validacion.notas}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Cargando...
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-4 h-4 mr-2" />
                          Cargar Más
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Página {currentPage} • {filteredValidaciones.length} validaciones mostradas
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
