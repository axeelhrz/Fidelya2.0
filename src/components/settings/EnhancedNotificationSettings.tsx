'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardHeader,
  Button,
  Switch,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Divider,
  Stack,
  Slider,
  FormControlLabel,
  Checkbox,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Settings,
  Email,
  Sms,
  NotificationsActive,
  PhoneAndroid,
  Speed,
  Security,
  Add,
  Edit,
  Save,
  AccessTime,
  FilterList,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'app';
  enabled: boolean;
  config: ChannelConfig;
  limits: ChannelLimits;
  templates: string[];
}

interface ChannelConfig {
  provider?: string;
  apiKey?: string;
  fromAddress?: string;
  fromName?: string;
  replyTo?: string;
  webhookUrl?: string;
  retryAttempts: number;
  retryDelay: number; // en minutos
  timeout: number; // en segundos
  priority: 'low' | 'normal' | 'high';
  batchSize: number;
  throttleRate: number; // mensajes por minuto
}

interface ChannelLimits {
  dailyLimit: number;
  hourlyLimit: number;
  perUserLimit: number;
  cooldownPeriod: number; // en minutos
  maxRecipients: number;
}

interface NotificationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
}

interface RuleCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: string | number | boolean;
}

interface RuleAction {
  type: 'block' | 'throttle' | 'redirect' | 'modify' | 'approve';
  parameters: Record<string, unknown>;
}

interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  days: string[];
  exceptions: string[]; // IDs de usuarios que pueden recibir notificaciones
}

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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function EnhancedNotificationSettings() {
  useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'America/Mexico_City',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    exceptions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  // const [ruleDialogOpen, setRuleDialogOpen] = useState(false);

  // Cargar configuración inicial
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular carga de configuración
      const defaultChannels: NotificationChannel[] = [
        {
          id: 'email',
          name: 'Email',
          type: 'email',
          enabled: true,
          config: {
            provider: 'sendgrid',
            fromAddress: 'noreply@asociacion.com',
            fromName: 'Mi Asociación',
            replyTo: 'support@asociacion.com',
            retryAttempts: 3,
            retryDelay: 5,
            timeout: 30,
            priority: 'normal',
            batchSize: 100,
            throttleRate: 60
          },
          limits: {
            dailyLimit: 10000,
            hourlyLimit: 1000,
            perUserLimit: 50,
            cooldownPeriod: 5,
            maxRecipients: 1000
          },
          templates: ['welcome', 'notification', 'reminder']
        },
        {
          id: 'sms',
          name: 'SMS',
          type: 'sms',
          enabled: true,
          config: {
            provider: 'twilio',
            retryAttempts: 2,
            retryDelay: 2,
            timeout: 15,
            priority: 'high',
            batchSize: 50,
            throttleRate: 30
          },
          limits: {
            dailyLimit: 1000,
            hourlyLimit: 100,
            perUserLimit: 10,
            cooldownPeriod: 15,
            maxRecipients: 100
          },
          templates: ['alert', 'reminder']
        },
        {
          id: 'push',
          name: 'Push Notifications',
          type: 'push',
          enabled: true,
          config: {
            provider: 'firebase',
            retryAttempts: 3,
            retryDelay: 1,
            timeout: 10,
            priority: 'normal',
            batchSize: 500,
            throttleRate: 120
          },
          limits: {
            dailyLimit: 50000,
            hourlyLimit: 5000,
            perUserLimit: 100,
            cooldownPeriod: 1,
            maxRecipients: 10000
          },
          templates: ['news', 'alert', 'promotion']
        },
        {
          id: 'app',
          name: 'In-App Notifications',
          type: 'app',
          enabled: true,
          config: {
            retryAttempts: 1,
            retryDelay: 0,
            timeout: 5,
            priority: 'low',
            batchSize: 1000,
            throttleRate: 300
          },
          limits: {
            dailyLimit: 100000,
            hourlyLimit: 10000,
            perUserLimit: 200,
            cooldownPeriod: 0,
            maxRecipients: 50000
          },
          templates: ['info', 'update', 'reminder']
        }
      ];

      const defaultRules: NotificationRule[] = [
        {
          id: 'spam-protection',
          name: 'Protección Anti-Spam',
          description: 'Bloquea notificaciones excesivas al mismo usuario',
          enabled: true,
          conditions: [
            {
              field: 'recipient_notifications_last_hour',
              operator: 'greater_than',
              value: 10
            }
          ],
          actions: [
            {
              type: 'throttle',
              parameters: { delay: 60 }
            }
          ],
          priority: 1
        },
        {
          id: 'high-priority-bypass',
          name: 'Bypass para Alta Prioridad',
          description: 'Permite que notificaciones urgentes bypaseen límites',
          enabled: true,
          conditions: [
            {
              field: 'priority',
              operator: 'equals',
              value: 'urgent'
            }
          ],
          actions: [
            {
              type: 'modify',
              parameters: { bypass_limits: true }
            }
          ],
          priority: 0
        }
      ];

      setChannels(defaultChannels);
      setRules(defaultRules);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Configuración guardada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChannelToggle = (channelId: string) => {
    setChannels(prev => prev.map(channel => 
      channel.id === channelId 
        ? { ...channel, enabled: !channel.enabled }
        : channel
    ));
  };

  const handleEditChannel = (channel: NotificationChannel) => {
    setEditingChannel({ ...channel });
    setChannelDialogOpen(true);
  };

  const handleSaveChannel = () => {
    if (!editingChannel) return;

    setChannels(prev => prev.map(channel => 
      channel.id === editingChannel.id ? editingChannel : channel
    ));
    
    setChannelDialogOpen(false);
    setEditingChannel(null);
  };

  const handleRuleToggle = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId 
        ? { ...rule, enabled: !rule.enabled }
        : rule
    ));
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Email />;
      case 'sms': return <Sms />;
      case 'push': return <NotificationsActive />;
      case 'app': return <PhoneAndroid />;
      default: return <Settings />;
    }
  };

  const getChannelColor = (type: string) => {
    switch (type) {
      case 'email': return '#1976d2';
      case 'sms': return '#388e3c';
      case 'push': return '#f57c00';
      case 'app': return '#7b1fa2';
      default: return '#666';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Configuración Avanzada de Notificaciones
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gestiona canales, reglas y configuraciones del sistema de notificaciones
        </Typography>
      </Box>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Canales" icon={<Settings />} />
          <Tab label="Reglas" icon={<FilterList />} />
          <Tab label="Horarios" icon={<AccessTime />} />
          <Tab label="Límites" icon={<Speed />} />
          <Tab label="Seguridad" icon={<Security />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        {/* Canales de Notificación */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {channels.map((channel) => (
            <motion.div
              key={channel.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  avatar={
                    <Box sx={{ color: getChannelColor(channel.type) }}>
                      {getChannelIcon(channel.type)}
                    </Box>
                  }
                  title={channel.name}
                  subheader={`Tipo: ${channel.type.toUpperCase()}`}
                  action={
                    <Stack direction="row" spacing={1}>
                      <Switch
                        checked={channel.enabled}
                        onChange={() => handleChannelToggle(channel.id)}
                        color="primary"
                      />
                      <IconButton onClick={() => handleEditChannel(channel)}>
                        <Edit />
                      </IconButton>
                    </Stack>
                  }
                />
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Configuración
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip size="small" label={`Proveedor: ${channel.config.provider || 'N/A'}`} />
                        <Chip size="small" label={`Reintentos: ${channel.config.retryAttempts}`} />
                        <Chip size="small" label={`Lote: ${channel.config.batchSize}`} />
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Límites
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Chip size="small" label={`Diario: ${channel.limits.dailyLimit.toLocaleString()}`} />
                        <Chip size="small" label={`Por hora: ${channel.limits.hourlyLimit.toLocaleString()}`} />
                        <Chip size="small" label={`Por usuario: ${channel.limits.perUserLimit}`} />
                      </Stack>
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Plantillas disponibles
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {channel.templates.map((template) => (
                          <Chip key={template} size="small" variant="outlined" label={template} />
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Reglas de Notificación */}
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Reglas de Procesamiento</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              // onClick={() => setRuleDialogOpen(true)}
              disabled
            >
              Nueva Regla
            </Button>
          </Box>

          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {rule.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rule.description}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip 
                      size="small" 
                      label={`Prioridad: ${rule.priority}`} 
                      color={rule.priority === 0 ? 'error' : rule.priority === 1 ? 'warning' : 'default'}
                    />
                    <Switch
                      checked={rule.enabled}
                      onChange={() => handleRuleToggle(rule.id)}
                    />
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                  </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Condiciones
                    </Typography>
                    {rule.conditions.map((condition, index) => (
                      <Chip
                        key={index}
                        size="small"
                        label={`${condition.field} ${condition.operator} ${condition.value}`}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Acciones
                    </Typography>
                    {rule.actions.map((action, index) => (
                      <Chip
                        key={index}
                        size="small"
                        variant="outlined"
                        label={action.type}
                        sx={{ mr: 1, mb: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Horarios Silenciosos */}
        <Card>
          <CardHeader
            title="Horarios Silenciosos"
            subheader="Configura períodos donde las notificaciones no críticas se pausan"
            action={
              <Switch
                checked={quietHours.enabled}
                onChange={(e) => setQuietHours(prev => ({ ...prev, enabled: e.target.checked }))}
              />
            }
          />
          <CardContent>
            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <TextField
                  label="Hora de inicio"
                  type="time"
                  value={quietHours.startTime}
                  onChange={(e) => setQuietHours(prev => ({ ...prev, startTime: e.target.value }))}
                  disabled={!quietHours.enabled}
                  fullWidth
                />
                <TextField
                  label="Hora de fin"
                  type="time"
                  value={quietHours.endTime}
                  onChange={(e) => setQuietHours(prev => ({ ...prev, endTime: e.target.value }))}
                  disabled={!quietHours.enabled}
                  fullWidth
                />
                <FormControl fullWidth disabled={!quietHours.enabled}>
                  <InputLabel>Zona horaria</InputLabel>
                  <Select
                    value={quietHours.timezone}
                    onChange={(e) => setQuietHours(prev => ({ ...prev, timezone: e.target.value }))}
                  >
                    <MenuItem value="America/Mexico_City">Ciudad de México</MenuItem>
                    <MenuItem value="America/New_York">Nueva York</MenuItem>
                    <MenuItem value="Europe/Madrid">Madrid</MenuItem>
                    <MenuItem value="Asia/Tokyo">Tokio</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Días de la semana
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {[
                    { key: 'monday', label: 'Lun' },
                    { key: 'tuesday', label: 'Mar' },
                    { key: 'wednesday', label: 'Mié' },
                    { key: 'thursday', label: 'Jue' },
                    { key: 'friday', label: 'Vie' },
                    { key: 'saturday', label: 'Sáb' },
                    { key: 'sunday', label: 'Dom' }
                  ].map((day) => (
                    <FormControlLabel
                      key={day.key}
                      control={
                        <Checkbox
                          checked={quietHours.days.includes(day.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQuietHours(prev => ({ 
                                ...prev, 
                                days: [...prev.days, day.key] 
                              }));
                            } else {
                              setQuietHours(prev => ({ 
                                ...prev, 
                                days: prev.days.filter(d => d !== day.key) 
                              }));
                            }
                          }}
                          disabled={!quietHours.enabled}
                        />
                      }
                      label={day.label}
                    />
                  ))}
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Límites Globales */}
        <Stack spacing={3}>
          <Typography variant="h6">Límites Globales del Sistema</Typography>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Límites de Velocidad
              </Typography>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Notificaciones por minuto (global)
                  </Typography>
                  <Slider
                    value={1000}
                    min={100}
                    max={5000}
                    step={100}
                    marks
                    valueLabelDisplay="on"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Máximo de destinatarios por notificación
                  </Typography>
                  <Slider
                    value={10000}
                    min={100}
                    max={50000}
                    step={1000}
                    marks
                    valueLabelDisplay="on"
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Límites de Almacenamiento
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Historial de notificaciones</Typography>
                  <Typography variant="body2" color="primary">90 días</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Logs de entrega</Typography>
                  <Typography variant="body2" color="primary">30 días</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Métricas de rendimiento</Typography>
                  <Typography variant="body2" color="primary">1 año</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        {/* Configuración de Seguridad */}
        <Stack spacing={3}>
          <Typography variant="h6">Configuración de Seguridad</Typography>
          
          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Autenticación y Autorización
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Requerir autenticación para envío de notificaciones"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Validar permisos de usuario por segmento"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Requerir aprobación para notificaciones masivas"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Auditar todas las acciones de notificación"
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                Protección de Datos
              </Typography>
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Encriptar contenido de notificaciones sensibles"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Anonimizar datos en logs después de 30 días"
                />
                <FormControlLabel
                  control={<Switch />}
                  label="Permitir opt-out automático"
                />
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Validar direcciones de email antes del envío"
                />
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      {/* Botones de acción */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
        <Button
          variant="outlined"
          onClick={loadSettings}
          startIcon={<Refresh />}
          disabled={loading}
        >
          Recargar
        </Button>
        <Button
          variant="contained"
          onClick={handleSaveSettings}
          startIcon={<Save />}
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Box>

      {/* Dialog para editar canal */}
      <Dialog
        open={channelDialogOpen}
        onClose={() => setChannelDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configurar Canal: {editingChannel?.name}
        </DialogTitle>
        <DialogContent>
          {editingChannel && (
            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Nombre del canal"
                value={editingChannel.name}
                onChange={(e) => setEditingChannel(prev => prev ? { ...prev, name: e.target.value } : null)}
                fullWidth
              />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  label="Reintentos"
                  type="number"
                  value={editingChannel.config.retryAttempts}
                  onChange={(e) => setEditingChannel(prev => prev ? {
                    ...prev,
                    config: { ...prev.config, retryAttempts: parseInt(e.target.value) }
                  } : null)}
                />
                <TextField
                  label="Delay entre reintentos (min)"
                  type="number"
                  value={editingChannel.config.retryDelay}
                  onChange={(e) => setEditingChannel(prev => prev ? {
                    ...prev,
                    config: { ...prev.config, retryDelay: parseInt(e.target.value) }
                  } : null)}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                <TextField
                  label="Límite diario"
                  type="number"
                  value={editingChannel.limits.dailyLimit}
                  onChange={(e) => setEditingChannel(prev => prev ? {
                    ...prev,
                    limits: { ...prev.limits, dailyLimit: parseInt(e.target.value) }
                  } : null)}
                />
                <TextField
                  label="Límite por hora"
                  type="number"
                  value={editingChannel.limits.hourlyLimit}
                  onChange={(e) => setEditingChannel(prev => prev ? {
                    ...prev,
                    limits: { ...prev.limits, hourlyLimit: parseInt(e.target.value) }
                  } : null)}
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChannelDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveChannel} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}