import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  QrCode,
  Download,
  Copy,
  Share2,
  Printer,
  Loader2,
  CheckCircle,
  ExternalLink,
  Zap
} from 'lucide-react';
import QRCodeLib from 'qrcode';
import Image from 'next/image';

interface QRGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  comercio: {
    id: string;
    nombreComercio: string;
    qrCode?: string;
    qrCodeUrl?: string;
  } | null;
  onGenerateQR: (comercioId: string) => Promise<{ qrCode: string; qrCodeUrl: string }>;
  loading: boolean;
}

export const QRGeneratorModal: React.FC<QRGeneratorModalProps> = ({
  open,
  onClose,
  comercio,
  onGenerateQR,
}) => {
  const [qrData, setQrData] = useState<{ qrCode: string; qrCodeUrl: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleGenerateQR = async () => {
    if (!comercio) return;

    setGenerating(true);
    try {
      const result = await onGenerateQR(comercio.id);
      setQrData(result);
      
      // Generate QR code on canvas for download
      if (canvasRef.current) {
        await QRCodeLib.toCanvas(canvasRef.current, result.qrCodeUrl, {
          width: 300,
          margin: 2,
          color: {
            dark: '#1e293b',
            light: '#ffffff'
          }
        });
      }
    } catch (error) {
      console.error('Error generating QR:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyUrl = async () => {
    if (qrData?.qrCodeUrl) {
      try {
        await navigator.clipboard.writeText(qrData.qrCodeUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `QR_${comercio?.nombreComercio}_${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handlePrint = () => {
    if (canvasRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const img = canvasRef.current.toDataURL();
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${comercio?.nombreComercio}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  display: flex; 
                  flex-direction: column; 
                  align-items: center; 
                  font-family: Arial, sans-serif; 
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 20px; 
                }
                .qr-container { 
                  text-align: center; 
                }
                img { 
                  max-width: 300px; 
                  height: auto; 
                }
                .footer { 
                  margin-top: 20px; 
                  text-align: center; 
                  color: #666; 
                  font-size: 12px; 
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>${comercio?.nombreComercio}</h2>
                <p>Código QR para validación de beneficios</p>
              </div>
              <div class="qr-container">
                <img src="${img}" alt="QR Code" />
              </div>
              <div class="footer">
                <p>Generado el ${new Date().toLocaleDateString()}</p>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleShare = async () => {
    if (qrData?.qrCodeUrl && navigator.share) {
      try {
        await navigator.share({
          title: `QR Code - ${comercio?.nombreComercio}`,
          text: 'Código QR para validación de beneficios',
          url: qrData.qrCodeUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!open || !comercio) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop with blur effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-md bg-white/30"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Código QR
                    </h2>
                    <p className="text-indigo-100">
                      {comercio.nombreComercio}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
            </div>

            {/* Content */}
            <div className="p-8">
              {!qrData && !comercio.qrCode ? (
                /* Generate QR Section */
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto">
                    <QrCode className="w-12 h-12 text-indigo-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Generar Código QR
                    </h3>
                    <p className="text-slate-600">
                      Crea un código QR único para que los socios puedan validar sus beneficios en este comercio.
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerateQR}
                    disabled={generating}
                    className="w-full px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Generando QR...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Generar Código QR</span>
                      </>
                    )}
                  </motion.button>
                </div>
              ) : (
                /* QR Display Section */
                <div className="space-y-6">
                  {/* QR Code Display */}
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-8 border border-slate-200 text-center">
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
                      <Image
                        src={qrData?.qrCode || comercio.qrCode || ''}
                        alt="QR Code"
                        width={192}
                        height={192}
                        className="w-48 h-48 mx-auto"
                        unoptimized
                      />
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm text-slate-600">
                        Código QR para validación de beneficios
                      </p>
                      {(qrData?.qrCodeUrl || comercio.qrCodeUrl) && (
                        <div className="mt-2 flex items-center justify-center space-x-2">
                          <ExternalLink className="w-4 h-4 text-slate-400" />
                          <span className="text-xs text-slate-500 font-mono truncate max-w-xs">
                            {qrData?.qrCodeUrl || comercio.qrCodeUrl}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDownload}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-all duration-200 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      <span>Descargar</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyUrl}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200 font-medium"
                    >
                      {copied ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar URL</span>
                        </>
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrint}
                      className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all duration-200 font-medium"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir</span>
                    </motion.button>

                    {typeof navigator.share === 'function' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleShare}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-all duration-200 font-medium"
                      >
                        <Share2 className="w-4 h-4" />
                        <span>Compartir</span>
                      </motion.button>
                    )}
                  </div>

                  {/* Regenerate Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateQR}
                    disabled={generating}
                    className="w-full px-6 py-3 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 font-medium border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Regenerando...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Regenerar QR</span>
                      </>
                    )}
                  </motion.button>
                </div>
              )}

              {/* Hidden canvas for download */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};