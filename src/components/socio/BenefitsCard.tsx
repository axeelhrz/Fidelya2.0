'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Calendar, 
  Tag, 
  Eye, 
  CheckCircle, 
  MapPin,
  Zap,
  Heart,
  Share2,
  ArrowUpRight,
  Crown,
  Sparkles,
  Flame,
  DollarSign,
  Percent,
  Gift,
  X,
  Clock,
  Users,
  TrendingUp,
  Award,
  ShoppingBag
} from 'lucide-react';
import { Beneficio, BeneficioUso } from '@/types/beneficio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BenefitsCardProps {
  beneficio?: Beneficio;
  beneficioUso?: BeneficioUso;
  tipo: 'disponible' | 'usado';
  onUse?: (beneficioId: string) => void;
  view?: 'grid' | 'list';
}

export const BenefitsCard: React.FC<BenefitsCardProps> = ({
  beneficio,
  beneficioUso,
  tipo,
  onUse,
  view = 'grid'
}) => {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Para beneficios usados, necesitamos obtener la info del beneficio
  const data = beneficio || (beneficioUso ? {
    id: beneficioUso.beneficioId,
    titulo: 'Beneficio Usado',
    descripcion: beneficioUso.detalles || 'Beneficio utilizado anteriormente',
    descuento: 0,
    tipo: 'porcentaje' as const,
    comercioNombre: 'Comercio',
    categoria: 'General',
    fechaFin: beneficioUso.fechaUso,
    destacado: false
  } : null);

  if (!data) return null;

  const isDisponible = tipo === 'disponible';
  const fechaUso = beneficioUso?.fechaUso?.toDate();
  const fechaVencimiento = beneficio?.fechaFin?.toDate();

  const getDiscountText = () => {
    if (data.tipo === 'porcentaje') {
      return `${data.descuento}% OFF`;
    } else if (data.tipo === 'monto_fijo') {
      return `$${data.descuento} OFF`;
    } else {
      return 'GRATIS';
    }
  };

  const getCategoryIcon = (categoria: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Retail': <ShoppingBag className="w-4 h-4" />,
      'Restaurantes': <Gift className="w-4 h-4" />,
      'Servicios': <Zap className="w-4 h-4" />,
      'Entretenimiento': <Sparkles className="w-4 h-4" />
    };
    return icons[categoria] || <Store className="w-4 h-4" />;
  };

  const getCategoryGradient = (categoria: string) => {
    const gradients: Record<string, string> = {
      'Retail': 'from-sky-500 to-blue-600',
      'Restaurantes': 'from-emerald-500 to-teal-600',
      'Servicios': 'from-purple-500 to-indigo-600',
      'Entretenimiento': 'from-pink-500 to-rose-600'
    };
    return gradients[categoria] || 'from-gray-500 to-gray-600';
  };

  const getComercioColor = (comercioNombre: string) => {
    const colors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];
    const index = comercioNombre.length % colors.length;
    return colors[index];
  };

  const isEndingSoon = (fechaFin: Date | { toDate: () => Date } | undefined) => {
    if (!fechaFin) return false;
    let vencimiento: Date;
    if (fechaFin instanceof Date) {
      vencimiento = fechaFin;
    } else if (typeof fechaFin.toDate === 'function') {
      vencimiento = fechaFin.toDate();
    } else {
      return false;
    }
    const en7Dias = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return vencimiento <= en7Dias;
  };

  const isNew = (fechaCreacion: { toDate: () => Date } | undefined) => {
    if (!fechaCreacion || !fechaCreacion.toDate) return false;
    const creacion = fechaCreacion.toDate();
    const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return creacion > hace7Dias;
  };

  const handleUse = async () => {
    if (!onUse) return;
    setLoading(true);
    try {
      await onUse(data.id);
    } finally {
      setLoading(false);
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { y: -8, scale: 1.02 }
  };

  const shineVariants = {
    initial: { x: '-100%' },
    animate: { x: '100%' }
  };

  return (
    <>
      <motion.div
        className={`group relative overflow-hidden ${
          view === 'list' ? 'flex items-stretch' : ''
        }`}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Background and Glass Effect */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-gray-50/30 rounded-3xl"></div>
        
        {/* Shine Effect */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            variants={shineVariants}
            initial="initial"
            whileHover="animate"
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>

        {/* Featured Badge */}
        {beneficio?.destacado && (
          <motion.div
            className="absolute top-4 left-4 z-20"
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
              <Crown className="w-3 h-3" />
              <span>DESTACADO</span>
            </div>
          </motion.div>
        )}

        {/* Status Badge */}
        <motion.div
          className="absolute top-4 right-4 z-20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isDisponible ? (
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
              <Zap className="w-3 h-3" />
              <span>DISPONIBLE</span>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
              <CheckCircle className="w-3 h-3" />
              <span>USADO</span>
            </div>
          )}
        </motion.div>

        <div className={`relative z-10 ${view === 'list' ? 'flex w-full' : ''}`}>
          {/* Main Content */}
          <div className={`${view === 'list' ? 'flex-1 flex' : ''}`}>
            {/* Header Section */}
            <div className={`${view === 'grid' ? 'p-6 pb-4' : 'p-6 flex-1'}`}>
              {/* Category and Discount Badges */}
              <div className="flex flex-wrap gap-2 mb-4 mt-8">
                <motion.div
                  className={`bg-gradient-to-r ${getCategoryGradient(data.categoria)} text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                >
                  {getCategoryIcon(data.categoria)}
                  <span>{data.categoria}</span>
                </motion.div>
                
                <motion.div
                  className={`${
                    isDisponible 
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600' 
                      : 'bg-gradient-to-r from-gray-400 to-gray-500'
                  } text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg`}
                  whileHover={{ scale: 1.05 }}
                >
                  {data.tipo === 'porcentaje' && <Percent className="w-3 h-3" />}
                  {data.tipo === 'monto_fijo' && <DollarSign className="w-3 h-3" />}
                  {data.tipo === 'producto_gratis' && <Gift className="w-3 h-3" />}
                  <span>{getDiscountText()}</span>
                </motion.div>

                {/* Additional Badges */}
                {beneficio && isNew(beneficio.creadoEn) && (
                  <motion.div
                    className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    animate={{ 
                      boxShadow: [
                        '0 4px 12px rgba(239, 68, 68, 0.3)',
                        '0 4px 20px rgba(239, 68, 68, 0.5)',
                        '0 4px 12px rgba(239, 68, 68, 0.3)'
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>NUEVO</span>
                  </motion.div>
                )}
                
                {beneficio && isEndingSoon(beneficio.fechaFin) && (
                  <motion.div
                    className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    animate={{ 
                      boxShadow: [
                        '0 4px 12px rgba(249, 115, 22, 0.3)',
                        '0 4px 20px rgba(249, 115, 22, 0.5)',
                        '0 4px 12px rgba(249, 115, 22, 0.3)'
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Flame className="w-3 h-3" />
                    <span>POR VENCER</span>
                  </motion.div>
                )}
              </div>

              {/* Title and Description */}
              <motion.h3 
                className={`text-xl font-bold mb-3 ${
                  isDisponible ? 'text-gray-900' : 'text-gray-600'
                } line-clamp-2`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {data.titulo}
              </motion.h3>
              
              <motion.p 
                className={`${
                  isDisponible ? 'text-gray-600' : 'text-gray-500'
                } text-sm leading-relaxed mb-4 line-clamp-2`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {data.descripcion}
              </motion.p>

              {/* Meta Information */}
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {isDisponible && fechaVencimiento ? (
                      `Vence: ${format(fechaVencimiento, 'dd/MM/yyyy', { locale: es })}`
                    ) : fechaUso ? (
                      `Usado: ${format(fechaUso, 'dd/MM/yyyy', { locale: es })}`
                    ) : 'Sin fecha'}
                  </span>
                </div>
                
                {beneficio?.usosActuales && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{beneficio.usosActuales} usos</span>
                  </div>
                )}
                
                {beneficioUso?.montoDescuento && beneficioUso.montoDescuento > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-emerald-600 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    <span>Ahorraste: ${beneficioUso.montoDescuento}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Commerce Section for Grid View */}
            {view === 'grid' && isDisponible && (
              <div className="px-6 pb-4">
                <motion.div 
                  className="bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100/50"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${getComercioColor(data.comercioNombre)}, ${getComercioColor(data.comercioNombre)}dd)` 
                      }}
                    >
                      {data.comercioNombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 truncate">{data.comercioNombre}</h4>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>Centro Comercial</span>
                      </div>
                    </div>
                    <motion.button
                      className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-600 hover:text-sky-600 border border-gray-200/50"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className={`${
            view === 'grid' 
              ? 'px-6 pb-6' 
              : 'p-6 flex flex-col justify-center min-w-[200px]'
          }`}>
            <div className={`flex gap-3 ${view === 'list' ? 'flex-col' : ''}`}>
              <motion.button
                className="flex-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 hover:bg-gray-50/80 hover:border-gray-300/50 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDetailModalOpen(true)}
              >
                <Eye className="w-4 h-4" />
                <span>Ver Detalles</span>
              </motion.button>
              
              {isDisponible && onUse && (
                <motion.button
                  className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUse}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>{loading ? 'Usando...' : 'Usar Ahora'}</span>
                </motion.button>
              )}
              
              <div className="flex gap-2">
                <motion.button
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    isFavorite 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg' 
                      : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 hover:text-pink-500'
                  }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </motion.button>
                
                <motion.button
                  className="w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 rounded-xl flex items-center justify-center hover:text-sky-600 transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailModalOpen(false)}
            />
            
            {/* Modal Content */}
            <motion.div
              className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getCategoryIcon(data.categoria)}
                    <h3 className="text-xl font-bold text-gray-900">{data.titulo}</h3>
                  </div>
                  <motion.button
                    className="w-8 h-8 bg-gray-100/80 backdrop-blur-sm rounded-xl flex items-center justify-center text-gray-600 hover:text-gray-900"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setDetailModalOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {/* Commerce Info */}
                <div className="bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-100/50">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ 
                        background: `linear-gradient(135deg, ${getComercioColor(data.comercioNombre)}, ${getComercioColor(data.comercioNombre)}dd)` 
                      }}
                    >
                      {data.comercioNombre.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{data.comercioNombre}</h4>
                      <p className="text-sm text-gray-500">{data.categoria}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>Descripción</span>
                  </h5>
                  <p className="text-gray-600 leading-relaxed">{data.descripcion}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100/50">
                    <h5 className="font-semibold text-emerald-900 mb-1 flex items-center space-x-1">
                      <Tag className="w-4 h-4" />
                      <span>Descuento</span>
                    </h5>
                    <p className="text-2xl font-bold text-emerald-600">{getDiscountText()}</p>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-4 border border-sky-100/50">
                    <h5 className="font-semibold text-sky-900 mb-1 flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Estado</span>
                    </h5>
                    <p className={`text-lg font-bold ${isDisponible ? 'text-emerald-600' : 'text-gray-600'}`}>
                      {isDisponible ? 'Disponible' : 'Usado'}
                    </p>
                  </div>
                </div>

                {/* Conditions */}
                {beneficio?.condiciones && (
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Condiciones</span>
                    </h5>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100/50">
                      <p className="text-amber-900 text-sm leading-relaxed">{beneficio.condiciones}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-white/50">
                <div className="flex gap-3">
                  <motion.button
                    className="flex-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700 px-4 py-2.5 rounded-xl font-medium flex items-center justify-center space-x-2 hover:bg-gray-50/80"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDetailModalOpen(false)}
                  >
                    <X className="w-4 h-4" />
                    <span>Cerrar</span>
                  </motion.button>
                  {isDisponible && onUse && (
                    <motion.button
                      className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleUse();
                        setDetailModalOpen(false);
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Usando...' : 'Usar Beneficio'}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
