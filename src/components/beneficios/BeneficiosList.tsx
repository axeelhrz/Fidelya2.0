'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Calendar,
  Tag,
  Users,
  Building2,
  Star,
  Clock,
  Percent,
  DollarSign,
  Package,
  Eye,
  Heart,
  Share2,
  Search,
  SortAsc,
  SortDesc,
  Grid,
  List,
  RefreshCw
} from 'lucide-react';
import { Beneficio as BeneficioBase } from '@/types/beneficio';

type OrigenBeneficio = 'asociacion' | 'comercio_vinculado' | 'comercio_afiliado' | 'publico' | 'directo' | string;

interface Beneficio extends BeneficioBase {
  origenBeneficio?: OrigenBeneficio;
}
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BeneficiosListProps {
  beneficios: Beneficio[];
  loading?: boolean;
  userRole?: 'socio' | 'comercio' | 'asociacion';
  onUse?: (beneficioId: string, comercioId: string) => void;
  onEdit?: (beneficio: Beneficio) => void;
  onDelete?: (beneficioId: string) => void;
  onRefresh?: () => void;
  showFilters?: boolean;
}

type SortOption = 'fecha' | 'titulo' | 'descuento' | 'categoria' | 'vencimiento';
type ViewMode = 'grid' | 'list';

