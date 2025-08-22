'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard, 
  Edit3, 
  Trash2, 
  Unlink,
  MapPin,
  Award,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Socio } from '@/types/socio';
import Image from 'next/image';

interface ResponsiveMemberCardProps {
  socio: Socio;
  index: number;
  onEdit: (socio: Socio) => void;
  onDelete: (socio: Socio) => void;
  onUnlink: (socio: Socio) => void;
}

export const ResponsiveMemberCard: React.FC<ResponsiveMemberCardProps> = ({
  socio,
  index,
  onEdit,
  onDelete,
  onUnlink
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
      
      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
        {/* Header with avatar and status */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                {socio.avatar ? (
                  <Image
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover"
                    src={socio.avatar}
                    alt={socio.nombre}
                    width={56}
                    height={56}
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <User className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                )}
                {/* Status indicator */}
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                  socio.estado === 'activo' ? 'bg-emerald-500' :
                  socio.estado === 'inactivo' ? 'bg-slate-400' :
                  socio.estado === 'suspendido' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm sm:text-base truncate">
                  {socio.nombre}
                </h3>
                {socio.numeroSocio && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 mt-1">
                    #{socio.numeroSocio}
                  </span>
                )}
              </div>
            </div>

            {/* Membership status badge */}
            <span className={`px-2 py-1 text-xs font-semibold rounded-lg whitespace-nowrap ${
              socio.estadoMembresia === 'al_dia' ? 'bg-emerald-100 text-emerald-700' :
              socio.estadoMembresia === 'vencido' ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {socio.estadoMembresia === 'al_dia' ? 'Al día' :
               socio.estadoMembresia === 'vencido' ? 'Vencido' : 'Pendiente'}
            </span>
          </div>

          {/* Contact information */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-slate-600">
              <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{socio.email}</span>
            </div>
            
            {socio.telefono && (
              <div className="flex items-center text-sm text-slate-600">
                <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{socio.telefono}</span>
              </div>
            )}
            
            {socio.direccion && (
              <div className="flex items-center text-sm text-slate-600">
                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{socio.direccion}</span>
              </div>
            )}
          </div>

          {/* Additional info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="flex items-center text-xs text-slate-600">
              <Calendar className="w-3 h-3 mr-2" />
              <div>
                <span className="block text-slate-500">Ingreso</span>
                <span className="font-medium">
                  {format(socio.fechaIngreso.toDate(), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
            </div>
            
            {socio.fechaVencimiento && (
              <div className="flex items-center text-xs text-slate-600">
                <Award className="w-3 h-3 mr-2" />
                <div>
                  <span className="block text-slate-500">Vencimiento</span>
                  <span className="font-medium">
                    {format(socio.fechaVencimiento.toDate(), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>
              </div>
            )}
            
            {socio.montoCuota > 0 && (
              <div className="flex items-center text-xs text-slate-600">
                <CreditCard className="w-3 h-3 mr-2" />
                <div>
                  <span className="block text-slate-500">Cuota</span>
                  <span className="font-medium">${socio.montoCuota}</span>
                </div>
              </div>
            )}
            
            {socio.beneficiosUsados !== undefined && (
              <div className="flex items-center text-xs text-slate-600">
                <Award className="w-3 h-3 mr-2" />
                <div>
                  <span className="block text-slate-500">Beneficios</span>
                  <span className="font-medium">{socio.beneficiosUsados}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center justify-between">
            {/* Status indicator */}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              socio.estado === 'activo'
                ? 'bg-emerald-100 text-emerald-800'
                : socio.estado === 'inactivo'
                ? 'bg-slate-100 text-slate-800'
                : socio.estado === 'suspendido'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {socio.estado.charAt(0).toUpperCase() + socio.estado.slice(1)}
            </span>

            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(socio)}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Editar</span>
              </button>
              
              {/* Mobile dropdown for additional actions */}
              <div className="relative group sm:hidden">
                <button className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
                <div className="absolute right-0 bottom-full mb-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => onDelete(socio)}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                    <button
                      onClick={() => onUnlink(socio)}
                      className="w-full text-left px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                    >
                      <Unlink className="w-3 h-3" />
                      Desvincular
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop action buttons */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={() => onDelete(socio)}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUnlink(socio)}
                  className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Desvincular"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
