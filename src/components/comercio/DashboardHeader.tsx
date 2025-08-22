'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Paper,
  alpha,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Store,
  CalendarToday,
  Refresh,
  Add,
} from '@mui/icons-material';
import { useComercios } from '@/hooks/useComercios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export const DashboardHeader: React.FC = () => {
  const { comerciosVinculados } = useComercios();
  const comercio = comerciosVinculados?.[0];
  const router = useRouter();
  
  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const capitalizedToday = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
                boxShadow: '0 12px 40px rgba(6, 182, 212, 0.3)',
              }}
            >
              {comercio && comercio.logoUrl ? (
                <Image
                  src={comercio.logoUrl}
                  alt={`Logo de ${comercio.nombreComercio}`}
                  width={64}
                  height={64}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '16px'
                  }}
                  unoptimized={process.env.NODE_ENV === 'development'}
                />
              ) : (
                <Store sx={{ fontSize: 32 }} />
              )}
            </Avatar>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  fontSize: '2.5rem',
                  background: 'linear-gradient(135deg, #0f172a 0%, #06b6d4 60%, #0891b2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.03em',
                  lineHeight: 0.9,
                  mb: 1,
                }}
              >
                Hola, {comercio?.nombreComercio || 'Comercio'} 👋
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: '#64748b',
                  fontWeight: 600,
                  fontSize: '1.2rem',
                }}
              >
                Este es el resumen de tu actividad en Fidelitá
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={2}>
            <IconButton
              onClick={() => window.location.reload()}
              sx={{
                bgcolor: alpha('#06b6d4', 0.1),
                color: '#06b6d4',
                '&:hover': {
                  bgcolor: alpha('#06b6d4', 0.2),
                  transform: 'rotate(180deg)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Refresh />
            </IconButton>
            <Button
              onClick={() => router.push('/dashboard/comercio/beneficios')}
              variant="contained"
              startIcon={<Add />}
              size="large"
              sx={{
                py: 2,
                px: 4,
                borderRadius: 4,
                textTransform: 'none',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                boxShadow: '0 8px 32px rgba(6, 182, 212, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 40px rgba(6, 182, 212, 0.4)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Nuevo Beneficio
            </Button>
          </Stack>
        </Box>
        
        {/* Welcome Message */}
        <Paper
          elevation={0}
          sx={{
            bgcolor: alpha('#06b6d4', 0.05),
            border: `2px solid ${alpha('#06b6d4', 0.15)}`,
            borderRadius: 5,
            p: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #06b6d4, #0891b2, #0e7490)',
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                width: 12,
                height: 12,
                bgcolor: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.5, transform: 'scale(1.1)' },
                },
              }}
            />
            <Typography variant="body1" sx={{ color: '#475569', fontWeight: 700, fontSize: '1.1rem' }}>
              <Box component="span" sx={{ fontWeight: 900 }}>Sistema operativo</Box> - Tu comercio está listo para recibir validaciones
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
              <CalendarToday sx={{ fontSize: 18, color: '#94a3b8' }} />
              <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                {capitalizedToday}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </motion.div>
  );
};

<style jsx>{`
  @media (max-width: 768px) {
    .header-container {
      flex-direction: column;
      align-items: flex-start;
    }
    .date-section {
      align-self: stretch;
    }
  }
`}</style>