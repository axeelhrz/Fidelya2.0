'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Shield,
  Info,
  ExternalLink,
} from 'lucide-react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { AsociacionDetailsModal } from './AsociacionDetailsModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { navigateToBeneficios } from '@/utils/navigation';

interface Beneficio {
  id: string;
  titulo: string;
  descripcion?: string;
  descuento?: number;
  tipoDescuento?: 'porcentaje' | 'monto_fijo';
  categoria?: string;
  estado: 'activo' | 'inactivo' | 'vencido';
  comercioNombre?: string;
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

// Componente de tarjeta de asociación compacta y estética
const CompactAsociacionCard: React.FC<{
  asociacion: Asociacion;
  onViewDetails: (asociacion: Asociacion) => void;
  onNavigateToBeneficios: () => void;
}> = ({ asociacion, onViewDetails, onNavigateToBeneficios }) => {
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'inactivo':
        return 'text-gray-700 bg-gray-50 border-gray-200';
      case 'suspendido':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'activo':
        return <CheckCircle size={12} className="text-emerald-500" />;
      case 'inactivo':
        return <Clock size={12} className="text-gray-500" />;
      case 'suspendido':
        return <XCircle size={12} className="text-red-500" />;
      default:
        return <AlertCircle size={12} className="text-gray-500" />;
    }
  };

  // Calcular estadísticas reales
  const beneficiosActivos = asociacion.beneficios?.filter(b => b.estado === 'activo').length || 0;
  const comerciosActivos = asociacion.comercios?.filter(c => c.estado === 'activo').length || 0;
  const totalSocios = asociacion.sociosActivos || asociacion.totalSocios || 0;

  return (
    <motion.div
      className="bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden max-w-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
    >
      {/* Header con logo y estado */}
      <div className="relative p-4 pb-2">
        <div className="absolute top-3 right-3">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
            getEstadoColor(asociacion.estado)
          )}>
            {getEstadoIcon(asociacion.estado)}
            <span>Activo</span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
            {asociacion.logo ? (
              <Image
                src={asociacion.logo}
                alt={asociacion.nombre}
                width={48}
                height={48}
                className="w-full h-full object-cover rounded-xl"
                style={{ objectFit: 'cover', borderRadius: '0.75rem' }}
                unoptimized={true}
              />
            ) : (
              asociacion.nombre.charAt(0).toUpperCase()
            )}
          </div>

          {/* Información básica */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
              {asociacion.nombre}
            </h3>
            {asociacion.descripcion && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                {asociacion.descripcion}
              </p>
            )}
            
            {/* Badges de membresía */}
            <div className="flex items-center gap-2 flex-wrap">
              {asociacion.numeroSocio && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200">
                  <Shield size={10} className="text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">
                    #{asociacion.numeroSocio}
                  </span>
                </div>
              )}
              
              {asociacion.fechaVinculacion && (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 rounded-md border border-purple-200">
                  <Calendar size={10} className="text-purple-600" />
                  <span className="text-xs font-semibold text-purple-700">
                    {format(
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
                <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-200">
                  <Star size={10} className="text-amber-600 fill-current" />
                  <span className="text-xs font-semibold text-amber-700">
                    {asociacion.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center bg-blue-50 p-2 rounded-lg border border-blue-200">
            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Users size={12} className="text-white" />
            </div>
            <div className="text-sm font-bold text-blue-700">{totalSocios}</div>
            <div className="text-xs text-blue-600">Socios</div>
          </div>
          
          <div className="text-center bg-green-50 p-2 rounded-lg border border-green-200">
            <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Store size={12} className="text-white" />
            </div>
            <div className="text-sm font-bold text-green-700">{comerciosActivos}</div>
            <div className="text-xs text-green-600">Comercios</div>
          </div>
          
          <div className="text-center bg-purple-50 p-2 rounded-lg border border-purple-200">
            <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Gift size={12} className="text-white" />
            </div>
            <div className="text-sm font-bold text-purple-700">{beneficiosActivos}</div>
            <div className="text-xs text-purple-600">Beneficios</div>
          </div>
        </div>
      </div>

      {/* Beneficios destacados - Solo si hay beneficios reales */}
      {asociacion.beneficios && asociacion.beneficios.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200">
            <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1">
              <Gift size={10} className="text-purple-600" />
              Beneficios Destacados
            </h4>
            <div className="space-y-1">
              {asociacion.beneficios.filter(b => b.estado === 'activo').slice(0, 2).map((beneficio) => (
                <div key={beneficio.id} className="bg-white rounded-md p-2 border border-purple-200">
                  <div className="flex items-start justify-between">
                    <h5 className="font-medium text-gray-900 text-xs line-clamp-1 flex-1">
                      {beneficio.titulo}
                    </h5>
                    {beneficio.descuento && (
                      <div className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">
                        {beneficio.tipoDescuento === 'porcentaje' ? `${beneficio.descuento}%` : `$${beneficio.descuento}`}
                      </div>
                    )}
                  </div>
                  {beneficio.comercioNombre && (
                    <div className="flex items-center gap-1 mt-1">
                      <Store size={8} className="text-gray-400" />
                      <span className="text-xs text-gray-600">{beneficio.comercioNombre}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Información de contacto - Solo si hay información real */}
      {(asociacion.email || asociacion.telefono || asociacion.direccion) && (
        <div className="px-4 pb-3">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h4 className="text-xs font-bold text-gray-900 mb-2">Contacto</h4>
            <div className="space-y-1">
              {asociacion.email && (
                <div className="flex items-center gap-1.5">
                  <Mail size={10} className="text-gray-400" />
                  <span className="text-xs text-gray-600 truncate">{asociacion.email}</span>
                </div>
              )}
              {asociacion.telefono && (
                <div className="flex items-center gap-1.5">
                  <Phone size={10} className="text-gray-400" />
                  <span className="text-xs text-gray-600">{asociacion.telefono}</span>
                </div>
              )}
              {asociacion.direccion && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={10} className="text-gray-400" />
                  <span className="text-xs text-gray-600 line-clamp-1">{asociacion.direccion}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="p-4 pt-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Eye size={12} />}
            onClick={() => onViewDetails(asociacion)}
            className="flex-1 text-xs h-8"
          >
            Detalles
          </Button>
          
          {asociacion.sitioWeb && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ExternalLink size={12} />}
              onClick={() => window.open(asociacion.sitioWeb, '_blank')}
              className="text-xs h-8"
            >
              Web
            </Button>
          )}
          
          <Button
            size="sm"
            leftIcon={<ArrowUpRight size={12} />}
            onClick={onNavigateToBeneficios}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs h-8"
          >
            Beneficios
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const AsociacionesList: React.FC = () => {
  const { user } = useAuth();
  const [asociaciones, setAsociaciones] = useState<Asociacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsociacion, setSelectedAsociacion] = useState<Asociacion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Función para cargar datos completos de la asociación
  interface SocioData {
    id: string;
    asociacionId: string;
    fechaVinculacion?: Date | { toDate: () => Date } | null;
    numeroSocio?: string;
    estado?: string;
    email?: string;
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
          comercioNombre: data.comercioNombre
        };
      });

      // 4. Procesar comercios con conteo de beneficios
      const comercios: Comercio[] = comerciosSnapshot.docs.map(doc => {
        const data = doc.data();
        const comercioBeneficios = beneficios.filter(b => b.comercioNombre === data.nombre);
        
        return {
          id: doc.id,
          nombre: data.nombre || 'Comercio',
          categoria: data.categoria,
          estado: data.estado || 'activo',
          logo: data.logo,
          beneficiosCount: comercioBeneficios.length
        };
      });

      // 5. Calcular estadísticas detalladas
      const beneficiosActivos = beneficios.filter(b => b.estado === 'activo').length;
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
        fechaVinculacion: socioData.fechaVinculacion,
        totalSocios: sociosSnapshot.size,
        totalComercios: comerciosSnapshot.size,
        totalBeneficios: beneficiosSnapshot.size,
        beneficios: beneficios,
        comercios: comercios,
        rating: asociacionData.rating,
        numeroSocio: socioData.numeroSocio,
        beneficiosActivos,
        comerciosActivos,
        sociosActivos
      };

      return asociacionCompleta;
    } catch (error) {
      console.error('Error cargando datos completos de asociación:', error);
      return null;
    }
  }, []);

  // Cargar asociaciones del usuario
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

  // Handlers
  const handleViewDetails = useCallback((asociacion: Asociacion) => {
    setSelectedAsociacion(asociacion);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedAsociacion(null);
  }, []);

  const handleNavigateToBeneficios = useCallback(() => {
    // Cerrar modal si está abierto
    if (isModalOpen) {
      setIsModalOpen(false);
      setSelectedAsociacion(null);
    }
    
    // Navegar a la pestaña de beneficios usando la función helper
    navigateToBeneficios();
  }, [isModalOpen]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Cargando asociaciones</h3>
          <p className="text-gray-600">Obteniendo información de Firebase...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <motion.div 
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar asociaciones</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} leftIcon={<RefreshCw size={16} />}>
            Reintentar
          </Button>
        </motion.div>
      </div>
    );
  }

  // Empty state
  if (asociaciones.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <motion.div
          className="text-center max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin asociaciones vinculadas</h3>
          <p className="text-gray-600 mb-6">
            Actualmente no perteneces a ninguna asociación. Contacta con una asociación para solicitar tu vinculación.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                            <Info size={16} />
              ¿Cómo unirme a una asociación?
            </div>
            <p className="text-blue-600 text-sm">
              Contacta directamente con la asociación de tu interés. Ellos podrán vincularte a su sistema de beneficios y servicios exclusivos.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Content with associations
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Mis Asociaciones</h2>
            <p className="text-gray-600">
              {asociaciones.length} asociación{asociaciones.length !== 1 ? 'es' : ''} vinculada{asociaciones.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
            onClick={() => window.location.reload()}
          >
            Actualizar
          </Button>
        </div>

        {/* Associations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {asociaciones.map((asociacion) => (
              <CompactAsociacionCard
                key={asociacion.id}
                asociacion={asociacion}
                onViewDetails={handleViewDetails}
                onNavigateToBeneficios={handleNavigateToBeneficios}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de detalles */}
      {selectedAsociacion && (
        <AsociacionDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          asociacion={selectedAsociacion}
          onNavigateToBeneficios={handleNavigateToBeneficios}
        />
      )}
    </>
  );
};

export default AsociacionesList;