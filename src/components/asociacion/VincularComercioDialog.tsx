'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  Search,
  Store,
  MapPin,
  Phone,
  Mail,
  Star,
  Check,
  AlertCircle,
  Filter,
  ChevronDown,
  Link,
  Eye,
  ArrowRight,
  Zap
} from 'lucide-react';
import { ComercioDisponible } from '@/services/adhesion.service';
import { CATEGORIAS_COMERCIO } from '@/types/comercio';
import { useDebounce } from '@/hooks/useDebounce';

interface VincularComercioDialogProps {
  open: boolean;
  onClose: () => void;
  onVincular: (comercioId: string) => Promise<boolean>;
  onBuscar: (termino: string) => Promise<ComercioDisponible[]>;
  loading: boolean;
}

export const VincularComercioDialog: React.FC<VincularComercioDialogProps> = ({
  open,
  onClose,
  onVincular,
  onBuscar,
  loading
}) => {
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [comercios, setComercios] = useState<ComercioDisponible[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [vinculando, setVinculando] = useState<string | null>(null);
  const [selectedComercio, setSelectedComercio] = useState<ComercioDisponible | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Buscar comercios con debounce
  const debouncedSearch = useDebounce(async (...args: unknown[]) => {
    const termino = args[0] as string;
    if (!termino?.trim()) {
      setComercios([]);
      return;
    }

    setSearchLoading(true);
    try {
      const resultados = await onBuscar(termino);
      setComercios(resultados);
    } catch (error) {
      console.error('Error searching comercios:', error);
    } finally {
      setSearchLoading(false);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  // Filtrar por categoría
  const comerciosFiltrados = selectedCategoria
    ? comercios.filter(comercio => comercio.categoria === selectedCategoria)
    : comercios;

  // Manejar vinculación
  const handleVincular = async (comercio: ComercioDisponible) => {
    setVinculando(comercio.id);
    try {
      const success = await onVincular(comercio.id);
      if (success) {
        handleClose();
      }
    } finally {
      setVinculando(null);
    }
  };

  // Reset al cerrar
  const handleClose = useCallback(() => {
    setSearchTerm('');
    setSelectedCategoria('');
    setComercios([]);
    setSelectedComercio(null);
    setShowFilters(false);
    onClose();
  }, [onClose]);

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header compacto */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Link className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Vincular Comercio</h2>
                      <p className="text-white/80 text-sm">
                        {comerciosFiltrados.length > 0 ? `${comerciosFiltrados.length} encontrados` : 'Busca comercios disponibles'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Búsqueda y filtros */}
                <div className="space-y-4 mb-6">
                  {/* Barra de búsqueda */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar comercios por nombre, email o categoría..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      autoFocus
                    />
                    {searchLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Filtros */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtros
                      <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {selectedCategoria && (
                      <button
                        onClick={() => setSelectedCategoria('')}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Limpiar filtro
                      </button>
                    )}
                  </div>

                  {/* Panel de filtros */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gray-50 rounded-xl p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Categoría
                            </label>
                            <select
                              value={selectedCategoria}
                              onChange={(e) => setSelectedCategoria(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            >
                              <option value="">Todas las categorías</option>
                              {CATEGORIAS_COMERCIO.map(categoria => (
                                <option key={categoria} value={categoria}>
                                  {categoria}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Búsqueda
                            </label>
                            <input
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              placeholder="Refinar búsqueda..."
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Resultados */}
                <div className="max-h-96 overflow-y-auto">
                  {!searchTerm ? (
                    <div className="text-center py-8">
                      <Search className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        Buscar comercios
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Ingresa un término para encontrar comercios disponibles
                      </p>
                    </div>
                  ) : comerciosFiltrados.length === 0 && !searchLoading ? (
                    <div className="text-center py-8">
                      <Store className="mx-auto h-12 w-12 text-gray-300" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No se encontraron comercios
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Intenta con otros términos de búsqueda
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comerciosFiltrados.map((comercio) => (
                        <motion.div
                          key={comercio.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              {/* Logo */}
                              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                {comercio.logoUrl ? (
                                  <Image
                                    src={comercio.logoUrl}
                                    alt={comercio.nombreComercio}
                                    width={48}
                                    height={48}
                                    className="w-full h-full rounded-lg object-cover"
                                  />
                                ) : (
                                  <Store className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="text-base font-semibold text-gray-900 truncate">
                                    {comercio.nombreComercio}
                                  </h4>
                                  {comercio.verificado && (
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                                
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    {comercio.categoria}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Mail className="w-3 h-3 mr-1 text-gray-400" />
                                    <span className="truncate">{comercio.email}</span>
                                  </div>
                                  {comercio.telefono && (
                                    <div className="flex items-center">
                                      <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                      <span>{comercio.telefono}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {comercio.direccion && (
                                  <div className="flex items-center text-sm text-gray-600 mt-1">
                                    <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                                    <span className="truncate">{comercio.direccion}</span>
                                  </div>
                                )}
                                
                                {/* Estado */}
                                <div className="mt-2">
                                  {comercio.asociacionesVinculadas.length > 0 ? (
                                    <div className="flex items-center text-amber-600 text-xs">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      <span>Ya vinculado ({comercio.asociacionesVinculadas.length})</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center text-green-600 text-xs">
                                      <Check className="w-3 h-3 mr-1" />
                                      <span>Disponible</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Botón de acción */}
                            <div className="ml-4 flex flex-col space-y-2">
                              <button
                                onClick={() => setSelectedComercio(comercio)}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Ver
                              </button>
                              <button
                                onClick={() => handleVincular(comercio)}
                                disabled={vinculando === comercio.id || loading}
                                className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 text-sm"
                              >
                                {vinculando === comercio.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                ) : (
                                  <Link className="w-3 h-3 mr-1" />
                                )}
                                {vinculando === comercio.id ? 'Vinculando...' : 'Vincular'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {comerciosFiltrados.length > 0 ? `${comerciosFiltrados.length} comercios encontrados` : 'Busca para ver resultados'}
                  </div>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      <AnimatePresence>
        {selectedComercio && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] overflow-y-auto"
          >
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header del detalle */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setSelectedComercio(null)}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4 text-white rotate-180" />
                      </button>
                      <div>
                        <h3 className="text-lg font-bold text-white">Detalles del Comercio</h3>
                        <p className="text-white/80 text-sm">Información completa</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedComercio(null)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Contenido del detalle */}
                <div className="p-6">
                  <div className="flex items-start space-x-6 mb-6">
                    {/* Logo */}
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                      {selectedComercio.logoUrl ? (
                        <Image
                          src={selectedComercio.logoUrl}
                          alt={selectedComercio.nombreComercio}
                          width={80}
                          height={80}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        <Store className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    
                    {/* Info principal */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h2 className="text-xl font-bold text-gray-900">
                          {selectedComercio.nombreComercio}
                        </h2>
                        {selectedComercio.verificado && (
                          <Check className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        {selectedComercio.categoria}
                      </span>
                    </div>
                  </div>
                  
                  {/* Información detallada */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{selectedComercio.email}</p>
                      </div>
                      {selectedComercio.telefono && (
                        <div>
                          <p className="text-sm text-gray-500">Teléfono</p>
                          <p className="font-medium text-gray-900">{selectedComercio.telefono}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {selectedComercio.direccion && (
                        <div>
                          <p className="text-sm text-gray-500">Dirección</p>
                          <p className="font-medium text-gray-900">{selectedComercio.direccion}</p>
                        </div>
                      )}
                      {selectedComercio.puntuacion > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Puntuación</p>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                            <span className="font-medium text-gray-900">
                              {selectedComercio.puntuacion.toFixed(1)} ({selectedComercio.totalReviews} reseñas)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Estado */}
                  <div className="mb-6">
                    {selectedComercio.asociacionesVinculadas.length > 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <div className="flex items-center text-amber-700">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            Ya vinculado a {selectedComercio.asociacionesVinculadas.length} asociación(es)
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <div className="flex items-center text-green-700">
                          <Check className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            Disponible para vinculación
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Botón de vinculación */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleVincular(selectedComercio)}
                      disabled={vinculando === selectedComercio.id || loading}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      {vinculando === selectedComercio.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Vinculando...
                        </>
                      ) : (
                        <>
                          <Link className="w-5 h-5 mr-2" />
                          Vincular Comercio
                          <Zap className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};