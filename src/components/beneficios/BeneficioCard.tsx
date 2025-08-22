'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Gift, 
  Calendar, 
  MapPin, 
  Eye, 
  Heart, 
  Share2, 
  Zap,
  Crown,
  Sparkles,
  Flame,
  DollarSign,
  Percent,
  Clock,
  Users,
  Store,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Beneficio } from '@/types/beneficio';
import { format, differenceInDays, isAfter, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import toast from 'react-hot-toast';

interface BeneficioCardProps {
  beneficio: Beneficio;
  onUse?: (beneficioId: string, comercioId: string) => Promise<void>;
  onEdit?: (beneficio: Beneficio) => void;
  onDelete?: (beneficioId: string) => void;
  onToggleStatus?: (beneficioId: string, estado: 'activo' | 'inactivo') => void;
  view?: 'grid' | 'list';
  userRole?: 'socio' | 'comercio' | 'asociacion';
  showActions?: boolean;
  className?: string;
}

export const BeneficioCard: React.FC<BeneficioCardProps> = ({
  beneficio,
  onUse,
  onEdit,
  onToggleStatus,
  view = 'grid',
  userRole = 'socio',
  showActions = true,
  className = ''
}) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Utilidades
  const getDiscountText = () => {
    switch (beneficio.tipo) {
      case 'porcentaje':
        return `${beneficio.descuento}% OFF`;
      case 'monto_fijo':
        return `$${beneficio.descuento} OFF`;
      case 'producto_gratis':
        return 'GRATIS';
      default:
        return 'DESCUENTO';
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'activo': return 'text-green-600 bg-green-100';
      case 'inactivo': return 'text-gray-600 bg-gray-100';
      case 'vencido': return 'text-red-600 bg-red-100';
      case 'agotado': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (estado: string) => {
    switch (estado) {
      case 'activo': return 'Activo';
      case 'inactivo': return 'Inactivo';
      case 'vencido': return 'Vencido';
      case 'agotado': return 'Agotado';
      default: return estado;
    }
  };

  const isNew = () => {
    const createdDate = beneficio.creadoEn.toDate();
    const sevenDaysAgo = addDays(new Date(), -7);
    return isAfter(createdDate, sevenDaysAgo);
  };

  const isEndingSoon = () => {
    const endDate = beneficio.fechaFin.toDate();
    const sevenDaysFromNow = addDays(new Date(), 7);
    return endDate <= sevenDaysFromNow && endDate > new Date();
  };

  const getDaysRemaining = () => {
    return differenceInDays(beneficio.fechaFin.toDate(), new Date());
  };

  const getComercioColor = (nombre: string) => {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
    const index = nombre.length % colors.length;
    return colors[index];
  };

  // Handlers
  const handleUse = async () => {
    if (!onUse) return;
    
    setLoading(true);
    try {
      await onUse(beneficio.id, beneficio.comercioId);
      setDetailModalOpen(false);
    } catch (error) {
      console.error('Error usando beneficio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast.success(isFavorite ? 'Eliminado de favoritos' : 'Agregado a favoritos');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: beneficio.titulo,
          text: beneficio.descripcion,
          url: window.location.href
        });
      } catch{
        // Usuario canceló
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${beneficio.titulo} - ${beneficio.descripcion}`);
        toast.success('Copiado al portapapeles');
      } catch {
        toast.error('Error al copiar');
      }
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(beneficio);
    }
  };


  const handleToggleStatus = () => {
    if (onToggleStatus) {
      const newStatus = beneficio.estado === 'activo' ? 'inactivo' : 'activo';
      onToggleStatus(beneficio.id, newStatus);
    }
  };

  return (
    <>
      <motion.div
        className={`
          bg-white rounded-2xl border border-gray-100 shadow-lg hover:shadow-xl 
          transition-all duration-300 overflow-hidden relative group
          ${view === 'list' ? 'flex items-center' : ''}
          ${beneficio.destacado ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
          ${className}
        `}
        whileHover={{ y: -4, scale: 1.02 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Indicador de destacado */}
        {beneficio.destacado && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-500"></div>
        )}

        {/* Botón de favorito */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
        >
          <Heart 
            size={16} 
            className={isFavorite ? 'text-red-500 fill-current' : 'text-gray-400'} 
          />
        </button>

        <div className={`p-6 ${view === 'list' ? 'flex-1' : ''}`}>
          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4 mt-2">
            {/* Badge de categoría */}
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800">
              <Store size={12} className="mr-1" />
              {beneficio.categoria}
            </span>

            {/* Badge de descuento */}
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-green-500 text-white shadow-lg">
              {beneficio.tipo === 'porcentaje' && <Percent size={12} className="mr-1" />}
              {beneficio.tipo === 'monto_fijo' && <DollarSign size={12} className="mr-1" />}
              {beneficio.tipo === 'producto_gratis' && <Gift size={12} className="mr-1" />}
              {getDiscountText()}
            </span>

            {/* Badge de estado */}
            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${getStatusColor(beneficio.estado)}`}>
              {beneficio.estado === 'activo' && <CheckCircle size={12} className="mr-1" />}
              {beneficio.estado === 'inactivo' && <X size={12} className="mr-1" />}
              {beneficio.estado === 'vencido' && <Clock size={12} className="mr-1" />}
              {beneficio.estado === 'agotado' && <AlertCircle size={12} className="mr-1" />}
              {getStatusText(beneficio.estado)}
            </span>

            {/* Badges especiales */}
            {beneficio.destacado && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-yellow-500 text-white shadow-lg">
                <Crown size={12} className="mr-1" />
                Destacado
              </span>
            )}

            {isNew() && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-red-500 text-white shadow-lg animate-pulse">
                <Sparkles size={12} className="mr-1" />
                Nuevo
              </span>
            )}

            {isEndingSoon() && (
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-orange-500 text-white shadow-lg animate-pulse">
                <Flame size={12} className="mr-1" />
                Por vencer
              </span>
            )}
          </div>

          {/* Título y descripción */}
          <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {beneficio.titulo}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-2">
            {beneficio.descripcion}
          </p>

          {/* Información meta */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>
                Vence: {format(beneficio.fechaFin.toDate(), 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{beneficio.usosActuales} usos</span>
            </div>

            {getDaysRemaining() > 0 && (
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{getDaysRemaining()} días restantes</span>
              </div>
            )}
          </div>

          {/* Información del comercio */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ background: getComercioColor(beneficio.comercioNombre) }}
              >
                {beneficio.comercioNombre.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {beneficio.comercioNombre}
                </h4>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin size={12} />
                  <span>Centro Comercial</span>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Eye size={16} />}
                onClick={() => setDetailModalOpen(true)}
                className="flex-1"
              >
                Ver Detalles
              </Button>

              {userRole === 'socio' && beneficio.estado === 'activo' && onUse && (
                <Button
                  size="sm"
                  leftIcon={<Zap size={16} />}
                  onClick={handleUse}
                  loading={loading}
                  className="flex-1"
                >
                  Usar Ahora
                </Button>
              )}

              {(userRole === 'comercio' || userRole === 'asociacion') && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                  >
                    Editar
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleStatus}
                  >
                    {beneficio.estado === 'activo' ? 'Desactivar' : 'Activar'}
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                leftIcon={<Share2 size={16} />}
                onClick={handleShare}
              >
                <span className="sr-only">Compartir</span>
              </Button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal de detalles */}
      <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Gift size={24} />
              {beneficio.titulo}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header del beneficio */}
            <div className="flex items-start gap-4 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                style={{ background: getComercioColor(beneficio.comercioNombre) }}
              >
                {beneficio.comercioNombre.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {beneficio.comercioNombre}
                </h3>
                <p className="text-gray-600 mb-3">{beneficio.categoria}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-green-500 text-white shadow-lg">
                    {getDiscountText()}
                  </span>
                  {beneficio.destacado && (
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold bg-yellow-500 text-white shadow-lg">
                      <Crown size={14} className="mr-1" />
                      Destacado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye size={16} />
                Descripción del Beneficio
              </h4>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-700 leading-relaxed">{beneficio.descripcion}</p>
              </div>
            </div>

            {/* Condiciones */}
            {beneficio.condiciones && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Términos y Condiciones
                </h4>
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-gray-700 leading-relaxed">{beneficio.condiciones}</p>
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-blue-600" />
                  <h5 className="font-semibold text-blue-900">Válido hasta</h5>
                </div>
                <p className="text-lg font-bold text-blue-700">
                  {format(beneficio.fechaFin.toDate(), 'dd MMMM yyyy', { locale: es })}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {getDaysRemaining()} días restantes
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={16} className="text-green-600" />
                  <h5 className="font-semibold text-green-900">Popularidad</h5>
                </div>
                <p className="text-lg font-bold text-green-700">
                  {beneficio.usosActuales} usos
                </p>
                <p className="text-sm text-green-600 mt-1">
                  {beneficio.limiteTotal ? `de ${beneficio.limiteTotal} máximo` : 'Sin límite'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-purple-600" />
                  <h5 className="font-semibold text-purple-900">Ahorro</h5>
                </div>
                <p className="text-lg font-bold text-purple-700">
                  {getDiscountText()}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  En tu compra
                </p>
              </div>
            </div>

            {/* Tags */}
            {beneficio.tags && beneficio.tags.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Etiquetas</h4>
                <div className="flex flex-wrap gap-2">
                  {beneficio.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                onClick={handleShare}
                leftIcon={<Share2 size={16} />}
                className="flex-1 sm:flex-none"
              >
                Compartir
              </Button>
              <Button
                variant="outline"
                onClick={handleToggleFavorite}
                leftIcon={<Heart size={16} className={isFavorite ? 'fill-current' : ''} />}
                className="flex-1 sm:flex-none"
              >
                {isFavorite ? 'Quitar' : 'Favorito'}
              </Button>
            </div>
            
            <div className="flex gap-2 flex-1 sm:flex-none">
              <Button
                variant="outline"
                onClick={() => setDetailModalOpen(false)}
                leftIcon={<X size={16} />}
                className="flex-1 sm:flex-none"
              >
                Cerrar
              </Button>
              
              {userRole === 'socio' && beneficio.estado === 'activo' && onUse && (
                <Button
                  onClick={handleUse}
                  loading={loading}
                  leftIcon={<Zap size={16} />}
                  className="flex-1 sm:flex-none"
                >
                  Usar Beneficio
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
