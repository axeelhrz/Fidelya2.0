'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Chip,
  alpha,
} from '@mui/material';
import {
  Close,
  Info,
  CheckCircleOutline,
  Warning,
  Error,
  Campaign,
  Notifications,
} from '@mui/icons-material';
import { Notification, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface RealTimeNotificationsProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (id: string) => void;
  maxVisible?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
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

const getPositionStyles = (position: string) => {
  switch (position) {
    case 'top-left':
      return { top: 24, left: 24 };
    case 'bottom-right':
      return { bottom: 24, right: 24 };
    case 'bottom-left':
      return { bottom: 24, left: 24 };
    default: // top-right
      return { top: 24, right: 24 };
  }
};

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  notifications,
  onNotificationClick,
  onNotificationDismiss,
  maxVisible = 5,
  position = 'top-right'
}) => {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Filtrar notificaciones no leídas y no descartadas
  useEffect(() => {
    const unreadNotifications = notifications
      .filter(n => n.status === 'unread' && !dismissedIds.has(n.id))
      .slice(0, maxVisible);
    
    setVisibleNotifications(unreadNotifications);
  }, [notifications, dismissedIds, maxVisible]);

  const handleDismiss = React.useCallback((id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    if (onNotificationDismiss) {
      onNotificationDismiss(id);
    }
  }, [onNotificationDismiss]);

  // Auto-dismiss notifications after 10 seconds for non-urgent ones
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    visibleNotifications.forEach(notification => {
      if (notification.priority !== 'urgent') {
        const timer = setTimeout(() => {
          handleDismiss(notification.id);
        }, 10000);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleNotifications, handleDismiss]);

  const handleClick = (notification: Notification) => {
    handleDismiss(notification.id);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        ...getPositionStyles(position),
        zIndex: 9999,
        maxWidth: 400,
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification, index) => {
          const typeInfo = typeConfig[notification.type];
          
          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: position.includes('right') ? 400 : -400, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                x: 0, 
                scale: 1,
                y: index * -10 // Slight stacking effect
              }}
              exit={{ 
                opacity: 0, 
                x: position.includes('right') ? 400 : -400, 
                scale: 0.8,
                transition: { duration: 0.2 }
              }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                delay: index * 0.1
              }}
              whileHover={{ scale: 1.02, y: index * -10 - 5 }}
              style={{ 
                marginBottom: 12,
                pointerEvents: 'auto',
                zIndex: visibleNotifications.length - index
              }}
            >
              <Paper
                elevation={8}
                onClick={() => handleClick(notification)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: `2px solid ${alpha(typeInfo.color, 0.2)}`,
                  bgcolor: '#ffffff',
                  backdropFilter: 'blur(10px)',
                  boxShadow: `0 20px 60px ${alpha(typeInfo.color, 0.15)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  maxWidth: '100%',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: alpha(typeInfo.color, 0.4),
                    boxShadow: `0 25px 80px ${alpha(typeInfo.color, 0.25)}`,
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${typeInfo.color}, ${alpha(typeInfo.color, 0.6)})`,
                  },
                }}
              >
                {/* Animated background pattern */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.03,
                    backgroundImage: `radial-gradient(circle at 1px 1px, ${typeInfo.color} 1px, transparent 0)`,
                    backgroundSize: '20px 20px',
                    animation: 'float 20s ease-in-out infinite',
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-10px)' },
                    },
                  }}
                />

                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: typeInfo.bgcolor,
                      color: typeInfo.color,
                      animation: notification.priority === 'urgent' ? 'pulse 2s infinite' : 'none',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.1)' },
                        '100%': { transform: 'scale(1)' },
                      },
                    }}
                  >
                    {typeInfo.icon}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: '#1e293b',
                          fontSize: '0.95rem',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          flex: 1,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      
                      {notification.priority === 'urgent' && (
                        <Chip
                          label="URGENTE"
                          size="small"
                          sx={{
                            bgcolor: alpha('#ef4444', 0.1),
                            color: '#ef4444',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 18,
                            animation: 'blink 1.5s infinite',
                            '@keyframes blink': {
                              '0%, 50%': { opacity: 1 },
                              '51%, 100%': { opacity: 0.5 },
                            },
                          }}
                        />
                      )}
                    </Box>
                    
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#64748b',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      <Notifications sx={{ fontSize: 12 }} />
                      {formatDistanceToNow(new Date(notification.createdAt), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </Typography>
                  </Box>

                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(notification.id);
                    }}
                    size="small"
                    sx={{
                      color: '#94a3b8',
                      bgcolor: alpha('#94a3b8', 0.1),
                      '&:hover': {
                        bgcolor: alpha('#ef4444', 0.1),
                        color: '#ef4444',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Close sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>

                {/* Message */}
                <Typography
                  variant="body2"
                  sx={{
                    color: '#475569',
                    lineHeight: 1.5,
                    fontSize: '0.85rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: notification.actionLabel ? 2 : 0,
                  }}
                >
                  {notification.message}
                </Typography>

                {/* Action Button */}
                {notification.actionLabel && (
                  <Box sx={{ mt: 2, textAlign: 'right' }}>
                    <Chip
                      label={notification.actionLabel}
                      size="small"
                      clickable
                      sx={{
                        bgcolor: alpha(typeInfo.color, 0.1),
                        color: typeInfo.color,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        '&:hover': {
                          bgcolor: alpha(typeInfo.color, 0.2),
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Progress bar for auto-dismiss */}
                {notification.priority !== 'urgent' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      height: 2,
                      bgcolor: alpha(typeInfo.color, 0.3),
                      animation: 'shrink 10s linear',
                      '@keyframes shrink': {
                        '0%': { width: '100%' },
                        '100%': { width: '0%' },
                      },
                    }}
                  />
                )}
              </Paper>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </Box>
  );
};
