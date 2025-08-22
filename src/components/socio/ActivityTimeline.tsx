import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Store, 
  Gift, 
  Calendar,
  DollarSign,
  TrendingUp,
  Award,
} from 'lucide-react';
import { HistorialValidacion } from '@/services/validaciones.service';

interface ActivityTimelineProps {
  validaciones: HistorialValidacion[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  validaciones,
  onLoadMore,
  hasMore = false,
  loading = false
}) => {
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fallida':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelada':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return 'text-green-700 bg-green-100 border-green-200';
      case 'fallida':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'cancelada':
        return 'text-gray-700 bg-gray-100 border-gray-200';
      default:
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDiscount = (validacion: HistorialValidacion) => {
    switch (validacion.tipoDescuento) {
      case 'porcentaje':
        return `${validacion.descuento}% OFF`;
      case 'monto_fijo':
        return `${formatCurrency(validacion.descuento)} OFF`;
      case 'producto_gratis':
        return 'GRATIS';
      default:
        return 'Beneficio';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
      } else {
        return date.toLocaleDateString('es-ES', { 
          day: 'numeric', 
          month: 'short',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  };

  const groupValidacionesByDate = (validaciones: HistorialValidacion[]) => {
    const groups: { [key: string]: HistorialValidacion[] } = {};
    
    validaciones.forEach(validacion => {
      const dateKey = validacion.fechaValidacion.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(validacion);
    });
    
    return Object.entries(groups).map(([dateKey, items]) => ({
      date: new Date(dateKey),
      validaciones: items
    }));
  };

  if (validaciones.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay actividad aún
        </h3>
        <p className="text-gray-500 mb-6">
          Tus validaciones de beneficios aparecerán aquí
        </p>
        <div className="inline-flex items-center px-4 py-2 bg-violet-100 text-violet-700 rounded-lg text-sm font-medium">
          <Award className="w-4 h-4 mr-2" />
          ¡Escanea tu primer QR para comenzar!
        </div>
      </div>
    );
  }

  const groupedValidaciones = groupValidacionesByDate(validaciones);

  return (
    <div className="space-y-6">
      {groupedValidaciones.map((group, groupIndex) => (
        <div key={group.date.toDateString()}>
          {/* Date Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-900">
                {group.date.toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long',
                  year: group.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })}
              </h3>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500">
              {group.validaciones.length} {group.validaciones.length === 1 ? 'validación' : 'validaciones'}
            </span>
          </div>

          {/* Validaciones for this date */}
          <div className="space-y-3">
            {group.validaciones.map((validacion, index) => (
              <motion.div
                key={validacion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (groupIndex * 0.1) + (index * 0.05) }}
                className="relative bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                {/* Status Indicator */}
                <div className="absolute top-4 right-4">
                  {getStatusIcon(validacion.estado)}
                </div>

                <div className="flex items-start space-x-4 pr-8">
                  {/* Comercio Logo/Icon */}
                    {validacion.comercioLogo ? (
                      <Image
                        src={validacion.comercioLogo}
                        alt={validacion.comercioNombre}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-xl object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Store className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {validacion.comercioNombre}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(validacion.estado)}`}>
                        {validacion.estado}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mb-2">
                      <Gift className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-700 truncate">
                        {validacion.beneficioTitulo}
                      </p>
                    </div>

                    {validacion.beneficioDescripcion && (
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {validacion.beneficioDescripcion}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-sm font-medium text-green-600">
                            {formatDiscount(validacion)}
                          </span>
                        </div>
                        
                        {validacion.montoDescuento > 0 && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-600">
                              {formatCurrency(validacion.montoDescuento)}
                            </span>
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(validacion.fechaValidacion)}
                      </span>
                    </div>

                    {/* Additional Info */}
                    {(validacion.metodoPago || validacion.notas) && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        {validacion.metodoPago && (
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs text-gray-500">Método de pago:</span>
                            <span className="text-xs font-medium text-gray-700">
                              {validacion.metodoPago}
                            </span>
                          </div>
                        )}
                        
                        {validacion.notas && (
                          <div className="flex items-start space-x-2">
                            <span className="text-xs text-gray-500">Notas:</span>
                            <span className="text-xs text-gray-700">
                              {validacion.notas}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Validation Code */}
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Código:</span>
                        <span className="text-xs font-mono font-medium text-gray-700">
                          {validacion.codigoValidacion}
                        </span>
                      </div>
                    </div>
                  </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-6">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                Cargando...
              </>
            ) : (
              'Cargar más actividad'
            )}
          </button>
        </div>
      )}
    </div>
  );
};