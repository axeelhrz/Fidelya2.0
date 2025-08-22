import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Unlink,
  Mail,
  Phone,
  MapPin,
  Star,
  Check,
  X,
  AlertTriangle,
  Users,
  ArrowRight,
  Edit,
  Trash2,
  QrCode,
  FileText,
  Power,
  PowerOff,
  Pause,
  Gift,
  Percent,
  DollarSign,
  Package,
  Eye,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
  Grid3X3,
  List,
  Download
} from 'lucide-react';
import { useComercios } from '@/hooks/useComercios';
import { ComercioDisponible } from '@/services/adhesion.service';
import type { Comercio } from '@/services/comercio.service';
import { Beneficio } from '@/types/beneficio';
import { BeneficiosService } from '@/services/beneficios.service';
import { VincularComercioDialog } from './VincularComercioDialog';
import { CreateComercioDialog } from './CreateComercioDialog';
import { EditComercioDialog } from './EditComercioDialog';
import { QRGeneratorModal } from './QRGeneratorModal';
import { ComercioValidationsModal } from './ComercioValidationsModal';
import { ComerciosBeneficiosModal } from './ComerciosBeneficiosModal';
import { formatCurrency } from '@/lib/utils';

interface ComercioManagementProps {
  onNavigate?: (section: string) => void;
}

interface ComercioConBeneficios extends ComercioDisponible {
  beneficios?: Beneficio[];
  loadingBeneficios?: boolean;
  showBeneficios?: boolean;
  beneficiosActivosReales?: number;
}

// Modern Stats Card Component - REMOVED ALL PERCENTAGES AND TRENDS
const ModernStatsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600'
    },
    green: {
      bg: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      textColor: 'text-emerald-600'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-600'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600'
    }
  };

  const classes = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative bg-white/80 backdrop-blur-xl rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${classes.bg} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <div className={`w-10 h-10 lg:w-12 lg:h-12 ${classes.iconBg} rounded-lg lg:rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300`}>
            <div className={`${classes.iconColor} text-sm lg:text-base`}>
              {icon}
            </div>
          </div>
        </div>
        
        <div className="space-y-1 lg:space-y-2">
          <p className="text-xs lg:text-sm font-medium text-slate-600">{title}</p>
          <p className={`text-xl lg:text-3xl font-bold ${classes.textColor}`}>
            {value.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </motion.div>
  );
};

// Modern Search and Filter Component with improved mobile design
const ModernSearchFilter: React.FC<{
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategoria: string;
  onCategoriaChange: (value: string) => void;
  selectedEstado: string;
  onEstadoChange: (value: string) => void;
  categorias: string[];
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}> = ({
  searchTerm,
  onSearchChange,
  selectedCategoria,
  onCategoriaChange,
  selectedEstado,
  onEstadoChange,
  categorias,
  showFilters,
  onToggleFilters,
  onClearFilters
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl lg:rounded-2xl border border-white/20 shadow-xl p-4 lg:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search */}
        <div className="relative flex-1 max-w-full lg:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 lg:pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 lg:h-5 lg:w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar comercios..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 lg:pl-12 pr-4 py-2.5 lg:py-3 bg-slate-50/50 border border-slate-200 rounded-lg lg:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-slate-400 text-sm lg:text-base"
          />
        </div>

        {/* Filter Button */}
        <div className="flex items-center justify-between lg:justify-end space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleFilters}
            className={`inline-flex items-center px-4 py-2.5 lg:py-3 rounded-lg lg:rounded-xl text-sm font-medium transition-all duration-200 ${
              showFilters 
                ? 'bg-blue-100 border-blue-200 text-blue-700 shadow-lg' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-md'
            } border`}
          >
            <Filter className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Filtros</span>
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
            className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-slate-200"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categoría
                </label>
                <select
                  value={selectedCategoria}
                  onChange={(e) => onCategoriaChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm lg:text-base"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Estado
                </label>
                <select
                  value={selectedEstado}
                  onChange={(e) => onEstadoChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm lg:text-base"
                >
                  <option value="">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="suspendido">Suspendido</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-2 flex items-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClearFilters}
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
  );
};

