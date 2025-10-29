'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Avatar,
  alpha,
} from '@mui/material';
import {
  MoreVert,
  Circle,
  CheckCircle,
  Archive,
  Delete,
  Launch,
  Schedule,
  Person,
  Info,
  CheckCircleOutline,
  Warning,
  Error,
  Campaign,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { Notification, NotificationType, NotificationPriority } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAction?: (url: string) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; bgcolor: string }> = {
  info: {
    icon: <Info />,
    color: '#3b82f6',
    bgcolor: alpha('#3b82f6', 0.1)
  },
  success: {
    icon: <CheckCircleOutline />,
    color: '#10b981',
    bgcolor: alpha('#10b981', 0.1)
  },
  warning: {
    icon: <Warning />,
    color: '#f59e0b',
    bgcolor: alpha('#f59e0b', 0.1)
  },
  error: {
    icon: <Error />,
    color: '#ef4444',
    bgcolor: alpha('#ef4444', 0.1)
  },
  announcement: {
    icon: <Campaign />,
    color: '#8b5cf6',
    bgcolor: alpha('#8b5cf6', 0.1)
  }
};

const priorityConfig: Record<NotificationPriority, { color: string; label: string }> = {
  low: { color: '#6b7280', label: 'Baja' },
  medium: { color: '#3b82f6', label: 'Media' },
  high: { color: '#f59e0b', label: 'Alta' },
  urgent: { color: '#ef4444', label: 'Urgente' }
};

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onArchive,
  onDelete,
  onAction,
  selected = false,
  onSelect
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

  const handleAction = (action: () => void) => {
    action();
    handleMenuClose();
  };

  const handleCardClick = () => {
    if (notification.status === 'unread') {
      onMarkAsRead(notification.id);
    }
    if (onSelect) {
      onSelect(notification.id, !selected);
    }
  };

  const typeInfo = typeConfig[notification.type];
  const priority = notification.priority || 'medium'; // Default to medium if not specified
  const priorityInfo = priorityConfig[priority];
  const isUnread = notification.status === 'unread';
  const isExpired = notification.expiresAt && new Date() > new Date(notification.expiresAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Paper
        elevation={0}
        onClick={handleCardClick}
        sx={{
          p: 3,
          mb: 2,
          border: selected 
            ? `2px solid ${alpha('#6366f1', 0.3)}` 
            : isUnread 
              ? `2px solid ${alpha(typeInfo.color, 0.2)}` 
              : '1px solid #f1f5f9',
          borderRadius: 4,
          cursor: 'pointer',
          bgcolor: selected 
            ? alpha('#6366f1', 0.02)
            : isUnread 
              ? alpha(typeInfo.color, 0.02) 
              : '#ffffff',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: alpha(typeInfo.color, 0.3),
            boxShadow: `0 8px 32px ${alpha(typeInfo.color, 0.15)}`,
            transform: 'translateY(-2px)',
          },
          '&::before': isUnread ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${typeInfo.color}, ${alpha(typeInfo.color, 0.6)})`,
          } : {},
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
            {/* Type Icon */}
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: typeInfo.bgcolor,
                color: typeInfo.color,
              }}
            >
              {typeInfo.icon}
            </Avatar>

            {/* Title and Meta */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: isUnread ? 700 : 600,
                    color: '#1e293b',
                    fontSize: '1rem',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {notification.title}
                </Typography>
                {isUnread && (
                  <Circle sx={{ fontSize: 8, color: typeInfo.color }} />
                )}
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={priorityInfo.label}
                  size="small"
                  sx={{
                    bgcolor: alpha(priorityInfo.color, 0.1),
                    color: priorityInfo.color,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
                
                {notification.metadata?.senderName && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Person sx={{ fontSize: 14, color: '#94a3b8' }} />
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                      {notification.metadata.senderName}
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Schedule sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                    {formatDistanceToNow(new Date(notification.createdAt), { 
                      addSuffix: true, 
                      locale: es 
                    })}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {onSelect && (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(notification.id, !selected);
                }}
                sx={{
                  color: selected ? '#6366f1' : '#94a3b8',
                  '&:hover': {
                    bgcolor: alpha('#6366f1', 0.1),
                    color: '#6366f1',
                  }
                }}
              >
                {selected ? <CheckCircle /> : <RadioButtonUnchecked />}
              </IconButton>
            )}
            
            <IconButton
              onClick={handleMenuClick}
              sx={{
                color: '#94a3b8',
                '&:hover': {
                  bgcolor: alpha('#6366f1', 0.1),
                  color: '#6366f1',
                }
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Message */}
        <Typography
          variant="body2"
          sx={{
            color: '#64748b',
            lineHeight: 1.6,
            mb: 2,
            fontWeight: isUnread ? 500 : 400,
          }}
        >
          {notification.message}
        </Typography>

        {/* Tags */}
        {notification.metadata?.tags && notification.metadata.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
            {notification.metadata.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  borderColor: alpha('#94a3b8', 0.3),
                  color: '#64748b',
                }}
              />
            ))}
          </Box>
        )}

        {/* Footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {notification.metadata?.recipientCount && (
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                {notification.metadata.recipientCount} destinatarios
              </Typography>
            )}
            
            {isExpired && (
              <Chip
                label="Expirada"
                size="small"
                sx={{
                  bgcolor: alpha('#ef4444', 0.1),
                  color: '#ef4444',
                  fontSize: '0.7rem',
                  height: 20,
                }}
              />
            )}
          </Box>

          {notification.actionUrl && notification.actionLabel && (
            <Button
              size="small"
              endIcon={<Launch sx={{ fontSize: 14 }} />}
              onClick={(e) => {
                e.stopPropagation();
                if (onAction) {
                  onAction(notification.actionUrl!);
                }
              }}
              sx={{
                color: typeInfo.color,
                fontWeight: 600,
                fontSize: '0.8rem',
                '&:hover': {
                  bgcolor: alpha(typeInfo.color, 0.1),
                }
              }}
            >
              {notification.actionLabel}
            </Button>
          )}
        </Box>

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
          {notification.status === 'unread' ? (
            <MenuItem onClick={() => handleAction(() => onMarkAsRead(notification.id))}>
              <CheckCircle sx={{ mr: 2, fontSize: 18, color: '#10b981' }} />
              Marcar como leída
            </MenuItem>
          ) : (
            <MenuItem onClick={() => handleAction(() => onMarkAsUnread(notification.id))}>
              <Circle sx={{ mr: 2, fontSize: 18, color: '#6366f1' }} />
              Marcar como no leída
            </MenuItem>
          )}
          
          {notification.status !== 'archived' && (
            <MenuItem onClick={() => handleAction(() => onArchive(notification.id))}>
              <Archive sx={{ mr: 2, fontSize: 18, color: '#f59e0b' }} />
              Archivar
            </MenuItem>
          )}
          
          <MenuItem 
            onClick={() => handleAction(() => onDelete(notification.id))}
            sx={{ color: '#ef4444' }}
          >
            <Delete sx={{ mr: 2, fontSize: 18 }} />
            Eliminar
          </MenuItem>
        </Menu>
      </Paper>
    </motion.div>
  );
};