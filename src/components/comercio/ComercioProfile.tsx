'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Avatar,
  alpha,
  IconButton,
} from '@mui/material';
import {
  Store,
  Refresh,
} from '@mui/icons-material';
import { ProfileForm } from './perfil/ProfileForm';
import { ImageUploader } from './perfil/ImageUploader';

export const ComercioProfile: React.FC = () => {
  const [imageUrl, setImageUrl] = React.useState<string | undefined>();
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Store sx={{ fontSize: 32 }} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#0f172a', mb: 1 }}>
                Perfil del Comercio
              </Typography>
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>
                Gestiona la información y configuración de tu negocio
              </Typography>
            </Box>
            
            <IconButton
              onClick={() => window.location.reload()}
              sx={{
                bgcolor: alpha('#10b981', 0.1),
                color: '#10b981',
                '&:hover': {
                  bgcolor: alpha('#10b981', 0.2),
                  transform: 'rotate(180deg)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Refresh />
            </IconButton>
          </Box>
        </Box>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Box>
          {/* Image Uploader */}
          <ImageUploader
            currentImage={imageUrl}
            onImageUpload={(url) => setImageUrl(url)}
            onImageRemove={() => setImageUrl(undefined)}
          />
          
          {/* Profile Form */}
          {/* Profile Form */}
          <ProfileForm />
        </Box>
      </motion.div>
    </Container>
  );
};