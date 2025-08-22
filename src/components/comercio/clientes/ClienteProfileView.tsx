'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Download,
  Edit3,
  Trash2,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  User,
  Camera,
  MoreVertical,
  Tag,
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  UserPlus,
  Gift,
  Grid,
  List,
  Bell,
  MessageSquare,
  Settings,
  Clock,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useClientes } from '@/hooks/useClientes';
import { Cliente, ClienteFormData } from '@/types/cliente';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { EnhancedClienteForm } from './EnhancedClienteForm';
import { QuickClienteCreator } from './QuickClienteCreator';

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

// Componente principal
export const ClienteProfileView: React.FC = () => {
  const {
    clientes,
    clienteSeleccionado,
    activities,
    loading,
    loadingActivities,
    error,
    hasMore,
    total,
    loadClientes,
    loadMoreClientes,
    selectCliente,
    createCliente,
    updateCliente,
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
  } = useClientes();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEnhancedCreateModal, setShowEnhancedCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  // Manejar búsqueda
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

  // Manejar selección de cliente
  const handleSelectCliente = async (cliente: Cliente) => {
    setSelectedCliente(cliente);
    await selectCliente(cliente.id);
    setShowDetailModal(true);
    setShowSearchResults(false);
  };

  // Manejar creación de cliente
  const handleCreateCliente = async () => {
    try {
      const clienteId = await createCliente(formData);
      if (clienteId) {
        setShowCreateModal(false);
        resetForm();
        await loadClientes();
      }
    } catch (error) {
      console.error('Error creating cliente:', error);
    }
  };

  // Manejar edición de cliente
  const handleEditCliente = async () => {
    if (!selectedCliente) return;

    try {
      const success = await updateCliente(selectedCliente.id, formData);
      if (success) {
        setShowEditModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error updating cliente:', error);
    }
  };

  // Manejar eliminación de cliente
  const handleDeleteCliente = async () => {
    if (!selectedCliente) return;

    try {
      const success = await deleteCliente(selectedCliente.id);
      if (success) {
        setShowDeleteModal(false);
        setSelectedCliente(null);
      }
    } catch (error) {
      console.error('Error deleting cliente:', error);
    }
  };

  // Manejar cambio de estado
  const handleToggleEstado = async (cliente: Cliente) => {
    const nuevoEstado = cliente.estado === 'activo' ? 'inactivo' : 'activo';
    await updateEstadoCliente(cliente.id, nuevoEstado);
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
        // Actualizar cliente seleccionado
        await selectCliente(selectedCliente.id);
      }
    } catch (error) {
      console.error('Error registering compra:', error);
    }
  };

  // Resetear formulario
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

  // Abrir modal de edición
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

  // Manejar creación de cliente con formulario mejorado
  const handleEnhancedCreateCliente = async () => {
    try {
      const clienteId = await createCliente(formData);
      if (clienteId) {
        setShowEnhancedCreateModal(false);
        resetForm();
        await loadClientes();
      }
    } catch (error) {
      console.error('Error creating cliente:', error);
    }
  };

  // Manejar subida de imagen en formulario
  const handleImageUpload = async (file: File) => {
    // Esta función se puede implementar para subir imagen durante la creación
    // Por ahora solo mostramos el preview
    console.log('Image upload:', file);
  };

  if (loading && clientes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
              <RefreshCw size={32} className="text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Cargando clientes...
            </h3>
            <p className="text-slate-600">Obteniendo información de clientes</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
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
                            <User size={16} className="text-slate-400" />
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
                    setShowEnhancedCreateModal(true);
                    resetForm();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Zap size={14} />
                  Formulario completo
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid size={16} />
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

        {/* Filters Panel */}
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

      {/* Clientes List */}
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

      {/* Modal de crear cliente */}
      <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus size={20} />
              Nuevo Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre completo *"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre del cliente"
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

              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
              />

              <Input
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Dirección completa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Notas adicionales sobre el cliente..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Configuración de comunicación
              </label>
              <div className="space-y-3">
                {[
                  { key: 'recibirNotificaciones', label: 'Recibir notificaciones' },
                  { key: 'recibirPromociones', label: 'Recibir promociones' },
                  { key: 'recibirEmail', label: 'Comunicación por email' },
                  { key: 'recibirSMS', label: 'Comunicación por SMS' },
                ].map((config) => (
                  <div key={config.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{config.label}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          [config.key]: !prev.configuracion[config.key as keyof typeof prev.configuracion]
                        }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.configuracion[config.key as keyof typeof formData.configuracion]
                          ? 'bg-purple-600' 
                          : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.configuracion[config.key as keyof typeof formData.configuracion]
                            ? 'translate-x-6' 
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
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCliente}
              loading={loading}
              disabled={!formData.nombre || !formData.email}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Crear Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de crear cliente mejorado */}
      <Dialog open={showEnhancedCreateModal} onClose={() => setShowEnhancedCreateModal(false)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap size={20} />
              Crear Nuevo Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[70vh]">
            <EnhancedClienteForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleEnhancedCreateCliente}
              onCancel={() => {
                setShowEnhancedCreateModal(false);
                resetForm();
              }}
              loading={loading}
              onImageUpload={handleImageUpload}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de editar cliente */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 size={20} />
              Editar Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre completo *"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre del cliente"
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

              <Input
                label="Fecha de nacimiento"
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
              />

              <Input
                label="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="Dirección completa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Notas adicionales sobre el cliente..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Configuración de comunicación
              </label>
              <div className="space-y-3">
                {[
                  { key: 'recibirNotificaciones', label: 'Recibir notificaciones' },
                  { key: 'recibirPromociones', label: 'Recibir promociones' },
                  { key: 'recibirEmail', label: 'Comunicación por email' },
                  { key: 'recibirSMS', label: 'Comunicación por SMS' },
                ].map((config) => (
                  <div key={config.key} className="flex items-center justify-between">
                    <span className="text-sm text-slate-700">{config.label}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        configuracion: {
                          ...prev.configuracion,
                          [config.key]: !prev.configuracion[config.key as keyof typeof prev.configuracion]
                        }
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.configuracion[config.key as keyof typeof formData.configuracion]
                          ? 'bg-purple-600' 
                          : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.configuracion[config.key as keyof typeof formData.configuracion]
                            ? 'translate-x-6' 
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
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditCliente}
              loading={loading}
              disabled={!formData.nombre || !formData.email}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de eliminar cliente */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 size={20} />
              Eliminar Cliente
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
              <div>
                <p className="font-medium text-red-800">
                  ¿Estás seguro de que deseas eliminar este cliente?
                </p>
                <p className="text-red-600 text-sm mt-1">
                  Esta acción no se puede deshacer. Se eliminarán todos los datos asociados.
                </p>
              </div>
            </div>

            {selectedCliente && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                    {selectedCliente.avatar ? (
                      <Image
                        src={selectedCliente.avatar}
                        alt={selectedCliente.nombre}
                        className="w-full h-full object-cover rounded-lg"
                        width={48}
                        height={48}
                      />
                    ) : (
                      <User size={20} className="text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{selectedCliente.nombre}</p>
                    <p className="text-sm text-slate-500">{selectedCliente.email}</p>
                    <p className="text-sm text-slate-500">
                      {selectedCliente.totalCompras} compras • ${selectedCliente.montoTotalGastado.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteCliente}
              loading={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalle del cliente */}
      <Dialog open={showDetailModal} onClose={() => setShowDetailModal(false)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User size={20} />
              Perfil del Cliente
            </DialogTitle>
          </DialogHeader>

          {clienteSeleccionado && (
            <div className="space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Header del cliente */}
              <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl">
                <div className="relative">
                  <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                    {clienteSeleccionado.avatar ? (
                      <Image
                        src={clienteSeleccionado.avatar}
                        alt={clienteSeleccionado.nombre}
                        className="w-full h-full object-cover"
                        width={96}
                        height={96}
                      />
                    ) : (
                      <User size={32} className="text-slate-400" />
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
                        }
                      };
                      input.click();
                    }}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-white shadow-lg rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    <Camera size={14} />
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">
                        {clienteSeleccionado.nombre}
                      </h2>
                      <p className="text-slate-600 mb-3">{clienteSeleccionado.email}</p>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${
                          clienteSeleccionado.estado === 'activo' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : clienteSeleccionado.estado === 'suspendido'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}>
                          {clienteSeleccionado.estado === 'activo' && <CheckCircle size={14} />}
                          {clienteSeleccionado.estado === 'suspendido' && <XCircle size={14} />}
                          {clienteSeleccionado.estado === 'inactivo' && <Pause size={14} />}
                          {clienteSeleccionado.estado.charAt(0).toUpperCase() + clienteSeleccionado.estado.slice(1)}
                        </div>
                        
                        <span className="text-sm text-slate-500">
                          Cliente desde {format(clienteSeleccionado.creadoEn.toDate(), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>

                      {/* Información de contacto */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {clienteSeleccionado.telefono && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} />
                            <span>{clienteSeleccionado.telefono}</span>
                          </div>
                        )}
                        {clienteSeleccionado.direccion && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin size={14} />
                            <span>{clienteSeleccionado.direccion}</span>
                          </div>
                        )}
                        {clienteSeleccionado.fechaNacimiento && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Calendar size={14} />
                            <span>
                              {format(clienteSeleccionado.fechaNacimiento.toDate(), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                        )}
                        {clienteSeleccionado.ultimoAcceso && (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock size={14} />
                            <span>
                              Último acceso: {format(clienteSeleccionado.ultimoAcceso.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit3 size={14} />}
                        onClick={() => {
                          setShowDetailModal(false);
                          openEditModal(clienteSeleccionado);
                        }}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<ShoppingBag size={14} />}
                        onClick={() => setShowCompraModal(true)}
                        className="bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                      >
                        Registrar Compra
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas del cliente */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag size={20} className="text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {clienteSeleccionado.totalCompras}
                  </div>
                  <div className="text-sm text-slate-500">Total Compras</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <DollarSign size={20} className="text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    ${clienteSeleccionado.montoTotalGastado.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">Total Gastado</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Gift size={20} className="text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {clienteSeleccionado.beneficiosUsados}
                  </div>
                  <div className="text-sm text-slate-500">Beneficios Usados</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <TrendingUp size={20} className="text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    ${clienteSeleccionado.promedioCompra.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-500">Promedio Compra</div>
                </div>
              </div>

              {/* Actividad reciente */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity size={20} />
                    Actividad Reciente
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw size={14} />}
                    onClick={() => loadClienteActivities(clienteSeleccionado.id)}
                    loading={loadingActivities}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Actualizar
                  </Button>
                </div>

                {loadingActivities ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          activity.tipo === 'compra' ? 'bg-emerald-100 text-emerald-600' :
                          activity.tipo === 'beneficio' ? 'bg-purple-100 text-purple-600' :
                          activity.tipo === 'visita' ? 'bg-blue-100 text-blue-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {activity.tipo === 'compra' && <ShoppingBag size={16} />}
                          {activity.tipo === 'beneficio' && <Gift size={16} />}
                          {activity.tipo === 'visita' && <Eye size={16} />}
                          {activity.tipo === 'registro' && <UserPlus size={16} />}
                          {activity.tipo === 'actualizacion' && <Edit3 size={16} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 text-sm">
                            {activity.descripcion}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {format(activity.fecha.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </span>
                            {activity.monto && (
                              <span className="text-xs font-medium text-emerald-600">
                                ${activity.monto.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity size={32} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No hay actividad reciente</p>
                  </div>
                )}
              </div>

              {/* Notas y tags */}
              {(clienteSeleccionado.notas || (clienteSeleccionado.tags && clienteSeleccionado.tags.length > 0)) && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">
                    Información Adicional
                  </h3>
                  
                  {clienteSeleccionado.notas && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Notas</h4>
                      <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">
                        {clienteSeleccionado.notas}
                      </p>
                    </div>
                  )}

                  {clienteSeleccionado.tags && clienteSeleccionado.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {clienteSeleccionado.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200"
                          >
                            <Tag size={12} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Configuración de comunicación */}
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Settings size={20} />
                  Configuración de Comunicación
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { 
                      key: 'recibirNotificaciones', 
                      label: 'Notificaciones', 
                      icon: <Bell size={16} />,
                      enabled: clienteSeleccionado.configuracion.recibirNotificaciones 
                    },
                    { 
                      key: 'recibirPromociones', 
                      label: 'Promociones', 
                      icon: <Gift size={16} />,
                      enabled: clienteSeleccionado.configuracion.recibirPromociones 
                    },
                    { 
                      key: 'recibirEmail', 
                      label: 'Email', 
                      icon: <Mail size={16} />,
                      enabled: clienteSeleccionado.configuracion.recibirEmail 
                    },
                    { 
                      key: 'recibirSMS', 
                      label: 'SMS', 
                      icon: <MessageSquare size={16} />,
                      enabled: clienteSeleccionado.configuracion.recibirSMS 
                    },
                  ].map((config) => (
                    <div key={config.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        config.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {config.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{config.label}</p>
                        <p className={`text-xs ${config.enabled ? 'text-emerald-600' : 'text-slate-500'}`}>
                          {config.enabled ? 'Habilitado' : 'Deshabilitado'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailModal(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de registrar compra */}
      <Dialog open={showCompraModal} onClose={() => setShowCompraModal(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag size={20} />
              Registrar Compra
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedCliente && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <User size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-purple-900">{selectedCliente.nombre}</p>
                    <p className="text-sm text-purple-600">{selectedCliente.email}</p>
                  </div>
                </div>
              </div>
            )}

            <Input
              label="Monto de la compra *"
              type="number"
              value={compraData.monto}
              onChange={(e) => setCompraData(prev => ({ ...prev, monto: e.target.value }))}
              placeholder="0.00"
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={compraData.descripcion}
                onChange={(e) => setCompraData(prev => ({ ...prev, descripcion: e.target.value }))}
                placeholder="Descripción de la compra..."
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-purple-600" />
                <span className="text-sm font-medium text-slate-700">
                  ¿Se usó un beneficio?
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCompraData(prev => ({ ...prev, beneficioUsado: !prev.beneficioUsado }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  compraData.beneficioUsado ? 'bg-purple-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    compraData.beneficioUsado ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompraModal(false);
                setCompraData({ monto: '', beneficioUsado: false, descripcion: '' });
              }}
              className="border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRegistrarCompra}
              loading={loading}
              disabled={!compraData.monto}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Registrar Compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Componente de creación rápida flotante */}
      <QuickClienteCreator
        onCreateCliente={createCliente}
        loading={loading}
      />
    </div>
  );
};