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
  Divider,
  alpha,
} from '@mui/material';
import {
  PieChart as PieChartIcon,
  Business,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface ByAssociationChartProps {
  data: Array<{
    name: string;
    value: number;
    percentage: number;
    color: string;
  }>;
}

export const ByAssociationChart: React.FC<ByAssociationChartProps> = ({ data }) => {
  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
      payload: {
        name: string;
        value: number;
        percentage: number;
        color: string;
      };
    }>;
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box
          sx={{
            bgcolor: 'white',
            border: '1px solid #f1f5f9',
            borderRadius: 2,
            p: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            minWidth: 180,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', mb: 1 }}>
            {data.name}
          </Typography>
          <Stack spacing={0.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Validaciones:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {data.value}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Porcentaje:
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {data.percentage.toFixed(1)}%
              </Typography>
            </Stack>
          </Stack>
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
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: alpha('#8b5cf6', 0.1),
                color: '#8b5cf6',
                width: 48,
                height: 48,
              }}
            >
              <PieChartIcon sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Uso por Asociación
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Distribución de validaciones por asociación
              </Typography>
            </Box>
          </Stack>

          {data.length > 0 ? (
            <>
              <Box sx={{ flex: 1, minHeight: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 2 }}>
                  Desglose por Asociación
                </Typography>
                <Stack spacing={1.5}>
                  {data.slice(0, 4).map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              bgcolor: item.color,
                              flexShrink: 0,
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#64748b',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.name}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {item.value}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', minWidth: 35, textAlign: 'right' }}>
                            {item.percentage.toFixed(1)}%
                          </Typography>
                        </Stack>
                      </Stack>
                    </motion.div>
                  ))}
                </Stack>
              </Box>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
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
                <Business sx={{ fontSize: 30 }} />
              </Avatar>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                No hay datos de asociaciones
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Las validaciones aparecerán aquí cuando estén disponibles
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
