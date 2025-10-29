'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  Award,
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
  const [scannerKey, setScannerKey] = useState(0); // Key para forzar re-render del scanner

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
        setScannerLoading(false);
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
          setScannerLoading(false);
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
    setScannerLoading(false);
    
    // Forzar re-render del scanner para resetear completamente su estado
    setScannerKey(prev => prev + 1);
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <RefreshCw size={32} className="text-white animate-spin" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Preparando Escáner</h3>
          <p className="text-gray-600 max-w-md mx-auto">Configurando tu experiencia de validación de beneficios</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 pb-20 lg:pb-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-4 sticky top-0 z-30">
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <QrCode size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Escanear QR</h1>
                <p className="text-sm text-gray-600">Valida tus beneficios</p>
              </div>
            </div>
            
            {/* Status indicators */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-green-700">Listo</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Desktop Header */}
          <motion.div 
            className="hidden lg:block text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-6 mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
                <QrCode size={40} className="text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  Validar Beneficios
                </h1>
                <p className="text-xl text-gray-600">Escanea códigos QR para acceder a tus beneficios exclusivos</p>
              </div>
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-center gap-6">
              <motion.div 
                className="flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-lg"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium text-gray-700">Sistema Activo</span>
              </motion.div>

              <motion.div 
                className={cn(
                  "flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm border",
                  user?.asociacionId 
                    ? 'bg-blue-50/80 text-blue-800 border-blue-200/50' 
                    : 'bg-emerald-50/80 text-emerald-800 border-emerald-200/50'
                )}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Award size={20} />
                <span className="font-medium">
                  {user?.asociacionId ? 'Socio con Asociación' : 'Socio Independiente'}
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Main Scanner Card */}
          <motion.div 
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-200/50"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="text-center">
              {/* Scanner Icon */}
              <motion.div 
                className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Scan size={40} className="text-white lg:w-16 lg:h-16" />
              </motion.div>

              <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-6">
                Escanear Código QR
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg lg:text-xl leading-relaxed mb-10">
                Apunta tu cámara al código QR del comercio para validar y acceder a tus beneficios de forma instantánea
              </p>

              {/* Scanner Button */}
              <motion.div 
                className="max-w-sm mx-auto mb-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <QRScannerButton
                  key={scannerKey} // Usar key para forzar re-render
                  onScan={handleQRScan}
                  loading={scannerLoading}
                />
              </motion.div>

              {/* Instructions */}
              <motion.div 
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200/50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Sparkles size={24} className="text-blue-500" />
                  <h3 className="font-bold text-gray-900 text-xl">¿Cómo funciona?</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                  {[
                    { step: 1, title: "Solicita el QR", desc: "Pide al comercio que muestre su código QR", color: "blue" },
                    { step: 2, title: "Escanea", desc: "Presiona el botón y permite acceso a la cámara", color: "purple" },
                    { step: 3, title: "Apunta", desc: "Enfoca la cámara al código hasta detectarlo", color: "indigo" },
                    { step: 4, title: "¡Disfruta!", desc: "Accede a tu beneficio al instante", color: "green" }
                  ].map((item, index) => (
                    <motion.div 
                      key={item.step}
                      className="flex flex-col items-center text-center"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-4 shadow-lg",
                        item.color === 'blue' && 'bg-gradient-to-r from-blue-500 to-blue-600',
                        item.color === 'purple' && 'bg-gradient-to-r from-purple-500 to-purple-600',
                        item.color === 'indigo' && 'bg-gradient-to-r from-indigo-500 to-indigo-600',
                        item.color === 'green' && 'bg-gradient-to-r from-green-500 to-green-600'
                      )}>
                        {item.step}
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            {[
              { icon: Zap, value: "< 2s", label: "Detección Instantánea", color: "emerald" },
              { icon: Shield, value: "100%", label: "Seguro y Privado", color: "blue" },
              { icon: Smartphone, value: "24/7", label: "Siempre Disponible", color: "purple" }
            ].map((feature, index) => (
              <motion.div 
                key={feature.label}
                className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg"
                whileHover={{ scale: 1.05, y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 1.0 + index * 0.1 }}
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg",
                  feature.color === 'emerald' && 'bg-gradient-to-r from-emerald-500 to-emerald-600',
                  feature.color === 'blue' && 'bg-gradient-to-r from-blue-500 to-blue-600',
                  feature.color === 'purple' && 'bg-gradient-to-r from-purple-500 to-purple-600'
                )}>
                  <feature.icon size={24} className="text-white" />
                </div>
                <div className={cn(
                  "text-2xl font-bold mb-2",
                  feature.color === 'emerald' && 'text-emerald-700',
                  feature.color === 'blue' && 'text-blue-700',
                  feature.color === 'purple' && 'text-purple-700'
                )}>
                  {feature.value}
                </div>
                <div className={cn(
                  "text-sm font-medium",
                  feature.color === 'emerald' && 'text-emerald-600',
                  feature.color === 'blue' && 'text-blue-600',
                  feature.color === 'purple' && 'text-purple-600'
                )}>
                  {feature.label}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tips Section */}
          <motion.div 
            className="bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Target size={28} className="text-yellow-300" />
                <h3 className="text-2xl font-bold">Consejos para un Escaneo Perfecto</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Camera, title: "Iluminación", desc: "Asegúrate de tener buena luz" },
                { icon: Target, title: "Estabilidad", desc: "Mantén el teléfono estable" },
                { icon: CheckCircle, title: "Paciencia", desc: "Espera la detección automática" }
              ].map((tip, index) => (
                <motion.div 
                  key={tip.title}
                  className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20"
                  whileHover={{ scale: 1.02, y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 1.2 + index * 0.1 }}
                >
                  <tip.icon size={24} className="text-yellow-300 mx-auto mb-3" />
                  <h4 className="font-bold mb-3 text-center text-lg">{tip.title}</h4>
                  <p className="text-sm text-violet-100 text-center leading-relaxed">{tip.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
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
                message: validationResult.motivo || 'Validación exitosa',
              }
            : null
        }
      />
    </>
  );
};

export default SocioValidar;