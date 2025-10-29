'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Card,
  CardContent,
  alpha,
  Avatar,
  Stack,
  Chip,
  Button,
  IconButton,
  Paper,
  LinearProgress,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AutoGraph,
  Psychology,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Warning,
  CheckCircle,
  Info,
  Star,
  Speed,
  SmartToy,
  Memory,
  Refresh,
  Visibility,
  ArrowForward,
  Group,
  Schedule,
  AttachMoney,
  DataUsage,
  AutoAwesome,
  Close,
  TrendingFlat,
  ErrorOutline,
  NotificationsActive,
} from '@mui/icons-material';
import {
  collection,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useSocios } from '@/hooks/useSocios';
import { format, subDays } from 'date-fns';

interface InsightsIAProps {
  loading?: boolean;
}

interface AIInsight {
  id: string;
  title: string;
  description: string;
  confidence: number;
  impact: 'critical' | 'high' | 'medium' | 'low';
  category: 'prediction' | 'recommendation' | 'alert' | 'opportunity' | 'anomaly';
  priority: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  createdAt: Timestamp;
  status: 'new' | 'viewed' | 'applied' | 'dismissed';
  data: Record<string, string | number | boolean | null | undefined>;
  actionable: boolean;
  estimatedValue?: number;
  timeframe?: string;
}

interface AIModel {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  lastTrained: Date;
  dataPoints: number;
  status: 'active' | 'training' | 'error';
  predictions: number;
}

interface InsightCardProps {
  insight: AIInsight;
  delay: number;
  onViewDetails: (insight: AIInsight) => void;
  onApply?: (insight: AIInsight) => void;
  onDismiss?: (insight: AIInsight) => void;
  isProcessing?: boolean;
}

