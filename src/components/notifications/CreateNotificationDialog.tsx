'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  Avatar,
  Paper,
  Divider,
  CircularProgress,
  FormControlLabel,
  Switch,
  Autocomplete,
  alpha,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send,
  Close,
  AutoAwesome,
  Preview,
  People,
  PersonSearch,
  CheckCircle,
  Warning,
  Info,
  Error as ErrorIcon,
  Announcement,
  Email,
  Sms,
  PhoneAndroid,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  notificationTemplatesService,
  NotificationTemplate,
} from '@/services/notification-templates.service';
import { notificationService } from '@/services/notifications.service';
import { notificationQueueService } from '@/services/notification-queue.service';
import { NotificationType } from '@/types/notification';
import { useSocios } from '@/hooks/useSocios';
import { useAuth } from '@/hooks/useAuth';

interface CreateNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type RecipientFilter = 'todos' | 'al_dia' | 'vencidos' | 'elegir';

const typeConfig = {
  info: { icon: <Info />, color: '#3b82f6', label: 'Información' },
  success: { icon: <CheckCircle />, color: '#10b981', label: 'Éxito' },
  warning: { icon: <Warning />, color: '#f59e0b', label: 'Advertencia' },
  error: { icon: <ErrorIcon />, color: '#ef4444', label: 'Error' },
  announcement: { icon: <Announcement />, color: '#8b5cf6', label: 'Anuncio' },
};

