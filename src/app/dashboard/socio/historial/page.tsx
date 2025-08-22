'use client';

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Calendar, 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Store,
  Award,
  BarChart3,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
  MapPin,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Coins,
  Gift,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  ArrowUp,
  ArrowDown,
  Flame,
  Trophy,
  Crown,
  Medal,
  Percent,
  X,
  Info
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SocioSidebar } from '@/components/layout/SocioSidebar';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useAuth } from '@/hooks/useAuth';
import { BeneficioUso } from '@/types/beneficio';
import { format, isToday, isYesterday, isThisWeek, isThisMonth, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// Interfaces
interface FilterState {
  search: string;
  dateRange: 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';
  status: 'all' | 'valid' | 'invalid';
  comercio: string;
  sortBy: 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
}

interface HistorialStats {
  totalUsos: number;
  comerciosUnicos: number;
  beneficioMasUsado: string;
  usosEsteMes: number;
  crecimientoMensual: number;
  rachaActual: number;
  mejorMes: string;
}

// Utility functions
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'valido':
    case 'usado':
      return <CheckCircle size={16} className="text-emerald-500" />;
    case 'invalido':
    case 'cancelado':
      return <XCircle size={16} className="text-red-500" />;
    case 'pendiente':
      return <Clock size={16} className="text-amber-500" />;
    default:
      return <CheckCircle size={16} className="text-emerald-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'valido':
    case 'usado':
      return 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200';
    case 'invalido':
    case 'cancelado':
      return 'text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border-red-200';
    case 'pendiente':
      return 'text-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    default:
      return 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200';
  }
};

const getComercioColor = (comercioNombre: string) => {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600'
  ];
  const index = comercioNombre.length % colors.length;
  return colors[index];
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS'
  }).format(amount);
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      stiffness: 100,
      damping: 15
    }
  }
};


