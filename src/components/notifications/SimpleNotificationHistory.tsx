'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Button,
} from '@mui/material';
import {
  History,
  Email,
  WhatsApp,
  Notifications,
  CheckCircle,
  Error,
  Schedule,
  Send,
  Refresh,
  Info,
  Warning,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { SimpleNotification } from '@/types/simple-notification';

const channelIcons = {
  email: <Email />,
  whatsapp: <WhatsApp />,
  app: <Notifications />
};

const channelColors = {
  email: '#1976d2',
  whatsapp: '#25d366',
  app: '#9c27b0'
};

const statusIcons = {
  draft: <Schedule />,
  sending: <Send />,
  sent: <CheckCircle />,
  failed: <Error />
};

const statusColors = {
  draft: '#757575',
  sending: '#ff9800',
  sent: '#4caf50',
  failed: '#f44336'
};

const typeIcons = {
  info: <Info />,
  success: <CheckCircle />,
  warning: <Warning />,
  error: <Error />
};

export const SimpleNotificationHistory: React.FC = () => {
  const { notifications, loading, loadNotifications } = useSimpleNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusLabel = (status: SimpleNotification['status']) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sending': return 'Enviando';
      case 'sent': return 'Enviada';
      case 'failed': return 'Falló';
      default: return status;
    }
  };

  const getTypeLabel = (type: SimpleNotification['type']) => {
    switch (type) {
      case 'info': return 'Información';
      case 'success': return 'Éxito';
      case 'warning': return 'Advertencia';
      case 'error': return 'Error';
      default: return type;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <History sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
                Historial de Notificaciones
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Revisa las notificaciones que has enviado
              </Typography>
            </Box>
          </Box>
          
          <Tooltip title="Actualizar">
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing}
              sx={{ color: 'white' }}
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
        </Box>
      </Paper>

      {/* Contenido */}
      <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>Cargando historial...</Typography>
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.100', width: 64, height: 64 }}>
                <History sx={{ fontSize: 32, color: 'grey.400' }} />
              </Avatar>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay notificaciones enviadas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Las notificaciones que envíes aparecerán aquí
              </Typography>
            </Box>
          ) : (
            <List>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ListItem sx={{ p: 3 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ 
                        bgcolor: statusColors[notification.status],
                        width: 48,
                        height: 48
                      }}>
                        {statusIcons[notification.status]}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {notification.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {typeIcons[notification.type]}
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 2, color: 'text.primary' }}>
                            {notification.message.length > 100 
                              ? `${notification.message.substring(0, 100)}...`
                              : notification.message
                            }
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Chip
                              icon={statusIcons[notification.status]}
                              label={getStatusLabel(notification.status)}
                              size="small"
                              sx={{
                                bgcolor: statusColors[notification.status],
                                color: 'white',
                                '& .MuiChip-icon': { color: 'white' }
                              }}
                            />
                            
                            <Chip
                              label={getTypeLabel(notification.type)}
                              size="small"
                              variant="outlined"
                            />
                            
                            <Typography variant="caption" color="text.secondary">
                              {notification.recipientIds.length} destinatario{notification.recipientIds.length !== 1 ? 's' : ''}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Canales:
                            </Typography>
                            {notification.channels.map(channel => (
                              <Tooltip key={channel} title={channel.toUpperCase()}>
                                <Avatar sx={{ 
                                  width: 20, 
                                  height: 20, 
                                  bgcolor: channelColors[channel]
                                }}>
                                  {React.cloneElement(channelIcons[channel], { sx: { fontSize: 12 } })}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </Box>
                          
                          <Typography variant="caption" color="text.secondary">
                            {format(notification.createdAt, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {index < notifications.length - 1 && <Divider />}
                </motion.div>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {notifications.length > 0 && (
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            startIcon={<Refresh />}
            variant="outlined"
            sx={{ borderRadius: 3 }}
          >
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
        </Box>
      )}
    </Box>
  );
};
