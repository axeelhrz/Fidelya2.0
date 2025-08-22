import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface QRScannerState {
  isScanning: boolean;
  isProcessing: boolean;
  error: string | null;
  hasPermission: boolean | null;
  isMobile: boolean;
  flashEnabled: boolean;
  availableCameras: MediaDeviceInfo[];
  selectedCameraId: string;
}

interface QRScannerOptions {
  onScan: (qrData: string) => void;
  preferredFacingMode?: 'user' | 'environment';
  enableFlash?: boolean;
  enableCameraSwitch?: boolean;
  scanInterval?: number;
}

export const useQRScanner = (options: QRScannerOptions) => {
  const {
    onScan,
    preferredFacingMode = 'environment',
    enableFlash = true,
    enableCameraSwitch = true,
    scanInterval = 100
  } = options;

  const [state, setState] = useState<QRScannerState>({
    isScanning: false,
    isProcessing: false,
    error: null,
    hasPermission: null,
    isMobile: false,
    flashEnabled: false,
    availableCameras: [],
    selectedCameraId: ''
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<import('@zxing/library').BrowserQRCodeReader | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Detectar dispositivo móvil
  const detectMobile = useCallback(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isSmallScreen = window.innerWidth <= 768;
    return isMobileDevice || isSmallScreen;
  }, []);

  // Inicializar escáner
  const initializeScanner = useCallback(async () => {
    if (isInitializedRef.current) return;

    try {
      console.log('🔄 Initializing QR Scanner...');
      
      // Detectar móvil
      const isMobile = detectMobile();
      setState(prev => ({ ...prev, isMobile }));

      // Importar librería dinámicamente
      const { BrowserQRCodeReader } = await import('@zxing/library');
      scannerRef.current = new BrowserQRCodeReader();

      // Obtener cámaras disponibles
      if (navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === 'videoinput');
        
        // Preferir cámara trasera
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );

        setState(prev => ({
          ...prev,
          availableCameras: cameras,
          selectedCameraId: backCamera?.deviceId || cameras[0]?.deviceId || ''
        }));

        console.log('📹 Available cameras:', cameras.length);
      }

      isInitializedRef.current = true;
      console.log('✅ QR Scanner initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize QR scanner:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al inicializar el escáner. Verifica que tu navegador sea compatible.'
      }));
    }
  }, [detectMobile]);

  // Obtener configuraciones de cámara optimizadas
  const getCameraConstraints = useCallback((): MediaStreamConstraints => {
    const { isMobile, selectedCameraId } = state;

    const baseConstraints = selectedCameraId ? {
      deviceId: { exact: selectedCameraId }
    } : {
      facingMode: { ideal: preferredFacingMode }
    };

    if (isMobile) {
      return {
        video: {
          ...baseConstraints,
          width: { ideal: 1280, max: 1920, min: 640 },
          height: { ideal: 720, max: 1080, min: 480 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30, max: 30 }
        }
      };
    } else {
      return {
        video: {
          ...baseConstraints,
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          aspectRatio: { ideal: 16/9 },
          frameRate: { ideal: 30 }
        }
      };
    }
  }, [state, preferredFacingMode]);

  // Solicitar permisos de cámara
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🎥 Requesting camera permission...');
      
      const constraints = getCameraConstraints();
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Esperar a que el video esté listo
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

      setState(prev => ({ ...prev, hasPermission: true, error: null }));
      console.log('✅ Camera permission granted');
      return true;
    } catch (err) {
      console.error('❌ Camera permission denied:', err);
      
      let errorMessage = 'Error al acceder a la cámara.';
      let errorName: string | undefined;
      
      if (err && typeof err === 'object' && 'name' in err) {
        errorName = String((err as { name?: unknown }).name);
      }

      if (errorName === 'NotAllowedError') {
        errorMessage = 'Acceso a la cámara denegado. Por favor, permite el acceso a la cámara.';
      } else if (errorName === 'NotFoundError') {
        errorMessage = 'No se encontró una cámara disponible en tu dispositivo.';
      } else if (errorName === 'NotReadableError') {
        errorMessage = 'La cámara está siendo usada por otra aplicación.';
      } else if (errorName === 'OverconstrainedError') {
        errorMessage = 'La configuración de cámara no es compatible con tu dispositivo.';
      }

      setState(prev => ({ 
        ...prev, 
        hasPermission: false, 
        error: errorMessage 
      }));
      
      return false;
    }
  }, [getCameraConstraints]);

  // Escanear QR de forma continua
  const scanQRCode = useCallback(async () => {
    if (!scannerRef.current || !videoRef.current || state.isProcessing) {
      return;
    }

    try {
      const result = await scannerRef.current.decodeOnceFromVideoDevice(
        undefined,
        videoRef.current
      );
      
      if (result) {
        const qrText = result.getText();
        console.log('🎯 QR Code detected:', qrText);
        
        setState(prev => ({ ...prev, isProcessing: true }));
        
        // Vibración en móviles
        if (navigator.vibrate && state.isMobile) {
          navigator.vibrate([200, 100, 200]);
        }

        // Feedback visual
        toast.success('¡Código QR detectado!');
        
        // Llamar callback
        onScan(qrText);
        
        // Detener escaneo después de detección exitosa
        setTimeout(() => {
          stopScanning();
        }, 1500);
      }
    } catch (error) {
      // Ignorar errores normales de escaneo (cuando no hay QR)
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message: string }).message;
        if (!message.includes('No MultiFormat Readers were able to detect the code')) {
          console.debug('Scanning error (normal):', message);
        }
      }
    }
  }, [state.isProcessing, state.isMobile, onScan]);

  // Iniciar escaneo
  const startScanning = useCallback(async () => {
    if (state.isScanning) return;

    try {
      console.log('🔍 Starting QR scan...');
      setState(prev => ({ ...prev, isScanning: true, error: null, isProcessing: false }));

      // Solicitar permisos
      const hasAccess = await requestCameraPermission();
      if (!hasAccess) {
        setState(prev => ({ ...prev, isScanning: false }));
        return;
      }

      // Iniciar escaneo continuo
      scanIntervalRef.current = setInterval(scanQRCode, scanInterval);
      
      console.log('📹 QR scanning started');
    } catch (error) {
      console.error('❌ Error starting scan:', error);
      setState(prev => ({ 
        ...prev, 
        isScanning: false, 
        error: 'Error al iniciar el escaneo. Intenta de nuevo.' 
      }));
    }
  }, [state.isScanning, requestCameraPermission, scanQRCode, scanInterval]);

  // Detener escaneo
  const stopScanning = useCallback(() => {
    try {
      console.log('🛑 Stopping QR scan...');
      
      // Limpiar intervalo
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }

      // Detener stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('📹 Stopped track:', track.kind);
        });
        streamRef.current = null;
      }

      // Limpiar video
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Reset scanner
      if (scannerRef.current) {
        try {
          scannerRef.current.reset();
        } catch (error) {
          console.warn('Error resetting scanner:', error);
        }
      }

      setState(prev => ({
        ...prev,
        isScanning: false,
        isProcessing: false,
        flashEnabled: false,
        hasPermission: null
      }));
      
      console.log('✅ QR scan stopped');
    } catch (error) {
      console.error('❌ Error stopping scanner:', error);
    }
  }, []);

  // Alternar flash
  const toggleFlash = useCallback(async () => {
    if (!streamRef.current || !enableFlash) {
      toast.error('Flash no disponible');
      return;
    }

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      
      if ('torch' in capabilities && capabilities.torch) {
        const newFlashState = !state.flashEnabled;
        await videoTrack.applyConstraints({
          advanced: [{ torch: newFlashState } as MediaTrackConstraintSet]
        });
        
        setState(prev => ({ ...prev, flashEnabled: newFlashState }));
        toast.success(newFlashState ? 'Flash activado' : 'Flash desactivado');
      } else {
        toast.error('Flash no disponible en este dispositivo');
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
      toast.error('Error al controlar el flash');
    }
  }, [state.flashEnabled, enableFlash]);

  // Cambiar cámara
  const switchCamera = useCallback(async () => {
    if (!enableCameraSwitch || state.availableCameras.length <= 1) {
      toast.error('Solo hay una cámara disponible');
      return;
    }

    const currentIndex = state.availableCameras.findIndex(
      cam => cam.deviceId === state.selectedCameraId
    );
    const nextIndex = (currentIndex + 1) % state.availableCameras.length;
    const nextCamera = state.availableCameras[nextIndex];
    
    setState(prev => ({ ...prev, selectedCameraId: nextCamera.deviceId }));
    
    if (state.isScanning) {
      stopScanning();
      setTimeout(() => startScanning(), 500);
    }
    
    toast.success(`Cambiando a: ${nextCamera.label || 'Cámara ' + (nextIndex + 1)}`);
  }, [state, enableCameraSwitch, stopScanning, startScanning]);

  // Procesar imagen subida
  const processImageFile = useCallback(async (file: File): Promise<boolean> => {
    if (!scannerRef.current) return false;

    try {
      setState(prev => ({ ...prev, isProcessing: true }));
      console.log('📁 Processing uploaded file...');

      const img = new Image();
      
      // Cargar imagen
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Error loading image'));
        img.src = URL.createObjectURL(file);
      });

      // Escanear QR en la imagen
      const result = await scannerRef.current.decodeFromImage(img);

      if (result) {
        const qrText = result.getText();
        console.log('🎯 QR Code detected from file:', qrText);

        toast.success('¡Código QR detectado en la imagen!');
        onScan(qrText);
        
        // Limpiar
        URL.revokeObjectURL(img.src);
        return true;
      } else {
        toast.error('No se encontró un código QR válido en la imagen');
        return false;
      }
    } catch (error) {
      console.error('❌ Error processing file:', error);
      toast.error('Error al procesar la imagen. Intenta con otra imagen.');
      return false;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [onScan]);

  // Reintentar
  const retry = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
    startScanning();
  }, [startScanning]);

  // Inicializar al montar
  useEffect(() => {
    initializeScanner();
    
    // Detectar cambios de tamaño de ventana
    const handleResize = () => {
      const isMobile = detectMobile();
      setState(prev => ({ ...prev, isMobile }));
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      stopScanning();
    };
  }, [initializeScanner, detectMobile, stopScanning]);

  return {
    // Estado
    ...state,
    
    // Referencias
    videoRef,
    
    // Acciones
    startScanning,
    stopScanning,
    toggleFlash,
    switchCamera,
    processImageFile,
    retry,
    
    // Configuración
    canToggleFlash: enableFlash && state.availableCameras.length > 0,
    canSwitchCamera: enableCameraSwitch && state.availableCameras.length > 1,
    
    // Utilidades
    frameSize: state.isMobile ? 256 : 320,
    cornerSize: state.isMobile ? 8 : 12,
    borderWidth: state.isMobile ? 3 : 4
  };
};