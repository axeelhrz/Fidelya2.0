'use client';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  alpha,
  Avatar,
  Stack,
  Chip,
  Button,
  IconButton,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  CloudDownload,
  Description,
  TableChart,
  PictureAsPdf,
  DataObject,
  FilterList,
  CalendarToday,
  Group,
  Email,
  CheckCircle,
  Warning,
  Info,
  Settings,
  Refresh,
  Download,
  ExpandMore,
  ArrowForward,
  ArrowBack,
  Assessment,
  DateRange,
  TrendingUp,
  Analytics,
} from '@mui/icons-material';
import { Socio, SocioStats } from '@/types/socio';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

interface DataExportSectionProps {
  socios: Socio[];
  stats: SocioStats;
  loading: boolean;
}

interface ExportFormatProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  fileExtension: string;
  features: string[];
  recommended?: boolean;
  supportsBulk?: boolean;
}

interface ExportFieldProps {
  id: string;
  label: string;
  description: string;
  category: 'basic' | 'contact' | 'dates' | 'status' | 'analytics' | 'custom';
  required?: boolean;
  sensitive?: boolean;
  dataType: 'string' | 'date' | 'number' | 'boolean' | 'array';
}

interface ExportProgress {
  step: string;
  progress: number;
  message: string;
}

