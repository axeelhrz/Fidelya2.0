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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
} from '@mui/material';
import {
  LocalOffer,
  CheckCircle,
  Cancel,
  TrendingUp,
} from '@mui/icons-material';

interface TopBenefitsProps {
  data: Array<{
    id: string;
    nombre: string;
    asociacion: string;
    usos: number;
    estado: 'activo' | 'inactivo';
  }>;
}

export const TopBenefits: React.FC<TopBenefitsProps> = ({ data }) => {
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
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar
              sx={{
                bgcolor: alpha('#10b981', 0.1),
                color: '#10b981',
                width: 48,
                height: 48,
              }}
            >
              <LocalOffer sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                Ranking de Beneficios Más Usados
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Top 10 beneficios ordenados por cantidad de usos
              </Typography>
            </Box>
          </Stack>

          {data.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                      Ranking
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                      Beneficio
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                      Asociación
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                      Usos
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                      Estado
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((benefit, index) => (
                    <motion.tr
                      key={benefit.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <TableRow
                        sx={{
                          '&:hover': {
                            bgcolor: alpha('#10b981', 0.02),
                          },
                          ...(index < 3 && {
                            bgcolor: alpha('#f59e0b', 0.03),
                          }),
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              bgcolor: index === 0 ? '#f59e0b' : 
                                       index === 1 ? '#94a3b8' : 
                                       index === 2 ? '#cd7f32' : 
                                       alpha('#64748b', 0.1),
                              color: index < 3 ? 'white' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {index + 1}
                          </Box>
                          {index < 3 && (
                            <TrendingUp sx={{ fontSize: 16, color: '#f59e0b' }} />
                          )}
                        </Stack>
                      </TableCell>
                      
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#1e293b',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={benefit.nombre}
                        >
                          {benefit.nombre}
                        </Typography>
                      </TableCell>
                      
                      <TableCell>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#64748b',
                            bgcolor: alpha('#06b6d4', 0.1),
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 1,
                            fontWeight: 500,
                          }}
                        >
                          {benefit.asociacion}
                        </Typography>
                      </TableCell>
                      
                      <TableCell align="center">
                        <Chip
                          label={benefit.usos}
                          size="small"
                          sx={{
                            bgcolor: alpha('#10b981', 0.1),
                            color: '#059669',
                            fontWeight: 700,
                            minWidth: 50,
                          }}
                        />
                      </TableCell>
                      
                      <TableCell align="center">
                          <Chip
                            icon={benefit.estado === 'activo' ? 
                              <CheckCircle sx={{ fontSize: 14 }} /> : 
                              <Cancel sx={{ fontSize: 14 }} />
                            }
                            label={benefit.estado === 'activo' ? 'Activo' : 'Inactivo'}
                            size="small"
                            sx={{
                              bgcolor: benefit.estado === 'activo' ? 
                                alpha('#10b981', 0.1) : 
                                alpha('#ef4444', 0.1),
                              color: benefit.estado === 'activo' ? '#059669' : '#dc2626',
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                fontSize: 14,
                              }
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
                <LocalOffer sx={{ fontSize: 30 }} />
              </Avatar>
              <Typography variant="body2" sx={{ color: '#64748b', mb: 1 }}>
                No hay datos de uso de beneficios
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Los beneficios más utilizados aparecerán aquí
              </Typography>
            </Box>
          )}

          {data.length > 0 && (
            <Box sx={{ mt: 3, p: 3, bgcolor: alpha('#10b981', 0.05), borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: '#047857', fontWeight: 600, display: 'block', mb: 1 }}>
                🏆 Beneficio Estrella
              </Typography>
              <Typography variant="caption" sx={{ color: '#065f46' }}>
                &quot;{data[0]?.nombre}&quot; es tu beneficio más popular con {data[0]?.usos} usos. 
                ¡Considera crear ofertas similares para maximizar el engagement!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
