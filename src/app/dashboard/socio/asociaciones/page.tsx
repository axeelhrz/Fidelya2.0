'use client';

import React, { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Building2,
  Users,
  Gift,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  Eye,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Shield,
  Target,
  Info,
  ExternalLink,
  Activity,
  BarChart3,
} from 'lucide-react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SocioSidebar } from '@/components/layout/SocioSidebar';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Beneficio {
  id: string;
  titulo: string;
  descripcion?: string;
  descuento?: number;
  tipoDescuento?: 'porcentaje' | 'monto_fijo';
  categoria?: string;
  estado: 'activo' | 'inactivo' | 'vencido';
  fechaVencimiento?: Date | { toDate: () => Date } | null;
  comercioId?: string;
  comercioNombre?: string;
  condiciones?: string;
  usosMaximos?: number;
  usosActuales?: number;
}

interface Comercio {
  id: string;
  nombre: string;
  categoria?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  estado: 'activo' | 'inactivo' | 'pendiente';
  logo?: string;
  beneficiosCount?: number;
}

interface Asociacion {
  id: string;
  nombre: string;
  descripcion?: string;
  logo?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  sitioWeb?: string;
  estado: 'activo' | 'inactivo' | 'suspendido';
  fechaCreacion?: Date | { toDate: () => Date } | null;
  fechaVinculacion?: Date | { toDate: () => Date } | null;
  totalSocios?: number;
  totalComercios?: number;
  totalBeneficios?: number;
  beneficios?: Beneficio[];
  comercios?: Comercio[];
  categoria?: string;
  rating?: number;
  numeroSocio?: string;
  estadoMembresia?: string;
  beneficiosActivos?: number;
  beneficiosVencidos?: number;
  comerciosActivos?: number;
  sociosActivos?: number;
}

interface FilterState {
  search: string;
  sortBy: 'nombre' | 'fecha' | 'beneficios' | 'comercios';
}

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

