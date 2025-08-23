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
  Sparkles,
  Plus,
  TrendingUp,
  Loader2,
  Mail,
  ShoppingBag,
  Gift,
  Camera,
  Settings,
  Bell,
  MessageSquare,
  Clock,
  Star,
  Award,
  Calendar as CalendarIcon,
  MapPin as LocationIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  FileText,
  Bookmark,
  Shield,
  Zap,
  BarChart,
  X
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

// Componente de tarjeta de socio mejorado SIN las tarjetas de compras y total gastado
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

// Componente principal mejorado con debugging
export function SocioAnalytics() {
  const {
    clientes,
    clienteSeleccionado,
    activities,
    loading,
    loadingActivities,
    error,
    hasMore,
    total,
    stats: clienteStats,
    loadClientes,
    loadMoreClientes,
    selectCliente,
    createCliente,
    deleteCliente,
    updateEstadoCliente,
    uploadClienteImage,
    searchClientes,
    exportData,
    updateClienteCompra,
    loadClienteActivities,
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
  const [, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompraModal, setShowCompraModal] = useState(false);
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

  const [compraData, setCompraData] = useState({
    monto: '',
    beneficioUsado: false,
    descripcion: '',
  });

  // Debug: Log de datos para identificar problemas
  useEffect(() => {
    console.log('🔍 DEBUG - Estado actual de socios:');
    console.log('- Total socios:', total);
    console.log('- Socios cargados:', clientes.length);
    console.log('- Loading:', loading);
    console.log('- Error:', error);
    console.log('- Stats:', clienteStats);
    console.log('- Filtros activos:', filtros);
    
    if (clientes.length > 0) {
      console.log('- Primer socio:', clientes[0]);
    }
  }, [clientes, total, loading, error, clienteStats, filtros]);

  // Función para actualizar las estadísticas del dashboard principal
  const updateDashboardStats = useCallback(async () => {
    try {
      console.log('🔄 Actualizando estadísticas del dashboard...');
      
      await refreshStats();
      console.log('✅ Stats de socios actualizadas');
      
      await loadComercioStats();
      console.log('✅ Stats de comercio actualizadas');
      
      console.log('✅ Todas las estadísticas actualizadas correctamente');
    } catch (error) {
      console.error('❌ Error updating dashboard stats:', error);
    }
  }, [refreshStats, loadComercioStats]);

  // Función para forzar recarga completa
  const forceReload = useCallback(async () => {
    try {
      console.log('🔄 Forzando recarga completa de datos...');
      
      // Limpiar filtros primero
      clearFiltros();
      
      // Recargar datos
      await loadClientes();
      await updateDashboardStats();
      
      console.log('✅ Recarga completa finalizada');
      toast.success('Datos actualizados correctamente');
    } catch (error) {
      console.error('❌ Error en recarga completa:', error);
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

  const handleSelectCliente = async (cliente: Cliente) => {
    console.log('🔍 Seleccionando cliente para ver perfil completo:', cliente.nombre);
    setSelectedCliente(cliente);
    await selectCliente(cliente.id);
    
    // Cargar actividades del cliente
    await loadClienteActivities(cliente.id);
    
    setShowDetailModal(true);
    setShowSearchResults(false);
    
    console.log('✅ Modal de detalle abierto para:', cliente.nombre);
  };

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
        await loadClientes();
        await updateDashboardStats();
        console.log('✅ Proceso de creación completado');
      }
    } catch (error) {
      console.error('❌ Error creating socio:', error);
      toast.error('Error al crear el socio. Inténtalo de nuevo.');
    }
  };

  const handleDeleteSocio = async () => {
    if (!selectedCliente) return;

    try {
      console.log('🗑️ Eliminando socio:', selectedCliente.id);
      
      const success = await deleteCliente(selectedCliente.id);
      if (success) {
        setShowDeleteModal(false);
        setSelectedCliente(null);
        toast.success('Socio eliminado exitosamente');
        
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

  // Manejar registro de compra
  const handleRegistrarCompra = async () => {
    if (!selectedCliente || !compraData.monto) return;

    try {
      const success = await updateClienteCompra(
        selectedCliente.id,
        Number(compraData.monto),
        compraData.beneficioUsado
      );
      
      if (success) {
        setShowCompraModal(false);
        setCompraData({ monto: '', beneficioUsado: false, descripcion: '' });
        toast.success('Compra registrada exitosamente');
        
        // Actualizar cliente seleccionado
        await selectCliente(selectedCliente.id);
        await loadClienteActivities(selectedCliente.id);
      }
    } catch (error) {
      console.error('Error registering compra:', error);
      toast.error('Error al registrar la compra');
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
    console.log('🚀 Componente montado, cargando datos iniciales...');
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
      {/* Header mejorado con debugging */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-purple-600" size={28} />
            Gestión de Socios
            {/* Debug badge */}
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {total} total | {clientes.length} cargados
            </span>
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

          {/* Botón de recarga forzada para debugging */}
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

          {/* Lista de socios mejorada con debugging */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Debug info header */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-blue-50 border-b border-blue-200 p-4">
                <div className="flex items-center gap-4 text-sm">
                  <span className="font-medium text-blue-800">Debug Info:</span>
                  <span className="text-blue-600">Total: {total}</span>
                  <span className="text-blue-600">Cargados: {clientes.length}</span>
                  <span className="text-blue-600">Loading: {loading ? 'Sí' : 'No'}</span>
                  <span className="text-blue-600">Error: {error || 'Ninguno'}</span>
                  <span className="text-blue-600">HasMore: {hasMore ? 'Sí' : 'No'}</span>
                </div>
              </div>
            )}

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

      {/* MODAL DE PERFIL COMPLETO - VERSIÓN PROFESIONAL MEJORADA */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full overflow-hidden p-0">
          {/* Header del modal con gradiente */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                    <User size={28} className="text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold mb-2">Perfil Completo del Socio</h1>
                    <p className="text-white/80 text-lg">Información detallada y gestión avanzada</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw size={16} />}
                    onClick={() => clienteSeleccionado && loadClienteActivities(clienteSeleccionado.id)}
                    loading={loadingActivities}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm"
                  >
                    Actualizar
                  </Button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors backdrop-blur-sm border border-white/30"
                  >
                    <X size={20} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
          </div>

          {clienteSeleccionado && (
            <div className="flex-1 overflow-y-auto">
              {/* Información principal del socio */}
              <div className="p-8 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-7xl mx-auto">
                  <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Columna principal - Información del socio */}
                    <div className="xl:col-span-3 space-y-8">
                      {/* Card principal del socio */}
                      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                        <div className="p-8">
                          <div className="flex items-start gap-8">
                            {/* Avatar grande con funcionalidad de cambio */}
                            <div className="relative group">
                              <div className="w-32 h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden ring-4 ring-white">
                                {clienteSeleccionado.avatar ? (
                                  <Image
                                    src={clienteSeleccionado.avatar}
                                    alt={clienteSeleccionado.nombre}
                                    className="w-full h-full object-cover"
                                    width={128}
                                    height={128}
                                  />
                                ) : (
                                  <User size={48} className="text-slate-400" />
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      await uploadClienteImage(clienteSeleccionado.id, file);
                                      await selectCliente(clienteSeleccionado.id);
                                    }
                                  };
                                  input.click();
                                }}
                                className="absolute -bottom-3 -right-3 w-14 h-14 bg-gradient-to-r from-purple-600 to-violet-600 shadow-2xl rounded-2xl flex items-center justify-center text-white hover:from-purple-700 hover:to-violet-700 transition-all hover:scale-110 group-hover:shadow-purple-500/50"
                              >
                                <Camera size={20} />
                              </button>
                            </div>

                            {/* Información principal */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-6">
                                <div>
                                  <h2 className="text-4xl font-bold text-slate-900 mb-3">
                                    {clienteSeleccionado.nombre}
                                  </h2>
                                  <p className="text-xl text-slate-600 mb-4">{clienteSeleccionado.email}</p>
                                  
                                  <div className="flex items-center gap-4 mb-6">
                                    <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl text-base font-semibold border-2 ${
                                      clienteSeleccionado.estado === 'activo' 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : clienteSeleccionado.estado === 'suspendido'
                                        ? 'bg-red-50 text-red-800 border-red-200'
                                        : 'bg-slate-50 text-slate-800 border-slate-200'
                                    }`}>
                                      {clienteSeleccionado.estado === 'activo' && <CheckCircle size={20} />}
                                      {clienteSeleccionado.estado === 'suspendido' && <XCircle size={20} />}
                                      {clienteSeleccionado.estado === 'inactivo' && <Pause size={20} />}
                                      {clienteSeleccionado.estado.charAt(0).toUpperCase() + clienteSeleccionado.estado.slice(1)}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-base text-slate-600 bg-white px-4 py-2 rounded-xl border border-slate-200">
                                      <Star size={16} className="text-yellow-500" />
                                      Socio desde {format(clienteSeleccionado.creadoEn.toDate(), 'dd/MM/yyyy', { locale: es })}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <Button
                                    variant="outline"
                                    leftIcon={<Edit3 size={16} />}
                                    onClick={() => {
                                      setShowDetailModal(false);
                                      openEditModal(clienteSeleccionado);
                                    }}
                                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                                  >
                                    Editar Perfil
                                  </Button>
                                  <Button
                                    leftIcon={<ShoppingBag size={16} />}
                                    onClick={() => setShowCompraModal(true)}
                                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30"
                                  >
                                    Registrar Compra
                                  </Button>
                                </div>
                              </div>

                              {/* Grid de información de contacto */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {clienteSeleccionado.telefono && (
                                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                                    <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                                      <PhoneIcon size={20} className="text-white" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">Teléfono</p>
                                      <p className="font-bold text-slate-900 text-lg">{clienteSeleccionado.telefono}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {clienteSeleccionado.direccion && (
                                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
                                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                                      <LocationIcon size={20} className="text-white" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-emerald-600 uppercase tracking-wide font-semibold">Dirección</p>
                                      <p className="font-bold text-slate-900 text-sm truncate">{clienteSeleccionado.direccion}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {clienteSeleccionado.fechaNacimiento && (
                                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-100">
                                    <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                                      <CalendarIcon size={20} className="text-white" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-purple-600 uppercase tracking-wide font-semibold">Nacimiento</p>
                                      <p className="font-bold text-slate-900 text-lg">
                                        {format(clienteSeleccionado.fechaNacimiento.toDate(), 'dd/MM/yyyy', { locale: es })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                                
                                {clienteSeleccionado.ultimoAcceso && (
                                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
                                    <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                                      <Clock size={20} className="text-white" />
                                    </div>
                                    <div>
                                      <p className="text-xs text-orange-600 uppercase tracking-wide font-semibold">Último acceso</p>
                                      <p className="font-bold text-slate-900 text-sm">
                                        {format(clienteSeleccionado.ultimoAcceso.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Estadísticas del socio en cards grandes */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center hover:shadow-2xl transition-all duration-300 group">
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                            <ShoppingBag size={32} className="text-white" />
                          </div>
                          <div className="text-4xl font-bold text-slate-900 mb-3">
                            {clienteSeleccionado.totalCompras || 0}
                          </div>
                          <div className="text-base text-slate-600 font-semibold">Total Compras</div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center hover:shadow-2xl transition-all duration-300 group">
                          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                            <DollarSign size={32} className="text-white" />
                          </div>
                          <div className="text-4xl font-bold text-slate-900 mb-3">
                            ${(clienteSeleccionado.montoTotalGastado || 0).toLocaleString()}
                          </div>
                          <div className="text-base text-slate-600 font-semibold">Total Gastado</div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center hover:shadow-2xl transition-all duration-300 group">
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                            <Gift size={32} className="text-white" />
                          </div>
                          <div className="text-4xl font-bold text-slate-900 mb-3">
                            {clienteSeleccionado.beneficiosUsados || 0}
                          </div>
                          <div className="text-base text-slate-600 font-semibold">Beneficios Usados</div>
                        </div>

                        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center hover:shadow-2xl transition-all duration-300 group">
                          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform">
                            <TrendingUp size={32} className="text-white" />
                          </div>
                          <div className="text-4xl font-bold text-slate-900 mb-3">
                            ${(clienteSeleccionado.promedioCompra || 0).toLocaleString()}
                          </div>
                          <div className="text-base text-slate-600 font-semibold">Promedio Compra</div>
                        </div>
                      </div>

                      {/* Actividad reciente mejorada */}
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                          <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-4">
                              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Activity size={24} className="text-white" />
                              </div>
                              Actividad Reciente
                            </h3>
                            <Button
                              variant="outline"
                              leftIcon={<RefreshCw size={16} />}
                              onClick={() => loadClienteActivities(clienteSeleccionado.id)}
                              loading={loadingActivities}
                              className="border-slate-300 text-slate-700 hover:bg-slate-50"
                            >
                              Actualizar
                            </Button>
                          </div>
                        </div>

                        <div className="p-8">
                          {loadingActivities ? (
                            <div className="space-y-6">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className="animate-pulse flex items-center gap-6 p-6 bg-slate-50 rounded-2xl">
                                  <div className="w-16 h-16 bg-slate-200 rounded-2xl"></div>
                                  <div className="flex-1">
                                    <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                  </div>
                                  <div className="w-20 h-8 bg-slate-200 rounded"></div>
                                </div>
                              ))}
                            </div>
                          ) : activities.length > 0 ? (
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {activities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-6 p-6 bg-gradient-to-r from-slate-50 to-white rounded-2xl hover:from-slate-100 hover:to-slate-50 transition-all duration-200 border border-slate-100">
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
                                    activity.tipo === 'compra' ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' :
                                    activity.tipo === 'beneficio' ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white' :
                                    activity.tipo === 'visita' ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' :
                                    'bg-gradient-to-r from-slate-400 to-slate-600 text-white'
                                  }`}>
                                    {activity.tipo === 'compra' && <ShoppingBag size={24} />}
                                    {activity.tipo === 'beneficio' && <Gift size={24} />}
                                    {activity.tipo === 'visita' && <Eye size={24} />}
                                    {activity.tipo === 'registro' && <UserPlus size={24} />}
                                    {activity.tipo === 'actualizacion' && <Edit3 size={24} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 mb-2 text-lg">
                                      {activity.descripcion}
                                    </p>
                                    <div className="flex items-center gap-4">
                                      <span className="text-base text-slate-600 flex items-center gap-2">
                                        <Clock size={16} />
                                        {format(activity.fecha.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}
                                      </span>
                                      {activity.monto && (
                                        <span className="text-base font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200">
                                          ${activity.monto.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-16">
                              <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Activity size={32} className="text-slate-400" />
                              </div>
                              <h4 className="text-2xl font-bold text-slate-900 mb-3">No hay actividad reciente</h4>
                              <p className="text-slate-600 text-lg">Las actividades del socio aparecerán aquí</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Columna lateral - Información adicional */}
                    <div className="xl:col-span-1 space-y-8">
                      {/* Configuración de comunicación */}
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Settings size={20} className="text-white" />
                            </div>
                            Configuración
                          </h3>
                        </div>
                        
                        <div className="p-6 space-y-4">
                          {[
                            { 
                              key: 'recibirNotificaciones', 
                              label: 'Notificaciones', 
                              icon: <Bell size={18} />,
                              enabled: clienteSeleccionado.configuracion?.recibirNotificaciones,
                              color: 'blue'
                            },
                            { 
                              key: 'recibirPromociones', 
                              label: 'Promociones', 
                              icon: <Gift size={18} />,
                              enabled: clienteSeleccionado.configuracion?.recibirPromociones,
                              color: 'purple'
                            },
                            { 
                              key: 'recibirEmail', 
                              label: 'Email', 
                              icon: <MailIcon size={18} />,
                              enabled: clienteSeleccionado.configuracion?.recibirEmail,
                              color: 'emerald'
                            },
                            { 
                              key: 'recibirSMS', 
                              label: 'SMS', 
                              icon: <MessageSquare size={18} />,
                              enabled: clienteSeleccionado.configuracion?.recibirSMS,
                              color: 'orange'
                            },
                          ].map((config) => (
                            <div key={config.key} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${
                                  config.enabled 
                                    ? `bg-gradient-to-r from-${config.color}-500 to-${config.color}-600 text-white` 
                                    : 'bg-slate-100 text-slate-400'
                                }`}>
                                  {config.icon}
                                </div>
                                <span className="font-semibold text-slate-900 text-base">{config.label}</span>
                              </div>
                              <div className={`px-4 py-2 rounded-xl text-sm font-bold ${
                                config.enabled 
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                {config.enabled ? 'Activo' : 'Inactivo'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notas y tags */}
                      {(clienteSeleccionado.notas || (clienteSeleccionado.tags && clienteSeleccionado.tags.length > 0)) && (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                          <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FileText size={20} className="text-white" />
                              </div>
                              Información Adicional
                            </h3>
                          </div>
                          
                          <div className="p-6">
                            {clienteSeleccionado.notas && (
                              <div className="mb-6">
                                <h4 className="text-base font-bold text-slate-700 mb-3 flex items-center gap-2">
                                  <FileText size={16} />
                                  Notas
                                </h4>
                                <div className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-2xl border border-slate-200">
                                  <p className="text-slate-700 leading-relaxed text-base">{clienteSeleccionado.notas}</p>
                                </div>
                              </div>
                            )}

                            {clienteSeleccionado.tags && clienteSeleccionado.tags.length > 0 && (
                              <div>
                                <h4 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                                  <Bookmark size={16} />
                                  Tags
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                  {clienteSeleccionado.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-base rounded-2xl border border-blue-200 font-semibold shadow-sm"
                                    >
                                      <Tag size={14} />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Métricas adicionales */}
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                              <BarChart size={20} className="text-white" />
                            </div>
                            Métricas Avanzadas
                          </h3>
                        </div>
                        
                        <div className="p-6 space-y-6">
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Activity size={18} className="text-white" />
                              </div>
                              <span className="text-base font-semibold text-slate-700">Frecuencia de visitas</span>
                            </div>
                            <span className="text-2xl font-bold text-slate-900">
                              {clienteSeleccionado.frecuenciaVisitas || 0}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Star size={18} className="text-white" />
                              </div>
                              <span className="text-base font-semibold text-slate-700">Puntos acumulados</span>
                            </div>
                            <span className="text-2xl font-bold text-purple-600">
                              {((
                                clienteSeleccionado as Cliente & { puntosAcumulados?: number }
                              ).puntosAcumulados ?? 0)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Award size={18} className="text-white" />
                              </div>
                              <span className="text-base font-semibold text-slate-700">Nivel de socio</span>
                            </div>
                            <span className="text-base font-bold text-slate-900 bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2 rounded-xl border border-yellow-200 shadow-sm">
                              {((
                                clienteSeleccionado as Cliente & { nivelSocio?: string }
                              ).nivelSocio ?? 'Básico')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Shield size={18} className="text-white" />
                              </div>
                              <span className="text-base font-semibold text-slate-700">Estado de cuenta</span>
                            </div>
                            <span className="text-base font-bold text-emerald-700 bg-emerald-100 px-4 py-2 rounded-xl border border-emerald-200 shadow-sm">
                              Verificado
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Heart size={18} className="text-white" />
                              </div>
                              <span className="text-base font-semibold text-slate-700">Fidelidad</span>
                            </div>
                            <span className="text-2xl font-bold text-red-600">
                              {clienteSeleccionado.totalCompras && clienteSeleccionado.totalCompras > 10 ? 'Alta' : 
                               clienteSeleccionado.totalCompras && clienteSeleccionado.totalCompras > 5 ? 'Media' : 'Baja'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Acciones rápidas */}
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                              <Zap size={20} className="text-white" />
                            </div>
                            Acciones Rápidas
                          </h3>
                        </div>
                        
                        <div className="p-6 space-y-4">
                          <Button
                            fullWidth
                            leftIcon={<ShoppingBag size={18} />}
                            onClick={() => setShowCompraModal(true)}
                            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg shadow-emerald-500/30 py-4 text-base font-semibold"
                          >
                            Registrar Nueva Compra
                          </Button>
                          
                          <Button
                            fullWidth
                            variant="outline"
                            leftIcon={<Gift size={18} />}
                            className="border-purple-300 text-purple-700 hover:bg-purple-50 py-4 text-base font-semibold"
                          >
                            Asignar Beneficio
                          </Button>
                          
                          <Button
                            fullWidth
                            variant="outline"
                            leftIcon={<Mail size={18} />}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 py-4 text-base font-semibold"
                          >
                            Enviar Mensaje
                          </Button>
                          
                          <Button
                            fullWidth
                            variant="outline"
                            leftIcon={<FileText size={18} />}
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 py-4 text-base font-semibold"
                          >
                            Ver Historial Completo
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer del modal */}
          <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-t border-slate-200">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock size={16} />
                  <span className="text-sm">
                    Última actualización: {new Date().toLocaleString('es-ES')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  leftIcon={<Download size={16} />}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Exportar Datos
                </Button>
                <Button
                  onClick={() => setShowDetailModal(false)}
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white px-8"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de registrar compra */}
      <Dialog open={showCompraModal} onClose={() => setShowCompraModal(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShoppingBag size={24} className="text-white" />
              </div>
              Registrar Nueva Compra
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {selectedCliente && (
              <div className="p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <User size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-purple-900 text-lg">{selectedCliente.nombre}</p>
                    <p className="text-purple-600">{selectedCliente.email}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-base font-semibold text-slate-700 mb-3">
                Monto de la compra *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="number"
                  value={compraData.monto}
                  onChange={(e) => setCompraData(prev => ({ ...prev, monto: e.target.value }))}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg font-semibold"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-base font-semibold text-slate-700 mb-3">
                Descripción (opcional)
              </label>
              <textarea
                value={compraData.descripcion}
                onChange={(e) => setCompraData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción de la compra..."
                rows={4}
                className="w-full px-4 py-4 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
              />
            </div>

            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-white rounded-2xl border border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Gift size={20} className="text-white" />
                </div>
                <div>
                  <span className="text-base font-semibold text-slate-700 block">
                    ¿Se usó un beneficio?
                  </span>
                  <span className="text-sm text-slate-500">
                    Marcar si el cliente utilizó algún descuento
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompraData(prev => ({ ...prev, beneficioUsado: !prev.beneficioUsado }))}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors shadow-lg ${
                  compraData.beneficioUsado 
                    ? 'bg-gradient-to-r from-purple-600 to-violet-600' 
                    : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg ${
                    compraData.beneficioUsado ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <DialogFooter className="pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCompraModal(false);
                setCompraData({ monto: '', beneficioUsado: false, descripcion: '' });
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 px-6 py-3"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrarCompra}
              loading={loading}
              disabled={!compraData.monto}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 shadow-lg shadow-emerald-500/30"
            >
              <ShoppingBag size={16} className="mr-2" />
              Registrar Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Componente de creación rápida flotante */}
      <QuickClienteCreator
        onCreateCliente={async (clienteData) => {
          console.log('🚀 Creando socio desde QuickCreator...');
          const result = await createCliente(clienteData);
          if (result) {
            console.log('✅ Socio creado desde QuickCreator, actualizando...');
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