export const BeneficiosList: React.FC<BeneficiosListProps> = ({
  beneficios,
  loading = false,
  userRole = 'socio',
  onUse,
  onEdit,
  onRefresh,
  showFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('fecha');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Obtener categorías únicas
  const categories = Array.from(new Set(beneficios.map(b => b.categoria))).sort();

  // Filtrar y ordenar beneficios
  const filteredBeneficios = beneficios
    .filter(beneficio => {
      const matchesSearch = 
        beneficio.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficio.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        beneficio.comercioNombre.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || beneficio.categoria === selectedCategory;
      const matchesFavorites = !showOnlyFavorites || favorites.has(beneficio.id);
      
      return matchesSearch && matchesCategory && matchesFavorites;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'fecha':
          comparison = a.creadoEn.toDate().getTime() - b.creadoEn.toDate().getTime();
          break;
        case 'titulo':
          comparison = a.titulo.localeCompare(b.titulo);
          break;
        case 'descuento':
          comparison = a.descuento - b.descuento;
          break;
        case 'categoria':
          comparison = a.categoria.localeCompare(b.categoria);
          break;
        case 'vencimiento':
          comparison = a.fechaFin.toDate().getTime() - b.fechaFin.toDate().getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleFavorite = (beneficioId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(beneficioId)) {
      newFavorites.delete(beneficioId);
    }
    setFavorites(newFavorites);
  };

  const getOrigenIcon = (beneficio: Beneficio) => {
    const origen = beneficio.origenBeneficio;
    
    switch (origen) {
      case 'asociacion':
        return (
          <Users className="w-4 h-4 text-purple-600">
            <title>Beneficio de tu asociación</title>
          </Users>
        );
      case 'comercio_vinculado':
        return (
          <span className="inline-flex items-center">
            <Building2 className="w-4 h-4 text-blue-600" />
            <title>Comercio vinculado a tu asociación</title>
          </span>
        );
      case 'comercio_afiliado':
        return (
          <Building2 className="w-4 h-4 text-green-600">
            <title>Comercio afiliado</title>
          </Building2>
        );
      case 'publico':
        return (
          <Gift className="w-4 h-4 text-orange-600">
            <title>Beneficio público</title>
          </Gift>
        );
      case 'directo':
        return (
          <Star className="w-4 h-4 text-yellow-600">
            <title>Acceso directo</title>
          </Star>
        );
      default:
        return <Gift className="w-4 h-4 text-gray-600" />;
    }
  };

  const getOrigenLabel = (beneficio: Beneficio) => {
    const origen = beneficio.origenBeneficio;
    
    switch (origen) {
      case 'asociacion':
        return 'Tu Asociación';
      case 'comercio_vinculado':
        return 'Comercio Vinculado';
      case 'comercio_afiliado':
        return 'Comercio Afiliado';
      case 'publico':
        return 'Público';
      case 'directo':
        return 'Acceso Directo';
      default:
        return 'Disponible';
    }
  };

  const getOrigenColor = (beneficio: Beneficio) => {
    const origen = beneficio.origenBeneficio;
    
    switch (origen) {
      case 'asociacion':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'comercio_vinculado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'comercio_afiliado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'publico':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'directo':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderBeneficioCard = (beneficio: Beneficio, index: number) => {
    const diasRestantes = Math.ceil(
      (beneficio.fechaFin.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const isFavorite = favorites.has(beneficio.id);

    return (
      <motion.div
        key={beneficio.id}
        className="bg-white rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        whileHover={{ y: -4 }}
      >
        {/* Header del beneficio */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              {beneficio.destacado && (
                <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
                  <Star className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
                <Gift className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleFavorite(beneficio.id)}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              
              <button className="p-2 bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-blue-500 rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Origen del beneficio */}
          <div className="flex items-center justify-between mb-3">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getOrigenColor(beneficio)}`}>
              {getOrigenIcon(beneficio)}
              <span className="ml-1">{getOrigenLabel(beneficio)}</span>
            </div>
            
            {diasRestantes <= 7 && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                <Clock className="w-3 h-3 mr-1" />
                {diasRestantes === 1 ? 'Último día' : `${diasRestantes} días`}
              </div>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-600 transition-colors">
            {beneficio.titulo}
          </h3>
          
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">
            {beneficio.descripcion}
          </p>

          {/* Información del descuento */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {beneficio.tipo === 'porcentaje' && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Percent className="w-5 h-5" />
                  <span className="text-2xl font-bold">{beneficio.descuento}%</span>
                  <span className="text-sm">OFF</span>
                </div>
              )}
              
              {beneficio.tipo === 'monto_fijo' && (
                <div className="flex items-center space-x-1 text-green-600">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-2xl font-bold">${beneficio.descuento}</span>
                  <span className="text-sm">OFF</span>
                </div>
              )}
              
              {beneficio.tipo === 'producto_gratis' && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Package className="w-5 h-5" />
                  <span className="text-lg font-bold">GRATIS</span>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-sm text-slate-500">en</div>
              <div className="font-semibold text-slate-900">{beneficio.comercioNombre}</div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Tag className="w-4 h-4" />
                <span>{beneficio.categoria}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Hasta {format(beneficio.fechaFin.toDate(), 'dd/MM', { locale: es })}</span>
              </div>
            </div>
            
            {beneficio.limiteTotal && (
              <div className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                {beneficio.usosActuales}/{beneficio.limiteTotal} usos
              </div>
            )}
          </div>

          {/* Condiciones */}
          {beneficio.condiciones && (
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-600">{beneficio.condiciones}</p>
            </div>
          )}

          {/* Tags */}
          {beneficio.tags && beneficio.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {beneficio.tags.slice(0, 3).map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
              {beneficio.tags.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{beneficio.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-slate-500">
              <Eye className="w-4 h-4" />
              <span>{beneficio.usosActuales || 0} usos</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {userRole === 'socio' && onUse && (
                <Button
                  onClick={() => onUse(beneficio.id, beneficio.comercioId)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Usar Beneficio
                </Button>
              )}
              
              {(userRole === 'comercio' || userRole === 'asociacion') && onEdit && (
                <Button
                  variant="outline"
                  onClick={() => onEdit(beneficio)}
                  className="px-4 py-2 rounded-xl"
                >
                  Editar
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton de filtros */}
        {showFilters && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="flex space-x-4">
                <div className="h-10 bg-slate-200 rounded-lg flex-1"></div>
                <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
                <div className="h-10 bg-slate-200 rounded-lg w-32"></div>
              </div>
            </div>
          </div>
        )}
        
        {/* Skeleton de beneficios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mt-2"></div>
                  </div>
                </div>
                <div className="h-20 bg-slate-200 rounded-lg"></div>
                <div className="flex justify-between">
                  <div className="h-8 bg-slate-200 rounded w-20"></div>
                  <div className="h-8 bg-slate-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros y controles */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Filtros y Búsqueda
            </h2>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid className="w-5 h-5" />}
              </button>
              
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar beneficios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todas las categorías</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Ordenar por */}
            <div className="flex items-center space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="fecha">Fecha</option>
                <option value="titulo">Título</option>
                <option value="descuento">Descuento</option>
                <option value="categoria">Categoría</option>
                <option value="vencimiento">Vencimiento</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {sortOrder === 'asc' ? <SortAsc className="w-5 h-5" /> : <SortDesc className="w-5 h-5" />}
              </button>
            </div>

            {/* Filtros adicionales */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  showOnlyFavorites 
                    ? 'bg-red-50 border-red-200 text-red-700' 
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${showOnlyFavorites ? 'fill-current' : ''}`} />
                <span className="text-sm">Favoritos</span>
              </button>
            </div>
          </div>

          {/* Información de resultados */}
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>
              Mostrando {filteredBeneficios.length} de {beneficios.length} beneficios
            </span>
            
            {(searchTerm || selectedCategory || showOnlyFavorites) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setShowOnlyFavorites(false);
                }}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de beneficios */}
      {filteredBeneficios.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Gift className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchTerm || selectedCategory || showOnlyFavorites 
              ? 'No se encontraron beneficios' 
              : 'No hay beneficios disponibles'
            }
          </h3>
          <p className="text-slate-500 mb-4">
            {searchTerm || selectedCategory || showOnlyFavorites
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Los beneficios aparecerán aquí cuando estén disponibles'
            }
          </p>
          {(searchTerm || selectedCategory || showOnlyFavorites) && (
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
                setShowOnlyFavorites(false);
              }}
              variant="outline"
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          <AnimatePresence>
            {filteredBeneficios.map((beneficio, index) => 
              viewMode === 'grid' 
                ? renderBeneficioCard(beneficio, index)
                : renderBeneficioListItem(beneficio, index)
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Información adicional para socios */}
      {userRole === 'socio' && beneficios.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Sobre tus beneficios disponibles
              </h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• <strong>Asociación:</strong> Beneficios exclusivos de tu asociación</p>
                <p>• <strong>Comercios Vinculados:</strong> Ofertas de comercios afiliados a tu asociación</p>
                <p>• <strong>Públicos:</strong> Beneficios disponibles para todos los usuarios</p>
                <p>• <strong>Acceso Directo:</strong> Ofertas especiales sin restricciones</p>
              </div>
              <div className="mt-3 text-xs text-blue-600">
                💡 Los beneficios se actualizan automáticamente según tu membresía y afiliaciones
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function renderBeneficioListItem(beneficio: Beneficio, index: number) {
    const diasRestantes = Math.ceil(
      (beneficio.fechaFin.toDate().getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const isFavorite = favorites.has(beneficio.id);

    return (
      <motion.div
        key={beneficio.id}
        className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.02 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Icono y origen */}
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
                <Gift className="w-5 h-5 text-white" />
              </div>
              {beneficio.destacado && (
                <div className="p-1 bg-yellow-400 rounded-lg">
                  <Star className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Información principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-slate-900 truncate">{beneficio.titulo}</h3>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getOrigenColor(beneficio)}`}>
                  {getOrigenIcon(beneficio)}
                  <span className="ml-1">{getOrigenLabel(beneficio)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-slate-500">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-4 h-4" />
                  <span>{beneficio.comercioNombre}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Tag className="w-4 h-4" />
                  <span>{beneficio.categoria}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Hasta {format(beneficio.fechaFin.toDate(), 'dd/MM', { locale: es })}</span>
                </span>
              </div>
            </div>

            {/* Descuento */}
            <div className="text-right">
              {beneficio.tipo === 'porcentaje' && (
                <div className="text-2xl font-bold text-green-600">
                  {beneficio.descuento}% OFF
                </div>
              )}
              {beneficio.tipo === 'monto_fijo' && (
                <div className="text-2xl font-bold text-green-600">
                  ${beneficio.descuento} OFF
                </div>
              )}
              {beneficio.tipo === 'producto_gratis' && (
                <div className="text-lg font-bold text-green-600">
                  GRATIS
                </div>
              )}
              
              {diasRestantes <= 7 && (
                <div className="text-xs text-red-600 mt-1">
                  {diasRestantes === 1 ? 'Último día' : `${diasRestantes} días`}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => toggleFavorite(beneficio.id)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite 
                  ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            {userRole === 'socio' && onUse && (
              <Button
                onClick={() => onUse(beneficio.id, beneficio.comercioId)}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Usar
              </Button>
            )}
            
            {(userRole === 'comercio' || userRole === 'asociacion') && onEdit && (
              <Button
                variant="outline"
                onClick={() => onEdit(beneficio)}
                className="px-4 py-2 rounded-lg"
              >
                Editar
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }
};
