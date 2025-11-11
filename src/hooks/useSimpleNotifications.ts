'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { 
  SimpleNotification, 
  SimpleNotificationFormData, 
  SimpleNotificationResult,
  RecipientInfo,
  SimpleNotificationSettings
} from '@/types/simple-notification';
import { simpleNotificationService } from '@/services/simple-notifications.service';
import { useAuth } from './useAuth';
import { useClientes } from './useClientes';

export const useSimpleNotifications = () => {
  const { user } = useAuth();
  const { clientes, loading: clientesLoading } = useClientes();
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);
  const [recipients, setRecipients] = useState<RecipientInfo[]>([]);
  const [settings, setSettings] = useState<SimpleNotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar destinatarios desde useClientes (misma fuente que la pestaña de Socios)
  const loadRecipients = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`📋 Cargando destinatarios desde useClientes...`);
      
      // Convertir clientes a RecipientInfo
      const recipientsList: RecipientInfo[] = clientes.map(cliente => ({
        id: cliente.id,
        name: cliente.nombre,
        email: cliente.email,
        phone: cliente.telefono || '',
        type: 'socio'
      }));
      
      console.log(`✅ Destinatarios cargados:`, recipientsList.map(r => ({ 
        name: r.name, 
        phone: r.phone 
      })));
      
      setRecipients(recipientsList);
    } catch (err) {
      console.error('Error loading recipients:', err);
      setError('Error al cargar destinatarios');
      toast.error('Error al cargar destinatarios');
    } finally {
      setLoading(false);
    }
  }, [clientes]);

  // Cargar destinatarios cuando clientes cambien
  useEffect(() => {
    if (clientes.length > 0) {
      loadRecipients();
    }
  }, [clientes, loadRecipients]);

  // Cargar historial de notificaciones
  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const notificationsList = await simpleNotificationService.getNotifications(user.uid);
      setNotifications(notificationsList);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Cargar configuración del usuario
  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    try {
      const userSettings = await simpleNotificationService.getUserSettings(user.uid);
      setSettings(userSettings);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Error al cargar configuración');
    }
  }, [user]);

  // Enviar notificación
  const sendNotification = useCallback(async (
    data: SimpleNotificationFormData
  ): Promise<SimpleNotificationResult | null> => {
    if (!user) {
      toast.error('Usuario no autenticado');
      return null;
    }

    try {
      setSending(true);
      setError(null);

      // Clean and validate the data before sending
      const cleanData: SimpleNotificationFormData = {
        title: data.title?.trim() || '',
        message: data.message?.trim() || '',
        type: data.type || 'info',
        channels: Array.isArray(data.channels) ? data.channels.filter(Boolean) : [],
        recipientIds: Array.isArray(data.recipientIds) ? data.recipientIds.filter(Boolean) : []
      };

      // Validaciones básicas
      if (!cleanData.title) {
        throw new Error('El título es requerido');
      }
      if (!cleanData.message) {
        throw new Error('El mensaje es requerido');
      }
      if (cleanData.channels.length === 0) {
        throw new Error('Selecciona al menos un canal');
      }
      if (cleanData.recipientIds.length === 0) {
        throw new Error('Selecciona al menos un destinatario');
      }

      console.log('📤 Sending notification with clean data:', cleanData);

      // Crear notificación
      const notificationId = await simpleNotificationService.createNotification(
        cleanData,
        user.uid
      );

      // Enviar notificación
      const result = await simpleNotificationService.sendNotification(
        notificationId,
        cleanData
      );

      // Mostrar resultado
      if (result.success) {
        toast.success(
          `Notificación enviada: ${result.sentCount} exitosas${
            result.failedCount > 0 ? `, ${result.failedCount} fallidas` : ''
          }`
        );
      } else {
        toast.error('Error al enviar notificación');
      }

      // Recargar historial
      await loadNotifications();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error sending notification:', err);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setSending(false);
    }
  }, [user, loadNotifications]);

  // Guardar configuración
  const saveSettings = useCallback(async (
    newSettings: Omit<SimpleNotificationSettings, 'updatedAt'>
  ) => {
    try {
      setLoading(true);
      const settingsWithDate: SimpleNotificationSettings = {
        ...newSettings,
        updatedAt: new Date()
      };
      await simpleNotificationService.saveUserSettings(settingsWithDate);
      setSettings(settingsWithDate);
      toast.success('Configuración guardada');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Error al guardar configuración');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      loadRecipients();
      loadNotifications();
      loadSettings();
    }
  }, [user, loadRecipients, loadNotifications, loadSettings]);

  return {
    // Datos
    notifications,
    recipients,
    settings,
    loading,
    sending,
    error,

    // Acciones
    sendNotification,
    saveSettings,
    loadRecipients,
    loadNotifications,
    loadSettings,

    // Utilidades
    clearError: () => setError(null),
  };
};