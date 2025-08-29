'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  History, 
  RefreshCw, 
  Building2, 
  Users, 
  Calendar,
  DollarSign,
  Target,
  Award,
  Zap,
  Percent,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBeneficiosSocio } from '@/hooks/useBeneficiosSocio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type BeneficioUsado = {
  id: string;
  beneficioId?: string;
  beneficioTitulo?: string;
  comercioId?: string;
  comercioNombre: string;
  montoDescuento?: number;
  montoOriginal?: number;
  montoFinal?: number;
  asociacionNombre?: string | null;
  fechaUso: { toDate: () => Date };
  notas?: string;
};

export const BeneficiosSimple: React.FC = () => {
  const {
    beneficios,
    beneficiosUsados,
    loading,
    error,
    estadisticas,
    usarBeneficio,
    refrescar
  } = useBeneficiosSocio();

  const [activeTab, setActiveTab] = useState<'beneficios' | 'usados'>('beneficios');

  const handleUseBenefit = async (beneficioId: string, comercioId: string) => {
    await usarBeneficio(beneficioId, comercioId);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-2xl flex items-center justify-center">
            <Gift size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar beneficios</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refrescar} leftIcon={<RefreshCw size={16} />}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Mis Beneficios</h2>
            <p className="text-gray-600">Descubre y utiliza todos tus descuentos disponibles</p>
          </div>
          <Button
            onClick={refrescar}
            disabled={loading}
            leftIcon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            variant="outline"
          >
            {loading ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Target size={20} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">{estadisticas.disponibles}</div>
                <div className="text-sm text-emerald-600">Disponibles</div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                <History size={20} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-700">{estadisticas.usados}</div>
                <div className="text-sm text-indigo-600">Usados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('beneficios')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'beneficios'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Gift size={18} />
            <span>Beneficios</span>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
              activeTab === 'beneficios' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              {estadisticas.disponibles}
            </span>
          </button>
          
          <button
            onClick={() => setActiveTab('usados')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === 'usados'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <History size={18} />
            <span>Usados</span>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
              activeTab === 'usados' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
            }`}>
              {estadisticas.usados}
            </span>
          </button>
        </div>
      </div>

      {/* Contenido */}
      <AnimatePresence mode="wait">
        {activeTab === 'beneficios' && (
          <motion.div
            key="beneficios"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 shadow-sm border animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : beneficios.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beneficios.map((beneficio, index) => (
                  <motion.div
                    key={beneficio.id}
                    className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all duration-200"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    {/* Header del beneficio */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Gift size={16} className="text-white" />
                        </div>
                        {beneficio.destacado && (
                          <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Award size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Tipo de acceso */}
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {beneficio.tipoAcceso === 'asociacion' ? (
                          <><Users size={10} className="mr-1" /> Asociación</>
                        ) : beneficio.tipoAcceso === 'publico' ? (
                          <><Building2 size={10} className="mr-1" /> Público</>
                        ) : (
                          <><Building2 size={10} className="mr-1" /> Comercio</>
                        )}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{beneficio.titulo}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{beneficio.descripcion}</p>

                    {/* Descuento */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {beneficio.tipo === 'porcentaje' && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Percent size={16} />
                            <span className="text-xl font-bold">{beneficio.descuento}%</span>
                            <span className="text-sm">OFF</span>
                          </div>
                        )}
                        
                        {beneficio.tipo === 'monto_fijo' && (
                          <div className="flex items-center gap-1 text-green-600">
                            <DollarSign size={16} />
                            <span className="text-xl font-bold">${beneficio.descuento}</span>
                            <span className="text-sm">OFF</span>
                          </div>
                        )}
                        
                        {beneficio.tipo === 'producto_gratis' && (
                          <div className="flex items-center gap-1 text-green-600">
                            <Package size={16} />
                            <span className="text-lg font-bold">GRATIS</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500">en</div>
                        <div className="font-medium text-gray-900 text-sm">{beneficio.comercioNombre}</div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Hasta {format(beneficio.fechaFin.toDate(), 'dd/MM', { locale: es })}
                      </span>
                      
                      {beneficio.limiteTotal && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {beneficio.usosActuales}/{beneficio.limiteTotal} usos
                        </span>
                      )}
                    </div>

                    {/* Botón de acción */}
                    <Button
                      onClick={() => handleUseBenefit(beneficio.id, beneficio.comercioId)}
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Usar Beneficio
                    </Button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <Gift size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay beneficios disponibles</h3>
                <p className="text-gray-500 mb-4">Los beneficios aparecerán aquí cuando estén disponibles</p>
                <Button onClick={refrescar} leftIcon={<RefreshCw size={16} />}>
                  Actualizar
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'usados' && (
          <motion.div
            key="usados"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {beneficiosUsados.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beneficiosUsados.map((uso: BeneficioUsado, index) => (
                  <motion.div
                    key={uso.id}
                    className="bg-white rounded-xl p-6 shadow-sm border"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <div className="flex gap-2 mb-4 flex-wrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        <Award size={10} className="mr-1" />
                        Usado
                      </span>
                      {uso.montoDescuento && uso.montoDescuento > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                          <DollarSign size={10} className="mr-1" />
                          ${uso.montoDescuento} ahorrado
                        </span>
                      )}
                    </div>
                
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {uso.beneficioTitulo || 'Beneficio Usado'}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 flex items-center gap-2 text-sm">
                      <Building2 size={14} />
                      Usado en {uso.comercioNombre}
                    </p>
                
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Calendar size={12} />
                          Fecha:
                        </span>
                        <span className="font-medium text-gray-900">
                          {format(uso.fechaUso.toDate(), 'dd/MM/yyyy', { locale: es })}
                        </span>
                      </div>
                      
                      {uso.montoOriginal && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">Monto original:</span>
                          <span className="font-medium text-gray-900">${uso.montoOriginal}</span>
                        </div>
                      )}
                      
                      {uso.montoFinal && (
                        <div className="flex items-center justify-between p-2 bg-emerald-50 rounded">
                          <span className="text-gray-600">Monto final:</span>
                          <span className="font-medium text-emerald-600">${uso.montoFinal}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                  <History size={32} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No has usado beneficios aún</h3>
                <p className="text-gray-500 mb-4">Cuando uses un beneficio, aparecerá aquí</p>
                <Button 
                  onClick={() => setActiveTab('beneficios')}
                  leftIcon={<Zap size={16} />}
                >
                  Explorar Beneficios
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};