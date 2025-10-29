'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Paper,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  QrCode,
  Download,
  Visibility,
  Print,
  Share,
  Close,
  ContentCopy,
  CheckCircle,
  PictureAsPdf,
  Image as ImageIcon,
  Smartphone,
  Language,
  PlayArrow,
  Info,
} from '@mui/icons-material';
import Image from 'next/image';
import { useComercios } from '@/hooks/useComercios';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { getDynamicBaseUrl } from '@/lib/constants';

export const QRSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const {
    comerciosVinculados,
  } = useComercios();
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  // Select the first linked comercio as the active one (or adjust as needed)
  const comercio = comerciosVinculados && comerciosVinculados.length > 0 ? comerciosVinculados[0] : undefined;

  // Generate QR URLs based on comercio data - USA DETECCIÓN AUTOMÁTICA DEL DOMINIO
  const generateQRUrl = () => comercio ? `fidelya://${comercio.id}` : '';
  const generateWebUrl = () => comercio ? `${getDynamicBaseUrl()}/validar-beneficio?comercio=${comercio.id}` : '';
  
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [webQrDataUrl, setWebQrDataUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeQRType, setActiveQRType] = useState<'app' | 'web'>('app');
  const [qrGenerated, setQrGenerated] = useState(false);

  // Generate QR validation URLs
  const qrUrl = generateQRUrl(); // fidelya:// protocol for app scanning
  const webUrl = generateWebUrl(); // production URL for web access

  // ... rest of the component remains the same
  const generateQRCode = async (type: 'app' | 'web' | 'both' = 'both') => {
    try {
      setGenerating(true);
      
      if (type === 'app' || type === 'both') {
        // Generate QR for app scanning (fidelya:// protocol)
        const appQrDataUrl = await QRCode.toDataURL(qrUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setQrDataUrl(appQrDataUrl);
      }

      if (type === 'web' || type === 'both') {
        // Generate QR for web access (production URL) as fallback
        const webQrDataUrl = await QRCode.toDataURL(webUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setWebQrDataUrl(webQrDataUrl);
      }
      
      setQrGenerated(true);
      toast.success('Códigos QR generados correctamente');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Error al generar el código QR');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyUrl = async (urlType: 'app' | 'web' = 'web') => {
    try {
      const urlToCopy = urlType === 'app' ? qrUrl : webUrl;
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast.success(`URL ${urlType === 'app' ? 'de aplicación' : 'web'} copiada al portapapeles`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Error al copiar la URL');
    }
  };

  const handleDownloadQR = async (format: 'png' | 'pdf' = 'png', qrType: 'app' | 'web' = 'app') => {
    const dataUrl = qrType === 'app' ? qrDataUrl : webQrDataUrl;
    if (!dataUrl) {
      toast.error('Primero debes generar el código QR');
      return;
    }

    try {
      setDownloading(true);
      
      if (format === 'png') {
        // Download as PNG
        const link = document.createElement('a');
        link.download = `qr-${qrType}-${comercio?.nombreComercio || 'comercio'}.png`;
        link.href = dataUrl;
        link.click();
        toast.success(`QR ${qrType === 'app' ? 'de aplicación' : 'web'} descargado como imagen`);
      } else {
        // Generate PDF poster
        await generatePDFPoster(qrType);
      }
    } catch (error) {
      console.error('Error downloading QR:', error);
      toast.error('Error al descargar el QR');
    } finally {
      setDownloading(false);
    }
  };

  const generatePDFPoster = async (qrType: 'app' | 'web' = 'app') => {
    try {
      const dataUrl = qrType === 'app' ? qrDataUrl : webQrDataUrl;
      if (!dataUrl) return;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add title
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Código QR de Validación', pageWidth / 2, 30, { align: 'center' });

      // Add comercio name
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'normal');
      const comercioName = comercio?.nombreComercio || 'Mi Comercio';
      pdf.text(comercioName, pageWidth / 2, 45, { align: 'center' });

      // Add QR type indicator
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'italic');
      pdf.text(
        qrType === 'app' ? '(Para aplicación móvil)' : '(Para acceso web)', 
        pageWidth / 2, 55, 
        { align: 'center' }
      );

      // Add QR code
      const qrSize = 120;
      const qrX = (pageWidth - qrSize) / 2;
      const qrY = 70;
      pdf.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

      // Add instructions
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Instrucciones:', 20, 210);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const instructions = qrType === 'app' ? [
        '1. Los socios deben escanear este código con la aplicación Fidelitá',
        '2. El código está optimizado para la aplicación móvil',
        '3. Coloca este cartel en un lugar visible de tu comercio',
        '4. Mantén el cartel limpio y sin daños para mejor lectura'
      ] : [
        '1. Los socios pueden escanear este código con cualquier lector QR',
        '2. El código redirige a la página web de validación',
        '3. Funciona como respaldo si no tienen la aplicación',
        '4. Coloca este cartel en un lugar visible de tu comercio'
      ];

      instructions.forEach((instruction, index) => {
        pdf.text(instruction, 20, 225 + (index * 8));
      });

      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      pdf.text('Generado por Fidelitá', pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.text(new Date().toLocaleDateString(), pageWidth / 2, pageHeight - 5, { align: 'center' });

      // Save PDF
      pdf.save(`cartel-qr-${qrType}-${comercio?.nombreComercio || 'comercio'}.pdf`);
      toast.success(`Cartel PDF ${qrType === 'app' ? 'de aplicación' : 'web'} descargado correctamente`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error al generar el cartel PDF');
    }
  };

  const handlePrintQR = (qrType: 'app' | 'web' = 'app') => {
    const dataUrl = qrType === 'app' ? qrDataUrl : webQrDataUrl;
    if (!dataUrl) {
      toast.error('Primero debes generar el código QR');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR ${qrType === 'app' ? 'Aplicación' : 'Web'} - ${comercio?.nombreComercio || 'Comercio'}</title>
            <style>
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .header { 
                margin-bottom: 30px; 
              }
              .title { 
                font-size: 24px; 
                font-weight: bold; 
                margin-bottom: 10px; 
              }
              .subtitle { 
                font-size: 18px; 
                color: #666; 
                margin-bottom: 10px; 
              }
              .qr-type { 
                font-size: 14px; 
                color: #888; 
                font-style: italic;
                margin-bottom: 30px; 
              }
              .qr-container { 
                margin: 30px 0; 
              }
              .qr-image { 
                max-width: 300px; 
                height: auto; 
              }
              .instructions { 
                text-align: left; 
                max-width: 500px; 
                margin: 30px auto; 
              }
              .instructions h3 { 
                font-size: 16px; 
                margin-bottom: 15px; 
              }
              .instructions ol { 
                padding-left: 20px; 
              }
              .instructions li { 
                margin-bottom: 8px; 
                font-size: 14px; 
              }
              .footer { 
                margin-top: 40px; 
                font-size: 12px; 
                color: #999; 
              }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">Código QR de Validación</div>
              <div class="subtitle">${comercio?.nombreComercio || 'Mi Comercio'}</div>
              <div class="qr-type">${qrType === 'app' ? '(Para aplicación móvil)' : '(Para acceso web)'}</div>
            </div>
            
            <div class="qr-container">
              <img src="${dataUrl}" alt="Código QR" class="qr-image" />
            </div>
            
            <div class="instructions">
              <h3>Instrucciones de Uso:</h3>
              <ol>
                ${qrType === 'app' ? `
                  <li>Los socios deben escanear este código con la aplicación Fidelitá</li>
                  <li>El código está optimizado para la aplicación móvil</li>
                  <li>Coloca este cartel en un lugar visible de tu comercio</li>
                  <li>Mantén el cartel limpio y sin daños para mejor lectura</li>
                ` : `
                  <li>Los socios pueden escanear este código con cualquier lector QR</li>
                  <li>El código redirige a la página web de validación</li>
                  <li>Funciona como respaldo si no tienen la aplicación</li>
                  <li>Coloca este cartel en un lugar visible de tu comercio</li>
                `}
              </ol>
            </div>
            
            <div class="footer">
              Generado por Fidelitá - ${new Date().toLocaleDateString()}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShareQR = async (qrType: 'app' | 'web' = 'app') => {
    const dataUrl = qrType === 'app' ? qrDataUrl : webQrDataUrl;
    const urlToShare = qrType === 'app' ? qrUrl : webUrl;
    
    if (!dataUrl) {
      toast.error('Primero debes generar el código QR');
      return;
    }
    
    if (navigator.share && dataUrl) {
      try {
        // Convert data URL to blob for sharing
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const file = new File([blob], `qr-${qrType}-${comercio?.nombreComercio || 'comercio'}.png`, { type: 'image/png' });

        await navigator.share({
          title: `QR ${qrType === 'app' ? 'de Aplicación' : 'Web'} de ${comercio?.nombreComercio || 'Mi Comercio'}`,
          text: `Escanea este QR para validar beneficios en Fidelitá ${qrType === 'app' ? '(Aplicación)' : '(Web)'}`,
          files: [file],
        });
      } catch {
        // Fallback to URL sharing
        if (navigator.share) {
          try {
            await navigator.share({
              title: `QR ${qrType === 'app' ? 'de Aplicación' : 'Web'} de ${comercio?.nombreComercio || 'Mi Comercio'}`,
              text: `Escanea este QR para validar beneficios en Fidelitá ${qrType === 'app' ? '(Aplicación)' : '(Web)'}`,
              url: urlToShare,
            });
          } catch {
            handleCopyUrl(qrType);
          }
        } else {
          handleCopyUrl(qrType);
        }
      }
    } else {
      handleCopyUrl(qrType);
    }
  };

  const getCurrentQRData = () => {
    return activeQRType === 'app' ? qrDataUrl : webQrDataUrl;
  };

  const getCurrentUrl = () => {
    return activeQRType === 'app' ? qrUrl : webUrl;
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Animated background */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: { xs: 120, md: 180 },
            height: { xs: 120, md: 180 },
            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
            borderRadius: '50%',
            opacity: 0.05,
            transform: 'translate(50%, 50%)',
          }}
        />

        <CardContent sx={{ p: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <Box sx={{ mb: { xs: 4, md: 6 } }}>
            <Typography 
              variant={isMobile ? "h5" : "h4"}
              sx={{ 
                fontWeight: 900, 
                color: '#0f172a',
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              <QrCode sx={{ fontSize: { xs: 28, md: 32 }, color: '#ec4899' }} />
              Códigos QR de Validación
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b', 
                fontWeight: 500,
                textAlign: { xs: 'center', sm: 'left' },
                maxWidth: { xs: '100%', md: '80%' }
              }}
            >
              Genera códigos QR para que los socios validen sus beneficios. Disponible en dos formatos: aplicación móvil y acceso web.
            </Typography>
          </Box>

          {!qrGenerated ? (
            /* Initial State - Generate QR */
            <Box sx={{ textAlign: 'center', py: { xs: 4, md: 8 } }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Box
                  sx={{
                    width: { xs: 150, md: 200 },
                    height: { xs: 150, md: 200 },
                    bgcolor: alpha('#ec4899', 0.1),
                    border: '3px dashed #ec4899',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 4,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <QrCode sx={{ fontSize: { xs: 60, md: 80 }, color: '#ec4899', opacity: 0.7 }} />
                </Box>

                <Typography 
                  variant={isMobile ? "h6" : "h5"}
                  sx={{ fontWeight: 700, color: '#374151', mb: 2 }}
                >
                  Generar Códigos QR
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#64748b', 
                    mb: 4,
                    maxWidth: { xs: '100%', md: 500 },
                    mx: 'auto'
                  }}
                >
                  Crea tus códigos QR personalizados para que los socios puedan validar sus beneficios de forma rápida y segura.
                </Typography>

                <Button
                  variant="contained"
                  size={isMobile ? "medium" : "large"}
                  startIcon={generating ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={() => generateQRCode()}
                  disabled={generating}
                  sx={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.3)',
                    px: { xs: 3, md: 4 },
                    py: { xs: 1.5, md: 2 },
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    '&:hover': {
                      background: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)',
                      boxShadow: '0 6px 25px rgba(236, 72, 153, 0.4)',
                    },
                    '&:disabled': {
                      background: '#e2e8f0',
                      color: '#94a3b8',
                      boxShadow: 'none',
                    }
                  }}
                >
                  {generating ? 'Generando...' : 'Generar Códigos QR'}
                </Button>

                {/* Info Cards - Replaced Grid with Stack */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  sx={{ 
                    mt: 4, 
                    maxWidth: 600, 
                    mx: 'auto',
                    alignItems: 'stretch'
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      border: '1px solid #e2e8f0',
                      borderRadius: 3,
                      textAlign: 'center',
                      flex: 1,
                    }}
                  >
                    <Smartphone sx={{ fontSize: 32, color: '#6366f1', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                      QR Aplicación
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Optimizado para la app móvil Fidelitá
                    </Typography>
                  </Paper>
                  
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      border: '1px solid #e2e8f0',
                      borderRadius: 3,
                      textAlign: 'center',
                      flex: 1,
                    }}
                  >
                    <Language sx={{ fontSize: 32, color: '#10b981', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                      QR Web
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      Compatible con cualquier lector QR
                    </Typography>
                  </Paper>
                </Stack>
              </motion.div>
            </Box>
          ) : (
            /* Generated State - Show QR Codes */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* QR Type Selector */}
              <Box sx={{ mb: 4 }}>
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={2} 
                  justifyContent="center"
                  alignItems="center"
                >
                  <Button
                    variant={activeQRType === 'app' ? 'contained' : 'outlined'}
                    startIcon={<Smartphone />}
                    onClick={() => setActiveQRType('app')}
                    sx={{
                      minWidth: { xs: '100%', sm: 200 },
                      ...(activeQRType === 'app' && {
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
                        }
                      })
                    }}
                  >
                    QR Aplicación
                  </Button>
                  <Button
                    variant={activeQRType === 'web' ? 'contained' : 'outlined'}
                    startIcon={<Language />}
                    onClick={() => setActiveQRType('web')}
                    sx={{
                      minWidth: { xs: '100%', sm: 200 },
                      ...(activeQRType === 'web' && {
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
                        }
                      })
                    }}
                  >
                    QR Web
                  </Button>
                </Stack>
              </Box>

              {/* Main Content - Replaced Grid with Stack */}
              <Stack 
                direction={{ xs: 'column', lg: 'row' }} 
                spacing={{ xs: 3, md: 6 }} 
                alignItems="flex-start"
              >
                {/* QR Preview */}
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 4 },
                      border: '2px solid #f1f5f9',
                      borderRadius: 4,
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, #fafbfc 0%, #ffffff 100%)',
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Box
                        sx={{
                          width: { xs: 180, md: 220 },
                          height: { xs: 180, md: 220 },
                          bgcolor: '#ffffff',
                          border: '3px solid #e2e8f0',
                          borderRadius: 3,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 3,
                          position: 'relative',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            borderColor: activeQRType === 'app' ? '#6366f1' : '#10b981',
                            boxShadow: `0 8px 32px ${alpha(activeQRType === 'app' ? '#6366f1' : '#10b981', 0.2)}`,
                          }
                        }}
                        onClick={() => setQrDialogOpen(true)}
                      >
                        {getCurrentQRData() ? (
                          <Image
                            src={getCurrentQRData()}
                            alt="Código QR"
                            width={isMobile ? 160 : 200}
                            height={isMobile ? 160 : 200}
                            style={{
                              width: '90%',
                              height: '90%',
                              objectFit: 'contain'
                            }}
                            unoptimized
                            priority
                          />
                        ) : (
                          <QrCode sx={{ fontSize: { xs: 50, md: 60 }, color: '#9ca3af', opacity: 0.5 }} />
                        )}
                        
                        {/* Hover overlay */}
                        {getCurrentQRData() && (
                          <Box
                            sx={{
                              position: 'absolute',
                              inset: 0,
                              bgcolor: alpha(activeQRType === 'app' ? '#6366f1' : '#10b981', 0.1),
                              borderRadius: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              opacity: 0,
                              transition: 'opacity 0.3s ease',
                              '&:hover': { opacity: 1 },
                            }}
                          >
                            <Visibility sx={{ fontSize: { xs: 24, md: 30 }, color: activeQRType === 'app' ? '#6366f1' : '#10b981' }} />
                          </Box>
                        )}
                      </Box>
                    </motion.div>

                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                      QR {activeQRType === 'app' ? 'de Aplicación' : 'Web'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
                      {activeQRType === 'app' 
                        ? 'Optimizado para la aplicación móvil Fidelitá'
                        : 'Compatible con cualquier lector QR, redirige a la página de validación web'
                      }
                    </Typography>

                    <Stack 
                      direction="row" 
                      spacing={1} 
                      justifyContent="center" 
                      flexWrap="wrap"
                      sx={{ gap: 1 }}
                    >
                      <Tooltip title="Ver QR completo">
                        <IconButton
                          onClick={() => setQrDialogOpen(true)}
                          disabled={!getCurrentQRData()}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            bgcolor: alpha('#ec4899', 0.1),
                            color: '#ec4899',
                            '&:hover': {
                              bgcolor: alpha('#ec4899', 0.2),
                            },
                            '&:disabled': {
                              bgcolor: alpha('#9ca3af', 0.1),
                              color: '#9ca3af',
                            }
                          }}
                        >
                          <Visibility fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Compartir QR">
                        <IconButton
                          onClick={() => handleShareQR(activeQRType)}
                          disabled={!getCurrentQRData()}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            bgcolor: alpha('#06b6d4', 0.1),
                            color: '#06b6d4',
                            '&:hover': {
                              bgcolor: alpha('#06b6d4', 0.2),
                            },
                            '&:disabled': {
                              bgcolor: alpha('#9ca3af', 0.1),
                              color: '#9ca3af',
                            }
                          }}
                        >
                          <Share fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Imprimir QR">
                        <IconButton
                          onClick={() => handlePrintQR(activeQRType)}
                          disabled={!getCurrentQRData()}
                          size={isMobile ? "small" : "medium"}
                          sx={{
                            bgcolor: alpha('#10b981', 0.1),
                            color: '#10b981',
                            '&:hover': {
                              bgcolor: alpha('#10b981', 0.2),
                            },
                            '&:disabled': {
                              bgcolor: alpha('#9ca3af', 0.1),
                              color: '#9ca3af',
                            }
                          }}
                        >
                          <Print fontSize={isMobile ? "small" : "medium"} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                </Box>

                {/* Actions and Info */}
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Stack spacing={3}>
                    {/* URL Info */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 3, md: 4 },
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                        bgcolor: alpha('#f8fafc', 0.5),
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
                        URL de Validación {activeQRType === 'app' ? '(Aplicación)' : '(Web)'}
                      </Typography>
                      
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: '#f1f5f9',
                          borderRadius: 2,
                          border: '1px solid #e2e8f0',
                          mb: 3,
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: '#475569',
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                            fontSize: { xs: '0.75rem', md: '0.85rem' },
                          }}
                        >
                          {getCurrentUrl()}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        startIcon={copied ? <CheckCircle /> : <ContentCopy />}
                        onClick={() => handleCopyUrl(activeQRType)}
                        fullWidth
                        size={isMobile ? "medium" : "large"}
                        sx={{
                          borderColor: copied ? '#10b981' : '#d1d5db',
                          color: copied ? '#10b981' : '#6b7280',
                          '&:hover': {
                            borderColor: copied ? '#10b981' : '#9ca3af',
                            bgcolor: copied ? alpha('#10b981', 0.1) : alpha('#6b7280', 0.1),
                          }
                        }}
                      >
                        {copied ? 'Copiado!' : 'Copiar URL'}
                      </Button>
                    </Paper>

                    {/* Download Actions */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 3, md: 4 },
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 3 }}>
                        Descargas
                      </Typography>
                      
                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={downloading ? <CircularProgress size={16} /> : <PictureAsPdf />}
                          onClick={() => handleDownloadQR('pdf', activeQRType)}
                          disabled={!getCurrentQRData() || downloading}
                          fullWidth
                          size={isMobile ? "medium" : "large"}
                          sx={{
                            background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                            boxShadow: '0 4px 20px rgba(236, 72, 153, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)',
                              boxShadow: '0 6px 25px rgba(236, 72, 153, 0.4)',
                            },
                            '&:disabled': {
                              background: '#e2e8f0',
                              color: '#94a3b8',
                              boxShadow: 'none',
                            }
                          }}
                        >
                          {downloading ? 'Generando...' : `Descargar Cartel PDF`}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          startIcon={<ImageIcon />}
                          onClick={() => handleDownloadQR('png', activeQRType)}
                          disabled={!getCurrentQRData()}
                          fullWidth
                          size={isMobile ? "medium" : "large"}
                          sx={{
                            borderColor: '#d1d5db',
                            color: '#6b7280',
                            '&:hover': {
                              borderColor: '#9ca3af',
                              bgcolor: alpha('#6b7280', 0.1),
                            },
                            '&:disabled': {
                              borderColor: '#e2e8f0',
                              color: '#94a3b8',
                            }
                          }}
                        >
                          Descargar QR PNG
                        </Button>
                      </Stack>
                    </Paper>

                    {/* Status */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: { xs: 3, md: 4 },
                        border: '1px solid #e2e8f0',
                        borderRadius: 3,
                        bgcolor: alpha('#10b981', 0.05),
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <CheckCircle sx={{ color: '#10b981', fontSize: 24 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                          QR Activo
                        </Typography>
                      </Stack>
                      
                      <Typography variant="body2" sx={{ color: '#047857', mb: 3 }}>
                        Tus códigos QR están funcionando correctamente y listos para recibir validaciones.
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                        <Chip
                          label="Comercio Verificado"
                          size="small"
                          sx={{
                            bgcolor: alpha('#10b981', 0.2),
                            color: '#047857',
                            fontWeight: 600,
                          }}
                        />
                        <Chip
                          label="QR Válido"
                          size="small"
                          sx={{
                            bgcolor: alpha('#06b6d4', 0.2),
                            color: '#0891b2',
                            fontWeight: 600,
                          }}
                        />
                        {comercio?.visible && (
                          <Chip
                            label="Visible para Socios"
                            size="small"
                            sx={{
                              bgcolor: alpha('#8b5cf6', 0.2),
                              color: '#7c3aed',
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Stack>
                    </Paper>

                    {/* Regenerate Button */}
                    <Button
                      variant="outlined"
                      startIcon={<QrCode />}
                      onClick={() => {
                        setQrGenerated(false);
                        setQrDataUrl('');
                        setWebQrDataUrl('');
                      }}
                      fullWidth
                      sx={{
                        borderColor: '#d1d5db',
                        color: '#6b7280',
                        '&:hover': {
                          borderColor: '#9ca3af',
                          bgcolor: alpha('#6b7280', 0.1),
                        }
                      }}
                    >
                      Regenerar Códigos QR
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </motion.div>
          )}

          {/* Instructions */}
          <Box sx={{ mt: { xs: 4, md: 6 } }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                bgcolor: alpha('#6366f1', 0.05),
                border: '1px solid',
                borderColor: alpha('#6366f1', 0.2),
                borderRadius: 3,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Info sx={{ color: '#5b21b6', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#5b21b6' }}>
                  Instrucciones de Uso
                </Typography>
              </Stack>
              
              {/* Instructions Content - Replaced Grid with Stack */}
              <Stack 
                direction={{ xs: 'column', md: 'row' }} 
                spacing={2} 
                sx={{ mb: 2 }}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#4c1d95', mb: 1 }}>
                    <strong>QR de Aplicación:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4c1d95', mb: 2 }}>
                    Optimizado para socios que usan la app móvil Fidelitá
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#4c1d95', mb: 1 }}>
                    <strong>QR Web:</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4c1d95', mb: 2 }}>
                    Compatible con cualquier lector QR, redirige a la página web
                  </Typography>
                </Box>
              </Stack>
              
              <Stack spacing={1} sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#4c1d95' }}>
                  1. <strong>Genera</strong> tus códigos QR usando el botón correspondiente
                </Typography>
                <Typography variant="body2" sx={{ color: '#4c1d95' }}>
                  2. <strong>Descarga</strong> el cartel en formato PDF o imagen PNG
                </Typography>
                <Typography variant="body2" sx={{ color: '#4c1d95' }}>
                  3. <strong>Coloca</strong> el cartel en un lugar visible de tu comercio
                </Typography>
                <Typography variant="body2" sx={{ color: '#4c1d95' }}>
                  4. <strong>Los socios</strong> escanearán el QR para validar beneficios automáticamente
                </Typography>
              </Stack>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* QR Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            m: { xs: 2, sm: 4 },
            maxHeight: { xs: '90vh', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <QrCode sx={{ color: '#ec4899', fontSize: 28 }} />
              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: '#0f172a' }}>
                Código QR {activeQRType === 'app' ? 'de Aplicación' : 'Web'}
              </Typography>
            </Box>
            <IconButton onClick={() => setQrDialogOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', py: { xs: 2, md: 4 } }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                width: { xs: 250, md: 300 },
                height: { xs: 250, md: 300 },
                bgcolor: '#ffffff',
                border: '4px solid #e2e8f0',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 4,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              }}
            >
              {getCurrentQRData() ? (
                <Image
                  src={getCurrentQRData()}
                  alt="Código QR"
                  width={isMobile ? 220 : 270}
                  height={isMobile ? 220 : 270}
                  style={{
                    width: '90%',
                    height: '90%',
                    objectFit: 'contain'
                  }}
                  unoptimized
                  priority
                />
              ) : (
                <CircularProgress sx={{ color: '#ec4899' }} />
              )}
            </Box>
          </motion.div>

          <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
            {comercio?.nombreComercio || 'Mi Comercio'}
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 1 }}>
            {activeQRType === 'app' ? 'Para aplicación móvil' : 'Para acceso web'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 4 }}>
            Escanea este código para validar beneficios
          </Typography>

          <Box
            sx={{
              p: { xs: 2, md: 3 },
              bgcolor: '#f8fafc',
              borderRadius: 3,
              border: '1px solid #e2e8f0',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{
                color: '#475569',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                fontSize: { xs: '0.75rem', md: '0.8rem' },
              }}
            >
              {getCurrentUrl()}
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            width="100%"
            sx={{ gap: 2 }}
          >
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={() => handleShareQR(activeQRType)}
              disabled={!getCurrentQRData()}
              sx={{ 
                flex: 1,
                minWidth: { xs: '100%', sm: 'auto' }
              }}
            >
              Compartir
            </Button>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={16} /> : <Download />}
              onClick={() => handleDownloadQR('pdf', activeQRType)}
              disabled={!getCurrentQRData() || downloading}
              sx={{
                flex: 1,
                minWidth: { xs: '100%', sm: 'auto' },
                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #be185d 0%, #9d174d 100%)',
                },
                '&:disabled': {
                  background: '#e2e8f0',
                  color: '#94a3b8',
                }
              }}
            >
              {downloading ? 'Generando...' : 'Descargar'}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
};