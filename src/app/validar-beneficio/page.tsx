'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  QrCode, 
  Store, 
  Gift, 
  CheckCircle, 
  AlertCircle, 
  User,
  ArrowRight,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { comercioService } from '@/services/comercio.service';
import { validacionesService } from '@/services/validaciones.service';

interface Comercio {
  id: string;
  nombreComercio: string;
  categoria: string;
  descripcion?: string;
  direccion?: string;
  telefono?: string;
  email: string;
  logo?: string;
  estado: string;
}

interface Beneficio {
  id: string;
  titulo: string;
  descripcion: string;
  descuento: number;
  tipo: 'porcentaje' | 'monto_fijo' | 'producto_gratis';
  fechaInicio: Date;
  fechaFin: Date;
  estado: string;
  comercioId: string;
  usosActuales: number;
  limiteTotal?: number;
}

const ValidarBeneficioContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string>('');

  const comercioId = searchParams.get('comercio');
  const beneficioId = searchParams.get('beneficio');

  // Load comercio and benefits data
  useEffect(() => {
    const loadData = async () => {
      if (!comercioId) {
        setError('ID de comercio no proporcionado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load comercio data
        const comercioData = await comercioService.getComercioById(comercioId);
        if (!comercioData) {
          setError('Comercio no encontrado');
          setLoading(false);
          return;
        }

        if (comercioData.estado !== 'activo') {
          setError('Este comercio no está activo actualmente');
          setLoading(false);
          return;
        }

        setComercio(comercioData);

        // Load active benefits for this comercio
        const beneficiosData = await comercioService.getActiveBenefits(comercioId);
        // Map and ensure all required fields are present
        const beneficiosMapped: Beneficio[] = beneficiosData.map((b: unknown) => {
          const beneficioObj = b as {
            id: string;
            titulo: string;
            descripcion?: string;
            descuento: number;
            tipo: string;
            fechaInicio?: string | Date;
            fechaFin?: string | Date;
            estado?: string;
            comercioId?: string;
            usosActuales: number;
            limiteTotal?: number;
          };
          // Ensure tipo is one of the allowed values
          const allowedTipos = ['porcentaje', 'monto_fijo', 'producto_gratis'] as const;
          const tipo = allowedTipos.includes(beneficioObj.tipo as typeof allowedTipos[number])
            ? (beneficioObj.tipo as typeof allowedTipos[number])
            : 'porcentaje';

          return {
            id: beneficioObj.id,
            titulo: beneficioObj.titulo,
            descripcion: beneficioObj.descripcion ?? '',
            descuento: beneficioObj.descuento,
            tipo: tipo,
            fechaInicio: beneficioObj.fechaInicio ? new Date(beneficioObj.fechaInicio) : new Date(), // fallback to now if missing
            fechaFin: beneficioObj.fechaFin ? new Date(beneficioObj.fechaFin) : new Date(),
            estado: beneficioObj.estado ?? 'activo', // fallback to 'activo' if missing
            comercioId: beneficioObj.comercioId ?? comercioId,
            usosActuales: beneficioObj.usosActuales,
            limiteTotal: beneficioObj.limiteTotal,
          };
        });
        setBeneficios(beneficiosMapped);

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar la información del comercio');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [comercioId, beneficioId]);

  // Handle benefit validation
  const handleValidateBenefit = async (beneficio: Beneficio) => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.href);
      router.push(`/auth/login?returnUrl=${returnUrl}`);
      return;
    }

    if (user.role !== 'socio') {
      toast.error('Solo los socios pueden validar beneficios');
      return;
    }

    setValidating(true);
    try {
      console.log('🔍 Iniciando validación de beneficio:', {
        socioId: user.uid,
        comercioId: comercioId!,
        beneficioId: beneficio.id,
        asociacionId: user.asociacionId
      });

      // Usar el servicio real de validación
      const result = await validacionesService.validarAcceso({
        socioId: user.uid,
        comercioId: comercioId!,
        beneficioId: beneficio.id,
        asociacionId: user.asociacionId
      });

      console.log('✅ Resultado de validación:', result);

      if (result.success) {
        toast.success(`¡Beneficio "${beneficio.titulo}" validado exitosamente!`);
        
        // Mostrar información detallada del resultado
        if (result.data) {
          const { validacion, beneficio: beneficioData, comercio: comercioData } = result.data;
          
          // Toast con información detallada
          toast.success(
            `🎉 ¡Validación exitosa!\n` +
            `💰 Ahorro: $${validacion.montoDescuento.toLocaleString()}\n` +
            `🏪 Comercio: ${comercioData.nombre}\n` +
            `🎁 Beneficio: ${beneficioData?.titulo || 'Beneficio'}`,
            { duration: 6000 }
          );
        }
        
        // Redirect to socio dashboard after successful validation
        setTimeout(() => {
          router.push('/dashboard/socio/historial');
        }, 3000);
      } else {
        // Mostrar error específico
        toast.error(`❌ ${result.message || 'Error al validar el beneficio'}`);
      }
      
    } catch (err) {
      console.error('❌ Error validating benefit:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error al validar el beneficio. Inténtalo de nuevo.';
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setValidating(false);
    }
  };

  const formatDiscount = (beneficio: Beneficio) => {
    switch (beneficio.tipo) {
      case 'porcentaje':
        return `${beneficio.descuento}% de descuento`;
      case 'monto_fijo':
        return `$${beneficio.descuento.toLocaleString()} de descuento`;
      case 'producto_gratis':
        return 'Producto gratis';
      default:
        return 'Beneficio especial';
    }
  };

  const isValidBenefit = (beneficio: Beneficio) => {
    const now = new Date();
    const isActive = beneficio.estado === 'activo';
    const isInDateRange = now >= beneficio.fechaInicio && now <= beneficio.fechaFin;
    const hasUsesLeft = !beneficio.limiteTotal || beneficio.usosActuales < beneficio.limiteTotal;
    
    return isActive && isInDateRange && hasUsesLeft;
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Cargando información...
          </h2>
          <p className="text-gray-600">
            Verificando comercio y beneficios disponibles
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error al cargar
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <QrCode size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Validar Beneficio
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accede a los beneficios exclusivos de este comercio
          </p>
        </motion.div>

        {/* Comercio Info */}
        {comercio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto mb-8"
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex items-center space-x-4">
              {comercio.logo ? (
                <Image
                  src={comercio.logo}
                  alt={comercio.nombreComercio}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl object-cover"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-white" />
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {comercio.nombreComercio}
                </h2>
                <p className="text-blue-600 font-medium mb-1">
                  {comercio.categoria}
                </p>
                {comercio.direccion && (
                  <p className="text-gray-600 text-sm">
                    📍 {comercio.direccion}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  Comercio Verificado
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* User Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-8"
        >
          {user ? (
            <>
              {/* VALIDACIÓN DE ESTADO DEL SOCIO */}
              {user.role === 'socio' && user.estado === 'activo' && 
               (!user.asociacionId || !user.estadoMembresia || 
                !['vencido', 'pendiente', 'suspendido', 'inactivo'].includes(user.estadoMembresia)) ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-green-800 font-medium">
                        Conectado como: {user.nombre || user.email}
                      </p>
                      <p className="text-green-600 text-sm">
                        ✅ Puedes validar beneficios
                      </p>
                      {user.asociacionId && (
                        <p className="text-green-600 text-sm">
                          Asociación: {user.asociacionNombre || 'Asociado'} - Estado: {user.estadoMembresia || 'Activo'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : user.role === 'socio' ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-red-800 font-medium">
                        No puedes validar beneficios
                      </p>
                      <p className="text-red-600 text-sm">
                        {user.estado !== 'activo' 
                          ? `Tu cuenta está ${user.estado}. Contacta al administrador.`
                          : user.asociacionId && user.estadoMembresia && ['vencido', 'pendiente', 'suspendido', 'inactivo'].includes(user.estadoMembresia)
                          ? `Tu membresía está ${user.estadoMembresia}. ${
                              user.estadoMembresia === 'vencido' 
                                ? 'Renueva tu cuota para acceder a beneficios.' 
                                : 'Contacta a tu asociación.'
                            }`
                          : 'Estado de cuenta no válido para validar beneficios.'
                        }
                      </p>
                      {user.asociacionId && (
                        <p className="text-red-600 text-sm">
                          Asociación: {user.asociacionNombre || 'Asociado'} - Estado: {user.estadoMembresia || 'Desconocido'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-amber-800 font-medium">
                        Solo los socios pueden validar beneficios
                      </p>
                      <p className="text-amber-600 text-sm">
                        Tu rol actual es: {user.role}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-amber-800 font-medium">
                      Inicia sesión para validar beneficios
                    </p>
                    <p className="text-amber-600 text-sm">
                      Necesitas ser socio para acceder a los beneficios
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const returnUrl = encodeURIComponent(window.location.href);
                    router.push(`/auth/login?returnUrl=${returnUrl}`);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  Iniciar Sesión
                  <ExternalLink className="w-4 h-4 ml-2" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Benefits List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Gift className="w-6 h-6 mr-2 text-purple-600" />
            Beneficios Disponibles
          </h3>

          {beneficios.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                No hay beneficios disponibles
              </h4>
              <p className="text-gray-600">
                Este comercio no tiene beneficios activos en este momento.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {beneficios.map((beneficio) => {
                const isValid = isValidBenefit(beneficio);
                // VALIDACIÓN ADICIONAL: Verificar que el usuario sea socio activo
                const canValidate = user && 
                                   user.role === 'socio' && 
                                   user.estado === 'activo' && 
                                   (!user.asociacionId || 
                                    !user.estadoMembresia || 
                                    !['vencido', 'pendiente', 'suspendido', 'inactivo'].includes(user.estadoMembresia));
                
                return (
                  <div
                    key={beneficio.id}
                    className={`bg-white rounded-2xl p-6 shadow-lg border transition-all duration-200 ${
                      isValid && canValidate
                        ? 'border-gray-100 hover:shadow-xl hover:border-purple-200' 
                        : 'border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-xl font-bold text-gray-900">
                            {beneficio.titulo}
                          </h4>
                          {!isValid && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              No disponible
                            </span>
                          )}
                          {!canValidate && user && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              {user.role !== 'socio' 
                                ? 'Solo socios' 
                                : user.estado !== 'activo'
                                ? 'Cuenta inactiva'
                                : 'Membresía inválida'
                              }
                            </span>
                          )}
                        </div>
                        
                        <p className="text-lg font-semibold text-purple-600 mb-2">
                          {formatDiscount(beneficio)}
                        </p>
                        
                        <p className="text-gray-600 mb-3">
                          {beneficio.descripcion}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>
                            Válido hasta: {beneficio.fechaFin.toLocaleDateString()}
                          </span>
                          {beneficio.limiteTotal && (
                            <span>
                              Usos: {beneficio.usosActuales}/{beneficio.limiteTotal}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-6">
                        <button
                          onClick={() => handleValidateBenefit(beneficio)}
                          disabled={!canValidate || !isValid || validating}
                          className={`inline-flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                            isValid && canValidate
                              ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                          title={
                            !canValidate 
                              ? (user 
                                  ? (user.role !== 'socio' 
                                      ? 'Solo los socios pueden validar beneficios' 
                                      : user.estado !== 'activo'
                                      ? `Tu cuenta está ${user.estado}`
                                      : 'Tu estado de membresía no permite validar beneficios'
                                    )
                                  : 'Debes iniciar sesión como socio'
                                )
                              : !isValid 
                              ? 'Este beneficio no está disponible'
                              : 'Validar beneficio'
                          }
                        >
                          {validating ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Validando...
                            </>
                          ) : (
                            <>
                              Validar Beneficio
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12 text-gray-600"
        >
          <p className="text-sm">
            ¿Problemas para validar? Contacta al comercio directamente.
            <br />
            Sistema de validación de beneficios - Fidelya
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Main component with Suspense
export default function ValidarBeneficioPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ValidarBeneficioContent />
    </Suspense>
  );
}