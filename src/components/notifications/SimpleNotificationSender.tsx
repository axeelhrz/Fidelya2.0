'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Paper,
  Avatar,
  Checkbox,
  FormControlLabel,
  Divider,
  Stack,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
} from '@mui/material';
import {
  Send,
  Email,
  WhatsApp,
  Notifications,
  Person,
  Business,
  AccountBalance,
  SelectAll,
  Search,
  Preview,
  CheckCircle,
  Error,
  Warning,
  Info,
} from '@mui/icons-material';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { 
  SimpleNotificationFormData, 
  SimpleNotificationChannel, 
  SimpleNotificationType,
} from '@/types/simple-notification';

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

const typeIcons = {
  info: <Info />,
  success: <CheckCircle />,
  warning: <Warning />,
  error: <Error />
};

const typeColors = {
  info: '#2196f3',
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336'
};

const recipientTypeIcons = {
  socio: <Person />,
  comercio: <Business />,
  asociacion: <AccountBalance />
};

export const SimpleNotificationSender: React.FC = () => {
  const {
    recipients,
    loading,
    sending,
    error,
    sendNotification,
    loadRecipients
  } = useSimpleNotifications();

  const [formData, setFormData] = useState<SimpleNotificationFormData>({
    title: '',
    message: '',
    type: 'info',
    channels: [],
    recipientIds: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipientType, setSelectedRecipientType] = useState<'all' | 'socio' | 'comercio' | 'asociacion'>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  interface NotificationResult {
    success: boolean;
    sentCount: number;
    failedCount: number;
    errors: string[];
  }

  const [lastResult, setLastResult] = useState<NotificationResult | null>(null);

  // Filtrar destinatarios
  const filteredRecipients = recipients.filter(recipient => {
    const matchesSearch = recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipient.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedRecipientType === 'all' || recipient.type === selectedRecipientType;
    return matchesSearch && matchesType;
  });

  const handleChannelToggle = (channel: SimpleNotificationChannel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const handleRecipientToggle = (recipientId: string) => {
    setFormData(prev => ({
      ...prev,
      recipientIds: prev.recipientIds.includes(recipientId)
        ? prev.recipientIds.filter(id => id !== recipientId)
        : [...prev.recipientIds, recipientId]
    }));
  };

  const handleSelectAll = () => {
    const allIds = filteredRecipients.map(r => r.id);
    setFormData(prev => ({
      ...prev,
      recipientIds: prev.recipientIds.length === allIds.length ? [] : allIds
    }));
  };

  const handleSend = async () => {
    const result = await sendNotification(formData);
    if (result) {
      setLastResult(result);
      if (result.success) {
        // Limpiar formulario si fue exitoso
        setFormData({
          title: '',
          message: '',
          type: 'info',
          channels: [],
          recipientIds: []
        });
      }
    }
  };

  const getPreviewContent = () => {
    const selectedRecipients = recipients.filter(r => formData.recipientIds.includes(r.id));
    
    return {
      title: formData.title || 'Título de la notificación',
      message: formData.message || 'Mensaje de la notificación',
      recipientCount: selectedRecipients.length,
      channels: formData.channels,
      recipients: selectedRecipients.slice(0, 5) // Mostrar solo los primeros 5
    };
  };

  const isFormValid = formData.title.trim() && 
                     formData.message.trim() && 
                     formData.channels.length > 0 && 
                     formData.recipientIds.length > 0;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Send sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              Enviar Notificación
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Envía notificaciones a tus socios por email, WhatsApp o dentro de la app
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert 
              severity={lastResult.success ? 'success' : 'error'} 
              sx={{ mb: 3, borderRadius: 3 }}
              onClose={() => setLastResult(null)}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                {lastResult.success ? 'Notificación Enviada' : 'Error al Enviar'}
              </Typography>
              <Typography variant="body2">
                {lastResult.success 
                  ? `${lastResult.sentCount} notificaciones enviadas exitosamente${lastResult.failedCount > 0 ? `, ${lastResult.failedCount} fallaron` : ''}`
                  : `${lastResult.failedCount} notificaciones fallaron`
                }
              </Typography>
              {lastResult.errors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {lastResult.errors.slice(0, 3).map((error: string, index: number) => (
                    <Typography key={index} variant="caption" display="block" sx={{ opacity: 0.8 }}>
                      • {error}
                    </Typography>
                  ))}
                  {lastResult.errors.length > 3 && (
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      ... y {lastResult.errors.length - 3} errores más
                    </Typography>
                  )}
                </Box>
              )}
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 400px' }, gap: 3 }}>
        {/* Formulario Principal */}
        <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
              Contenido de la Notificación
            </Typography>

            <Stack spacing={3}>
              {/* Tipo de notificación */}
              <FormControl fullWidth>
                <InputLabel>Tipo de Notificación</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as SimpleNotificationType 
                  }))}
                  sx={{ borderRadius: 3 }}
                >
                  {Object.entries(typeIcons).map(([type, icon]) => (
                    <MenuItem key={type} value={type}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ color: typeColors[type as SimpleNotificationType] }}>
                          {icon}
                        </Box>
                        <Typography sx={{ textTransform: 'capitalize' }}>
                          {type === 'info' ? 'Información' :
                           type === 'success' ? 'Éxito' :
                           type === 'warning' ? 'Advertencia' : 'Error'}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Título */}
              <TextField
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                fullWidth
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                placeholder="Ej: Nueva promoción disponible"
              />

              {/* Mensaje */}
              <TextField
                label="Mensaje"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                multiline
                rows={4}
                fullWidth
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                placeholder="Escribe aquí el contenido de tu notificación..."
              />

              {/* Canales */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>
                  Canales de Envío
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  {Object.entries(channelIcons).map(([channel, icon]) => (
                    <FormControlLabel
                      key={channel}
                      control={
                        <Checkbox
                          checked={formData.channels.includes(channel as SimpleNotificationChannel)}
                          onChange={() => handleChannelToggle(channel as SimpleNotificationChannel)}
                          sx={{ 
                            color: channelColors[channel as SimpleNotificationChannel],
                            '&.Mui-checked': { 
                              color: channelColors[channel as SimpleNotificationChannel] 
                            }
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ color: channelColors[channel as SimpleNotificationChannel] }}>
                            {icon}
                          </Box>
                          <Typography sx={{ textTransform: 'capitalize' }}>
                            {channel === 'email' ? 'Email' :
                             channel === 'whatsapp' ? 'WhatsApp' : 'App'}
                          </Typography>
                        </Box>
                      }
                    />
                  ))}
                </Stack>
              </Box>

              {/* Botones de acción */}
              <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
                <Button
                  onClick={() => setPreviewOpen(true)}
                  startIcon={<Preview />}
                  variant="outlined"
                  disabled={!formData.title || !formData.message}
                  sx={{ borderRadius: 3 }}
                >
                  Vista Previa
                </Button>
                <Button
                  onClick={handleSend}
                  startIcon={<Send />}
                  variant="contained"
                  disabled={!isFormValid || sending}
                  sx={{
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    flex: 1
                  }}
                >
                  {sending ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Panel de Destinatarios */}
        <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Destinatarios ({formData.recipientIds.length})
              </Typography>
              <Tooltip title="Actualizar lista">
                <IconButton onClick={loadRecipients} disabled={loading}>
                  <Search />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Filtros */}
            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                placeholder="Buscar destinatarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />

              <FormControl size="small" fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={selectedRecipientType}
                  onChange={(e) => setSelectedRecipientType(e.target.value as 'all' | 'socio' | 'comercio' | 'asociacion')}
                  sx={{ borderRadius: 3 }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="socio">Socios</MenuItem>
                  <MenuItem value="comercio">Comercios</MenuItem>
                  <MenuItem value="asociacion">Asociaciones</MenuItem>
                </Select>
              </FormControl>

              <Button
                onClick={handleSelectAll}
                startIcon={<SelectAll />}
                variant="outlined"
                size="small"
                sx={{ borderRadius: 3 }}
              >
                {formData.recipientIds.length === filteredRecipients.length ? 'Deseleccionar' : 'Seleccionar'} Todos
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* Lista de destinatarios */}
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <LinearProgress sx={{ mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Cargando destinatarios...
                  </Typography>
                </Box>
              ) : filteredRecipients.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron destinatarios
                  </Typography>
                </Box>
              ) : (
                <List dense>
                  {filteredRecipients.map((recipient) => (
                    <ListItem key={recipient.id} disablePadding>
                      <ListItemButton
                        onClick={() => handleRecipientToggle(recipient.id)}
                        sx={{ borderRadius: 2, mb: 0.5 }}
                      >
                        <Checkbox
                          checked={formData.recipientIds.includes(recipient.id)}
                          sx={{ mr: 1 }}
                        />
                        <ListItemAvatar>
                          <Avatar sx={{ 
                            bgcolor: recipient.type === 'socio' ? '#2196f3' : 
                                     recipient.type === 'comercio' ? '#ff9800' : '#9c27b0',
                            width: 32, 
                            height: 32 
                          }}>
                            {recipientTypeIcons[recipient.type]}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={recipient.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {recipient.type === 'socio' ? 'Socio' : 
                                 recipient.type === 'comercio' ? 'Comercio' : 'Asociación'}
                              </Typography>
                              {recipient.email && (
                                <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                                  📧 {recipient.email}
                                </Typography>
                              )}
                              {recipient.phone && (
                                <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                                  📱 {recipient.phone}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Dialog de Vista Previa */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: typeColors[formData.type] }}>
              {typeIcons[formData.type]}
            </Avatar>
            Vista Previa de la Notificación
          </Box>
        </DialogTitle>
        <DialogContent>
          {(() => {
            const preview = getPreviewContent();
            return (
              <Stack spacing={3}>
                {/* Información general */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Resumen
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                    <Typography variant="body2">
                      <strong>Destinatarios:</strong> {preview.recipientCount} personas
                    </Typography>
                    <Typography variant="body2">
                      <strong>Canales:</strong> {preview.channels.map(c => 
                        c === 'email' ? 'Email' : c === 'whatsapp' ? 'WhatsApp' : 'App'
                      ).join(', ')}
                    </Typography>
                  </Paper>
                </Box>

                {/* Vista previa del contenido */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Contenido
                  </Typography>
                  <Paper sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: typeColors[formData.type] }}>
                      {preview.title}
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {preview.message}
                    </Typography>
                  </Paper>
                </Box>

                {/* Canales seleccionados */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Se enviará por
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {preview.channels.map(channel => (
                      <Chip
                        key={channel}
                        icon={channelIcons[channel]}
                        label={channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'App'}
                        sx={{ 
                          bgcolor: channelColors[channel],
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Algunos destinatarios */}
                {preview.recipients.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Algunos destinatarios
                    </Typography>
                    <List dense>
                      {preview.recipients.map(recipient => (
                        <ListItem key={recipient.id}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {recipientTypeIcons[recipient.type]}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={recipient.name}
                            secondary={recipient.email || recipient.phone}
                          />
                        </ListItem>
                      ))}
                      {preview.recipientCount > 5 && (
                        <ListItem>
                          <ListItemText
                            primary={`... y ${preview.recipientCount - 5} más`}
                            sx={{ fontStyle: 'italic', opacity: 0.7 }}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                )}
              </Stack>
            );
          })()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Cerrar
          </Button>
          <Button
            onClick={() => {
              setPreviewOpen(false);
              handleSend();
            }}
            variant="contained"
            startIcon={<Send />}
            disabled={!isFormValid || sending}
          >
            Enviar Ahora
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading overlay */}
      {sending && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          bgcolor: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(4px)'
        }}>
          <LinearProgress 
            sx={{ 
              height: 4,
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }
            }} 
          />
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Enviando notificaciones...
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};
