'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Alert,
  Tooltip,
  alpha,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ContentCopy,
  MoreVert,
  Send,
  Code,
  Preview,
  Save,
  Refresh,
  Search,
  AutoAwesome,
  Email,
  Sms,
  PhoneAndroid,
  Notifications,
  CheckCircle,
  Warning,
  Error,
  Info,
  Announcement,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  notificationTemplatesService,
  NotificationTemplate,
  TemplateVariable
} from '@/services/notification-templates.service';
import { NotificationType, NotificationPriority, NotificationCategory } from '@/types/notification';

interface NotificationTemplatesProps {
  loading?: boolean;
}

interface TemplateCardProps {
  template: NotificationTemplate;
  onEdit: (template: NotificationTemplate) => void;
  onDelete: (id: string) => void;
  onDuplicate: (template: NotificationTemplate) => void;
  onPreview: (template: NotificationTemplate) => void;
  onUse: (template: NotificationTemplate) => void;
}

interface TemplateDialogProps {
  open: boolean;
  template?: NotificationTemplate;
  onClose: () => void;
  onSave: (template: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed'>) => void;
  loading?: boolean;
}

const typeConfig = {
  info: { icon: <Info />, color: '#3b82f6', label: 'Información' },
  success: { icon: <CheckCircle />, color: '#10b981', label: 'Éxito' },
  warning: { icon: <Warning />, color: '#f59e0b', label: 'Advertencia' },
  error: { icon: <Error />, color: '#ef4444', label: 'Error' },
  announcement: { icon: <Announcement />, color: '#8b5cf6', label: 'Anuncio' },
};

const priorityConfig = {
  low: { color: '#6b7280', label: 'Baja' },
  medium: { color: '#3b82f6', label: 'Media' },
  high: { color: '#f59e0b', label: 'Alta' },
  urgent: { color: '#ef4444', label: 'Urgente' },
};

const categoryConfig = {
  system: { label: 'Sistema' },
  membership: { label: 'Socios' },
  payment: { label: 'Pagos' },
  event: { label: 'Eventos' },
  general: { label: 'General' },
};

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onUse,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const typeInfo = typeConfig[template.type];
  const priorityInfo = priorityConfig[template.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card
        elevation={0}
        sx={{
          height: '100%',
          border: '1px solid #f1f5f9',
          borderRadius: 4,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha(typeInfo.color, 0.3),
            boxShadow: `0 8px 32px ${alpha(typeInfo.color, 0.15)}`,
          }
        }}
        onClick={() => onPreview(template)}
      >
        <CardContent sx={{ p: 3, pb: 1 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: alpha(typeInfo.color, 0.1),
                  color: typeInfo.color,
                }}
              >
                {typeInfo.icon}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: '#1e293b',
                      fontSize: '1rem',
                      lineHeight: 1.3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {template.name}
                  </Typography>

