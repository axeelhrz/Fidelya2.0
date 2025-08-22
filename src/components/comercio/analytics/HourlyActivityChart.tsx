'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Schedule,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HourlyActivityChartProps {
  data: Array<{
    hora: string;
    total: number;
  }>;
}

// Define proper types for the tooltip
interface TooltipPayload {
  value: number;
  name: string;
  dataKey: string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    return (
      <Box
        sx={{
          bgcolor: 'white',
          border: '1px solid #f1f5f9',
          borderRadius: 2,
          p: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          minWidth: 150,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
          {label}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            Validaciones:
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b' }}>
            {payload[0]?.value}
          </Typography>
        </Stack>
      </Box>
    );
  }
  return null;
};

const HourlyActivityChart: React.FC<HourlyActivityChartProps> = ({ data }) => {
  // Find peak hours
  const maxValue = Math.max(...data.map((d) => d.total));
  const peakHours = data.filter((d) => d.total === maxValue);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        elevation={0}
        sx={{
          background: 'white',
          border: '1px solid #f1f5f9',
          borderRadius: 3,
          height: '100%',
        }}
      >
        <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: alpha('#f59e0b', 0.1),
                color: '#f59e0b',
                width: 48,
                height: 48,
              }}
            >
              <Schedule sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Horarios Más Activos
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Distribución de validaciones por hora del día
              </Typography>
            </Box>
          </Stack>

          {peakHours.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>
                🔥 Hora pico: {peakHours.map(h => h.hora).join(', ')} ({maxValue} validaciones)
              </Typography>
            </Box>
          )}

          <Box sx={{ flex: 1, minHeight: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="hora" 
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  interval={1}
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  name="Validaciones"
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Activity insights */}
          <Box sx={{ mt: 2, p: 2, bgcolor: alpha('#f59e0b', 0.05), borderRadius: 2 }}>
            <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, display: 'block', mb: 1 }}>
              💡 Insights de Actividad
            </Typography>
            <Typography variant="caption" sx={{ color: '#78350f' }}>
              {maxValue > 0 
                ? `Tu comercio es más activo durante las ${peakHours[0]?.hora}. Considera optimizar tu personal durante estas horas.`
                : 'No hay suficientes datos para mostrar patrones de actividad.'
              }
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default HourlyActivityChart;