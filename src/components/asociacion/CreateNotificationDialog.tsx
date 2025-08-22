'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Chip,
  IconButton,
  Avatar,
  alpha,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert,
  Fade,
  Slide,
  Paper,
  Stack,
  Card,
  CardContent,
  Zoom,
  Checkbox,
  FormGroup,
  Divider,
} from '@mui/material';
import {
  Close,
  Add,
  Send,
  Info,
  CheckCircleOutline,
  Warning,
  Error,
  Campaign,
  Link,
  Preview,
  ExpandMore,
  Refresh,
  AutoAwesome,
  Notifications,
  Schedule,
  Label,
  Settings,
  Palette,
  Star,
  Bolt,
  Stars,
  Email,
  Sms,
  PhoneAndroid,
  Group,
  PersonAdd,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';
import { NotificationFormData, NotificationType, NotificationPriority, NotificationCategory } from '@/types/notification';

interface CreateNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: NotificationFormData & { sendExternal?: boolean; recipientIds?: string[] }) => Promise<void>;
  loading?: boolean;
}

const typeOptions: { value: NotificationType; label: string; icon: React.ReactNode; color: string; gradient: string; description: string }[] = [
  { 
    value: 'info', 
    label: 'Información', 
    icon: <Info />, 
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    description: 'Información general o actualizaciones del sistema'
  },
  { 
    value: 'success', 
    label: 'Éxito', 
    icon: <CheckCircleOutline />, 
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    description: 'Confirmaciones y operaciones exitosas'
  },
  { 
    value: 'warning', 
    label: 'Advertencia', 
    icon: <Warning />, 
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'Situaciones que requieren atención'
  },
  { 
    value: 'error', 
    label: 'Error', 
    icon: <Error />, 
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    description: 'Errores críticos que requieren acción inmediata'
  },
  { 
    value: 'announcement', 
    label: 'Anuncio', 
    icon: <Campaign />, 
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    description: 'Comunicados importantes y eventos'
  },
];

const priorityOptions: { value: NotificationPriority; label: string; color: string; gradient: string; description: string; icon: React.ReactNode }[] = [
  { 
    value: 'low', 
    label: 'Baja', 
    color: '#6b7280',
    gradient: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
    description: 'Información no crítica',
    icon: <Schedule />
  },
  { 
    value: 'medium', 
    label: 'Media', 
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    description: 'Información importante pero no urgente',
    icon: <Notifications />
  },
  { 
    value: 'high', 
    label: 'Alta', 
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    description: 'Requiere atención pronta',
    icon: <Star />
  },
  { 
    value: 'urgent', 
    label: 'Urgente', 
    color: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    description: 'Requiere atención inmediata',
    icon: <Bolt />
  },
];

const categoryOptions: { value: NotificationCategory; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  { 
    value: 'system', 
    label: 'Sistema', 
    description: 'Notificaciones del sistema y mantenimiento',
    icon: <Settings />,
    color: '#6366f1'
  },
  { 
    value: 'membership', 
    label: 'Socios', 
    description: 'Relacionadas con socios y registros',
    icon: <Notifications />,
    color: '#8b5cf6'
  },
  { 
    value: 'payment', 
    label: 'Pagos', 
    description: 'Pagos, cuotas y facturación',
    icon: <Star />,
    color: '#10b981'
  },
  { 
    value: 'event', 
    label: 'Eventos', 
    description: 'Eventos, reuniones y actividades',
    icon: <Campaign />,
    color: '#f59e0b'
  },
  { 
    value: 'general', 
    label: 'General', 
    description: 'Comunicaciones generales',
    icon: <Info />,
    color: '#64748b'
  },
];

