'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Card,
  CardContent,
  Button,
  Stack,
  alpha,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  LocalOffer,
  QrCode,
  Receipt,
  Add,
  Refresh,
  CheckCircle,
  TrendingUp,
  Store,
} from '@mui/icons-material';
import { BeneficiosManagement } from './BeneficiosManagement';
import { QRManagement } from './QRManagement';
import { ValidacionesHistory } from './ValidacionesHistory';
import { ComercioProfile } from './ComercioProfile';
import { useBeneficios } from '@/hooks/useBeneficios';
import { useValidaciones } from '@/hooks/useValidaciones';

interface ComercioOperacionesProps {
  section: string;
}

export const ComercioOperaciones: React.FC<ComercioOperacionesProps> = ({ section }) => {
  const { beneficios } = useBeneficios();
  const activeBeneficios = beneficios.filter(b => b.activo);
  const { validaciones, getStats } = useValidaciones();
  const stats = getStats();

  // Calculate today's validations
  const getValidacionesHoy = () => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return validaciones.filter(v => v.fechaHora.toDate() >= startOfDay).length;
  };

  const getSectionConfig = () => {
    switch (section) {
      case 'perfil':
        return {
          title: 'Mi Comercio',
          subtitle: 'Gestiona tu perfil y configuración',
          icon: <Store sx={{ fontSize: 32 }} />,
          color: '#10b981',
          gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        };
      case 'beneficios':
        return {
          title: 'Gestión de Beneficios',
          subtitle: 'Administra tus ofertas y promociones',
          icon: <LocalOffer sx={{ fontSize: 32 }} />,
          color: '#f59e0b',
          gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        };
      case 'qr-validacion':
      case 'validaciones':
        return {
          title: 'Validación QR',
          subtitle: 'Escanea y valida códigos QR',
          icon: <QrCode sx={{ fontSize: 32 }} />,
          color: '#ec4899',
          gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
        };
      case 'historial-validaciones':
        return {
          title: 'Historial de Validaciones',
          subtitle: 'Registro completo de transacciones',
          icon: <Receipt sx={{ fontSize: 32 }} />,
          color: '#8b5cf6',
          gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        };
      default:
        return {
          title: 'Centro de Operaciones',
          subtitle: 'Gestión integral del comercio',
          icon: <LocalOffer sx={{ fontSize: 32 }} />,
          color: '#6366f1',
          gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        };
    }
  };

  const config = getSectionConfig();

  const renderOperationsOverview = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Quick Stats */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: '1px solid #f1f5f9',
          borderRadius: 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
          Resumen Operativo
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: 3,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
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
              <LocalOffer />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
              {activeBeneficios.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Beneficios Activos
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha('#10b981', 0.1),
                color: '#10b981',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Receipt />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
              {stats.totalValidaciones}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Total Validaciones
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha('#6366f1', 0.1),
                color: '#6366f1',
                mx: 'auto',
                mb: 2,
              }}
            >
              <TrendingUp />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
              {getValidacionesHoy()}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Validaciones Hoy
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha('#ec4899', 0.1),
                color: '#ec4899',
                mx: 'auto',
                mb: 2,
              }}
            >
              <QrCode />
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
              1
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
              Código QR Activo
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Actions and Recent Activity */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 4,
        }}
      >
        {/* Quick Actions */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid #f1f5f9',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            height: 'fit-content',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
              Acciones Rápidas
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                fullWidth
                sx={{
                  py: 2,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Crear Nuevo Beneficio
              </Button>
              <Button
                variant="outlined"
                startIcon={<QrCode />}
                fullWidth
                sx={{
                  py: 2,
                  borderColor: alpha('#ec4899', 0.3),
                  color: '#ec4899',
                  '&:hover': {
                    borderColor: '#ec4899',
                    bgcolor: alpha('#ec4899', 0.1),
                  },
                }}
              >
                Validar Código QR
              </Button>
              <Button
                variant="outlined"
                startIcon={<Receipt />}
                fullWidth
                sx={{
                  py: 2,
                  borderColor: alpha('#8b5cf6', 0.3),
                  color: '#8b5cf6',
                  '&:hover': {
                    borderColor: '#8b5cf6',
                    bgcolor: alpha('#8b5cf6', 0.1),
                  },
                }}
              >
                Ver Historial
              </Button>
            </Stack>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid #f1f5f9',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            height: 'fit-content',
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
              Actividad Reciente
            </Typography>
            <List sx={{ p: 0 }}>
              {validaciones.slice(0, 3).map((validacion, index) => (
                <React.Fragment key={validacion.id || index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha('#10b981', 0.1),
                          color: '#10b981',
                        }}
                      >
                        <CheckCircle sx={{ fontSize: 18 }} />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          Validación completada
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {validacion.fechaHora.toDate().toLocaleString()}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < 2 && <Divider />}
                </React.Fragment>
              ))}
              {validaciones.length === 0 && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ color: '#94a3b8', textAlign: 'center' }}>
                        No hay actividad reciente
                      </Typography>
                    }
                  />
                </ListItem>
              )}
            </List>
          </CardContent>
        </Card>
      </Box>

      {/* System Status */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          border: '1px solid #f1f5f9',
          borderRadius: 4,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 3 }}>
          Estado del Sistema
        </Typography>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle sx={{ color: '#10b981', fontSize: 24 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Sistema de Validación
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981' }}>
                Operativo
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle sx={{ color: '#10b981', fontSize: 24 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Gestión de Beneficios
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981' }}>
                Operativo
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CheckCircle sx={{ color: '#10b981', fontSize: 24 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Sincronización
              </Typography>
              <Typography variant="caption" sx={{ color: '#10b981' }}>
                Actualizado
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );

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
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {section === 'perfil' && <ComercioProfile />}
        {section === 'beneficios' && <BeneficiosManagement />}
        {(section === 'qr-validacion' || section === 'validaciones') && <QRManagement />}
        {section === 'historial-validaciones' && <ValidacionesHistory />}
        {section === 'operaciones' && renderOperationsOverview()}
      </motion.div>
    </Container>
  );
};