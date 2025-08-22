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
  Chip,
  alpha,
  Divider,
} from '@mui/material';
import {
  CalendarToday,
  LocalFireDepartment,
  TrendingUp,
} from '@mui/icons-material';

interface TopDaysListProps {
  data: Array<{
    fecha: string;
    validaciones: number;
    isRecord: boolean;
  }>;
}

export const TopDaysList: React.FC<TopDaysListProps> = ({ data }) => {
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
                bgcolor: alpha('#ec4899', 0.1),
                color: '#ec4899',
                width: 48,
                height: 48,
              }}
            >
              <CalendarToday sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Días Más Activos
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Ranking de días con más validaciones
              </Typography>
            </Box>
          </Stack>

          {data.length > 0 ? (
            <Stack spacing={2} sx={{ flex: 1 }}>
              {data.map((day, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Box
                    sx={{
                      p: 2.5,
                      border: '1px solid #f1f5f9',
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      '&:hover': {
                        borderColor: '#ec4899',
                        transform: 'translateX(4px)',
                        boxShadow: '0 4px 20px rgba(236, 72, 153, 0.1)',
                      },
                      ...(day.isRecord && {
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(236, 72, 153, 0.02) 100%)',
                        borderColor: '#ec4899',
                      }),
                    }}
                  >
                    {/* Ranking number */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -10,
                        left: -10,
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : '#cd7f32',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        border: '2px solid white',
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {day.fecha}
                          </Typography>
                          {day.isRecord && (
                            <Chip
                              icon={<LocalFireDepartment sx={{ fontSize: 14 }} />}
                              label="Récord"
                              size="small"
                              sx={{
                                bgcolor: alpha('#ef4444', 0.1),
                                color: '#dc2626',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                                '& .MuiChip-icon': {
                                  fontSize: 12,
                                }
                              }}
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {day.validaciones} validaciones
                        </Typography>
                      </Box>

                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: alpha('#ec4899', 0.1),
                          color: '#ec4899',
                        }}
                      >
                        <TrendingUp sx={{ fontSize: 18 }} />
                      </Avatar>
                    </Stack>

                    {/* Progress bar */}
                    <Box sx={{ mt: 2 }}>
                      <Box
                        sx={{
                          height: 4,
                          bgcolor: alpha('#ec4899', 0.1),
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(day.validaciones / Math.max(...data.map(d => d.validaciones))) * 100}%` }}
                          transition={{ duration: 1, delay: index * 0.1 }}
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #ec4899 0%, #be185d 100%)',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>
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
                <CalendarToday sx={{ fontSize: 30 }} />
              </Avatar>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                No hay datos de días activos
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Los días con más actividad aparecerán aquí
              </Typography>
            </Box>
          )}

          {data.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 2, bgcolor: alpha('#ec4899', 0.05), borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#be185d', fontWeight: 600, display: 'block', mb: 1 }}>
                  📊 Análisis de Tendencias
                </Typography>
                <Typography variant="caption" sx={{ color: '#9d174d' }}>
                  {data[0]?.fecha} fue tu día más activo con {data[0]?.validaciones} validaciones.
                </Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
