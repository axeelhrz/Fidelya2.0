'use client';

import React, { useState, useMemo } from 'react';
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
  Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClientes } from '@/hooks/useClientes';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/Button';
import { QuickClienteCreator } from './QuickClienteCreator';
import { subDays } from 'date-fns';

// Componente de métrica avanzada (mantener igual)
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
}> = ({ 
  title, 
  value, 
  previousValue, 
  icon, 
  color, 
  format = 'number', 
  subtitle,
  onClick 
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

// Componente de tarjeta de cliente
const ClienteCard: React.FC<{
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
      {/* Menú de acciones */}
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-10"
              >
                <button
                  onClick={() => {
                    onSelect(cliente);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Eye size={14} />
                  Ver detalles
                </button>
                <button
                  onClick={() => {
                    onEdit(cliente);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit3 size={14} />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onToggleEstado(cliente);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
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
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
              <Users size={24} className="text-slate-400" />
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
          <span>Cliente desde {format(cliente.creadoEn.toDate(), 'MMM yyyy', { locale: es })}</span>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {cliente.totalCompras}
          </div>
          <div className="text-xs text-slate-500">Compras</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-emerald-600">
            ${cliente.montoTotalGastado.toLocaleString()}
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

// Componente principal de analíticas con gestión de clientes
export function ClienteAnalytics() {
  const {
    clientes,
    loading,
    error,
    hasMore,
    total,
    loadMoreClientes,
    selectCliente,
    createCliente,
    updateEstadoCliente,
    searchClientes,
    exportData,
    filtros,
    setFiltros,
    clearFiltros,
    refreshStats
  } = useClientes();

  // Estados para analíticas
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'clientes'>('analytics');

  // Estados para gestión de clientes
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [, setShowEditModal] = useState(false);
  const [, setShowDeleteModal] = useState(false);
  const [, setShowDetailModal] = useState(false);
  const [, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [, setSelectedCliente] = useState<Cliente | null>(null);
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Estados del formulario
  const [, setFormData] = useState<ClienteFormData>({
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

  

  // Funciones para gestión de clientes
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


  // Remove incomplete handleEnhancedCreateCliente function


 

  const handleToggleEstado = async (cliente: Cliente) => {
    const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo';
    await updateEstadoCliente(cliente.id, nuevoEstado);
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

 

  // Calcular métricas avanzadas
  const advancedMetrics = useMemo(() => {
    if (!clientes.length) return null;

    const now = new Date();
    const startDate = (() => {
      switch (timeRange) {
        case '7d': return subDays(now, 7);
        case '30d': return subDays(now, 30);
        case '90d': return subDays(now, 90);
        case '1y': return subDays(now, 365);
        default: return subDays(now, 30);
      }
    })();

    const clientesEnRango = clientes.filter(cliente => 
      cliente.creadoEn.toDate() >= startDate
    );

    const totalClientes = clientes.length;
    const clientesNuevos = clientesEnRango.length;
    const clientesActivos = clientes.filter(c => c.estado === 'activo').length;
    const clientesConCompras = clientes.filter(c => c.totalCompras > 0).length;
    
    const totalGastado = clientes.reduce((sum, c) => sum + c.montoTotalGastado, 0);
    const totalCompras = clientes.reduce((sum, c) => sum + c.totalCompras, 0);
    const totalBeneficios = clientes.reduce((sum, c) => sum + c.beneficiosUsados, 0);
    
    const promedioGastoPorCliente = totalClientes > 0 ? totalGastado / totalClientes : 0;
    const promedioComprasPorCliente = totalClientes > 0 ? totalCompras / totalClientes : 0;
    const tasaConversion = totalClientes > 0 ? (clientesConCompras / totalClientes) * 100 : 0;
    const tasaRetencion = totalClientes > 0 ? (clientesActivos / totalClientes) * 100 : 0;
    
    const ticketPromedio = totalCompras > 0 ? totalGastado / totalCompras : 0;
    const clv = promedioGastoPorCliente * (promedioComprasPorCliente / 12) * 24;
    const frecuenciaPromedio = clientes.length > 0 
      ? clientes.reduce((sum, c) => sum + c.frecuenciaVisitas, 0) / clientes.length 
      : 0;

    return {
      totalClientes,
      clientesNuevos,
      clientesActivos,
      clientesConCompras,
      totalGastado,
      totalCompras,
      totalBeneficios,
      promedioGastoPorCliente,
      promedioComprasPorCliente,
      tasaConversion,
      tasaRetencion,
      ticketPromedio,
      clv,
      frecuenciaPromedio,
    };
  }, [clientes, timeRange]);

  if (loading && clientes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header con tabs */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={28} />
            Analíticas y Gestión de Clientes
          </h2>
          <p className="text-gray-600 mt-1">
            Análisis detallado y gestión completa de tus clientes
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Analíticas
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'clientes'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              Clientes ({clientes.length})
            </button>
          </div>

          <Button
            variant="outline"
            leftIcon={<RefreshCw size={16} />}
            onClick={refreshStats}
            loading={loading}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {/* Contenido según tab activo */}
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

          {/* Métricas principales */}
          {advancedMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdvancedMetricCard
                title="Total Clientes"
                value={advancedMetrics.totalClientes}
                icon={<Users size={20} />}
                color="#3b82f6"
                subtitle={`${advancedMetrics.clientesActivos} activos`}
                onClick={() => setActiveTab('clientes')}
              />
              
              <AdvancedMetricCard
                title="Clientes Nuevos"
                value={advancedMetrics.clientesNuevos}
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
                    title="Valor Vida Cliente"
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
                    subtitle="Clientes que compraron"
                  />
                  
                  <AdvancedMetricCard
                    title="Tasa de Retención"
                    value={advancedMetrics.tasaRetencion}
                    icon={<Heart size={20} />}
                    color="#ef4444"
                    format="percentage"
                    subtitle="Clientes activos"
                  />
                  
                  <AdvancedMetricCard
                    title="Frecuencia Promedio"
                    value={advancedMetrics.frecuenciaPromedio.toFixed(1)}
                    icon={<Activity size={20} />}
                    color="#84cc16"
                    subtitle="Visitas por cliente"
                  />
                </>
              )}
            </div>
          )}

          {/* Aquí irían los componentes de segmentación y top clientes que ya tienes */}
        </>
      )}

      {activeTab === 'clientes' && (
        <>
          {/* Barra de búsqueda y filtros para clientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar clientes por nombre, email, teléfono..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />

                {/* Resultados de búsqueda */}
                <AnimatePresence>
                  {showSearchResults && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-200 max-h-64 overflow-y-auto z-50"
                    >
                      {searchResults.map((cliente) => (
                        <div
                          key={cliente.id}
                          onClick={() => handleSelectCliente(cliente)}
                          className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                              {cliente.avatar ? (
                                <Image
                                  src={cliente.avatar}
                                  alt={cliente.nombre}
                                  className="w-full h-full object-cover rounded-full"
                                  width={32}
                                  height={32}
                                />
                              ) : (
                                <Users size={16} className="text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{cliente.nombre}</p>
                              <p className="text-sm text-slate-500">{cliente.email}</p>
                            </div>
                            <div className="text-sm text-slate-400">
                              ${cliente.montoTotalGastado.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
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
                  className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-3 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>

                {/* Dropdown para crear cliente */}
                <div className="relative group">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-purple-500 text-white px-4 py-3 rounded-xl hover:bg-purple-600 transition-colors shadow-lg shadow-purple-500/30"
                  >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Cliente
                    <div className="w-1 h-1 bg-white rounded-full ml-1"></div>
                  </button>

                  {/* Dropdown menu */}
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        resetForm();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <UserPlus size={14} />
                      Formulario básico
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        resetForm();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Zap size={14} />
                      Formulario completo
                    </button>
                  </div>
                    <button
                      onClick={() => {
                        resetForm();
                        // Aquí podrías abrir otro modal si lo implementas en el futuro
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Zap size={14} />
                      Formulario completo
                    </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${
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
                  className="border-t border-slate-200 pt-4"
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
                      {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Lista de clientes */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {error && (
              <div className="p-6 bg-red-50 border-b border-red-200 flex items-center gap-3">
                <AlertCircle className="text-red-500" size={20} />
                <div>
                  <h3 className="font-medium text-red-800">Error al cargar clientes</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            )}

            {clientes.length === 0 && !loading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  No hay clientes registrados
                </h3>
                <p className="text-slate-600 mb-6">
                  Comienza agregando tu primer cliente para gestionar sus perfiles
                </p>
                <Button
                  leftIcon={<UserPlus size={16} />}
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Agregar Primer Cliente
                </Button>
              </div>
            ) : (
              <div className="p-6">
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}>
                  {clientes.map((cliente) => (
                    <ClienteCard
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
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      onClick={loadMoreClientes}
                      loading={loading}
                      className="px-8 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      Cargar más clientes
                    </Button>
                  </div>
                )}

                {/* Pagination Info */}
                <div className="text-center text-sm text-slate-500 mt-4">
                  Mostrando {clientes.length} de {total} clientes
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Todos los modales que ya tienes (crear, editar, eliminar, detalle, compra) */}
      {/* ... aquí van todos los modales del código anterior ... */}

      {/* Componente de creación rápida flotante */}
      <QuickClienteCreator
        onCreateCliente={createCliente}
        loading={loading}
      />
    </div>
  );
};
