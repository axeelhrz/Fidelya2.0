'use client';

import React, { useState, useMemo, useCallback } from 'react';
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
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useBeneficios } from '@/hooks/useBeneficios';
import { BeneficioUso } from '@/types/beneficio';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfMonth, endOfMonth } from 'date-fns';
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
      return <CheckCircle size={16} className="text-green-600" />;
    case 'invalido':
    case 'cancelado':
      return <XCircle size={16} className="text-red-600" />;
    case 'pendiente':
      return <Clock size={16} className="text-amber-600" />;
    default:
      return <CheckCircle size={16} className="text-green-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'valido':
    case 'usado':
      return 'text-green-700 bg-green-50 border-green-200';
    case 'invalido':
    case 'cancelado':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'pendiente':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    default:
      return 'text-green-700 bg-green-50 border-green-200';
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

// Simple Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}> = ({ title, value, icon, color = 'bg-blue-50 text-blue-600' }) => (
  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  </div>
);

// Simple Filter Component
const FilterSection: React.FC<{
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  comercios: { id: string; nombre: string }[];
  onClearFilters: () => void;
}> = ({ filters, setFilters, comercios, onClearFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtros</h3>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden"
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'}
            <ChevronDown size={16} className={cn("ml-1 transition-transform", isExpanded && "rotate-180")} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
          >
            <X size={16} className="mr-1" />
            Limpiar
          </Button>
        </div>
      </div>

      <div className={cn(
        "grid gap-4 transition-all duration-200",
        isExpanded ? "grid-cols-1 md:grid-cols-4" : "hidden md:grid md:grid-cols-4"
      )}>
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        <select
          value={filters.dateRange}
          onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterState['dateRange'] }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="">Todos los comercios</option>
          {comercios.map(comercio => (
            <option key={comercio.id} value={comercio.id}>{comercio.nombre}</option>
          ))}
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          <option value="date_desc">Más recientes</option>
          <option value="date_asc">Más antiguos</option>
          <option value="amount_desc">Mayor ahorro</option>
          <option value="amount_asc">Menor ahorro</option>
        </select>
      </div>
    </div>
  );
};

// Simple History Item Component
const HistoryItem: React.FC<{
  uso: BeneficioUso;
  onViewDetails: (uso: BeneficioUso) => void;
}> = ({ uso, onViewDetails }) => {
  const fechaUso = typeof uso.fechaUso?.toDate === 'function'
    ? uso.fechaUso.toDate()
    : new Date(uso.fechaUso as unknown as string | number | Date);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        {/* Simple Avatar */}
        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
          {(uso.comercioNombre || 'C').charAt(0)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {uso.comercioNombre || 'Comercio'}
              </h3>
              <p className="text-gray-600 text-sm">
                {uso.detalles || 'Beneficio utilizado'}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-xl font-bold text-green-600 mb-1">
                {formatCurrency(uso.montoDescuento || 0)}
              </div>
              <div className="text-sm text-gray-500">
                {format(fechaUso, 'dd/MM/yyyy', { locale: es })}
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{format(fechaUso, 'dd MMM yyyy', { locale: es })}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{format(fechaUso, 'HH:mm', { locale: es })}</span>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-md border text-sm font-medium",
              getStatusColor(uso.estado || 'usado')
            )}>
              {getStatusIcon(uso.estado || 'usado')}
              <span className="capitalize">{uso.estado === 'usado' ? 'Válido' : uso.estado || 'Válido'}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(uso)}
            >
              <Eye size={16} className="mr-1" />
              Ver detalles
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Loading skeleton
const HistorialCardSkeleton = React.memo(() => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="h-6 bg-gray-200 rounded w-20"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  </div>
));

HistorialCardSkeleton.displayName = 'HistorialCardSkeleton';

export const SocioHistorial: React.FC = () => {
  const { beneficiosUsados, loading, error, refrescar } = useBeneficios();

  // Local state
  const [selectedUso, setSelectedUso] = useState<BeneficioUso | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: 'all',
    comercio: '',
    sortBy: 'date_desc'
  });

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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar historial</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh}>
            <RefreshCw size={16} className="mr-2" />
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <History size={24} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Historial de Usos
                </h1>
                <p className="text-gray-600">
                  Registro de todos tus beneficios utilizados
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw size={16} className={cn("mr-2", refreshing && 'animate-spin')} />
                {refreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download size={16} className="mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total de Usos"
            value={stats.totalUsos}
            icon={<History size={20} />}
            color="bg-blue-50 text-blue-600"
          />
          
          <StatsCard
            title="Este Mes"
            value={stats.usosEsteMes}
            icon={<Calendar size={20} />}
            color="bg-green-50 text-green-600"
          />
          
          <StatsCard
            title="Comercios"
            value={stats.comerciosUnicos}
            icon={<Store size={20} />}
            color="bg-purple-50 text-purple-600"
          />
          
          <StatsCard
            title="Total Ahorrado"
            value={formatCurrency(stats.totalAhorrado)}
            icon={<Download size={20} />}
            color="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Filter Section */}
        <FilterSection
          filters={filters}
          setFilters={setFilters}
          comercios={comercios}
          onClearFilters={clearFilters}
        />

        {/* Historial List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <HistorialCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredUsos.length > 0 ? (
            filteredUsos.map((uso) => (
              <HistoryItem
                key={uso.id}
                uso={uso}
                onViewDetails={handleViewDetails}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                <History size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filters.search || filters.dateRange !== 'all' || filters.comercio
                  ? 'No se encontraron registros'
                  : 'No has usado beneficios aún'
                }
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.dateRange !== 'all' || filters.comercio
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Cuando uses un beneficio, aparecerá aquí'
                }
              </p>
              {filters.search || filters.dateRange !== 'all' || filters.comercio ? (
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                >
                  <X size={16} className="mr-2" />
                  Limpiar Filtros
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <DialogContent className="max-w-2xl">
          {selectedUso && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-semibold">
                    {(selectedUso.comercioNombre || 'C').charAt(0)}
                  </div>
                  <div>
                    <span>Detalles del Uso</span>
                    <p className="text-sm font-normal text-gray-600 mt-1">
                      {selectedUso.comercioNombre || 'Comercio'}
                    </p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Header del uso */}
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedUso.comercioNombre || 'Comercio'}
                      </h3>
                      <p className="text-gray-700 mb-3">
                        {selectedUso.detalles || 'Beneficio utilizado'}
                      </p>
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-md border text-sm font-medium",
                        getStatusColor(selectedUso.estado || 'usado')
                      )}>
                        {getStatusIcon(selectedUso.estado || 'usado')}
                        <span className="capitalize">{selectedUso.estado === 'usado' ? 'Válido' : selectedUso.estado || 'Válido'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {formatCurrency(selectedUso.montoDescuento || 0)}
                      </div>
                      <div className="text-sm text-green-700">
                        Ahorro obtenido
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información detallada */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
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

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
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

                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Store size={16} className="text-emerald-600" />
                      <h5 className="font-medium text-emerald-900">Comercio</h5>
                    </div>
                    <p className="text-lg font-semibold text-emerald-700">
                      {selectedUso.comercioNombre || 'Comercio'}
                    </p>
                  </div>
                </div>

                {/* Información adicional */}
                {selectedUso.detalles && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Info size={16} />
                      Detalles adicionales
                    </h5>
                    <p className="text-gray-700">{selectedUso.detalles}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setDetailModalOpen(false)}
                >
                  Cerrar
                </Button>
                <Button>
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