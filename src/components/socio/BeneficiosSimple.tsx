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
  Package,
  ChevronRight,
  MapPin,
  Clock,
  Star,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useBeneficiosSocio } from '@/hooks/useBeneficiosSocio';
import { useBeneficioValidation } from '@/hooks/useBeneficioValidation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
    refrescar
  } = useBeneficiosSocio();

  const { validarBeneficio, loading: validationLoading } = useBeneficioValidation();

  const [activeTab, setActiveTab] = useState<'beneficios' | 'usados'>('beneficios');
  const [refreshing, setRefreshing] = useState(false);

  const handleUseBenefit = async (beneficioId: string, comercioId: string) => {
    const result = await validarBeneficio(beneficioId, comercioId);
    if (result.success) {
      // Recargar datos después de validación exitosa
      await refrescar();
    }
    return result.success;
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refrescar();
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  if (error) {
    return (
      <div className="min-h-[400px] bg-gradient-to-br from-white via-red-50 to-white rounded-3xl border border-red-200/50 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-lg">
            <AlertCircle size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Error al cargar beneficios</h3>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
            <RefreshCw size={16} className="mr-2" />
            Reintentar
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white rounded-3xl border border-blue-200/50 overflow-hidden">
      {/* Enhanced Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-b border-blue-200/50 px-6 py-4 sticky top-0 z-30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mis Beneficios</h1>
            <p className="text-sm text-slate-600">Descubre y utiliza tus descuentos</p>
          </div>
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-white/80 hover:bg-white border border-slate-200 rounded-2xl shadow-lg backdrop-blur-sm"
          >
            <RefreshCw size={16} className={cn("text-slate-600", refreshing && 'animate-spin')} />
          </motion.button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Enhanced Desktop Header */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-blue-700 bg-clip-text text-transparent mb-2">
                Mis Beneficios
              </h2>
              <p className="text-slate-600 text-lg">Descubre y utiliza todos tus descuentos disponibles</p>
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center space-x-2 shadow-lg"
            >
              <RefreshCw size={16} className={cn("", refreshing && 'animate-spin')} />
              <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </motion.button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Target size={18} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.disponibles}</div>
                <div className="text-sm opacity-90">Disponibles</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <History size={18} className="text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold">{estadisticas.usados}</div>
                <div className="text-sm opacity-90">Usados</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Tab Navigation */}
        <div className="bg-slate-100/50 rounded-2xl p-2 backdrop-blur-sm">
          <div className="flex gap-1">
            <motion.button
              onClick={() => setActiveTab('beneficios')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 relative overflow-hidden",
                activeTab === 'beneficios'
                  ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              )}
            >
              {activeTab === 'beneficios' && (
                <motion.div
                  layoutId="activeTabBeneficios"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2">
                <Gift size={18} />
                <span className="hidden sm:inline">Beneficios</span>
                <span className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold",
                  activeTab === 'beneficios' ? 'bg-white/20 text-white' : 'bg-blue-500 text-white'
                )}>
                  {estadisticas.disponibles}
                </span>
              </div>
            </motion.button>
            
            <motion.button
              onClick={() => setActiveTab('usados')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300 relative overflow-hidden",
                activeTab === 'usados'
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              )}
            >
              {activeTab === 'usados' && (
                <motion.div
                  layoutId="activeTabUsados"
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2">
                <History size={18} />
                <span className="hidden sm:inline">Usados</span>
                <span className={cn(
                  "px-2 py-1 rounded-lg text-xs font-bold",
                  activeTab === 'usados' ? 'bg-white/20 text-white' : 'bg-purple-500 text-white'
                )}>
                  {estadisticas.usados}
                </span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Enhanced Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'beneficios' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 animate-pulse"
                      >
                        <div className="h-4 bg-slate-200 rounded mb-4"></div>
                        <div className="h-3 bg-slate-200 rounded mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded mb-4"></div>
                        <div className="h-10 bg-slate-200 rounded"></div>
                      </motion.div>
                    ))}
                  </div>
                ) : beneficios.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {beneficios.map((beneficio, index) => (
                      <motion.div
                        key={beneficio.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col"
                        style={{ minHeight: '320px' }}
                      >
                        {/* Header del beneficio */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <Gift size={18} className="text-white" />
                            </div>
                            {beneficio.destacado && (
                              <motion.div 
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg"
                              >
                                <Star size={14} className="text-white" />
                              </motion.div>
                            )}
                          </div>
                          
                          <span className={cn(
                            "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
                            beneficio.tipoAcceso === 'asociacion' 
                              ? "bg-purple-100 text-purple-800"
                              : beneficio.tipoAcceso === 'publico'
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          )}>
                            {beneficio.tipoAcceso === 'asociacion' ? (
                              <><Users size={10} className="mr-1" /> Asociación</>
                            ) : beneficio.tipoAcceso === 'publico' ? (
                              <><Building2 size={10} className="mr-1" /> Público</>
                            ) : (
                              <><Building2 size={10} className="mr-1" /> Comercio</>
                            )}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">{beneficio.titulo}</h3>
                        <p className="text-slate-600 text-sm mb-4 line-clamp-2 flex-grow">{beneficio.descripcion}</p>

                        {/* Descuento destacado */}
                        <div className="mb-4">
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 text-center border border-green-200">
                            {beneficio.tipo === 'porcentaje' && (
                              <div className="flex items-center justify-center gap-2 text-green-700">
                                <span className="text-3xl font-bold">{beneficio.descuento}%</span>
                                <span className="text-lg font-semibold">OFF</span>
                              </div>
                            )}
                            
                            {beneficio.tipo === 'monto_fijo' && (
                              <div className="flex items-center justify-center gap-2 text-green-700">
                                <DollarSign size={24} />
                                <span className="text-3xl font-bold">${beneficio.descuento}</span>
                                <span className="text-lg font-semibold">OFF</span>
                              </div>
                            )}
                            
                            {beneficio.tipo === 'producto_gratis' && (
                              <div className="flex items-center justify-center gap-2 text-green-700">
                                <Package size={24} />
                                <span className="text-2xl font-bold">GRATIS</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Comercio Info */}
                        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-2xl">
                          <MapPin size={14} className="text-slate-500" />
                          <span className="font-medium text-slate-900 text-sm flex-1 truncate">
                            {beneficio.comercioNombre}
                          </span>
                          <ChevronRight size={14} className="text-slate-400" />
                        </div>

                        {/* Información adicional */}
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            Hasta {format(beneficio.fechaFin.toDate(), 'dd/MM', { locale: es })}
                          </span>
                          
                          {beneficio.limiteTotal && (
                            <span className="bg-slate-100 px-2 py-1 rounded-lg">
                              {beneficio.usosActuales}/{beneficio.limiteTotal} usos
                            </span>
                          )}
                        </div>

                        {/* Botón de acción mejorado */}
                        <motion.button
                          onClick={() => handleUseBenefit(beneficio.id, beneficio.comercioId)}
                          disabled={loading || validationLoading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                          {validationLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Validando...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={16} />
                              <span>Validar Beneficio</span>
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                      <Gift size={40} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No hay beneficios disponibles</h3>
                    <p className="text-slate-500 mb-6">Los beneficios aparecerán aquí cuando estén disponibles</p>
                    
                    <Button onClick={handleRefresh} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                      <RefreshCw size={16} className="mr-2" />
                      Actualizar
                    </Button>
                  </motion.div>
                )}
              </div>
            )}

            {activeTab === 'usados' && (
              <div className="space-y-4">
                {beneficiosUsados.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {beneficiosUsados.map((uso: BeneficioUsado, index) => (
                      <motion.div
                        key={uso.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex gap-2 mb-4 flex-wrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <Award size={10} className="mr-1" />
                            Usado
                          </span>
                          {uso.montoDescuento && uso.montoDescuento > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                              <DollarSign size={10} className="mr-1" />
                              ${uso.montoDescuento} ahorrado
                            </span>
                          )}
                        </div>
                    
                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-2">
                          {uso.beneficioTitulo || 'Beneficio Usado'}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 rounded-2xl">
                          <Building2 size={14} className="text-slate-500" />
                          <span className="text-sm font-medium text-slate-900 flex-1 truncate">
                            {uso.comercioNombre}
                          </span>
                        </div>
                    
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                            <span className="text-slate-600 flex items-center gap-1">
                              <Clock size={12} />
                              Fecha:
                            </span>
                            <span className="font-medium text-slate-900">
                              {format(uso.fechaUso.toDate(), 'dd/MM/yyyy', { locale: es })}
                            </span>
                          </div>
                          
                          {uso.montoOriginal && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                              <span className="text-slate-600">Monto original:</span>
                              <span className="font-medium text-slate-900">${uso.montoOriginal}</span>
                            </div>
                          )}
                          
                          {uso.montoFinal && (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                              <span className="text-slate-600">Monto final:</span>
                              <span className="font-medium text-emerald-600">${uso.montoFinal}</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl flex items-center justify-center">
                      <History size={40} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No has usado beneficios aún</h3>
                    <p className="text-slate-500 mb-6">Cuando uses un beneficio, aparecerá aquí</p>
                    <Button 
                      onClick={() => setActiveTab('beneficios')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Zap size={16} className="mr-2" />
                      Explorar Beneficios
                    </Button>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};