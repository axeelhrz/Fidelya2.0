'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  alpha,
  Avatar,
  Chip,
  Button,
  IconButton,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Download,
  Refresh,
  FilterList,
  CalendarToday,
  Timeline,
  Group,
  Star,
  Email,
  LocationOn,
  AttachMoney,
  Speed,
  DataUsage,
  Visibility,
  GetApp,
  Close,
  Schedule,
  CheckCircle,
  TableView,
  InsertChart,
  Description,
  CloudDownload,
  Analytics,
  Delete,
  ErrorOutline,
} from '@mui/icons-material';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { useSocios } from '@/hooks/useSocios';
import { reportsService, ReportData } from '@/services/reports.service';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface ReportsSectionProps {
  loading?: boolean;
}

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  category: 'members' | 'financial' | 'activity' | 'growth' | 'engagement';
  reportType: 'chart' | 'table' | 'summary' | 'dashboard';
  estimatedTime: string;
  dataPoints: number;
  lastGenerated?: Date;
  popularity: number;
  isNew?: boolean;
  isPremium?: boolean;
}

interface ReportCardProps {
  template: ReportTemplate;
  delay: number;
  onGenerate: (templateId: string) => void;
  onPreview: (templateId: string) => void;
  isGenerating?: boolean;
  lastReport?: ReportData;
}