export const CreateNotificationDialog: React.FC<CreateNotificationDialogProps> = ({
  open,
  onClose,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    category: 'general',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [hasAction, setHasAction] = useState(false);
  const [sendExternal, setSendExternal] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState({
    email: true,
    sms: false,
    push: true
  });
  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expirationDate, setExpirationDate] = useState('');
  const [expirationTime, setExpirationTime] = useState('');

  // Mock recipients data - in real app, this would come from API
  const availableRecipients = [
    { id: '1', name: 'Juan Pérez', email: 'juan@example.com', type: 'socio' },
    { id: '2', name: 'María García', email: 'maria@example.com', type: 'socio' },
    { id: '3', name: 'Carlos López', email: 'carlos@example.com', type: 'comercio' },
    { id: '4', name: 'Ana Martínez', email: 'ana@example.com', type: 'socio' },
  ];

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        category: 'general',
        tags: []
      });
      setTagInput('');
      setShowAdvanced(false);
      setShowPreview(false);
      setHasExpiration(false);
      setHasAction(false);
      setSendExternal(false);
      setSelectedChannels({ email: true, sms: false, push: true });
      setRecipientType('all');
      setSelectedRecipients([]);
      setErrors({});
      setExpirationDate('');
      setExpirationTime('');
    }
  }, [open]);

  const handleInputChange = React.useCallback(
    (
      field: keyof NotificationFormData,
      value: string | string[] | Date | undefined
    ) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    },
    [errors]
  );

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleRecipientToggle = (recipientId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleExpirationChange = React.useCallback(() => {
    if (expirationDate && expirationTime) {
      const dateTime = new Date(`${expirationDate}T${expirationTime}`);
      handleInputChange('expiresAt', dateTime);
    }
  }, [expirationDate, expirationTime, handleInputChange]);

  useEffect(() => {
    if (hasExpiration) {
      handleExpirationChange();
    }
  }, [expirationDate, expirationTime, hasExpiration, handleExpirationChange]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (formData.title.length > 100) {
      newErrors.title = 'El título no puede exceder 100 caracteres';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es obligatorio';
    } else if (formData.message.length > 500) {
      newErrors.message = 'El mensaje no puede exceder 500 caracteres';
    }

    if (hasAction) {
      if (formData.actionUrl && !isValidUrl(formData.actionUrl)) {
        newErrors.actionUrl = 'URL inválida';
      }
      if (formData.actionUrl && !formData.actionLabel) {
        newErrors.actionLabel = 'El texto del botón es obligatorio cuando se especifica una URL';
      }
    }

    if (hasExpiration) {
      if (!expirationDate || !expirationTime) {
        newErrors.expiration = 'Fecha y hora de expiración son obligatorias';
      } else {
        const dateTime = new Date(`${expirationDate}T${expirationTime}`);
        if (dateTime <= new Date()) {
          newErrors.expiration = 'La fecha de expiración debe ser futura';
        }
      }
    }

    if (sendExternal && recipientType === 'specific' && selectedRecipients.length === 0) {
      newErrors.recipients = 'Selecciona al menos un destinatario';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const submitData = {
        ...formData,
        expiresAt: hasExpiration && expirationDate && expirationTime 
          ? new Date(`${expirationDate}T${expirationTime}`) 
          : undefined,
        actionUrl: hasAction ? formData.actionUrl : undefined,
        actionLabel: hasAction ? formData.actionLabel : undefined,
        sendExternal,
        recipientIds: sendExternal && recipientType === 'specific' ? selectedRecipients : undefined,
      };

      await onSave(submitData);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const selectedType = typeOptions.find(t => t.value === formData.type);
  const selectedCategory = categoryOptions.find(c => c.value === formData.category);

  const characterCount = {
    title: formData.title.length,
    message: formData.message.length,
  };

  // Get current date and time for min values
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        TransitionComponent={Slide}
        slotProps={{
          transition: { direction: 'up' }
        }}
        PaperProps={{
          sx: {
            borderRadius: 6,
            boxShadow: '0 32px 128px rgba(0,0,0,0.2)',
            maxHeight: '95vh',
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
          }
        }}
        sx={{
          '& .MuiDialog-container': {
            alignItems: 'center',
            justifyContent: 'center',
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(12px)',
          }
        }}
      >
        {/* Header */}
        <DialogTitle sx={{ p: 0, position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              p: 6,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              position: 'relative',
              zIndex: 2,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flex: 1, minWidth: 0 }}>
                <Zoom in={open} timeout={600}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                      color: 'white',
                      flexShrink: 0,
                      border: '2px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}
                  >
                    <AutoAwesome sx={{ fontSize: 32 }} />
                  </Avatar>
                </Zoom>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 900, 
                      mb: 1,
                      fontSize: { xs: '1.75rem', sm: '2rem' },
                      lineHeight: 1.2,
                    }}
                  >
                    ✨ Nueva Notificación
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      fontWeight: 500,
                    }}
                  >
                    Crea y envía notificaciones impactantes a tus socios
                  </Typography>
                </Box>
              </Box>
              
              <IconButton
                onClick={onClose}
                sx={{
                  color: 'white',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  width: 48,
                  height: 48,
                  '&:hover': {
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.2) 100%)',
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {loading && (
              <LinearProgress
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.8) 100%)',
                  },
                  zIndex: 3,
                }}
              />
            )}
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
          <Box 
            sx={{ 
              p: 6, 
              overflowY: 'auto',
              maxHeight: 'calc(95vh - 280px)',
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(148, 163, 184, 0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '4px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                },
              },
            }}
          >
            <Stack spacing={4}>
              {/* Content and Type Selection */}
              <Card 
                elevation={0}
                sx={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                      }}
                    >
                      <Stars />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      Contenido Principal
                    </Typography>
                  </Box>

                  <Stack spacing={3}>
                    {/* Title */}
                    <TextField
                      fullWidth
                      label="Título de la notificación"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Escribe un título impactante..."
                      error={!!errors.title}
                      helperText={errors.title || `${characterCount.title}/100 caracteres`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(10px)',
                        }
                      }}
                    />

                    {/* Message */}
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Mensaje"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Redacta tu mensaje aquí. Sé claro y conciso..."
                      error={!!errors.message}
                      helperText={errors.message || `${characterCount.message}/500 caracteres`}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(10px)',
                        }
                      }}
                    />
                  </Stack>
                </CardContent>
              </Card>

              {/* Type and Priority Selection */}
              <Card 
                elevation={0}
                sx={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                        color: 'white',
                      }}
                    >
                      <Palette />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      Tipo y Configuración
                    </Typography>
                  </Box>

                  <Stack spacing={3}>
                    {/* Type Selection */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#475569' }}>
                        Tipo de Notificación
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                        {typeOptions.map((option) => (
                          <Paper
                            key={option.value}
                            onClick={() => handleInputChange('type', option.value)}
                            sx={{
                              p: 3,
                              borderRadius: 3,
                              cursor: 'pointer',
                              border: formData.type === option.value 
                                ? `2px solid ${option.color}` 
                                : '2px solid transparent',
                              background: formData.type === option.value 
                                ? `linear-gradient(135deg, ${alpha(option.color, 0.1)} 0%, ${alpha(option.color, 0.05)} 100%)`
                                : 'rgba(255,255,255,0.8)',
                              backdropFilter: 'blur(10px)',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 32px ${alpha(option.color, 0.2)}`,
                                border: `2px solid ${alpha(option.color, 0.5)}`,
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                              <Avatar
                                sx={{
                                  width: 32,
                                  height: 32,
                                  background: option.gradient,
                                  color: 'white',
                                }}
                              >
                                {option.icon}
                              </Avatar>
                              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {option.label}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.4 }}>
                              {option.description}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Box>

                    {/* Priority Selection */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#475569' }}>
                        Nivel de Prioridad
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                        {priorityOptions.map((option) => (
                          <Paper
                            key={option.value}
                            onClick={() => handleInputChange('priority', option.value)}
                            sx={{
                              p: 2.5,
                              borderRadius: 3,
                              cursor: 'pointer',
                              border: formData.priority === option.value 
                                ? `2px solid ${option.color}` 
                                : '2px solid transparent',
                              background: formData.priority === option.value 
                                ? `linear-gradient(135deg, ${alpha(option.color, 0.1)} 0%, ${alpha(option.color, 0.05)} 100%)`
                                : 'rgba(255,255,255,0.8)',
                              backdropFilter: 'blur(10px)',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 32px ${alpha(option.color, 0.2)}`,
                                border: `2px solid ${alpha(option.color, 0.5)}`,
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                              <Box sx={{ color: option.color }}>{option.icon}</Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                                {option.label}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.3 }}>
                              {option.description}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    </Box>

                    {/* Category */}
                    <FormControl fullWidth>
                      <InputLabel>Categoría</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        renderValue={() => (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {selectedCategory && (
                              <>
                                <Box sx={{ color: selectedCategory.color, display: 'flex', alignItems: 'center' }}>
                                  {selectedCategory.icon}
                                </Box>
                                <Typography variant="body2">{selectedCategory.label}</Typography>
                              </>
                            )}
                          </Box>
                        )}
                        sx={{
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderRadius: 3,
                          },
                          background: 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(10px)',
                        }}
                      >
                        {categoryOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                              <Box sx={{ color: option.color, display: 'flex', alignItems: 'center' }}>
                                {option.icon}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {option.label}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b', lineHeight: 1.3 }}>
                                  {option.description}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </CardContent>
              </Card>

              {/* External Delivery Settings */}
              <Card 
                elevation={0}
                sx={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                      }}
                    >
                      <Send />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                      Envío Externo
                    </Typography>
                  </Box>

                  <Stack spacing={3}>
                    {/* Enable External Sending */}
                    <FormControlLabel
                      control={
                        <Switch
                          checked={sendExternal}
                          onChange={(e) => setSendExternal(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#10b981',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#10b981',
                            },
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            Enviar notificaciones externas
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                            Envía la notificación por email, SMS y push notifications
                          </Typography>
                        </Box>
                      }
                    />

                    {sendExternal && (
                      <Fade in={sendExternal}>
                        <Box sx={{ 
                          p: 3,
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                          borderRadius: 3,
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}>
                          {/* Channel Selection */}
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#475569' }}>
                            Canales de Envío
                          </Typography>
                          
                          <FormGroup row sx={{ mb: 3 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedChannels.email}
                                  onChange={(e) => setSelectedChannels(prev => ({ ...prev, email: e.target.checked }))}
                                  sx={{ color: '#6366f1' }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Email sx={{ color: '#6366f1', fontSize: 20 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Email</Typography>
                                </Box>
                              }
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedChannels.sms}
                                  onChange={(e) => setSelectedChannels(prev => ({ ...prev, sms: e.target.checked }))}
                                  sx={{ color: '#f59e0b' }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Sms sx={{ color: '#f59e0b', fontSize: 20 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>SMS</Typography>
                                </Box>
                              }
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={selectedChannels.push}
                                  onChange={(e) => setSelectedChannels(prev => ({ ...prev, push: e.target.checked }))}
                                  sx={{ color: '#8b5cf6' }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PhoneAndroid sx={{ color: '#8b5cf6', fontSize: 20 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Push</Typography>
                                </Box>
                              }
                            />
                          </FormGroup>

                          <Divider sx={{ my: 2 }} />

                          {/* Recipient Selection */}
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#475569' }}>
                            Destinatarios
                          </Typography>
                          
                          <FormControl component="fieldset" sx={{ mb: 2 }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={recipientType === 'all'}
                                  onChange={() => setRecipientType('all')}
                                  sx={{ color: '#10b981' }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Group sx={{ color: '#10b981', fontSize: 20 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Todos los usuarios
                                  </Typography>
                                </Box>
                              }
                            />
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={recipientType === 'specific'}
                                  onChange={() => setRecipientType('specific')}
                                  sx={{ color: '#6366f1' }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PersonAdd sx={{ color: '#6366f1', fontSize: 20 }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    Usuarios específicos
                                  </Typography>
                                </Box>
                              }
                            />
                          </FormControl>

                          {recipientType === 'specific' && (
                            <Box sx={{ 
                              maxHeight: 200, 
                              overflowY: 'auto',
                              border: '1px solid rgba(226, 232, 240, 0.8)',
                              borderRadius: 2,
                              p: 2,
                              background: 'rgba(255,255,255,0.8)',
                            }}>
                              {availableRecipients.map((recipient) => (
                                <FormControlLabel
                                  key={recipient.id}
                                  control={
                                    <Checkbox
                                      checked={selectedRecipients.includes(recipient.id)}
                                      onChange={() => handleRecipientToggle(recipient.id)}
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {recipient.name}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: '#64748b' }}>
                                        {recipient.email} • {recipient.type}
                                      </Typography>
                                    </Box>
                                  }
                                  sx={{ display: 'block', mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}

                          {errors.recipients && (
                            <Typography variant="caption" sx={{ color: '#ef4444', mt: 1, display: 'block' }}>
                              {errors.recipients}
                            </Typography>
                          )}
                        </Box>
                      </Fade>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              {/* Advanced Options */}
              <Card 
                elevation={0}
                sx={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Accordion 
                    expanded={showAdvanced} 
                    onChange={() => setShowAdvanced(!showAdvanced)}
                    sx={{
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      '& .MuiAccordionSummary-root': {
                        p: 4,
                        '&:hover': {
                          background: 'rgba(99, 102, 241, 0.05)',
                        }
                      },
                      '& .MuiAccordionDetails-root': {
                        p: 4,
                        pt: 0,
                        borderTop: '1px solid rgba(226, 232, 240, 0.8)',
                      }
                    }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: 'white',
                          }}
                        >
                          <Settings fontSize="small" />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          Opciones Avanzadas
                        </Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Stack spacing={4}>
                        {/* Action URL Toggle */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={hasAction}
                                onChange={(e) => setHasAction(e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#6366f1',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#6366f1',
                                  },
                                }}
                              />
                            }
                            label={
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                Agregar botón de acción
                              </Typography>
                            }
                          />
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                            Permite a los usuarios realizar una acción específica desde la notificación
                          </Typography>
                        </Box>

                        {/* Action URL and Label */}
                        {hasAction && (
                          <Fade in={hasAction}>
                            <Box sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                              gap: 2,
                              p: 3,
                              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                              borderRadius: 3,
                              border: '1px solid rgba(99, 102, 241, 0.2)',
                            }}>
                              <TextField
                                fullWidth
                                label="URL de acción"
                                value={formData.actionUrl || ''}
                                onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                                placeholder="https://ejemplo.com/accion"
                                error={!!errors.actionUrl}
                                helperText={errors.actionUrl}
                                InputProps={{
                                  startAdornment: <Link sx={{ color: '#6366f1', mr: 1 }} />,
                                }}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    background: 'rgba(255,255,255,0.8)',
                                  }
                                }}
                              />
                              <TextField
                                fullWidth
                                label="Texto del botón"
                                value={formData.actionLabel || ''}
                                onChange={(e) => handleInputChange('actionLabel', e.target.value)}
                                placeholder="Ver más detalles"
                                error={!!errors.actionLabel}
                                helperText={errors.actionLabel}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    background: 'rgba(255,255,255,0.8)',
                                  }
                                }}
                              />
                            </Box>
                          </Fade>
                        )}

                        {/* Expiration Toggle */}
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={hasExpiration}
                                onChange={(e) => setHasExpiration(e.target.checked)}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#f59e0b',
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: '#f59e0b',
                                  },
                                }}
                              />
                            }
                            label={
                              <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                Establecer fecha de expiración
                              </Typography>
                            }
                          />
                          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mt: 0.5 }}>
                            La notificación se ocultará automáticamente después de esta fecha
                          </Typography>
                        </Box>

                        {/* Expiration Date and Time */}
                        {hasExpiration && (
                          <Fade in={hasExpiration}>
                            <Box sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                              gap: 2,
                              p: 3,
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(217, 119, 6, 0.05) 100%)',
                              borderRadius: 3,
                              border: '1px solid rgba(245, 158, 11, 0.2)',
                            }}>
                              <TextField
                                fullWidth
                                type="date"
                                label="Fecha de expiración"
                                value={expirationDate}
                                onChange={(e) => setExpirationDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ min: currentDate }}
                                error={!!errors.expiration}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    background: 'rgba(255,255,255,0.8)',
                                  }
                                }}
                              />
                              <TextField
                                fullWidth
                                type="time"
                                label="Hora de expiración"
                                value={expirationTime}
                                onChange={(e) => setExpirationTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                inputProps={{ 
                                  min: expirationDate === currentDate ? currentTime : undefined 
                                }}
                                error={!!errors.expiration}
                                helperText={errors.expiration}
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    background: 'rgba(255,255,255,0.8)',
                                  }
                                }}
                              />
                            </Box>
                          </Fade>
                        )}

                        {/* Tags */}
                        <Box>
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Label sx={{ color: '#8b5cf6' }} />
                            Etiquetas
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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
                              sx={{
                                flex: 1,
                                '& .MuiOutlinedInput-root': {
                                  borderRadius: 3,
                                  background: 'rgba(255,255,255,0.8)',
                                }
                              }}
                            />
                            <Button
                              onClick={handleAddTag}
                              variant="contained"
                              disabled={!tagInput.trim()}
                              sx={{
                                borderRadius: 3,
                                minWidth: 'auto',
                                px: 3,
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                                  transform: 'scale(1.05)',
                                },
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            >
                              <Add />
                            </Button>
                          </Box>

                          {formData.tags && formData.tags.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                              {formData.tags.map((tag, index) => (
                                <Chip
                                  key={index}
                                  label={tag}
                                  onDelete={() => handleRemoveTag(tag)}
                                  size="small"
                                  sx={{
                                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                    color: '#8b5cf6',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    fontWeight: 600,
                                    '& .MuiChip-deleteIcon': {
                                      color: '#8b5cf6',
                                      '&:hover': {
                                        color: '#7c3aed',
                                      }
                                    },
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.2) 100%)',
                                      transform: 'scale(1.05)',
                                    },
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  }}
                                />
                              ))}
                            </Box>
                          )}
                        </Box>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>

              {/* Preview */}
              {showPreview && formData.title && formData.message && (
                <Fade in={showPreview}>
                  <Card 
                    elevation={0}
                    sx={{
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                          }}
                        >
                          <Preview />
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                          Vista Previa en Tiempo Real
                        </Typography>
                        <Chip 
                          label="LIVE" 
                          size="small" 
                          sx={{ 
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: 'white',
                            fontWeight: 700,
                            animation: 'pulse 2s infinite',
                          }} 
                        />
                      </Box>
                      
                      <Alert
                        severity={formData.type === 'error' ? 'error' : formData.type === 'warning' ? 'warning' : formData.type === 'success' ? 'success' : 'info'}
                        sx={{ 
                          borderRadius: 3,
                          background: selectedType ? `linear-gradient(135deg, ${alpha(selectedType.color, 0.1)} 0%, ${alpha(selectedType.color, 0.05)} 100%)` : undefined,
                          border: selectedType ? `1px solid ${alpha(selectedType.color, 0.3)}` : undefined,
                          '& .MuiAlert-message': {
                            width: '100%',
                          },
                          '& .MuiAlert-icon': {
                            fontSize: '1.5rem',
                          }
                        }}
                        icon={selectedType?.icon}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1e293b' }}>
                          {formData.title}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: formData.tags?.length ? 2 : 0, lineHeight: 1.6, color: '#475569' }}>
                          {formData.message}
                        </Typography>
                        {formData.tags && formData.tags.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {formData.tags.map((tag, index) => (
                              <Chip 
                                key={index} 
                                label={tag} 
                                size="small" 
                                variant="outlined"
                                sx={{
                                  borderColor: selectedType?.color,
                                  color: selectedType?.color,
                                  fontWeight: 600,
                                }}
                              />
                            ))}
                          </Box>
                        )}
                      </Alert>
                    </CardContent>
                  </Card>
                </Fade>
              )}
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions 
          sx={{ 
            p: 6, 
            pt: 4,
            position: 'sticky',
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(226, 232, 240, 0.8)',
            zIndex: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 3, width: '100%', justifyContent: 'flex-end' }}>
            <Button
              onClick={onClose}
              variant="outlined"
              disabled={loading}
              size="large"
              sx={{
                borderRadius: 4,
                px: 6,
                py: 2,
                fontWeight: 700,
                fontSize: '1rem',
                minWidth: 140,
                border: '2px solid #e2e8f0',
                color: '#64748b',
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  border: '2px solid #cbd5e1',
                  background: 'rgba(255,255,255,0.9)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.title.trim() || !formData.message.trim() || loading}
              startIcon={loading ? 
                <Refresh sx={{ animation: 'spin 1s linear infinite' }} /> : 
                <Send />
              }
              size="large"
              sx={{
                borderRadius: 4,
                px: 8,
                py: 2,
                fontWeight: 900,
                fontSize: '1rem',
                minWidth: 200,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                backgroundSize: '200% 200%',
                color: 'white',
                textTransform: 'none',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #be185d 100%)',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 12px 48px rgba(99, 102, 241, 0.5)',
                  backgroundPosition: '100% 0',
                },
                '&:active': {
                  transform: 'translateY(-1px)',
                },
                '&:disabled': {
                  background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                  color: '#94a3b8',
                  boxShadow: 'none',
                  transform: 'none',
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: !formData.title.trim() || !formData.message.trim() ? 'none' : 'glow 2s ease-in-out infinite alternate',
                '@keyframes glow': {
                  '0%': { boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' },
                  '100%': { boxShadow: '0 8px 32px rgba(139, 92, 246, 0.6)' },
                },
              }}
            >
              {loading ? 'Enviando Magia...' : sendExternal ? '✨ Crear y Enviar' : '✨ Crear Notificación'}
            </Button>
          </Box>
        </DialogActions>

        {/* Floating Action Indicators */}
        {(formData.title || formData.message) && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 10,
            }}
          >
            <Zoom in={!!formData.title && !!formData.message}>
              <Chip
                label={sendExternal ? "¡Listo para enviar!" : "¡Listo para crear!"}
                sx={{
                  background: sendExternal 
                    ? 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontWeight: 700,
                  animation: 'bounce 2s infinite',
                  '@keyframes bounce': {
                    '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                    '40%': { transform: 'translateY(-10px)' },
                    '60%': { transform: 'translateY(-5px)' },
                  },
                }}
              />
            </Zoom>
          </Box>
        )}
      </Dialog>
    </LocalizationProvider>
  );
};
