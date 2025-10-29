import React, { useRef } from 'react';
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
import { useQRScanner } from '@/hooks/useQRScanner';

interface OptimizedQRScannerProps {
  onScan: (qrData: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export const OptimizedQRScanner: React.FC<OptimizedQRScannerProps> = ({ 
  onScan, 
  loading = false,
  disabled = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    // Estado
    isScanning,
    isProcessing,
    error,
    isMobile,
    flashEnabled,
    availableCameras,
    selectedCameraId,
    
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
    canToggleFlash,
    canSwitchCamera,
    
    // Utilidades
    frameSize,
    cornerSize,
    borderWidth
  } = useQRScanner({
    onScan,
    preferredFacingMode: 'environment',
    enableFlash: true,
    enableCameraSwitch: true,
    scanInterval: 100
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await processImageFile(file);
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  if (!isScanning) {
    return (
      <div className="space-y-4">
        {/* Botón principal de escaneo */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startScanning}
          disabled={loading || disabled}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-4 px-6 rounded-2xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 relative overflow-hidden group mobile-optimized"
        >
          {/* Efecto de brillo */}
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

        {/* Botón alternativo: subir imagen */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={triggerFileUpload}
          disabled={loading || disabled || isProcessing}
          className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-2xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 relative overflow-hidden group mobile-optimized"
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

        {/* Input oculto para archivos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black mobile-optimized"
      >
        {/* Header con controles */}
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
              {/* Control de flash */}
              {canToggleFlash && (
                <button
                  onClick={toggleFlash}
                  className={`p-2 rounded-lg transition-colors mobile-button ${
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
              )}
              
              {/* Cambiar cámara */}
              {canSwitchCamera && (
                <button
                  onClick={switchCamera}
                  className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors mobile-button"
                  title="Cambiar cámara"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}

              {/* Subir imagen */}
              <button
                onClick={triggerFileUpload}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors mobile-button"
                title="Subir imagen"
              >
                <Upload className="w-5 h-5" />
              </button>
              
              {/* Cerrar */}
              <button
                onClick={stopScanning}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors mobile-button"
                title="Cerrar escáner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Área de escaneo */}
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
                  onClick={retry}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 mobile-button"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Intentar de nuevo</span>
                </button>

                <button
                  onClick={triggerFileUpload}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 mobile-button"
                >
                  <Upload className="w-4 h-4" />
                  <span>Subir imagen en su lugar</span>
                </button>
                
                <button
                  onClick={stopScanning}
                  className="w-full border border-white/30 text-white py-3 px-6 rounded-lg font-medium hover:bg-white/10 transition-colors mobile-button"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Elemento de video */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              
              {/* Overlay de escaneo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Marco de escaneo responsivo */}
                  <div 
                    className={`border-2 rounded-2xl relative transition-colors duration-300 ${
                      isProcessing ? 'border-green-400' : 'border-white/50'
                    }`}
                    style={{ 
                      width: `${frameSize}px`, 
                      height: `${frameSize}px` 
                    }}
                  >
                    {/* Indicadores de esquina */}
                    <div 
                      className={`absolute top-0 left-0 rounded-tl-lg transition-colors duration-300 ${
                        isProcessing ? 'border-green-400' : 'border-violet-400'
                      }`}
                      style={{ 
                        width: `${cornerSize}px`, 
                        height: `${cornerSize}px`,
                        borderTopWidth: `${borderWidth}px`,
                        borderLeftWidth: `${borderWidth}px`
                      }}
                    />
                    <div 
                      className={`absolute top-0 right-0 rounded-tr-lg transition-colors duration-300 ${
                        isProcessing ? 'border-green-400' : 'border-violet-400'
                      }`}
                      style={{ 
                        width: `${cornerSize}px`, 
                        height: `${cornerSize}px`,
                        borderTopWidth: `${borderWidth}px`,
                        borderRightWidth: `${borderWidth}px`
                      }}
                    />
                    <div 
                      className={`absolute bottom-0 left-0 rounded-bl-lg transition-colors duration-300 ${
                        isProcessing ? 'border-green-400' : 'border-violet-400'
                      }`}
                      style={{ 
                        width: `${cornerSize}px`, 
                        height: `${cornerSize}px`,
                        borderBottomWidth: `${borderWidth}px`,
                        borderLeftWidth: `${borderWidth}px`
                      }}
                    />
                    <div 
                      className={`absolute bottom-0 right-0 rounded-br-lg transition-colors duration-300 ${
                        isProcessing ? 'border-green-400' : 'border-violet-400'
                      }`}
                      style={{ 
                        width: `${cornerSize}px`, 
                        height: `${cornerSize}px`,
                        borderBottomWidth: `${borderWidth}px`,
                        borderRightWidth: `${borderWidth}px`
                      }}
                    />
                    
                    {/* Línea de escaneo animada */}
                    {!isProcessing && (
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-400 to-transparent"
                        animate={{
                          y: [0, frameSize, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}

                    {/* Indicador de éxito */}
                    {isProcessing && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div 
                          className="bg-green-500 rounded-full flex items-center justify-center"
                          style={{ 
                            width: `${frameSize * 0.25}px`, 
                            height: `${frameSize * 0.25}px` 
                          }}
                        >
                          <CheckCircle 
                            className="text-white"
                            style={{ 
                              width: `${frameSize * 0.125}px`, 
                              height: `${frameSize * 0.125}px` 
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Instrucciones */}
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
                        isMobile ? 'mobile-text-xs' : 'text-sm'
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

        {/* Instrucciones inferiores */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 safe-area-bottom">
          <div className="text-center text-white">
            <p className={`${isMobile ? 'mobile-text-xs' : 'text-sm'} opacity-80 mb-2`}>
              {availableCameras.length > 0 && selectedCameraId && (
                <>Usando: {availableCameras.find(cam => cam.deviceId === selectedCameraId)?.label || 'Cámara'}<br /></>
              )}
              Mantén estable y asegúrate de que haya buena iluminación
            </p>
            <div className={`flex items-center justify-center space-x-4 ${
              isMobile ? 'mobile-text-xs' : 'text-xs'
            } opacity-60`}>
              <span>• Enfoque automático</span>
              <span>• Detección instantánea</span>
              {!isMobile && <span>• Múltiples formatos</span>}
              <span>• Seguro y privado</span>
            </div>
          </div>
        </div>

        {/* Input oculto para archivos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </motion.div>
    </AnimatePresence>
  );
};