'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { 
  QrCode,
  Scan,
  RefreshCw,
  Zap,
  Shield,
  Smartphone,
  Wifi,
  Battery,
  Signal,
  Clock,
  ArrowLeft,
  Camera,
  Sparkles,
  Target,
  Award
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { SocioSidebar } from '@/components/layout/SocioSidebar';
import { LogoutModal } from '@/components/ui/LogoutModal';
import { QRScannerButton } from '@/components/socio/QRScannerButton';
import { ValidationResultModal } from '@/components/socio/ValidationResultModal';
import { useAuth } from '@/hooks/useAuth';
import { validacionesService } from '@/services/validaciones.service';
import { ValidacionResponse } from '@/types/validacion';
import { cn } from '@/lib/utils';

// Sidebar personalizado que maneja el logout
const SocioSidebarWithLogout: React.FC<{
  open: boolean;
  onToggle: () => void;
  onMenuClick: (section: string) => void;
  activeSection: string;
  onLogoutClick: () => void;
}> = (props) => {
  return (
    <SocioSidebar
      open={props.open}
      onToggle={props.onToggle}
      onMenuClick={props.onMenuClick}
      onLogoutClick={props.onLogoutClick}
      activeSection={props.activeSection}
    />
  );
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15
    }
  }
};

// Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 relative overflow-hidden">
    <div className="absolute inset-0 bg-grid-pattern opacity-20" />
    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-violet-100/30 to-transparent rounded-full blur-3xl animate-pulse" />
    
    <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-24 h-24 bg-gradient-to-r from-sky-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
          <RefreshCw size={40} className="text-white animate-spin" />
        </div>
        <h3 className="text-3xl font-black text-gray-900 mb-4">Cargando escáner...</h3>
        <p className="text-gray-600 text-lg">Preparando tu experiencia de validación</p>
      </motion.div>
    </div>
  </div>
);

