'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  alpha,
  LinearProgress,
  Divider,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Receipt,
  LocalOffer,
  AttachMoney,
  CheckCircle,
  Refresh,
  Download,
  BarChart,
  PieChart,
  ShowChart,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useValidaciones } from '@/hooks/useValidaciones';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

const CHART_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

export const ComercioStats: React.FC = () => {
  const { beneficios } = useBeneficios();
  const activeBeneficios = beneficios.filter(b => b.activo); // Ajusta la condición según tu modelo de datos
  const { validaciones, getStats } = useValidaciones();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  const stats = getStats();

  // Calculate comprehensive statistics
  const calculateStats = () => {
    const now = new Date();
    const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    const startDate = subDays(now, periodDays);

    const periodValidaciones = validaciones.filter(v => 
      v.fechaHora.toDate() >= startDate
    );

    const validacionesExitosas = periodValidaciones.filter(v => v.resultado === 'habilitado');
    const totalIngresos = validacionesExitosas.reduce((sum, v) => sum + (v.monto || 0), 0);
    const totalDescuentos = validacionesExitosas.reduce((sum, v) => sum + (v.montoDescuento || v.ahorro || 0), 0);

    // Daily validations for chart
    const dailyValidations = [];
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayValidations = validaciones.filter(v => {
        const vDate = v.fechaHora.toDate();
        return vDate >= dayStart && vDate <= dayEnd;
      });

      const daySuccessful = dayValidations.filter(v => v.resultado === 'habilitado');

      dailyValidations.push({
        date: format(date, 'dd/MM', { locale: es }),
        fullDate: format(date, 'yyyy-MM-dd'),
        validaciones: dayValidations.length,
        exitosas: daySuccessful.length,
        ingresos: daySuccessful.reduce((sum, v) => sum + (v.monto || 0), 0),
      });
    }

    // Benefits usage
    const benefitsUsage = beneficios.map(beneficio => ({
      name: beneficio.titulo.length > 20 ? `${beneficio.titulo.substring(0, 20)}...` : beneficio.titulo,
      fullName: beneficio.titulo,
      usos: beneficio.usosActuales,
      color: CHART_COLORS[beneficios.indexOf(beneficio) % CHART_COLORS.length],
    })).sort((a, b) => b.usos - a.usos).slice(0, 5);

    // Validation results distribution
    const resultDistribution = Object.entries(stats.porBeneficio).map(([beneficioId, count], index) => {
      const beneficio = beneficios.find(b => b.id === beneficioId);
      return {
        name: beneficio ? (beneficio.titulo.length > 15 ? `${beneficio.titulo.substring(0, 15)}...` : beneficio.titulo) : 'Desconocido',
        value: count,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    }).slice(0, 6);

    return {
      periodValidaciones: periodValidaciones.length,
      validacionesExitosas: validacionesExitosas.length,
      tasaExito: periodValidaciones.length > 0 ? (validacionesExitosas.length / periodValidaciones.length) * 100 : 0,
      totalIngresos,
      totalDescuentos,
      promedioValidacionesDiarias: periodValidaciones.length / periodDays,
      beneficiosActivos: activeBeneficios.length,
      dailyValidations,
      benefitsUsage,
      resultDistribution,
    };
  };

  const computedStats = calculateStats();

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const exportStats = () => {
    const csvContent = [
      ['Métrica', 'Valor'],
      ['Período', selectedPeriod],
      ['Total Validaciones', computedStats.periodValidaciones],
      ['Validaciones Exitosas', computedStats.validacionesExitosas],
      ['Tasa de Éxito (%)', computedStats.tasaExito.toFixed(2)],
      ['Total Ingresos', computedStats.totalIngresos.toFixed(2)],
      ['Total Descuentos', computedStats.totalDescuentos.toFixed(2)],
      ['Beneficios Activos', computedStats.beneficiosActivos],
      ['Promedio Validaciones Diarias', computedStats.promedioValidacionesDiarias.toFixed(2)],
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estadisticas-comercio-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Estadísticas del Comercio
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            Análisis detallado del rendimiento de tu comercio
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          {/* Period Selector */}
          <Stack direction="row" spacing={1}>
            {[
              { value: '7d', label: '7 días' },
              { value: '30d', label: '30 días' },
              { value: '90d', label: '90 días' },
            ].map((period) => (
              <Button
                key={period.value}
                variant={selectedPeriod === period.value ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setSelectedPeriod(period.value as '7d' | '30d' | '90d')}
                sx={{
                  bgcolor: selectedPeriod === period.value ? '#06b6d4' : 'transparent',
                  borderColor: '#06b6d4',
                  color: selectedPeriod === period.value ? 'white' : '#06b6d4',
                  '&:hover': {
                    bgcolor: selectedPeriod === period.value ? '#0891b2' : alpha('#06b6d4', 0.1),
                  },
                  minWidth: 'auto',
                  px: 2,
                }}
              >
                {period.label}
              </Button>
            ))}
          </Stack>
          
          <Tooltip title="Exportar estadísticas">
            <IconButton
              onClick={exportStats}
              sx={{
                bgcolor: alpha('#10b981', 0.1),
                color: '#10b981',
                '&:hover': {
                  bgcolor: alpha('#10b981', 0.2),
                }
              }}
            >
              <Download />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Actualizar datos">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{
                bgcolor: alpha('#06b6d4', 0.1),
                color: '#06b6d4',
                '&:hover': {
                  bgcolor: alpha('#06b6d4', 0.2),
                }
              }}
            >
              <Refresh sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                }
              }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Key Metrics Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {[
          {
            title: 'Validaciones del Período',
            value: computedStats.periodValidaciones,
            icon: <Receipt />,
            color: '#06b6d4',
            change: '+12%',
            subtitle: `${computedStats.promedioValidacionesDiarias.toFixed(1)} por día`,
          },
          {
            title: 'Tasa de Éxito',
            value: `${computedStats.tasaExito.toFixed(1)}%`,
            icon: <CheckCircle />,
            color: '#10b981',
            change: '+5%',
            subtitle: `${computedStats.validacionesExitosas} exitosas`,
          },
          {
            title: 'Ingresos Generados',
            value: `$${computedStats.totalIngresos.toFixed(0)}`,
            icon: <AttachMoney />,
            color: '#8b5cf6',
            change: '+18%',
            subtitle: `$${computedStats.totalDescuentos.toFixed(0)} en descuentos`,
          },
          {
            title: 'Beneficios Activos',
            value: computedStats.beneficiosActivos,
            icon: <LocalOffer />,
            color: '#f59e0b',
            change: '0%',
            subtitle: `${beneficios.length} total`,
          },
        ].map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              elevation={0}
              sx={{
                p: 3,
                background: 'white',
                border: '1px solid #f1f5f9',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  borderColor: metric.color,
                }
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                  sx={{
                    bgcolor: alpha(metric.color, 0.1),
                    color: metric.color,
                    width: 56,
                    height: 56,
                  }}
                >
                  {metric.icon}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 0.5 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                    {metric.title}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" sx={{ 
                      color: metric.change.startsWith('+') ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                      bgcolor: alpha(metric.change.startsWith('+') ? '#10b981' : '#ef4444', 0.1),
                      px: 1,
                      py: 0.25,
                      borderRadius: 1,
                    }}>
                      {metric.change}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: '#94a3b8', mt: 1, display: 'block' }}>
                    {metric.subtitle}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </motion.div>
        ))}
      </Box>

      {/* Charts Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: '2fr 1fr',
          },
          gap: 4,
          mb: 4,
        }}
      >
        {/* Validations Trend Chart */}
        <Card
          elevation={0}
          sx={{
            background: 'white',
            border: '1px solid #f1f5f9',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  Tendencia de Validaciones
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Validaciones diarias en los últimos {selectedPeriod === '7d' ? '7 días' : selectedPeriod === '30d' ? '30 días' : '90 días'}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: alpha('#06b6d4', 0.1),
                  color: '#06b6d4',
                  width: 40,
                  height: 40,
                }}
              >
                <ShowChart />
              </Avatar>
            </Stack>

            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={computedStats.dailyValidations}>
                  <defs>
                    <linearGradient id="validacionesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="exitosasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="validaciones"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fill="url(#validacionesGradient)"
                    name="Total Validaciones"
                  />
                  <Area
                    type="monotone"
                    dataKey="exitosas"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#exitosasGradient)"
                    name="Validaciones Exitosas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Benefits Usage Chart */}
        <Card
          elevation={0}
          sx={{
            background: 'white',
            border: '1px solid #f1f5f9',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  Beneficios Más Usados
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Top 5 beneficios por uso
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: alpha('#8b5cf6', 0.1),
                  color: '#8b5cf6',
                  width: 40,
                  height: 40,
                }}
              >
                <PieChart />
              </Avatar>
            </Stack>

            {computedStats.benefitsUsage.length > 0 ? (
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={computedStats.benefitsUsage}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="usos"
                    >
                      {computedStats.benefitsUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #f1f5f9',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: alpha('#94a3b8', 0.1),
                    color: '#94a3b8',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <LocalOffer sx={{ fontSize: 30 }} />
                </Avatar>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  No hay datos de uso de beneficios
                </Typography>
              </Box>
            )}

            {/* Benefits Legend */}
            {computedStats.benefitsUsage.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={1}>
                  {computedStats.benefitsUsage.slice(0, 3).map((benefit, index) => (
                    <Stack key={index} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: benefit.color,
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {benefit.name}
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {benefit.usos}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Bottom Charts Section */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            lg: 'repeat(2, 1fr)',
          },
          gap: 4,
        }}
      >
        {/* Revenue Chart */}
        <Card
          elevation={0}
          sx={{
            background: 'white',
            border: '1px solid #f1f5f9',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  Ingresos Diarios
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Ingresos generados por validaciones
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: alpha('#10b981', 0.1),
                  color: '#10b981',
                  width: 40,
                  height: 40,
                }}
              >
                <AttachMoney />
              </Avatar>
            </Stack>

            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={computedStats.dailyValidations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #f1f5f9',
                      borderRadius: '8px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ingresos']}
                  />
                  <Bar
                    dataKey="ingresos"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card
          elevation={0}
          sx={{
            background: 'white',
            border: '1px solid #f1f5f9',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                  Resumen de Rendimiento
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Métricas clave del período
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: alpha('#f59e0b', 0.1),
                  color: '#f59e0b',
                  width: 40,
                  height: 40,
                }}
              >
                <BarChart />
              </Avatar>
            </Stack>

            <Stack spacing={3}>
              {[
                {
                  label: 'Tasa de Conversión',
                  value: computedStats.tasaExito,
                  max: 100,
                  color: '#10b981',
                  suffix: '%',
                },
                {
                  label: 'Uso de Beneficios',
                  value: (computedStats.benefitsUsage.reduce((sum, b) => sum + b.usos, 0) / (beneficios.length || 1)) * 10,
                  max: 100,
                  color: '#06b6d4',
                  suffix: '%',
                },
                {
                  label: 'Actividad Diaria',
                  value: (computedStats.promedioValidacionesDiarias / 10) * 100,
                  max: 100,
                  color: '#8b5cf6',
                  suffix: '%',
                },
                {
                  label: 'Eficiencia Operativa',
                  value: Math.min((computedStats.validacionesExitosas / Math.max(computedStats.periodValidaciones, 1)) * 100, 100),
                  max: 100,
                  color: '#f59e0b',
                  suffix: '%',
                },
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                        {metric.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: metric.color }}>
                        {metric.value.toFixed(1)}{metric.suffix}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(metric.value, metric.max)}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(metric.color, 0.1),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: metric.color,
                          borderRadius: 4,
                        }
                      }}
                    />
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </motion.div>
  );
};