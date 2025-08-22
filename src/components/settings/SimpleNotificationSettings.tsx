'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Paper,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import {
  Email,
  WhatsApp,
  Notifications,
  Save,
  Settings,
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { useSimpleNotifications } from '@/hooks/useSimpleNotifications';
import { SimpleNotificationSettings } from '@/types/simple-notification';
import { useAuth } from '@/hooks/useAuth';

export const SimpleNotificationSettingsComponent: React.FC = () => {
  const { user } = useAuth();
  const { settings, loading, saveSettings } = useSimpleNotifications();
  const [localSettings, setLocalSettings] = useState<SimpleNotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);

  // Sincronizar con settings del hook
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingChange = (key: keyof SimpleNotificationSettings, value: boolean) => {
    if (!localSettings) return;
    
    setLocalSettings(prev => prev ? {
      ...prev,
      [key]: value
    } : null);
  };

  const handleSave = async () => {
    if (!localSettings || !user) return;

    setSaving(true);
    try {
      await saveSettings({
        userId: user.uid,
        emailEnabled: localSettings.emailEnabled,
        whatsappEnabled: localSettings.whatsappEnabled,
        appEnabled: localSettings.appEnabled
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTestSending(true);
    try {
      // Simular envío de notificación de prueba
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Notificación de prueba enviada');
    } catch{
      toast.error('Error al enviar notificación de prueba');
    } finally {
      setTestSending(false);
    }
  };

  if (loading || !localSettings) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
        <Typography>Cargando configuración...</Typography>
      </Box>
    );
  }

  const hasChanges = settings && (
    settings.emailEnabled !== localSettings.emailEnabled ||
    settings.whatsappEnabled !== localSettings.whatsappEnabled ||
    settings.appEnabled !== localSettings.appEnabled
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Settings sx={{ fontSize: 32 }} />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              Configuración de Notificaciones
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Configura cómo quieres recibir las notificaciones
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Configuraciones */}
      <Card elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: 4, mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
            Canales de Notificación
          </Typography>

          <Stack spacing={3}>
            {/* Email */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.emailEnabled}
                    onChange={(e) => handleSettingChange('emailEnabled', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#1976d2' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1976d2' },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#1976d2', width: 40, height: 40 }}>
                      <Email />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Notificaciones por Email
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Recibe notificaciones en tu correo electrónico
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </Box>

            <Divider />

            {/* WhatsApp */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.whatsappEnabled}
                    onChange={(e) => handleSettingChange('whatsappEnabled', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#25d366' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#25d366' },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#25d366', width: 40, height: 40 }}>
                      <WhatsApp />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Notificaciones por WhatsApp
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Recibe notificaciones por WhatsApp
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </Box>

            <Divider />

            {/* App */}
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.appEnabled}
                    onChange={(e) => handleSettingChange('appEnabled', e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#9c27b0' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#9c27b0' },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#9c27b0', width: 40, height: 40 }}>
                      <Notifications />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Notificaciones en la App
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Recibe notificaciones dentro de la aplicación
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', m: 0 }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 3 }}>
        <Typography variant="body2">
          <strong>Nota:</strong> Estas configuraciones determinan por qué canales recibirás las notificaciones. 
          Puedes cambiarlas en cualquier momento.
        </Typography>
      </Alert>

      {/* Botones de acción */}
      <Stack direction="row" spacing={2}>
        <Button
          onClick={handleTestNotification}
          disabled={testSending}
          startIcon={<Notifications />}
          variant="outlined"
          sx={{ borderRadius: 3 }}
        >
          {testSending ? 'Enviando...' : 'Probar Notificación'}
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          startIcon={<Save />}
          variant="contained"
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            flex: 1
          }}
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </Stack>

      {/* Cambios pendientes */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert severity="warning" sx={{ mt: 2, borderRadius: 3 }}>
            Tienes cambios sin guardar. No olvides hacer clic en &quot;Guardar Cambios&quot;.
          </Alert>
        </motion.div>
      )}
    </Box>
  );
};
