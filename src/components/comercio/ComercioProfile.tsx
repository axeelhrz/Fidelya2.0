'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
} from '@mui/material';
import {
  Store,
} from '@mui/icons-material';
import { ProfileForm } from './perfil/ProfileForm';

export const ComercioProfile: React.FC = () => {
  return (
    <Box sx={{ maxWidth: '4xl', mx: 'auto', p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          mb: 4,
          flexDirection: { xs: 'column', sm: 'row' },
          textAlign: { xs: 'center', sm: 'left' }
        }}>
          <Store sx={{ fontSize: { xs: 32, md: 40 }, color: '#6366f1' }} />
          <Box>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 900, 
                color: '#0f172a',
                fontSize: { xs: '1.875rem', md: '2.25rem' }
              }}
            >
              Perfil del Comercio
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#64748b', 
                fontWeight: 500,
                fontSize: { xs: '1rem', md: '1.125rem' }
              }}
            >
              Gestiona la información de tu negocio
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Box>
          <ProfileForm />
        </Box>
      </motion.div>
    </Box>
  );
};