// Enhanced Beneficio Card Component
const BeneficioCard: React.FC<{ beneficio: Beneficio }> = ({ beneficio }) => {
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje':
        return <Percent className="w-3 h-3" />;
      case 'monto_fijo':
        return <DollarSign className="w-3 h-3" />;
      case 'producto_gratis':
        return <Package className="w-3 h-3" />;
      default:
        return <Gift className="w-3 h-3" />;
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-50 to-white rounded-lg lg:rounded-xl p-3 lg:p-4 border border-slate-200 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-2 lg:mb-3">
        <div className="flex items-center space-x-2 lg:space-x-3">
          <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
            <div className="text-blue-600">
              {getTipoIcon(beneficio.tipo)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs lg:text-sm font-semibold text-slate-900 truncate">
              {beneficio.titulo}
            </h4>
            {beneficio.destacado && (
              <div className="flex items-center mt-1">
                <Star className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-500 fill-current" />
                <span className="text-xs text-amber-600 ml-1">Destacado</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs lg:text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
            {formatDescuento(beneficio)}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-slate-600 mb-2 lg:mb-3 line-clamp-2">
        {beneficio.descripcion}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 lg:space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium border ${getEstadoColor(beneficio.estado)}`}>
            {beneficio.estado}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-200">
            {beneficio.categoria}
          </span>
        </div>
        
        <div className="flex items-center text-xs text-slate-500">
          <Users className="w-3 h-3 mr-1" />
          <span>{beneficio.usosActuales || 0}</span>
        </div>
      </div>
    </motion.div>
  );
};

export const ComercioManagement: React.FC<ComercioManagementProps> = ({ 
  onNavigate
}) => {
  const {
    comerciosVinculados,
    stats,
    loading,
    error,
    createComercio,
    updateComercio,
    deleteComercio,
    changeComercioStatus,
    buscarComercios,
    vincularComercio,
    desvincularComercio,
    generateQRCode,
    generateBatchQRCodes,
    getComercioValidations,
    clearError
  } = useComercios();

  const [vincularDialogOpen, setVincularDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [validationsModalOpen, setValidationsModalOpen] = useState(false);
  const [beneficiosModalOpen, setBeneficiosModalOpen] = useState(false);
  const [selectedComercio, setSelectedComercio] = useState<Comercio | null>(null);
  const [selectedComercioForQR, setSelectedComercioForQR] = useState<{
    id: string;
    nombreComercio: string;
    qrCode?: string;
    qrCodeUrl?: string;
  } | null>(null);
  const [selectedComercioForBeneficios, setSelectedComercioForBeneficios] = useState<{
    id: string;
    nombreComercio: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [comercioToUnlink, setComercioToUnlink] = useState<ComercioDisponible | null>(null);
  const [comercioToDelete, setComercioToDelete] = useState<ComercioDisponible | null>(null);
  const [selectedComercios, setSelectedComercios] = useState<string[]>([]);
  
  // Estado para manejar los beneficios de cada comercio con conteo real
  const [comerciosConBeneficios, setComerciossConBeneficios] = useState<ComercioConBeneficios[]>([]);

  // Cargar beneficios reales para cada comercio vinculado
  useEffect(() => {
    const cargarBeneficiosRealesParaComercios = async () => {
      if (comerciosVinculados.length === 0) {
        setComerciossConBeneficios([]);
        return;
      }

      // Inicializar comercios con estado de carga
      const comerciosConEstado: ComercioConBeneficios[] = comerciosVinculados.map(comercio => ({
        ...comercio,
        beneficios: [],
        loadingBeneficios: true,
        showBeneficios: false,
        beneficiosActivosReales: 0
      }));
      
      setComerciossConBeneficios(comerciosConEstado);

      // Cargar beneficios reales para cada comercio
      for (const comercio of comerciosVinculados) {
        try {
          // Obtener TODOS los beneficios del comercio
          const todosBeneficios = await BeneficiosService.obtenerBeneficiosPorComercio(comercio.id);
          
          // Filtrar solo beneficios activos para mostrar
          const beneficiosActivos = todosBeneficios.filter(b => b.estado === 'activo');
          
          // Contar beneficios activos reales
          const beneficiosActivosReales = beneficiosActivos.length;
          
          setComerciossConBeneficios(prev => 
            prev.map(c => 
              c.id === comercio.id 
                ? { 
                    ...c, 
                    beneficios: beneficiosActivos.slice(0, 3), // Solo mostrar 3 para preview
                    beneficiosActivosReales, // Conteo real de beneficios activos
                    loadingBeneficios: false 
                  }
                : c
            )
          );
        } catch (error) {
          console.error(`Error cargando beneficios para comercio ${comercio.id}:`, error);
          setComerciossConBeneficios(prev => 
            prev.map(c => 
              c.id === comercio.id 
                ? { 
                    ...c, 
                    beneficios: [], 
                    beneficiosActivosReales: 0,
                    loadingBeneficios: false 
                  }
                : c
            )
          );
        }
      }
    };

    cargarBeneficiosRealesParaComercios();
  }, [comerciosVinculados]);

  // Función para alternar la visualización de beneficios
  const toggleBeneficios = (comercioId: string) => {
    setComerciossConBeneficios(prev => 
      prev.map(c => 
        c.id === comercioId 
          ? { ...c, showBeneficios: !c.showBeneficios }
          : c
      )
    );
  };

  // Filtrar comercios vinculados
  const comerciosFiltrados = comerciosConBeneficios.filter(comercio => {
    const matchesSearch = !searchTerm || 
      comercio.nombreComercio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comercio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comercio.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = !selectedCategoria || comercio.categoria === selectedCategoria;
    const matchesEstado = !selectedEstado || comercio.estado === selectedEstado;
    
    return matchesSearch && matchesCategoria && matchesEstado;
  });

  // Obtener categorías únicas
  const categorias = Array.from(new Set(comerciosVinculados.map(c => c.categoria)));

  // Calculate real stats based on actual data - NO TRENDS OR PERCENTAGES
  const realStats = {
    totalComercios: comerciosVinculados.length,
    comerciosActivos: comerciosVinculados.filter(c => c.estado === 'activo').length,
    comerciosInactivos: comerciosVinculados.filter(c => c.estado === 'inactivo').length,
    comerciosSuspendidos: comerciosVinculados.filter(c => c.estado === 'suspendido').length,
    categorias: Object.keys(stats.categorias).length
  };

  // Nueva función para manejar ver beneficios
  const handleViewBeneficios = (comercio: ComercioDisponible) => {
    setSelectedComercioForBeneficios({
      id: comercio.id,
      nombreComercio: comercio.nombreComercio
    });
    setBeneficiosModalOpen(true);
  };

  // Manejar desvinculación
  const handleDesvincular = async (comercio: ComercioDisponible) => {
    const success = await desvincularComercio(comercio.id);
    if (success) {
      setComercioToUnlink(null);
    }
  };

  // Manejar eliminación
  const handleDelete = async (comercio: ComercioDisponible) => {
    const success = await deleteComercio(comercio.id);
    if (success) {
      setComercioToDelete(null);
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = async (comercio: ComercioDisponible, newStatus: 'activo' | 'inactivo' | 'suspendido') => {
    await changeComercioStatus(comercio.id, newStatus);
  };

  // Manejar edición
  const handleEdit = (comercio: ComercioDisponible) => {
    const comercioForEdit: Comercio = {
      id: comercio.id,
      nombreComercio: comercio.nombreComercio,
      categoria: comercio.categoria,
      descripcion: comercio.descripcion || '',
      direccion: comercio.direccion || '',
      telefono: comercio.telefono || '',
      email: comercio.email,
      sitioWeb: comercio.sitioWeb || '',
      horario: comercio.horario || '',
      cuit: comercio.cuit || '',
      logo: comercio.logoUrl,
      banner: comercio.imagenPrincipalUrl || '',
      estado: comercio.estado,
      visible: comercio.visible,
      asociacionesVinculadas: comercio.asociacionesVinculadas,
      qrCode: comercio.qrCode || '',
      qrCodeUrl: comercio.qrCodeUrl || '',
      beneficiosActivos: comercio.beneficiosActivos,
      validacionesRealizadas: comercio.validacionesRealizadas,
      clientesAtendidos: comercio.clientesAtendidos,
      ingresosMensuales: comercio.ingresosMensuales,
      rating: comercio.rating,
      configuracion: comercio.configuracion || {
        notificacionesEmail: true,
        notificacionesWhatsApp: false,
        autoValidacion: false,
        requiereAprobacion: true,
      },
      creadoEn: comercio.creadoEn.toDate(),
      actualizadoEn: comercio.actualizadoEn?.toDate() || new Date(),
      metadata: {}
    };
    setSelectedComercio(comercioForEdit);
    setEditDialogOpen(true);
  };

  // Manejar ver validaciones
  const handleViewValidations = (comercio: ComercioDisponible) => {
    const comercioForValidations: Comercio = {
      id: comercio.id,
      nombreComercio: comercio.nombreComercio,
      categoria: comercio.categoria,
      descripcion: comercio.descripcion || '',
      direccion: comercio.direccion || '',
      telefono: comercio.telefono || '',
      email: comercio.email,
      sitioWeb: comercio.sitioWeb || '',
      horario: comercio.horario || '',
      cuit: comercio.cuit || '',
      logo: comercio.logoUrl,
      banner: comercio.imagenPrincipalUrl || '',
      estado: comercio.estado,
      visible: comercio.visible,
      asociacionesVinculadas: comercio.asociacionesVinculadas,
      qrCode: comercio.qrCode || '',
      qrCodeUrl: comercio.qrCodeUrl || '',
      beneficiosActivos: comercio.beneficiosActivos,
      validacionesRealizadas: comercio.validacionesRealizadas,
      clientesAtendidos: comercio.clientesAtendidos,
      ingresosMensuales: comercio.ingresosMensuales,
      rating: comercio.rating,
      configuracion: comercio.configuracion || {
        notificacionesEmail: true,
        notificacionesWhatsApp: false,
        autoValidacion: false,
        requiereAprobacion: true,
      },
      creadoEn: comercio.creadoEn.toDate(),
      actualizadoEn: comercio.actualizadoEn?.toDate() || new Date(),
      metadata: {}
    };
    setSelectedComercio(comercioForValidations);
    setValidationsModalOpen(true);
  };

  // Manejar generación de QR individual
  const handleGenerateQR = async (comercio: ComercioDisponible) => {
    setSelectedComercioForQR({
      id: comercio.id,
      nombreComercio: comercio.nombreComercio,
      qrCode: comercio.qrCode,
      qrCodeUrl: comercio.qrCodeUrl
    });
    setQrModalOpen(true);
  };

  // Función para generar QR desde el modal
  const handleGenerateQRFromModal = async (comercioId: string): Promise<{ qrCode: string; qrCodeUrl: string }> => {
    const result = await generateQRCode(comercioId);
    if (result === null) {
      throw new Error('No se pudo generar el código QR');
    }
    return { qrCode: result, qrCodeUrl: result };
  };

  // Manejar generación de QR masiva
  const handleBatchQRGeneration = async () => {
    if (selectedComercios.length === 0) {
      alert('Selecciona al menos un comercio');
      return;
    }

    const results = await generateBatchQRCodes(selectedComercios);
    
    if (results.length > 0) {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      results.forEach(result => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new window.Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob(blob => {
            if (blob) {
              zip.file(`QR_${result.nombreComercio}.png`, blob);
            }
          });
        };
        
        img.src = result.qrCodeDataURL;
      });

      setTimeout(async () => {
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `QR_Codes_${new Date().toISOString().split('T')[0]}.zip`;
        link.click();
      }, 1000);
    }
  };

  // Manejar selección múltiple
  const handleSelectComercio = (comercioId: string, selected: boolean) => {
    if (selected) {
      setSelectedComercios(prev => [...prev, comercioId]);
    } else {
      setSelectedComercios(prev => prev.filter(id => id !== comercioId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedComercios(comerciosFiltrados.map(c => c.id));
    } else {
      setSelectedComercios([]);
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <Zap className="w-4 h-4 text-emerald-600" />;
      case 'inactivo':
        return <PowerOff className="w-4 h-4 text-slate-600" />;
      case 'suspendido':
        return <Pause className="w-4 h-4 text-amber-600" />;
      default:
        return <Power className="w-4 h-4 text-slate-600" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inactivo':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'suspendido':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Modern Stats Cards - NO TRENDS OR PERCENTAGES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <ModernStatsCard
          title="Total Comercios"
          value={realStats.totalComercios}
          icon={<Store className="w-5 h-5 lg:w-6 lg:h-6" />}
          color="blue"
        />
        <ModernStatsCard
          title="Comercios Activos"
          value={realStats.comerciosActivos}
          icon={<Zap className="w-5 h-5 lg:w-6 lg:h-6" />}
          color="green"
        />
        <ModernStatsCard
          title="Comercios Inactivos"
          value={realStats.comerciosInactivos}
          icon={<PowerOff className="w-5 h-5 lg:w-6 lg:h-6" />}
          color="orange"
        />
        <ModernStatsCard
          title="Categorías"
          value={realStats.categorias}
          icon={<Activity className="w-5 h-5 lg:w-6 lg:h-6" />}
          color="purple"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
        {onNavigate && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('socios')}
            className="inline-flex items-center justify-center px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-all duration-200 shadow-lg"
          >
            <Users className="w-4 h-4 mr-2" />
            Ir a Socios
            <ArrowRight className="w-4 h-4 ml-2" />
          </motion.button>
        )}
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center justify-center px-4 lg:px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 border border-transparent rounded-xl text-sm font-medium text-white hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Comercio
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setVincularDialogOpen(true)}
            className="inline-flex items-center justify-center px-4 lg:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border border-transparent rounded-xl text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-blue-500/25"
          >
            <Store className="w-4 h-4 mr-2" />
            Vincular Existente
          </motion.button>
        </div>
      </div>

      {/* Modern Search and Filters */}
      <ModernSearchFilter
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategoria={selectedCategoria}
        onCategoriaChange={setSelectedCategoria}
        selectedEstado={selectedEstado}
        onEstadoChange={setSelectedEstado}
        categorias={categorias}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={() => {
          setSearchTerm('');
          setSelectedCategoria('');
          setSelectedEstado('');
        }}
      />

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800 font-medium">{error}</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={clearError}
            className="text-red-600 hover:text-red-800 p-1 rounded-lg hover:bg-red-100 transition-all duration-200"
          >
            <X size={16} />
          </motion.button>
        </motion.div>
      )}

      {/* Comercios List */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl lg:rounded-2xl shadow-xl border border-white/20">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <span className="text-slate-600 font-medium">Cargando comercios...</span>
            </div>
          </div>
        ) : comerciosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {comerciosVinculados.length === 0 ? 'No hay comercios vinculados' : 'No se encontraron comercios'}
            </h3>
            <p className="text-slate-600 mb-8">
              {comerciosVinculados.length === 0 
                ? 'Comienza agregando tu primer comercio.'
                : 'Intenta ajustar los filtros de búsqueda.'
              }
            </p>
            {comerciosVinculados.length === 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCreateDialogOpen(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-medium shadow-lg hover:shadow-emerald-500/25 transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Agregar Comercio
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setVincularDialogOpen(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-200"
                >
                  <Store className="w-5 h-5 mr-2" />
                  Vincular Comercio Existente
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 lg:p-6">
            {/* Select All and Bulk Actions */}
            <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedComercios.length === comerciosFiltrados.length && comerciosFiltrados.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    Seleccionar todos ({comerciosFiltrados.length})
                  </span>
                </label>
                
                {selectedComercios.length > 0 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-slate-600">
                      {selectedComercios.length} seleccionados
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBatchQRGeneration}
                      className="inline-flex items-center px-3 lg:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 text-sm font-medium shadow-lg"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Generar QRs</span>
                      <Download className="w-4 h-4 sm:hidden" />
                    </motion.button>
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Grid3X3 size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <List size={16} />
                </motion.button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                {comerciosFiltrados.map((comercio, index) => (
                  <motion.div
                    key={comercio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-xl lg:rounded-2xl p-4 lg:p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedComercios.includes(comercio.id)}
                            onChange={(e) => handleSelectComercio(comercio.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                          />
                          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg lg:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            {comercio.logoUrl ? (
                              <Image
                                src={comercio.logoUrl}
                                alt={comercio.nombreComercio}
                                width={32}
                                height={32}
                                className="w-6 h-6 lg:w-8 lg:h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <Store className="w-5 h-5 lg:w-6 lg:h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm lg:text-lg font-semibold text-slate-900 truncate group-hover:text-blue-700 transition-colors duration-300">
                              {comercio.nombreComercio}
                            </h3>
                            <p className="text-xs lg:text-sm text-slate-500 truncate">{comercio.nombre}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(comercio.estado)}
                          <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Status and Category */}
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(comercio.estado)}`}>
                          {comercio.estado}
                        </span>
                        <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                      Categoría
                        </span>
                      </div>
                      
                      {/* Contact Info */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-xs lg:text-sm text-slate-600">
                          <Mail className="w-3 h-3 lg:w-4 lg:h-4 mr-2 text-slate-400" />
                          <span className="truncate">{comercio.email}</span>
                        </div>
                        {comercio.telefono && (
                          <div className="flex items-center text-xs lg:text-sm text-slate-600">
                            <Phone className="w-3 h-3 lg:w-4 lg:h-4 mr-2 text-slate-400" />
                            {comercio.telefono}
                          </div>
                        )}
                        {comercio.direccion && (
                          <div className="flex items-center text-xs lg:text-sm text-slate-600">
                            <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-2 text-slate-400" />
                            <span className="truncate">{comercio.direccion}</span>
                          </div>
                        )}
                        {comercio.puntuacion > 0 && (
                          <div className="flex items-center text-xs lg:text-sm text-slate-600">
                            <Star className="w-3 h-3 lg:w-4 lg:h-4 mr-2 text-amber-400 fill-current" />
                            {comercio.puntuacion.toFixed(1)} ({comercio.totalReviews} reseñas)
                          </div>
                        )}
                      </div>

                      {/* Benefits Section - FIXED WITH REAL COUNT */}
                      <div className="border-t border-slate-200 pt-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center text-xs lg:text-sm text-slate-700">
                            <Gift className="w-3 h-3 lg:w-4 lg:h-4 mr-2 text-purple-500" />
                            <span className="font-medium">Beneficios</span>
                            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                              {comercio.beneficiosActivosReales || 0}
                            </span>
                          </div>
                          {comercio.beneficios && comercio.beneficios.length > 0 && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleBeneficios(comercio.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm flex items-center p-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                            >
                              {comercio.showBeneficios ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </motion.button>
                          )}
                        </div>

                        {comercio.loadingBeneficios ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            <span className="ml-2 text-xs text-slate-500">Cargando beneficios...</span>
                          </div>
                        ) : comercio.beneficios && comercio.beneficios.length > 0 ? (
                          <AnimatePresence>
                            {comercio.showBeneficios && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-3"
                              >
                                {comercio.beneficios.map((beneficio) => (
                                  <BeneficioCard key={beneficio.id} beneficio={beneficio} />
                                ))}
                                {(comercio.beneficiosActivosReales || 0) > 3 && (
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleViewBeneficios(comercio)}
                                    className="w-full text-center py-3 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all duration-200 font-medium"
                                  >
                                    Ver todos los beneficios ({comercio.beneficiosActivosReales})
                                  </motion.button>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        ) : (
                          <div className="text-center py-4">
                            <Gift className="mx-auto h-6 w-6 lg:h-8 lg:w-8 text-slate-300 mb-2" />
                            <p className="text-xs text-slate-500">Sin beneficios activos</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                        <div className="flex items-center">
                          {comercio.verificado && (
                            <div className="flex items-center text-emerald-600">
                              <Check className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                              <span className="text-xs font-medium">Verificado</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewBeneficios(comercio)}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                            title="Ver todos los beneficios"
                          >
                            <Eye size={16} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleViewValidations(comercio)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Ver validaciones"
                          >
                            <FileText size={16} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleGenerateQR(comercio)}
                            className="p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            title="Generar QR"
                          >
                            <QrCode size={16} />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(comercio)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200"
                            title="Editar"
                          >
                            <Edit size={16} />
                          </motion.button>

                          {comercio.estado === 'activo' ? (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleStatusChange(comercio, 'inactivo')}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Desactivar"
                            >
                              <PowerOff size={16} />
                            </motion.button>
                          ) : (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleStatusChange(comercio, 'activo')}
                              className="p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                              title="Activar"
                            >
                              <Power size={16} />
                            </motion.button>
                          )}
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setComercioToUnlink(comercio)}
                            className="p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                            title="Desvincular"
                          >
                            <Unlink size={16} />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setComercioToDelete(comercio)}
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
            ) : (
              /* List View - Enhanced for mobile */
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 lg:px-6 py-3 lg:py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedComercios.length === comerciosFiltrados.length && comerciosFiltrados.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                        />
                      </th>
                      <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Comercio
                      </th>
                      <th className="hidden md:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Categoría
                      </th>
                      <th className="hidden lg:table-cell px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Contacto
                      </th>
                      <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="hidden sm:table-cell px-3 lg:px-6 py-3 lg:py-4">
                        <div className="max-w-xs">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Gift className="w-3 h-3 lg:w-4 lg:h-4 text-purple-500 mr-2" />
                              <span className="text-xs lg:text-sm font-semibold text-slate-900">
                                Beneficios
                              </span>
                              <span className="text-xs text-slate-500 ml-1">activos</span>
                            </div>
                          </div>
                        </div>
                      </th>
                      <th className="hidden xl:table-cell px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs font-semibold text-slate-600 uppercase tracking-wider">
                        Calificación
                      </th>
                      <th className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          {/* Table header actions should not reference 'comercio' */}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {comerciosFiltrados.map((comercio, index) => (
                      <motion.tr
                        key={comercio.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-slate-50 transition-colors duration-200"
                      >
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedComercios.includes(comercio.id)}
                            onChange={(e) => handleSelectComercio(comercio.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                          />
                        </td>
                        
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mr-3 lg:mr-4">
                              {comercio.logoUrl ? (
                                <Image
                                  src={comercio.logoUrl}
                                  alt={comercio.nombreComercio}
                                  width={24}
                                  height={24}
                                  className="w-5 h-5 lg:w-6 lg:h-6 rounded object-cover"
                                />
                              ) : (
                                <Store className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-xs lg:text-sm font-semibold text-slate-900">
                                {comercio.nombreComercio}
                              </div>
                              <div className="text-xs text-slate-500">{comercio.nombre}</div>
                              {/* Show category on mobile */}
                              <div className="md:hidden">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 mt-1">
                                  {comercio.categoria}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="hidden md:table-cell px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            {comercio.categoria}
                          </span>
                        </td>
                        
                        <td className="hidden lg:table-cell px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">{comercio.email}</div>
                          <div className="text-sm text-slate-500">{comercio.telefono || 'Sin teléfono'}</div>
                        </td>
                        
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(comercio.estado)}`}>
                              {comercio.estado}
                            </span>
                            {comercio.verificado && (
                              <Check className="w-3 h-3 lg:w-4 lg:h-4 text-emerald-600" />
                            )}
                          </div>
                        </td>

                        {/* Benefits Column - FIXED WITH REAL COUNT */}
                        <td className="hidden sm:table-cell px-3 lg:px-6 py-3 lg:py-4">
                          <div className="max-w-xs">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center">
                                <Gift className="w-3 h-3 lg:w-4 lg:h-4 text-purple-500 mr-2" />
                                <span className="text-xs lg:text-sm font-semibold text-slate-900">
                                  {comercio.beneficiosActivosReales || 0}
                                </span>
                                <span className="text-xs text-slate-500 ml-1">activos</span>
                              </div>
                              {comercio.beneficios && comercio.beneficios.length > 0 && (
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => toggleBeneficios(comercio.id)}
                                  className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-all duration-200"
                                >
                                  {comercio.showBeneficios ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </motion.button>
                              )}
                            </div>
                            
                            {comercio.loadingBeneficios ? (
                              <div className="flex items-center py-2">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600"></div>
                                <span className="ml-2 text-xs text-slate-500">Cargando...</span>
                              </div>
                            ) : comercio.beneficios && comercio.beneficios.length > 0 ? (
                              <AnimatePresence>
                                {comercio.showBeneficios && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-2"
                                  >
                                    {comercio.beneficios.slice(0, 2).map((beneficio) => (
                                      <div key={beneficio.id} className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                                        <div className="font-medium text-slate-900 truncate">
                                          {beneficio.titulo}
                                        </div>
                                        <div className="text-emerald-600 font-bold">
                                          {beneficio.tipo === 'porcentaje' ? `${beneficio.descuento}%` :
                                           beneficio.tipo === 'monto_fijo' ? formatCurrency(beneficio.descuento) :
                                           'Gratis'}
                                        </div>
                                      </div>
                                    ))}
                                    {(comercio.beneficiosActivosReales || 0) > 2 && (
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleViewBeneficios(comercio)}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                      >
                                        +{(comercio.beneficiosActivosReales || 0) - 2} más
                                      </motion.button>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            ) : (
                              <span className="text-xs text-slate-400">Sin beneficios</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="hidden xl:table-cell px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          {comercio.puntuacion > 0 ? (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-amber-400 fill-current mr-1" />
                              <span className="text-sm text-slate-900 font-medium">
                                {comercio.puntuacion.toFixed(1)}
                              </span>
                              <span className="text-sm text-slate-500 ml-1">
                                ({comercio.totalReviews})
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">Sin calificar</span>
                          )}
                        </td>
                        
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewBeneficios(comercio)}
                              className="p-1.5 lg:p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                              title="Ver todos los beneficios"
                            >
                              <Eye size={14} className="lg:w-4 lg:h-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewValidations(comercio)}
                              className="p-1.5 lg:p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                              title="Ver validaciones"
                            >
                              <FileText size={14} className="lg:w-4 lg:h-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleGenerateQR(comercio)}
                              className="p-1.5 lg:p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                              title="Generar QR"
                            >
                              <QrCode size={14} className="lg:w-4 lg:h-4" />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(comercio)}
                              className="p-1.5 lg:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200"
                              title="Editar"
                            >
                              <Edit size={14} className="lg:w-4 lg:h-4" />
                            </motion.button>

                            {comercio.estado === 'activo' ? (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusChange(comercio, 'inactivo')}
                                className="p-1.5 lg:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                                title="Desactivar"
                              >
                                <PowerOff size={14} className="lg:w-4 lg:h-4" />
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleStatusChange(comercio, 'activo')}
                                className="p-1.5 lg:p-2 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                title="Activar"
                              >
                                <Power size={14} className="lg:w-4 lg:h-4" />
                              </motion.button>
                            )}
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setComercioToUnlink(comercio)}
                              className="p-1.5 lg:p-2 text-orange-600 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-all duration-200"
                              title="Desvincular"
                            >
                              <Unlink size={14} className="lg:w-4 lg:h-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setComercioToDelete(comercio)}
                              className="p-1.5 lg:p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Eliminar"
                            >
                              <Trash2 size={14} className="lg:w-4 lg:h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateComercioDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={createComercio}
        loading={loading}
      />

      <VincularComercioDialog
        open={vincularDialogOpen}
        onClose={() => setVincularDialogOpen(false)}
        onVincular={vincularComercio}
        onBuscar={buscarComercios}
        loading={loading}
      />

      <EditComercioDialog
        open={editDialogOpen}
        comercio={selectedComercio}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedComercio(null);
        }}
        onSubmit={updateComercio}
        loading={loading}
      />

      <QRGeneratorModal
        open={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setSelectedComercioForQR(null);
        }}
        comercio={selectedComercioForQR}
        onGenerateQR={handleGenerateQRFromModal}
        loading={loading}
      />

      <ComercioValidationsModal
        open={validationsModalOpen}
        onClose={() => {
          setValidationsModalOpen(false);
          setSelectedComercio(null);
        }}
        comercio={selectedComercio ? {
          id: selectedComercio.id,
          nombreComercio: selectedComercio.nombreComercio
        } : null}
        onLoadValidations={async (comercioId, filters?, limit?) => {
          try {
            const adaptedFilters: Record<string, unknown> = {};
            if (filters?.fechaInicio) adaptedFilters.fechaDesde = filters.fechaInicio;
            if (filters?.fechaFin) adaptedFilters.fechaHasta = filters.fechaFin;
            if (filters?.estado) adaptedFilters.estado = filters.estado;
            if (filters?.socio) adaptedFilters.beneficioId = filters.socio;
            
            const result = await getComercioValidations(comercioId, adaptedFilters, limit);

            const validaciones = result.validaciones.map((validationData) => ({
              id: validationData.id,
              socioNombre: validationData.socioNombre,
              socioEmail: '',
              beneficioTitulo: validationData.beneficioTitulo,
              beneficioDescripcion: '',
              tipoDescuento: 'monto_fijo' as const,
              descuento: validationData.montoDescuento,
              montoOriginal: validationData.montoDescuento,
              montoFinal: 0,
              estado: validationData.estado,
              fechaValidacion: validationData.fechaValidacion,
              metodoPago: validationData.metodoPago,
              notas: validationData.notas,
            }));

            return {
              validaciones,
              total: validaciones.length,
              stats: {
                totalValidaciones: validaciones.length,
                exitosas: validaciones.filter(v => v.estado === 'exitosa').length,
                fallidas: validaciones.filter(v => v.estado === 'fallida').length,
                montoTotal: validaciones.reduce((sum, v) => sum + (v.descuento || 0), 0),
                ahorroTotal: validaciones.reduce((sum, v) => sum + (v.descuento || 0), 0),
              }
            };
          } catch (error) {
            console.error('Error loading validations:', error);
            return {
              validaciones: [],
              total: 0,
              stats: {
                totalValidaciones: 0,
                exitosas: 0,
                fallidas: 0,
                montoTotal: 0,
                ahorroTotal: 0,
              }
            };
          }
        }}
        loading={loading}
      />

      <ComerciosBeneficiosModal
        isOpen={beneficiosModalOpen}
        onClose={() => {
          setBeneficiosModalOpen(false);
          setSelectedComercioForBeneficios(null);
        }}
        comercio={selectedComercioForBeneficios}
      />

      {/* FIXED Unlink Confirmation Dialog - COMPLETELY CLEAR MODAL */}
      {comercioToUnlink && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Blurred backdrop only */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-md bg-white/30"
              onClick={() => setComercioToUnlink(null)}
            />

            {/* Clear, unblurred modal */}
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative inline-block align-bottom bg-white rounded-2xl lg:rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-6 lg:px-8 py-4 lg:py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-lg lg:rounded-xl flex items-center justify-center">
                        <Unlink className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg lg:text-2xl font-bold text-white">
                          Desvincular Comercio
                        </h3>
                        <p className="text-sm lg:text-base text-orange-100">
                          Esta acción no se puede deshacer
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setComercioToUnlink(null)}
                      className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 backdrop-blur-sm rounded-lg lg:rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
                    >
                      <X className="w-4 h-4 lg:w-5 lg:h-5" />
                    </motion.button>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full -translate-y-12 lg:-translate-y-16 translate-x-12 lg:translate-x-16" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 lg:w-24 lg:h-24 bg-white/10 rounded-full translate-y-8 lg:translate-y-12 -translate-x-8 lg:-translate-x-12" />
                </div>

                {/* Content */}
                <div className="bg-white px-6 lg:px-8 py-4 lg:py-6">
                  <div className="text-center mb-4 lg:mb-6">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-3 lg:mb-4">
                      <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-orange-600" />
                    </div>
                    <h4 className="text-base lg:text-lg font-semibold text-slate-900 mb-2">
                      ¿Confirmar desvinculación?
                    </h4>
                    <p className="text-sm lg:text-base text-slate-600">
                      ¿Estás seguro de que deseas desvincular a{' '}
                      <strong className="text-slate-900">{comercioToUnlink.nombreComercio}</strong> de tu asociación?
                    </p>
                    <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-amber-50 rounded-lg lg:rounded-xl border border-amber-200">
                      <p className="text-xs lg:text-sm text-amber-800">
                        <strong>Nota:</strong> El comercio seguirá existiendo pero ya no estará vinculado a tu asociación. 
                        Los beneficios activos se mantendrán pero no podrán crear nuevos beneficios para tu asociación.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 lg:px-8 py-4 lg:py-6 sm:flex sm:flex-row-reverse">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDesvincular(comercioToUnlink)}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-lg lg:rounded-xl border border-transparent shadow-sm px-4 lg:px-6 py-2.5 lg:py-3 bg-orange-600 text-sm lg:text-base font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto disabled:opacity-50 transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Desvinculando...
                      </>
                    ) : (
                      'Sí, Desvincular'
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setComercioToUnlink(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg lg:rounded-xl border border-slate-300 shadow-sm px-4 lg:px-6 py-2.5 lg:py-3 bg-white text-sm lg:text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto transition-all duration-200"
                  >
                    Cancelar
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatePresence>
      )}

      {/* FIXED Delete Confirmation Dialog - COMPLETELY CLEAR MODAL */}
      {comercioToDelete && (
        <AnimatePresence>
          <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Blurred backdrop only */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-md bg-white/30"
              onClick={() => setComercioToDelete(null)}
            />

            {/* Clear, unblurred modal */}
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="relative inline-block align-bottom bg-white rounded-2xl lg:rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-red-500 via-red-600 to-red-700 px-6 lg:px-8 py-4 lg:py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 backdrop-blur-sm rounded-lg lg:rounded-xl flex items-center justify-center">
                        <Trash2 className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg lg:text-2xl font-bold text-white">
                          Eliminar Comercio
                        </h3>
                        <p className="text-sm lg:text-base text-red-100">
                          Esta acción es permanente
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setComercioToDelete(null)}
                      className="w-8 h-8 lg:w-10 lg:h-10 bg-white/20 backdrop-blur-sm rounded-lg lg:rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
                    >
                      <X className="w-4 h-4 lg:w-5 lg:h-5" />
                    </motion.button>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 lg:w-32 lg:h-32 bg-white/10 rounded-full -translate-y-12 lg:-translate-y-16 translate-x-12 lg:translate-x-16" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 lg:w-24 lg:h-24 bg-white/10 rounded-full translate-y-8 lg:translate-y-12 -translate-x-8 lg:-translate-x-12" />
                </div>

                {/* Content */}
                <div className="bg-white px-6 lg:px-8 py-4 lg:py-6">
                  <div className="text-center mb-4 lg:mb-6">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-3 lg:mb-4">
                      <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
                    </div>
                    <h4 className="text-base lg:text-lg font-semibold text-slate-900 mb-2">
                      ¿Confirmar eliminación?
                    </h4>
                    <p className="text-sm lg:text-base text-slate-600">
                      ¿Estás seguro de que deseas eliminar a{' '}
                      <strong className="text-slate-900">{comercioToDelete.nombreComercio}</strong>?
                    </p>
                    <div className="mt-3 lg:mt-4 p-3 lg:p-4 bg-red-50 rounded-lg lg:rounded-xl border border-red-200">
                      <p className="text-xs lg:text-sm text-red-800">
                        <strong>¡Atención!</strong> Esta acción eliminará el comercio permanentemente de la base de datos. 
                        Todos los beneficios y validaciones asociados también serán eliminados completamente. 
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 lg:px-8 py-4 lg:py-6 sm:flex sm:flex-row-reverse">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(comercioToDelete)}
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-lg lg:rounded-xl border border-transparent shadow-sm px-4 lg:px-6 py-2.5 lg:py-3 bg-red-600 text-sm lg:text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Eliminando...
                      </>
                    ) : (
                      'Sí, Eliminar'
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setComercioToDelete(null)}
                    className="mt-3 w-full inline-flex justify-center rounded-lg lg:rounded-xl border border-slate-300 shadow-sm px-4 lg:px-6 py-2.5 lg:py-3 bg-white text-sm lg:text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto transition-all duration-200"
                  >
                    Cancelar
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </AnimatePresence>
      )}
    </div>
  );
};