// Main component content
const SocioValidarContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  
  // Estados para el modal de logout
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Estados para validación
  const [validationResult, setValidationResult] = useState<ValidacionResponse | null>(null);
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  
  // Estados para UI
  const [isReady, setIsReady] = useState(false);

  // Enhanced QR Scan handler
  const handleQRScan = useCallback(
    async (qrData: string) => {
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
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

  // Handle QR from URL parameters
  useEffect(() => {
    const qrParam = searchParams.get('qr');
    if (qrParam && user) {
      try {
        const decodedQr = decodeURIComponent(qrParam);
        handleQRScan(decodedQr);
      } catch (error) {
        console.error('Error processing QR from URL:', error);
        toast.error('Error al procesar el código QR de la URL');
      }
    }
  }, [searchParams, user, handleQRScan]);

  // Initialize component
  useEffect(() => {
    if (user && user.role === 'socio') {
      setIsReady(true);
    } else if (user && user.role !== 'socio') {
      console.log('❌ Usuario no es socio, redirigiendo...');
      router.push('/dashboard');
    }
  }, [user, router]);

  // Logout handlers
  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión. Inténtalo de nuevo.');
    } finally {
      setLoggingOut(false);
      setLogoutModalOpen(false);
    }
  };

  const handleLogoutCancel = () => {
    setLogoutModalOpen(false);
  };

  const handleValidationModalClose = () => {
    setValidationModalOpen(false);
    setValidationResult(null);
    
    if (searchParams.get('qr')) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('qr');
      router.replace(newUrl.pathname + newUrl.search);
    }
  };

  const handleBackToDashboard = () => {
    router.push('/dashboard/socio');
  };

  if (!isReady) {
    return (
      <DashboardLayout
        activeSection="validar"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout
        activeSection="validar"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={handleLogoutClick}
          />
        )}
      >
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 relative overflow-hidden">
          {/* Enhanced background decorations */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-violet-100/40 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-sky-100/40 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-purple-50/20 to-blue-50/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          
          {/* Floating elements */}
          <div className="absolute top-20 right-20 w-4 h-4 bg-violet-400/60 rounded-full animate-bounce" />
          <div className="absolute top-40 left-16 w-3 h-3 bg-sky-400/60 rounded-full animate-ping" />
          <div className="absolute bottom-32 right-32 w-5 h-5 bg-purple-400/60 rounded-full animate-pulse" />
          <div className="absolute top-60 right-60 w-2 h-2 bg-pink-400/60 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />

          <motion.div
            className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Back Button */}
            <motion.button
              onClick={handleBackToDashboard}
              className="mb-6 flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 hover:text-gray-900 group"
              variants={itemVariants}
              whileHover={{ x: -4 }}
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-semibold">Volver al Dashboard</span>
            </motion.button>

            {/* Header */}
            <motion.div className="text-center mb-12" variants={itemVariants}>
              <div className="flex items-center justify-center gap-6 mb-8">
                <motion.div 
                  className="w-20 h-20 bg-gradient-to-r from-sky-500 to-violet-600 rounded-3xl flex items-center justify-center shadow-2xl"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <QrCode size={36} className="text-white" />
                </motion.div>
                <div className="text-left">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black bg-gradient-to-r from-sky-600 via-violet-600 to-purple-700 bg-clip-text text-transparent mb-2 leading-tight">
                    Validar Beneficios
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-600 font-semibold max-w-2xl">
                    Escanea códigos QR para acceder a tus beneficios exclusivos
                  </p>
                </div>
              </div>

              {/* Status indicators */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <motion.div 
                  className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-gray-700">En línea</span>
                  <div className="w-px h-4 bg-gray-300 mx-2" />
                  <div className="flex items-center gap-1">
                    <Wifi size={14} className="text-gray-500" />
                    <Signal size={14} className="text-gray-500" />
                    <Battery size={14} className="text-gray-500" />
                  </div>
                </motion.div>

                <motion.div 
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold shadow-lg backdrop-blur-xl border",
                    user?.asociacionId 
                      ? 'bg-gradient-to-r from-blue-50/80 to-indigo-50/80 text-blue-800 border-blue-200/50' 
                      : 'bg-gradient-to-r from-emerald-50/80 to-green-50/80 text-emerald-800 border-emerald-200/50'
                  )}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Award size={16} />
                  <span>{user?.asociacionId ? 'Socio con Asociación' : 'Socio Independiente'}</span>
                  <div className={cn(
                    "w-2 h-2 rounded-full animate-pulse",
                    user?.asociacionId ? 'bg-blue-500' : 'bg-emerald-500'
                  )} />
                </motion.div>
              </div>
            </motion.div>

            {/* Main Scanner Card */}
            <motion.div
              className="bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-xl rounded-3xl p-8 lg:p-12 border border-white/30 shadow-2xl relative overflow-hidden mb-8"
              variants={itemVariants}
            >
              {/* Card background effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-violet-600/5" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-200/20 to-transparent rounded-full blur-2xl" />
              
              <div className="relative z-10 text-center">
                <motion.div 
                  className="w-32 h-32 bg-gradient-to-r from-sky-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Scan size={48} className="text-white" />
                </motion.div>

                <h2 className="text-3xl lg:text-4xl font-black text-gray-900 mb-6">Escanear Código QR</h2>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg lg:text-xl leading-relaxed mb-12">
                  Apunta tu cámara al código QR del comercio para validar y acceder a tus beneficios exclusivos de forma instantánea y segura
                </p>

                {/* Scanner Button */}
                <div className="max-w-md mx-auto mb-12">
                  <QRScannerButton
                    onScan={handleQRScan}
                    loading={scannerLoading}
                  />
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-r from-sky-50/80 to-violet-50/80 backdrop-blur-xl rounded-2xl p-8 border border-sky-200/50 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-violet-200/30 to-transparent rounded-full blur-xl" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-sky-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <Sparkles size={20} className="text-white" />
                      </div>
                      <h3 className="font-black text-gray-900 text-xl">¿Cómo funciona?</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-sky-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                          1
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Solicita el QR</h4>
                          <p className="text-sm text-gray-700">Pide al comercio que muestre su código QR de beneficios</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                          2
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Escanea</h4>
                          <p className="text-sm text-gray-700">Presiona el botón y permite el acceso a la cámara</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                          3
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Apunta</h4>
                          <p className="text-sm text-gray-700">Enfoca la cámara al código hasta que se detecte</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                          4
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">¡Disfruta!</h4>
                          <p className="text-sm text-gray-700">Accede a tu beneficio validado al instante</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Performance Metrics */}
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
              variants={containerVariants}
            >
              <motion.div 
                className="text-center p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl border border-emerald-200 shadow-lg"
                variants={itemVariants}
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap size={20} className="text-white" />
                </div>
                <div className="text-2xl font-black text-emerald-700 mb-2">&lt; 2s</div>
                <div className="text-sm text-emerald-600 font-semibold">Detección Instantánea</div>
                <div className="text-xs text-emerald-500 mt-1">Tecnología avanzada de reconocimiento</div>
              </motion.div>
              
              <motion.div 
                className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-lg"
                variants={itemVariants}
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="text-2xl font-black text-blue-700 mb-2">100%</div>
                <div className="text-sm text-blue-600 font-semibold">Seguro y Privado</div>
                <div className="text-xs text-blue-500 mt-1">Encriptación de extremo a extremo</div>
              </motion.div>
              
              <motion.div 
                className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 shadow-lg"
                variants={itemVariants}
              >
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Smartphone size={20} className="text-white" />
                </div>
                <div className="text-2xl font-black text-purple-700 mb-2">24/7</div>
                <div className="text-sm text-purple-600 font-semibold">Siempre Disponible</div>
                <div className="text-xs text-purple-500 mt-1">Funciona en cualquier momento</div>
              </motion.div>
            </motion.div>

            {/* Tips Section */}
            <motion.div 
              className="mt-12 bg-gradient-to-r from-violet-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
              variants={itemVariants}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-white/20 to-transparent rounded-full blur-2xl" />
              
              <div className="relative z-10 text-center">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Target size={24} className="text-yellow-300" />
                  <h3 className="text-2xl font-black">Consejos para un Escaneo Perfecto</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                    <Camera size={24} className="text-yellow-300 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">Iluminación</h4>
                    <p className="text-sm text-violet-100">Asegúrate de tener buena luz para una detección óptima</p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                    <Target size={24} className="text-yellow-300 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">Estabilidad</h4>
                    <p className="text-sm text-violet-100">Mantén el teléfono estable durante el escaneo</p>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
                    <Clock size={24} className="text-yellow-300 mx-auto mb-3" />
                    <h4 className="font-bold mb-2">Paciencia</h4>
                    <p className="text-sm text-violet-100">Espera unos segundos para la detección automática</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </DashboardLayout>

      {/* Modal de Logout */}
      <LogoutModal
        isOpen={logoutModalOpen}
        isLoading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

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

export default function SocioValidarPage() {
  return (
    <Suspense fallback={
      <DashboardLayout
        activeSection="validar"
        sidebarComponent={(props) => (
          <SocioSidebarWithLogout
            {...props}
            onLogoutClick={() => {}}
          />
        )}
      >
        <LoadingSkeleton />
      </DashboardLayout>
    }>
      <SocioValidarContent />
    </Suspense>
  );
}