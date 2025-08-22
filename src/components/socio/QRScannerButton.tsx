import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  X, 
  Zap, 
  AlertCircle, 
  RefreshCw,
  Flashlight,
  FlashlightOff,
  RotateCcw,
  CheckCircle,
  Upload,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
// Import media types to extend MediaTrackCapabilities
import '../../types/media';

interface QRScannerButtonProps {
  onScan: (qrData: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const QRScannerButton: React.FC<QRScannerButtonProps> = ({ 
  onScan, 
  loading = false,
  disabled = false 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode,] = useState<'user' | 'environment'>('environment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanMethod,] = useState<'camera' | 'file'>('camera');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<import('@zxing/library').BrowserQRCodeReader | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      // Safely obtain vendor/opera without using `any`
      const vendor = typeof navigator.vendor === 'string' ? navigator.vendor : '';
      const win = window as unknown as { opera?: string | undefined };
      const operaProp = typeof win.opera === 'string' ? win.opera : '';

      const userAgent = navigator.userAgent || vendor || operaProp || '';
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
      console.log('📱 Mobile detection:', { isMobileDevice, isSmallScreen, result: isMobileDevice || isSmallScreen });
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize QR scanner when component mounts
  useEffect(() => {
    const initializeScanner = async () => {
      try {
        console.log('🔄 Initializing QR Scanner...');
        // Dynamically import QR scanner library
        const { BrowserQRCodeReader } = await import('@zxing/library');
        scannerRef.current = new BrowserQRCodeReader();
        console.log('✅ QR Scanner initialized successfully');
        
        // Get available cameras
        await getAvailableCameras();
      } catch (error) {
        console.error('❌ Failed to initialize QR scanner:', error);
        setError('Error al inicializar el escáner. Verifica que tu navegador sea compatible.');
      }
    };

    initializeScanner();

    return () => {
      stopScanning();
    };
  }, []);

  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      
      // Select the first available camera or prefer back camera
      if (cameras.length > 0) {
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );
        setSelectedCameraId(backCamera?.deviceId || cameras[0].deviceId);
      }
      
      console.log('📹 Available cameras:', cameras.length);
    } catch (error) {
      console.error('Error getting cameras:', error);
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      console.log('🎥 Requesting camera permission...');
      
      // Configuraciones optimizadas para móvil
      const mobileConstraints: MediaStreamConstraints = {
        video: selectedCameraId ? {
          deviceId: { exact: selectedCameraId },
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, max: 30 }
        } : {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, max: 30 }
        }
      };

      // Configuraciones para desktop
      const desktopConstraints: MediaStreamConstraints = {
        video: selectedCameraId ? {
          deviceId: { exact: selectedCameraId },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          aspectRatio: { ideal: 16/9 }
        } : {
          facingMode: facingMode,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          aspectRatio: { ideal: 16/9 }
        }
      };

