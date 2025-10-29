import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gift,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Percent,
  DollarSign,
  Package,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { BeneficiosService } from '@/services/beneficios.service';
import { Beneficio } from '@/types/beneficio';

interface ComerciosBeneficiosModalProps {
  isOpen: boolean;
  onClose: () => void;
  comercio: {
    id: string;
    nombreComercio: string;
  } | null;
}

export const ComerciosBeneficiosModal: React.FC<ComerciosBeneficiosModalProps> = ({
  isOpen,
  onClose,
  comercio
}) => {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const loadBeneficios = React.useCallback(async () => {
    if (!comercio) return;

    setLoading(true);
    try {
      const beneficiosData = await BeneficiosService.obtenerBeneficiosPorComercio(comercio.id);
      setBeneficios(beneficiosData);
    } catch (error) {
      console.error('Error loading benefits:', error);
    } finally {
      setLoading(false);
    }
  }, [comercio]);

  useEffect(() => {
    if (isOpen && comercio) {
      loadBeneficios();
    }
  }, [isOpen, comercio, loadBeneficios]);

  const filteredBeneficios = beneficios.filter(beneficio => {
    const matchesSearch = !searchTerm || 
      beneficio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      beneficio.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEstado = !selectedEstado || beneficio.estado === selectedEstado;
    const matchesCategoria = !selectedCategoria || beneficio.categoria === selectedCategoria;
    
    return matchesSearch && matchesEstado && matchesCategoria;
  });

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje':
        return <Percent className="w-4 h-4" />;
      case 'monto_fijo':
        return <DollarSign className="w-4 h-4" />;
      case 'producto_gratis':
        return <Package className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const formatDescuento = (beneficio: Beneficio) => {
    switch (beneficio.tipo) {
      case 'porcentaje':
        return `${beneficio.descuento}%`;
      case 'monto_fijo':
        return new Intl.NumberFormat('es-AR', {
          style: 'currency',
          currency: 'ARS'
        }).format(beneficio.descuento);
      case 'producto_gratis':
        return 'Gratis';
      default:
        return beneficio.descuento.toString();
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inactivo':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'vencido':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'agotado':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactivo':
        return <XCircle className="w-4 h-4" />;
      case 'vencido':
        return <Clock className="w-4 h-4" />;
      case 'agotado':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const categorias = Array.from(new Set(beneficios.map(b => b.categoria)));

  const stats = {
    total: beneficios.length,
    activos: beneficios.filter(b => b.estado === 'activo').length,
    vencidos: beneficios.filter(b => b.estado === 'vencido').length,
    totalUsos: beneficios.reduce((sum, b) => sum + (b.usosActuales || 0), 0)
  };

  if (!isOpen || !comercio) return null;

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
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Beneficios del Comercio
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Gift className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-700">Total</p>
                        <p className="text-xl font-bold text-blue-900">{stats.total}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-700">Activos</p>
                        <p className="text-xl font-bold text-emerald-900">{stats.activos}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700">Vencidos</p>
                        <p className="text-xl font-bold text-red-900">{stats.vencidos}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Total Usos</p>
                        <p className="text-xl font-bold text-purple-900">{stats.totalUsos}</p>
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
                      placeholder="Buscar beneficios..."
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
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                            <option value="vencido">Vencido</option>
                            <option value="agotado">Agotado</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Categoría
                          </label>
                          <select
                            value={selectedCategoria}
                            onChange={(e) => setSelectedCategoria(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          >
                            <option value="">Todas las categorías</option>
                            {categorias.map(categoria => (
                              <option key={categoria} value={categoria}>
                                {categoria}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSearchTerm('');
                              setSelectedEstado('');
                              setSelectedCategoria('');
                            }}
                            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all duration-200"
                          >
                            Limpiar filtros
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Benefits List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
                      <span className="text-slate-600 font-medium">Cargando beneficios...</span>
                    </div>
                  </div>
                ) : filteredBeneficios.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Gift className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No hay beneficios
                    </h3>
                    <p className="text-slate-600">
                      {searchTerm || selectedEstado || selectedCategoria
                        ? 'No se encontraron beneficios con los filtros aplicados.'
                        : 'Este comercio aún no tiene beneficios registrados.'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredBeneficios.map((beneficio, index) => (
                        <motion.div
                          key={beneficio.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden relative"
                        >
                          {/* Background decoration */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          <div className="relative z-10">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                  <div className="text-purple-600">
                                    {getTipoIcon(beneficio.tipo)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-lg font-semibold text-slate-900 truncate group-hover:text-purple-700 transition-colors duration-300">
                                    {beneficio.titulo}
                                  </h4>
                                  {beneficio.destacado && (
                                    <div className="flex items-center mt-1">
                                      <Star className="w-4 h-4 text-amber-500 fill-current" />
                                      <span className="text-sm text-amber-600 ml-1 font-medium">Destacado</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                                  {formatDescuento(beneficio)}
                                </span>
                              </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                              {beneficio.descripcion}
                            </p>

                            {/* Status and Category */}
                            <div className="flex items-center justify-between mb-4">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEstadoColor(beneficio.estado)}`}>
                                {getEstadoIcon(beneficio.estado)}
                                <span className="ml-1 capitalize">{beneficio.estado}</span>
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {beneficio.categoria}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Usos actuales:</span>
                                <span className="font-medium text-slate-900">{beneficio.usosActuales || 0}</span>
                              </div>
                              
                              {beneficio.limiteTotal && (
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600">Límite total:</span>
                                  <span className="font-medium text-slate-900">{beneficio.limiteTotal}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Válido hasta:</span>
                                <span className="font-medium text-slate-900">
                                  {beneficio.fechaFin.toDate().toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Progress bar for usage */}
                            {beneficio.limiteTotal && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                                  <span>Progreso de uso</span>
                                  <span>{Math.round(((beneficio.usosActuales || 0) / beneficio.limiteTotal) * 100)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                    style={{ 
                                      width: `${Math.min(((beneficio.usosActuales || 0) / beneficio.limiteTotal) * 100, 100)}%` 
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                              <div className="flex items-center text-xs text-slate-500">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>Creado: {beneficio.creadoEn.toDate().toLocaleDateString()}</span>
                              </div>
                              
                              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Ver detalles"
                                >
                                  <Eye size={16} />
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200"
                                  title="Editar"
                                >
                                  <Edit size={16} />
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Eliminar"
                                >
                                  <Trash2 size={16} />
                                </motion.button>
                              </div>
                            </div>
                          </div>
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