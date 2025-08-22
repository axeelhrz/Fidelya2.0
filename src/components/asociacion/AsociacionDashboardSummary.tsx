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
  Chip,
} from '@mui/material';
import {
  Group,
  HowToReg,
  PersonOff,
  TrendingUp,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { SocioStats } from '@/types/socio';

interface AsociacionDashboardSummaryProps {
  stats: SocioStats;
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  delay: number;
  trend?: 'up' | 'down' | 'neutral';
  percentage?: number;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  color, 
  delay, 
  trend = 'neutral',
  percentage 
}) => {
  
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
    >
      <Card
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #f1f5f9',
          borderRadius: 5,
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha(color, 0.3),
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 70px -10px ${alpha(color, 0.2)}`,
            '& .stat-icon': {
              transform: 'scale(1.1)',
              bgcolor: alpha(color, 0.15),
            },
            '& .accent-line': {
              opacity: 0.6,
            }
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
            opacity: 0.3,
            transition: 'opacity 0.3s ease',
          }
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header with icon and trend */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
            <Avatar
              className="stat-icon"
              sx={{
                width: 56,
                height: 56,
                bgcolor: alpha(color, 0.1),
                color: color,
                borderRadius: 4,
                transition: 'all 0.3s ease',
              }}
            >
              {icon}
            </Avatar>
            
            {/* Trend indicator */}
            {percentage !== undefined && (
              <Chip
                icon={trend === 'up' ? <ArrowUpward sx={{ fontSize: '0.8rem' }} /> : 
                      trend === 'down' ? <ArrowDownward sx={{ fontSize: '0.8rem' }} /> : undefined}
                label={`${percentage}%`}
                size="small"
                sx={{
                  bgcolor: trend === 'up' ? alpha('#10b981', 0.1) : 
                           trend === 'down' ? alpha('#ef4444', 0.1) : alpha('#6b7280', 0.1),
                  color: trend === 'up' ? '#10b981' : 
                         trend === 'down' ? '#ef4444' : '#6b7280',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  '& .MuiChip-icon': {
                    color: 'inherit',
                  }
                }}
              />
            )}
          </Box>

          {/* Content */}
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: '#94a3b8',
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                mb: 1,
                display: 'block'
              }}
            >
              {title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: '#1e293b',
                  fontSize: '2.5rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {value.toLocaleString()}
              </Typography>
              {title === 'Tasa de Actividad' && (
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: '#94a3b8',
                    fontSize: '1.25rem',
                  }}
                >
                  %
                </Typography>
              )}
            </Box>
          </Box>

          {/* Accent line */}
          <Box
            className="accent-line"
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${color}, ${alpha(color, 0.6)})`,
              opacity: 0.2,
              transition: 'opacity 0.3s ease',
            }}
          />
        </CardContent>
      </Card>
    </motion.div>
  );
};

const LoadingSkeleton: React.FC = () => (
  <Card
    elevation={0}
    sx={{
      border: '1px solid #f1f5f9',
      borderRadius: 5,
      overflow: 'hidden'
    }}
  >
    <CardContent sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            bgcolor: '#f1f5f9',
            borderRadius: 4,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            '@keyframes pulse': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0.5 },
            },
          }}
        />
        <Box
          sx={{
            width: 48,
            height: 24,
            bgcolor: '#f1f5f9',
            borderRadius: 2,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      </Box>
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            width: '60%',
            height: 16,
            bgcolor: '#f1f5f9',
            borderRadius: 1,
            mb: 2,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
        <Box
          sx={{
            width: '40%',
            height: 32,
            bgcolor: '#f1f5f9',
            borderRadius: 1,
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        />
      </Box>
    </CardContent>
  </Card>
);

export const AsociacionDashboardSummary: React.FC<AsociacionDashboardSummaryProps> = ({ 
  stats, 
  loading 
}) => {
  if (loading) {
    return (
      <Box sx={{ mb: 6 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 4
          }}
        >
          {Array.from({ length: 4 }).map((_, index) => (
            <LoadingSkeleton key={index} />
          ))}
        </Box>
      </Box>
    );
  }

  // Calcular porcentajes correctamente
  const activityRate = stats.total > 0 ? Math.round((stats.activos / stats.total) * 100) : 0;
  const expiredRate = stats.total > 0 ? Math.round((stats.vencidos / stats.total) * 100) : 0;
  
  // Calcular tendencias basadas en los porcentajes
  const getActivityTrend = (rate: number): 'up' | 'down' | 'neutral' => {
    if (rate >= 80) return 'up';
    if (rate >= 60) return 'neutral';
    return 'down';
  };

  const getExpiredTrend = (rate: number): 'up' | 'down' | 'neutral' => {
    if (rate <= 10) return 'up'; // Pocos vencidos es bueno
    if (rate <= 25) return 'neutral';
    return 'down'; // Muchos vencidos es malo
  };

  const cards = [
    {
      title: 'Total de Socios',
      value: stats.total,
      icon: <Group sx={{ fontSize: 28 }} />,
      color: '#64748b',
      delay: 0,
      trend: 'neutral' as const
    },
    {
      title: 'Socios Activos',
      value: stats.activos,
      icon: <HowToReg sx={{ fontSize: 28 }} />,
      color: '#10b981',
      delay: 0.1,
      trend: getActivityTrend(activityRate),
      percentage: activityRate
    },
    {
      title: 'Socios Vencidos',
      value: stats.vencidos,
      icon: <PersonOff sx={{ fontSize: 28 }} />,
      color: '#ef4444',
      delay: 0.2,
      trend: getExpiredTrend(expiredRate),
      percentage: expiredRate
    },
    {
      title: 'Tasa de Actividad',
      value: activityRate,
      icon: <TrendingUp sx={{ fontSize: 28 }} />,
      color: '#6366f1',
      delay: 0.3,
      trend: getActivityTrend(activityRate)
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Box sx={{ mb: 6 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 900, 
                color: '#1e293b', 
                mb: 1,
                letterSpacing: '-0.02em'
              }}
            >
              Resumen Ejecutivo
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b',
                fontSize: '1.1rem',
                fontWeight: 500
              }}
            >
              Métricas clave de la asociación en tiempo real
            </Typography>
          </motion.div>
        </Box>

        {/* Cards Grid - Replaced Grid with CSS Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              lg: 'repeat(4, 1fr)'
            },
            gap: 4
          }}
        >
          {cards.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              delay={card.delay}
              trend={card.trend}
              percentage={card.percentage}
            />
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};