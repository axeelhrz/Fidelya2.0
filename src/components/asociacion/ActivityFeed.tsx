'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  IconButton,
  alpha,
  Divider,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  PersonAdd,
  Edit,
  Delete,
  Upload,
  Download,
  MoreVert,
  FilterList,
  Refresh,
  Timeline,
  Group,
  Payment,
  Settings,
  Security,
  Info,
} from '@mui/icons-material';

interface ActivityItem {
  id: string;
  type: 'member_added' | 'member_updated' | 'member_deleted' | 'bulk_import' | 'export' | 'payment' | 'system' | 'security';
  title: string;
  description: string;
  timestamp: Date;
  user: string;
  metadata?: {
    count?: number;
    amount?: number;
    [key: string]: unknown;
  };
  severity?: 'info' | 'success' | 'warning' | 'error';
}

interface ActivityFeedProps {
  activities?: ActivityItem[];
  loading?: boolean;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    type: 'member_added',
    title: 'Nuevo socio registrado',
    description: 'Juan Pérez se ha registrado como nuevo socio',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    user: 'Sistema',
    severity: 'success'
  },
  {
    id: '2',
    type: 'bulk_import',
    title: 'Importación masiva completada',
    description: '25 socios importados desde archivo CSV',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    user: 'Admin',
    metadata: { count: 25 },
    severity: 'info'
  },
  {
    id: '3',
    type: 'member_updated',
    title: 'Información actualizada',
    description: 'María García actualizó su información de contacto',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    user: 'María García',
    severity: 'info'
  },
  {
    id: '4',
    type: 'payment',
    title: 'Pago procesado',
    description: 'Cuota mensual de Carlos López procesada exitosamente',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    user: 'Sistema de Pagos',
    metadata: { amount: 50.00 },
    severity: 'success'
  },
  {
    id: '5',
    type: 'export',
    title: 'Exportación de datos',
    description: 'Lista de socios exportada a CSV',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    user: 'Admin',
    severity: 'info'
  },
  {
    id: '6',
    type: 'security',
    title: 'Intento de acceso fallido',
    description: 'Múltiples intentos de acceso desde IP desconocida',
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    user: 'Sistema de Seguridad',
    severity: 'warning'
  },
  {
    id: '7',
    type: 'member_deleted',
    title: 'Socio eliminado',
    description: 'Ana Martínez fue eliminada del sistema',
    timestamp: new Date(Date.now() - 120 * 60 * 1000),
    user: 'Admin',
    severity: 'error'
  },
  {
    id: '8',
    type: 'system',
    title: 'Actualización del sistema',
    description: 'Sistema actualizado a la versión 2.1.0',
    timestamp: new Date(Date.now() - 180 * 60 * 1000),
    user: 'Sistema',
    severity: 'info'
  }
];

const getActivityIcon = (type: ActivityItem['type']) => {
  const iconMap = {
    member_added: PersonAdd,
    member_updated: Edit,
    member_deleted: Delete,
    bulk_import: Upload,
    export: Download,
    payment: Payment,
    system: Settings,
    security: Security,
  };
  
  const IconComponent = iconMap[type] || Info;
  return <IconComponent sx={{ fontSize: 20 }} />;
};

const getActivityColor = (type: ActivityItem['type'], severity?: ActivityItem['severity']) => {
  if (severity) {
    const severityColors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#6366f1',
    };
    return severityColors[severity];
  }

  const typeColors = {
    member_added: '#10b981',
    member_updated: '#6366f1',
    member_deleted: '#ef4444',
    bulk_import: '#8b5cf6',
    export: '#06b6d4',
    payment: '#10b981',
    system: '#6b7280',
    security: '#f59e0b',
  };
  
  return typeColors[type] || '#6366f1';
};