const ReportCard: React.FC<ReportCardProps> = ({
  template,
  delay,
  onGenerate,
  onPreview,
  isGenerating = false,
  lastReport
}) => {
  const getReportTypeIcon = () => {
    switch (template.reportType) {
      case 'chart': return <InsertChart sx={{ fontSize: 14 }} />;
      case 'table': return <TableView sx={{ fontSize: 14 }} />;
      case 'summary': return <Description sx={{ fontSize: 14 }} />;
      case 'dashboard': return <Analytics sx={{ fontSize: 14 }} />;
      default: return <Assessment sx={{ fontSize: 14 }} />;
    }
  };

  const getStatusColor = () => {
    if (isGenerating) return '#f59e0b';
    if (lastReport?.status === 'completed') return '#10b981';
    if (lastReport?.status === 'failed') return '#ef4444';
    return '#6b7280';
  };

  const getStatusText = () => {
    if (isGenerating) return 'Generando...';
    if (lastReport?.status === 'completed') {
      return `Último: ${format(lastReport.generatedAt.toDate(), 'dd/MM HH:mm')}`;
    }
    if (lastReport?.status === 'failed') return 'Error en generación';
    return 'Nunca generado';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ 
        flex: '1 1 auto',
        minWidth: '320px',
        maxWidth: '400px'
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          background: '#ffffff',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            borderColor: alpha(template.color, 0.3),
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${alpha(template.color, 0.15)}`,
          },
        }}
      >
        {/* Top border */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: template.gradient,
          }}
        />

        {/* New/Premium badges */}
        {(template.isNew || template.isPremium) && (
          <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1 }}>
            {template.isNew && (
              <Chip
                label="NUEVO"
                size="small"
                sx={{
                  bgcolor: '#10b981',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 18,
                  mr: template.isPremium ? 0.5 : 0,
                }}
              />
            )}
            {template.isPremium && (
              <Chip
                label="PRO"
                size="small"
                sx={{
                  bgcolor: '#f59e0b',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 18,
                }}
              />
            )}
          </Box>
        )}

        <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: alpha(template.color, 0.1),
                color: template.color,
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              {template.icon}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#0f172a', 
                    fontSize: '0.95rem',
                    lineHeight: 1.2,
                    flex: '1 1 auto',
                    minWidth: 0,
                  }}
                >
                  {template.title}
                </Typography>
                <Chip
                  icon={getReportTypeIcon()}
                  label={template.reportType.toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: alpha(template.color, 0.1),
                    color: template.color,
                    fontWeight: 600,
                    fontSize: '0.6rem',
                    height: 16,
                    flexShrink: 0,
                  }}
                />
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b', 
                  lineHeight: 1.4, 
                  fontSize: '0.8rem',
                  mb: 1.5,
                }}
              >
                {template.description}
              </Typography>
              
              {/* Metrics */}
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: 1.5, 
                mb: 1.5 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 12, color: '#94a3b8' }} />
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.7rem' }}>
                    {template.estimatedTime}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <DataUsage sx={{ fontSize: 12, color: '#94a3b8' }} />
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.7rem' }}>
                    {template.dataPoints.toLocaleString()} datos
                  </Typography>
                </Box>
              </Box>

              {/* Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(),
                    flexShrink: 0,
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.7rem' }}>
                  {getStatusText()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Progress bar for generating */}
          {isGenerating && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress
                sx={{
                  height: 3,
                  borderRadius: 2,
                  bgcolor: alpha(template.color, 0.1),
                  '& .MuiLinearProgress-bar': {
                    bgcolor: template.color,
                    borderRadius: 2,
                  }
                }}
              />
            </Box>
          )}

          {/* Actions */}
          <Box sx={{ mt: 'auto' }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              flexWrap: 'wrap'
            }}>
              <Button
                onClick={() => onPreview(template.id)}
                size="small"
                startIcon={<Visibility sx={{ fontSize: 14 }} />}
                disabled={isGenerating}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#64748b',
                  flex: '1 1 auto',
                  minWidth: 'fit-content',
                  fontSize: '0.8rem',
                  py: 0.75,
                  '&:hover': {
                    color: template.color,
                    bgcolor: alpha(template.color, 0.05),
                  }
                }}
              >
                Vista previa
              </Button>
              <Button
                onClick={() => onGenerate(template.id)}
                size="small"
                variant="contained"
                startIcon={isGenerating ? <CircularProgress size={12} color="inherit" /> : <GetApp sx={{ fontSize: 14 }} />}
                disabled={isGenerating}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  background: template.gradient,
                  flex: '1 1 auto',
                  minWidth: 'fit-content',
                  fontSize: '0.8rem',
                  py: 0.75,
                  '&:hover': {
                    background: template.gradient,
                    filter: 'brightness(0.9)',
                  },
                  '&:disabled': {
                    background: alpha(template.color, 0.3),
                    color: 'white',
                  }
                }}
              >
                {isGenerating ? 'Generando' : 'Generar'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  loading?: boolean;
}> = ({ title, value, change, icon, color, subtitle, loading = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ 
        flex: '1 1 auto',
        minWidth: '220px',
        maxWidth: '280px'
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid #e2e8f0',
          borderRadius: 3,
          background: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            bgcolor: color,
          }}
        />
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: alpha(color, 0.1),
                color: color,
                borderRadius: 2,
              }}
            >
              {loading ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : icon}
            </Avatar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {change > 0 ? (
                <TrendingUp sx={{ fontSize: 14, color: '#10b981' }} />
              ) : change < 0 ? (
                <TrendingDown sx={{ fontSize: 14, color: '#ef4444' }} />
              ) : null}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280',
                  fontSize: '0.75rem'
                }}
              >
                {change > 0 ? '+' : ''}{change}%
              </Typography>
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5, fontSize: '1.5rem' }}>
            {loading ? '...' : value}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ReportPreviewDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  template: ReportTemplate | null;
  onGenerate: (templateId: string) => void;
}> = ({ open, onClose, template, onGenerate }) => {
  if (!template) return null;

  const mockData = {
    chart: [
      { name: 'Ene', value: 120 },
      { name: 'Feb', value: 150 },
      { name: 'Mar', value: 180 },
      { name: 'Abr', value: 160 },
      { name: 'May', value: 200 },
    ],
    table: [
      { nombre: 'Juan Pérez', estado: 'Activo', fecha: '2024-01-15' },
      { nombre: 'María García', estado: 'Vencido', fecha: '2024-02-20' },
      { nombre: 'Carlos López', estado: 'Activo', fecha: '2024-03-10' },
    ],
    summary: {
      totalMembers: 1250,
      activeMembers: 980,
      growthRate: 12.5,
      retentionRate: 87.3,
    }
  };

  const renderPreviewContent = () => {
    switch (template.reportType) {
      case 'chart':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Vista Previa - Gráfico
            </Typography>
            <Box sx={{ 
              height: 200, 
              display: 'flex', 
              alignItems: 'end', 
              gap: 2,
              flexWrap: 'wrap'
            }}>
              {mockData.chart.map((item, index) => (
                <Box key={index} sx={{ flex: '1 1 auto', textAlign: 'center', minWidth: '60px' }}>
                  <Box
                    sx={{
                      height: `${(item.value / 200) * 100}%`,
                      bgcolor: template.color,
                      borderRadius: '4px 4px 0 0',
                      minHeight: 20,
                      mb: 1,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {item.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 'table':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Vista Previa - Tabla
            </Typography>
            <Box sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ bgcolor: '#f8fafc', p: 2, borderBottom: '1px solid #e2e8f0' }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  flexWrap: 'wrap'
                }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, flex: '1 1 auto', minWidth: '100px' }}>Nombre</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, flex: '1 1 auto', minWidth: '80px' }}>Estado</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, flex: '1 1 auto', minWidth: '100px' }}>Fecha</Typography>
                </Box>
              </Box>
              {mockData.table.map((row, index) => (
                <Box key={index} sx={{ p: 2, borderBottom: index < mockData.table.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2,
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <Typography variant="body2" sx={{ flex: '1 1 auto', minWidth: '100px' }}>{row.nombre}</Typography>
                    <Box sx={{ flex: '1 1 auto', minWidth: '80px' }}>
                      <Chip 
                        label={row.estado} 
                        size="small" 
                        color={row.estado === 'Activo' ? 'success' : 'error'}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ flex: '1 1 auto', minWidth: '100px', color: '#64748b' }}>{row.fecha}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        );

      case 'summary':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>
              Vista Previa - Resumen
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 2
            }}>
              <MetricCard
                title="Total Socios"
                value={mockData.summary.totalMembers}
                change={mockData.summary.growthRate}
                icon={<Group />}
                color="#6366f1"
              />
              <MetricCard
                title="Socios Activos"
                value={mockData.summary.activeMembers}
                change={mockData.summary.retentionRate - 80}
                icon={<CheckCircle />}
                color="#10b981"
              />
            </Box>
          </Box>
        );

      default:
        return (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Vista previa no disponible para este tipo de reporte
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2,
        borderBottom: '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1 1 auto', minWidth: 0 }}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: alpha(template.color, 0.1),
              color: template.color,
              borderRadius: 2,
              flexShrink: 0,
            }}
          >
            {template.icon}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              {template.title}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              {template.description}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ flexShrink: 0 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {renderPreviewContent()}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cerrar
        </Button>
        <Button
          onClick={() => {
            onGenerate(template.id);
            onClose();
          }}
          variant="contained"
          startIcon={<GetApp />}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            background: template.gradient,
          }}
        >
          Generar Reporte
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  loading: propLoading = false
}) => {
  const { user } = useAuth();
  const { stats } = useSocios();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30days');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [generatedReports, setGeneratedReports] = useState<ReportData[]>([]);
  const [generatingReports, setGeneratingReports] = useState<Set<string>>(new Set());
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; template: ReportTemplate | null }>({
    open: false,
    template: null
  });
  const [error, setError] = useState<string | null>(null);

  const reportTemplates: ReportTemplate[] = useMemo(() => [
    {
      id: 'member-summary',
      title: 'Resumen de Socios',
      description: 'Estadísticas completas de todos los socios con análisis de tendencias',
      icon: <Group sx={{ fontSize: 22 }} />,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      category: 'members',
      reportType: 'summary',
      estimatedTime: '2-3 min',
      dataPoints: stats.total * 15,
      popularity: 95,
      isNew: false,
    },
    {
      id: 'growth-analysis',
      title: 'Análisis de Crecimiento',
      description: 'Tendencias de crecimiento mensual con proyecciones y análisis predictivo',
      icon: <TrendingUp sx={{ fontSize: 22 }} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      category: 'growth',
      reportType: 'chart',
      estimatedTime: '1-2 min',
      dataPoints: stats.total * 8,
      popularity: 88,
      isNew: true,
    },
    {
      id: 'activity-timeline',
      title: 'Timeline de Actividad',
      description: 'Registro cronológico detallado de todas las actividades y eventos',
      icon: <Timeline sx={{ fontSize: 22 }} />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      category: 'activity',
      reportType: 'table',
      estimatedTime: '3-4 min',
      dataPoints: stats.total * 25,
      popularity: 76,
    },
    {
      id: 'retention-analysis',
      title: 'Análisis de Retención',
      description: 'Métricas de retención con identificación de patrones de abandono',
      icon: <Star sx={{ fontSize: 22 }} />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      category: 'members',
      reportType: 'chart',
      estimatedTime: '2-3 min',
      dataPoints: stats.total * 12,
      popularity: 82,
      isPremium: true,
    },
    {
      id: 'financial-overview',
      title: 'Resumen Financiero',
      description: 'Análisis completo de ingresos, cuotas y proyecciones financieras',
      icon: <AttachMoney sx={{ fontSize: 22 }} />,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      category: 'financial',
      reportType: 'dashboard',
      estimatedTime: '4-5 min',
      dataPoints: stats.total * 20,
      popularity: 91,
      isPremium: true,
    },
    {
      id: 'demographic-analysis',
      title: 'Análisis Demográfico',
      description: 'Distribución detallada por edad, ubicación y características',
      icon: <LocationOn sx={{ fontSize: 22 }} />,
      color: '#ec4899',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      category: 'members',
      reportType: 'chart',
      estimatedTime: '2-3 min',
      dataPoints: stats.total * 10,
      popularity: 73,
    },
    {
      id: 'engagement-metrics',
      title: 'Métricas de Engagement',
      description: 'Análisis profundo de participación y niveles de compromiso',
      icon: <Speed sx={{ fontSize: 22 }} />,
      color: '#84cc16',
      gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
      category: 'engagement',
      reportType: 'dashboard',
      estimatedTime: '3-4 min',
      dataPoints: stats.total * 18,
      popularity: 79,
      isNew: true,
    },
    {
      id: 'communication-report',
      title: 'Reporte de Comunicaciones',
      description: 'Efectividad de campañas y análisis de comunicaciones',
      icon: <Email sx={{ fontSize: 22 }} />,
      color: '#f97316',
      gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      category: 'activity',
      reportType: 'table',
      estimatedTime: '2-3 min',
      dataPoints: stats.total * 6,
      popularity: 68,
    }
  ], [stats.total]);

  const categoryOptions = [
    { label: 'Todos los Reportes', value: 'all' },
    { label: 'Socios', value: 'members' },
    { label: 'Financiero', value: 'financial' },
    { label: 'Actividad', value: 'activity' },
    { label: 'Crecimiento', value: 'growth' },
    { label: 'Engagement', value: 'engagement' },
  ];

  const dateRangeOptions = [
    { label: 'Últimos 7 días', value: 'last7days' },
    { label: 'Últimos 30 días', value: 'last30days' },
    { label: 'Últimos 3 meses', value: 'last3months' },
    { label: 'Últimos 6 meses', value: 'last6months' },
    { label: 'Último año', value: 'lastyear' },
    { label: 'Todo el tiempo', value: 'alltime' },
  ];

  // Fetch generated reports from Firebase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = reportsService.subscribeToUserReports(user.uid, (reports) => {
        setGeneratedReports(reports);
        setLoading(false);
        setError(null);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error('Error subscribing to reports:', err);
      setError('Error al cargar los reportes');
      setLoading(false);
    }
  }, [user]);

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === 'all') return reportTemplates;
    return reportTemplates.filter(template => template.category === categoryFilter);
  }, [reportTemplates, categoryFilter]);

  const getDateRangeTimestamps = (range: string) => {
    const now = new Date();
    let startDate: Date;
    const endDate = now;

    switch (range) {
      case 'last7days':
        startDate = subDays(now, 7);
        break;
      case 'last30days':
        startDate = subDays(now, 30);
        break;
      case 'last3months':
        startDate = subDays(now, 90);
        break;
      case 'last6months':
        startDate = subDays(now, 180);
        break;
      case 'lastyear':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = new Date(2020, 0, 1);
    }

    return {
      startDate: Timestamp.fromDate(startOfDay(startDate)),
      endDate: Timestamp.fromDate(endOfDay(endDate))
    };
  };

  const handleGenerateReport = async (templateId: string) => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return;
    }

    try {
      setGeneratingReports(prev => new Set([...prev, templateId]));

      const { startDate, endDate } = getDateRangeTimestamps(dateRange);

      await reportsService.generateReport(
        templateId,
        user.uid,
        user.uid,
        {
          dateRange,
          categoryFilter,
          startDate,
          endDate,
          includeCharts: true,
          format: 'pdf'
        }
      );

      toast.success('Reporte generado exitosamente');
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte');
    } finally {
      // Remove from generating set after a delay
      setTimeout(() => {
        setGeneratingReports(prev => {
          const newSet = new Set(prev);
          newSet.delete(templateId);
          return newSet;
        });
      }, 2000);
    }
  };

  const handlePreviewReport = (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    setPreviewDialog({ open: true, template: template || null });
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await reportsService.deleteReport(reportId);
      toast.success('Reporte eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting report:', error);
      toast.error('Error al eliminar el reporte');
    }
  };

  const handleDownloadReport = (report: ReportData) => {
    if (report.downloadUrl) {
      window.open(report.downloadUrl, '_blank');
    } else {
      toast.error('URL de descarga no disponible');
    }
  };

  const summaryMetrics = useMemo(() => [
    {
      title: 'Reportes Disponibles',
      value: reportTemplates.length,
      change: 12.5,
      icon: <Assessment sx={{ fontSize: 18 }} />,
      color: '#6366f1',
      subtitle: 'Templates activos',
      loading: propLoading
    },
    {
      title: 'Reportes Generados',
      value: generatedReports.length,
      change: 8.3,
      icon: <CloudDownload sx={{ fontSize: 18 }} />,
      color: '#10b981',
      subtitle: 'Este período',
      loading: propLoading
    },
    {
      title: 'Tiempo Promedio',
      value: '2.8min',
      change: -15.2,
      icon: <Speed sx={{ fontSize: 18 }} />,
      color: '#f59e0b',
      subtitle: 'Generación',
      loading: propLoading
    },
    {
      title: 'Datos Procesados',
      value: `${(stats.total * 15 / 1000).toFixed(1)}K`,
      change: 23.1,
      icon: <DataUsage sx={{ fontSize: 18 }} />,
      color: '#8b5cf6',
      subtitle: 'Registros totales',
      loading: propLoading
    }
  ], [reportTemplates.length, generatedReports.length, stats.total, propLoading]);

  // Get last report for each template
  const getLastReportForTemplate = (templateId: string): ReportData | undefined => {
    return generatedReports
      .filter(report => report.templateId === templateId)
      .sort((a, b) => b.generatedAt.toMillis() - a.generatedAt.toMillis())[0];
  };

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, md: 3 }, 
      maxWidth: '100%', 
      overflow: 'hidden',
      ml: { xs: 0, md: 2 },
      mr: { xs: 0, md: 2 }
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1 1 auto', minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  flexShrink: 0,
                }}
              >
                <Assessment sx={{ fontSize: 24 }} />
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '1.5rem', md: '1.75rem' },
                    color: '#0f172a',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    mb: 0.5,
                  }}
                >
                  Centro de Reportes
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#64748b',
                    fontWeight: 500,
                    fontSize: { xs: '0.85rem', md: '0.95rem' },
                  }}
                >
                  Análisis avanzado y reportes ejecutivos • {user?.email?.split('@')[0] || 'Administrador'}
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5,
              flexShrink: 0,
              flexWrap: 'wrap'
            }}>
              <IconButton
                onClick={() => window.location.reload()}
                size="small"
                sx={{
                  bgcolor: alpha('#f59e0b', 0.1),
                  color: '#f59e0b',
                  '&:hover': {
                    bgcolor: alpha('#f59e0b', 0.2),
                  },
                }}
              >
                <Refresh sx={{ fontSize: 18 }} />
              </IconButton>
              <Button
                variant="contained"
                startIcon={<Download sx={{ fontSize: 16 }} />}
                size="small"
                sx={{
                  py: 1,
                  px: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  },
                }}
              >
                Exportar Todo
              </Button>
            </Box>
          </Box>
          
          {/* Filters */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: alpha('#f59e0b', 0.05),
              border: `1px solid ${alpha('#f59e0b', 0.15)}`,
              borderRadius: 2,
              p: 2,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'linear-gradient(90deg, #f59e0b, #d97706)',
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2,
                flex: '1 1 auto',
                flexWrap: 'wrap'
              }}>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label="Categoría"
                    startAdornment={<FilterList sx={{ color: '#94a3b8', mr: 1, fontSize: 16 }} />}
                    sx={{ bgcolor: 'white', fontSize: '0.85rem' }}
                  >
                    {categoryOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Período</InputLabel>
                  <Select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    label="Período"
                    startAdornment={<CalendarToday sx={{ color: '#94a3b8', mr: 1, fontSize: 16 }} />}
                    sx={{ bgcolor: 'white', fontSize: '0.85rem' }}
                  >
                    {dateRangeOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    bgcolor: '#f59e0b',
                    borderRadius: '50%',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.5, transform: 'scale(1.1)' },
                    },
                  }}
                />
                <Typography variant="body2" sx={{ color: '#d97706', fontWeight: 600, fontSize: '0.8rem' }}>
                  {filteredTemplates.length} reportes disponibles
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </motion.div>

      {/* Summary Metrics */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        mb: 4,
        justifyContent: 'center'
      }}>
        {summaryMetrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </Box>

      {/* Reports Grid */}
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 3,
        alignItems: 'stretch',
        justifyContent: 'center'
      }}>
        {loading || propLoading ? (
          // Loading skeleton
          Array.from({ length: 8 }).map((_, index) => (
            <Box key={index} style={{ 
              flex: '1 1 auto',
              minWidth: '320px',
              maxWidth: '400px'
            }}>
              <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: '#f1f5f9',
                        borderRadius: 2,
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                        },
                                            }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ width: '80%', height: 14, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
                      <Box sx={{ width: '60%', height: 12, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
                      <Box sx={{ width: '90%', height: 10, bgcolor: '#f1f5f9', borderRadius: 1 }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Box sx={{ width: '50%', height: 28, bgcolor: '#f1f5f9', borderRadius: 2 }} />
                    <Box sx={{ width: '50%', height: 28, bgcolor: '#f1f5f9', borderRadius: 2 }} />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))
        ) : (
          filteredTemplates.map((template, index) => (
            <ReportCard
              key={template.id}
              template={template}
              delay={index * 0.1}
              onGenerate={handleGenerateReport}
              onPreview={handlePreviewReport}
              isGenerating={generatingReports.has(template.id)}
              lastReport={getLastReportForTemplate(template.id)}
            />
          ))
        )}
      </Box>

      {/* Empty State */}
      {!loading && !propLoading && filteredTemplates.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              border: '2px dashed #e2e8f0',
              borderRadius: 3,
              bgcolor: '#fafbfc',
            }}
          >
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha('#f59e0b', 0.1),
                color: '#f59e0b',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Assessment sx={{ fontSize: 28 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
              No hay reportes disponibles
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', mb: 3 }}>
              No se encontraron reportes para los filtros seleccionados.
              Intenta cambiar la categoría o el período de tiempo.
            </Typography>
            <Button
              onClick={() => {
                setCategoryFilter('all');
                setDateRange('last30days');
              }}
              variant="contained"
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              }}
            >
              Mostrar Todos los Reportes
            </Button>
          </Paper>
        </motion.div>
      )}

      {/* Recent Reports Section */}
      {generatedReports.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Box sx={{ mt: 6 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
              Reportes Recientes
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: 2,
              maxHeight: 400,
              overflowY: 'auto',
              pr: 1,
            }}>
              {generatedReports.slice(0, 10).map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    elevation={0}
                    sx={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: alpha('#f59e0b', 0.3),
                        boxShadow: `0 4px 20px ${alpha('#f59e0b', 0.1)}`,
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: '1 1 auto', minWidth: 0 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: report.status === 'completed' ? alpha('#10b981', 0.1) : 
                                       report.status === 'generating' ? alpha('#f59e0b', 0.1) : 
                                       alpha('#ef4444', 0.1),
                              color: report.status === 'completed' ? '#10b981' : 
                                     report.status === 'generating' ? '#f59e0b' : 
                                     '#ef4444',
                              borderRadius: 2,
                              flexShrink: 0,
                            }}
                          >
                            {report.status === 'completed' ? <CheckCircle sx={{ fontSize: 18 }} /> :
                             report.status === 'generating' ? <CircularProgress size={14} /> :
                             <ErrorOutline sx={{ fontSize: 18 }} />}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem' }}>
                              {report.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                              {format(report.generatedAt.toDate(), 'dd/MM/yyyy HH:mm', { locale: es })}
                              {report.fileSize && ` • ${report.fileSize}`}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                          <Chip
                            label={report.status === 'completed' ? 'Completado' : 
                                   report.status === 'generating' ? 'Generando' : 'Error'}
                            size="small"
                            color={report.status === 'completed' ? 'success' : 
                                   report.status === 'generating' ? 'warning' : 'error'}
                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                          />
                          {report.status === 'completed' && (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadReport(report)}
                                sx={{
                                  color: '#f59e0b',
                                  '&:hover': {
                                    bgcolor: alpha('#f59e0b', 0.1),
                                  }
                                }}
                              >
                                <Download sx={{ fontSize: 16 }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteReport(report.id!)}
                                sx={{
                                  color: '#ef4444',
                                  '&:hover': {
                                    bgcolor: alpha('#ef4444', 0.1),
                                  }
                                }}
                              >
                                <Delete sx={{ fontSize: 16 }} />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </Box>
                      
                      {/* Progress bar for generating reports */}
                      {report.status === 'generating' && report.progress !== undefined && (
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem' }}>
                              Progreso
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.7rem' }}>
                              {report.progress}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={report.progress}
                            sx={{
                              height: 3,
                              borderRadius: 2,
                              bgcolor: alpha('#f59e0b', 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#f59e0b',
                                borderRadius: 2,
                              }
                            }}
                          />
                        </Box>
                      )}

                      {/* Error message for failed reports */}
                      {report.status === 'failed' && report.errorMessage && (
                        <Alert severity="error" sx={{ mt: 2, fontSize: '0.8rem' }}>
                          {report.errorMessage}
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </Box>
          </Box>
        </motion.div>
      )}

      {/* Preview Dialog */}
      <ReportPreviewDialog
        open={previewDialog.open}
        onClose={() => setPreviewDialog({ open: false, template: null })}
        template={previewDialog.template}
        onGenerate={handleGenerateReport}
      />
    </Box>
  );
};