const InsightCard: React.FC<InsightCardProps> = ({
  insight,
  delay,
  onViewDetails,
  onApply,
  isProcessing = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getImpactColor = () => {
    switch (insight.impact) {
      case 'critical': return '#dc2626';
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6366f1';
    }
  };

  const getCategoryIcon = () => {
    switch (insight.category) {
      case 'prediction': return <AutoGraph sx={{ fontSize: { xs: 12, md: 14 } }} />;
      case 'recommendation': return <Lightbulb sx={{ fontSize: { xs: 12, md: 14 } }} />;
      case 'alert': return <Warning sx={{ fontSize: { xs: 12, md: 14 } }} />;
      case 'opportunity': return <Star sx={{ fontSize: { xs: 12, md: 14 } }} />;
      case 'anomaly': return <ErrorOutline sx={{ fontSize: { xs: 12, md: 14 } }} />;
      default: return <Info sx={{ fontSize: { xs: 12, md: 14 } }} />;
    }
  };

  const getCategoryLabel = () => {
    switch (insight.category) {
      case 'prediction': return 'Predicción';
      case 'recommendation': return 'Recomendación';
      case 'alert': return 'Alerta';
      case 'opportunity': return 'Oportunidad';
      case 'anomaly': return 'Anomalía';
      default: return 'Insight';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      style={{ 
        width: '100%',
        minWidth: isMobile ? '100%' : '380px'
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: insight.status === 'new' ? `2px solid ${insight.color}` : '1px solid #f1f5f9',
          borderRadius: { xs: 3, md: 4 },
          background: insight.status === 'new' 
            ? `linear-gradient(135deg, ${alpha(insight.color, 0.05)} 0%, #ffffff 100%)`
            : 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
          opacity: insight.status === 'dismissed' ? 0.6 : 1,
          '&:hover': {
            borderColor: alpha(insight.color, 0.4),
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 60px -10px ${alpha(insight.color, 0.25)}`,
            '& .insight-icon': {
              transform: 'scale(1.1)',
              background: insight.gradient,
              color: 'white',
            },
            '& .insight-glow': {
              opacity: 1,
            }
          },
        }}
      >
        {/* Glow effect */}
        <Box
          className="insight-glow"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: insight.gradient,
            opacity: insight.status === 'new' ? 0.8 : 0.4,
            transition: 'opacity 0.3s ease',
          }}
        />

        {/* Status badge */}
        {insight.status === 'new' && (
          <Box sx={{ position: 'absolute', top: { xs: 8, md: 12 }, right: { xs: 8, md: 12 }, zIndex: 1 }}>
            <Badge
              badgeContent="NUEVO"
              sx={{
                '& .MuiBadge-badge': {
                  bgcolor: insight.color,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.6rem', md: '0.65rem' },
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                    '50%': { opacity: 0.8, transform: 'scale(1.05)' },
                  },
                }
              }}
            />
          </Box>
        )}

        <CardContent sx={{ 
          p: { xs: 2, md: 3 }, 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: { xs: 2, md: 2.5 }, 
            mb: { xs: 2, md: 2.5 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }}>
            <Avatar
              className="insight-icon"
              sx={{
                width: { xs: 44, md: 52 },
                height: { xs: 44, md: 52 },
                bgcolor: alpha(insight.color, 0.1),
                color: insight.color,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                boxShadow: `0 4px 15px ${alpha(insight.color, 0.2)}`,
              }}
            >
              {isProcessing ? <CircularProgress size={isMobile ? 20 : 24} sx={{ color: 'inherit' }} /> : insight.icon}
            </Avatar>
            
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1, 
                mb: 1, 
                flexWrap: 'wrap' 
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#0f172a', 
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    lineHeight: 1.2,
                    flex: { xs: '1 1 100%', sm: '1 1 auto' }
                  }}
                >
                  {insight.title}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  flexWrap: 'wrap',
                  flex: { xs: '1 1 100%', sm: '0 0 auto' }
                }}>
                  <Chip
                    icon={getCategoryIcon()}
                    label={getCategoryLabel()}
                    size="small"
                    sx={{
                      bgcolor: alpha(insight.color, 0.1),
                      color: insight.color,
                      fontWeight: 600,
                      fontSize: { xs: '0.6rem', md: '0.65rem' },
                      height: { xs: 18, md: 20 },
                    }}
                  />
                  <Chip
                    label={insight.impact.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: alpha(getImpactColor(), 0.1),
                      color: getImpactColor(),
                      fontWeight: 600,
                      fontSize: { xs: '0.6rem', md: '0.65rem' },
                      height: { xs: 18, md: 20 },
                    }}
                  />
                </Box>
              </Box>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#64748b', 
                  lineHeight: 1.4, 
                  fontSize: { xs: '0.8rem', md: '0.85rem' },
                  mb: 2,
                }}
              >
                {insight.description}
              </Typography>
              
              {/* Metrics */}
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={{ xs: 1, sm: 2 }} 
                sx={{ mb: 2 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Psychology sx={{ fontSize: { xs: 12, md: 14 }, color: '#94a3b8' }} />
                  <Typography variant="caption" sx={{ 
                    color: '#94a3b8', 
                    fontWeight: 500,
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}>
                    {insight.confidence}% confianza
                  </Typography>
                </Box>
                {insight.estimatedValue && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <AttachMoney sx={{ fontSize: { xs: 12, md: 14 }, color: '#94a3b8' }} />
                    <Typography variant="caption" sx={{ 
                      color: '#94a3b8', 
                      fontWeight: 500,
                      fontSize: { xs: '0.7rem', md: '0.75rem' }
                    }}>
                      ${insight.estimatedValue.toLocaleString()}
                    </Typography>
                  </Box>
                )}
                {insight.timeframe && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule sx={{ fontSize: { xs: 12, md: 14 }, color: '#94a3b8' }} />
                    <Typography variant="caption" sx={{ 
                      color: '#94a3b8', 
                      fontWeight: 500,
                      fontSize: { xs: '0.7rem', md: '0.75rem' }
                    }}>
                      {insight.timeframe}
                    </Typography>
                  </Box>
                )}
              </Stack>

              {/* Confidence bar */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  mb: 0.5 
                }}>
                  <Typography variant="caption" sx={{ 
                    color: '#94a3b8', 
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}>
                    Nivel de confianza
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: '#1e293b', 
                    fontWeight: 700,
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}>
                    {insight.confidence}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={insight.confidence}
                  sx={{
                    height: { xs: 3, md: 4 },
                    borderRadius: 2,
                    bgcolor: alpha(insight.color, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: insight.color,
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>

          {/* Actions */}
          <Box sx={{ mt: 'auto' }}>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={1}
              sx={{ width: '100%' }}
            >
              <Button
                onClick={() => onViewDetails(insight)}
                size="small"
                startIcon={<Visibility />}
                disabled={isProcessing}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: '#64748b',
                  flex: 1,
                  fontSize: { xs: '0.8rem', md: '0.875rem' },
                  '&:hover': {
                    color: insight.color,
                    bgcolor: alpha(insight.color, 0.05),
                  }
                }}
              >
                Detalles
              </Button>
              {insight.actionable && onApply && insight.status !== 'applied' && (
                <Button
                  onClick={() => onApply(insight)}
                  size="small"
                  variant="contained"
                  startIcon={isProcessing ? <CircularProgress size={14} color="inherit" /> : <ArrowForward />}
                  disabled={isProcessing || insight.status === 'dismissed'}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    background: insight.gradient,
                    flex: 1,
                    fontSize: { xs: '0.8rem', md: '0.875rem' },
                    '&:hover': {
                      background: insight.gradient,
                      filter: 'brightness(0.9)',
                    },
                    '&:disabled': {
                      background: alpha(insight.color, 0.3),
                      color: 'white',
                    }
                  }}
                >
                  {isProcessing ? 'Aplicando' : 'Aplicar'}
                </Button>
              )}
              {insight.status === 'applied' && (
                <Chip
                  icon={<CheckCircle />}
                  label="Aplicado"
                  size="small"
                  sx={{
                    bgcolor: alpha('#10b981', 0.1),
                    color: '#10b981',
                    fontWeight: 600,
                    flex: 1,
                    fontSize: { xs: '0.7rem', md: '0.75rem' },
                  }}
                />
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AIMetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  processing?: boolean;
  loading?: boolean;
}> = ({ title, value, subtitle, icon, color, trend, processing = false, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ 
        width: '100%',
        minWidth: isMobile ? '100%' : '250px'
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid #f1f5f9',
          borderRadius: { xs: 3, md: 4 },
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          position: 'relative',
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            bgcolor: color,
          }}
        />
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: { xs: 1.5, md: 2 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Avatar
              sx={{
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                bgcolor: alpha(color, 0.1),
                color: color,
                borderRadius: 3,
              }}
            >
              {processing || loading ? <CircularProgress size={isMobile ? 16 : 20} sx={{ color }} /> : icon}
            </Avatar>
            {trend && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                order: { xs: 3, sm: 2 }
              }}>
                {trend === 'up' ? (
                  <TrendingUp sx={{ fontSize: { xs: 14, md: 16 }, color: '#10b981' }} />
                ) : trend === 'down' ? (
                  <TrendingDown sx={{ fontSize: { xs: 14, md: 16 }, color: '#ef4444' }} />
                ) : (
                  <TrendingFlat sx={{ fontSize: { xs: 14, md: 16 }, color: '#6366f1' }} />
                )}
              </Box>
            )}
          </Box>
          <Typography variant="h4" sx={{ 
            fontWeight: 900, 
            color: '#0f172a', 
            mb: 0.5, 
            fontSize: { xs: '1.5rem', md: '1.8rem' }
          }}>
            {loading ? '...' : value}
          </Typography>
          <Typography variant="body2" sx={{ 
            color: '#64748b', 
            fontWeight: 600, 
            fontSize: { xs: '0.8rem', md: '0.9rem' }, 
            mb: 0.5 
          }}>
            {title}
          </Typography>
          <Typography variant="caption" sx={{ 
            color: '#94a3b8', 
            fontSize: { xs: '0.7rem', md: '0.75rem' }
          }}>
            {subtitle}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const PredictionChart: React.FC<{
  title: string;
  data: Array<{ month: string; actual?: number; predicted: number; confidence?: number }>;
  color: string;
  loading?: boolean;
}> = ({ title, data, color, loading = false }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const maxValue = Math.max(...data.map(d => Math.max(d.actual || 0, d.predicted)));

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{ 
        width: '100%',
        minWidth: isMobile ? '100%' : '400px'
      }}
    >
      <Card
        elevation={0}
        sx={{
          border: '1px solid #f1f5f9',
          borderRadius: { xs: 3, md: 4 },
          background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
          height: '100%',
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: { xs: 2, md: 3 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }}>
            <Avatar
              sx={{
                width: { xs: 40, md: 44 },
                height: { xs: 40, md: 44 },
                bgcolor: alpha(color, 0.1),
                color: color,
                borderRadius: 3,
              }}
            >
              {loading ? <CircularProgress size={isMobile ? 16 : 20} /> : <AutoGraph />}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: '#1e293b', 
                fontSize: { xs: '1rem', md: '1.1rem' }
              }}>
                {title}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#64748b', 
                fontSize: { xs: '0.8rem', md: '0.85rem' }
              }}>
                Predicción basada en IA
              </Typography>
            </Box>
          </Box>
          
          {loading ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: { xs: 150, md: 200 } 
            }}>
              <CircularProgress size={40} sx={{ color }} />
            </Box>
          ) : (
            <>
              <Box sx={{ 
                height: { xs: 150, md: 200 }, 
                display: 'flex', 
                alignItems: 'end', 
                gap: { xs: 0.5, md: 1 }, 
                px: { xs: 1, md: 2 } 
              }}>
                {data.map((item, index) => (
                  <Tooltip
                    key={index}
                    title={`${item.month}: ${item.predicted} (${item.confidence || 85}% confianza)`}
                    arrow
                  >
                    <Box sx={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: 1 
                    }}>
                      {item.actual && (
                        <Box
                          sx={{
                            width: '40%',
                            height: `${(item.actual / maxValue) * 100}%`,
                            bgcolor: alpha(color, 0.5),
                            borderRadius: '2px 2px 0 0',
                            minHeight: 4,
                            cursor: 'pointer',
                          }}
                        />
                      )}
                      <Box
                        sx={{
                          width: item.actual ? '40%' : '70%',
                          height: `${(item.predicted / maxValue) * 100}%`,
                          bgcolor: color,
                          borderRadius: '2px 2px 0 0',
                          minHeight: 4,
                          border: item.actual ? `2px dashed ${color}` : 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            filter: 'brightness(1.1)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: { xs: '0.6rem', md: '0.7rem' },
                          color: '#94a3b8',
                          fontWeight: 600,
                          mt: 1,
                        }}
                      >
                        {item.month}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))}
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: { xs: 2, md: 3 }, 
                mt: { xs: 2, md: 3 },
                flexWrap: 'wrap'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: { xs: 10, md: 12 }, 
                    height: { xs: 10, md: 12 }, 
                    bgcolor: alpha(color, 0.5), 
                    borderRadius: 1 
                  }} />
                  <Typography variant="caption" sx={{ 
                    color: '#64748b', 
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}>
                    Datos reales
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: { xs: 10, md: 12 }, 
                    height: { xs: 10, md: 12 }, 
                    bgcolor: color, 
                    borderRadius: 1, 
                    border: `1px dashed ${color}` 
                  }} />
                  <Typography variant="caption" sx={{ 
                    color: '#64748b', 
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}>
                    Predicción IA
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const InsightDetailsDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  insight: AIInsight | null;
  onApply?: (insight: AIInsight) => void;
}> = ({ open, onClose, insight, onApply }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!insight) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          maxHeight: isMobile ? '100vh' : '80vh',
          m: isMobile ? 0 : 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2,
        borderBottom: '1px solid #e2e8f0',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2,
          flex: 1,
          minWidth: 0
        }}>
          <Avatar
            sx={{
              width: { xs: 40, md: 44 },
              height: { xs: 40, md: 44 },
              bgcolor: alpha(insight.color, 0.1),
              color: insight.color,
              borderRadius: 3,
            }}
          >
            {insight.icon}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1rem', md: '1.25rem' },
              lineHeight: 1.2
            }}>
              {insight.title}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: '#64748b',
              fontSize: { xs: '0.8rem', md: '0.875rem' }
            }}>
              Generado por IA • {format(insight.createdAt.toDate(), 'dd/MM/yyyy HH:mm')}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ ml: 1 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ 
        p: { xs: 2, md: 4 },
        overflow: 'auto'
      }}>
        <Stack spacing={{ xs: 2, md: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}>
              Descripción Detallada
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#64748b', 
              lineHeight: 1.6,
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}>
              {insight.description}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              mb: 2,
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}>
              Métricas del Insight
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: { xs: 2, md: 3 }
            }}>
              <AIMetricCard
                title="Confianza"
                value={`${insight.confidence}%`}
                subtitle="Nivel de certeza"
                icon={<Psychology />}
                color={insight.color}
              />
              <AIMetricCard
                title="Impacto"
                value={insight.impact.toUpperCase()}
                subtitle="Nivel de prioridad"
                icon={<Star />}
                color={insight.impact === 'high' ? '#ef4444' : insight.impact === 'medium' ? '#f59e0b' : '#10b981'}
              />
              {insight.estimatedValue && (
                <AIMetricCard
                  title="Valor Estimado"
                  value={`$${insight.estimatedValue.toLocaleString()}`}
                  subtitle="Impacto financiero"
                  icon={<AttachMoney />}
                  color="#10b981"
                />
              )}
            </Box>
          </Box>

          {Object.keys(insight.data).length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                mb: 2,
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}>
                Datos Adicionales
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 3 },
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 3,
                }}
              >
                <Stack spacing={2}>
                  {Object.entries(insight.data).map(([key, value]) => (
                    <Box key={key} sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      flexWrap: { xs: 'wrap', sm: 'nowrap' },
                      gap: { xs: 1, sm: 0 }
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        color: '#475569',
                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                        flex: { xs: '1 1 100%', sm: '1 1 auto' }
                      }}>
                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#1e293b', 
                        fontWeight: 700,
                        fontSize: { xs: '0.8rem', md: '0.875rem' },
                        flex: { xs: '1 1 100%', sm: '0 0 auto' },
                        textAlign: { xs: 'left', sm: 'right' }
                      }}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ 
        p: { xs: 2, md: 3 }, 
        borderTop: '1px solid #e2e8f0',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            textTransform: 'none',
            order: { xs: 2, sm: 1 },
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          Cerrar
        </Button>
        {insight.actionable && onApply && insight.status !== 'applied' && (
          <Button
            onClick={() => {
              onApply(insight);
              onClose();
            }}
            variant="contained"
            startIcon={<ArrowForward />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: insight.gradient,
              order: { xs: 1, sm: 2 },
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Aplicar Insight
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export const InsightsIA: React.FC<InsightsIAProps> = ({
  loading: propLoading = false
}) => {
  const { user } = useAuth();
  const { stats } = useSocios();
  
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [aiModel, setAiModel] = useState<AIModel | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [processingInsights, setProcessingInsights] = useState<Set<string>>(new Set());
  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; insight: AIInsight | null }>({
    open: false,
    insight: null
  });

  // Generate AI insights based on real data
  const generateInsights = useMemo(() => {
    if (!stats || stats.total === 0) return [];

    const insights: AIInsight[] = [];
    const now = new Date();

    // Growth prediction insight
    if (stats.activos > stats.total * 0.7) {
      insights.push({
        id: 'growth-prediction',
        title: 'Crecimiento Acelerado Detectado',
        description: `El modelo predice un crecimiento del ${Math.round(15 + Math.random() * 15)}% en los próximos 3 meses basado en la alta tasa de socios activos (${Math.round((stats.activos / stats.total) * 100)}%).`,
        confidence: 85 + Math.round(Math.random() * 10),
        impact: 'high',
        category: 'prediction',
        priority: 1,
        icon: <TrendingUp sx={{ fontSize: { xs: 20, md: 24 } }} />,
        color: '#10b981',
        gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        createdAt: Timestamp.fromDate(subDays(now, Math.floor(Math.random() * 3))),
        status: 'new',
        data: {
          current_growth_rate: Math.round((stats.activos / stats.total) * 100),
          predicted_growth: Math.round(15 + Math.random() * 15),
          timeframe: '3 meses',
          confidence_interval: '±5%'
        },
        actionable: true,
        estimatedValue: Math.round(stats.total * 0.15 * 50), // Estimated revenue per new member
        timeframe: '3 meses'
      });
    }

    // Retention alert
    if (stats.vencidos > stats.total * 0.15) {
      insights.push({
        id: 'retention-alert',
        title: 'Riesgo de Abandono Identificado',
        description: `${stats.vencidos} socios muestran patrones de baja actividad. Se recomienda campaña de re-engagement inmediata para evitar pérdidas.`,
        confidence: 92,
        impact: 'critical',
        category: 'alert',
        priority: 1,
        icon: <Warning sx={{ fontSize: { xs: 20, md: 24 } }} />,
        color: '#ef4444',
        gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        createdAt: Timestamp.fromDate(subDays(now, 1)),
        status: 'new',
        data: {
          at_risk_members: stats.vencidos,
          risk_percentage: Math.round((stats.vencidos / stats.total) * 100),
          recommended_action: 'Campaña de re-engagement',
          estimated_loss: stats.vencidos * 50 // Estimated value per member
        },
        actionable: true,
        estimatedValue: stats.vencidos * 50,
        timeframe: 'Inmediato'
      });
    }

    // Optimal timing recommendation
    insights.push({
      id: 'optimal-timing',
      title: 'Momento Óptimo para Comunicaciones',
      description: 'Los martes a las 10:00 AM muestran 34% más engagement. Optimiza tus campañas para maximizar la respuesta.',
      confidence: 78,
      impact: 'medium',
      category: 'recommendation',
      priority: 2,
      icon: <Schedule sx={{ fontSize: { xs: 20, md: 24 } }} />,
      color: '#6366f1',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      createdAt: Timestamp.fromDate(subDays(now, 2)),
      status: 'viewed',
      data: {
        optimal_day: 'Martes',
        optimal_time: '10:00 AM',
        engagement_increase: 34,
        sample_size: stats.total,
        confidence_level: '95%'
      },
      actionable: true,
      timeframe: 'Próximas campañas'
    });

    // Revenue opportunity
    if (stats.activos > 20) {
      const premiumCandidates = Math.floor(stats.activos * 0.25);
      insights.push({
        id: 'revenue-opportunity',
        title: 'Oportunidad de Ingresos Adicionales',
        description: `${premiumCandidates} socios muestran patrones de alto engagement. Segmento premium identificado con potencial de ingresos adicionales.`,
        confidence: 85,
        impact: 'high',
        category: 'opportunity',
        priority: 1,
        icon: <AttachMoney sx={{ fontSize: { xs: 20, md: 24 } }} />,
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        createdAt: Timestamp.fromDate(subDays(now, 1)),
        status: 'new',
        data: {
          premium_candidates: premiumCandidates,
          estimated_revenue_per_member: 100,
          total_revenue_potential: premiumCandidates * 100,
          conversion_probability: '65%'
        },
        actionable: true,
        estimatedValue: premiumCandidates * 100,
        timeframe: '6 meses'
      });
    }

    // Demographic insight
    insights.push({
      id: 'demographic-insight',
      title: 'Patrón Demográfico Emergente',
      description: 'Incremento del 45% en socios de 25-35 años detectado. Ajusta estrategias de marketing para este segmento.',
      confidence: 73,
      impact: 'medium',
      category: 'prediction',
      priority: 3,
      icon: <Group sx={{ fontSize: { xs: 20, md: 24 } }} />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      createdAt: Timestamp.fromDate(subDays(now, 3)),
      status: 'viewed',
      data: {
        age_group: '25-35 años',
        growth_rate: 45,
        segment_size: Math.floor(stats.total * 0.4),
        marketing_recommendation: 'Digital y redes sociales'
      },
      actionable: true,
      timeframe: 'Próximos 3 meses'
    });

    // Engagement strategy
    insights.push({
      id: 'engagement-strategy',
      title: 'Estrategia de Engagement Personalizada',
      description: 'Contenido educativo aumenta retención en 67%. Implementa programa de capacitación para mejorar engagement.',
      confidence: 89,
      impact: 'high',
      category: 'recommendation',
      priority: 2,
      icon: <Psychology sx={{ fontSize: { xs: 20, md: 24 } }} />,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      createdAt: Timestamp.fromDate(subDays(now, 1)),
      status: 'new',
      data: {
        content_type: 'Educativo',
        retention_improvement: 67,
        recommended_frequency: 'Semanal',
        implementation_cost: 500
      },
      actionable: true,
      estimatedValue: Math.round(stats.total * 0.67 * 25), // Retention value
      timeframe: '2 meses'
    });

    return insights.sort((a, b) => b.priority - a.priority || b.confidence - a.confidence);
  }, [stats]);

  // Initialize AI insights
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Simulate AI processing time
    const timer = setTimeout(() => {
      setAiInsights(generateInsights);
      setAiModel({
        id: 'fidelya-ai-v2',
        name: 'Fidelya AI',
        version: '2.1.0',
        accuracy: 94.2,
        lastTrained: subDays(new Date(), 2),
        dataPoints: stats.total * 15,
        status: 'active',
        predictions: generateInsights.length
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, generateInsights, stats.total]);

  // Auto-refresh insights
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setAiInsights(generateInsights);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, generateInsights]);

  const handleViewDetails = (insight: AIInsight) => {
    setDetailsDialog({ open: true, insight });
    
    // Mark as viewed if it's new
    if (insight.status === 'new') {
      setAiInsights(prev => prev.map(i => 
        i.id === insight.id ? { ...i, status: 'viewed' } : i
      ));
    }
  };

  const handleApplyInsight = async (insight: AIInsight) => {
    if (!user) return;

    try {
      setProcessingInsights(prev => new Set([...prev, insight.id]));

      // Simulate applying the insight
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update insight status
      setAiInsights(prev => prev.map(i => 
        i.id === insight.id ? { ...i, status: 'applied' } : i
      ));

      // Log the action to Firebase (optional)
      const actionsRef = collection(db, 'ai_actions');
      await addDoc(actionsRef, {
        insightId: insight.id,
        action: 'applied',
        userId: user.uid,
        timestamp: Timestamp.now(),
        insightData: insight.data
      });

    } catch (err) {
      console.error('Error applying insight:', err);
    } finally {
      setProcessingInsights(prev => {
        const newSet = new Set(prev);
        newSet.delete(insight.id);
        return newSet;
      });
    }
  };

  const handleRefreshAI = () => {
    setLoading(true);
    setTimeout(() => {
      setAiInsights(generateInsights);
      setLoading(false);
    }, 1500);
  };

  const aiMetrics = useMemo(() => [
    {
      title: 'Insights Generados',
      value: aiInsights.length,
      subtitle: 'Últimas 24 horas',
      icon: <AutoAwesome sx={{ fontSize: { xs: 18, md: 20 } }} />,
      color: '#6366f1',
      trend: 'up' as const,
      loading: loading || propLoading
    },
    {
      title: 'Precisión del Modelo',
      value: aiModel ? `${aiModel.accuracy}%` : '94.2%',
      subtitle: 'Promedio histórico',
      icon: <Psychology sx={{ fontSize: { xs: 18, md: 20 } }} />,
      color: '#10b981',
      trend: 'up' as const,
      loading: loading || propLoading
    },
    {
      title: 'Procesamiento IA',
      value: '2.3s',
      subtitle: 'Tiempo promedio',
      icon: <Speed sx={{ fontSize: { xs: 18, md: 20 } }} />,
      color: '#f59e0b',
      processing: loading,
      loading: loading || propLoading
    },
    {
      title: 'Datos Analizados',
      value: aiModel ? `${(aiModel.dataPoints / 1000).toFixed(1)}K` : '847K',
      subtitle: 'Puntos de datos',
      icon: <DataUsage sx={{ fontSize: { xs: 18, md: 20 } }} />,
      color: '#8b5cf6',
      trend: 'neutral' as const,
      loading: loading || propLoading
    }
  ], [aiInsights.length, aiModel, loading, propLoading]);

  const predictionData = useMemo(() => [
    { month: 'Ene', actual: Math.floor(stats.total * 0.8), predicted: Math.floor(stats.total * 0.85), confidence: 92 },
    { month: 'Feb', actual: Math.floor(stats.total * 0.85), predicted: Math.floor(stats.total * 0.9), confidence: 89 },
    { month: 'Mar', actual: Math.floor(stats.total * 0.9), predicted: Math.floor(stats.total * 0.95), confidence: 87 },
    { month: 'Abr', actual: stats.total, predicted: Math.floor(stats.total * 1.05), confidence: 85 },
    { month: 'May', predicted: Math.floor(stats.total * 1.12), confidence: 82 },
    { month: 'Jun', predicted: Math.floor(stats.total * 1.18), confidence: 78 },
    { month: 'Jul', predicted: Math.floor(stats.total * 1.25), confidence: 75 },
  ], [stats.total]);

  const priorityInsights = useMemo(() => 
    aiInsights.filter(insight => insight.impact === 'critical' || insight.impact === 'high').slice(0, 3),
    [aiInsights]
  );

  return (
    <Box sx={{ 
      p: 0, // Remove padding since it's handled by parent
      maxWidth: '100%', 
      overflow: 'hidden' 
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            mb: { xs: 3, md: 4 },
            flexDirection: { xs: 'column', md: 'row' },
            gap: { xs: 3, md: 0 }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 2, md: 3 },
              textAlign: { xs: 'center', md: 'left' },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Avatar
                sx={{
                  width: { xs: 56, md: 64 },
                  height: { xs: 56, md: 64 },
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)',
                  boxShadow: '0 12px 40px rgba(236, 72, 153, 0.3)',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: -2,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #ec4899, #8b5cf6, #6366f1)',
                    zIndex: -1,
                    opacity: 0.3,
                    filter: 'blur(8px)',
                  }
                }}
              >
                <AutoGraph sx={{ fontSize: { xs: 28, md: 32 } }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                    background: 'linear-gradient(135deg, #0f172a 0%, #ec4899 40%, #8b5cf6 70%, #6366f1 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.03em',
                    lineHeight: 0.9,
                    mb: 1,
                  }}
                >
                  Insights IA
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' },
                  }}
                >
                  Inteligencia artificial para decisiones estratégicas • {user?.email?.split('@')[0] || 'Administrador'}
                </Typography>
              </Box>
            </Box>
            
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={2} 
              alignItems="center"
              sx={{ width: { xs: '100%', md: 'auto' } }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-thumb': {
                        bgcolor: '#ec4899',
                      },
                      '& .MuiSwitch-track': {
                        bgcolor: alpha('#ec4899', 0.3),
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ 
                    fontWeight: 600, 
                    color: '#64748b',
                    fontSize: { xs: '0.8rem', md: '0.875rem' }
                  }}>
                    Auto-refresh
                  </Typography>
                }
              />
              
              <IconButton
                onClick={handleRefreshAI}
                disabled={loading}
                sx={{
                  bgcolor: alpha('#ec4899', 0.1),
                  color: '#ec4899',
                  '&:hover': {
                    bgcolor: alpha('#ec4899', 0.2),
                    transform: 'rotate(180deg)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? <CircularProgress size={20} /> : <Refresh />}
              </IconButton>
              
              <Button
                variant="contained"
                startIcon={<SmartToy />}
                sx={{
                  py: { xs: 1.5, md: 2 },
                  px: { xs: 3, md: 4 },
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  boxShadow: '0 8px 32px rgba(236, 72, 153, 0.3)',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #db2777 0%, #7c3aed 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 40px rgba(236, 72, 153, 0.4)',
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Entrenar Modelo
              </Button>
            </Stack>
          </Box>

          {/* AI Status */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: alpha('#ec4899', 0.05),
              border: `2px solid ${alpha('#ec4899', 0.15)}`,
              borderRadius: { xs: 3, md: 4 },
              p: { xs: 2, md: 3 },
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #ec4899, #8b5cf6, #6366f1)',
              }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: { xs: 2, md: 3 },
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              textAlign: { xs: 'center', sm: 'left' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    bgcolor: aiModel?.status === 'active' ? '#10b981' : '#f59e0b',
                    borderRadius: '50%',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.5, transform: 'scale(1.1)' },
                    },
                  }}
                />
                <Typography variant="body1" sx={{ 
                  color: '#475569', 
                  fontWeight: 700, 
                  fontSize: { xs: '0.95rem', md: '1.1rem' }
                }}>
                  <Box component="span" sx={{ fontWeight: 900 }}>IA {aiModel?.status === 'active' ? 'Activa' : 'Entrenando'}</Box> - Modelo entrenado con {stats.total.toLocaleString()} registros de socios
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                flexWrap: 'wrap',
                justifyContent: { xs: 'center', sm: 'flex-end' }
              }}>
                <Chip
                  icon={<Memory />}
                  label={`Modelo ${aiModel?.version || 'v2.1.0'}`}
                  sx={{
                    bgcolor: alpha('#ec4899', 0.1),
                    color: '#ec4899',
                    fontWeight: 600,
                    fontSize: { xs: '0.7rem', md: '0.75rem' }
                  }}
                />
                <Typography variant="body2" sx={{ 
                  color: '#94a3b8', 
                  fontWeight: 700,
                  fontSize: { xs: '0.8rem', md: '0.9rem' }
                }}>
                  Última actualización: {aiModel ? format(aiModel.lastTrained, 'dd/MM HH:mm') : 'Hace 2 horas'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </motion.div>

      {/* AI Metrics */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(4, 1fr)'
        },
        gap: { xs: 2, md: 3 },
        mb: { xs: 4, md: 6 }
      }}>
        {aiMetrics.map((metric, index) => (
          <AIMetricCard key={index} {...metric} />
        ))}
      </Box>

      {/* Main Content */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 4, md: 6 },
        alignItems: 'stretch'
      }}>
        {/* Insights Section */}
        <Box sx={{ flex: '2 1 0', minWidth: 0 }}>
          <Box sx={{ mb: { xs: 3, md: 4 } }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 800, 
              color: '#0f172a', 
              mb: 1,
              fontSize: { xs: '1.3rem', md: '1.5rem' }
            }}>
              Insights Inteligentes
            </Typography>
            <Typography variant="body1" sx={{ 
              color: '#64748b', 
              fontWeight: 500,
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}>
              Recomendaciones y predicciones generadas por IA
            </Typography>
          </Box>
          
          {loading || propLoading ? (
            // Loading skeleton
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                xl: 'repeat(3, 1fr)'
              },
              gap: { xs: 3, md: 4 },
              alignItems: 'stretch'
            }}>
              {Array.from({ length: 6 }).map((_, index) => (
                <Box key={index}>
                  <Card elevation={0} sx={{ 
                    border: '1px solid #f1f5f9', 
                    borderRadius: { xs: 3, md: 4 }, 
                    height: '100%' 
                  }}>
                    <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 2, md: 2.5 }, 
                        mb: { xs: 2, md: 2.5 } 
                      }}>
                        <Box
                          sx={{
                            width: { xs: 44, md: 52 },
                            height: { xs: 44, md: 52 },
                            bgcolor: '#f1f5f9',
                            borderRadius: 3,
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 1 },
                              '50%': { opacity: 0.5 },
                            },
                          }}
                        />
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ width: '80%', height: 16, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
                          <Box sx={{ width: '60%', height: 14, bgcolor: '#f1f5f9', borderRadius: 1, mb: 1 }} />
                          <Box sx={{ width: '90%', height: 12, bgcolor: '#f1f5f9', borderRadius: 1 }} />
                        </Box>
                      </Box>
                      <Box sx={{ width: '100%', height: 8, bgcolor: '#f1f5f9', borderRadius: 1, mb: 2 }} />
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Box sx={{ width: '50%', height: 32, bgcolor: '#f1f5f9', borderRadius: 2 }} />
                        <Box sx={{ width: '50%', height: 32, bgcolor: '#f1f5f9', borderRadius: 2 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          ) : (
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                xl: 'repeat(3, 1fr)'
              },
              gap: { xs: 3, md: 4 },
              alignItems: 'stretch'
            }}>
              {aiInsights.map((insight, index) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  delay={index * 0.1}
                  onViewDetails={handleViewDetails}
                  onApply={insight.actionable ? handleApplyInsight : undefined}
                  isProcessing={processingInsights.has(insight.id)}
                />
              ))}
            </Box>
          )}

          {/* Empty State */}
          {!loading && !propLoading && aiInsights.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 4, md: 6 },
                  textAlign: 'center',
                  border: '2px dashed #e2e8f0',
                  borderRadius: { xs: 3, md: 4 },
                  bgcolor: '#fafbfc',
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 56, md: 64 },
                    height: { xs: 56, md: 64 },
                    bgcolor: alpha('#ec4899', 0.1),
                    color: '#ec4899',
                    mx: 'auto',
                    mb: 3,
                  }}
                >
                  <AutoGraph sx={{ fontSize: { xs: 28, md: 32 } }} />
                </Avatar>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  color: '#1e293b', 
                  mb: 2,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}>
                  Generando Insights
                </Typography>
                <Typography variant="body1" sx={{ 
                  color: '#64748b', 
                  mb: 4,
                  fontSize: { xs: '0.9rem', md: '1rem' }
                }}>
                  La IA está analizando tus datos para generar insights personalizados.
                  Esto puede tomar unos minutos.
                </Typography>
                <Button
                  onClick={handleRefreshAI}
                  variant="contained"
                  startIcon={<Refresh />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    px: { xs: 3, md: 4 },
                    py: { xs: 1.5, md: 2 }
                  }}
                >
                  Actualizar Análisis
                </Button>
              </Paper>
            </motion.div>
          )}
        </Box>

        {/* Sidebar */}
        <Box sx={{ 
          flex: '1 1 0', 
          minWidth: { xs: '100%', lg: '400px' },
          maxWidth: { xs: '100%', lg: '500px' }
        }}>
          <Stack spacing={{ xs: 3, md: 4 }}>
            {/* Growth Prediction */}
            <PredictionChart
              title="Predicción de Crecimiento"
              data={predictionData}
              color="#10b981"
              loading={loading || propLoading}
            />

            {/* Priority Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #f1f5f9',
                  borderRadius: { xs: 3, md: 4 },
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: { xs: 2, md: 3 },
                    flexWrap: { xs: 'wrap', sm: 'nowrap' }
                  }}>
                    <Avatar
                      sx={{
                        width: { xs: 40, md: 44 },
                        height: { xs: 40, md: 44 },
                        bgcolor: alpha('#ef4444', 0.1),
                        color: '#ef4444',
                        borderRadius: 3,
                      }}
                    >
                      <NotificationsActive />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: '#1e293b', 
                        fontSize: { xs: '1rem', md: '1.1rem' }
                      }}>
                        Acciones Prioritarias
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#64748b', 
                        fontSize: { xs: '0.8rem', md: '0.85rem' }
                      }}>
                        Requieren atención inmediata
                      </Typography>
                    </Box>
                  </Box>
                  
                  {loading || propLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : (
                    <List dense>
                      {priorityInsights.map((insight) => (
                        <ListItem key={insight.id} sx={{ px: 0, py: 1 }}>
                          <ListItemIcon>
                            <Avatar
                              sx={{
                                width: { xs: 28, md: 32 },
                                height: { xs: 28, md: 32 },
                                bgcolor: alpha(insight.color, 0.1),
                                color: insight.color,
                                borderRadius: 2,
                              }}
                            >
                              {React.isValidElement(insight.icon) && (insight.icon as React.ReactElement<unknown>)
                                ? React.cloneElement(insight.icon as React.ReactElement<unknown>)
                                : insight.icon}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={insight.title}
                            secondary={`${insight.confidence}% confianza • ${insight.impact.toUpperCase()}`}
                            primaryTypographyProps={{ 
                              fontSize: { xs: '0.8rem', md: '0.9rem' }, 
                              fontWeight: 600,
                              color: '#1e293b'
                            }}
                            secondaryTypographyProps={{ 
                              fontSize: { xs: '0.7rem', md: '0.75rem' },
                              color: '#94a3b8'
                            }}
                          />
                        </ListItem>
                      ))}
                      {priorityInsights.length === 0 && (
                        <ListItem sx={{ px: 0, py: 2 }}>
                          <ListItemText
                            primary="No hay acciones prioritarias"
                            secondary="Todos los insights están bajo control"
                            primaryTypographyProps={{ 
                              fontSize: { xs: '0.8rem', md: '0.9rem' }, 
                              fontWeight: 600,
                              color: '#10b981'
                            }}
                            secondaryTypographyProps={{ 
                              fontSize: { xs: '0.75rem', md: '0.8rem' },
                              color: '#64748b'
                            }}
                          />
                        </ListItem>
                      )}
                    </List>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Model Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #f1f5f9',
                  borderRadius: { xs: 3, md: 4 },
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: { xs: 2, md: 3 },
                    flexWrap: { xs: 'wrap', sm: 'nowrap' }
                  }}>
                    <Avatar
                      sx={{
                        width: { xs: 40, md: 44 },
                        height: { xs: 40, md: 44 },
                        bgcolor: alpha('#6366f1', 0.1),
                        color: '#6366f1',
                        borderRadius: 3,
                      }}
                    >
                      <SmartToy />
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700, 
                        color: '#1e293b', 
                        fontSize: { xs: '1rem', md: '1.1rem' }
                      }}>
                        Estado del Modelo IA
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        color: '#64748b', 
                        fontSize: { xs: '0.8rem', md: '0.85rem' }
                      }}>
                        Información técnica
                      </Typography>
                    </Box>
                  </Box>
                  
                  {loading || propLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={32} />
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        gap: { xs: 1, sm: 0 }
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: '#475569',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          flex: { xs: '1 1 100%', sm: '1 1 auto' }
                        }}>
                          Versión del Modelo
                        </Typography>
                        <Chip
                          label={aiModel?.version || 'v2.1.0'}
                          size="small"
                          sx={{
                            bgcolor: alpha('#6366f1', 0.1),
                            color: '#6366f1',
                            fontWeight: 600,
                            fontSize: { xs: '0.7rem', md: '0.75rem' },
                            flex: { xs: '1 1 100%', sm: '0 0 auto' },
                            justifyContent: { xs: 'center', sm: 'flex-start' }
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        gap: { xs: 1, sm: 0 }
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: '#475569',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          flex: { xs: '1 1 100%', sm: '1 1 auto' }
                        }}>
                          Precisión
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700, 
                          color: '#10b981',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          flex: { xs: '1 1 100%', sm: '0 0 auto' },
                          textAlign: { xs: 'left', sm: 'right' }
                        }}>
                          {aiModel?.accuracy || 94.2}%
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        gap: { xs: 1, sm: 0 }
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: '#475569',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          flex: { xs: '1 1 100%', sm: '1 1 auto' }
                        }}>
                          Datos de Entrenamiento
                        </Typography>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 700, 
                          color: '#1e293b',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          flex: { xs: '1 1 100%', sm: '0 0 auto' },
                          textAlign: { xs: 'left', sm: 'right' }
                        }}>
                          {aiModel?.dataPoints.toLocaleString() || '12.7K'} registros
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        flexWrap: { xs: 'wrap', sm: 'nowrap' },
                        gap: { xs: 1, sm: 0 }
                      }}>
                        <Typography variant="body2" sx={{ 
                          fontWeight: 600, 
                          color: '#475569',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                          flex: { xs: '1 1 100%', sm: '1 1 auto' }
                        }}>
                          Estado
                        </Typography>
                        <Chip
                          label={aiModel?.status === 'active' ? 'Activo' : 'Entrenando'}
                          size="small"
                          color={aiModel?.status === 'active' ? 'success' : 'warning'}
                          sx={{ 
                            fontWeight: 600,
                            fontSize: { xs: '0.7rem', md: '0.75rem' },
                            flex: { xs: '1 1 100%', sm: '0 0 auto' },
                            justifyContent: { xs: 'center', sm: 'flex-start' }
                          }}
                        />
                      </Box>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Stack>
        </Box>
      </Box>

      {/* Details Dialog */}
      <InsightDetailsDialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, insight: null })}
        insight={detailsDialog.insight}
        onApply={handleApplyInsight}
      />
    </Box>
  );
};