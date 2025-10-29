import { useState, useRef, useCallback, useEffect } from 'react';

interface CameraError {
  name: string;
  message: string;
  constraint?: string;
}

interface CameraState {
  status: 'idle' | 'requesting' | 'active' | 'error';
  hasPermission: boolean | null;
  error: CameraError | null;
  stream: MediaStream | null;
  deviceInfo: {
    isMobile: boolean;
    hasCamera: boolean;
    supportedConstraints: MediaTrackSupportedConstraints | null;
  };
}

interface UseCameraOptions {
  maxRetries?: number;
  preferredFacingMode?: 'user' | 'environment';
}

export const useCamera = (options: UseCameraOptions = {}) => {
  const { maxRetries = 3, preferredFacingMode = 'environment' } = options;
  
  const [cameraState, setCameraState] = useState<CameraState>({
    status: 'idle',
    hasPermission: null,
    error: null,
    stream: null,
    deviceInfo: {
      isMobile: false,
      hasCamera: false,
      supportedConstraints: null
    }
  });

  const streamRef = useRef<MediaStream | null>(null);
  const retryCountRef = useRef(0);
  const isInitializedRef = useRef(false);

  // Detectar información del dispositivo
  const detectDeviceInfo = useCallback(() => {
    if (isInitializedRef.current) return;
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const supportedConstraints = navigator.mediaDevices?.getSupportedConstraints() || null;

    setCameraState(prev => ({
      ...prev,
      deviceInfo: {
        isMobile,
        hasCamera,
        supportedConstraints
      }
    }));

    isInitializedRef.current = true;
    console.log('🔍 Device Detection:', { isMobile, hasCamera, supportedConstraints });
  }, []);

  // Obtener configuraciones de cámara progresivas
  const getCameraConfigurations = useCallback((): MediaStreamConstraints[] => {
    const { isMobile } = cameraState.deviceInfo;
    
    if (isMobile) {
      return [
        // Configuración móvil optimizada
        {
          video: {
            facingMode: { ideal: preferredFacingMode },
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          }
        },
        // Configuración móvil básica
        {
          video: {
            facingMode: preferredFacingMode,
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        // Fallback móvil
        {
          video: {
            facingMode: preferredFacingMode
          }
        },
        // Último recurso
        {
          video: true
        }
      ];
    } else {
      return [
        // Configuración desktop
        {
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30 }
          }
        },
        // Configuración desktop básica
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        },
        // Último recurso
        {
          video: true
        }
      ];
    }
  }, [cameraState.deviceInfo, preferredFacingMode]);

  // Iniciar cámara
  const startCamera = useCallback(async (): Promise<MediaStream | null> => {
    // Evitar múltiples llamadas simultáneas
    if (cameraState.status === 'requesting') {
      console.log('🎥 Camera already starting...');
      return null;
    }

    console.log('🎥 Starting camera...');
    setCameraState(prev => ({ ...prev, status: 'requesting', error: null }));

    try {
      // Verificar soporte básico
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara');
      }

      // Detener stream anterior si existe
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      const configurations = getCameraConfigurations();
      let stream: MediaStream | null = null;
      let lastError: Error | null = null;

      // Intentar cada configuración
      for (let i = 0; i < configurations.length; i++) {
        try {
          console.log(`🔄 Trying camera config ${i + 1}/${configurations.length}`);
          stream = await navigator.mediaDevices.getUserMedia(configurations[i]);
          console.log('✅ Camera started successfully');
          break;
        } catch (error) {
          console.warn(`❌ Config ${i + 1} failed:`, error);
          lastError = error as Error;
          continue;
        }
      }

      if (!stream) {
        throw lastError || new Error('No se pudo acceder a la cámara');
      }

      streamRef.current = stream;
      setCameraState(prev => ({
        ...prev,
        status: 'active',
        hasPermission: true,
        error: null,
        stream
      }));

      retryCountRef.current = 0;
      return stream;

    } catch (error) {
      console.error('❌ Camera error:', error);
      
      const err = error as Error & { constraint?: string };
      const cameraError: CameraError = {
        name: err.name || 'UnknownError',
        message: err.message || 'Error desconocido',
        constraint: err.constraint
      };

      setCameraState(prev => ({
        ...prev,
        status: 'error',
        hasPermission: false,
        error: cameraError,
        stream: null
      }));

      return null;
    }
  }, [cameraState.status, getCameraConfigurations]);

  // Detener cámara
  const stopCamera = useCallback(() => {
    console.log('🛑 Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Stopped track:', track.kind);
      });
      streamRef.current = null;
    }

    setCameraState(prev => ({
      ...prev,
      status: 'idle',
      hasPermission: null,
      error: null,
      stream: null
    }));
  }, []);

  // Reintentar cámara
  const retryCamera = useCallback(async () => {
    if (retryCountRef.current >= maxRetries) {
      console.warn('🚫 Max retries reached');
      return null;
    }
    
    retryCountRef.current++;
    console.log(`🔄 Retrying camera (attempt ${retryCountRef.current}/${maxRetries})`);
    
    // Detener cámara actual antes de reintentar
    stopCamera();
    
    // Esperar un poco antes de reintentar
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return await startCamera();
  }, [startCamera, stopCamera, maxRetries]);

  // Alternar flash
  const toggleFlash = useCallback(async (enabled?: boolean): Promise<boolean> => {
    if (!streamRef.current) return false;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return false;

      const capabilities = track.getCapabilities();
      
      if ('torch' in capabilities) {
        await track.applyConstraints({
          advanced: [{ torch: enabled } as MediaTrackConstraintSet]
        });
        console.log('💡 Flash toggled:', enabled);
        return enabled || false;
      } else {
        console.warn('💡 Flash not supported on this device');
        return false;
      }
    } catch (error) {
      console.error('💡 Error toggling flash:', error);
      return false;
    }
  }, []);

  // Obtener información de la cámara
  const getCameraInfo = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return { cameras: [], hasMultipleCameras: false };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      return {
        cameras,
        hasMultipleCameras: cameras.length > 1
      };
    } catch (error) {
      console.error('📹 Error getting camera info:', error);
      return { cameras: [], hasMultipleCameras: false };
    }
  }, []);

  // Obtener mensajes de error amigables
  const getErrorMessage = useCallback((): string => {
    if (!cameraState.error) return '';
    
    const error = cameraState.error;
    switch (error.name) {
      case 'NotAllowedError':
        return 'Permisos de cámara denegados. Por favor, permite el acceso a la cámara.';
      case 'NotFoundError':
        return 'No se encontró ninguna cámara en tu dispositivo.';
      case 'NotReadableError':
        return 'La cámara está siendo usada por otra aplicación.';
      case 'OverconstrainedError':
        return 'La configuración de cámara no es compatible con tu dispositivo.';
      case 'SecurityError':
        return 'Error de seguridad. Asegúrate de estar usando HTTPS.';
      case 'AbortError':
        return 'Acceso a la cámara cancelado.';
      default:
        return error.message || 'Error desconocido al acceder a la cámara.';
    }
  }, [cameraState.error]);

  // Detectar información del dispositivo al inicializar
  useEffect(() => {
    detectDeviceInfo();
  }, [detectDeviceInfo]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    // Estado
    cameraState,
    retryCount: retryCountRef.current,
    maxRetries,
    
    // Acciones
    startCamera,
    stopCamera,
    retryCamera,
    toggleFlash,
    detectDeviceInfo,
    getCameraInfo,
    
    // Utilidades
    getErrorMessage,
    
    // Referencias
    streamRef
  };
};