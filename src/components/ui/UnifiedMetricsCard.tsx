'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  alpha,
  Avatar,
  LinearProgress,
  IconButton,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  ArrowForward,
  Remove,
} from '@mui/icons-material';

export interface UnifiedMetricProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  gradient?: string;
  delay?: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large' | 'xl';
  variant?: 'default' | 'compact' | 'detailed';
  showProgress?: boolean;
  progressValue?: number;
  badge?: string | number;
  description?: string;
}

const UnifiedMetricsCard: React.FC<UnifiedMetricProps> = ({
  title,
  value,
  change = 0,
  icon,
  color,
  gradient,
  delay = 0,
  subtitle,
  trend = 'neutral',
  onClick,
  loading = false,
  size = 'large',
  variant = 'detailed',
  showProgress = true,
  progressValue,
  badge,
  description,
}) => {
  // Tamaños más grandes y generosos
  const sizeConfig = {
    small: {
      cardHeight: '180px',
      iconSize: 48,
      titleFontSize: '0.75rem',
      valueFontSize: '2rem',
      padding: 3,
      subtitleFontSize: '0.85rem',
      descriptionFontSize: '0.75rem',
    },
    medium: {
      cardHeight: '220px',
      iconSize: 64,
      titleFontSize: '0.8rem',
      valueFontSize: '2.5rem',
      padding: 3.5,
      subtitleFontSize: '0.9rem',
      descriptionFontSize: '0.8rem',
    },
    large: {
      cardHeight: '260px',
      iconSize: 72,
      titleFontSize: '0.85rem',
      valueFontSize: '3rem',
      padding: 4,
      subtitleFontSize: '0.95rem',
      descriptionFontSize: '0.85rem',
    },
    xl: {
      cardHeight: '300px',
      iconSize: 88,
      titleFontSize: '0.9rem',
      valueFontSize: '3.5rem',
      padding: 5,
      subtitleFontSize: '1rem',
      descriptionFontSize: '0.9rem',
    },
  };

  const config = sizeConfig[size];
  const finalGradient = gradient || `linear-gradient(135deg, ${color} 0%, ${alpha(color, 0.8)} 100%)`;
  const calculatedProgressValue = progressValue !== undefined ? progressValue : Math.min(Math.abs(change) * 10, 100);

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp sx={{ fontSize: 18 }} />;
      case 'down':
        return <TrendingDown sx={{ fontSize: 18 }} />;
      default:
        return <Remove sx={{ fontSize: 18 }} />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#10b981';
      case 'down':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const formatValue = (val: string | number) => {
    if (loading) return '...';
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    // Truncar texto largo pero mostrar más caracteres
    if (typeof val === 'string' && val.length > 25) {
      return `${val.substring(0, 22)}...`;
    }
    return val;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        y: onClick ? -8 : -4,
        transition: { duration: 0.2 }
      }}
      style={{ height: '100%' }}
    >
      <Card
        elevation={0}
        onClick={onClick}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #f1f5f9',
          borderRadius: 5,
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: onClick ? 'pointer' : 'default',
          height: config.cardHeight,
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            borderColor: alpha(color, 0.4),
            boxShadow: `0 25px 80px -20px ${alpha(color, 0.3)}`,
            '& .metric-icon': {
              transform: 'scale(1.15) rotate(8deg)',
              background: finalGradient,
              color: 'white',
              boxShadow: `0 12px 32px ${alpha(color, 0.4)}`,
            },
            '& .metric-glow': {
              opacity: 1,
              height: '4px',
            },
            '& .metric-action': {
              opacity: 1,
              transform: 'scale(1.1)',
            }
          },
        }}
      >
        {/* Top glow effect más prominente */}
        <Box
          className="metric-glow"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: finalGradient,
            opacity: 0.7,
            transition: 'all 0.3s ease',
          }}
        />

        {/* Badge más visible */}
        {badge && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 2,
            }}
          >
            <Chip
              label={badge}
              size="small"
              sx={{
                bgcolor: alpha(color, 0.15),
                color: color,
                fontWeight: 800,
                fontSize: '0.75rem',
                height: 24,
                px: 1,
                '& .MuiChip-label': {
                  px: 1.5,
                }
              }}
            />
          </Box>
        )}
        
        <CardContent 
          sx={{ 
            p: config.padding, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* Header Section con más espacio */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
            <Avatar
              className="metric-icon"
              sx={{
                width: config.iconSize,
                height: config.iconSize,
                bgcolor: alpha(color, 0.12),
                color: color,
                borderRadius: 4,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: `0 8px 24px ${alpha(color, 0.25)}`,
                border: `2px solid ${alpha(color, 0.1)}`,
              }}
            >
              {loading ? (
                <CircularProgress size={config.iconSize * 0.4} sx={{ color: 'inherit' }} />
              ) : (
                React.cloneElement(icon as React.ReactElement, {
                })
              )}
            </Avatar>
            
            {/* Trend indicator más grande */}
            {change !== 0 && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                bgcolor: alpha(getTrendColor(), 0.1),
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
              }}>
                {getTrendIcon()}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 800,
                    color: getTrendColor(),
                    fontSize: '0.9rem'
                  }}
                >
                  {change > 0 ? '+' : ''}{change}%
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Content Section con más espacio */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: '#94a3b8',
                  fontWeight: 800,
                  fontSize: config.titleFontSize,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  mb: 1.5,
                  display: 'block',
                  lineHeight: 1.3,
                }}
              >
                {title}
              </Typography>
              
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: '#0f172a',
                  fontSize: config.valueFontSize,
                  letterSpacing: '-0.025em',
                  lineHeight: 0.9,
                  mb: subtitle || description ? 1.5 : 0,
                  wordBreak: 'break-word',
                }}
                title={typeof value === 'string' ? value : undefined}
              >
                {formatValue(value)}
              </Typography>
              
              {subtitle && (
                <Typography
                  variant="body1"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: config.subtitleFontSize,
                    mb: description ? 1 : 0,
                    lineHeight: 1.4,
                  }}
                >
                  {subtitle}
                </Typography>
              )}

              {description && variant === 'detailed' && (
                <Typography
                  variant="body2"
                  sx={{
                    color: '#94a3b8',
                    fontSize: config.descriptionFontSize,
                    lineHeight: 1.4,
                    fontWeight: 500,
                  }}
                >
                  {description}
                </Typography>
              )}
            </Box>
            
            {/* Footer Section con más espacio */}
            <Box sx={{ mt: 'auto', pt: 2 }}>
              {/* Progress indicator más grueso */}
              {showProgress && (
                <Box sx={{ mb: onClick ? 2.5 : 0 }}>
                  <LinearProgress
                    variant="determinate"
                    value={loading ? 0 : calculatedProgressValue}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: alpha(color, 0.12),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: color,
                        borderRadius: 3,
                        background: finalGradient,
                      }
                    }}
                  />
                  {/* Mostrar valor del progreso */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#94a3b8',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      mt: 0.5,
                      display: 'block',
                    }}
                  >
                    {calculatedProgressValue.toFixed(0)}% completado
                  </Typography>
                </Box>
              )}
              
              {/* Action button más grande */}
              {onClick && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton
                    className="metric-action"
                    size="medium"
                    sx={{
                      color: color,
                      bgcolor: alpha(color, 0.12),
                      opacity: 0.8,
                      transform: 'scale(0.95)',
                      transition: 'all 0.3s ease',
                      width: 44,
                      height: 44,
                      '&:hover': {
                        bgcolor: alpha(color, 0.2),
                        transform: 'scale(1.15)',
                        boxShadow: `0 8px 24px ${alpha(color, 0.3)}`,
                      },
                    }}
                  >
                    <ArrowForward sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UnifiedMetricsCard;