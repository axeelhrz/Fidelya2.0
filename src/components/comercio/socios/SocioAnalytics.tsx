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
  Edit3,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  MoreVertical,
  Tag,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  List,
  Grid,
  User,
  ShoppingBag,
  Gift,
  Bell,
  Mail,
  MessageSquare,
  Sparkles,
  Plus,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClientes } from '@/hooks/useClientes';
import { useComercio } from '@/hooks/useComercio';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { QuickClienteCreator } from '../clientes/QuickClienteCreator';
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

// Componente de tarjeta de socio mejorado
const SocioCard: React.FC<{
  cliente: Cliente;
  onSelect: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  onDelete: (cliente: Cliente) => void;
  onToggleEstado: (cliente: Cliente) => void;
}> = ({ cliente, onSelect, onEdit, onDelete, onToggleEstado }) => {
  const [showActions, setShowActions] = useState(false);

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
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.1)' }}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all duration-200 relative"
    >
      {/* Menú de acciones mejorado */}
      <div className="absolute top-4 right-4">
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-[999999] overflow-hidden"
              >
                <button
                  onClick={() => {
                    onSelect(cliente);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Eye size={14} />
                  Ver detalles
                </button>
                <button
                  onClick={() => {
                    onEdit(cliente);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Edit3 size={14} />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onToggleEstado(cliente);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  {cliente.estado === 'activo' ? <Pause size={14} /> : <Play size={14} />}
                  {cliente.estado === 'activo' ? 'Desactivar' : 'Activar'}
                </button>
                <hr className="my-2" />
                <button
                  onClick={() => {
                    onDelete(cliente);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 truncate">
            {cliente.nombre}
          </h3>
          <p className="text-sm text-slate-600 truncate">{cliente.email}</p>
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

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {cliente.totalCompras || 0}
          </div>
          <div className="text-xs text-slate-500">Compras</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">
            ${(cliente.montoTotalGastado || 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500">Total gastado</div>
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

      {/* Botón de acción principal */}
      <div className="mt-4">
        <Button
          variant="outline"
          fullWidth
          onClick={() => onSelect(cliente)}
          className="justify-center border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          Ver Perfil Completo
        </Button>
      </div>
    </motion.div>
  );
};

// Componente principal mejorado con métricas funcionales
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
    selectCliente,
    createCliente,
    updateCliente,
    deleteCliente,
    updateEstadoCliente,
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  // Función para actualizar las estadísticas del dashboard principal - CORREGIDA
  const updateDashboardStats = useCallback(async () => {
    try {
      console.log('🔄 Actualizando estadísticas del dashboard...');
      
      // Actualizar en secuencia para asegurar consistencia
      await refreshStats();
      console.log('✅ Stats de socios actualizadas');
      
      await loadComercioStats();
      console.log('✅ Stats de comercio actualizadas');
      
      console.log('✅ Todas las estadísticas actualizadas correctamente');
    } catch (error) {
      console.error('❌ Error updating dashboard stats:', error);
    }
  }, [refreshStats, loadComercioStats]);

  // Funciones para gestión de socios - CORREGIDAS
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

  const handleSelectCliente = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    await selectCliente(cliente.id);
    setShowDetailModal(true);
    setShowSearchResults(false);
  };

  // FUNCIÓN CORREGIDA - handleCreateSocio
  const handleCreateSocio = async () => {
    try {
      console.log('🚀 Creando nuevo socio con datos:', formData);
      
      const socioId = await createCliente(formData);
      console.log('📝 Socio creado con ID:', socioId);
      
      if (socioId) {
        setShowCreateModal(false);
        resetForm();
        toast.success('Socio creado exitosamente');
        
        console.log('🔄 Iniciando actualización completa...');
        
        // CRÍTICO: Forzar recarga completa en secuencia
        await loadClientes();
        console.log('✅ Lista de socios recargada');
        
        await updateDashboardStats();
        console.log('✅ Dashboard actualizado');
        
        console.log('✅ Proceso de creación completado');
      }
    } catch (error) {
      console.error('❌ Error creating socio:', error);
      toast.error('Error al crear el socio. Inténtalo de nuevo.');
    }
  };

  // FUNCIÓN CORREGIDA - handleEditSocio
  const handleEditSocio = async () => {
    if (!selectedCliente) return;

    try {
      console.log('🔄 Actualizando socio:', selectedCliente.id);
      
      const success = await updateCliente(selectedCliente.id, formData);
      if (success) {
        setShowEditModal(false);
        resetForm();
        toast.success('Socio actualizado exitosamente');
        
        // CRÍTICO: Actualizar todo en secuencia
        await loadClientes();
        await updateDashboardStats();
        
        console.log('✅ Socio actualizado correctamente');
      }
    } catch (error) {
      console.error('❌ Error updating socio:', error);
      toast.error('Error al actualizar el socio. Inténtalo de nuevo.');
    }
  };

  // FUNCIÓN CORREGIDA - handleDeleteSocio
  const handleDeleteSocio = async () => {
    if (!selectedCliente) return;

    try {
      console.log('🗑️ Eliminando socio:', selectedCliente.id);
      
      const success = await deleteCliente(selectedCliente.id);
      if (success) {
        setShowDeleteModal(false);
        setSelectedCliente(null);
        toast.success('Socio eliminado exitosamente');
        
        // CRÍTICO: Actualizar todo en secuencia
        await loadClientes();
        await updateDashboardStats();
        
        console.log('✅ Socio eliminado correctamente');
      }
    } catch (error) {
      console.error('❌ Error deleting socio:', error);
      toast.error('Error al eliminar el socio. Inténtalo de nuevo.');
    }
  };

  const handleToggleEstado = async (cliente: Cliente) => {
    const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      console.log('🔄 Cambiando estado del socio:', cliente.id, 'a', nuevoEstado);
      
      await updateEstadoCliente(cliente.id, nuevoEstado);
      toast.success(`Socio ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'} exitosamente`);
      
      // CRÍTICO: Actualizar todo en secuencia
      await loadClientes();
      await updateDashboardStats();
      
      console.log('✅ Estado del socio actualizado');
    } catch (error) {
      console.error('❌ Error updating estado:', error);
      toast.error('Error al cambiar el estado del socio. Inténtalo de nuevo.');
    }
  };

  const openEditModal = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono || '',
      dni: cliente.dni || '',
      direccion: cliente.direccion || '',
      fechaNacimiento: cliente.fechaNacimiento 
        ? format(cliente.fechaNacimiento.toDate(), 'yyyy-MM-dd')
        : '',
      notas: cliente.notas || '',
      tags: cliente.tags || [],
      configuracion: cliente.configuracion,
    });
    setShowEditModal(true);
  };

  // Calcular métricas avanzadas basadas en datos reales
  const advancedMetrics = useMemo(() => {
    if (!clienteStats || !clientes.length) return null;

    // Usar estadísticas reales del servicio
    const totalSocios = clienteStats.totalClientes;
    const sociosNuevos = clienteStats.clientesNuevos;
    const sociosActivos = clienteStats.clientesActivos;
    const sociosConCompras = clientes.filter(c => (c.totalCompras || 0) > 0).length;
    
    // Calcular métricas financieras
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

  // Actualizar estadísticas cuando se monta el componente
  useEffect(() => {
    console.log('🚀 Componente montado, cargando datos iniciales...');
    updateDashboardStats();
  }, [updateDashboardStats]);

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
      {/* Header mejorado con tabs */}
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

          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={updateDashboardStats}
            loading={loading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'socios' && (
        <>
          {/* Barra de búsqueda y filtros mejorada */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              {/* Search mejorado */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar socios por nombre, email, teléfono..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg"
                />

                {/* Resultados de búsqueda mejorados */}
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
                          onClick={() => handleSelectCliente(cliente)}
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

          {/* Lista de socios mejorada */}
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

            {clientes.length === 0 && !loading ? (
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
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg shadow-purple-500/30"
                >
                  Agregar Primer Socio
                </Button>
              </div>
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
                      onSelect={handleSelectCliente}
                      onEdit={openEditModal}
                      onDelete={(cliente) => {
                        setSelectedCliente(cliente);
                        setShowDeleteModal(true);
                      }}
                      onToggleEstado={handleToggleEstado}
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

          {/* Gráficos y análisis adicionales */}
          {advancedMetrics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Distribución por estado */}
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

              {/* Resumen financiero */}
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                  <DollarSign className="text-emerald-600" size={24} />
                  Resumen Financiero
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Ingresos Totales</span>
                    <span className="text-2xl font-bold text-emerald-600">
                      ${advancedMetrics.totalGastado.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Promedio por Socio</span>
                    <span className="text-xl font-semibold text-slate-900">
                      ${advancedMetrics.promedioGastoPorSocio.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Ticket Promedio</span>
                    <span className="text-xl font-semibold text-slate-900">
                      ${advancedMetrics.ticketPromedio.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Valor Vida Socio</span>
                    <span className="text-xl font-semibold text-purple-600">
                      ${advancedMetrics.clv.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Total Transacciones</span>
                      <span className="text-lg font-medium text-slate-900">
                        {advancedMetrics.totalCompras.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de crear socio - PANTALLA COMPLETA CON PORTAL */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} fullScreen>
        <DialogContent fullScreen>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-3xl">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                <UserPlus size={24} className="text-white" />
              </div>
              Crear Nuevo Socio
            </DialogTitle>
            
            <p className="text-slate-600 mt-2 text-lg">
              Completa la información del nuevo socio para agregarlo al sistema
            </p>
          </DialogHeader>

          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl p-10 mb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Información Personal */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <User size={20} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Información Personal</h3>
                  </div>

                  <Input
                    label="Nombre completo *"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre completo del socio"
                    required
                    className="text-xl py-4"
                  />

                  <Input
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                    required
                    className="text-xl py-4"
                  />

                  <Input
                    label="Teléfono"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+54 9 11 1234-5678"
                    className="text-xl py-4"
                  />

                  <Input
                    label="DNI"
                    value={formData.dni}
                    onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                    placeholder="12345678"
                    className="text-xl py-4"
                  />
                </div>

                {/* Información Adicional */}
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <MapPin size={20} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Información Adicional</h3>
                  </div>

                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                    className="text-xl py-4"
                  />

                  <Input
                    label="Dirección"
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Dirección completa"
                    className="text-xl py-4"
                  />

                  <div>
                    <label className="block text-lg font-medium text-slate-700 mb-4">
                      Notas
                    </label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                      placeholder="Notas adicionales sobre el socio..."
                      rows={5}
                      className="w-full px-6 py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xl resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de Comunicación */}
            <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-lg">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bell size={20} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Configuración de Comunicación</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { 
                    key: 'recibirNotificaciones', 
                    label: 'Recibir notificaciones', 
                    description: 'Notificaciones generales del sistema',
                    icon: <Bell size={20} />
                  },
                  { 
                    key: 'recibirPromociones', 
                    label: 'Recibir promociones', 
                    description: 'Ofertas y promociones especiales',
                    icon: <Gift size={20} />
                  },
                  { 
                    key: 'recibirEmail', 
                    label: 'Comunicación por email', 
                    description: 'Recibir emails informativos',
                    icon: <Mail size={20} />
                  },
                  { 
                    key: 'recibirSMS', 
                    label: 'Comunicación por SMS', 
                    description: 'Mensajes de texto importantes',
                    icon: <MessageSquare size={20} />
                  },
                ].map((config) => (
                  <div key={config.key} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md">
                        {config.icon}
                      </div>
                      <div>
                        <span className="text-lg font-medium text-slate-900">{config.label}</span>
                        <p className="text-sm text-slate-500 mt-1">{config.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          [config.key]: !prev.configuracion[config.key as keyof typeof prev.configuracion]
                        }
                      }))}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        formData.configuracion[config.key as keyof typeof formData.configuracion]
                          ? 'bg-purple-600' 
                          : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${
                          formData.configuracion[config.key as keyof typeof formData.configuracion]
                            ? 'translate-x-7' 
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-10 py-4 text-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSocio}
              loading={loading}
              disabled={!formData.nombre || !formData.email}
              className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-10 py-4 text-xl shadow-lg shadow-purple-500/30"
            >
              <UserPlus size={24} className="mr-3" />
              Crear Socio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de editar socio */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} fullScreen>
        <DialogContent fullScreen>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-3xl">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Edit3 size={24} className="text-white" />
              </div>
              Editar Socio
            </DialogTitle>
            <p className="text-slate-600 mt-2 text-lg">
              Modifica la información del socio según sea necesario
            </p>
          </DialogHeader>

          <div className="max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-10 mb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <User size={20} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Información Personal</h3>
                  </div>

                  <Input
                    label="Nombre completo *"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre completo del socio"
                    required
                    className="text-xl py-4"
                  />

                  <Input
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@ejemplo.com"
                    required
                    className="text-xl py-4"
                  />

                  <Input
                    label="Teléfono"
                    value={formData.telefono}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="+54 9 11 1234-5678"
                    className="text-xl py-4"
                  />

                  <Input
                    label="DNI"
                    value={formData.dni}
                    onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                    placeholder="12345678"
                    className="text-xl py-4"
                  />
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <MapPin size={20} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Información Adicional</h3>
                  </div>

                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                    className="text-xl py-4"
                  />

                  <Input
                    label="Dirección"
                    value={formData.direccion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                    placeholder="Dirección completa"
                    className="text-xl py-4"
                  />

                  <div>
                    <label className="block text-lg font-medium text-slate-700 mb-4">
                      Notas
                    </label>
                    <textarea
                      value={formData.notas}
                      onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                      placeholder="Notas adicionales sobre el socio..."
                      rows={5}
                      className="w-full px-6 py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xl resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Configuración de Comunicación igual que en crear */}
            <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-lg">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bell size={20} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Configuración de Comunicación</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { 
                    key: 'recibirNotificaciones', 
                    label: 'Recibir notificaciones', 
                    description: 'Notificaciones generales del sistema',
                    icon: <Bell size={20} />
                  },
                  { 
                    key: 'recibirPromociones', 
                    label: 'Recibir promociones', 
                    description: 'Ofertas y promociones especiales',
                    icon: <Gift size={20} />
                  },
                  { 
                    key: 'recibirEmail', 
                    label: 'Comunicación por email', 
                    description: 'Recibir emails informativos',
                    icon: <Mail size={20} />
                  },
                  { 
                    key: 'recibirSMS', 
                    label: 'Comunicación por SMS', 
                    description: 'Mensajes de texto importantes',
                    icon: <MessageSquare size={20} />
                  },
                ].map((config) => (
                  <div key={config.key} className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-md">
                        {config.icon}
                      </div>
                      <div>
                        <span className="text-lg font-medium text-slate-900">{config.label}</span>
                        <p className="text-sm text-slate-500 mt-1">{config.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          [config.key]: !prev.configuracion[config.key as keyof typeof prev.configuracion]
                        }
                      }))}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                        formData.configuracion[config.key as keyof typeof formData.configuracion]
                          ? 'bg-emerald-600' 
                          : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${
                          formData.configuracion[config.key as keyof typeof formData.configuracion]
                            ? 'translate-x-7' 
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                resetForm();
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-10 py-4 text-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditSocio}
              loading={loading}
              disabled={!formData.nombre || !formData.email}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-4 text-xl shadow-lg shadow-emerald-500/30"
            >
              <Edit3 size={24} className="mr-3" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de eliminar socio */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)} fullScreen>
        <DialogContent fullScreen>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-3xl text-red-600">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Trash2 size={24} className="text-white" />
              </div>
              Eliminar Socio
            </DialogTitle>
            <p className="text-slate-600 mt-2 text-lg">
              Esta acción no se puede deshacer. Se eliminarán todos los datos asociados.
            </p>
          </DialogHeader>

          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-3xl p-10 mb-10">
              <div className="flex items-center gap-6 mb-8">
                <AlertCircle className="text-red-500 flex-shrink-0" size={48} />
                <div>
                  <h3 className="text-2xl font-bold text-red-800 mb-3">
                    ¿Estás seguro de que deseas eliminar este socio?
                  </h3>
                  <p className="text-red-600 text-lg">
                    Esta acción eliminará permanentemente toda la información del socio, incluyendo su historial de compras, beneficios utilizados y datos personales.
                  </p>
                </div>
              </div>

              {selectedCliente && (
                <div className="bg-white rounded-2xl p-8 border border-red-200">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center">
                      {selectedCliente.avatar ? (
                        <Image
                          src={selectedCliente.avatar}
                          alt={selectedCliente.nombre}
                          className="w-full h-full object-cover rounded-2xl"
                          width={80}
                          height={80}
                        />
                      ) : (
                        <User size={32} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-2xl font-bold text-slate-900 mb-2">{selectedCliente.nombre}</h4>
                      <p className="text-slate-600 mb-4 text-lg">{selectedCliente.email}</p>
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <span className="text-2xl font-bold text-slate-900">{selectedCliente.totalCompras || 0}</span>
                          <p className="text-slate-500">Compras</p>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-slate-900">${(selectedCliente.montoTotalGastado || 0).toLocaleString()}</span>
                          <p className="text-slate-500">Total gastado</p>
                        </div>
                        <div>
                          <span className="text-2xl font-bold text-slate-900">{selectedCliente.beneficiosUsados || 0}</span>
                          <p className="text-slate-500">Beneficios usados</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
              <div className="flex items-center gap-4">
                <AlertCircle className="text-amber-600" size={32} />
                <p className="text-amber-800 font-medium text-lg">
                  Recomendación: Considera desactivar el socio en lugar de eliminarlo para mantener el historial.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-10 py-4 text-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteSocio}
              loading={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 text-xl shadow-lg shadow-red-500/30"
            >
              <Trash2 size={24} className="mr-3" />
              Eliminar Socio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle del socio */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)} fullScreen>
        <DialogContent fullScreen>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-3xl">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <User size={24} className="text-white" />
              </div>
              Perfil del Socio
            </DialogTitle>
            <p className="text-slate-600 mt-2 text-lg">
              Información completa y estadísticas del socio
            </p>
          </DialogHeader>

          {selectedCliente && (
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Header del socio */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-10">
                <div className="flex items-start gap-10">
                  <div className="relative">
                    <div className="w-40 h-40 bg-white rounded-3xl shadow-xl flex items-center justify-center overflow-hidden">
                      {selectedCliente.avatar ? (
                        <Image
                          src={selectedCliente.avatar}
                          alt={selectedCliente.nombre}
                          className="w-full h-full object-cover"
                          width={160}
                          height={160}
                        />
                      ) : (
                        <User size={64} className="text-slate-400" />
                      )}
                    </div>
                    <div className={`absolute -bottom-3 -right-3 w-12 h-12 rounded-full border-4 border-white flex items-center justify-center ${
                      selectedCliente.estado === 'activo' ? 'bg-emerald-500' : 
                      selectedCliente.estado === 'suspendido' ? 'bg-red-500' : 'bg-slate-500'
                    }`}>
                      <div className="w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-5xl font-bold text-slate-900 mb-4">
                          {selectedCliente.nombre}
                        </h2>
                        <p className="text-2xl text-slate-600 mb-6">{selectedCliente.email}</p>
                        
                        <div className="flex items-center gap-8 mb-8">
                          <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-lg font-medium border ${
                            selectedCliente.estado === 'activo' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : selectedCliente.estado === 'suspendido'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}>
                            {selectedCliente.estado === 'activo' && <CheckCircle size={20} />}
                            {selectedCliente.estado === 'suspendido' && <XCircle size={20} />}
                            {selectedCliente.estado === 'inactivo' && <Pause size={20} />}
                            {selectedCliente.estado.charAt(0).toUpperCase() + selectedCliente.estado.slice(1)}
                          </div>
                          
                          <span className="text-slate-500 text-lg">
                            Socio desde {format(selectedCliente.creadoEn.toDate(), 'dd/MM/yyyy', { locale: es })}
                          </span>
                        </div>

                        {/* Información de contacto */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {selectedCliente.telefono && (
                            <div className="flex items-center gap-4 text-slate-600">
                              <Phone size={24} />
                              <span className="text-xl">{selectedCliente.telefono}</span>
                            </div>
                          )}
                          {selectedCliente.direccion && (
                            <div className="flex items-center gap-4 text-slate-600">
                              <MapPin size={24} />
                              <span className="text-xl">{selectedCliente.direccion}</span>
                            </div>
                          )}
                          {selectedCliente.fechaNacimiento && (
                            <div className="flex items-center gap-4 text-slate-600">
                              <Calendar size={24} />
                              <span className="text-xl">
                                {format(selectedCliente.fechaNacimiento.toDate(), 'dd/MM/yyyy', { locale: es })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          leftIcon={<Edit3 size={20} />}
                          onClick={() => {
                            setShowDetailModal(false);
                            openEditModal(selectedCliente);
                          }}
                          className="border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-4 text-xl"
                        >
                          Editar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas del socio */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg">
                  <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={40} className="text-blue-600" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-3">
                    {selectedCliente.totalCompras || 0}
                  </div>
                  <div className="text-slate-500 text-lg">Total Compras</div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg">
                  <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <DollarSign size={40} className="text-emerald-600" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-3">
                    ${(selectedCliente.montoTotalGastado || 0).toLocaleString()}
                  </div>
                  <div className="text-slate-500 text-lg">Total Gastado</div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg">
                  <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Gift size={40} className="text-purple-600" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-3">
                    {selectedCliente.beneficiosUsados || 0}
                  </div>
                  <div className="text-slate-500 text-lg">Beneficios Usados</div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg">
                  <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Receipt size={40} className="text-orange-600" />
                  </div>
                  <div className="text-4xl font-bold text-slate-900 mb-3">
                    ${(selectedCliente.promedioCompra || 0).toLocaleString()}
                  </div>
                  <div className="text-slate-500 text-lg">Promedio Compra</div>
                </div>
              </div>

              {/* Información adicional */}
              {(selectedCliente.notas || (selectedCliente.tags && selectedCliente.tags.length > 0)) && (
                <div className="bg-white rounded-3xl border border-slate-200 p-10 shadow-lg">
                  <h3 className="text-3xl font-bold text-slate-900 mb-8">
                    Información Adicional
                  </h3>
                  
                  {selectedCliente.notas && (
                    <div className="mb-8">
                      <h4 className="text-xl font-medium text-slate-700 mb-4">Notas</h4>
                      <p className="text-slate-600 bg-slate-50 p-6 rounded-2xl text-xl leading-relaxed">
                        {selectedCliente.notas}
                      </p>
                    </div>
                  )}

                  {selectedCliente.tags && selectedCliente.tags.length > 0 && (
                    <div>
                      <h4 className="text-xl font-medium text-slate-700 mb-4">Tags</h4>
                      <div className="flex flex-wrap gap-4">
                        {selectedCliente.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 text-blue-700 text-lg rounded-full border border-blue-200"
                          >
                            <Tag size={18} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-10 py-4 text-xl"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Componente de creación rápida flotante mejorado */}
      <QuickClienteCreator
        onCreateCliente={async (clienteData) => {
          console.log('🚀 Creando socio desde QuickCreator...');
          const result = await createCliente(clienteData);
          if (result) {
            console.log('✅ Socio creado desde QuickCreator, actualizando...');
            // Actualizar estadísticas del dashboard principal
            await loadClientes();
            await updateDashboardStats();
          }
          return result;
        }}
        loading={loading}
      />
    </div>
  );
}

export default SocioAnalytics;

