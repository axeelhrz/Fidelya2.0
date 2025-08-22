import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  User,
  DollarSign,
  Filter,
  Download,
  Search,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  BarChart3
} from 'lucide-react';

interface Validacion {
  id: string;
  socioNombre: string;
  socioEmail: string;
  beneficioTitulo: string;
  beneficioDescripcion: string;
  tipoDescuento: 'porcentaje' | 'monto_fijo' | 'producto_gratis';
  descuento: number;
  montoOriginal: number;
  montoFinal: number;
  estado: 'exitosa' | 'fallida' | 'pendiente';
  fechaValidacion: Date | { toDate?: () => Date } | string;
  metodoPago?: string;
  notas?: string;
}

interface ValidationStats {
  totalValidaciones: number;
  exitosas: number;
  fallidas: number;
  montoTotal: number;
  ahorroTotal: number;
}

interface ComercioValidationsModalProps {
  open: boolean;
  onClose: () => void;
  comercio: {
    id: string;
    nombreComercio: string;
  } | null;
  onLoadValidations: (
    comercioId: string,
    filters?: ValidationFilters,
    limit?: number
  ) => Promise<{
    validaciones: Validacion[];
    total: number;
    stats: ValidationStats;
  }>;
  loading: boolean;
}

interface ValidationFilters {
  estado?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  [key: string]: string | undefined;
}

