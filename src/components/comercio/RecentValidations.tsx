import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Gift,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { ValidationData } from '@/services/comercio.service';

interface RecentValidationsProps {
  validaciones: ValidationData[];
  onViewAll?: () => void;
}

export const RecentValidations: React.FC<RecentValidationsProps> = ({ 
  validaciones, 
  onViewAll 
}) => {
  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fallida':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'exitosa':
        return 'text-green-700 bg-green-100';
      case 'fallida':
        return 'text-red-700 bg-red-100';
      default:
        return 'text-yellow-700 bg-yellow-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!validaciones || validaciones.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Gift className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-4">No hay validaciones recientes</p>
        <p className="text-sm text-gray-400">
          Las validaciones aparecerán aquí cuando los socios usen tus beneficios
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {validaciones.map((validacion, index) => (
        <motion.div
          key={validacion.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {getStatusIcon(validacion.estado)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <User className="w-3 h-3 text-gray-400" />
                <p className="text-sm font-medium text-gray-900 truncate">
                  {validacion.socioNombre}
                </p>
              </div>
              
              <div className="flex items-center space-x-2 mb-1">
                <Gift className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-600 truncate">
                  {validacion.beneficioTitulo}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="w-3 h-3 text-gray-400" />
                <p className="text-xs text-gray-500">
                  {validacion.fechaValidacion.toLocaleDateString('es-ES')} - {formatTime(validacion.fechaValidacion)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {formatCurrency(validacion.montoDescuento)}
              </p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(validacion.estado)}`}>
                {validacion.estado}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
      
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
        >
          <span>Ver todas las validaciones</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};