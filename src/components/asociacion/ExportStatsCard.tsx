'use client';

import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  alpha,
  Chip,
  Stack,
} from '@mui/material';
import {
  Assessment,
  Storage,
  Timeline,
  TrendingUp,
  DataUsage,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

interface ExportStatsCardProps {
  totalRecords: number;
  filteredRecords: number;
  selectedFields: number;
  totalFields: number;
  estimatedSize: string;
  format: string;
}

export const ExportStatsCard: React.FC<ExportStatsCardProps> = ({
  totalRecords,
  filteredRecords,
  selectedFields,
  totalFields,
  estimatedSize,
  format
}) => {
  const stats = [
    {
      label: 'Registros Totales',
      value: totalRecords.toLocaleString(),
      icon: <Assessment />,
      color: '#6366f1',
      description: 'Total de socios en la base de datos'
    },
    {
      label: 'Para Exportar',
      value: filteredRecords.toLocaleString(),
      icon: <TrendingUp />,
      color: '#10b981',
      description: 'Registros que serán incluidos'
    },
    {
      label: 'Campos Seleccionados',
      value: `${selectedFields}/${totalFields}`,
      icon: <DataUsage />,
      color: '#f59e0b',
      description: 'Campos de datos incluidos'
    },
    {
      label: 'Tamaño Estimado',
      value: estimatedSize,
      icon: <Storage />,
      color: '#8b5cf6',
      description: 'Tamaño aproximado del archivo'
    }
  ];

  const completionPercentage = totalRecords > 0 ? Math.round((filteredRecords / totalRecords) * 100) : 0;
  const fieldsPercentage = totalFields > 0 ? Math.round((selectedFields / totalFields) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid #f1f5f9',
          borderRadius: 5,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Avatar
              sx={{
                bgcolor: alpha('#6366f1', 0.1),
                color: '#6366f1',
                borderRadius: 3,
              }}
            >
              <Timeline />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Estadísticas de Exportación
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Resumen de los datos a exportar
              </Typography>
            </Box>
          </Box>

          {/* CSS Grid Layout for Stats */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
              },
              gap: 3,
              mb: 4,
            }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    bgcolor: alpha(stat.color, 0.05),
                    border: `1px solid ${alpha(stat.color, 0.1)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: alpha(stat.color, 0.08),
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: alpha(stat.color, 0.1),
                        color: stat.color,
                        borderRadius: 2,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: stat.color, mb: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    {stat.description}
                  </Typography>
                </Box>
              </motion.div>
            ))}
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#64748b', mb: 2 }}>
              Progreso de Configuración
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Datos Filtrados
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                    {completionPercentage}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 6,
                    bgcolor: alpha('#10b981', 0.1),
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${completionPercentage}%`,
                      bgcolor: '#10b981',
                      borderRadius: 3,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Campos Seleccionados
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 700 }}>
                    {fieldsPercentage}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 6,
                    bgcolor: alpha('#f59e0b', 0.1),
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${fieldsPercentage}%`,
                      bgcolor: '#f59e0b',
                      borderRadius: 3,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #f1f5f9' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label={`Formato: ${format.toUpperCase()}`}
                size="small"
                sx={{
                  bgcolor: alpha('#6366f1', 0.1),
                  color: '#6366f1',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`${filteredRecords} registros`}
                size="small"
                sx={{
                  bgcolor: alpha('#10b981', 0.1),
                  color: '#10b981',
                  fontWeight: 600,
                }}
              />
              <Chip
                label={`${selectedFields} campos`}
                size="small"
                sx={{
                  bgcolor: alpha('#f59e0b', 0.1),
                  color: '#f59e0b',
                  fontWeight: 600,
                }}
              />
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};