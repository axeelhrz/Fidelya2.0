'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Card,
  CardContent,
  Paper,
  Stack,
  Button,
  IconButton,
  alpha,
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  Assessment,
  AutoGraph,
  BarChart,
  Download,
  Refresh,
} from '@mui/icons-material';
import { ValidationsChart } from './ValidationsChart';
import { TopBenefits } from './TopBenefits';
import HourlyActivityChart from './analytics/HourlyActivityChart';
import { ValidationsOverTime } from './analytics/ValidationsOverTime';
import { ByAssociationChart } from './analytics/ByAssociationChart';
import { KpiCards } from './analytics/KpiCards';
import { TopDaysList } from './analytics/TopDaysList';
import { DateRangeSelector } from './analytics/DateRangeSelector';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ComercioAnalyticsProps {
  section: string;
}

export const ComercioAnalytics: React.FC<ComercioAnalyticsProps> = ({ section }) => {
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  });

  // Use analytics hook to get processed data
  const { analyticsData, loading } = useAnalytics({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const getSectionConfig = () => {
    switch (section) {
      case 'metrics':
        return {
          title: 'Métricas Clave',
          subtitle: 'Indicadores de rendimiento',
          icon: <TrendingUp sx={{ fontSize: 32 }} />,
          color: '#10b981',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        };
      case 'reports':
        return {
          title: 'Reportes Detallados',
          subtitle: 'Análisis y documentos',
          icon: <Assessment sx={{ fontSize: 32 }} />,
          color: '#f59e0b',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        };
      case 'insights':
        return {
          title: 'Insights IA',
          subtitle: 'Análisis inteligente',
          icon: <AutoGraph sx={{ fontSize: 32 }} />,
          color: '#ec4899',
          gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        };
      default:
        return {
          title: 'Analytics Avanzado',
          subtitle: 'Métricas y análisis profundo',
          icon: <Analytics sx={{ fontSize: 32 }} />,
          color: '#8b5cf6',
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        };
    }
  };

  const config = getSectionConfig();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                borderRadius: 4,
                background: config.gradient,
                boxShadow: `0 12px 40px ${alpha(config.color, 0.3)}`,
              }}
            >
              {config.icon}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                {config.title}
              </Typography>
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
                {config.subtitle}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <IconButton
                onClick={() => window.location.reload()}
                sx={{
                  bgcolor: alpha(config.color, 0.1),
                  color: config.color,
                  '&:hover': {
                    bgcolor: alpha(config.color, 0.2),
                    transform: 'rotate(180deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Refresh />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<Download />}
                sx={{
                  borderColor: alpha(config.color, 0.3),
                  color: config.color,
                  '&:hover': {
                    borderColor: config.color,
                    bgcolor: alpha(config.color, 0.1),
                  },
                }}
              >
                Exportar
              </Button>
            </Stack>
          </Box>

          {/* Date Range Selector */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #f1f5f9',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            }}
          >
            <DateRangeSelector
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </Paper>
        </Box>
      </motion.div>

      {section === 'insights' ? (
        // AI Insights Section
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card
            elevation={0}
            sx={{
              border: '1px solid #f1f5f9',
              borderRadius: 4,
              background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: alpha('#ec4899', 0.1),
                    color: '#ec4899',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <AutoGraph sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
                  Insights IA en Desarrollo
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 500, mx: 'auto' }}>
                  Nuestro sistema de análisis inteligente estará disponible próximamente.
                  Proporcionará recomendaciones personalizadas y predicciones basadas en tus datos.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      ) : section === 'reports' ? (
        // Reports Section
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Reports Cards */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 4,
              '& > *': {
                flex: { xs: '1 1 100%', md: '1 1 calc(50% - 16px)' }
              }
            }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #f1f5f9',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha('#f59e0b', 0.1),
                        color: '#f59e0b',
                      }}
                    >
                      <Assessment />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Reporte de Validaciones
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Análisis detallado de actividad
                      </Typography>
                    </Box>
                  </Box>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderColor: alpha('#f59e0b', 0.3),
                        color: '#f59e0b',
                        '&:hover': {
                          borderColor: '#f59e0b',
                          bgcolor: alpha('#f59e0b', 0.1),
                        },
                      }}
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderColor: alpha('#10b981', 0.3),
                        color: '#10b981',
                        '&:hover': {
                          borderColor: '#10b981',
                          bgcolor: alpha('#10b981', 0.1),
                        },
                      }}
                    >
                      Exportar Excel
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              <Card
                elevation={0}
                sx={{
                  border: '1px solid #f1f5f9',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        bgcolor: alpha('#6366f1', 0.1),
                        color: '#6366f1',
                      }}
                    >
                      <BarChart />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        Reporte de Beneficios
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Rendimiento de ofertas
                      </Typography>
                    </Box>
                  </Box>
                  <Stack spacing={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderColor: alpha('#6366f1', 0.3),
                        color: '#6366f1',
                        '&:hover': {
                          borderColor: '#6366f1',
                          bgcolor: alpha('#6366f1', 0.1),
                        },
                      }}
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      fullWidth
                      sx={{
                        py: 1.5,
                        borderColor: alpha('#8b5cf6', 0.3),
                        color: '#8b5cf6',
                        '&:hover': {
                          borderColor: '#8b5cf6',
                          bgcolor: alpha('#8b5cf6', 0.1),
                        },
                      }}
                    >
                      Exportar Excel
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Scheduled Reports */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid #f1f5f9',
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
                  Reportes Programados
                </Typography>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" sx={{ color: '#64748b' }}>
                    Configura reportes automáticos para recibir análisis periódicos por email.
                  </Typography>
                  <Button
                    variant="contained"
                    sx={{
                      mt: 2,
                      background: config.gradient,
                      '&:hover': {
                        background: config.gradient,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Configurar Reportes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </motion.div>
      ) : (
        // Default Analytics Section
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* KPI Cards */}
            <KpiCards
              data={{
                totalValidaciones: analyticsData.totalValidaciones,
                promedioDiario: analyticsData.promedioDiario,
                asociacionesActivas: analyticsData.asociacionesActivas,
                tasaExito: analyticsData.tasaExito,
                totalBeneficios: analyticsData.topBenefits.length,
                usuariosUnicos: analyticsData.sociosAlcanzados || 0,
                crecimientoMensual: analyticsData.crecimientoMensual,
                eficienciaOperativa: analyticsData.eficienciaOperativa,
                beneficioMasUsado: analyticsData.beneficioMasUsado,
                ingresosTotales: analyticsData.ingresosTotales,
                sociosAlcanzados: analyticsData.sociosAlcanzados,
              }}
              loading={loading}
            />

            {/* Charts Row 1 */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 4,
              alignItems: 'stretch'
            }}>
              <Box sx={{ flex: { xs: '1 1 100%', lg: '2 1 0' }, minWidth: '400px' }}>
                <ValidationsOverTime data={analyticsData.dailyValidations} />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: '320px' }}>
                <TopDaysList data={analyticsData.topDays} />
              </Box>
            </Box>

            {/* Charts Row 2 */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 4,
              alignItems: 'stretch',
              '& > *': {
                flex: { xs: '1 1 100%', md: '1 1 calc(50% - 16px)' },
                minWidth: '320px'
              }
            }}>
              <HourlyActivityChart data={analyticsData.hourlyActivity} />
              <ByAssociationChart data={analyticsData.byAssociation} />
            </Box>

            {/* Charts Row 3 */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 4,
              alignItems: 'stretch'
            }}>
              <Box sx={{ flex: { xs: '1 1 100%', lg: '2 1 0' }, minWidth: '400px' }}>
                <ValidationsChart
                  data={analyticsData.dailyValidations.map((item: { fecha: string; validaciones: number; ingresos?: number }) => ({
                    fecha: item.fecha,
                    validaciones: item.validaciones,
                    ingresos: item.ingresos ?? 0,
                  }))}
                  period="month"
                />
              </Box>
              <Box sx={{ flex: { xs: '1 1 100%', lg: '1 1 0' }, minWidth: '320px' }}>
                <TopBenefits
                  data={analyticsData.topBenefits.map(
                    (item: {
                      id: string;
                      nombre: string;
                      asociacion: string;
                      usos: number;
                      estado: 'activo' | 'inactivo';
                    }) => ({
                      beneficioId: item.id,
                      titulo: item.nombre,
                      usos: item.usos,
                    })
                  )}
                />
              </Box>
            </Box>
          </Box>
        </motion.div>
      )}
    </Container>
  );
};