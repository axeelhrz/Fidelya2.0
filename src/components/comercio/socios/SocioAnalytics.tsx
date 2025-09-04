'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Users,
  DollarSign,
  Target,
  Heart,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Diamond,
  UserPlus,
  Receipt,
  Search,
  Filter,
  Download,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  List,
  Grid,
  User,
  Sparkles,
  Plus,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClientes } from '@/hooks/useClientes';
import { useComercio } from '@/hooks/useComercio';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

// Componente de métrica avanzada mejorado
const AdvancedMetricCard: React.FC<{
  title: string;
  value: string | number;
  previousValue?: number;
  icon: React.ReactNode;
  color: string;
  format?: 'number' | 'currency' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  onClick?: () => void;
  loading?: boolean;
}> = ({ 
  title, 
  value, 
  previousValue, 
  icon, 
  color, 
  format = 'number', 
  subtitle,
  onClick,
  loading = false
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  const calculateChange = () => {
    if (typeof value !== 'number' || !previousValue) return null;
    const change = ((value - previousValue) / previousValue) * 100;
    return change;
  };

  const change = calculateChange();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div className="w-16 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        
        {change !== null && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
            change >= 0 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mb-1">
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
};

// Componente de estado de carga mejorado
const LoadingState: React.FC<{ message?: string }> = ({ message = "Cargando socios..." }) => (
  <div className="flex flex-col items-center justify-center py-16 space-y-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-400 rounded-full"
      />
    </div>
    <div className="text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-600">Por favor espera un momento...</p>
    </div>
  </div>
);

// Componente de estado vacío mejorado
const EmptyState: React.FC<{ onCreateSocio: () => void }> = ({ onCreateSocio }) => (
  <div className="text-center py-16">
    <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-br from-purple-100 to-violet-200 rounded-3xl flex items-center justify-center">
      <Users className="w-10 h-10 text-purple-500" />
    </div>
    <h3 className="text-2xl font-bold text-slate-900 mb-3">
      No hay socios registrados
    </h3>
    <p className="text-slate-600 mb-8 max-w-md mx-auto">
      Comienza agregando tu primer socio para gestionar sus perfiles y analizar su comportamiento
    </p>
    <Button
      leftIcon={<UserPlus size={16} />}
      onClick={onCreateSocio}
      className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-500/30"
    >
      Agregar Primer Socio
    </Button>
  </div>
);

// Componente de tarjeta de socio CON botón de eliminar
const SocioCard: React.FC<{
  cliente: Cliente;
  onDelete: (cliente: Cliente) => void;
}> = ({ cliente, onDelete }) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'text-emerald-600 bg-emerald-100 border-emerald-200';
      case 'inactivo': return 'text-slate-600 bg-slate-100 border-slate-200';
      case 'suspendido': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo': return <CheckCircle size={14} />;
      case 'inactivo': return <Pause size={14} />;
      case 'suspendido': return <XCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative group"
    >
      {/* Botón de eliminar - aparece en hover */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(cliente);
        }}
        className="absolute top-4 right-4 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-10"
        title="Eliminar socio"
      >
        <Trash2 size={14} />
      </motion.button>

      {/* Avatar y información básica */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
            {cliente.avatar ? (
              <Image
                src={cliente.avatar}
                alt={cliente.nombre}
                className="w-full h-full object-cover"
                width={64}
                height={64}
              />
            ) : (
              <User size={24} className="text-slate-400" />
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
            cliente.estado === 'activo' ? 'bg-emerald-500' : 
            cliente.estado === 'suspendido' ? 'bg-red-500' : 'bg-slate-500'
          }`}>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        <div className="flex-1 min-w-0 pr-8">
          <h3 className="text-lg font-bold text-slate-900 truncate">
            {cliente.nombre}
          </h3>
          <p className="text-sm text-slate-600 truncate">{cliente.email}</p>
          {cliente.dni && (
            <p className="text-xs text-slate-500 truncate">DNI: {cliente.dni}</p>
          )}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getEstadoColor(cliente.estado)}`}>
            {getEstadoIcon(cliente.estado)}
            {cliente.estado.charAt(0).toUpperCase() + cliente.estado.slice(1)}
          </div>
        </div>
      </div>

      {/* Información de contacto */}
      <div className="space-y-2 mb-4">
        {cliente.telefono && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone size={14} />
            <span>{cliente.telefono}</span>
          </div>
        )}
        {cliente.direccion && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin size={14} />
            <span className="truncate">{cliente.direccion}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar size={14} />
          <span>Socio desde {format(cliente.creadoEn.toDate(), 'MMM yyyy', { locale: es })}</span>
        </div>
      </div>

      {/* Tags */}
      {cliente.tags && cliente.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1">
          {cliente.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
          {cliente.tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 bg-slate-50 text-slate-500 text-xs rounded-full">
              +{cliente.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

// Componente principal mejorado
export function SocioAnalytics() {
  const {
    clientes,
    loading,
    error,
    hasMore,
    total,
    stats: clienteStats,
    loadClientes,
    loadMoreClientes,
    createCliente,
    deleteCliente,
    searchClientes,
    exportData,
    filtros,
    setFiltros,
    clearFiltros,
    refreshStats
  } = useClientes();

  // Hook del comercio para actualizar las estadísticas principales
  const { loadStats: loadComercioStats } = useComercio();

  // Estados para analíticas
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'socios'>('socios');

  // Estados para gestión de socios
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: '',
    email: '',
    telefono: '',
    dni: '',
    direccion: '',
    fechaNacimiento: '',
    notas: '',
    tags: [],
    configuracion: {
      recibirNotificaciones: true,
      recibirPromociones: true,
      recibirEmail: true,
      recibirSMS: false,
    },
  });

  // Función para actualizar las estadísticas del dashboard principal
  const updateDashboardStats = useCallback(async () => {
    try {
      await refreshStats();
      await loadComercioStats();
    } catch (error) {
      console.error('Error updating dashboard stats:', error);
    }
  }, [refreshStats, loadComercioStats]);

  // Función para forzar recarga completa
  const forceReload = useCallback(async () => {
    try {
      clearFiltros();
      await loadClientes();
      await updateDashboardStats();
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('Error en recarga completa:', error);
      toast.error('Error al actualizar los datos');
    }
  }, [loadClientes, updateDashboardStats, clearFiltros]);

  // Funciones para gestión de socios
  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      dni: '',
      direccion: '',
      fechaNacimiento: '',
      notas: '',
      tags: [],
      configuracion: {
        recibirNotificaciones: true,
        recibirPromociones: true,
        recibirEmail: true,
        recibirSMS: false,
      },
    });
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.length >= 2) {
      try {
        const results = await searchClientes(term);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching:', error);
      }
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }
  };

  const handleCreateSocio = async () => {
    try {
      const socioId = await createCliente(formData);
      
      if (socioId) {
        setShowCreateModal(false);
        resetForm();
        toast.success('Socio creado exitosamente');
        
        await loadClientes();
        await updateDashboardStats();
      }
    } catch (error) {
      console.error('Error creating socio:', error);
      toast.error('Error al crear el socio. Inténtalo de nuevo.');
    }
  };

  // Función para manejar la eliminación desde la tarjeta
  const handleDeleteFromCard = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setShowDeleteModal(true);
  };

  const handleDeleteSocio = async () => {
    if (!selectedCliente) return;

    try {
      const success = await deleteCliente(selectedCliente.id);
      if (success) {
        setShowDeleteModal(false);
        setSelectedCliente(null);
        toast.success('Socio eliminado exitosamente');
        
        await loadClientes();
        await updateDashboardStats();
      }
    } catch (error) {
      console.error('Error deleting socio:', error);
      toast.error('Error al eliminar el socio. Inténtalo de nuevo.');
    }
  };

  // Calcular métricas avanzadas basadas en datos reales
  const advancedMetrics = useMemo(() => {
    if (!clienteStats || !clientes.length) return null;

    const totalSocios = clienteStats.totalClientes;
    const sociosNuevos = clienteStats.clientesNuevos;
    const sociosActivos = clienteStats.clientesActivos;
    const sociosConCompras = clientes.filter(c => (c.totalCompras || 0) > 0).length;
    
    const totalGastado = clientes.reduce((sum, c) => sum + (c.montoTotalGastado || 0), 0);
    const totalCompras = clientes.reduce((sum, c) => sum + (c.totalCompras || 0), 0);
    const totalBeneficios = clientes.reduce((sum, c) => sum + (c.beneficiosUsados || 0), 0);
    
    const promedioGastoPorSocio = totalSocios > 0 ? totalGastado / totalSocios : 0;
    const promedioComprasPorSocio = totalSocios > 0 ? totalCompras / totalSocios : 0;
    const tasaConversion = totalSocios > 0 ? (sociosConCompras / totalSocios) * 100 : 0;
    const tasaRetencion = totalSocios > 0 ? (sociosActivos / totalSocios) * 100 : 0;
    
    const ticketPromedio = totalCompras > 0 ? totalGastado / totalCompras : 0;
    const clv = clienteStats.valorVidaPromedio || 0;
    const frecuenciaPromedio = clientes.length > 0 
      ? clientes.reduce((sum, c) => sum + (c.frecuenciaVisitas || 0), 0) / clientes.length 
      : 0;

    return {
      totalSocios,
      sociosNuevos,
      sociosActivos,
      sociosConCompras,
      totalGastado,
      totalCompras,
      totalBeneficios,
      promedioGastoPorSocio,
      promedioComprasPorSocio,
      tasaConversion,
      tasaRetencion,
      ticketPromedio,
      clv,
      frecuenciaPromedio,
      crecimientoMensual: clienteStats.crecimientoMensual || 0,
    };
  }, [clientes, timeRange, clienteStats]);

  // Cargar datos iniciales
  useEffect(() => {
    updateDashboardStats();
  }, [updateDashboardStats]);

  // Mostrar estado de carga inicial
  if (loading && clientes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <AdvancedMetricCard
              key={i}
              title=""
              value={0}
              icon={<Users size={20} />}
              color="#3b82f6"
              loading={true}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-purple-600" size={28} />
            Gestión de Socios
          </h2>
          <p className="text-gray-600 mt-1">
            Gestiona y analiza a tus socios de manera eficiente
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tabs mejorados */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('socios')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'socios'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Socios ({total})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Analíticas
            </button>
          </div>

          {/* Botón de recarga */}
          <Button
            variant="outline"
            leftIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            onClick={forceReload}
            disabled={loading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {loading ? 'Cargando...' : 'Recargar'}
          </Button>
        </div>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <div>
            <h3 className="font-medium text-red-800">Error al cargar socios</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={forceReload}
              className="mt-2 text-red-700 underline hover:no-underline"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}

      {/* Contenido según tab activo */}
      {activeTab === 'socios' && (
        <>
          {/* Barra de búsqueda y filtros mejorada */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              {/* Search mejorado - ACTUALIZADO PARA INCLUIR DNI */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar socios por nombre, email, teléfono o DNI..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
                />

                {/* Resultados de búsqueda */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-80 overflow-y-auto z-[99999]"
                    >
                      {searchResults.map((cliente) => (
                        <div
                          key={cliente.id}
                          className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                              {cliente.avatar ? (
                                <Image
                                  src={cliente.avatar}
                                  alt={cliente.nombre}
                                  className="w-full h-full object-cover rounded-full"
                                  width={40}
                                  height={40}
                                />
                              ) : (
                                <User size={18} className="text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900">{cliente.nombre}</p>
                              <p className="text-sm text-slate-500">{cliente.email}</p>
                              {cliente.dni && (
                                <p className="text-xs text-slate-400">DNI: {cliente.dni}</p>
                              )}
                            </div>
                            <div className="text-sm text-slate-400">
                              ${(cliente.montoTotalGastado || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons mejorados */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 py-4 rounded-2xl border transition-all ${
                    showFilters 
                      ? 'bg-purple-50 border-purple-200 text-purple-700' 
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
                
                <button
                  onClick={exportData}
                  className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-4 rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>

                {/* Botón principal de crear socio mejorado */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-4 rounded-2xl hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg shadow-purple-500/30 group"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                  Nuevo Socio
                  <Sparkles size={14} className="text-yellow-300" />
                </button>

                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Grid size={16} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Panel de filtros */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-200 pt-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estado
                      </label>
                      <select
                        value={filtros.estado || ''}
                        onChange={(e) => setFiltros({
                          ...filtros,
                          estado: e.target.value as 'activo' | 'inactivo' | 'suspendido' | undefined
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Todos los estados</option>
                        <option value="activo">Activo</option>
                        <option value="inactivo">Inactivo</option>
                        <option value="suspendido">Suspendido</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha desde
                      </label>
                      <input
                        type="date"
                        value={filtros.fechaDesde ? format(filtros.fechaDesde, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFiltros({
                          ...filtros,
                          fechaDesde: e.target.value ? new Date(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Fecha hasta
                      </label>
                      <input
                        type="date"
                        value={filtros.fechaHasta ? format(filtros.fechaHasta, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFiltros({
                          ...filtros,
                          fechaHasta: e.target.value ? new Date(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={clearFiltros}
                        className="w-full px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className="text-sm text-slate-600">
                      {clientes.length} socio{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lista de socios */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {error && (
              <div className="p-6 bg-red-50 border-b border-red-200 flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <div>
                  <h3 className="font-medium text-red-800">Error al cargar socios</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Mostrar loading state */}
            {loading && clientes.length === 0 ? (
              <LoadingState message="Cargando lista de socios..." />
            ) : clientes.length === 0 && !loading ? (
              <EmptyState onCreateSocio={() => setShowCreateModal(true)} />
            ) : (
              <div className="p-8">
                <div className={`grid gap-8 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1'
                }`}>
                  {clientes.map((cliente) => (
                    <SocioCard
                      key={cliente.id}
                      cliente={cliente}
                      onDelete={handleDeleteFromCard}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center mt-10">
                    <Button
                      variant="outline"
                      onClick={loadMoreClientes}
                      loading={loading}
                      className="px-8 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Cargar más socios
                    </Button>
                  </div>
                )}

                {/* Pagination Info */}
                <div className="text-center text-sm text-slate-500 mt-6">
                  Mostrando {clientes.length} de {total} socios
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'analytics' && (
        <>
          {/* Controles de analíticas */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="90d">Últimos 90 días</option>
                <option value="1y">Último año</option>
              </select>
              
              <Button
                variant="outline"
                leftIcon={showAdvanced ? <EyeOff size={16} /> : <Eye size={16} />}
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Vista Simple' : 'Vista Avanzada'}
              </Button>
            </div>
          </div>

          {/* Métricas principales con datos reales */}
          {advancedMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdvancedMetricCard
                title="Total Socios"
                value={advancedMetrics.totalSocios}
                icon={<Users size={20} />}
                color="#3b82f6"
                subtitle={`${advancedMetrics.sociosActivos} activos`}
                onClick={() => setActiveTab('socios')}
              />
              
              <AdvancedMetricCard
                title="Socios Nuevos"
                value={advancedMetrics.sociosNuevos}
                icon={<UserPlus size={20} />}
                color="#10b981"
                subtitle={`En ${timeRange === '7d' ? '7 días' : timeRange === '30d' ? '30 días' : timeRange === '90d' ? '90 días' : '1 año'}`}
              />
              
              <AdvancedMetricCard
                title="Ingresos Totales"
                value={advancedMetrics.totalGastado}
                icon={<DollarSign size={20} />}
                color="#8b5cf6"
                format="currency"
                subtitle={`${advancedMetrics.totalCompras} compras`}
              />
              
              <AdvancedMetricCard
                title="Ticket Promedio"
                value={advancedMetrics.ticketPromedio}
                icon={<Receipt size={20} />}
                color="#f59e0b"
                format="currency"
                subtitle="Por transacción"
              />
              
              {showAdvanced && (
                <>
                  <AdvancedMetricCard
                    title="Valor Vida Socio"
                    value={advancedMetrics.clv}
                    icon={<Diamond size={20} />}
                    color="#ec4899"
                    format="currency"
                    subtitle="CLV estimado"
                  />
                  
                  <AdvancedMetricCard
                    title="Tasa de Conversión"
                    value={advancedMetrics.tasaConversion}
                    icon={<Target size={20} />}
                    color="#06b6d4"
                    format="percentage"
                    subtitle="Socios que compraron"
                  />
                  
                  <AdvancedMetricCard
                    title="Tasa de Retención"
                    value={advancedMetrics.tasaRetencion}
                    icon={<Heart size={20} />}
                    color="#ef4444"
                    format="percentage"
                    subtitle="Socios activos"
                  />
                  
                  <AdvancedMetricCard
                    title="Crecimiento Mensual"
                    value={advancedMetrics.crecimientoMensual}
                    icon={<TrendingUp size={20} />}
                    color="#84cc16"
                    format="percentage"
                    subtitle="Crecimiento de la base"
                  />
                </>
              )}
            </div>
          )}

          {/* Gráficos y análisis adicionales - SIN RESUMEN FINANCIERO */}
          {advancedMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
              {/* Solo distribución por estado */}
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <Activity className="text-blue-600" size={24} />
                  Distribución por Estado
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                      <span className="font-medium text-slate-700">Activos</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600">{advancedMetrics.sociosActivos}</div>
                      <div className="text-sm text-slate-500">
                        {advancedMetrics.totalSocios > 0 ? ((advancedMetrics.sociosActivos / advancedMetrics.totalSocios) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-slate-500 rounded-full"></div>
                      <span className="font-medium text-slate-700">Inactivos</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-slate-600">
                        {advancedMetrics.totalSocios - advancedMetrics.sociosActivos}
                      </div>
                      <div className="text-sm text-slate-500">
                        {advancedMetrics.totalSocios > 0 ? (((advancedMetrics.totalSocios - advancedMetrics.sociosActivos) / advancedMetrics.totalSocios) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-slate-700">Con Compras</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{advancedMetrics.sociosConCompras}</div>
                      <div className="text-sm text-slate-500">
                        {advancedMetrics.totalSocios > 0 ? ((advancedMetrics.sociosConCompras / advancedMetrics.totalSocios) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modales */}
      
      {/* Modal de crear socio */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <UserPlus size={24} className="text-purple-600" />
              Crear Nuevo Socio
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              label="Nombre completo *"
              value={formData.nombre}
              onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre completo del socio"
              required
            />

            <Input
              label="Email *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@ejemplo.com"
              required
            />

            <Input
              label="Teléfono"
              value={formData.telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              placeholder="+54 9 11 1234-5678"
            />

            <Input
              label="DNI"
              value={formData.dni}
              onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
              placeholder="12345678"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSocio}
              loading={loading}
              disabled={!formData.nombre || !formData.email}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white"
            >
              <UserPlus size={16} className="mr-2" />
              Crear Socio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de eliminar socio */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <Trash2 size={24} />
              Eliminar Socio
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-medium text-red-800">
                  ¿Estás seguro de que deseas eliminar este socio?
                </p>
                <p className="text-red-600 text-sm mt-1">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {selectedCliente && (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                    <User size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{selectedCliente.nombre}</h4>
                    <p className="text-slate-600">{selectedCliente.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteSocio}
              loading={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 size={16} className="mr-2" />
              Eliminar Socio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SocioAnalytics;