// Enhanced Stats Card Component
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  onClick?: () => void;
}> = ({ title, value, icon, gradient, subtitle, trend, trendValue, onClick }) => (
  <motion.div
    className={cn(
      "group relative overflow-hidden rounded-3xl p-6 border border-white/20 shadow-xl backdrop-blur-xl",
      "bg-gradient-to-br from-white/90 via-white/80 to-white/70",
      "hover:shadow-2xl transition-all duration-500",
      onClick && "cursor-pointer"
    )}
    variants={itemVariants}
    whileHover="hover"
    whileTap="tap"
    onClick={onClick}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
    
    {/* Floating particles */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full animate-pulse" />
      <div className="absolute bottom-4 left-4 w-1 h-1 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '1s' }} />
    </div>
    
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {trend && trendValue !== undefined && (
          <motion.div 
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm",
              trend === 'up' ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : 
              trend === 'down' ? "text-red-700 bg-red-50 border border-red-200" :
              "text-gray-700 bg-gray-50 border border-gray-200"
            )}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {trend === 'up' ? <ArrowUp size={12} /> : trend === 'down' ? <ArrowDown size={12} /> : <TrendingUp size={12} />}
            {Math.abs(trendValue)}%
          </motion.div>
        )}
      </div>
      
      <div className="space-y-2">
        <motion.div 
          className="text-3xl font-black text-gray-900 group-hover:text-gray-800 transition-colors"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {value}
        </motion.div>
        <div className="text-sm font-bold text-gray-700 group-hover:text-gray-800 transition-colors">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 font-medium">{subtitle}</div>
        )}
      </div>
      
      {onClick && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ChevronRight size={16} className="text-gray-400" />
        </div>
      )}
    </div>
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
      className="bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white/30 shadow-2xl relative overflow-hidden"
      variants={itemVariants}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-600/5" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-200/20 to-transparent rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <Filter size={20} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Filtros y Búsqueda</h3>
              <p className="text-sm text-gray-600 font-medium">Encuentra registros específicos en tu historial</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="lg:hidden"
            >
              {isExpanded ? 'Ocultar' : 'Mostrar'} Filtros
              <ChevronDown size={16} className={cn("ml-2 transition-transform", isExpanded && "rotate-180")} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              leftIcon={<X size={16} />}
            >
              Limpiar
            </Button>
          </div>
        </div>

        <motion.div 
          className={cn(
            "grid gap-4 transition-all duration-300",
            isExpanded || window.innerWidth >= 1024 ? "grid-cols-1 lg:grid-cols-5 opacity-100" : "grid-cols-1 lg:grid-cols-5 opacity-100 lg:opacity-100"
          )}
          style={{ display: isExpanded || window.innerWidth >= 1024 ? 'grid' : 'none' }}
        >
          <div className="lg:col-span-2">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por comercio o detalles..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterState['dateRange'] }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="all">📅 Todas las fechas</option>
              <option value="today">🌅 Hoy</option>
              <option value="yesterday">🌄 Ayer</option>
              <option value="week">📊 Esta semana</option>
              <option value="month">📈 Este mes</option>
            </select>
          </div>

          <div>
            <select
              value={filters.comercio}
              onChange={(e) => setFilters(prev => ({ ...prev, comercio: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="">🏪 Todos los comercios</option>
              {comercios.map(comercio => (
                <option key={comercio.id} value={comercio.id}>{comercio.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white/80 backdrop-blur-sm transition-all duration-200"
            >
              <option value="date_desc">🕐 Más recientes</option>
              <option value="date_asc">⏰ Más antiguos</option>
              <option value="amount_desc">💰 Mayor ahorro</option>
              <option value="amount_asc">💸 Menor ahorro</option>
            </select>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Enhanced History Item Component
const HistoryItem: React.FC<{
  uso: BeneficioUso;
  index: number;
  onViewDetails: (uso: BeneficioUso) => void;
}> = ({ uso, index, onViewDetails }) => {
  const fechaUso = typeof uso.fechaUso?.toDate === 'function'
    ? uso.fechaUso.toDate()
    : new Date(uso.fechaUso as unknown as string | number | Date);

  const isHighValue = (uso.montoDescuento || 0) > 500;
  const isRecent = isToday(fechaUso) || isYesterday(fechaUso);

  return (
    <motion.div
      className="group bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative"
      variants={itemVariants}
      whileHover="hover"
      transition={{ delay: index * 0.05 }}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-600/5 group-hover:from-indigo-500/5 group-hover:to-purple-600/5 transition-all duration-500" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-200/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />
      
      <div className="relative z-10 p-6">
        <div className="flex items-start gap-4">
          {/* Enhanced Comercio Avatar */}
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform duration-300",
            `bg-gradient-to-br ${getComercioColor(uso.comercioNombre || 'Comercio')}`
          )}>
            {(uso.comercioNombre || 'C').charAt(0)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-gray-800 transition-colors">
                  {uso.comercioNombre || 'Comercio'}
                </h3>
                <p className="text-gray-600 text-sm font-medium leading-relaxed">
                  {uso.detalles || 'Beneficio utilizado'}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-3xl font-black text-emerald-600 mb-1 group-hover:scale-105 transition-transform duration-300">
                  {formatCurrency(uso.montoDescuento || 0)}
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  {format(fechaUso, 'dd/MM/yyyy', { locale: es })}
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {format(fechaUso, 'HH:mm', { locale: es })} hs
                </div>
              </div>
            </div>

            {/* Enhanced Meta info */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4 flex-wrap">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl">
                <CalendarIcon size={14} />
                <span className="font-medium">
                  {format(fechaUso, 'EEEE, dd MMMM', { locale: es })}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl">
                <ClockIcon size={14} />
                <span className="font-medium">
                  {format(fechaUso, 'HH:mm', { locale: es })} hs
                </span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl">
                <MapPin size={14} />
                <span className="font-medium">Centro Comercial</span>
              </div>
            </div>

            {/* Enhanced Status and Badges */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold shadow-sm",
                  getStatusColor(uso.estado || 'usado')
                )}>
                  {getStatusIcon(uso.estado || 'usado')}
                  <span className="capitalize">{uso.estado === 'usado' ? 'Válido' : uso.estado || 'Válido'}</span>
                </div>
                
                {isHighValue && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 rounded-xl text-xs font-black border border-amber-200">
                    <Crown size={12} />
                    Gran Ahorro
                  </div>
                )}

                {isRecent && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-xl text-xs font-black border border-blue-200">
                    <Sparkles size={12} />
                    Reciente
                  </div>
                )}

                {(uso.montoDescuento || 0) > 1000 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-xl text-xs font-black border border-purple-200">
                    <Trophy size={12} />
                    Top Ahorro
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Eye size={16} />}
                  onClick={() => onViewDetails(uso)}
                  className="group-hover:scale-105 transition-transform duration-200"
                >
                  Ver Detalles
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowUpRight size={16} />}
                  className="group-hover:scale-105 transition-transform duration-200"
                >
                  Repetir
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Loading skeleton
const HistorialCardSkeleton = React.memo(() => (
  <div className="bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-xl rounded-3xl border border-white/30 p-6 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 bg-gray-200 rounded-2xl"></div>
      <div className="flex-1 space-y-3">
        <div className="h-6 bg-gray-200 rounded-xl w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-1/2"></div>
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded-xl w-24"></div>
          <div className="h-8 bg-gray-200 rounded-xl w-20"></div>
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="h-8 bg-gray-200 rounded-xl w-24"></div>
        <div className="h-4 bg-gray-200 rounded-lg w-20"></div>
      </div>
    </div>
  </div>
));

HistorialCardSkeleton.displayName = 'HistorialCardSkeleton';

// Sidebar personalizado que maneja el logout
const SocioSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <SocioSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

// Main component content
const SocioHistorialContent: React.FC = () => {
  const { signOut } = useAuth();
  const { beneficiosUsados, loading, error, refrescar } = useBeneficios();

  // Local state
  const [selectedUso, setSelectedUso] = useState<BeneficioUso | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    dateRange: 'all',
    status: 'all',
    comercio: '',
    sortBy: 'date_desc'
  });

  // Calculate enhanced stats
  const stats = useMemo<HistorialStats>(() => {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const endLastMonth = endOfMonth(lastMonth);

    const usosEsteMes = beneficiosUsados.filter(uso => {
      const fechaUso = typeof uso.fechaUso?.toDate === 'function'
        ? uso.fechaUso.toDate()
        : new Date(uso.fechaUso as unknown as string | number | Date);
      return fechaUso >= thisMonth;
    });

    const usosUltimoMes = beneficiosUsados.filter(uso => {
      const fechaUso = typeof uso.fechaUso?.toDate === 'function'
        ? uso.fechaUso.toDate()
        : new Date(uso.fechaUso as unknown as string | number | Date);
      return fechaUso >= lastMonth && fechaUso <= endLastMonth;
    });

    const comerciosUnicos = new Set(beneficiosUsados.map(uso => uso.comercioId)).size;
    const beneficioMasUsado = beneficiosUsados.length > 0 ? 'Descuento en Restaurantes' : 'N/A';

    const crecimientoMensual = usosUltimoMes.length > 0 
      ? Math.round(((usosEsteMes.length - usosUltimoMes.length) / usosUltimoMes.length) * 100)
      : 0;

    // Calculate streak
    const sortedUsos = [...beneficiosUsados].sort((a, b) => {
      const fechaA = typeof a.fechaUso?.toDate === 'function' ? a.fechaUso.toDate() : new Date(a.fechaUso as unknown as string | number | Date);
      const fechaB = typeof b.fechaUso?.toDate === 'function' ? b.fechaUso.toDate() : new Date(b.fechaUso as unknown as string | number | Date);
      return fechaB.getTime() - fechaA.getTime();
    });

    let rachaActual = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const hasUsoOnDate = sortedUsos.some(uso => {
        const fechaUso = typeof uso.fechaUso?.toDate === 'function' ? uso.fechaUso.toDate() : new Date(uso.fechaUso as unknown as string | number | Date);
        return fechaUso.toDateString() === checkDate.toDateString();
      });
      if (hasUsoOnDate) {
        rachaActual++;
      } else if (rachaActual > 0) {
        break;
      }
    }

    const mejorMes = 'Octubre 2024'; // Placeholder

    return {
      totalUsos: beneficiosUsados.length,
      comerciosUnicos,
      beneficioMasUsado,
      usosEsteMes: usosEsteMes.length,
      crecimientoMensual,
      rachaActual,
      mejorMes
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

    // Status filter
    if (filters.status !== 'all') {
      const statusMap: Record<string, string[]> = {
        valid: ['usado', 'valido'],
        invalid: ['cancelado', 'invalido'],
        pendiente: ['pendiente'],
      };
      const allowedStatuses = statusMap[filters.status] || [filters.status];
      filtered = filtered.filter(uso => allowedStatuses.includes(uso.estado));
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
      status: 'all',
      comercio: '',
      sortBy: 'date_desc'
    });
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  // Error state
  if (error) {
    return (
      <DashboardLayout
        activeSection="historial"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogout}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-100/30 to-transparent rounded-full blur-3xl" />
          
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <motion.div 
              className="text-center max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-24 h-24 bg-gradient-to-r from-red-500 to-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <AlertCircle size={40} className="text-white" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">Error al cargar historial</h3>
              <p className="text-gray-600 mb-8 text-lg">{error}</p>
              <Button onClick={handleRefresh} leftIcon={<RefreshCw size={16} />}>
                Reintentar
              </Button>
            </motion.div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activeSection="historial"
      sidebarComponent={(props) => (
        <SocioSidebarWithLogout
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 relative overflow-hidden">
        {/* Enhanced background decorations */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-violet-100/40 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-sky-100/40 to-transparent rounded-full blur-3xl" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-50/20 to-blue-50/20 rounded-full blur-3xl" style={{ animationDelay: '2s' }} />
        
        {/* Floating elements */}
        <div className="absolute top-20 right-20 w-4 h-4 bg-violet-400/60 rounded-full animate-bounce" />
        <div className="absolute top-40 left-16 w-3 h-3 bg-sky-400/60 rounded-full animate-ping" />
        <div className="absolute bottom-32 right-32 w-5 h-5 bg-purple-400/60 rounded-full animate-pulse" />

        <motion.div
          className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Enhanced Header */}
          <motion.div className="mb-8 lg:mb-12" variants={itemVariants}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8 mb-8">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <History size={32} className="text-white lg:w-10 lg:h-10" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 leading-tight">
                    Historial de Usos
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600 font-semibold max-w-2xl">
                    Registro completo de todos tus beneficios canjeados y ahorros obtenidos
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Download size={16} />}
                  onClick={handleExport}
                >
                  Exportar
                </Button>
                <Button
                  size="sm"
                  leftIcon={<BarChart3 size={16} />}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  Estadísticas
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Stats Grid */}
          <motion.div 
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12"
            variants={containerVariants}
          >
            <StatsCard
              title="Total de Usos"
              value={stats.totalUsos}
              icon={<History size={24} />}
              gradient="from-blue-500 to-indigo-600"
              subtitle={`${stats.usosEsteMes} este mes`}
              trend={stats.crecimientoMensual > 0 ? 'up' : stats.crecimientoMensual < 0 ? 'down' : 'neutral'}
              trendValue={Math.abs(stats.crecimientoMensual)}
            />
            
            <StatsCard
              title="Racha Actual"
              value={`${stats.rachaActual} días`}
              icon={<Flame size={24} />}
              gradient="from-orange-500 to-red-600"
              subtitle="Consecutivos"
              trend={stats.rachaActual > 0 ? 'up' : 'neutral'}
              trendValue={stats.rachaActual}
            />
            
            <StatsCard
              title="Comercios"
              value={stats.comerciosUnicos}
              icon={<Store size={24} />}
              gradient="from-purple-500 to-pink-600"
              subtitle="Únicos visitados"
            />
            
            <StatsCard
              title="Beneficio Top"
              value={stats.beneficioMasUsado}
              icon={<Award size={24} />}
              gradient="from-indigo-500 to-purple-600"
              subtitle="Más utilizado"
            />
          </motion.div>

          {/* Enhanced Filter Section */}
          <FilterSection
            filters={filters}
            setFilters={setFilters}
            comercios={comercios}
            onClearFilters={clearFilters}
          />

          {/* Enhanced Historial List */}
          <motion.div
            className="mt-8 space-y-6"
            variants={itemVariants}
          >
            <AnimatePresence>
              {loading ? (
                <div className="space-y-6">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <HistorialCardSkeleton key={index} />
                  ))}
                </div>
              ) : filteredUsos.length > 0 ? (
                filteredUsos.map((uso, index) => (
                  <HistoryItem
                    key={uso.id}
                    uso={uso}
                    index={index}
                    onViewDetails={handleViewDetails}
                  />
                ))
              ) : (
                <motion.div
                  className="text-center py-16"
                  variants={itemVariants}
                >
                  <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                    <History size={40} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-4">
                    {filters.search || filters.dateRange !== 'all' || filters.comercio
                      ? 'No se encontraron registros'
                      : 'No has usado beneficios aún'
                    }
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    {filters.search || filters.dateRange !== 'all' || filters.comercio
                      ? 'Intenta ajustar los filtros de búsqueda para encontrar lo que buscas'
                      : 'Cuando uses un beneficio, aparecerá aquí con todos los detalles de tu ahorro'
                    }
                  </p>
                  {filters.search || filters.dateRange !== 'all' || filters.comercio ? (
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      leftIcon={<X size={16} />}
                      className="mr-4"
                    >
                      Limpiar Filtros
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => window.location.href = '/dashboard/socio/beneficios'}
                      leftIcon={<Gift size={16} />}
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    >
                      Explorar Beneficios
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Enhanced Achievement Section */}
          {stats.rachaActual > 0 && (
            <motion.div 
              className="mt-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
              variants={itemVariants}
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.8 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-yellow-300/30 to-transparent rounded-full blur-2xl" />
              
              <div className="relative z-10 flex items-center gap-6">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-amber-300 rounded-3xl flex items-center justify-center shadow-2xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <Medal size={32} className="text-amber-800" />
                </motion.div>
                <div className="flex-1">
                  <h3 className="font-black text-2xl mb-2">¡Racha Activa de {stats.rachaActual} días!</h3>
                  <p className="text-amber-100 font-semibold mb-4">
                    Has usado beneficios durante {stats.rachaActual} días consecutivos. ¡Increíble constancia!
                  </p>
                  <div className="bg-white/20 rounded-2xl p-4 backdrop-blur-sm border border-white/30">
                    <span className="text-sm font-black">¡Sigue así para mantener tu racha y desbloquear más recompensas!</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Detail Modal */}
        <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
          <DialogContent className="max-w-3xl">
            {selectedUso && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-4 text-2xl">
                    <div 
                      className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg",
                        `bg-gradient-to-br ${getComercioColor(selectedUso.comercioNombre || 'Comercio')}`
                      )}
                    >
                      {(selectedUso.comercioNombre || 'C').charAt(0)}
                    </div>
                    <div>
                      <span>Detalles del Uso</span>
                      <p className="text-sm font-normal text-gray-600 mt-1">
                        Información completa de tu beneficio
                      </p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-8">
                  {/* Enhanced Header del uso */}
                  <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 border border-emerald-200">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-2xl" />
                    
                    <div className="relative z-10 flex items-start gap-6">
                      <div className="flex-1">
                        <h3 className="text-2xl font-black text-gray-900 mb-2">
                          {selectedUso.comercioNombre || 'Comercio'}
                        </h3>
                        <p className="text-gray-700 mb-4 text-lg font-medium leading-relaxed">
                          {selectedUso.detalles || 'Beneficio utilizado'}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <div className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold shadow-sm",
                            getStatusColor(selectedUso.estado || 'usado')
                          )}>
                            {getStatusIcon(selectedUso.estado || 'usado')}
                            <span className="capitalize">{selectedUso.estado === 'usado' ? 'Válido' : selectedUso.estado || 'Válido'}</span>
                          </div>
                          {(selectedUso.montoDescuento || 0) > 500 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 rounded-2xl text-sm font-black border border-amber-200">
                              <Crown size={14} />
                              Gran Ahorro
                            </div>
                          )}
                          {(selectedUso.montoDescuento || 0) > 1000 && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-2xl text-sm font-black border border-purple-200">
                              <Trophy size={14} />
                              Top Ahorro
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-black text-emerald-600 mb-2">
                          {formatCurrency(selectedUso.montoDescuento || 0)}
                        </div>
                        <div className="text-sm text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-xl">
                          Ahorro obtenido
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Información detallada */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-2xl border border-blue-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full blur-xl" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                            <Calendar size={18} className="text-white" />
                          </div>
                          <h5 className="font-black text-blue-900">Fecha</h5>
                        </div>
                        <p className="text-xl font-black text-blue-700 mb-1">
                          {format(
                            typeof selectedUso.fechaUso?.toDate === 'function'
                              ? selectedUso.fechaUso.toDate()
                              : new Date(selectedUso.fechaUso as unknown as string | number | Date),
                            'dd MMMM yyyy',
                            { locale: es }
                          )}
                        </p>
                        <p className="text-sm text-blue-600 font-semibold">
                          {format(
                            typeof selectedUso.fechaUso?.toDate === 'function'
                              ? selectedUso.fechaUso.toDate()
                              : new Date(selectedUso.fechaUso as unknown as string | number | Date),
                            'EEEE',
                            { locale: es }
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border border-purple-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-full blur-xl" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                            <ClockIcon size={18} className="text-white" />
                          </div>
                          <h5 className="font-black text-purple-900">Hora</h5>
                        </div>
                        <p className="text-xl font-black text-purple-700 mb-1">
                          {format(
                            typeof selectedUso.fechaUso?.toDate === 'function'
                              ? selectedUso.fechaUso.toDate()
                              : new Date(selectedUso.fechaUso as unknown as string | number | Date),
                            'HH:mm',
                            { locale: es }
                          )} hs
                        </p>
                        <p className="text-sm text-purple-600 font-semibold">
                          Horario de uso
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-teal-100 p-6 rounded-2xl border border-emerald-200 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-200/30 to-transparent rounded-full blur-xl" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                            <Store size={18} className="text-white" />
                          </div>
                          <h5 className="font-black text-emerald-900">Comercio</h5>
                        </div>
                        <p className="text-xl font-black text-emerald-700 mb-1">
                          {selectedUso.comercioNombre || 'Comercio'}
                        </p>
                        <p className="text-sm text-emerald-600 font-semibold">
                          Centro Comercial
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Información adicional */}
                  {selectedUso.detalles && (
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                      <h5 className="font-black text-gray-900 mb-4 flex items-center gap-2">
                        <Info size={18} />
                        Detalles adicionales
                      </h5>
                      <p className="text-gray-700 leading-relaxed font-medium">{selectedUso.detalles}</p>
                    </div>
                  )}

                  {/* Enhanced Stats del uso */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-2xl border border-amber-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Percent size={16} className="text-amber-600" />
                        <span className="text-sm font-bold text-amber-900">Tipo de descuento</span>
                      </div>
                      <p className="text-lg font-black text-amber-700">Descuento directo</p>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-2xl border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Coins size={16} className="text-green-600" />
                        <span className="text-sm font-bold text-green-900">Ahorro efectivo</span>
                      </div>
                      <p className="text-lg font-black text-green-700">
                        {formatCurrency(selectedUso.montoDescuento || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setDetailModalOpen(false)}
                    leftIcon={<X size={16} />}
                  >
                    Cerrar
                  </Button>
                  <Button 
                    leftIcon={<ArrowUpRight size={16} />}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  >
                    Repetir Beneficio
                  </Button>
                  <Button 
                    variant="outline"
                    leftIcon={<Download size={16} />}
                  >
                    Descargar Comprobante
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

// Main page component with Suspense boundary
export default function SocioHistorialPage() {
  return (
    <Suspense fallback={
      <DashboardLayout
        activeSection="historial"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={() => {}}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-100/30 to-transparent rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <RefreshCw size={40} className="text-white animate-spin" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">Cargando historial...</h3>
              <p className="text-gray-600 text-lg">Preparando tu historial de beneficios</p>
              
              <div className="mt-8 space-y-3">
                <div className="h-4 bg-gray-200 rounded-full animate-pulse mx-auto w-3/4" />
                <div className="h-4 bg-gray-200 rounded-full animate-pulse mx-auto w-1/2" />
                <div className="h-4 bg-gray-200 rounded-full animate-pulse mx-auto w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    }>
      <SocioHistorialContent />
    </Suspense>
  );
}