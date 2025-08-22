'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  X,
  Users,
  Gift,
  Store,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Star,
  Shield,
  ExternalLink,
  Activity,
  CheckCircle,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Beneficio {
  id: string;
  titulo: string;
  descripcion?: string;
  descuento?: number;
  tipoDescuento?: 'porcentaje' | 'monto_fijo';
  categoria?: string;
  estado: 'activo' | 'inactivo' | 'vencido';
  comercioNombre?: string;
  condiciones?: string;
  usosMaximos?: number;
  usosActuales?: number;
}

interface Comercio {
  id: string;
  nombre: string;
  categoria?: string;
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
  fechaVinculacion?: Date | { toDate: () => Date } | null;
  totalSocios?: number;
  totalComercios?: number;
  totalBeneficios?: number;
  beneficios?: Beneficio[];
  comercios?: Comercio[];
  rating?: number;
  numeroSocio?: string;
  beneficiosActivos?: number;
  comerciosActivos?: number;
  sociosActivos?: number;
}

interface AsociacionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  asociacion: Asociacion;
  onNavigateToBeneficios: () => void;
}

export const AsociacionDetailsModal: React.FC<AsociacionDetailsModalProps> = ({
  isOpen,
  onClose,
  asociacion,
  onNavigateToBeneficios
}) => {
  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const beneficiosActivos = asociacion.beneficios?.filter(b => b.estado === 'activo') || [];
  const comerciosActivos = asociacion.comercios?.filter(c => c.estado === 'activo') || [];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.3 
            }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header con gradiente */}
            <div className="relative bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 p-8 text-white">
              {/* Botón de cerrar */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors z-10"
                aria-label="Cerrar modal"
              >
                <X size={24} />
              </button>

              {/* Efectos de fondo */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-600/20" />
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/10 to-transparent rounded-full blur-2xl" />

              <div className="relative z-10 flex items-start gap-6">
                {/* Logo grande */}
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-2xl flex-shrink-0 border border-white/30">
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

                {/* Información principal */}
                <div className="flex-1">
                  <h1 className="text-3xl font-black mb-3">{asociacion.nombre}</h1>
                  {asociacion.descripcion && (
                    <p className="text-white/90 text-lg mb-4 leading-relaxed">{asociacion.descripcion}</p>
                  )}
                  
                  <div className="flex items-center gap-4 flex-wrap">
                    {asociacion.numeroSocio && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                        <Shield size={16} className="text-white" />
                        <span className="font-semibold">Socio #{asociacion.numeroSocio}</span>
                      </div>
                    )}
                    
                    {asociacion.fechaVinculacion && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                        <Calendar size={16} className="text-white" />
                        <span className="font-semibold">
                          Miembro desde {format(
                            typeof asociacion.fechaVinculacion === 'object' && asociacion.fechaVinculacion !== null && 'toDate' in asociacion.fechaVinculacion
                              ? asociacion.fechaVinculacion.toDate()
                              : (asociacion.fechaVinculacion as Date),
                            'MMMM yyyy',
                            { locale: es }
                          )}
                        </span>
                      </div>
                    )}
                    
                    {asociacion.rating && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                        <Star size={16} className="text-white fill-current" />
                        <span className="font-semibold">{asociacion.rating.toFixed(1)} estrellas</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="max-h-[60vh] overflow-y-auto p-8">
              {/* Estadísticas principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Users size={24} className="text-white" />
                  </div>
                  <div className="text-2xl font-black text-blue-700 mb-1">
                    {asociacion.sociosActivos || asociacion.totalSocios || 0}
                  </div>
                  <div className="text-sm text-blue-600 font-bold uppercase tracking-wide">Socios Activos</div>
                </div>
                
                <div className="text-center bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border border-green-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Store size={24} className="text-white" />
                  </div>
                  <div className="text-2xl font-black text-green-700 mb-1">
                    {comerciosActivos.length}
                  </div>
                  <div className="text-sm text-green-600 font-bold uppercase tracking-wide">Comercios</div>
                </div>
                
                <div className="text-center bg-gradient-to-br from-purple-50 to-pink-100 p-6 rounded-2xl border border-purple-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Gift size={24} className="text-white" />
                  </div>
                  <div className="text-2xl font-black text-purple-700 mb-1">
                    {beneficiosActivos.length}
                  </div>
                  <div className="text-sm text-purple-600 font-bold uppercase tracking-wide">Beneficios</div>
                </div>
                
                <div className="text-center bg-gradient-to-br from-amber-50 to-orange-100 p-6 rounded-2xl border border-amber-200">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <Activity size={24} className="text-white" />
                  </div>
                  <div className="text-2xl font-black text-amber-700 mb-1">
                    {asociacion.rating ? (asociacion.rating * 20).toFixed(0) : '85'}%
                  </div>
                  <div className="text-sm text-amber-600 font-bold uppercase tracking-wide">Actividad</div>
                </div>
              </div>

              {/* Beneficios Disponibles */}
              {beneficiosActivos.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                      <Gift size={24} className="text-purple-600" />
                      Beneficios Disponibles
                    </h2>
                    <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                      {beneficiosActivos.length} activos
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {beneficiosActivos.slice(0, 6).map((beneficio) => (
                      <motion.div 
                        key={beneficio.id} 
                        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-gray-900 text-lg flex-1">{beneficio.titulo}</h3>
                          {beneficio.descuento && (
                            <div className="ml-3 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg">
                              {beneficio.tipoDescuento === 'porcentaje' ? `${beneficio.descuento}%` : `$${beneficio.descuento}`}
                            </div>
                          )}
                        </div>
                        
                        {beneficio.descripcion && (
                          <p className="text-gray-600 mb-4 leading-relaxed">{beneficio.descripcion}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {beneficio.comercioNombre && (
                              <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-purple-200">
                                <Store size={14} className="text-gray-500" />
                                <span className="text-sm text-gray-700 font-medium">{beneficio.comercioNombre}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg border border-green-200">
                            <CheckCircle size={14} className="text-green-600" />
                            <span className="text-sm text-green-700 font-bold">Disponible</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {beneficiosActivos.length > 6 && (
                    <div className="text-center mt-6">
                      <Button
                        onClick={onNavigateToBeneficios}
                        size="lg"
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-xl"
                      >
                        Ver todos los beneficios ({beneficiosActivos.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Comercios Afiliados */}
              {comerciosActivos.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                      <Store size={24} className="text-green-600" />
                      Comercios Afiliados
                    </h2>
                    <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                      {comerciosActivos.length} activos
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {comerciosActivos.slice(0, 8).map((comercio) => (
                      <motion.div 
                        key={comercio.id} 
                        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 text-center hover:shadow-lg transition-all duration-300"
                        whileHover={{ scale: 1.05 }}
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
                        <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{comercio.nombre}</h3>
                        {comercio.categoria && (
                          <p className="text-xs text-gray-600 mb-2">{comercio.categoria}</p>
                        )}
                        {comercio.beneficiosCount && comercio.beneficiosCount > 0 && (
                          <div className="flex items-center justify-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
                            <Gift size={12} className="text-green-600" />
                            <span className="text-xs text-green-700 font-bold">
                              {comercio.beneficiosCount} beneficio{comercio.beneficiosCount > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Información de Contacto */}
              {(asociacion.email || asociacion.telefono || asociacion.direccion || asociacion.sitioWeb) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-3">
                    <Mail size={24} className="text-blue-600" />
                    Información de Contacto
                  </h2>
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {asociacion.email && (
                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Mail size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Email</div>
                            <div className="text-sm font-bold text-gray-900">{asociacion.email}</div>
                          </div>
                        </div>
                      )}
                      
                      {asociacion.telefono && (
                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Phone size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Teléfono</div>
                            <div className="text-sm font-bold text-gray-900">{asociacion.telefono}</div>
                          </div>
                        </div>
                      )}
                      
                      {asociacion.direccion && (
                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm md:col-span-2">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <MapPin size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Dirección</div>
                            <div className="text-sm font-bold text-gray-900">{asociacion.direccion}</div>
                          </div>
                        </div>
                      )}
                      
                      {asociacion.sitioWeb && (
                        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm md:col-span-2">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Globe size={20} className="text-white" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Sitio Web</div>
                            <a 
                              href={asociacion.sitioWeb} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 underline transition-colors"
                            >
                              {asociacion.sitioWeb}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con botones de acción */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  size="lg"
                  className="order-last sm:order-first"
                >
                  Cerrar
                </Button>
                
                {asociacion.sitioWeb && (
                  <Button
                    variant="outline"
                    leftIcon={<ExternalLink size={18} />}
                    onClick={() => window.open(asociacion.sitioWeb, '_blank')}
                    size="lg"
                  >
                    Visitar Sitio Web
                  </Button>
                )}
                
                <Button
                  leftIcon={<Gift size={18} />}
                  onClick={onNavigateToBeneficios}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-xl"
                >
                  Ver Todos los Beneficios
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Usar portal para renderizar en el nivel superior del DOM
  return typeof window !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};

export default AsociacionDetailsModal;