// Componente de beneficios destacados
const BeneficiosDestacados: React.FC<{ beneficios: Beneficio[] }> = ({ beneficios }) => {
  const beneficiosActivos = beneficios.filter(b => b.estado === 'activo').slice(0, 3);

  if (beneficiosActivos.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
        <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <Gift size={18} />
          Beneficios Destacados
        </h4>
        <p className="text-gray-500 text-center py-4">No hay beneficios activos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 mb-6">
      <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
        <Gift size={18} className="text-purple-600" />
        Beneficios Destacados
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {beneficiosActivos.map((beneficio, index) => (
          <motion.div
            key={beneficio.id}
            className="bg-white rounded-xl p-4 border border-purple-200 hover:shadow-lg transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start justify-between mb-3">
              <h5 className="font-bold text-gray-900 text-sm leading-tight flex-1">
                {beneficio.titulo}
              </h5>
              {beneficio.descuento && (
                <div className="ml-2 px-2 py-1 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-lg text-xs font-black">
                  {beneficio.tipoDescuento === 'porcentaje' ? `${beneficio.descuento}%` : `$${beneficio.descuento}`}
                </div>
              )}
            </div>
            
            {beneficio.comercioNombre && (
              <div className="flex items-center gap-2 mb-2">
                <Store size={12} className="text-gray-400" />
                <span className="text-xs text-gray-600 font-medium">{beneficio.comercioNombre}</span>
              </div>
            )}
            
            {beneficio.categoria && (
              <div className="flex items-center gap-2 mb-3">
                <Target size={12} className="text-gray-400" />
                <span className="text-xs text-gray-600 font-medium">{beneficio.categoria}</span>
              </div>
            )}
            
            {beneficio.descripcion && (
              <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">
                {beneficio.descripcion}
              </p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-bold">Activo</span>
              </div>
              
              {beneficio.usosMaximos && (
                <div className="text-xs text-gray-500">
                  {beneficio.usosActuales || 0}/{beneficio.usosMaximos} usos
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Componente de comercios afiliados
const ComerciosAfiliados: React.FC<{ comercios: Comercio[] }> = ({ comercios }) => {
  const comerciosActivos = comercios.filter(c => c.estado === 'activo').slice(0, 6);

  if (comerciosActivos.length === 0) {
    return (
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
        <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
          <Store size={18} />
          Comercios Afiliados
        </h4>
        <p className="text-gray-500 text-center py-4">No hay comercios afiliados</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mb-6">
      <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
        <Store size={18} className="text-green-600" />
        Comercios Afiliados
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {comerciosActivos.map((comercio, index) => (
          <motion.div
            key={comercio.id}
            className="bg-white rounded-xl p-4 border border-green-200 hover:shadow-lg transition-all duration-300 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              {comercio.logo ? (
                <Image
                  src={comercio.logo}
                  alt={comercio.nombre}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-2xl"
                  style={{ objectFit: 'cover', borderRadius: '1rem' }}
                  unoptimized={true}
                />
              ) : (
                <Store size={20} className="text-white" />
              )}
            </div>
            
            <h5 className="font-bold text-gray-900 text-sm mb-2 line-clamp-1">
              {comercio.nombre}
            </h5>
            
            {comercio.categoria && (
              <p className="text-xs text-gray-500 mb-2">{comercio.categoria}</p>
            )}
            
            {comercio.beneficiosCount && comercio.beneficiosCount > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-green-600 font-bold">
                <Gift size={12} />
                {comercio.beneficiosCount} beneficio{comercio.beneficiosCount > 1 ? 's' : ''}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Componente de tarjeta de asociación optimizado
const AsociacionCard: React.FC<{
  asociacion: Asociacion;
  index: number;
  onViewDetails: (asociacion: Asociacion) => void;
}> = ({ asociacion, index, onViewDetails }) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200';
      case 'inactivo':
        return 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 'suspendido':
        return 'text-red-700 bg-gradient-to-r from-red-50 to-rose-50 border-red-200';
      default:
        return 'text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <CheckCircle size={16} className="text-emerald-500" />;
      case 'inactivo':
        return <Clock size={16} className="text-gray-500" />;
      case 'suspendido':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'Activo';
      case 'inactivo':
        return 'Inactivo';
      case 'suspendido':
        return 'Suspendido';
      default:
        return 'Desconocido';
    }
  };

  return (
    <motion.div
      className="group bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl rounded-3xl border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-700 overflow-hidden relative"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.15, 
        type: "spring", 
        stiffness: 120,
        damping: 20
      }}
      whileHover={{ 
        y: -12, 
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 25 }
      }}
    >
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 to-purple-600/8 group-hover:from-blue-500/15 group-hover:to-purple-600/15 transition-all duration-700" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-blue-300/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-300/15 to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700" />
      
      {/* Premium shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%]" />
      
      {/* Status badge */}
      <div className="absolute top-6 right-6 z-20">
        <div className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg backdrop-blur-sm",
          getEstadoColor(asociacion.estado)
        )}>
          {getEstadoIcon(asociacion.estado)}
          <span>{getEstadoText(asociacion.estado)}</span>
        </div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header Section */}
        <div className="flex items-start gap-6 mb-8">
          {/* Enhanced Logo */}
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500">
              {asociacion.logo ? (
                <Image
                  src={asociacion.logo}
                  alt={asociacion.nombre}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-3xl"
                  style={{ objectFit: 'cover', borderRadius: '1.5rem' }}
                  unoptimized={true}
                />
              ) : (
                asociacion.nombre.charAt(0).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
              <CheckCircle size={14} className="text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="mb-4">
              <h3 className="text-2xl font-black text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                {asociacion.nombre}
              </h3>
              {asociacion.descripcion && (
                <p className="text-gray-600 text-base font-medium leading-relaxed mb-4">
                  {asociacion.descripcion}
                </p>
              )}
              
              {/* Membership info */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                {asociacion.numeroSocio && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                    <Shield size={16} className="text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">
                      Socio #{asociacion.numeroSocio}
                    </span>
                  </div>
                )}
                
                {asociacion.fechaVinculacion && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                    <Calendar size={16} className="text-purple-600" />
                    <span className="text-sm font-bold text-purple-700">
                      Desde {format(
                        typeof asociacion.fechaVinculacion === 'object' && asociacion.fechaVinculacion !== null && 'toDate' in asociacion.fechaVinculacion
                          ? asociacion.fechaVinculacion.toDate()
                          : (asociacion.fechaVinculacion as Date),
                        'MMM yyyy',
                        { locale: es }
                      )}
                    </span>
                  </div>
                )}
                
                {asociacion.rating && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-200">
                    <Star size={16} className="text-amber-600 fill-current" />
                    <span className="text-sm font-bold text-amber-700">
                      {asociacion.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border border-blue-200 group-hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Users size={20} className="text-white" />
            </div>
            <div className="text-2xl font-black text-blue-700 mb-1">
              {asociacion.sociosActivos || asociacion.totalSocios || 0}
            </div>
            <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">Socios</div>
          </div>
          
          <div className="text-center bg-gradient-to-br from-green-50 to-emerald-100 p-4 rounded-2xl border border-green-200 group-hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Store size={20} className="text-white" />
            </div>
            <div className="text-2xl font-black text-green-700 mb-1">
              {asociacion.comerciosActivos || asociacion.totalComercios || 0}
            </div>
            <div className="text-xs text-green-600 font-bold uppercase tracking-wide">Comercios</div>
          </div>
          
          <div className="text-center bg-gradient-to-br from-purple-50 to-pink-100 p-4 rounded-2xl border border-purple-200 group-hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Gift size={20} className="text-white" />
            </div>
            <div className="text-2xl font-black text-purple-700 mb-1">
              {asociacion.beneficiosActivos || asociacion.totalBeneficios || 0}
            </div>
            <div className="text-xs text-purple-600 font-bold uppercase tracking-wide">Beneficios</div>
          </div>
          
          <div className="text-center bg-gradient-to-br from-amber-50 to-orange-100 p-4 rounded-2xl border border-amber-200 group-hover:scale-105 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Activity size={20} className="text-white" />
            </div>
            <div className="text-2xl font-black text-amber-700 mb-1">
              {asociacion.rating ? (asociacion.rating * 20).toFixed(0) : '85'}
            </div>
            <div className="text-xs text-amber-600 font-bold uppercase tracking-wide">Actividad</div>
          </div>
        </div>

        {/* Beneficios Destacados */}
        {asociacion.beneficios && asociacion.beneficios.length > 0 && (
          <BeneficiosDestacados beneficios={asociacion.beneficios} />
        )}

        {/* Comercios Afiliados */}
        {asociacion.comercios && asociacion.comercios.length > 0 && (
          <ComerciosAfiliados comercios={asociacion.comercios} />
        )}

        {/* Contact Information */}
        {(asociacion.email || asociacion.telefono || asociacion.direccion) && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 mb-8 border border-gray-200">
            <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
              <Info size={18} />
              Información de Contacto
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {asociacion.email && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Mail size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</div>
                    <div className="text-sm font-bold text-gray-900 truncate">{asociacion.email}</div>
                  </div>
                </div>
              )}
              
              {asociacion.telefono && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Phone size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Teléfono</div>
                    <div className="text-sm font-bold text-gray-900">{asociacion.telefono}</div>
                  </div>
                </div>
              )}
              
              {asociacion.direccion && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 md:col-span-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MapPin size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dirección</div>
                    <div className="text-sm font-bold text-gray-900">{asociacion.direccion}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            leftIcon={<Eye size={18} />}
            onClick={() => onViewDetails(asociacion)}
            className="flex-1 group-hover:scale-105 transition-transform duration-200 border-2"
          >
            Ver Detalles
          </Button>
          
          {asociacion.sitioWeb && (
            <Button
              variant="outline"
              size="lg"
              leftIcon={<ExternalLink size={18} />}
              onClick={() => window.open(asociacion.sitioWeb, '_blank')}
              className="group-hover:scale-105 transition-transform duration-200 border-2"
            >
              Sitio Web
            </Button>
          )}
          
          <Button
            size="lg"
            leftIcon={<ArrowUpRight size={18} />}
            onClick={() => window.location.href = '/dashboard/socio/beneficios'}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 group-hover:scale-105 transition-transform duration-200 shadow-xl"
          >
            Ver Beneficios
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// Componente de filtros optimizado
const FilterSection: React.FC<{
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onClearFilters: () => void;
  totalAsociaciones: number;
}> = ({ filters, setFilters, onClearFilters, totalAsociaciones }) => {
  return (
    <motion.div 
      className="bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-2xl relative overflow-hidden mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 to-purple-600/8" />
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-violet-200/20 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-white shadow-2xl">
              <Filter size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900">Mis Asociaciones</h3>
              <p className="text-base text-gray-600 font-medium">
                {totalAsociaciones} asociación{totalAsociaciones !== 1 ? 'es' : ''} vinculada{totalAsociaciones !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              leftIcon={<RefreshCw size={16} />}
              className="border-2"
            >
              Limpiar Filtros
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en mis asociaciones..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white/80 backdrop-blur-sm transition-all duration-200 font-medium"
            />
          </div>

          <div>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))}
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base bg-white/80 backdrop-blur-sm transition-all duration-200 font-medium"
            >
              <option value="nombre">Ordenar por Nombre</option>
              <option value="fecha">Ordenar por Fecha de Vinculación</option>
              <option value="beneficios">Ordenar por Beneficios</option>
              <option value="comercios">Ordenar por Comercios</option>
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Componente principal del contenido optimizado
function SocioAsociacionesContent() {
  const { user, signOut } = useAuth();
  const [asociaciones, setAsociaciones] = useState<Asociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    sortBy: 'nombre'
  });

  // Función optimizada para cargar datos completos de la asociación
  interface SocioData {
    id: string;
    asociacionId: string;
    fechaVinculacion?: Date | { toDate: () => Date } | null;
    numeroSocio?: string;
    estado?: string;
    email?: string;
    // Add other fields as needed
  }
  
    const loadCompleteAsociacionData = useCallback(async (asociacionId: string, socioData: SocioData) => {
    try {
      // 1. Obtener información básica de la asociación
      const asociacionRef = doc(db, 'asociaciones', asociacionId);
      const asociacionDoc = await getDoc(asociacionRef);

      if (!asociacionDoc.exists()) {
        return null;
      }

      const asociacionData = asociacionDoc.data();

      // 2. Obtener estadísticas en paralelo
      const [sociosSnapshot, comerciosSnapshot, beneficiosSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'socios'), where('asociacionId', '==', asociacionId))),
        getDocs(query(collection(db, 'comercios'), where('asociacionId', '==', asociacionId))),
        getDocs(query(collection(db, 'beneficios'), where('asociacionId', '==', asociacionId)))
      ]);

      // 3. Procesar beneficios con información detallada
      const beneficios: Beneficio[] = beneficiosSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo || data.nombre || 'Beneficio',
          descripcion: data.descripcion,
          descuento: data.descuento || data.porcentajeDescuento || data.montoDescuento,
          tipoDescuento: data.tipoDescuento || (data.porcentajeDescuento ? 'porcentaje' : 'monto_fijo'),
          categoria: data.categoria,
          estado: data.estado || 'activo',
          fechaVencimiento: data.fechaVencimiento,
          comercioId: data.comercioId,
          comercioNombre: data.comercioNombre,
          condiciones: data.condiciones || data.terminos,
          usosMaximos: data.usosMaximos || data.limitesUso,
          usosActuales: data.usosActuales || 0
        };
      });

      // 4. Procesar comercios con conteo de beneficios
      const comercios: Comercio[] = comerciosSnapshot.docs.map(doc => {
        const data = doc.data();
        const comercioBeneficios = beneficios.filter(b => b.comercioId === doc.id);
        
        return {
          id: doc.id,
          nombre: data.nombre || 'Comercio',
          categoria: data.categoria,
          direccion: data.direccion,
          telefono: data.telefono,
          email: data.email,
          estado: data.estado || 'activo',
          logo: data.logo,
          beneficiosCount: comercioBeneficios.length
        };
      });

      // 5. Calcular estadísticas detalladas
      const beneficiosActivos = beneficios.filter(b => b.estado === 'activo').length;
      const beneficiosVencidos = beneficios.filter(b => b.estado === 'vencido').length;
      const comerciosActivos = comercios.filter(c => c.estado === 'activo').length;
      const sociosActivos = sociosSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.estado === 'activo';
      }).length;

      // 6. Construir objeto completo de asociación
      const asociacionCompleta: Asociacion = {
        id: asociacionDoc.id,
        nombre: asociacionData.nombre || 'Mi Asociación',
        descripcion: asociacionData.descripcion,
        logo: asociacionData.logo,
        email: asociacionData.email,
        telefono: asociacionData.telefono,
        direccion: asociacionData.direccion,
        sitioWeb: asociacionData.sitioWeb,
        estado: asociacionData.estado || 'activo',
        fechaCreacion: asociacionData.creadoEn,
        fechaVinculacion: socioData.fechaVinculacion,
        totalSocios: sociosSnapshot.size,
        totalComercios: comerciosSnapshot.size,
        totalBeneficios: beneficiosSnapshot.size,
        beneficios: beneficios,
        comercios: comercios,
        categoria: asociacionData.categoria || 'general',
        rating: asociacionData.rating || (4.2 + Math.random() * 0.6),
        numeroSocio: socioData.numeroSocio,
        estadoMembresia: socioData.estado || 'activo',
        beneficiosActivos,
        beneficiosVencidos,
        comerciosActivos,
        sociosActivos
      };

      return asociacionCompleta;
    } catch (error) {
      console.error('Error cargando datos completos de asociación:', error);
      return null;
    }
  }, []);

  // Cargar asociaciones del usuario con datos completos
  useEffect(() => {
    const loadUserAsociaciones = async () => {
      if (!user) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Buscar el socio en la colección socios
        let socioData = null;
        
        // Primero intentar por UID
        try {
          const socioRef = doc(db, 'socios', user.uid);
          const socioDoc = await getDoc(socioRef);
          if (socioDoc.exists()) {
            socioData = { ...(socioDoc.data() as SocioData), id: socioDoc.id };
          }
        } catch {
          console.log('No se encontró socio por UID, buscando por email...');
        }

        // Si no se encontró por UID, buscar por email
        if (!socioData) {
          const socioQuery = query(
            collection(db, 'socios'),
            where('email', '==', user.email?.toLowerCase())
          );
          const socioSnapshot = await getDocs(socioQuery);
          
          if (!socioSnapshot.empty) {
            const doc = socioSnapshot.docs[0];
            socioData = { ...(doc.data() as SocioData), id: doc.id };
          }
        }

        if (!socioData || !socioData.asociacionId) {
          setAsociaciones([]);
          return;
        }

        // 2. Cargar datos completos de la asociación
        const asociacionCompleta = await loadCompleteAsociacionData(socioData.asociacionId, socioData);
        
        if (asociacionCompleta) {
          setAsociaciones([asociacionCompleta]);
        } else {
          setAsociaciones([]);
        }

      } catch (err) {
        console.error('Error cargando asociaciones del usuario:', err);
        setError('Error al cargar tus asociaciones');
      } finally {
        setLoading(false);
      }
    };

    loadUserAsociaciones();
  }, [user, loadCompleteAsociacionData]);

  // Filtrar asociaciones optimizado
  const filteredAsociaciones = useMemo(() => {
    let filtered = [...asociaciones];

    // Filtro de búsqueda
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(asociacion => 
        asociacion.nombre.toLowerCase().includes(searchLower) ||
        (asociacion.descripcion && asociacion.descripcion.toLowerCase().includes(searchLower)) ||
        (asociacion.categoria && asociacion.categoria.toLowerCase().includes(searchLower))
      );
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'nombre':
          return a.nombre.localeCompare(b.nombre);
        case 'beneficios':
          return (b.beneficiosActivos || b.totalBeneficios || 0) - (a.beneficiosActivos || a.totalBeneficios || 0);
        case 'comercios':
          return (b.comerciosActivos || b.totalComercios || 0) - (a.comerciosActivos || a.totalComercios || 0);
        case 'fecha':
          const fechaA = a.fechaVinculacion
            ? typeof a.fechaVinculacion === 'object' && 'toDate' in a.fechaVinculacion
              ? a.fechaVinculacion.toDate()
              : a.fechaVinculacion as Date
            : new Date(0);
          const fechaB = b.fechaVinculacion
            ? typeof b.fechaVinculacion === 'object' && 'toDate' in b.fechaVinculacion
              ? b.fechaVinculacion.toDate()
              : b.fechaVinculacion as Date
            : new Date(0);
          return fechaB.getTime() - fechaA.getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [asociaciones, filters]);

  // Handlers optimizados
  const handleViewDetails = useCallback((asociacion: Asociacion) => {
    toast.success(`Viendo detalles de ${asociacion.nombre}`);
  }, []);
  const handleRefresh = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      window.location.reload();
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  }, [refreshing]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      sortBy: 'nombre'
    });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Error al cerrar sesión');
    }
  }, [signOut]);

  // Error state
  if (error) {
    return (
      <DashboardLayout
        activeSection="asociaciones"
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
              <h3 className="text-3xl font-black text-gray-900 mb-4">Error al cargar asociaciones</h3>
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
      activeSection="asociaciones"
      sidebarComponent={(props) => (
        <SocioSidebarWithLogout
          {...props}
          onLogoutClick={handleLogout}
        />
      )}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20 relative overflow-hidden">
        {/* Enhanced background decorations */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-100/30 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Floating elements */}
        <div className="absolute top-20 right-20 w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" />
        <div className="absolute top-40 left-16 w-2 h-2 bg-purple-400/40 rounded-full animate-ping" />
        <div className="absolute bottom-32 right-32 w-4 h-4 bg-indigo-400/40 rounded-full animate-pulse" />

        <motion.div
          className="relative z-10 p-6 lg:p-8 max-w-7xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {/* Enhanced Header */}
          <motion.div 
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
              <div className="flex items-center gap-8">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                  <Building2 size={36} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3 leading-tight">
                    Mis Asociaciones
                  </h1>
                  <p className="text-lg lg:text-xl text-gray-600 font-semibold max-w-2xl">
                    Organizaciones a las que perteneces y sus beneficios exclusivos
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={<RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />}
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-2"
                >
                  {refreshing ? 'Actualizando...' : 'Actualizar'}
                </Button>
                <Button
                  size="lg"
                  leftIcon={<BarChart3 size={18} />}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl"
                >
                  Ver Estadísticas
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Filter Section */}
          <FilterSection
            filters={filters}
            setFilters={setFilters}
            onClearFilters={clearFilters}
            totalAsociaciones={filteredAsociaciones.length}
          />

          {/* Asociaciones Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <AnimatePresence>
              {loading ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="bg-gradient-to-br from-white/95 via-white/90 to-white/85 backdrop-blur-xl rounded-3xl border border-white/40 p-8 animate-pulse">
                      <div className="flex items-start gap-6 mb-8">
                        <div className="w-20 h-20 bg-gray-200 rounded-3xl"></div>
                        <div className="flex-1 space-y-4">
                          <div className="h-8 bg-gray-200 rounded-xl w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                          <div className="h-4 bg-gray-200 rounded-lg w-2/3"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mb-8">
                        <div className="h-20 bg-gray-200 rounded-2xl"></div>
                        <div className="h-20 bg-gray-200 rounded-2xl"></div>
                        <div className="h-20 bg-gray-200 rounded-2xl"></div>
                        <div className="h-20 bg-gray-200 rounded-2xl"></div>
                      </div>
                      <div className="h-32 bg-gray-200 rounded-2xl mb-4"></div>
                      <div className="h-24 bg-gray-200 rounded-2xl"></div>
                    </div>
                  ))}
                </div>
              ) : filteredAsociaciones.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {filteredAsociaciones.map((asociacion, index) => (
                    <AsociacionCard
                      key={asociacion.id}
                      asociacion={asociacion}
                      index={index}
                      onViewDetails={handleViewDetails}
                    />
                  ))}
                </div>
              ) : (
                <motion.div
                  className="text-center py-20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                    <Building2 size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4">
                    {filters.search ? 'No se encontraron asociaciones' : 'Sin asociaciones vinculadas'}
                  </h3>
                  <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                    {filters.search 
                      ? 'Intenta ajustar tu búsqueda para encontrar lo que buscas'
                      : 'Actualmente no perteneces a ninguna asociación. Contacta con una asociación para solicitar tu vinculación.'
                    }
                  </p>
                  {filters.search ? (
                    <Button 
                      variant="outline" 
                      onClick={clearFilters}
                      leftIcon={<RefreshCw size={16} />}
                      size="lg"
                      className="border-2"
                    >
                      Limpiar Búsqueda
                    </Button>
                  ) : (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6 max-w-lg mx-auto">
                      <div className="flex items-center gap-3 text-blue-700 font-bold mb-3">
                        <Info size={20} />
                        ¿Cómo unirme a una asociación?
                      </div>
                      <p className="text-blue-600 text-base">
                        Contacta directamente con la asociación de tu interés. Ellos podrán vincularte a su sistema de beneficios y servicios exclusivos.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

// Main page component with Suspense boundary
export default function SocioAsociacionesPage() {
  return (
    <Suspense fallback={
      <DashboardLayout
        activeSection="asociaciones"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={() => {}}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-10" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full blur-3xl animate-pulse" />
          
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <RefreshCw size={40} className="text-white animate-spin" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-4">Cargando asociaciones...</h3>
              <p className="text-gray-600 text-lg">Preparando la información de tus asociaciones</p>
              
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
      <SocioAsociacionesContent />
    </Suspense>
  );
}