                  {template.isSystem && (
                    <Chip
                      label="Sistema"
                      size="small"
                      sx={{
                        bgcolor: alpha('#6366f1', 0.1),
                        color: '#6366f1',
                        fontSize: '0.7rem',
                        height: 20,
                      }}
                    />
                  )}
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    color: '#64748b',
                    fontSize: '0.75rem',
                    display: 'block',
                  }}
                >
                  {template.description}
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={handleMenuClick}
              size="small"
              sx={{ color: '#94a3b8' }}
            >
              <MoreVert />
            </IconButton>
          </Box>

          {/* Content Preview */}
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="body2"
              sx={{
                color: '#475569',
                fontSize: '0.875rem',
                fontWeight: 600,
                mb: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {template.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#64748b',
                fontSize: '0.8rem',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {template.message}
            </Typography>
          </Box>

          {/* Metadata */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip
              label={typeInfo.label}
              size="small"
              sx={{
                bgcolor: alpha(typeInfo.color, 0.1),
                color: typeInfo.color,
                fontSize: '0.7rem',
                height: 20,
              }}
            />
            <Chip
              label={priorityInfo.label}
              size="small"
              sx={{
                bgcolor: alpha(priorityInfo.color, 0.1),
                color: priorityInfo.color,
                fontSize: '0.7rem',
                height: 20,
              }}
            />
            <Chip
              label={categoryConfig[template.category].label}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          </Box>

          {/* Tags */}
          {template.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {template.tags.slice(0, 3).map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.65rem',
                    height: 18,
                    borderColor: alpha('#94a3b8', 0.3),
                    color: '#64748b',
                  }}
                />
              ))}
              {template.tags.length > 3 && (
                <Chip
                  label={`+${template.tags.length - 3}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.65rem',
                    height: 18,
                    borderColor: alpha('#94a3b8', 0.3),
                    color: '#64748b',
                  }}
                />
              )}
            </Box>
          )}

          {/* Channels */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              Canales:
            </Typography>
            {template.channels.email && <Email sx={{ fontSize: 14, color: '#3b82f6' }} />}
            {template.channels.sms && <Sms sx={{ fontSize: 14, color: '#f59e0b' }} />}
            {template.channels.push && <PhoneAndroid sx={{ fontSize: 14, color: '#8b5cf6' }} />}
            {template.channels.app && <Notifications sx={{ fontSize: 14, color: '#10b981' }} />}
          </Box>

          {/* Usage Stats */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
              Usado {template.usageCount} veces
            </Typography>
            {template.lastUsed && (
              <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Último uso: {
                  template.lastUsed instanceof Date
                    ? template.lastUsed.toLocaleDateString()
                    : typeof template.lastUsed === 'object' && 'toDate' in template.lastUsed && typeof template.lastUsed.toDate === 'function'
                      ? (template.lastUsed.toDate() as Date).toLocaleDateString()
                      : template.lastUsed?.toLocaleString?.() ?? ''
                }
              </Typography>
            )}
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
          <Button
            size="small"
            startIcon={<Preview />}
            onClick={(e) => {
              e.stopPropagation();
              onPreview(template);
            }}
            sx={{
              color: '#6366f1',
              '&:hover': {
                bgcolor: alpha('#6366f1', 0.1),
              }
            }}
          >
            Vista Previa
          </Button>

          <Button
            size="small"
            startIcon={<Send />}
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              onUse(template);
            }}
            sx={{
              bgcolor: typeInfo.color,
              '&:hover': {
                bgcolor: typeInfo.color,
                filter: 'brightness(0.9)',
              }
            }}
          >
            Usar
          </Button>
        </CardActions>

        {/* Context Menu */}
        <Menu
          anchorEl={anchorEl}
          open={menuOpen}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              borderRadius: 3,
              border: '1px solid #f1f5f9',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              minWidth: 180,
            }
          }}
        >
          <MenuItem onClick={() => { onEdit(template); handleMenuClose(); }}>
            <Edit sx={{ mr: 2, fontSize: 18 }} />
            Editar
          </MenuItem>
          <MenuItem onClick={() => { onDuplicate(template); handleMenuClose(); }}>
            <ContentCopy sx={{ mr: 2, fontSize: 18 }} />
            Duplicar
          </MenuItem>
          <Divider />
          {!template.isSystem && (
            <MenuItem
              onClick={() => { onDelete(template.id); handleMenuClose(); }}
              sx={{ color: '#ef4444' }}
            >
              <Delete sx={{ mr: 2, fontSize: 18 }} />
              Eliminar
            </MenuItem>
          )}
        </Menu>

        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 80,
            height: 80,
            background: `radial-gradient(circle, ${alpha(typeInfo.color, 0.1)} 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      </Card>
    </motion.div>
  );
};

const TemplateDialog: React.FC<TemplateDialogProps> = ({
  open,
  template,
  onClose,
  onSave,
  loading = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    title: '',
    message: '',
    type: 'info' as NotificationType,
    priority: 'medium' as NotificationPriority,
    category: 'general' as NotificationCategory,
    tags: [] as string[],
    actionUrl: '',
    actionLabel: '',
    channels: {
      email: true,
      sms: false,
      push: true,
      app: true,
    },
    isActive: true,
  });
  const [tagInput, setTagInput] = useState('');
  const [availableVariables, setAvailableVariables] = useState<Record<string, TemplateVariable>>({});
  const [previewData, setPreviewData] = useState<Record<string, string | number | Date>>({});

  // Load available variables
  useEffect(() => {
    const variables = notificationTemplatesService.getAvailableVariables();
    setAvailableVariables(variables);

    // Set default preview data
    const defaultPreview: Record<string, string | number | Date> = {};
    Object.entries(variables).forEach(([key, variable]) => {
      switch (variable.type) {
        case 'text':
          defaultPreview[key] = `[${variable.description}]`;
          break;
        case 'number':
          defaultPreview[key] = 123;
          break;
        case 'date':
          defaultPreview[key] = new Date().toLocaleDateString();
          break;
        default:
          defaultPreview[key] = `[${variable.description}]`;
      }
    });
    setPreviewData(defaultPreview);
  }, []);

  // Initialize form data
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        title: template.title,
        message: template.message,
        type: template.type,
        priority: template.priority,
        category: template.category,
        tags: template.tags,
        actionUrl: template.actionUrl || '',
        actionLabel: template.actionLabel || '',
        channels: template.channels,
        isActive: template.isActive,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        category: 'general',
        tags: [],
        actionUrl: '',
        actionLabel: '',
        channels: {
          email: true,
          sms: false,
          push: true,
          app: true,
        },
        isActive: true,
      });
    }
  }, [template, open]);

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean | string[] // Add other types as needed
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleChannelChange = (channel: string, enabled: boolean) => {
    setFormData(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: enabled,
      }
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.title.trim() || !formData.message.trim()) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validate template
    const validation = notificationTemplatesService.validateTemplate(formData.title, formData.message);
    if (!validation.isValid) {
      toast.error(`Errores en la plantilla: ${validation.errors.join(', ')}`);
      return;
    }

    const templateData = {
      ...formData,
      variables: validation.variables,
      isSystem: false,
      createdBy: 'user', // TODO: Get actual user ID
    };

    onSave(templateData);
  };

  // Generate preview
  const previewTitle = notificationTemplatesService.parseTemplate(formData.title, previewData);
  const previewMessage = notificationTemplatesService.parseTemplate(formData.message, previewData);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: alpha('#6366f1', 0.1),
              color: '#6366f1',
            }}
          >
            <AutoAwesome />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {template ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              {template ? 'Modifica los campos de la plantilla' : 'Crea una nueva plantilla de notificación'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 3 }}>
          {/* Basic Information */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Nombre de la plantilla"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />

              <TextField
                fullWidth
                label="Descripción"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                multiline
                rows={2}
              />

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
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

                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <FormControl fullWidth>
                    <InputLabel>Prioridad</InputLabel>
                    <Select
                      value={formData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                    >
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          {config.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ flex: 1, minWidth: 120 }}>
                  <FormControl fullWidth>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      {Object.entries(categoryConfig).map(([key, config]) => (
                        <MenuItem key={key} value={key}>
                          {config.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Channels */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Canales de Envío
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.channels.email}
                        onChange={(e) => handleChannelChange('email', e.target.checked)}
                      />
                    }
                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Email sx={{ fontSize: 16 }} />Email</Box>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.channels.sms}
                        onChange={(e) => handleChannelChange('sms', e.target.checked)}
                      />
                    }
                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Sms sx={{ fontSize: 16 }} />SMS</Box>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.channels.push}
                        onChange={(e) => handleChannelChange('push', e.target.checked)}
                      />
                    }
                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneAndroid sx={{ fontSize: 16 }} />Push</Box>}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.channels.app}
                        onChange={(e) => handleChannelChange('app', e.target.checked)}
                      />
                    }
                    label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Notifications sx={{ fontSize: 16 }} />App</Box>}
                  />
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Título"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                helperText="Usa {{variable}} para insertar variables dinámicas"
              />

              <TextField
                fullWidth
                label="Mensaje"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                multiline
                rows={4}
                required
                helperText="Usa {{variable}} para insertar variables dinámicas"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="URL de acción (opcional)"
                  value={formData.actionUrl}
                  onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                />
                <TextField
                  fullWidth
                  label="Texto del botón (opcional)"
                  value={formData.actionLabel}
                  onChange={(e) => handleInputChange('actionLabel', e.target.value)}
                />
              </Box>

              {/* Tags */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Etiquetas
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Agregar etiqueta..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    onClick={handleAddTag}
                    variant="outlined"
                    disabled={!tagInput.trim()}
                  >
                    <Add />
                  </Button>
                </Box>
                {formData.tags.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Preview */}
        <Box sx={{ mt: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #e2e8f0',
              borderRadius: 3,
              bgcolor: '#f8fafc',
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Preview />
              Vista Previa
            </Typography>

            <Alert
              severity={formData.type === 'error' ? 'error' : formData.type === 'warning' ? 'warning' : formData.type === 'success' ? 'success' : 'info'}
              sx={{ borderRadius: 2 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {previewTitle || 'Título de la notificación'}
              </Typography>
              <Typography variant="body2">
                {previewMessage || 'Mensaje de la notificación'}
              </Typography>
            </Alert>
          </Paper>
        </Box>

        {/* Available Variables */}
        <Box sx={{ mt: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              border: '1px solid #e2e8f0',
              borderRadius: 3,
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Code />
              Variables Disponibles
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(availableVariables).slice(0, 12).map(([key, variable]) => (
                <Tooltip key={key} title={variable.description}>
                  <Chip
                    label={`{{${key}}}`}
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      // Copy to clipboard
                      navigator.clipboard.writeText(`{{${key}}}`);
                      toast.success('Variable copiada');
                    }}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      '&:hover': {
                        bgcolor: alpha('#6366f1', 0.1),
                      }
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || !formData.name.trim() || !formData.title.trim() || !formData.message.trim()}
          startIcon={loading ? <CircularProgress size={16} /> : <Save />}
        >
          {template ? 'Actualizar' : 'Crear'} Plantilla
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const NotificationTemplates: React.FC<NotificationTemplatesProps> = ({
  loading: externalLoading = false
}) => {

  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [showSystemTemplates, setShowSystemTemplates] = useState(true);
  const [templateDialog, setTemplateDialog] = useState<{
    open: boolean;
    template?: NotificationTemplate;
  }>({ open: false });
  const [actionLoading, setActionLoading] = useState(false);

  // Load templates
  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await notificationTemplatesService.getTemplates(true);
      setTemplates(data);
    } catch (err) {
      console.error('Error loading templates:', err);
      setError((err && typeof err === 'object' && 'message' in err)
        ? typeof (err as { message?: unknown }).message === 'string'
          ? (err as { message: string }).message
          : 'Error al cargar las plantillas'
        : 'Error al cargar las plantillas');
      toast.error('Error al cargar las plantillas');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTemplates();
  }, []);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Search filter
      if (searchTerm && !template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !template.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !template.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Type filter
      if (filterType !== 'all' && template.type !== filterType) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all' && template.category !== filterCategory) {
        return false;
      }

      // System templates filter
      if (!showSystemTemplates && template.isSystem) {
        return false;
      }

      return true;
    });
  }, [templates, searchTerm, filterType, filterCategory, showSystemTemplates]);

  // Handle template actions
  const handleCreateTemplate = () => {
    setTemplateDialog({ open: true });
  };

  const handleEditTemplate = (template: NotificationTemplate) => {
    setTemplateDialog({ open: true, template });
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      return;
    }

    try {
      setActionLoading(true);
      await notificationTemplatesService.deleteTemplate(id);
      await loadTemplates();
      toast.success('Plantilla eliminada exitosamente');
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Error al eliminar la plantilla');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateTemplate = async (template: NotificationTemplate) => {
    const newName = prompt('Nombre para la plantilla duplicada:', `${template.name} (Copia)`);
    if (!newName) return;

    try {
      setActionLoading(true);
      await notificationTemplatesService.duplicateTemplate(template.id, newName);
      await loadTemplates();
      toast.success('Plantilla duplicada exitosamente');
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast.error('Error al duplicar la plantilla');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePreviewTemplate = () => {
    // TODO: Implement preview modal
    toast('Vista previa próximamente');
  };

  const handleUseTemplate = () => {
    // TODO: Implement use template (redirect to create notification with template)
    toast('Usar plantilla próximamente');
  };

  const handleSaveTemplate = async (templateData: Omit<NotificationTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsed'>) => {
    try {
      setActionLoading(true);

      if (templateDialog.template) {
        await notificationTemplatesService.updateTemplate(templateDialog.template.id, templateData);
        toast.success('Plantilla actualizada exitosamente');
      } else {
        await notificationTemplatesService.createTemplate(templateData);
        toast.success('Plantilla creada exitosamente');
      }

      setTemplateDialog({ open: false });
      await loadTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error('Error al guardar la plantilla');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const isLoading = loading || externalLoading || actionLoading;

  if (error && templates.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Error al cargar las plantillas
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button
            onClick={loadTemplates}
            variant="contained"
            startIcon={<Refresh />}
            size="small"
          >
            Reintentar
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', mb: 1 }}>
              Plantillas de Notificaciones
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b' }}>
              Gestiona y crea plantillas reutilizables para tus notificaciones
            </Typography>
          </Box>

          <Button
            onClick={handleCreateTemplate}
            variant="contained"
            startIcon={<Add />}
            size="large"
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }
            }}
          >
            Nueva Plantilla
          </Button>
        </Box>

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: '1px solid #f1f5f9',
            borderRadius: 4,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <TextField
                fullWidth
                placeholder="Buscar plantillas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: '#94a3b8', mr: 1 }} />,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                  }
                }}
              />
            </Box>

            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ minWidth: 120 }}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as NotificationCategory | 'all')}
                >
                  <MenuItem value="all">Todas</MenuItem>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <MenuItem key={key} value={key}>
                      {config.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={showSystemTemplates}
                  onChange={(e) => setShowSystemTemplates(e.target.checked)}
                />
              }
              label="Mostrar plantillas del sistema"
            />
          </Box>
        </Paper>
      </Box>

      {/* Templates Grid */}
      {isLoading && templates.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2, width: 200 }} />
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Cargando plantillas...
            </Typography>
          </Box>
        </Box>
      ) : filteredTemplates.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            border: '1px solid #f1f5f9',
            borderRadius: 4,
          }}
        >
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: alpha('#6366f1', 0.1),
              color: '#6366f1',
              mx: 'auto',
              mb: 3,
            }}
          >
            <AutoAwesome sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 2 }}>
            No se encontraron plantillas
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
            {searchTerm || filterType !== 'all' || filterCategory !== 'all'
              ? 'No hay plantillas que coincidan con los filtros aplicados.'
              : 'Aún no tienes plantillas creadas. Crea tu primera plantilla para comenzar.'
            }
          </Typography>
          <Button
            onClick={handleCreateTemplate}
            variant="contained"
            startIcon={<Add />}
            sx={{
              borderRadius: 3,
              px: 4,
              py: 1.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            }}
          >
            Crear Primera Plantilla
          </Button>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          <AnimatePresence>
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onEdit={handleEditTemplate}
                onDelete={handleDeleteTemplate}
                onDuplicate={handleDuplicateTemplate}
                onPreview={handlePreviewTemplate}
                onUse={handleUseTemplate}
              />
            ))}
          </AnimatePresence>
        </Box>
      )}

      {/* Floating Action Button */}
      <Zoom in={!templateDialog.open}>
        <Fab
          onClick={handleCreateTemplate}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          <Add />
        </Fab>
      </Zoom>

      {/* Template Dialog */}
      <TemplateDialog
        open={templateDialog.open}
        template={templateDialog.template}
        onClose={() => setTemplateDialog({ open: false })}
        onSave={handleSaveTemplate}
        loading={actionLoading}
      />

      {/* Loading overlay */}
      {isLoading && (
        <LinearProgress
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            height: 3,
            bgcolor: alpha('#6366f1', 0.1),
            '& .MuiLinearProgress-bar': {
              bgcolor: '#6366f1',
            }
          }}
        />
      )}
    </Container>
  );
};