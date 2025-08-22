import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  QrCode, 
  Download, 
  RefreshCw, 
  Printer, 
  Copy,
  Palette,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useComercio } from '@/hooks/useComercio';
import { toast } from 'react-hot-toast';
import { QR_CONFIG } from '@/lib/constants';

interface QRManagementProps {
  onNavigate?: (section: string) => void;
}

export const QRManagement: React.FC<QRManagementProps> = ({}) => {
  const { comercio, generateQRCode, loading } = useComercio();
  const [qrStyle, setQrStyle] = useState('default');
  const [showCustomization, setShowCustomization] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  const handleGenerateQR = async () => {
    const success = await generateQRCode();
    if (success) {
      toast.success('Código QR generado exitosamente');
    }
  };

  const handleDownloadQR = useCallback(async () => {
    if (!comercio?.qrCode) {
      toast.error('No hay código QR para descargar');
      return;
    }

    setDownloadLoading(true);
    try {
      // Use the data URL directly instead of the Firebase Storage URL to avoid CORS
      const dataUrl = comercio.qrCode;
      
      // Create download link
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `qr-${comercio.nombreComercio.replace(/\s+/g, '-').toLowerCase()}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('QR descargado exitosamente');
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Error al descargar el código QR');
    } finally {
      setDownloadLoading(false);
    }
  }, [comercio]);

  const generateValidationUrl = useCallback(() => {
    if (!comercio) return '';
    
    // Usar la URL de producción configurada en QR_CONFIG.baseUrl
    // en lugar de window.location.origin para evitar URLs de localhost
    const baseUrl = QR_CONFIG.baseUrl;
    return `${baseUrl}/validar-beneficio?comercio=${comercio.id}`;
  }, [comercio]);

  const handleCopyQRUrl = useCallback(() => {
    if (!comercio) return;

    const validationUrl = generateValidationUrl();
    navigator.clipboard.writeText(validationUrl);
    toast.success('URL de validación copiada al portapapeles');
  }, [comercio, generateValidationUrl]);

  const handlePrintQR = useCallback(() => {
    if (!comercio?.qrCode) {
      toast.error('No hay código QR para imprimir');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Código QR - ${comercio.nombreComercio}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .qr-container {
                max-width: 400px;
                margin: 0 auto;
                padding: 20px;
                border: 2px solid #e5e7eb;
                border-radius: 12px;
              }
              .qr-image {
                width: 200px;
                height: 200px;
                margin: 20px auto;
                display: block;
              }
              .instructions {
                margin-top: 20px;
                font-size: 14px;
                color: #6b7280;
              }
              @media print {
                body { margin: 0; }
                .qr-container { border: 1px solid #000; }
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <h2>${comercio.nombreComercio}</h2>
              <img src="${comercio.qrCode}" alt="QR Code" class="qr-image" />
              <div class="instructions">
                <p><strong>Instrucciones para socios:</strong></p>
                <p>1. Escanea este código QR con tu teléfono</p>
                <p>2. Inicia sesión en tu cuenta de socio</p>
                <p>3. Valida tu beneficio y disfrútalo</p>
                <p><strong>URL:</strong> ${generateValidationUrl()}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [comercio, generateValidationUrl]);

  // Show loading state while comercio data is being fetched
  if (!comercio && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del comercio...</p>
        </div>
      </div>
    );
  }

  // Show error state if comercio is not found
  if (!comercio && !loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">No se pudo cargar la información del comercio</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Código QR</h1>
          <p className="text-gray-600 mt-2">
            Administra tu código QR para validación de beneficios
          </p>
        </div>
        
        <button
          onClick={() => setShowCustomization(!showCustomization)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <Palette className="w-4 h-4 mr-2" />
          Personalizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Tu Código QR Actual
            </h3>
            
            {comercio?.qrCode ? (
              <div className="space-y-6">
                {/* QR Code Image - Using data URL to avoid CORS */}
                <div className="relative">
                  <Image
                    src={comercio.qrCode}
                    alt="QR Code"
                    width={192}
                    height={192}
                    className="w-48 h-48 mx-auto border border-gray-200 rounded-lg"
                    unoptimized // Important: prevents Next.js optimization that might cause CORS issues
                  />
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    <strong>Comercio:</strong> {comercio.nombreComercio}
                  </p>
                  <p>
                    <strong>URL de validación:</strong>
                  </p>
                  <div className="mt-2 p-2 bg-gray-100 rounded-lg font-mono text-xs break-all">
                    {generateValidationUrl()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadQR}
                    disabled={downloadLoading}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {downloadLoading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Descargar
                  </button>
                  
                  <button
                    onClick={handlePrintQR}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir
                  </button>
                  
                  <button
                    onClick={handleCopyQRUrl}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar URL
                  </button>
                  
                  <button
                    onClick={handleGenerateQR}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Regenerar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center mx-auto">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
                
                <div>
                  <p className="text-gray-600 mb-4">
                    Aún no tienes un código QR generado
                  </p>
                  
                  <button
                    onClick={handleGenerateQR}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4 mr-2" />
                        Generar Código QR
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Instructions and Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* How it Works */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Cómo funciona?
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Coloca el QR visible</p>
                  <p className="text-xs text-gray-600">Imprime y coloca el código QR en un lugar visible de tu comercio</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">El socio escanea</p>
                  <p className="text-xs text-gray-600">Los socios escanean el código con su teléfono</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Validación automática</p>
                  <p className="text-xs text-gray-600">El sistema valida automáticamente si el socio puede usar beneficios</p>
                </div>
              </div>
            </div>
          </div>

          {/* Best Practices */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4">
              Mejores Prácticas
            </h3>
            
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>Coloca el QR a la altura de los ojos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>Asegúrate de que haya buena iluminación</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>Mantén el código limpio y sin daños</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                <span>Incluye instrucciones claras para los socios</span>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Estadísticas de Uso
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {comercio?.validacionesRealizadas || 0}
                </p>
                <p className="text-xs text-gray-600">Validaciones totales</p>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {comercio?.clientesAtendidos || 0}
                </p>
                <p className="text-xs text-gray-600">Clientes únicos</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Customization Panel */}
      {showCustomization && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personalización del QR
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estilo del QR
              </label>
              <select
                value={qrStyle}
                onChange={(e) => setQrStyle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="default">Estándar</option>
                <option value="rounded">Esquinas redondeadas</option>
                <option value="dots">Puntos circulares</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color principal
              </label>
              <input
                type="color"
                defaultValue="#000000"
                className="w-full h-10 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaño
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="small">Pequeño (128px)</option>
                <option value="medium">Mediano (256px)</option>
                <option value="large">Grande (512px)</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={() => setShowCustomization(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerateQR}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Aplicar Cambios
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};