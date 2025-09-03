'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  QrCode,
  Scan,
  RefreshCw,
  Zap,
  Shield,
  Smartphone,
  Camera,
  Target,
  CheckCircle,
  Sparkles,
  Award
} from 'lucide-react';
import { QRScannerButton } from '@/components/socio/QRScannerButton';
import { ValidationResultModal } from '@/components/socio/ValidationResultModal';
import { useAuth } from '@/hooks/useAuth';
import { validacionesService } from '@/services/validaciones.service';
import { ValidacionResponse } from '@/types/validacion';
import { cn } from '@/lib/utils';

export const SocioValidar: React.FC = () => {
  const { user } = useAuth();
  
  // Estados para validación
  const [validationResult, setValidationResult] = useState<ValidacionResponse | null>(null);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  
  // Estados para UI
  const [isReady, setIsReady] = useState(false);

  // Enhanced QR Scan handler with socio status validation
  const handleQRScan = useCallback(
    async (qrData: string) => {
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      // VALIDACIÓN PREVIA: Verificar que el socio esté activo antes de procesar el QR
      if (user.estado !== 'activo') {
        const estadoMessages = {
          'inactivo': 'Tu cuenta está inactiva. Contacta al administrador para reactivarla.',
          'pendiente': 'Tu cuenta está pendiente de activación. Contacta al administrador.',
          'suspendido': 'Tu cuenta está suspendida. Contacta al administrador para más información.',
          'vencido': 'Tu cuenta está vencida. Renueva tu membresía para continuar.'
        };
        
        const message = estadoMessages[user.estado as keyof typeof estadoMessages] || 
                       `Tu cuenta está ${user.estado}. Contacta al administrador.`;
        
        toast.error(message);
        
        // Create error result for modal
        const errorResult: ValidacionResponse = {
          resultado: 'no_habilitado',
          motivo: message,
          fechaHora: new Date(),
          socio: {
            nombre: user.nombre || 'Usuario',
            estado: user.estado || 'inactivo',
            asociacion: user.asociacionId || 'independiente'
          }
        };
        
        setValidationResult(errorResult);
        setValidationModalOpen(true);
        return;
      }

      // VALIDACIÓN ADICIONAL: Para socios con asociación, verificar estado de membresía
      if (user.asociacionId) {
        const estadosInvalidos = ['vencido', 'pendiente', 'suspendido', 'inactivo'];
        
        if (user.estadoMembresia && estadosInvalidos.includes(user.estadoMembresia)) {
          const membershipMessages = {
            'vencido': 'Tu membresía está vencida. Renueva tu cuota para acceder a beneficios.',
            'pendiente': 'Tu membresía está pendiente de activación. Contacta a tu asociación.',
            'suspendido': 'Tu membresía está suspendida. Contacta a tu asociación.',
            'inactivo': 'Tu membresía está inactiva. Contacta a tu asociación.'
          };
          
          const message = membershipMessages[user.estadoMembresia as keyof typeof membershipMessages] || 
                         `Tu membresía está ${user.estadoMembresia}. Contacta a tu asociación.`;
          
          toast.error(message);
          
          // Create error result for modal
          const errorResult: ValidacionResponse = {
            resultado: 'no_habilitado',
            motivo: message,
            fechaHora: new Date(),
            socio: {
              nombre: user.nombre || 'Usuario',
              estado: user.estadoMembresia || 'inactivo',
              asociacion: user.asociacionId || 'independiente'
            }
          };
          
          setValidationResult(errorResult);
          setValidationModalOpen(true);
          return;
        }
      }

      setScannerLoading(true);
      try {
        console.log('🔍 Procesando QR escaneado:', qrData);
        
        const parsedData = validacionesService.parseQRData(qrData);
        if (!parsedData) {
          throw new Error('Código QR inválido o formato no reconocido');
        }

        console.log('✅ QR parseado correctamente:', parsedData);

        const result = await validacionesService.validarAcceso({
          socioId: user.uid,
          comercioId: parsedData.comercioId,
          beneficioId: parsedData.beneficioId,
          asociacionId: user.asociacionId
        });

        console.log('🎯 Resultado de validación:', result);

        // Transform result to match expected interface
        const transformedResult: ValidacionResponse = {
          resultado: result.success ? 'habilitado' : 'no_habilitado',
          motivo: result.message,
          fechaHora: new Date(),
          montoDescuento: result.data?.validacion?.montoDescuento || 0,
          beneficioTitulo: result.data?.beneficio?.titulo,
          comercioNombre: result.data?.comercio?.nombre,
          socio: result.data?.socio
            ? {
                nombre: result.data.socio.nombre,
                estado: result.data.socio.estadoMembresia || 'activo',
                asociacion: user.asociacionId || 'independiente'
              }
            : {
                nombre: user.nombre || 'Usuario',
                estado: 'activo',
                asociacion: user.asociacionId || 'independiente'
              },
          id: result.data?.validacion?.id
        };

        setValidationResult(transformedResult);
        setValidationModalOpen(true);
        
        if (result.success) {
          toast.success('¡Validación exitosa! Beneficio activado');
        } else {
          toast.error(`Validación fallida: ${result.message || 'Error desconocido'}`);
        }
      } catch (error) {
        console.error('❌ Error validating QR:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al validar el código QR';
        toast.error(errorMessage);
        
        // Create error result for modal
        const errorResult: ValidacionResponse = {
          resultado: 'no_habilitado',
          motivo: errorMessage,
          fechaHora: new Date(),
          socio: {
            nombre: user.nombre || 'Usuario',
            estado: 'activo',
            asociacion: user.asociacionId || 'independiente'
          }
        };
        
        setValidationResult(errorResult);
        setValidationModalOpen(true);
      } finally {
        setScannerLoading(false);
      }
    },
    [user]
  );

  // Initialize component with enhanced socio validation
  useEffect(() => {
    if (user && user.role === 'socio') {
      // VALIDACIÓN INICIAL: Verificar que el socio esté activo al cargar el componente
      if (user.estado !== 'activo') {
        console.warn('⚠️ Socio no activo intentando acceder a validaciones:', {
          userId: user.uid,
          estado: user.estado,
          estadoMembresia: user.estadoMembresia
        });
        
        const estadoMessages = {
          'inactivo': 'Tu cuenta está inactiva. No puedes validar beneficios.',
          'pendiente': 'Tu cuenta está pendiente de activación.',
          'suspendido': 'Tu cuenta está suspendida.',
          'vencido': 'Tu cuenta está vencida.'
        };
        
        const message = estadoMessages[user.estado as keyof typeof estadoMessages] || 
                       `Tu cuenta está ${user.estado}.`;
        
        toast.error(message);
        setIsReady(false);
        return;
      }

      // VALIDACIÓN ADICIONAL: Para socios con asociación
      if (user.asociacionId) {
        const estadosInvalidos = ['vencido', 'pendiente', 'suspendido', 'inactivo'];
        
        if (user.estadoMembresia && estadosInvalidos.includes(user.estadoMembresia)) {
          console.warn('⚠️ Socio con membresía inválida intentando acceder a validaciones:', {
            userId: user.uid,
            estadoMembresia: user.estadoMembresia,
            asociacionId: user.asociacionId
          });
          
          const membershipMessages = {
            'vencido': 'Tu membresía está vencida. No puedes validar beneficios.',
            'pendiente': 'Tu membresía está pendiente de activación.',
            'suspendido': 'Tu membresía está suspendida.',
            'inactivo': 'Tu membresía está inactiva.'
          };
          
          const message = membershipMessages[user.estadoMembresia as keyof typeof membershipMessages] || 
                         `Tu membresía está ${user.estadoMembresia}.`;
          
          toast.error(message);
          setIsReady(false);
          return;
        }
      }

      console.log('✅ Socio validado correctamente para usar beneficios:', {
        userId: user.uid,
        estado: user.estado,
        estadoMembresia: user.estadoMembresia,
        asociacionId: user.asociacionId
      });
      
      setIsReady(true);
    }
  }, [user]);

  const handleValidationModalClose = () => {
    setValidationModalOpen(false);
    setValidationResult(null);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RefreshCw size={32} className="text-blue-500 animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Cargando escáner...</h3>
          <p className="text-gray-600">Preparando tu experiencia de validación</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <QrCode size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Escanear QR</h1>
                <p className="text-sm text-gray-600">Valida tus beneficios</p>
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-green-700">Listo</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Desktop Header */}
          <div className="hidden lg:block text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
                <QrCode size={32} className="text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Validar Beneficios</h1>
                <p className="text-lg text-gray-600">Escanea códigos QR para acceder a tus beneficios exclusivos</p>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">En línea</span>
              </div>

              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm border",
                user?.asociacionId 
                  ? 'bg-blue-50 text-blue-800 border-blue-200' 
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              )}>
                <Award size={16} />
                <span>{user?.asociacionId ? 'Socio con Asociación' : 'Socio Independiente'}</span>
              </div>
            </div>
          </div>

          {/* Main Scanner Card */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border">
            <div className="text-center">
              {/* Scanner Icon - Mobile Optimized */}
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Scan size={32} className="text-white lg:w-10 lg:h-10" />
              </div>

              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">Escanear Código QR</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-base lg:text-lg leading-relaxed mb-8">
                Apunta tu cámara al código QR del comercio para validar y acceder a tus beneficios de forma instantánea
              </p>

              {/* Scanner Button */}
              <div className="max-w-sm mx-auto mb-8">
                <QRScannerButton
                  onScan={handleQRScan}
                  loading={scannerLoading}
                />
              </div>

              {/* Instructions - Mobile Optimized */}
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Sparkles size={20} className="text-blue-500" />
                  <h3 className="font-bold text-gray-900 text-lg">¿Cómo funciona?</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Solicita el QR</h4>
                      <p className="text-sm text-gray-700">Pide al comercio que muestre su código QR</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Escanea</h4>
                      <p className="text-sm text-gray-700">Presiona el botón y permite acceso a la cámara</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Apunta</h4>
                      <p className="text-sm text-gray-700">Enfoca la cámara al código hasta detectarlo</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">¡Disfruta!</h4>
                      <p className="text-sm text-gray-700">Accede a tu beneficio al instante</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid - Mobile Optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-xl border shadow-sm">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Zap size={20} className="text-white" />
              </div>
              <div className="text-lg font-bold text-emerald-700 mb-1">&lt; 2s</div>
              <div className="text-sm text-emerald-600 font-medium">Detección Instantánea</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-xl border shadow-sm">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Shield size={20} className="text-white" />
              </div>
              <div className="text-lg font-bold text-blue-700 mb-1">100%</div>
              <div className="text-sm text-blue-600 font-medium">Seguro y Privado</div>
            </div>
            
            <div className="text-center p-4 bg-white rounded-xl border shadow-sm">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Smartphone size={20} className="text-white" />
              </div>
              <div className="text-lg font-bold text-purple-700 mb-1">24/7</div>
              <div className="text-sm text-purple-600 font-medium">Siempre Disponible</div>
            </div>
          </div>

          {/* Tips Section - Mobile Optimized */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Target size={24} className="text-yellow-300" />
                <h3 className="text-xl font-bold">Consejos para un Escaneo Perfecto</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <Camera size={20} className="text-yellow-300 mx-auto mb-2" />
                <h4 className="font-semibold mb-2 text-center">Iluminación</h4>
                <p className="text-sm text-violet-100 text-center">Asegúrate de tener buena luz</p>
              </div>

              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <Target size={20} className="text-yellow-300 mx-auto mb-2" />
                <h4 className="font-semibold mb-2 text-center">Estabilidad</h4>
                <p className="text-sm text-violet-100 text-center">Mantén el teléfono estable</p>
              </div>

              <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                <CheckCircle size={20} className="text-yellow-300 mx-auto mb-2" />
                <h4 className="font-semibold mb-2 text-center">Paciencia</h4>
                <p className="text-sm text-violet-100 text-center">Espera la detección automática</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Resultado de Validación */}
      <ValidationResultModal
        open={validationModalOpen}
        onClose={handleValidationModalClose}
        result={
          validationResult
            ? {
                ...validationResult,
                success: validationResult.resultado === 'habilitado',
                message: validationResult.motivo || 'Validación completada',
              }
            : null
        }
      />
    </>
  );
};

export default SocioValidar;