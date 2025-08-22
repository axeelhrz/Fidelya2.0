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
  Button,
  Stack,
  alpha,
  IconButton,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Badge,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Campaign,
  NotificationsActive,
  MarkEmailRead,
  Delete,
  Search,
  Refresh,
  Info,
  Warning,
  CheckCircle,
  Error,
  Star,
  Send,
  Analytics,
} from '@mui/icons-material';
import { useNotifications } from '@/hooks/useNotifications';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import EnhancedNotificationsCenter from './EnhancedNotificationsCenter';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const ComercioNotifications: React.FC = () => {
  const { notifications, stats, markAsRead, deleteNotification } = useNotifications();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'simple' | 'enhanced'>('enhanced');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = { fontSize: 20 as const };
    
    if (priority === 'high' || priority === 'urgent') {
      return <Error sx={{ ...iconProps, color: '#ef4444' }} />;
    }
    
    switch (type) {
      case 'system':
        return <Info sx={{ ...iconProps, color: '#6366f1' }} />;
      case 'validation':
        return <CheckCircle sx={{ ...iconProps, color: '#10b981' }} />;
      case 'benefit':
        return <Star sx={{ ...iconProps, color: '#f59e0b' }} />;
      case 'alert':
      case 'warning':
        return <Warning sx={{ ...iconProps, color: '#f59e0b' }} />;
      case 'success':
        return <CheckCircle sx={{ ...iconProps, color: '#10b981' }} />;
      case 'error':
        return <Error sx={{ ...iconProps, color: '#ef4444' }} />;
      default:
        return <NotificationsActive sx={{ ...iconProps, color: '#64748b' }} />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (tabValue) {
      case 0: // Todas
        return matchesSearch;
      case 1: // No leídas
        return matchesSearch && !notification.read;
      case 2: // Importantes
        return matchesSearch && (notification.priority === 'high' || notification.priority === 'urgent');
      case 3: // Leídas
        return matchesSearch && notification.read;
      default:
        return matchesSearch;
    }
  });

  const handleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  const handleMarkSelectedAsRead = () => {
    selectedNotifications.forEach(id => markAsRead(id));
    setSelectedNotifications([]);
  };

  const handleDeleteSelected = () => {
    selectedNotifications.forEach(id => deleteNotification(id));
    setSelectedNotifications([]);
  };

  const StatCard = ({ icon, value, label, color }: { 
    icon: React.ReactNode; 
    value: number; 
    label: string; 
    color: string; 
  }) => (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid #f1f5f9',
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        textAlign: 'center',
      }}
    >
      <Avatar
        sx={{
          width: 48,
          height: 48,
          bgcolor: alpha(color, 0.1),
          color: color,
          mx: 'auto',
          mb: 2,
        }}
      >
        {icon}
      </Avatar>
      <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
        {label}
      </Typography>
    </Paper>
  );

  // Si hay muchas notificaciones o el usuario prefiere la vista avanzada, mostrar el centro mejorado
  if (viewMode === 'enhanced' || notifications.length > 10) {
    return <EnhancedNotificationsCenter />;
  }

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
                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                boxShadow: '0 12px 40px rgba(236, 72, 153, 0.3)',
              }}
            >
              <Campaign sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                Centro de Notificaciones
              </Typography>
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
                Mantente al día con todas las actualizaciones
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={2}>
              <Button
                onClick={() => setViewMode(viewMode === 'simple' ? 'enhanced' : 'simple')}
                variant="outlined"
                startIcon={viewMode === 'simple' ? <Analytics /> : <NotificationsActive />}
                sx={{
                  borderColor: alpha('#6366f1', 0.3),
                  color: '#6366f1',
                  '&:hover': {
                    borderColor: '#6366f1',
                    bgcolor: alpha('#6366f1', 0.1),
                  },
                }}
              >
                {viewMode === 'simple' ? 'Vista Avanzada' : 'Vista Simple'}
              </Button>
              
              <IconButton
                onClick={() => window.location.reload()}
                sx={{
                  bgcolor: alpha('#ec4899', 0.1),
                  color: '#ec4899',
                  '&:hover': {
                    bgcolor: alpha('#ec4899', 0.2),
                    transform: 'rotate(180deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Refresh />
              </IconButton>
              
              {selectedNotifications.length > 0 && (
                <>
                  <Button
                    onClick={handleMarkSelectedAsRead}
                    variant="outlined"
                    startIcon={<MarkEmailRead />}
                    sx={{
                      borderColor: alpha('#10b981', 0.3),
                      color: '#10b981',
                      '&:hover': {
                        borderColor: '#10b981',
                        bgcolor: alpha('#10b981', 0.1),
                      },
                    }}
                  >
                    Marcar como leídas
                  </Button>
                  <Button
                    onClick={handleDeleteSelected}
                    variant="outlined"
                    startIcon={<Delete />}
                    sx={{
                      borderColor: alpha('#ef4444', 0.3),
                      color: '#ef4444',
                      '&:hover': {
                        borderColor: '#ef4444',
                        bgcolor: alpha('#ef4444', 0.1),
                      },
                    }}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </Stack>
          </Box>

          {/* Stats Cards */}
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
            <StatCard
              icon={<NotificationsActive />}
              value={stats.total}
              label="Total"
              color="#6366f1"
            />
            <StatCard
              icon={
                <Badge badgeContent={stats.unread} color="error">
                  <MarkEmailRead />
                </Badge>
              }
              value={stats.unread}
              label="Sin leer"
              color="#f59e0b"
            />
            <StatCard
              icon={<Warning />}
              value={stats.important}
              label="Importantes"
              color="#ef4444"
            />
            <StatCard
              icon={<CheckCircle />}
              value={stats.read}
              label="Leídas"
              color="#10b981"
            />
          </Box>

          {/* Upgrade Notice */}
          {notifications.length > 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6"
            >
              <Paper
                sx={{
                  p: 4,
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  borderRadius: 4,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ position: 'relative', zIndex: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    🚀 ¡Mejora tu experiencia!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                    Tienes {notifications.length} notificaciones. Usa nuestro Centro de Notificaciones Avanzado para una mejor gestión.
                  </Typography>
                  <Button
                    onClick={() => setViewMode('enhanced')}
                    variant="contained"
                    startIcon={<Send />}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.3)',
                      },
                    }}
                  >
                    Usar Centro Avanzado
                  </Button>
                </Box>
                <Box
                  sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 200,
                    height: 200,
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    borderRadius: '50%',
                  }}
                />
              </Paper>
            </motion.div>
          )}
        </Box>
      </motion.div>

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
          <CardContent sx={{ p: 0 }}>
            {/* Search and Filters */}
            <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  placeholder="Buscar notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  {selectedNotifications.length > 0 && `${selectedNotifications.length} seleccionadas`}
                </Typography>
              </Stack>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: '1px solid #f1f5f9' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                sx={{
                  px: 3,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                  },
                }}
              >
                <Tab 
                  label={
                    <Badge badgeContent={stats.total} color="primary" max={99}>
                      Todas
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={stats.unread} color="error" max={99}>
                      No leídas
                    </Badge>
                  } 
                />
                <Tab 
                  label={
                    <Badge badgeContent={stats.important} color="warning" max={99}>
                      Importantes
                    </Badge>
                  } 
                />
                <Tab label="Leídas" />
              </Tabs>
            </Box>

            {/* Notifications List */}
            <TabPanel value={tabValue} index={tabValue}>
              <List sx={{ p: 0 }}>
                {filteredNotifications.length === 0 ? (
                  <ListItem sx={{ py: 8, textAlign: 'center' }}>
                    <ListItemText
                      primary={
                        <Typography variant="h6" sx={{ color: '#94a3b8', mb: 1 }}>
                          No hay notificaciones
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                          {tabValue === 1 ? 'Todas las notificaciones están leídas' : 
                           tabValue === 2 ? 'No hay notificaciones importantes' :
                           'No se encontraron notificaciones'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ) : (
                  filteredNotifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                        sx={{
                          px: 3,
                          py: 2,
                          bgcolor: !notification.read ? alpha('#6366f1', 0.02) : 'transparent',
                          '&:hover': {
                            bgcolor: alpha('#6366f1', 0.05),
                          },
                        }}
                      >
                        <ListItemButton
                          onClick={() => handleSelectNotification(notification.id)}
                          sx={{
                            borderRadius: 2,
                            px: 2,
                            py: 1,
                          }}
                        >
                          <ListItemIcon>
                            <Box sx={{ position: 'relative' }}>
                              {getNotificationIcon(notification.type, notification.priority)}
                              {!notification.read && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: 8,
                                    height: 8,
                                    bgcolor: '#ef4444',
                                    borderRadius: '50%',
                                  }}
                                />
                              )}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: !notification.read ? 700 : 600,
                                    color: '#1e293b',
                                    flex: 1,
                                  }}
                                >
                                  {notification.title}
                                </Typography>
                                {(notification.priority === 'high' || notification.priority === 'urgent') && (
                                  <Chip
                                    label="Importante"
                                    size="small"
                                    sx={{
                                      bgcolor: alpha('#ef4444', 0.1),
                                      color: '#ef4444',
                                      fontSize: '0.7rem',
                                      height: 20,
                                    }}
                                  />
                                )}
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: '#94a3b8',
                                    fontWeight: 500,
                                  }}
                                >
                                  {format(notification.createdAt, 'dd/MM HH:mm', { locale: es })}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#64748b',
                                  fontSize: '0.85rem',
                                  lineHeight: 1.4,
                                }}
                              >
                                {notification.message}
                              </Typography>
                            }
                          />
                          <Box sx={{ ml: 2 }}>
                            {selectedNotifications.includes(notification.id) ? (
                              <CheckCircle sx={{ color: '#10b981', fontSize: 20 }} />
                            ) : (
                              <Box
                                sx={{
                                  width: 20,
                                  height: 20,
                                  border: '2px solid #e2e8f0',
                                  borderRadius: '50%',
                                }}
                              />
                            )}
                          </Box>
                        </ListItemButton>
                      </ListItem>
                      {index < filteredNotifications.length - 1 && (
                        <Divider sx={{ mx: 3 }} />
                      )}
                    </React.Fragment>
                  ))
                )}
              </List>
            </TabPanel>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
};