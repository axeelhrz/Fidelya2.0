'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
} from '@mui/material';
import {
  ShowChart,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ValidationsOverTimeProps {
  data: Array<{
    fecha: string;
    validaciones: number;
    exitosas: number;
    fallidas: number;
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

export const ValidationsOverTime: React.FC<ValidationsOverTimeProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const handleChartTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: 'area' | 'bar' | null,
  ) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

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
            minWidth: 200,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Stack key={index} direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: entry.color,
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {entry.name}
                </Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {entry.value}
              </Typography>
            </Stack>
          ))}
        </Box>
      );
    }
    return null;
  };

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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar
                sx={{
                  bgcolor: alpha('#06b6d4', 0.1),
                  color: '#06b6d4',
                  width: 48,
                  height: 48,
                }}
              >
                <ShowChart sx={{ fontSize: 24 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                  Validaciones por Día
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Tendencia de validaciones en el período seleccionado
                </Typography>
              </Box>
            </Stack>

            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={handleChartTypeChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  '&.Mui-selected': {
                    bgcolor: '#06b6d4',
                    color: 'white',
                    '&:hover': {
                      bgcolor: '#0891b2',
                    },
                  },
                  '&:hover': {
                    bgcolor: alpha('#06b6d4', 0.1),
                  },
                },
              }}
            >
              <ToggleButton value="area">
                <ShowChart sx={{ fontSize: 18 }} />
              </ToggleButton>
              <ToggleButton value="bar">
                <BarChartIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Box sx={{ flex: 1, minHeight: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="validacionesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="exitosasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="fallidasGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="validaciones"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    fill="url(#validacionesGradient)"
                    name="Total Validaciones"
                  />
                  <Area
                    type="monotone"
                    dataKey="exitosas"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#exitosasGradient)"
                    name="Exitosas"
                  />
                  <Area
                    type="monotone"
                    dataKey="fallidas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fill="url(#fallidasGradient)"
                    name="Fallidas"
                  />
                </AreaChart>
              ) : (
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="exitosas"
                    fill="#10b981"
                    radius={[2, 2, 0, 0]}
                    name="Exitosas"
                  />
                  <Bar
                    dataKey="fallidas"
                    fill="#ef4444"
                    radius={[2, 2, 0, 0]}
                    name="Fallidas"
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};