export const CreateNotificationDialog: React.FC<CreateNotificationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const { socios, stats } = useSocios();

  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('todos');
  const [selectedSocios, setSelectedSocios] = useState<string[]>([]);
  const [channels, setChannels] = useState({
    email: false,
    sms: false,
    push: true,
    app: true,
  });

  // Load templates
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    try {
      const data = await notificationTemplatesService.getTemplates(false);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error al cargar plantillas');
    }
  };

  // Handle template selection
  const handleTemplateSelect = (template: NotificationTemplate | null) => {
    setSelectedTemplate(template);
    if (template) {
      setTitle(template.title);
      setMessage(template.message);
      setType(template.type);
      setChannels(template.channels);
    }
  };

  // Calculate recipient count
  const recipientCount = useMemo(() => {
    switch (recipientFilter) {
      case 'todos':
        return stats.total;
      case 'al_dia':
        return stats.alDia;
      case 'vencidos':
        return stats.vencidos;
      case 'elegir':
        return selectedSocios.length;
      default:
        return 0;
    }
  }, [recipientFilter, selectedSocios, stats]);

  // Preview with sample data - Render components
  const PreviewTitle = useMemo(() => {
    try {
      const parsed = notificationTemplatesService.parseTemplate(title, {
        socio_nombre: 'Juan Pérez',
        asociacion_nombre: user?.nombre || 'Mi Asociación',
        numero_socio: '12345',
        comercio_nombre: 'Comercio Ejemplo',
        beneficio_titulo: 'Descuento Especial',
        descuento: 20,
        fecha_vencimiento: new Date().toLocaleDateString(),
        monto: 1500,
      });
      const Comp: React.FC = () => <>{parsed || 'Título de la notificación'}</>;
      Comp.displayName = 'PreviewTitle';
      return Comp;
    } catch {
      const Comp: React.FC = () => <>{title || 'Título de la notificación'}</>;
      Comp.displayName = 'PreviewTitleFallback';
      return Comp;
    }
  }, [title, user]);

  const PreviewMessage = useMemo(() => {
    try {
      const parsed = notificationTemplatesService.parseTemplate(message, {
        socio_nombre: 'Juan Pérez',
        asociacion_nombre: user?.nombre || 'Mi Asociación',
        numero_socio: '12345',
        comercio_nombre: 'Comercio Ejemplo',
        beneficio_titulo: 'Descuento Especial',
        descuento: 20,
        fecha_vencimiento: new Date().toLocaleDateString(),
        monto: 1500,
      });
      const Comp: React.FC = () => <>{parsed || 'Mensaje de la notificación'}</>;
      Comp.displayName = 'PreviewMessage';
      return Comp;
    } catch {
      const Comp: React.FC = () => <>{message || 'Mensaje de la notificación'}</>;
      Comp.displayName = 'PreviewMessageFallback';
      return Comp;
    }
  }, [message, user]);

  // Handle send
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Por favor completa el título y mensaje');
      return;
    }

    if (recipientCount === 0) {
      toast.error('No hay destinatarios seleccionados');
      return;
    }

    if (!user?.uid) {
      toast.error('No se pudo identificar la asociación');
      return;
    }

    try {
      setLoading(true);

      // Build recipient IDs
      const recipientIds = await notificationService.buildRecipients(
        user.uid,
        recipientFilter,
        selectedSocios
      );

      if (recipientIds.length === 0) {
        toast.error('No se encontraron destinatarios');
        return;
      }

      // Create notification data
      const notificationData = {
        title,
        message,
        type,
        category: selectedTemplate?.category || 'general',
        recipientIds,
        metadata: {
          senderName: user.nombre || 'Asociación',
          recipientCount: recipientIds.length,
          templateId: selectedTemplate?.id,
          templateName: selectedTemplate?.name,
        },
      };

      // Create notification document
      const notificationId = await notificationService.createNotification(notificationData);

      // Enqueue for sending
      await notificationQueueService.enqueueNotification(
        notificationId,
        recipientIds,
        notificationData,
        { maxAttempts: 3 }
      );

      // Update template usage if template was used
      if (selectedTemplate) {
        await notificationTemplatesService.updateTemplateUsage(selectedTemplate.id);
      }

      toast.success(`Notificación enviada a ${recipientIds.length} destinatarios`);
      
      // Reset form
      handleClose();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Error al enviar la notificación');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplate(null);
    setTitle('');
    setMessage('');
    setType('info');
    setRecipientFilter('todos');
    setSelectedSocios([]);
    setChannels({ email: false, sms: false, push: true, app: true });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: alpha('#6366f1', 0.1),
                color: '#6366f1',
              }}
            >
              <Send />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Enviar Notificación
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Selecciona una plantilla o crea un mensaje personalizado
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={handleClose}
            sx={{ minWidth: 'auto', color: '#94a3b8' }}
          >
            <Close />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
          {/* Left Column - Form */}
          <Box sx={{ flex: 1 }}>
            {/* Template Selector */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Plantilla (opcional)
              </Typography>
              <Autocomplete
                value={selectedTemplate}
                onChange={(_, newValue) => handleTemplateSelect(newValue)}
                options={templates}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Selecciona una plantilla..."
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <AutoAwesome sx={{ color: '#94a3b8', mr: 1 }} />,
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: alpha(typeConfig[option.type].color, 0.1),
                          color: typeConfig[option.type].color,
                        }}
                      >
                        {typeConfig[option.type].icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {option.description}
                        </Typography>
                      </Box>
                      {option.isSystem && (
                        <Chip label="Sistema" size="small" sx={{ fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  </Box>
                )}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Message Content */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                helperText="Usa {{variable}} para insertar datos dinámicos"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Mensaje"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                multiline
                rows={4}
                required
                helperText="Usa {{variable}} para insertar datos dinámicos"
              />
            </Box>

            {/* Type Selector */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de notificación</InputLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value as NotificationType)}
                >
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {config.icon}
                        {config.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Channels */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Canales de Envío
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={channels.email}
                      onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Email sx={{ fontSize: 16 }} />
                      Email
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={channels.sms}
                      onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Sms sx={{ fontSize: 16 }} />
                      SMS
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={channels.push}
                      onChange={(e) => setChannels({ ...channels, push: e.target.checked })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PhoneAndroid sx={{ fontSize: 16 }} />
                      Push
                    </Box>
                  }
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={channels.app}
                      onChange={(e) => setChannels({ ...channels, app: e.target.checked })}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <NotificationsIcon sx={{ fontSize: 16 }} />
                      App
                    </Box>
                  }
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Recipients */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Destinatarios
              </Typography>
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Filtro de destinatarios</InputLabel>
                <Select
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value as RecipientFilter)}
                >
                  <MenuItem value="todos">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ color: '#94a3b8' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Todos los socios
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {`${stats.total ?? 0} socios`}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="al_dia">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ color: '#94a3b8' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Socios al día
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {`${stats.alDia ?? 0} socios`}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="vencidos">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ color: '#94a3b8' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Socios vencidos
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {`${stats.vencidos ?? 0} socios`}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="elegir">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People sx={{ color: '#94a3b8' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Elegir socios
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Selección manual
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {/* Manual Selection */}
              {recipientFilter === 'elegir' && (
                <Autocomplete
                  multiple
                  value={socios.filter(s => selectedSocios.includes(s.id))}
                  onChange={(_, newValue) => setSelectedSocios(newValue.map(s => s.id))}
                  options={socios}
                  getOptionLabel={(option) => `${option.nombre} (${option.email})`}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Buscar socios..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <PersonSearch sx={{ color: '#94a3b8', mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.nombre}
                        {...getTagProps({ index })}
                        size="small"
                        key={option.id}
                      />
                    ))
                  }
                />
              )}

              {/* Recipient Count */}
              <Alert
                severity={(Number(recipientCount ?? 0) > 0 ? 'info' : 'warning') as 'info' | 'warning'}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                <Typography variant="body2">
                  {Number(recipientCount ?? 0) > 0
                    ? `Se enviará a ${Number(recipientCount)} destinatario${Number(recipientCount) !== 1 ? 's' : ''}`
                    : 'No hay destinatarios seleccionados'}
                </Typography>
              </Alert>
            </Box>
          </Box>

          {/* Right Column - Preview */}
          <Box sx={{ flex: 1 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e2e8f0',
                borderRadius: 3,
                bgcolor: '#f8fafc',
                position: 'sticky',
                top: 16,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Preview />
                Vista Previa
              </Typography>

              <AnimatePresence mode="wait">
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Alert
                    severity={
                      type === 'error'
                        ? 'error'
                        : type === 'warning'
                        ? 'warning'
                        : type === 'success'
                        ? 'success'
                        : 'info'
                    }
                    sx={{ borderRadius: 2 }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      <PreviewTitle />
                    </Typography>
                    <Typography variant="body2">
                      <PreviewMessage />
                    </Typography>
                  </Alert>
                </motion.div>
              </AnimatePresence>

              {/* Variables Help */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, mb: 1, display: 'block' }}>
                  Variables disponibles:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {[
                    'socio_nombre',
                    'asociacion_nombre',
                    'numero_socio',
                    'comercio_nombre',
                    'beneficio_titulo',
                    'descuento',
                    'fecha_vencimiento',
                    'monto',
                  ].map((variable) => (
                    <Chip
                      key={variable}
                      label={`{{${variable}}}`}
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        navigator.clipboard.writeText(`{{${variable}}}`);
                        toast.success('Variable copiada');
                      }}
                      sx={{
                        cursor: 'pointer',
                        fontSize: '0.65rem',
                        '&:hover': {
                          bgcolor: alpha('#6366f1', 0.1),
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={loading || !title.trim() || !message.trim() || recipientCount === 0}
          startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            },
          }}
        >
          {loading ? 'Enviando...' : 'Enviar Notificación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateNotificationDialog;