const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Hace ${diffInDays}d`;
  
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const ActivityItem: React.FC<{ activity: ActivityItem; index: number }> = ({ activity, index }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const color = getActivityColor(activity.type, activity.severity);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Box sx={{ display: 'flex', gap: 3, py: 3, position: 'relative' }}>
        {/* Timeline line */}
        <Box
          sx={{
            position: 'absolute',
            left: 24,
            top: 60,
            bottom: -12,
            width: 2,
            bgcolor: '#f1f5f9',
            zIndex: 0,
          }}
        />
        
        {/* Activity icon */}
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: alpha(color, 0.1),
            color: color,
            borderRadius: 3,
            border: `2px solid ${alpha(color, 0.2)}`,
            zIndex: 1,
          }}
        >
          {getActivityIcon(activity.type)}
        </Avatar>
        
        {/* Activity content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: '#0f172a',
                  mb: 0.5,
                  fontSize: '0.9rem'
                }}
              >
                {activity.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: '#64748b',
                  fontSize: '0.85rem',
                  lineHeight: 1.4,
                  mb: 1
                }}
              >
                {activity.description}
              </Typography>
            </Box>
            
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                color: '#94a3b8',
                ml: 1,
                '&:hover': {
                  color: '#6366f1',
                  bgcolor: alpha('#6366f1', 0.1),
                }
              }}
            >
              <MoreVert sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            >
              {formatTimeAgo(activity.timestamp)}
            </Typography>
            
            <Typography
              variant="caption"
              sx={{
                color: '#94a3b8',
                fontSize: '0.75rem'
              }}
            >
              por {activity.user}
            </Typography>
            
            {activity.metadata && (
              <Chip
                label={
                  activity.type === 'bulk_import' ? `${activity.metadata.count} socios` :
                  activity.type === 'payment' ? `$${activity.metadata.amount}` :
                  'Detalles'
                }
                size="small"
                sx={{
                  bgcolor: alpha(color, 0.1),
                  color: color,
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            )}
          </Box>
        </Box>
        
        {/* Context menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9',
              minWidth: 180,
            }
          }}
        >
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <Info fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver detalles</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <Timeline fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ver historial</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </motion.div>
  );
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities = mockActivities,
  loading = false
}) => {
  const [filter, setFilter] = useState<'all' | 'members' | 'system' | 'security'>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const filteredActivities = useMemo(() => {
    if (filter === 'all') return activities;
    
    const filterMap = {
      members: ['member_added', 'member_updated', 'member_deleted', 'bulk_import'],
      system: ['system', 'export'],
      security: ['security']
    };
    
    return activities.filter(activity => 
      filterMap[filter]?.includes(activity.type)
    );
  }, [activities, filter]);

  const getFilterCount = (filterType: typeof filter) => {
    if (filterType === 'all') return activities.length;
    
    const filterMap = {
      members: ['member_added', 'member_updated', 'member_deleted', 'bulk_import'],
      system: ['system', 'export'],
      security: ['security']
    };
    
    return activities.filter(activity => 
      filterMap[filterType]?.includes(activity.type)
    ).length;
  };

  if (loading) {
    return (
      <Card
        elevation={0}
        sx={{
          border: '1px solid #f1f5f9',
          borderRadius: 6,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
            <Box>
              <Box sx={{ width: 180, height: 24, bgcolor: '#f1f5f9', borderRadius: 2, mb: 1 }} />
              <Box sx={{ width: 120, height: 16, bgcolor: '#f1f5f9', borderRadius: 1 }} />
            </Box>
            <Box sx={{ width: 100, height: 36, bgcolor: '#f1f5f9', borderRadius: 2 }} />
          </Box>
          
          {Array.from({ length: 6 }).map((_, index) => (
            <Box key={index} sx={{ display: 'flex', gap: 3, py: 3 }}>
              <Box sx={{ width: 48, height: 48, bgcolor: '#f1f5f9', borderRadius: 3 }} />
              <Box sx={{ flex: 1 }}>
                <Box sx={{ width: '70%', height: 16, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
                <Box sx={{ width: '90%', height: 14, bgcolor: '#f1f5f9', borderRadius: 1, mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ width: 60, height: 12, bgcolor: '#f1f5f9', borderRadius: 1 }} />
                  <Box sx={{ width: 80, height: 12, bgcolor: '#f1f5f9', borderRadius: 1 }} />
                </Box>
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid #f1f5f9',
          borderRadius: 6,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
        }}
      >
        {/* Header */}
        <CardContent sx={{ p: 4, borderBottom: '1px solid #f1f5f9' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: alpha('#6366f1', 0.15),
                  color: '#6366f1',
                  borderRadius: 3,
                }}
              >
                <Timeline sx={{ fontSize: 24 }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
                  Actividad Reciente
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>
                  {filteredActivities.length} eventos registrados
                </Typography>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Actualizar">
                <IconButton
                  sx={{
                    color: '#64748b',
                    '&:hover': {
                      color: '#10b981',
                      bgcolor: alpha('#10b981', 0.1),
                    }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
              
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: '#e2e8f0',
                  color: '#475569',
                  '&:hover': {
                    borderColor: '#6366f1',
                    bgcolor: alpha('#6366f1', 0.03),
                    color: '#6366f1',
                  },
                }}
              >
                Filtrar
              </Button>
            </Stack>
          </Box>

          {/* Filter chips */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            {[
              { key: 'all', label: 'Todos', icon: Timeline },
              { key: 'members', label: 'Socios', icon: Group },
              { key: 'system', label: 'Sistema', icon: Settings },
              { key: 'security', label: 'Seguridad', icon: Security },
            ].map(({ key, label, icon: Icon }) => {
              const count = getFilterCount(key as typeof filter);
              const isActive = filter === key;
              
              return (
                <Chip
                  key={key}
                  icon={<Icon sx={{ fontSize: 16 }} />}
                  label={`${label} (${count})`}
                  onClick={() => setFilter(key as typeof filter)}
                  sx={{
                    bgcolor: isActive ? alpha('#6366f1', 0.1) : alpha('#f1f5f9', 0.5),
                    color: isActive ? '#6366f1' : '#64748b',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    '&:hover': {
                      bgcolor: alpha('#6366f1', 0.15),
                      color: '#6366f1',
                    },
                    transition: 'all 0.2s ease'
                  }}
                />
              );
            })}
          </Stack>
        </CardContent>

        {/* Activity list */}
        <CardContent sx={{ p: 4, maxHeight: 600, overflow: 'auto' }}>
          {filteredActivities.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: alpha('#6b7280', 0.1),
                  color: '#6b7280',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Timeline sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                No hay actividad
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                No se encontraron eventos para el filtro seleccionado
              </Typography>
            </Box>
          ) : (
            <Box>
              {filteredActivities.map((activity, index) => (
                <Box key={activity.id}>
                  <ActivityItem activity={activity} index={index} />
                  {index < filteredActivities.length - 1 && (
                    <Divider sx={{ ml: 6, opacity: 0.5 }} />
                  )}
                </Box>
              ))}
            </Box>
          )}
        </CardContent>

        {/* Filter menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
              border: '1px solid #f1f5f9',
              minWidth: 200,
            }
          }}
        >
          <MenuItem onClick={() => { setFilter('all'); setAnchorEl(null); }}>
            <ListItemIcon>
              <Timeline fontSize="small" />
            </ListItemIcon>
            <ListItemText>Todos los eventos</ListItemText>
            <Badge badgeContent={getFilterCount('all')} color="primary" />
          </MenuItem>
          <MenuItem onClick={() => { setFilter('members'); setAnchorEl(null); }}>
            <ListItemIcon>
              <Group fontSize="small" />
            </ListItemIcon>
            <ListItemText>Actividad de socios</ListItemText>
            <Badge badgeContent={getFilterCount('members')} color="primary" />
          </MenuItem>
          <MenuItem onClick={() => { setFilter('system'); setAnchorEl(null); }}>
            <ListItemIcon>
              <Settings fontSize="small" />
            </ListItemIcon>
            <ListItemText>Eventos del sistema</ListItemText>
            <Badge badgeContent={getFilterCount('system')} color="primary" />
          </MenuItem>
          <MenuItem onClick={() => { setFilter('security'); setAnchorEl(null); }}>
            <ListItemIcon>
              <Security fontSize="small" />
            </ListItemIcon>
            <ListItemText>Alertas de seguridad</ListItemText>
            <Badge badgeContent={getFilterCount('security')} color="primary" />
          </MenuItem>
        </Menu>
      </Card>
    </motion.div>
  );
};