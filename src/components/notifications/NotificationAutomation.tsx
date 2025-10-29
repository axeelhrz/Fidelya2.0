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
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PlayArrow,
  Pause,
  AutoMode,
  Group,
  Person,
  Refresh,
  Settings,
  Notifications,
  Timer,
} from '@mui/icons-material';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  schedule?: AutomationSchedule;
  stats: AutomationStats;
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationTrigger {
  type: 'event' | 'schedule' | 'condition' | 'webhook';
  event?: string;
  schedule?: string;
  webhook?: string;
  parameters: Record<string, unknown>;
}

interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: string | number | boolean | Date | string[] | number[];
  logicalOperator?: 'AND' | 'OR';
}

interface AutomationAction {
  type: 'send_notification' | 'create_segment' | 'update_user' | 'webhook' | 'delay';
  parameters: Record<string, unknown>;
}

interface AutomationSchedule {
  type: 'once' | 'recurring';
  startDate: Date;
  endDate?: Date;
  frequency?: 'daily' | 'weekly' | 'monthly';
  interval?: number;
  daysOfWeek?: number[];
  timeOfDay?: string;
}

interface AutomationStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecution?: Date;
  averageExecutionTime: number;
  notificationsSent: number;
}

export default function NotificationAutomation() {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Estados para el formulario de nueva regla
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: '',
    description: '',
    enabled: true,
    trigger: {
      type: 'event',
      parameters: {}
    },
    conditions: [],
    actions: [],
    stats: {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      notificationsSent: 0
    }
  });

  // Eventos disponibles para triggers
  const availableEvents = [
    { value: 'user.registered', label: 'Usuario registrado', description: 'Cuando un nuevo usuario se registra' },
    { value: 'user.login', label: 'Usuario inicia sesión', description: 'Cuando un usuario inicia sesión' },
    { value: 'user.inactive', label: 'Usuario inactivo', description: 'Cuando un usuario no ha estado activo por X días' },
    { value: 'benefit.created', label: 'Beneficio creado', description: 'Cuando se crea un nuevo beneficio' },
    { value: 'benefit.used', label: 'Beneficio utilizado', description: 'Cuando un usuario utiliza un beneficio' },
    { value: 'benefit.expires', label: 'Beneficio por vencer', description: 'Cuando un beneficio está por vencer' },
    { value: 'comercio.joined', label: 'Comercio se une', description: 'Cuando un comercio se une a la asociación' },
    { value: 'validation.completed', label: 'Validación completada', description: 'Cuando se completa una validación' },
    { value: 'payment.received', label: 'Pago recibido', description: 'Cuando se recibe un pago' },
    { value: 'membership.expires', label: 'Membresía por vencer', description: 'Cuando una membresía está por vencer' }
  ];

  // Campos disponibles para condiciones
  const availableFields = [
    { value: 'user.type', label: 'Tipo de usuario', type: 'select', options: ['socio', 'comercio', 'asociacion'] },
    { value: 'user.status', label: 'Estado del usuario', type: 'select', options: ['active', 'inactive', 'suspended'] },
    { value: 'user.registrationDate', label: 'Fecha de registro', type: 'date' },
    { value: 'user.lastLogin', label: 'Último login', type: 'date' },
    { value: 'user.location', label: 'Ubicación', type: 'text' },
    { value: 'user.age', label: 'Edad', type: 'number' },
    { value: 'user.membershipLevel', label: 'Nivel de membresía', type: 'select', options: ['basic', 'premium', 'vip'] },
    { value: 'benefit.category', label: 'Categoría del beneficio', type: 'text' },
    { value: 'benefit.value', label: 'Valor del beneficio', type: 'number' },
    { value: 'comercio.category', label: 'Categoría del comercio', type: 'text' },
    { value: 'validation.amount', label: 'Monto de validación', type: 'number' }
  ];

  // Tipos de acciones disponibles
  const availableActions = [
    { 
      value: 'send_notification', 
      label: 'Enviar notificación', 
      description: 'Envía una notificación usando una plantilla',
      icon: <Notifications />
    },
    { 
      value: 'create_segment', 
      label: 'Crear segmento', 
      description: 'Crea un nuevo segmento de usuarios',
      icon: <Group />
    },
    { 
      value: 'update_user', 
      label: 'Actualizar usuario', 
      description: 'Actualiza propiedades del usuario',
      icon: <Person />
    },
    { 
      value: 'webhook', 
      label: 'Webhook', 
      description: 'Llama a un webhook externo',
      icon: <Settings />
    },
    { 
      value: 'delay', 
      label: 'Esperar', 
      description: 'Añade un retraso antes de la siguiente acción',
      icon: <Timer />
    }
  ];

  useEffect(() => {
    loadAutomationRules();
  }, []);

  const loadAutomationRules = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular carga de reglas de automatización
      const mockRules: AutomationRule[] = [
        {
          id: '1',
          name: 'Bienvenida a nuevos usuarios',
          description: 'Envía un email de bienvenida cuando un usuario se registra',
          enabled: true,
          trigger: {
            type: 'event',
            event: 'user.registered',
            parameters: {}
          },
          conditions: [
            {
              field: 'user.type',
              operator: 'equals',
              value: 'socio'
            }
          ],
          actions: [
            {
              type: 'send_notification',
              parameters: {
                template: 'welcome_email',
                channel: 'email',
                delay: 0
              }
            }
          ],
          stats: {
            totalExecutions: 245,
            successfulExecutions: 242,
            failedExecutions: 3,
            lastExecution: new Date(Date.now() - 2 * 60 * 60 * 1000),
            averageExecutionTime: 1.2,
            notificationsSent: 242
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: '2',
          name: 'Recordatorio de beneficios por vencer',
          description: 'Notifica a usuarios sobre beneficios que vencen en 3 días',
          enabled: true,
          trigger: {
            type: 'schedule',
            schedule: '0 9 * * *', // Diario a las 9 AM
            parameters: {}
          },
          conditions: [
            {
              field: 'benefit.expiryDate',
              operator: 'less_than',
              value: '3 days'
            }
          ],
          actions: [
            {
              type: 'send_notification',
              parameters: {
                template: 'benefit_expiry_reminder',
                channel: 'push',
                delay: 0
              }
            }
          ],
          stats: {
            totalExecutions: 30,
            successfulExecutions: 28,
            failedExecutions: 2,
            lastExecution: new Date(Date.now() - 24 * 60 * 60 * 1000),
            averageExecutionTime: 5.8,
            notificationsSent: 156
          },
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          id: '3',
          name: 'Reactivación de usuarios inactivos',
          description: 'Campaña para reactivar usuarios que no han usado la app en 30 días',
          enabled: false,
          trigger: {
            type: 'schedule',
            schedule: '0 10 * * 1', // Lunes a las 10 AM
            parameters: {}
          },
          conditions: [
            {
              field: 'user.lastLogin',
              operator: 'less_than',
              value: '30 days ago'
            },
            {
              field: 'user.status',
              operator: 'equals',
              value: 'active',
              logicalOperator: 'AND'
            }
          ],
          actions: [
            {
              type: 'send_notification',
              parameters: {
                template: 'reactivation_email',
                channel: 'email',
                delay: 0
              }
            },
            {
              type: 'delay',
              parameters: {
                duration: '3 days'
              }
            },
            {
              type: 'send_notification',
              parameters: {
                template: 'reactivation_sms',
                channel: 'sms',
                delay: 0
              }
            }
          ],
          stats: {
            totalExecutions: 4,
            successfulExecutions: 3,
            failedExecutions: 1,
            lastExecution: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            averageExecutionTime: 12.5,
            notificationsSent: 89
          },
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      ];

      setAutomationRules(mockRules);
    } catch (err) {
      console.error('Error loading automation rules:', err);
      setError('Error al cargar las reglas de automatización');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      setAutomationRules(prev => prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() }
          : rule
      ));

      setSuccess('Estado de la regla actualizado');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error toggling rule:', err);
      setError('Error al actualizar la regla');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      setAutomationRules(prev => prev.filter(rule => rule.id !== ruleId));
      setSuccess('Regla eliminada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Error al eliminar la regla');
    }
  };

  const handleSaveRule = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!newRule.name || !newRule.trigger) {
        setError('Nombre y trigger son requeridos');
        return;
      }

      const ruleToSave: AutomationRule = {
        id: selectedRule?.id || Date.now().toString(),
        name: newRule.name!,
        description: newRule.description || '',
        enabled: newRule.enabled || true,
        trigger: newRule.trigger!,
        conditions: newRule.conditions || [],
        actions: newRule.actions || [],
        stats: selectedRule?.stats || {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          averageExecutionTime: 0,
          notificationsSent: 0
        },
        createdAt: selectedRule?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (selectedRule) {
        setAutomationRules(prev => prev.map(rule => 
          rule.id === selectedRule.id ? ruleToSave : rule
        ));
      } else {
        setAutomationRules(prev => [...prev, ruleToSave]);
      }

      setEditDialogOpen(false);
      setSelectedRule(null);
      setNewRule({
        name: '',
        description: '',
        enabled: true,
        trigger: { type: 'event', parameters: {} },
        conditions: [],
        actions: [],
        stats: {
          totalExecutions: 0,
          successfulExecutions: 0,
          failedExecutions: 0,
          averageExecutionTime: 0,
          notificationsSent: 0
        }
      });
      setActiveStep(0);

      setSuccess(selectedRule ? 'Regla actualizada exitosamente' : 'Regla creada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Error al guardar la regla');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRule = (rule: AutomationRule) => {
    setSelectedRule(rule);
    setNewRule(rule);
    setEditDialogOpen(true);
    setActiveStep(0);
  };

  const handleAddCondition = () => {
    setNewRule(prev => ({
      ...prev,
      conditions: [
        ...(prev.conditions || []),
        {
          field: 'user.type',
          operator: 'equals',
          value: ''
        }
      ]
    }));
  };

  const handleAddAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [
        ...(prev.actions || []),
        {
          type: 'send_notification',
          parameters: {}
        }
      ]
    }));
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'success' : 'default';
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? <PlayArrow /> : <Pause />;
  };

  const getSuccessRate = (stats: AutomationStats) => {
    if (stats.totalExecutions === 0) return 0;
    return Math.round((stats.successfulExecutions / stats.totalExecutions) * 100);
  };

  const filteredRules = automationRules.filter(rule => {
    if (filterStatus === 'active') return rule.enabled;
    if (filterStatus === 'inactive') return !rule.enabled;
    return true;
  });

  const renderRuleCard = (rule: AutomationRule) => (
    <motion.div
      key={rule.id}
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card sx={{ mb: 2 }}>
        <CardHeader
          avatar={
            <Avatar sx={{ 
              backgroundColor: rule.enabled ? '#4caf50' : '#9e9e9e',
              color: 'white'
            }}>
              {getStatusIcon(rule.enabled)}
            </Avatar>
          }
          title={rule.name}
          subheader={rule.description}
          action={
            <Stack direction="row" spacing={1}>
              <Chip
                size="small"
                label={rule.enabled ? 'Activa' : 'Inactiva'}
                color={getStatusColor(rule.enabled)}
              />
              <IconButton onClick={() => handleEditRule(rule)}>
                <Edit />
              </IconButton>
              <IconButton onClick={() => handleDeleteRule(rule.id)} color="error">
                <Delete />
              </IconButton>
            </Stack>
          }
        />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Ejecuciones
              </Typography>
              <Typography variant="h6">
                {rule.stats.totalExecutions.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Tasa de éxito
              </Typography>
              <Typography variant="h6" color={getSuccessRate(rule.stats) >= 95 ? 'success.main' : 'warning.main'}>
                {getSuccessRate(rule.stats)}%
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Notificaciones enviadas
              </Typography>
              <Typography variant="h6">
                {rule.stats.notificationsSent.toLocaleString()}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Última ejecución
              </Typography>
              <Typography variant="body2">
                {rule.stats.lastExecution 
                  ? new Date(rule.stats.lastExecution).toLocaleString()
                  : 'Nunca'
                }
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Trigger: {rule.trigger.type === 'event' ? 'Evento' : 'Programado'}
              </Typography>
              <Typography variant="body2">
                {rule.trigger.event || rule.trigger.schedule}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">
                Condiciones: {rule.conditions.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Acciones: {rule.actions.length}
              </Typography>
            </Box>

            <Switch
              checked={rule.enabled}
              onChange={() => handleToggleRule(rule.id)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <TextField
              label="Nombre de la regla"
              value={newRule.name || ''}
              onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="Descripción"
              value={newRule.description || ''}
              onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newRule.enabled || false}
                  onChange={(e) => setNewRule(prev => ({ ...prev, enabled: e.target.checked }))}
                />
              }
              label="Activar regla inmediatamente"
            />
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de trigger</InputLabel>
              <Select
                value={newRule.trigger?.type || 'event'}
                onChange={(e) => setNewRule(prev => ({
                  ...prev,
                  trigger: { ...prev.trigger!, type: e.target.value as 'event' | 'schedule' | 'condition' | 'webhook' }
                }))}
              >
                <MenuItem value="event">Evento</MenuItem>
                <MenuItem value="schedule">Programado</MenuItem>
                <MenuItem value="webhook">Webhook</MenuItem>
              </Select>
            </FormControl>

            {newRule.trigger?.type === 'event' && (
              <FormControl fullWidth>
                <InputLabel>Evento</InputLabel>
                <Select
                  value={newRule.trigger?.event || ''}
                  onChange={(e) => setNewRule(prev => ({
                    ...prev,
                    trigger: { ...prev.trigger!, event: e.target.value }
                  }))}
                >
                  {availableEvents.map((event) => (
                    <MenuItem key={event.value} value={event.value}>
                      <Box>
                        <Typography variant="body2">{event.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {newRule.trigger?.type === 'schedule' && (
              <TextField
                label="Expresión cron"
                value={newRule.trigger?.schedule || ''}
                onChange={(e) => setNewRule(prev => ({
                  ...prev,
                  trigger: { ...prev.trigger!, schedule: e.target.value }
                }))}
                fullWidth
                helperText="Ej: 0 9 * * * (diario a las 9 AM)"
              />
            )}
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Condiciones</Typography>
              <Button startIcon={<Add />} onClick={handleAddCondition}>
                Añadir condición
              </Button>
            </Box>

            {(newRule.conditions || []).map((condition, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Campo</InputLabel>
                      <Select
                        value={condition.field}
                        onChange={(e) => {
                          const newConditions = [...(newRule.conditions || [])];
                          newConditions[index].field = e.target.value;
                          setNewRule(prev => ({ ...prev, conditions: newConditions }));
                        }}
                      >
                        {availableFields.map((field) => (
                          <MenuItem key={field.value} value={field.value}>
                            {field.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Operador</InputLabel>
                      <Select
                        value={condition.operator}
                        onChange={(e) => {
                          const newConditions = [...(newRule.conditions || [])];
                          newConditions[index].operator = e.target.value as AutomationCondition['operator'];
                          setNewRule(prev => ({ ...prev, conditions: newConditions }));
                        }}
                      >
                        <MenuItem value="equals">Igual a</MenuItem>
                        <MenuItem value="not_equals">Diferente de</MenuItem>
                        <MenuItem value="greater_than">Mayor que</MenuItem>
                        <MenuItem value="less_than">Menor que</MenuItem>
                        <MenuItem value="contains">Contiene</MenuItem>
                        <MenuItem value="in">En</MenuItem>
                        <MenuItem value="not_in">No en</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Valor"
                      value={condition.value}
                      onChange={(e) => {
                        const newConditions = [...(newRule.conditions || [])];
                        newConditions[index].value = e.target.value;
                        setNewRule(prev => ({ ...prev, conditions: newConditions }));
                      }}
                      fullWidth
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <IconButton
                      onClick={() => {
                        const newConditions = (newRule.conditions || []).filter((_, i) => i !== index);
                        setNewRule(prev => ({ ...prev, conditions: newConditions }));
                      }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        );

      case 3:
        return (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Acciones</Typography>
              <Button startIcon={<Add />} onClick={handleAddAction}>
                Añadir acción
              </Button>
            </Box>

            {(newRule.actions || []).map((action, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Tipo de acción</InputLabel>
                    <Select
                      value={action.type}
                      onChange={(e) => {
                        const newActions = [...(newRule.actions || [])];
                        newActions[index].type = e.target.value as AutomationAction["type"];
                        setNewRule(prev => ({ ...prev, actions: newActions }));
                      }}
                    >
                      {availableActions.map((actionType) => (
                        <MenuItem key={actionType.value} value={actionType.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {actionType.icon}
                            <Box>
                              <Typography variant="body2">{actionType.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {actionType.description}
                              </Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {action.type === 'send_notification' && (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                      <TextField
                        label="Plantilla"
                        value={action.parameters.template || ''}
                        onChange={(e) => {
                          const newActions = [...(newRule.actions || [])];
                          newActions[index].parameters.template = e.target.value;
                          setNewRule(prev => ({ ...prev, actions: newActions }));
                        }}
                        fullWidth
                      />
                      <FormControl fullWidth>
                        <InputLabel>Canal</InputLabel>
                        <Select
                          value={action.parameters.channel || 'email'}
                          onChange={(e) => {
                            const newActions = [...(newRule.actions || [])];
                            newActions[index].parameters.channel = e.target.value;
                            setNewRule(prev => ({ ...prev, actions: newActions }));
                          }}
                        >
                          <MenuItem value="email">Email</MenuItem>
                          <MenuItem value="sms">SMS</MenuItem>
                          <MenuItem value="push">Push</MenuItem>
                          <MenuItem value="app">App</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                  {action.type === 'delay' && (
                    <TextField
                      label="Duración del retraso"
                      value={action.parameters.duration || ''}
                      onChange={(e) => {
                        const newActions = [...(newRule.actions || [])];
                        newActions[index].parameters.duration = e.target.value;
                        setNewRule(prev => ({ ...prev, actions: newActions }));
                      }}
                      fullWidth
                      helperText="Ej: 1 hour, 2 days, 30 minutes"
                    />
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <IconButton
                      onClick={() => {
                        const newActions = (newRule.actions || []).filter((_, i) => i !== index);
                        setNewRule(prev => ({ ...prev, actions: newActions }));
                      }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Automatización de Notificaciones
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configura reglas inteligentes para automatizar el envío de notificaciones
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

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filtrar</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <MenuItem value="all">Todas</MenuItem>
                <MenuItem value="active">Activas</MenuItem>
                <MenuItem value="inactive">Inactivas</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="body2" color="text.secondary">
              {filteredRules.length} reglas encontradas
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={loadAutomationRules}
              disabled={loading}
            >
              Actualizar
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setSelectedRule(null);
                setNewRule({
                  name: '',
                  description: '',
                  enabled: true,
                  trigger: { type: 'event', parameters: {} },
                  conditions: [],
                  actions: [],
                  stats: {
                    totalExecutions: 0,
                    successfulExecutions: 0,
                    failedExecutions: 0,
                    averageExecutionTime: 0,
                    notificationsSent: 0
                  }
                });
                setActiveStep(0);
                setEditDialogOpen(true);
              }}
            >
              Nueva Regla
            </Button>
          </Box>
        </Stack>
      </Paper>

      {/* Rules List */}
      <Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <LinearProgress sx={{ width: '100%' }} />
          </Box>
        ) : filteredRules.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AutoMode sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No hay reglas de automatización
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crea tu primera regla para automatizar el envío de notificaciones
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setEditDialogOpen(true)}
            >
              Crear Primera Regla
            </Button>
          </Paper>
        ) : (
          <Box>
            {filteredRules.map(renderRuleCard)}
          </Box>
        )}
      </Box>

      {/* Edit/Create Rule Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '600px' }
        }}
      >
        <DialogTitle>
          {selectedRule ? 'Editar Regla' : 'Nueva Regla de Automatización'}
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
            <Step>
              <StepLabel>Información básica</StepLabel>
              <StepContent>
                {renderStepContent(0)}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(1)}
                    disabled={!newRule.name}
                  >
                    Continuar
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Configurar trigger</StepLabel>
              <StepContent>
                {renderStepContent(1)}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setActiveStep(0)}>
                    Atrás
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(2)}
                    disabled={!newRule.trigger?.type}
                  >
                    Continuar
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Condiciones</StepLabel>
              <StepContent>
                {renderStepContent(2)}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setActiveStep(1)}>
                    Atrás
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => setActiveStep(3)}
                  >
                    Continuar
                  </Button>
                </Box>
              </StepContent>
            </Step>

            <Step>
              <StepLabel>Acciones</StepLabel>
              <StepContent>
                {renderStepContent(3)}
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button onClick={() => setActiveStep(2)}>
                    Atrás
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSaveRule}
                    disabled={loading || (newRule.actions || []).length === 0}
                  >
                    {loading ? 'Guardando...' : 'Guardar Regla'}
                  </Button>
                </Box>
              </StepContent>
            </Step>
          </Stepper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>
            Cancelar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}