'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Calendar, 
  Search, 
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  X,
  Info,
  DollarSign,
  Award,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useBeneficios } from '@/hooks/useBeneficios';
import { BeneficioUso } from '@/types/beneficio';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Interfaces
interface FilterState {
  search: string;
  dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month';
  comercio: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

interface HistorialStats {
  totalUsos: number;
  comerciosUnicos: number;
  usosEsteMes: number;
  totalAhorrado: number;
}

// Utility functions
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'valido':
    case 'usado':
      return <CheckCircle size={16} className="text-emerald-600" />;
    case 'invalido':
    case 'cancelado':
      return <XCircle size={16} className="text-red-600" />;
    case 'pendiente':
      return <Clock size={16} className="text-amber-600" />;
    default:
      return <CheckCircle size={16} className="text-emerald-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'valido':
    case 'usado':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'invalido':
    case 'cancelado':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'pendiente':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    default:
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  }
};

// Enhanced Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
}> = ({ title, value, icon, gradient, trend }) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-lg border border-white/10`}
  >
    <div className="flex items-center justify-between mb-2">
      <div className="p-2 bg-white/20 rounded-xl">
        {icon}
      </div>
      <span className="text-2xl font-bold">{value}</span>
    </div>
    <p className="text-sm opacity-90 font-medium">{title}</p>
    {trend && (
      <p className="text-xs opacity-75 mt-1">{trend}</p>
    )}
  </motion.div>
);

// Enhanced Filter Component
const FilterSection: React.FC<{
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  comercios: { id: string; nombre: string }[];
  onClearFilters: () => void;
}> = ({ filters, setFilters, comercios, onClearFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white via-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-lg p-6 mb-6 overflow-hidden relative"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full -translate-y-16 translate-x-16" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Filter size={20} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Filtros de Búsqueda</h3>
          </div>
          
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsExpanded(!isExpanded)}
              className="md:hidden bg-white/80 hover:bg-white border border-slate-200 rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'}
              <ChevronDown size={16} className={cn("transition-transform", isExpanded && "rotate-180")} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClearFilters}
              className="bg-red-50 hover:bg-red-100 border border-red-200 rounded-2xl px-4 py-2 text-sm font-medium text-red-600 transition-all duration-200 flex items-center gap-2 shadow-lg"
            >
              <X size={16} />
              Limpiar
            </motion.button>
          </div>
        </div>

        <div className={cn(
          "grid gap-4 transition-all duration-300",
          isExpanded ? "grid-cols-1 md:grid-cols-4" : "hidden md:grid md:grid-cols-4"
        )}>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar comercio o detalle..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
            />
          </div>

          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterState['dateRange'] }))}
            className="px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="week">Esta semana</option>
            <option value="month">Este mes</option>
          </select>

          <select
            value={filters.comercio}
            onChange={(e) => setFilters(prev => ({ ...prev, comercio: e.target.value }))}
            className="px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
          >
            <option value="">Todos los comercios</option>
            {comercios.map(comercio => (
              <option key={comercio.id} value={comercio.id}>{comercio.nombre}</option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
            className="px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
          >
            <option value="date_desc">Más recientes</option>
            <option value="date_asc">Más antiguos</option>
            <option value="amount_desc">Mayor ahorro</option>
            <option value="amount_asc">Menor ahorro</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced History Item Component
const HistoryItem: React.FC<{
  uso: BeneficioUso;
  onViewDetails: (uso: BeneficioUso) => void;
  index: number;
}> = ({ uso, onViewDetails, index }) => {
  const fechaUso = typeof uso.fechaUso?.toDate === 'function'
    ? uso.fechaUso.toDate()
    : new Date(uso.fechaUso as unknown as string | number | Date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="bg-gradient-to-br from-white via-slate-50 to-white rounded-2xl border border-slate-200/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300 overflow-hidden relative"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full translate-y-12 translate-x-12" />
      </div>

      <div className="relative z-10">
        <div className="flex items-start gap-4">
          {/* Enhanced Avatar */}
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
          >
            {(uso.comercioNombre || 'C').charAt(0)}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">
                  {uso.comercioNombre || 'Comercio'}
                </h3>
                <p className="text-slate-600">
                  {uso.detalles || 'Beneficio utilizado'}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600 mb-1 flex items-center gap-1">
                  <DollarSign size={20} />
                  {(uso.montoDescuento || 0).toLocaleString()}
                </div>
                <div className="text-sm text-slate-500">
                  {format(fechaUso, 'dd/MM/yyyy', { locale: es })}
                </div>
              </div>
            </div>

            {/* Enhanced Meta info */}
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
              <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                <Calendar size={14} />
                <span>{format(fechaUso, 'dd MMM yyyy', { locale: es })}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-lg">
                <Clock size={14} />
                <span>{format(fechaUso, 'HH:mm', { locale: es })}</span>
              </div>
            </div>

            {/* Enhanced Status and Actions */}
            <div className="flex items-center justify-between">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-medium shadow-sm",
                getStatusColor(uso.estado || 'usado')
              )}>
                {getStatusIcon(uso.estado || 'usado')}
                <span className="capitalize">{uso.estado === 'usado' ? 'Válido' : uso.estado || 'Válido'}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onViewDetails(uso)}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-4 py-2 rounded-2xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg"
              >
                <Eye size={16} />
                Ver detalles
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Enhanced Loading skeleton
const HistorialCardSkeleton = React.memo<{ index: number }>(({ index }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse shadow-lg"
  >
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 bg-slate-200 rounded-2xl"></div>
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-slate-200 rounded w-20"></div>
          <div className="h-6 bg-slate-200 rounded w-16"></div>
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="h-8 bg-slate-200 rounded w-24"></div>
        <div className="h-4 bg-slate-200 rounded w-20"></div>
      </div>
    </div>
  </motion.div>
));

HistorialCardSkeleton.displayName = 'HistorialCardSkeleton';

// Define a type for BeneficiosService on the window object
type BeneficiosServiceType = {
  clearCache?: (key: string) => void;
};

declare global {
  interface Window {
    BeneficiosService?: BeneficiosServiceType;
  }
}

export const SocioHistorial: React.FC = () => {
  const { beneficiosUsados, loading, error, refrescar } = useBeneficios();

  // Local state
  const [selectedUso, setSelectedUso] = useState<BeneficioUso | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: 'all',
    comercio: '',
    sortBy: 'date_desc'
  });

  // NUEVO: Función de reintento manual
  const handleRetry = useCallback(async () => {
    if (refreshing) return;
    
    try {
      setRefreshing(true);
      setRetryCount(prev => prev + 1);
      console.log(`🔄 [MANUAL] Reintento manual #${retryCount + 1}`);
      
      // Limpiar cache antes del reintento
      if (typeof window.BeneficiosService?.clearCache === 'function') {
        window.BeneficiosService?.clearCache?.('historial');
      }
      
      await refrescar();
      
      // Si el reintento fue exitoso, resetear el contador
      if (!error) {
        setRetryCount(0);
      }
    } catch (err) {
      console.error('Error en reintento manual:', err);
    } finally {
      setRefreshing(false);
    }
  }, [refrescar, refreshing, error, retryCount]);

  // Calculate stats
  const stats = useMemo<HistorialStats>(() => {
    const now = new Date();
    const thisMonth = startOfMonth(now);

    const usosEsteMes = beneficiosUsados.filter(uso => {
      const fechaUso = typeof uso.fechaUso?.toDate === 'function'
        ? uso.fechaUso.toDate()
        : new Date(uso.fechaUso as unknown as string | number | Date);
      return fechaUso >= thisMonth;
    });

    const comerciosUnicos = new Set(beneficiosUsados.map(uso => uso.comercioId)).size;
    const totalAhorrado = beneficiosUsados.reduce((sum, uso) => sum + (uso.montoDescuento || 0), 0);

    return {
      totalUsos: beneficiosUsados.length,
      comerciosUnicos,
      usosEsteMes: usosEsteMes.length,
      totalAhorrado
    };
  }, [beneficiosUsados]);

  // Filter and sort benefits
  const filteredUsos = useMemo(() => {
    let filtered = [...beneficiosUsados];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(uso => 
        (uso.detalles && uso.detalles.toLowerCase().includes(searchLower)) ||
        (uso.comercioNombre && uso.comercioNombre.toLowerCase().includes(searchLower))
      );
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      filtered = filtered.filter(uso => {
        const fechaUso = typeof uso.fechaUso?.toDate === 'function'
          ? uso.fechaUso.toDate()
          : new Date(uso.fechaUso as unknown as string | number | Date);
        
        switch (filters.dateRange) {
          case 'today':
            return isToday(fechaUso);
          case 'yesterday':
            return isYesterday(fechaUso);
          case 'week':
            return isThisWeek(fechaUso);
          case 'month':
            return isThisMonth(fechaUso);
          default:
            return true;
        }
      });
    }

    // Comercio filter
    if (filters.comercio) {
      filtered = filtered.filter(uso => uso.comercioId === filters.comercio);
    }

    // Sort
    filtered.sort((a, b) => {
      const fechaA = typeof a.fechaUso?.toDate === 'function'
        ? a.fechaUso.toDate()
        : new Date(a.fechaUso as unknown as string | number | Date);
      const fechaB = typeof b.fechaUso?.toDate === 'function'
        ? b.fechaUso.toDate()
        : new Date(b.fechaUso as unknown as string | number | Date);

      switch (filters.sortBy) {
        case 'date_desc':
          return fechaB.getTime() - fechaA.getTime();
        case 'date_asc':
          return fechaA.getTime() - fechaB.getTime();
        case 'amount_desc':
          return (b.montoDescuento || 0) - (a.montoDescuento || 0);
        case 'amount_asc':
          return (a.montoDescuento || 0) - (b.montoDescuento || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [beneficiosUsados, filters]);

  // Get unique comercios for filter
  const comercios = useMemo(() => {
    const uniqueComercios = beneficiosUsados.reduce((acc, uso) => {
      if (uso.comercioId && uso.comercioNombre && !acc.find(c => c.id === uso.comercioId)) {
        acc.push({ id: uso.comercioId, nombre: uso.comercioNombre });
      }
      return acc;
    }, [] as { id: string; nombre: string }[]);
    return uniqueComercios;
  }, [beneficiosUsados]);

  // Handlers
  const handleViewDetails = useCallback((uso: BeneficioUso) => {
    setSelectedUso(uso);
    setDetailModalOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      await refrescar();
      toast.success('Historial actualizado');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Error al actualizar');
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refrescar, refreshing]);

  const handleExport = useCallback(() => {
    toast.success('Exportando historial...');
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      dateRange: 'all',
      comercio: '',
      sortBy: 'date_desc'
    });
  }, []);

  // NUEVO: Error state mejorado con opciones de reintento
  if (error) {
    return (
      <div className="min-h-[400px] bg-gradient-to-br from-white via-red-50 to-white rounded-3xl border border-red-200/50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <AlertCircle size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Error al cargar historial</h3>
          <p className="text-slate-600 mb-4 text-sm leading-relaxed">{error}</p>
          
          {/* NUEVO: Información adicional para errores de timeout */}
          {error.includes('tardando') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Sugerencias:</p>
              <ul className="text-left space-y-1 text-xs">
                <li>• Verifica tu conexión a internet</li>
                <li>• Intenta cerrar y abrir la aplicación</li>
                <li>• Si el problema persiste, contacta soporte</li>
              </ul>
            </div>
          )}
          
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={handleRetry} 
              disabled={refreshing}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            >
              <RefreshCw size={16} className={cn("mr-2", refreshing && 'animate-spin')} />
              {refreshing ? 'Reintentando...' : `Reintentar${retryCount > 0 ? ` (${retryCount})` : ''}`}
            </Button>
            
            {retryCount > 2 && (
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={16} className="mr-2" />
                Recargar página
              </Button>
            )}
          </div>
          
          {retryCount > 1 && (
            <p className="text-xs text-slate-500 mt-3">
              Reintentos realizados: {retryCount}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white rounded-3xl border border-blue-200/50 overflow-hidden">
      {/* Enhanced Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-indigo-500/10 border-b border-purple-200/50 px-6 py-4 sticky top-0 z-30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <History size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mi Historial</h1>
              <p className="text-sm text-slate-600">Registro de beneficios usados</p>
            </div>
          </div>
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-white/80 hover:bg-white border border-slate-200 rounded-2xl shadow-lg backdrop-blur-sm"
          >
            <RefreshCw size={16} className={cn("text-slate-600", refreshing && 'animate-spin')} />
          </motion.button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enhanced Desktop Header */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <History size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 bg-clip-text text-transparent mb-2">
                  Historial de Usos
                </h2>
                <p className="text-slate-600 text-lg">Registro completo de todos tus beneficios utilizados</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                <RefreshCw size={16} className={cn("", refreshing && 'animate-spin')} />
                <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg"
              >
                <Download size={16} />
                <span>Exportar</span>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Usos"
            value={stats.totalUsos}
            icon={<History size={20} />}
            gradient="from-blue-500 to-indigo-500"
            trend="Histórico completo"
          />
          
          <StatsCard
            title="Este Mes"
            value={stats.usosEsteMes}
            icon={<Calendar size={20} />}
            gradient="from-emerald-500 to-teal-500"
            trend="Actividad mensual"
          />
          
          <StatsCard
            title="Comercios"
            value={stats.comerciosUnicos}
            icon={<Store size={20} />}
            gradient="from-purple-500 to-pink-500"
            trend="Establecimientos únicos"
          />
          
          <StatsCard
            title="Total Ahorrado"
            value={`$${stats.totalAhorrado.toLocaleString()}`}
            icon={<TrendingUp size={20} />}
            gradient="from-amber-500 to-orange-500"
            trend="Dinero ahorrado"
          />
        </div>

        {/* Enhanced Filter Section */}
        <FilterSection
          filters={filters}
          setFilters={setFilters}
          comercios={comercios}
          onClearFilters={clearFilters}
        />

        {/* Enhanced Historial List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {/* NUEVO: Indicador de carga más informativo */}
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <RefreshCw size={32} className="text-white animate-spin" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Cargando historial...</h3>
                <p className="text-slate-600 text-sm">Esto puede tomar unos segundos</p>
                
                {/* NUEVO: Indicador de progreso visual */}
                <div className="w-48 h-2 bg-slate-200 rounded-full mx-auto mt-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              {/* Skeletons de respaldo */}
              {Array.from({ length: 3 }).map((_, index) => (
                <HistorialCardSkeleton key={index} index={index} />
              ))}
            </div>
          ) : filteredUsos.length > 0 ? (
            <AnimatePresence>
              {filteredUsos.map((uso, index) => (
                <HistoryItem
                  key={uso.id}
                  uso={uso}
                  onViewDetails={handleViewDetails}
                  index={index}
                />
              ))}
            </AnimatePresence>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                <History size={40} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">
                {filters.search || filters.dateRange !== 'all' || filters.comercio
                  ? 'No se encontraron registros'
                  : 'No has usado beneficios aún'
                }
              </h3>
              <p className="text-slate-500 mb-6">
                {filters.search || filters.dateRange !== 'all' || filters.comercio
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Cuando uses un beneficio, aparecerá aquí'
                }
              </p>
              {filters.search || filters.dateRange !== 'all' || filters.comercio ? (
                <Button 
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700"
                >
                  <X size={16} className="mr-2" />
                  Limpiar Filtros
                </Button>
              ) : (
                <Button 
                  onClick={() => window.history.back()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles size={16} className="mr-2" />
                  Explorar Beneficios
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Enhanced Detail Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <DialogContent className="max-w-2xl">
          {selectedUso && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                    {(selectedUso.comercioNombre || 'C').charAt(0)}
                  </div>
                  <div>
                    <span>Detalles del Uso</span>
                    <p className="text-sm font-normal text-slate-600 mt-1">
                      {selectedUso.comercioNombre || 'Comercio'}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Enhanced Header del uso */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {selectedUso.comercioNombre || 'Comercio'}
                      </h3>
                      <p className="text-slate-700 mb-4">
                        {selectedUso.detalles || 'Beneficio utilizado'}
                      </p>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-medium shadow-sm",
                        getStatusColor(selectedUso.estado || 'usado')
                      )}>
                        {getStatusIcon(selectedUso.estado || 'usado')}
                        <span className="capitalize">{selectedUso.estado === 'usado' ? 'Válido' : selectedUso.estado || 'Válido'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-emerald-600 mb-1 flex items-center gap-1">
                        <DollarSign size={24} />
                        {(selectedUso.montoDescuento || 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-emerald-700 font-medium">
                        Ahorro obtenido
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Información detallada */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar size={16} className="text-blue-600" />
                      <h5 className="font-medium text-blue-900">Fecha</h5>
                    </div>
                    <p className="text-lg font-semibold text-blue-700">
                      {format(
                        typeof selectedUso.fechaUso?.toDate === 'function'
                          ? selectedUso.fechaUso.toDate()
                          : new Date(selectedUso.fechaUso as unknown as string | number | Date),
                        'dd MMMM yyyy',
                        { locale: es }
                      )}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={16} className="text-purple-600" />
                      <h5 className="font-medium text-purple-900">Hora</h5>
                    </div>
                    <p className="text-lg font-semibold text-purple-700">
                      {format(
                        typeof selectedUso.fechaUso?.toDate === 'function'
                          ? selectedUso.fechaUso.toDate()
                          : new Date(selectedUso.fechaUso as unknown as string | number | Date),
                        'HH:mm',
                        { locale: es }
                      )} hs
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Store size={16} className="text-emerald-600" />
                      <h5 className="font-medium text-emerald-900">Comercio</h5>
                    </div>
                    <p className="text-lg font-semibold text-emerald-700">
                      {selectedUso.comercioNombre || 'Comercio'}
                    </p>
                  </div>
                </div>

                {/* Enhanced Información adicional */}
                {selectedUso.detalles && (
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-4 border border-slate-200">
                    <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                      <Info size={16} />
                      Detalles adicionales
                    </h5>
                    <p className="text-slate-700">{selectedUso.detalles}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailModalOpen(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cerrar
                </Button>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Award size={16} className="mr-2" />
                  Repetir Beneficio
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SocioHistorial;