      const constraints = isMobile ? mobileConstraints : desktopConstraints;
      console.log('📹 Using constraints:', constraints);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store the stream reference
      streamRef.current = stream;
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for video to load'));
          }, 10000);

          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              clearTimeout(timeout);
              resolve();
            };

            videoRef.current.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Error loading video'));
            };
          }
        });
      }
      
      console.log('✅ Camera permission granted and video ready');
      return true;
    } catch (error: unknown) {
      console.error('❌ Camera permission denied:', error);

      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        typeof (error as { name: string }).name === 'string'
      ) {
        const errorName = (error as { name: string }).name;
        if (errorName === 'NotAllowedError') {
          setError('Acceso a la cámara denegado. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
        } else if (errorName === 'NotFoundError') {
          setError('No se encontró una cámara disponible en tu dispositivo.');
        } else if (errorName === 'NotReadableError') {
          setError('La cámara está siendo usada por otra aplicación. Cierra otras aplicaciones que puedan estar usando la cámara.');
        } else if (errorName === 'OverconstrainedError') {
          setError('La configuración de cámara solicitada no es compatible con tu dispositivo.');
        } else {
          setError('Error al acceder a la cámara. Verifica que tu dispositivo tenga una cámara funcional.');
        }
      } else {
        setError('Error al acceder a la cámara. Verifica que tu dispositivo tenga una cámara funcional.');
      }

      return false;
    }
  };

  const startScanning = async () => {
    console.log('🔍 startScanning called - Button clicked!');
    console.log('Scanner ref:', scannerRef.current);
    console.log('Loading:', loading);
    console.log('Disabled:', disabled);
    
    if (!scannerRef.current) {
      console.error('❌ Scanner not initialized');
      setError('Escáner no inicializado. Recarga la página e intenta de nuevo.');
      return;
    }

    try {
      console.log('🔍 Starting QR scan...');
      setError(null);
      setIsScanning(true);
      setIsProcessing(false);

      if (scanMethod === 'camera') {
        // Request camera permission and start stream
        const hasAccess = await requestCameraPermission();
        if (!hasAccess) {
          setIsScanning(false);
          return;
        }

        console.log('📹 Video ready, starting QR detection...');

        // Start continuous scanning
        startContinuousScanning();
      }

    } catch (error: unknown) {
      console.error('❌ Scanning error:', error);

      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: string }).message === 'string'
      ) {
        const errorMessage = (error as { message: string }).message;
        if (errorMessage.includes('Timeout')) {
          setError('Tiempo de espera agotado. Verifica que la cámara esté funcionando correctamente.');
        } else {
          setError('Error al iniciar el escaneo. Intenta de nuevo.');
        }
      } else {
        setError('Error al iniciar el escaneo. Intenta de nuevo.');
      }

      stopScanning();
    }
  };

  const stopScanning = useCallback(() => {
    try {
      console.log('🛑 Stopping QR scan...');
      
      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Stop the scanner
      if (scannerRef.current) {
        try {
          scannerRef.current.reset();
        } catch (error) {
          console.warn('Error resetting scanner:', error);
        }
      }

      // Stop video stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('📹 Stopped video track:', track.kind);
        });
        streamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsScanning(false);
      setIsProcessing(false);
      setFlashEnabled(false);
      
      console.log('✅ QR scan stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping scanner:', error);
    }
  }, []);

  const startContinuousScanning = useCallback(() => {
    if (!scannerRef.current || !videoRef.current || !streamRef.current) {
      return;
    }

    const scanFrame = async () => {
      try {
        if (!isScanning || isProcessing || !scannerRef.current || !videoRef.current) {
          return;
        }

        // Use the more robust scanning method
        const result = await scannerRef.current.decodeOnceFromVideoDevice(
          undefined,
          videoRef.current
        );
        
        if (result) {
          const qrText = result.getText();
          console.log('🎯 QR Code detected:', qrText);
          
          setIsProcessing(true);
          
          // Vibrate if supported
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }

          // Show success feedback
          toast.success('¡Código QR detectado!');
          
          // Call the onScan callback
          onScan(qrText);
          
          // Stop scanning after successful detection
          setTimeout(() => {
            stopScanning();
          }, 1500);
          
          return;
        }
      } catch (error) {
        // Ignore scanning errors and continue - this is normal when no QR is detected
        // Only log if it's an unexpected error
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as { message: string }).message;
          if (!message.includes('No MultiFormat Readers were able to detect the code')) {
            console.debug('Scanning frame error (normal):', message);
          }
        }
      }

      // Continue scanning if still active
      if (isScanning && !isProcessing) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    // Start the scanning loop
    scanFrame();
  }, [isScanning, isProcessing, onScan, stopScanning]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !scannerRef.current) {
      return;
    }

    try {
      setIsProcessing(true);
      console.log('📁 Processing uploaded file...');

      // Create image element
      const img = new Image();
      const canvas = canvasRef.current;
      
      if (!canvas) {
        throw new Error('Canvas not available');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Load image
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Error loading image'));
        img.src = URL.createObjectURL(file);
      });

      // Draw image to canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Scan for QR code using the image element
      const result = await scannerRef.current.decodeFromImage(img);

      if (result) {
        const qrText = result.getText();
        console.log('🎯 QR Code detected from file:', qrText);

        toast.success('¡Código QR detectado en la imagen!');
        onScan(qrText);
        setIsScanning(false);
      } else {
        toast.error('No se encontró un código QR válido en la imagen');
      }

      // Clean up
      URL.revokeObjectURL(img.src);
      
    } catch (error) {
      console.error('❌ Error processing file:', error);
      toast.error('Error al procesar la imagen. Intenta con otra imagen.');
    } finally {
      setIsProcessing(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleFlash = async () => {
    try {
      if (streamRef.current) {
        const videoTrack = streamRef.current.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities();
        
        // Check if torch capability exists and is supported
        if (capabilities.torch === true) {
          await videoTrack.applyConstraints({
            advanced: [{ torch: !flashEnabled } as MediaTrackConstraintSet]
          });
          setFlashEnabled(!flashEnabled);
          toast.success(flashEnabled ? 'Flash desactivado' : 'Flash activado');
        } else {
          toast.error('Flash no disponible en este dispositivo');
        }
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      toast.error('Error al controlar el flash');
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      toast.error('Solo hay una cámara disponible');
      return;
    }

    const currentIndex = availableCameras.findIndex(cam => cam.deviceId === selectedCameraId);
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    
    setSelectedCameraId(nextCamera.deviceId);
    
    if (isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 500);
    }
    
    toast.success(`Cambiando a: ${nextCamera.label || 'Cámara ' + (nextIndex + 1)}`);
  };

  const handleRetry = () => {
    setError(null);
    startScanning();
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Debug: Log when component renders
  console.log('🔄 QRScannerButton render:', { isScanning, loading, disabled, error });

  if (!isScanning) {
    return (
      <div className="space-y-4">
        {/* Main scan button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            console.log('🖱️ Button clicked!');
            startScanning();
          }}
          disabled={loading || disabled}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 relative overflow-hidden group"
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {loading ? (
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Validando...</span>
            </div>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              <span>Escanear con Cámara</span>
            </>
          )}
        </motion.button>

        {/* Alternative: Upload image */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={triggerFileUpload}
          disabled={loading || disabled || isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-2xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Procesando...</span>
            </div>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Subir Imagen QR</span>
            </>
          )}
        </motion.button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 safe-area-top">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-violet-400" />
              <div>
                <span className="font-semibold">Escanear QR</span>
                {isProcessing && (
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">¡Código detectado!</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Flash Toggle */}
              <button
                onClick={toggleFlash}
                className={`p-2 rounded-lg transition-colors ${
                  flashEnabled ? 'bg-yellow-500' : 'bg-white/20 hover:bg-white/30'
                }`}
                title={flashEnabled ? 'Desactivar flash' : 'Activar flash'}
              >
                {flashEnabled ? (
                  <Flashlight className="w-5 h-5" />
                ) : (
                  <FlashlightOff className="w-5 h-5" />
                )}
              </button>
              
              {/* Camera Switch */}
              {availableCameras.length > 1 && (
                <button
                  onClick={switchCamera}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  title="Cambiar cámara"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              {/* Upload Image */}
              <button
                onClick={triggerFileUpload}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="Subir imagen"
              >
                <Upload className="w-5 h-5" />
              </button>
              
              {/* Close Button */}
              <button
                onClick={stopScanning}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                title="Cerrar escáner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="relative w-full h-full flex items-center justify-center">
          {error ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center text-white p-8 max-w-md mx-4"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Error de Cámara</h3>
              <p className="text-gray-300 mb-6 text-sm leading-relaxed">{error}</p>
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Intentar de nuevo</span>
                </button>

                <button
                  onClick={triggerFileUpload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir imagen en su lugar</span>
                </button>
                
                <button
                  onClick={stopScanning}
                  className="w-full border border-white/30 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Video Element */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Scanning Frame - Responsive size */}
                  <div className={`${
                    isMobile ? 'w-64 h-64' : 'w-80 h-80'
                  } border-2 rounded-2xl relative transition-colors duration-300 ${
                    isProcessing ? 'border-green-400' : 'border-white/50'
                  }`}>
                    {/* Corner indicators */}
                    <div className={`absolute top-0 left-0 ${
                      isMobile ? 'w-8 h-8 border-t-3 border-l-3' : 'w-12 h-12 border-t-4 border-l-4'
                    } rounded-tl-lg transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-violet-400'
                    }`} />
                    <div className={`absolute top-0 right-0 ${
                      isMobile ? 'w-8 h-8 border-t-3 border-r-3' : 'w-12 h-12 border-t-4 border-r-4'
                    } rounded-tr-lg transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-violet-400'
                    }`} />
                    <div className={`absolute bottom-0 left-0 ${
                      isMobile ? 'w-8 h-8 border-b-3 border-l-3' : 'w-12 h-12 border-b-4 border-l-4'
                    } rounded-bl-lg transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-violet-400'
                    }`} />
                    <div className={`absolute bottom-0 right-0 ${
                      isMobile ? 'w-8 h-8 border-b-3 border-r-3' : 'w-12 h-12 border-b-4 border-r-4'
                    } rounded-br-lg transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-violet-400'
                    }`} />
                    
                    {/* Scanning line animation */}
                    {!isProcessing && (
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                        animate={{
                          y: [0, isMobile ? 256 : 320, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Success indicator */}
                    {isProcessing && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className={`${
                          isMobile ? 'w-16 h-16' : 'w-20 h-20'
                        } bg-green-500 rounded-full flex items-center justify-center`}>
                          <CheckCircle className={`${
                            isMobile ? 'w-8 h-8' : 'w-10 h-10'
                          } text-white`} />
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Instructions */}
                  <div className={`absolute ${
                    isMobile ? '-bottom-20' : '-bottom-24'
                  } left-1/2 transform -translate-x-1/2 text-center px-4`}>
                    <p className={`text-white ${
                      isMobile ? 'text-base' : 'text-lg'
                    } font-medium transition-colors duration-300 mb-2 ${
                      isProcessing ? 'text-green-400' : ''
                    }`}>
                      {isProcessing ? '¡Código QR detectado!' : 'Coloca el código QR dentro del marco'}
                    </p>
                    {!isProcessing && (
                      <p className={`text-white/70 ${
                        isMobile ? 'text-xs' : 'text-sm'
                      }`}>
                        También puedes subir una imagen con el botón de arriba
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Bottom Instructions */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 safe-area-bottom">
          <div className="text-center text-white">
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} opacity-80 mb-2`}>
              {availableCameras.length > 0 && selectedCameraId && (
                <>Usando: {availableCameras.find(cam => cam.deviceId === selectedCameraId)?.label || 'Cámara'}<br /></>
              )}
              Mantén estable y asegúrate de que haya buena iluminación
            </p>
            <div className={`flex items-center justify-center space-x-4 ${
              isMobile ? 'text-xs' : 'text-xs'
            } opacity-60`}>
              <span>• Enfoque automático</span>
              <span>• Detección instantánea</span>
              {!isMobile && <span>• Múltiples formatos</span>}
              <span>• Seguro y privado</span>
            </div>
          </div>
        </div>

        {/* Hidden file input and canvas */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </AnimatePresence>
  );
};