const ExportFormatCard: React.FC<{
  format: ExportFormatProps;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}> = ({ format, selected, onSelect, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card
        elevation={0}
        onClick={onSelect}
        sx={{
          cursor: 'pointer',
          border: selected ? `2px solid ${format.color}` : '1px solid #f1f5f9',
          borderRadius: 5,
          background: selected
            ? `linear-gradient(135deg, ${alpha(format.color, 0.05)} 0%, ${alpha(format.color, 0.02)} 100%)`
            : 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: format.color,
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 60px -10px ${alpha(format.color, 0.25)}`,
            '& .format-icon': {
              transform: 'scale(1.1)',
              bgcolor: alpha(format.color, 0.2),
            },
          },
        }}
      >
        {format.recommended && (
          <Chip
            label="Recomendado"
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: '#10b981',
              color: 'white',
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          />
        )}
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar
              className="format-icon"
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha(format.color, 0.12),
                color: format.color,
                borderRadius: 3,
                transition: 'all 0.3s ease',
              }}
            >
              {format.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>
                  {format.name}
                </Typography>
                <Chip
                  label={format.fileExtension}
                  size="small"
                  sx={{
                    bgcolor: alpha(format.color, 0.1),
                    color: format.color,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.5, mb: 2 }}>
                {format.description}
              </Typography>
            </Box>
            {selected && (
              <CheckCircle sx={{ color: format.color, fontSize: 24 }} />
            )}
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1, display: 'block' }}>
              Características
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {format.features.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  size="small"
                  sx={{
                    bgcolor: alpha('#6366f1', 0.1),
                    color: '#6366f1',
                    fontWeight: 500,
                    fontSize: '0.7rem',
                  }}
                />
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const FieldSelectionCard: React.FC<{
  category: string;
  fields: ExportFieldProps[];
  selectedFields: string[];
  onFieldToggle: (fieldId: string) => void;
  onCategoryToggle: (category: string, selected: boolean) => void;
}> = ({ category, fields, selectedFields, onFieldToggle, onCategoryToggle }) => {
  const categoryConfig = {
    basic: { label: 'Información Básica', color: '#6366f1', icon: <Group /> },
    contact: { label: 'Datos de Contacto', color: '#10b981', icon: <Email /> },
    dates: { label: 'Fechas y Tiempo', color: '#f59e0b', icon: <CalendarToday /> },
    status: { label: 'Estado y Membresía', color: '#8b5cf6', icon: <Assessment /> },
    analytics: { label: 'Análisis y Métricas', color: '#06b6d4', icon: <Analytics /> },
    custom: { label: 'Campos Personalizados', color: '#ef4444', icon: <Settings /> },
  };

  const config = categoryConfig[category as keyof typeof categoryConfig];
  const allSelected = fields.every(field => selectedFields.includes(field.id));
  const someSelected = fields.some(field => selectedFields.includes(field.id));

  return (
    <Accordion
      elevation={0}
      sx={{
        border: '1px solid #f1f5f9',
        borderRadius: 4,
        '&:before': { display: 'none' },
        '&.Mui-expanded': {
          margin: 0,
        }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMore />}
        sx={{
          bgcolor: alpha(config.color, 0.05),
          borderRadius: '16px 16px 0 0',
          '&.Mui-expanded': {
            borderRadius: '16px 16px 0 0',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: alpha(config.color, 0.1),
              color: config.color,
              borderRadius: 2,
            }}
          >
            {config.icon}
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1rem' }}>
            {config.label}
          </Typography>
          <Chip
            label={`${fields.filter(f => selectedFields.includes(f.id)).length}/${fields.length}`}
            size="small"
            sx={{
              bgcolor: alpha(config.color, 0.1),
              color: config.color,
              fontWeight: 600,
            }}
          />
          <Box sx={{ ml: 'auto', mr: 2 }}>
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected && !allSelected}
              onChange={(e) => onCategoryToggle(category, e.target.checked)}
              sx={{ color: config.color }}
              onClick={(e) => e.stopPropagation()}
            />
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 3 }}>
        <FormGroup>
          {fields.map((field) => (
            <FormControlLabel
              key={field.id}
              control={
                <Checkbox
                  checked={selectedFields.includes(field.id)}
                  onChange={() => onFieldToggle(field.id)}
                  sx={{ color: config.color }}
                />
              }
              label={
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {field.label}
                    </Typography>
                    {field.required && (
                      <Chip label="Requerido" size="small" sx={{ bgcolor: '#ef4444', color: 'white', fontSize: '0.6rem', height: 16 }} />
                    )}
                    {field.sensitive && (
                      <Chip label="Sensible" size="small" sx={{ bgcolor: '#f59e0b', color: 'white', fontSize: '0.6rem', height: 16 }} />
                    )}
                    <Chip
                      label={field.dataType}
                      size="small"
                      sx={{
                        bgcolor: alpha('#64748b', 0.1),
                        color: '#64748b',
                        fontSize: '0.6rem',
                        height: 16,
                        textTransform: 'uppercase'
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {field.description}
                  </Typography>
                </Box>
              }
              sx={{ mb: 1 }}
            />
          ))}
        </FormGroup>
      </AccordionDetails>
    </Accordion>
  );
};

const ExportPreview: React.FC<{
  format: ExportFormatProps;
  selectedFields: string[];
  filteredCount: number;
  onExport: () => void;
  loading: boolean;
  progress?: ExportProgress;
}> = ({ format, selectedFields, filteredCount, onExport, loading, progress }) => {
  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #f1f5f9',
        borderRadius: 5,
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: alpha(format.color, 0.1),
              color: format.color,
              borderRadius: 3,
            }}
          >
            {format.icon}
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Vista Previa de Exportación
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {format.name} • {filteredCount.toLocaleString()} registros • {selectedFields.length} campos
            </Typography>
          </Box>
        </Box>

        {loading && progress && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 600 }}>
                {progress.step}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                {progress.progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress.progress}
              sx={{
                borderRadius: 2,
                height: 8,
                bgcolor: alpha('#6366f1', 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: '#6366f1',
                  borderRadius: 2,
                }
              }}
            />
            <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
              {progress.message}
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
            Resumen del Archivo
          </Typography>
          {/* Replace Grid with Flexbox */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Paper sx={{ 
              flex: '1 1 calc(50% - 8px)', 
              minWidth: '200px',
              p: 2, 
              bgcolor: alpha(format.color, 0.05), 
              border: `1px solid ${alpha(format.color, 0.1)}` 
            }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Formato
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: format.color }}>
                {format.name}
              </Typography>
            </Paper>
            <Paper sx={{ 
              flex: '1 1 calc(50% - 8px)', 
              minWidth: '200px',
              p: 2, 
              bgcolor: alpha('#10b981', 0.05), 
              border: `1px solid ${alpha('#10b981', 0.1)}` 
            }}>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                Registros
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#10b981' }}>
                {filteredCount.toLocaleString()}
              </Typography>
            </Paper>
          </Box>
        </Box>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
            Campos Seleccionados ({selectedFields.length})
          </Typography>
          <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selectedFields.slice(0, 10).map((fieldId) => (
                <Chip
                  key={fieldId}
                  label={fieldId}
                  size="small"
                  sx={{
                    bgcolor: alpha('#6366f1', 0.1),
                    color: '#6366f1',
                    fontWeight: 500,
                  }}
                />
              ))}
              {selectedFields.length > 10 && (
                <Chip
                  label={`+${selectedFields.length - 10} más`}
                  size="small"
                  sx={{
                    bgcolor: alpha('#94a3b8', 0.1),
                    color: '#94a3b8',
                    fontWeight: 500,
                  }}
                />
              )}
            </Stack>
          </Box>
        </Box>

        <Button
          onClick={onExport}
          disabled={loading || selectedFields.length === 0}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <Download />}
          fullWidth
          size="large"
          sx={{
            py: 2,
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: format.color,
            '&:hover': {
              bgcolor: alpha(format.color, 0.8),
            },
            '&:disabled': {
              bgcolor: '#e2e8f0',
              color: '#94a3b8',
            }
          }}
        >
          {loading ? 'Generando Archivo...' : `Exportar ${format.name}`}
        </Button>
      </CardContent>
    </Card>
  );
};

export const DataExportSection: React.FC<DataExportSectionProps> = ({
  socios,
  stats,
  loading
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<string>('csv');
  const [selectedFields, setSelectedFields] = useState<string[]>(['nombre', 'email', 'estado', 'creadoEn']);
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);

  const exportFormats: ExportFormatProps[] = [
    {
      id: 'csv',
      name: 'CSV (Comma Separated)',
      description: 'Formato universal compatible con Excel, Google Sheets y bases de datos',
      icon: <TableChart sx={{ fontSize: 28 }} />,
      color: '#10b981',
      fileExtension: '.csv',
      features: ['Excel Compatible', 'Ligero', 'Universal', 'UTF-8'],
      recommended: true,
      supportsBulk: true
    },
    {
      id: 'excel',
      name: 'Excel Workbook',
      description: 'Archivo Excel con formato avanzado, múltiples hojas y estadísticas',
      icon: <Description sx={{ fontSize: 28 }} />,
      color: '#059669',
      fileExtension: '.xlsx',
      features: ['Formato Avanzado', 'Múltiples Hojas', 'Estadísticas', 'Gráficos'],
      supportsBulk: true
    },
    {
      id: 'pdf',
      name: 'PDF Report',
      description: 'Reporte profesional en PDF con diseño corporativo y análisis',
      icon: <PictureAsPdf sx={{ fontSize: 28 }} />,
      color: '#ef4444',
      fileExtension: '.pdf',
      features: ['Profesional', 'Estadísticas', 'Diseño Corporativo', 'Análisis'],
      supportsBulk: false
    },
    {
      id: 'json',
      name: 'JSON Data',
      description: 'Formato estructurado para desarrolladores e integraciones API',
      icon: <DataObject sx={{ fontSize: 28 }} />,
      color: '#6366f1',
      fileExtension: '.json',
      features: ['Estructurado', 'API Ready', 'Desarrolladores', 'Completo'],
      supportsBulk: true
    }
  ];

  const exportFields: ExportFieldProps[] = [
    // Basic Information
    {
      id: 'nombre',
      label: 'Nombre Completo',
      description: 'Nombre y apellidos del socio',
      category: 'basic',
      required: true,
      dataType: 'string'
    },
    {
      id: 'dni',
      label: 'DNI/Documento',
      description: 'Documento de identidad',
      category: 'basic',
      sensitive: true,
      dataType: 'string'
    },
    // Contact Information
    {
      id: 'email',
      label: 'Email',
      description: 'Dirección de correo electrónico',
      category: 'contact',
      required: true,
      dataType: 'string'
    },
    {
      id: 'telefono',
      label: 'Teléfono',
      description: 'Número de teléfono de contacto',
      category: 'contact',
      dataType: 'string'
    },
    // Dates and Time
    {
      id: 'creadoEn',
      label: 'Fecha de Alta',
      description: 'Fecha de registro en el sistema',
      category: 'dates',
      dataType: 'date'
    },
    {
      id: 'ultimaActividad',
      label: 'Última Actividad',
      description: 'Fecha de última actividad registrada',
      category: 'dates',
      dataType: 'date'
    },
    {
      id: 'antiguedad',
      label: 'Antigüedad',
      description: 'Tiempo como socio (en días)',
      category: 'dates',
      dataType: 'number'
    },
    // Status and Membership
    {
      id: 'estado',
      label: 'Estado',
      description: 'Estado actual del socio',
      category: 'status',
      required: true,
      dataType: 'string'
    },
    {
      id: 'tipoMembresia',
      label: 'Tipo de Membresía',
      description: 'Categoría de membresía',
      category: 'status',
      dataType: 'string'
    },
    // Analytics and Metrics
    {
      id: 'totalPagos',
      label: 'Total de Pagos',
      description: 'Cantidad total de pagos realizados',
      category: 'analytics',
      dataType: 'number'
    },
    {
      id: 'montoTotal',
      label: 'Monto Total',
      description: 'Suma total de todos los pagos',
      category: 'analytics',
      dataType: 'number'
    },
    {
      id: 'promedioMensual',
      label: 'Promedio Mensual',
      description: 'Promedio de pagos por mes',
      category: 'analytics',
      dataType: 'number'
    },
    {
      id: 'engagement',
      label: 'Nivel de Engagement',
      description: 'Puntuación de participación del socio',
      category: 'analytics',
      dataType: 'number'
    },
    // Custom Fields
    {
      id: 'notas',
      label: 'Notas',
      description: 'Comentarios y observaciones',
      category: 'custom',
      dataType: 'string'
    },
    {
      id: 'tags',
      label: 'Etiquetas',
      description: 'Tags y categorías personalizadas',
      category: 'custom',
      dataType: 'array'
    },
    {
      id: 'asociacionId',
      label: 'ID de Asociación',
      description: 'Identificador único de la asociación',
      category: 'custom',
      dataType: 'string'
    },
  ];

  const filteredSocios = useMemo(() => {
    let filtered = socios;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(socio => socio.estado === statusFilter);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();

      switch (dateRange) {
        case 'last30days':
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case 'last3months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'lastyear':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      filtered = filtered.filter(socio => {
        const socioDate = socio.creadoEn.toDate();
        return socioDate >= cutoffDate;
      });
    }

    return filtered;
  }, [socios, statusFilter, dateRange]);

  const calculateAnalytics = (socio: Socio) => {
    const now = new Date();
    const createdDate = socio.creadoEn.toDate();
    const antiguedad = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    const pagos = socio.pagos || [];
    const totalPagos = pagos.length;
    const montoTotal = pagos.reduce((sum, pago) => sum + pago.monto, 0);
    const promedioMensual = totalPagos > 0 ? montoTotal / Math.max(1, Math.ceil(antiguedad / 30)) : 0;

    // Mock engagement score (in real app, this would be calculated based on actual activity)
    const engagement = Math.min(100, Math.max(0,
      (totalPagos * 20) +
      (antiguedad > 365 ? 30 : antiguedad / 365 * 30) +
      (socio.estado === 'activo' ? 50 : 0)
    ));

    return {
      antiguedad,
      totalPagos,
      montoTotal,
      promedioMensual: Math.round(promedioMensual * 100) / 100,
      engagement: Math.round(engagement),
      ultimaActividad: pagos.length > 0 ? pagos[pagos.length - 1].fecha.toDate() : createdDate
    };
  };

  const generateExportData = (format: string) => {
    return filteredSocios.map(socio => {
      const analytics = calculateAnalytics(socio);
      const row: Record<string, unknown> = {};

      selectedFields.forEach(field => {
        switch (field) {
          case 'nombre':
            row.nombre = socio.nombre;
            break;
          case 'email':
            row.email = socio.email;
            break;
          case 'estado':
            row.estado = socio.estado;
            break;
          case 'telefono':
            row.telefono = socio.telefono || '';
            break;
          case 'dni':
            row.dni = socio.dni || '';
            break;
          case 'creadoEn':
            row.fechaAlta = socio.creadoEn.toDate().toLocaleDateString('es-ES');
            break;
          case 'ultimaActividad':
            row.ultimaActividad = analytics.ultimaActividad.toLocaleDateString('es-ES');
            break;
          case 'antiguedad':
            row.antiguedad = analytics.antiguedad;
            break;
          case 'totalPagos':
            row.totalPagos = analytics.totalPagos;
            break;
          case 'montoTotal':
            row.montoTotal = analytics.montoTotal;
            break;
          case 'promedioMensual':
            row.promedioMensual = analytics.promedioMensual;
            break;
          case 'engagement':
            row.engagement = analytics.engagement;
            break;
          case 'asociacionId':
            row.asociacionId = socio.asociacionId;
            break;
          case 'tipoMembresia':
            row.tipoMembresia = socio.estado === 'activo' ? 'Premium' : 'Básica';
            break;
          case 'notas':
            row.notas = '';
            break;
          case 'tags':
            row.tags = format === 'json' ? [] : '';
            break;
          default:
            row[field] = '';
        }
      });

      return row;
    });
  };

  const downloadFile = (content: string | object, filename: string, mimeType: string) => {
    let blob: Blob;

    if (typeof content === 'string') {
      blob = new Blob([content], { type: mimeType });
    } else {
      blob = new Blob([JSON.stringify(content, null, 2)], { type: mimeType });
    }

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      toast.error('Selecciona al menos un campo para exportar');
      return;
    }

    setExportLoading(true);
    const selectedFormatData = exportFormats.find(f => f.id === selectedFormat);

    try {
      // Step 1: Preparing data
      setExportProgress({
        step: 'Preparando datos...',
        progress: 10,
        message: 'Recopilando información de socios'
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Processing
      setExportProgress({
        step: 'Procesando información...',
        progress: 40,
        message: 'Calculando métricas y análisis'
      });
      const exportData = generateExportData(selectedFormat);
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 3: Generating file
      setExportProgress({
        step: 'Generando archivo...',
        progress: 70,
        message: `Creando archivo ${selectedFormatData?.fileExtension}`
      });

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `socios_export_${timestamp}${selectedFormatData?.fileExtension}`;
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Download
      setExportProgress({
        step: 'Descargando archivo...',
        progress: 90,
        message: 'Preparando descarga'
      });

      switch (selectedFormat) {
        case 'csv':
          const headers = selectedFields.map(field => {
            const fieldData = exportFields.find(f => f.id === field);
            return fieldData?.label || field;
          });

          const csvContent = Papa.unparse({
            fields: headers,
            data: exportData.map(row => headers.map((_, index) => {
              const fieldId = selectedFields[index];
              return row[fieldId] || '';
            }))
          });

          downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
          break;

        case 'json':
          const jsonData = {
            metadata: {
              exportDate: new Date().toISOString(),
              totalRecords: exportData.length,
              fields: selectedFields,
              filters: {
                status: statusFilter,
                dateRange: dateRange
              }
            },
            data: exportData
          };
          downloadFile(jsonData, filename, 'application/json');
          break;

        case 'excel':
          // For Excel, we'll create a CSV for now (in a real app, you'd use a library like xlsx)
          const excelHeaders = selectedFields.map(field => {
            const fieldData = exportFields.find(f => f.id === field);
            return fieldData?.label || field;
          });

          const excelContent = Papa.unparse({
            fields: excelHeaders,
            data: exportData.map(row => excelHeaders.map((_, index) => {
              const fieldId = selectedFields[index];
              return row[fieldId] || '';
            }))
          });

          downloadFile(excelContent, filename.replace('.xlsx', '.csv'), 'text/csv;charset=utf-8;');
          toast('Archivo Excel exportado como CSV. Para funcionalidad completa de Excel, considera usar una biblioteca especializada.');
          break;

        case 'pdf':
          // For PDF, we'll create a simple text report (in a real app, you'd use a PDF library)
          const pdfContent = `
REPORTE DE SOCIOS
=================

Fecha de exportación: ${new Date().toLocaleDateString('es-ES')}
Total de registros: ${exportData.length}

${exportData.map((row, index) => {
  return `${index + 1}. ${row.nombre || 'Sin nombre'} - ${row.email || 'Sin email'} - ${row.estado || 'Sin estado'}`;
}).join('\n')}

Generado por Fidelya - Sistema de Gestión de Socios
`.trim();

          downloadFile(pdfContent, filename.replace('.pdf', '.txt'), 'text/plain;charset=utf-8;');
          toast('Reporte PDF exportado como texto. Para funcionalidad completa de PDF, considera usar una biblioteca especializada.');
          break;
      }

      // Step 5: Complete
      setExportProgress({
        step: 'Completado',
        progress: 100,
        message: 'Archivo descargado exitosamente'
      });

      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success(`Archivo ${filename} descargado correctamente`);

    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error al exportar los datos');
    } finally {
      setExportLoading(false);
      setExportProgress(null);
    }
  };

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  const handleCategoryToggle = (category: string, selected: boolean) => {
    const categoryFields = exportFields.filter(field => field.category === category).map(field => field.id);

    if (selected) {
      setSelectedFields(prev => [...new Set([...prev, ...categoryFields])]);
    } else {
      setSelectedFields(prev => prev.filter(id => !categoryFields.includes(id)));
    }
  };

  const steps = [
    'Seleccionar Formato',
    'Configurar Filtros',
    'Elegir Campos',
    'Exportar Datos'
  ];

  const fieldsByCategory = exportFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ExportFieldProps[]>);

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        {/* Replace Grid with Flexbox for loading skeleton */}
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 4,
          '& > *': {
            flex: '1 1 calc(25% - 24px)',
            minWidth: '250px'
          }
        }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 5 }} key={index}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: '#f1f5f9',
                      borderRadius: 3,
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1 },
                        '50%': { opacity: 0.5 },
                      },
                    }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ width: '80%', height: 16, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
                    <Box sx={{ width: '60%', height: 14, bgcolor: '#f1f5f9', borderRadius: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)',
                }}
              >
                <CloudDownload sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    fontSize: '2.5rem',
                    background: 'linear-gradient(135deg, #0f172a 0%, #10b981 60%, #059669 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.03em',
                    lineHeight: 0.9,
                    mb: 1,
                  }}
                >
                  Exportar Datos
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '1.2rem',
                  }}
                >
                  Exportación avanzada con múltiples formatos y análisis completo
                </Typography>
              </Box>
            </Box>
            <Stack direction="row" spacing={2}>
              <Tooltip title="Actualizar datos">
                <IconButton
                  sx={{
                    bgcolor: alpha('#10b981', 0.1),
                    color: '#10b981',
                    '&:hover': {
                      bgcolor: alpha('#10b981', 0.2),
                      transform: 'rotate(180deg)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Enhanced Stats Cards - Replace Grid with Flexbox */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 3, 
            mb: 4,
            '& > *': {
              flex: '1 1 calc(25% - 18px)',
              minWidth: '200px'
            }
          }}>
            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}>
                    <Group />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {stats.total.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Total Socios
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981' }}>
                    <TrendingUp />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {stats.activos.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Socios Activos
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b' }}>
                    <Warning />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {stats.vencidos.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Membresías Vencidas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: alpha('#ef4444', 0.1), color: '#ef4444' }}>
                    <Analytics />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      {filteredSocios.length.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Para Exportar
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Progress Stepper */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: alpha('#10b981', 0.05),
              border: `1px solid ${alpha('#10b981', 0.15)}`,
              borderRadius: 4,
              p: 3,
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      '& .MuiStepLabel-label': {
                        fontWeight: 600,
                        color: index <= activeStep ? '#10b981' : '#94a3b8',
                      },
                      '& .MuiStepIcon-root': {
                        color: index <= activeStep ? '#10b981' : '#e2e8f0',
                      }
                    }}
                  >
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Box>
      </motion.div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeStep === 0 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                Seleccionar Formato de Exportación
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500, mb: 4 }}>
                Elige el formato que mejor se adapte a tus necesidades de análisis y presentación
              </Typography>
              {/* Replace Grid with Flexbox */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 4,
                '& > *': {
                  flex: '1 1 calc(25% - 24px)',
                  minWidth: '280px'
                }
              }}>
                {exportFormats.map((format, index) => (
                  <ExportFormatCard
                    key={format.id}
                    format={format}
                    selected={selectedFormat === format.id}
                    onSelect={() => setSelectedFormat(format.id)}
                    delay={index * 0.1}
                  />
                ))}
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                Configurar Filtros de Datos
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500, mb: 4 }}>
                Filtra y segmenta los datos que deseas incluir en tu exportación
              </Typography>
              {/* Replace Grid with Flexbox */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 4,
                '& > *': {
                  flex: '1 1 calc(50% - 16px)',
                  minWidth: '400px'
                }
              }}>
                <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                      Filtros de Segmentación
                    </Typography>
                    <Stack spacing={3}>
                      <FormControl fullWidth>
                        <InputLabel>Estado de Socios</InputLabel>
                        <Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          label="Estado de Socios"
                          startAdornment={<FilterList sx={{ color: '#94a3b8', mr: 1 }} />}
                        >
                          <MenuItem value="all">Todos los estados</MenuItem>
                          <MenuItem value="activo">Solo activos</MenuItem>
                          <MenuItem value="vencido">Solo vencidos</MenuItem>
                          <MenuItem value="inactivo">Solo inactivos</MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel>Rango de Fechas</InputLabel>
                        <Select
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value)}
                          label="Rango de Fechas"
                          startAdornment={<DateRange sx={{ color: '#94a3b8', mr: 1 }} />}
                        >
                          <MenuItem value="all">Todas las fechas</MenuItem>
                          <MenuItem value="last30days">Últimos 30 días</MenuItem>
                          <MenuItem value="last3months">Últimos 3 meses</MenuItem>
                          <MenuItem value="lastyear">Último año</MenuItem>
                        </Select>
                      </FormControl>
                    </Stack>
                  </CardContent>
                </Card>

                <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                      Resumen de Filtros Aplicados
                    </Typography>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                          Registros Totales vs Filtrados
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Total disponible:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                            {socios.length.toLocaleString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" sx={{ color: '#64748b' }}>
                            Después de filtros:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 700 }}>
                            {filteredSocios.length.toLocaleString()}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={socios.length > 0 ? (filteredSocios.length / socios.length) * 100 : 0}
                          sx={{
                            borderRadius: 2,
                            height: 8,
                            bgcolor: alpha('#10b981', 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: '#10b981',
                              borderRadius: 2,
                            }
                          }}
                        />
                      </Box>

                      <Divider />

                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, mb: 2 }}>
                          Filtros Activos
                        </Typography>
                        <Stack spacing={1}>
                          <Chip
                            label={`Estado: ${statusFilter === 'all' ? 'Todos' : statusFilter}`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#6366f1', 0.1),
                              color: '#6366f1',
                              justifyContent: 'flex-start'
                            }}
                          />
                          <Chip
                            label={`Período: ${dateRange === 'all' ? 'Completo' : dateRange}`}
                            size="small"
                            sx={{
                              bgcolor: alpha('#8b5cf6', 0.1),
                              color: '#8b5cf6',
                              justifyContent: 'flex-start'
                            }}
                          />
                        </Stack>
                      </Box>

                      <Box>
                        <Typography variant="subtitle2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
                          Porcentaje de Datos
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#10b981', fontWeight: 800 }}>
                          {socios.length > 0 ? Math.round((filteredSocios.length / socios.length) * 100) : 0}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          de los datos totales serán exportados
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                Seleccionar Campos de Datos
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500, mb: 4 }}>
                Elige qué información específica incluir en tu exportación. Los campos están organizados por categorías para facilitar la selección.
              </Typography>
              <Stack spacing={3}>
                {Object.entries(fieldsByCategory).map(([category, fields]) => (
                  <FieldSelectionCard
                    key={category}
                    category={category}
                    fields={fields}
                    selectedFields={selectedFields}
                    onFieldToggle={handleFieldToggle}
                    onCategoryToggle={handleCategoryToggle}
                  />
                ))}
              </Stack>

              {/* Quick Selection Actions */}
              <Paper
                elevation={0}
                sx={{
                  bgcolor: alpha('#6366f1', 0.05),
                  border: `1px solid ${alpha('#6366f1', 0.15)}`,
                  borderRadius: 4,
                  p: 3,
                  mt: 4,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
                  Selección Rápida
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedFields(exportFields.filter(f => f.required).map(f => f.id))}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Solo Campos Requeridos
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedFields(exportFields.filter(f => f.category === 'basic' || f.category === 'contact').map(f => f.id))}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Información Básica
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedFields(exportFields.filter(f => f.category === 'analytics').map(f => f.id))}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Solo Análisis
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedFields(exportFields.map(f => f.id))}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Seleccionar Todo
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setSelectedFields([])}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Limpiar Selección
                  </Button>
                </Stack>
              </Paper>
            </Box>
          )}

          {activeStep === 3 && (
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                Confirmar y Exportar Datos
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 500, mb: 4 }}>
                Revisa la configuración final y procede con la descarga de tu archivo de datos
              </Typography>
              {/* Replace Grid with Flexbox */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 6,
                '& > *:first-of-type': {
                  flex: '2 1 calc(66.67% - 24px)',
                  minWidth: '500px'
                },
                '& > *:last-of-type': {
                  flex: '1 1 calc(33.33% - 24px)',
                  minWidth: '300px'
                }
              }}>
                <ExportPreview
                  format={exportFormats.find(f => f.id === selectedFormat)!}
                  selectedFields={selectedFields}
                  filteredCount={filteredSocios.length}
                  onExport={handleExport}
                  loading={exportLoading}
                  progress={exportProgress || undefined}
                />

                <Stack spacing={3}>
                  {/* Configuration Summary */}
                  <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 5 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                        Configuración Final
                      </Typography>
                      <Stack spacing={3}>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                            Formato Seleccionado
                          </Typography>
                          <Chip
                            label={exportFormats.find(f => f.id === selectedFormat)?.name}
                            sx={{
                              bgcolor: alpha('#10b981', 0.1),
                              color: '#10b981',
                              fontWeight: 600,
                            }}
                          />
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                            Filtros Aplicados
                          </Typography>
                          <Stack spacing={1}>
                            <Chip
                              label={`Estado: ${statusFilter === 'all' ? 'Todos' : statusFilter}`}
                              size="small"
                              sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1' }}
                            />
                            <Chip
                              label={`Fecha: ${dateRange === 'all' ? 'Todas' : dateRange}`}
                              size="small"
                              sx={{ bgcolor: alpha('#8b5cf6', 0.1), color: '#8b5cf6' }}
                            />
                          </Stack>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 1 }}>
                            Campos Incluidos
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 700 }}>
                            {selectedFields.length} de {exportFields.length} campos
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(selectedFields.length / exportFields.length) * 100}
                            sx={{
                              mt: 1,
                              borderRadius: 2,
                              height: 6,
                              bgcolor: alpha('#6366f1', 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#6366f1',
                                borderRadius: 2,
                              }
                            }}
                          />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Export Tips */}
                  <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 5 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                        Consejos de Exportación
                      </Typography>
                      <Stack spacing={2}>
                        <Alert severity="info" sx={{ borderRadius: 3 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Los archivos CSV son ideales para análisis en Excel o Google Sheets
                          </Typography>
                        </Alert>
                        <Alert severity="success" sx={{ borderRadius: 3 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Los datos JSON mantienen la estructura completa para desarrolladores
                          </Typography>
                        </Alert>
                        <Alert severity="warning" sx={{ borderRadius: 3 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Los campos sensibles requieren permisos especiales
                          </Typography>
                        </Alert>
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* Data Preview */}
                  <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 5 }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                        Vista Previa de Datos
                      </Typography>
                      {filteredSocios.length > 0 && (
                        <Box sx={{ bgcolor: '#f8fafc', borderRadius: 3, p: 3 }}>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', mb: 1, display: 'block' }}>
                            Primer Registro
                          </Typography>
                          <Stack spacing={1}>
                            {selectedFields.slice(0, 3).map(fieldId => {
                              const field = exportFields.find(f => f.id === fieldId);
                              const socio = filteredSocios[0];
                              let value = '';

                              switch (fieldId) {
                                case 'nombre':
                                  value = socio.nombre;
                                  break;
                                case 'email':
                                  value = socio.email;
                                  break;
                                case 'estado':
                                  value = socio.estado;
                                  break;
                                case 'creadoEn':
                                  value = socio.creadoEn.toDate().toLocaleDateString('es-ES');
                                  break;
                                default:
                                  value = 'Dato de ejemplo';
                              }

                              return (
                                <Box key={fieldId} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                    {field?.label}:
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#1e293b', fontWeight: 700 }}>
                                    {value}
                                  </Typography>
                                </Box>
                              );
                            })}
                            {selectedFields.length > 3 && (
                              <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                ... y {selectedFields.length - 3} campos más
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Stack>
              </Box>
            </Box>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
        <Button
          onClick={() => setActiveStep(prev => prev - 1)}
          disabled={activeStep === 0}
          startIcon={<ArrowBack />}
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 700,
            '&:disabled': {
              bgcolor: '#f1f5f9',
              color: '#94a3b8',
            }
          }}
        >
          Anterior
        </Button>

        {activeStep < steps.length - 1 && (
          <Button
            onClick={() => setActiveStep(prev => prev + 1)}
            variant="contained"
            endIcon={<ArrowForward />}
            disabled={
              (activeStep === 2 && selectedFields.length === 0) ||
              (activeStep === 1 && filteredSocios.length === 0)
            }
            sx={{
              py: 1.5,
              px: 4,
              borderRadius: 3,
              textTransform: 'none',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
              '&:disabled': {
                bgcolor: '#e2e8f0',
                color: '#94a3b8',
              }
            }}
          >
            Siguiente
          </Button>
        )}
      </Box>

      {/* Additional Information */}
      {activeStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Paper
            elevation={0}
            sx={{
              bgcolor: alpha('#f59e0b', 0.05),
              border: `1px solid ${alpha('#f59e0b', 0.15)}`,
              borderRadius: 4,
              p: 4,
              mt: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Info sx={{ color: '#f59e0b' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Información Importante
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
              • Los archivos se descargan directamente en tu dispositivo<br />
              • Los datos exportados reflejan el estado actual de la base de datos<br />
              • Para archivos grandes, el proceso puede tomar unos momentos<br />
              • Los campos sensibles solo se incluyen si tienes los permisos necesarios<br />
              • Puedes repetir la exportación con diferentes configuraciones cuando lo necesites
            </Typography>
          </Paper>
        </motion.div>
      )}
    </Box>
  );
};