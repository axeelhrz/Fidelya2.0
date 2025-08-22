import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Calendar,
  Users,
  TrendingUp,
  Filter,
  Search,
  EyeOff,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Percent,
  DollarSign,
  Package
} from 'lucide-react';
import { Beneficio, BeneficioStats } from '@/types/beneficio';
import { BeneficiosService } from '@/services/beneficios.service';
import { formatCurrency } from '@/lib/utils';

interface BeneficiosComercioViewProps {
  comercioId: string;
  comercioNombre: string;
  onClose?: () => void;
}

interface BeneficioFilter {
  estado?: string;
  categoria?: string;
  busqueda?: string;
  soloDestacados?: boolean;
}

export const BeneficiosComercioView: React.FC<BeneficiosComercioViewProps> = ({
  comercioId,
  comercioNombre,
  onClose
}) => {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [beneficiosFiltrados, setBeneficiosFiltrados] = useState<Beneficio[]>([]);
  const [stats, setStats] = useState<BeneficioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<BeneficioFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  // Cargar beneficios del comercio
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        const [beneficiosData, statsData] = await Promise.all([
          BeneficiosService.obtenerBeneficiosPorComercio(comercioId),
          BeneficiosService.obtenerEstadisticas({ comercioId })
        ]);

        setBeneficios(beneficiosData);
        setBeneficiosFiltrados(beneficiosData);
        setStats(statsData);
      } catch (err) {
        console.error('Error cargando beneficios del comercio:', err);
        setError('Error al cargar los beneficios del comercio');
      } finally {
        setLoading(false);
      }
    };

    if (comercioId) {
      cargarDatos();
    }
  }, [comercioId]);

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...beneficios];

    // Filtro por estado
    if (filtros.estado) {
      filtered = filtered.filter(b => b.estado === filtros.estado);
    }

    // Filtro por categoría
    if (filtros.categoria) {
      filtered = filtered.filter(b => b.categoria === filtros.categoria);
    }

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      filtered = filtered.filter(b => 
        b.titulo.toLowerCase().includes(busqueda) ||
        b.descripcion.toLowerCase().includes(busqueda) ||
        b.categoria.toLowerCase().includes(busqueda)
      );
    }

    // Solo destacados
    if (filtros.soloDestacados) {
      filtered = filtered.filter(b => b.destacado);
    }

    setBeneficiosFiltrados(filtered);
  }, [beneficios, filtros]);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-gray-100 text-gray-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      case 'agotado':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <CheckCircle className="w-4 h-4" />;
      case 'inactivo':
        return <EyeOff className="w-4 h-4" />;
      case 'vencido':
        return <Clock className="w-4 h-4" />;
      case 'agotado':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

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
        return formatCurrency(beneficio.descuento);
      case 'producto_gratis':
        return 'Gratis';
      default:
        return beneficio.descuento.toString();
    }
  };

  const categorias = Array.from(new Set(beneficios.map(b => b.categoria)));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando beneficios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Beneficios de {comercioNombre}
          </h2>
          <p className="text-gray-600 mt-1">
            Estos son los beneficios creados específicamente por este comercio
          </p>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Aquí se muestran únicamente los beneficios que ha creado este comercio, 
              no los beneficios de la asociación que están disponibles para este comercio.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XCircle className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Beneficios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBeneficios}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.beneficiosActivos}</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usos Totales</p>
                <p className="text-2xl font-bold text-purple-600">{stats.beneficiosUsados}</p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ahorro Total</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.ahorroTotal)}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar beneficios..."
              value={filtros.busqueda || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filtros avanzados */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={filtros.estado || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="vencido">Vencido</option>
                    <option value="agotado">Agotado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={filtros.categoria || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filtros.soloDestacados || false}
                      onChange={(e) => setFiltros(prev => ({ ...prev, soloDestacados: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Solo destacados</span>
                  </label>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => setFiltros({})}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lista de beneficios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {beneficiosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {beneficios.length === 0 ? 'No hay beneficios' : 'No se encontraron beneficios'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {beneficios.length === 0 
                ? 'Este comercio aún no ha creado beneficios.'
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {beneficiosFiltrados.map((beneficio) => (
              <motion.div
                key={beneficio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        {getTipoIcon(beneficio.tipo)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {beneficio.titulo}
                          </h3>
                          {beneficio.destacado && (
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{beneficio.descripcion}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-700 mr-2">Descuento:</span>
                          <span className="text-lg font-bold text-green-600">
                            {formatDescuento(beneficio)}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium mr-2">Categoría:</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {beneficio.categoria}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>
                            {beneficio.fechaInicio.toDate().toLocaleDateString()} - {beneficio.fechaFin.toDate().toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          <span>
                            {beneficio.usosActuales} usos
                            {beneficio.limiteTotal && ` / ${beneficio.limiteTotal}`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(beneficio.estado)}`}>
                            {getEstadoIcon(beneficio.estado)}
                            <span className="ml-1 capitalize">{beneficio.estado}</span>
                          </span>
                        </div>
                        {beneficio.limitePorSocio && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Límite por socio:</span> {beneficio.limitePorSocio}
                          </div>
                        )}
                      </div>
                    </div>

                    {beneficio.condiciones && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Condiciones:</span> {beneficio.condiciones}
                        </p>
                      </div>
                    )}

                    {beneficio.tags && beneficio.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {beneficio.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Resumen de filtros */}
      {beneficiosFiltrados.length !== beneficios.length && (
        <div className="text-center text-sm text-gray-600">
          Mostrando {beneficiosFiltrados.length} de {beneficios.length} beneficios
        </div>
      )}
    </div>
  );
};