export const ComercioValidationsModal: React.FC<ComercioValidationsModalProps> = ({
  open,
  onClose,
  comercio,
  onLoadValidations,
}) => {
  const [validaciones, setValidaciones] = useState<Validacion[]>([]);
  const [stats, setStats] = useState<ValidationStats>({
    totalValidaciones: 0,
    exitosas: 0,
    fallidas: 0,
    montoTotal: 0,
    ahorroTotal: 0
  });
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadValidations = React.useCallback(async () => {
    if (!comercio) return;

    setLoadingData(true);
    try {
      const result = await onLoadValidations(comercio.id);
      setValidaciones(result.validaciones);
      setStats(result.stats);
    } catch (error) {
      console.error('Error loading validations:', error);
    } finally {
      setLoadingData(false);
    }
  }, [comercio, onLoadValidations]);

  useEffect(() => {
    if (open && comercio) {
      loadValidations();
    }
  }, [open, comercio, loadValidations]);

  const filteredValidaciones = validaciones.filter(validacion => {
    const matchesSearch = !searchTerm || 
      validacion.socioNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      validacion.beneficioTitulo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = !selectedEstado || validacion.estado === selectedEstado;
    
    return matchesSearch && matchesEstado;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'fallida':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendiente':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return <CheckCircle className="w-4 h-4" />;
      case 'fallida':
        return <XCircle className="w-4 h-4" />;
      case 'pendiente':
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getValidacionDate = (fechaValidacion: Validacion['fechaValidacion']): Date | null => {
    if (!fechaValidacion) return null;
    if (typeof fechaValidacion === 'string') {
      const d = new Date(fechaValidacion);
      return isNaN(d.getTime()) ? null : d;
    }
    if (fechaValidacion instanceof Date) {
      return fechaValidacion;
    }
    if (typeof fechaValidacion === 'object' && typeof fechaValidacion.toDate === 'function') {
      const d = fechaValidacion.toDate();
      return d instanceof Date && !isNaN(d.getTime()) ? d : null;
    }
    return null;
  };

  if (!open || !comercio) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop with blur effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-md bg-white/30"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-6xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Historial de Validaciones
                    </h2>
                    <p className="text-purple-100">
                      {comercio.nombreComercio}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
            </div>

            {/* Content */}
            <div className="flex flex-col h-full max-h-[calc(90vh-120px)]">
              {/* Stats Cards */}
              <div className="p-6 border-b border-slate-200">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                                                <p className="text-sm font-medium text-blue-700">Total</p>
                        <p className="text-xl font-bold text-blue-900">{stats.totalValidaciones}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Exitosas</p>
                        <p className="text-xl font-bold text-emerald-900">{stats.exitosas}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700">Fallidas</p>
                        <p className="text-xl font-bold text-red-900">{stats.fallidas}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Monto Total</p>
                        <p className="text-lg font-bold text-purple-900">{formatCurrency(stats.montoTotal)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-amber-700">Ahorro Total</p>
                        <p className="text-lg font-bold text-amber-900">{formatCurrency(stats.ahorroTotal)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por socio o beneficio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Filter Button */}
                  <div className="flex items-center space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowFilters(!showFilters)}
                      className={`inline-flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        showFilters 
                          ? 'bg-purple-100 border-purple-200 text-purple-700' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      } border`}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                      <ChevronDown className={`w-4 h-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {/* Export functionality */}}
                      className="inline-flex items-center px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 text-sm font-medium"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exportar
                    </motion.button>
                  </div>
                </div>

                {/* Advanced Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-slate-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Estado
                          </label>
                          <select
                            value={selectedEstado}
                            onChange={(e) => setSelectedEstado(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Todos los estados</option>
                            <option value="exitosa">Exitosa</option>
                            <option value="fallida">Fallida</option>
                            <option value="pendiente">Pendiente</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha Desde
                          </label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Fecha Hasta
                          </label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Validations List */}
              <div className="flex-1 overflow-y-auto">
                {loadingData ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <span className="text-slate-600 font-medium">Cargando validaciones...</span>
                    </div>
                  </div>
                ) : filteredValidaciones.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No hay validaciones
                    </h3>
                    <p className="text-slate-600">
                      {searchTerm || selectedEstado 
                        ? 'No se encontraron validaciones con los filtros aplicados.'
                        : 'Este comercio aún no tiene validaciones registradas.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-4">
                      {filteredValidaciones.map((validacion, index) => (
                        <motion.div
                          key={validacion.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gradient-to-br from-white to-slate-50 rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-purple-600" />
                              </div>
                              <div>
                                <h4 className="text-lg font-semibold text-slate-900">
                                  {validacion.socioNombre}
                                </h4>
                                <p className="text-sm text-slate-600">{validacion.socioEmail}</p>
                                <p className="text-xs text-slate-400">
                                  {getValidacionDate(validacion.fechaValidacion)?.toLocaleDateString() || 'Fecha no disponible'}{' '}
                                  {getValidacionDate(validacion.fechaValidacion)?.toLocaleTimeString() || ''}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(validacion.estado)}`}>
                                {getEstadoIcon(validacion.estado)}
                                <span className="ml-1 capitalize">{validacion.estado}</span>
                              </span>
                              <div className="text-right">
                                <p className="text-sm text-slate-500">
                                  {getValidacionDate(validacion.fechaValidacion)?.toLocaleDateString() || 'Fecha no disponible'}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {getValidacionDate(validacion.fechaValidacion)?.toLocaleTimeString() || ''}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Beneficio Utilizado</h5>
                              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <p className="font-medium text-slate-900">{validacion.beneficioTitulo}</p>
                                {validacion.beneficioDescripcion && (
                                  <p className="text-sm text-slate-600 mt-1">{validacion.beneficioDescripcion}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-sm text-slate-600">
                                    Tipo: <span className="font-medium">{validacion.tipoDescuento}</span>
                                  </span>
                                  <span className="text-sm text-emerald-600 font-semibold">
                                    Descuento: {formatCurrency(validacion.descuento)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Detalles de la Transacción</h5>
                              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Monto Original:</span>
                                    <span className="text-sm font-medium">{formatCurrency(validacion.montoOriginal)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-sm text-slate-600">Descuento:</span>
                                    <span className="text-sm font-medium text-emerald-600">-{formatCurrency(validacion.descuento)}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-slate-200 pt-2">
                                    <span className="text-sm font-medium text-slate-700">Monto Final:</span>
                                    <span className="text-sm font-bold text-slate-900">{formatCurrency(validacion.montoFinal)}</span>
                                  </div>
                                  {validacion.metodoPago && (
                                    <div className="flex justify-between">
                                      <span className="text-sm text-slate-600">Método de Pago:</span>
                                      <span className="text-sm font-medium">{validacion.metodoPago}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {validacion.notas && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-slate-700 mb-2">Notas</h5>
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-800">{validacion.notas}</p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

