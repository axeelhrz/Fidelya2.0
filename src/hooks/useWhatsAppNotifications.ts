import { useState, useCallback } from 'react';
import { validateAndFormatPhoneInternational } from '@/utils/phone-validator';
import toast from 'react-hot-toast';

export interface WhatsAppRecipient {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface WhatsAppNotificationResult {
  success: boolean;
  recipientId: string;
  recipientName: string;
  phone: string;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

export interface SendWhatsAppOptions {
  title?: string;
  message: string;
  recipients: WhatsAppRecipient[];
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export const useWhatsAppNotifications = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<WhatsAppNotificationResult[]>([]);
  const [progress, setProgress] = useState(0);

  const validatePhoneNumbers = useCallback((recipients: WhatsAppRecipient[]) => {
    const validated: WhatsAppRecipient[] = [];
    const invalid: { recipient: WhatsAppRecipient; error: string }[] = [];

    recipients.forEach(recipient => {
      const validation = validateAndFormatPhoneInternational(recipient.phone);
      if (validation.isValid) {
        validated.push({
          ...recipient,
          phone: validation.formatted
        });
      } else {
        invalid.push({
          recipient,
          error: validation.error || 'Número inválido'
        });
      }
    });

    return { validated, invalid };
  }, []);

  const sendWhatsAppNotification = useCallback(async (options: SendWhatsAppOptions) => {
    const { title, message, recipients, priority = 'normal' } = options;

    if (!message || message.trim() === '') {
      toast.error('El mensaje es requerido');
      return [];
    }

    if (recipients.length === 0) {
      toast.error('Selecciona al menos un destinatario');
      return [];
    }

    // Validar números de teléfono
    const { validated, invalid } = validatePhoneNumbers(recipients);

    if (invalid.length > 0) {
      const invalidNames = invalid.map(i => `${i.recipient.name} (${i.recipient.phone})`).join(', ');
      toast.error(`Números inválidos: ${invalidNames}`);
    }

    if (validated.length === 0) {
      toast.error('No hay números válidos para enviar');
      return [];
    }

    setLoading(true);
    setResults([]);
    setProgress(0);

    const notificationResults: WhatsAppNotificationResult[] = [];

    try {
      for (let i = 0; i < validated.length; i++) {
        const recipient = validated[i];
        
        try {
          console.log(`📱 Enviando WhatsApp a ${recipient.name} (${recipient.phone})...`);

          const response = await fetch('/api/notifications/whatsapp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              phone: recipient.phone,
              message: message,
              title: title,
              recipientId: recipient.id,
              recipientName: recipient.name,
              priority: priority
            })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            console.log(`✅ Enviado a ${recipient.name}`);
            notificationResults.push({
              success: true,
              recipientId: recipient.id,
              recipientName: recipient.name,
              phone: recipient.phone,
              messageId: data.messageId,
              timestamp: new Date()
            });
            toast.success(`✅ Enviado a ${recipient.name}`);
          } else {
            console.error(`❌ Error enviando a ${recipient.name}:`, data.error);
            notificationResults.push({
              success: false,
              recipientId: recipient.id,
              recipientName: recipient.name,
              phone: recipient.phone,
              error: data.error || 'Error desconocido',
              timestamp: new Date()
            });
            toast.error(`❌ Error enviando a ${recipient.name}: ${data.error}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          console.error(`❌ Error enviando a ${recipient.name}:`, error);
          notificationResults.push({
            success: false,
            recipientId: recipient.id,
            recipientName: recipient.name,
            phone: recipient.phone,
            error: errorMsg,
            timestamp: new Date()
          });
          toast.error(`❌ Error enviando a ${recipient.name}: ${errorMsg}`);
        }

        // Actualizar progreso
        setProgress(Math.round(((i + 1) / validated.length) * 100));
      }

      setResults(notificationResults);

      // Resumen final
      const successCount = notificationResults.filter(r => r.success).length;
      const failureCount = notificationResults.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`✅ ${successCount} mensaje${successCount !== 1 ? 's' : ''} enviado${successCount !== 1 ? 's' : ''} exitosamente`);
      }
      if (failureCount > 0) {
        toast.error(`❌ ${failureCount} error${failureCount !== 1 ? 'es' : ''} al enviar`);
      }

      return notificationResults;
    } catch (error) {
      console.error('Error en sendWhatsAppNotification:', error);
      toast.error('Error al enviar notificaciones');
      return [];
    } finally {
      setLoading(false);
    }
  }, [validatePhoneNumbers]);

  const clearResults = useCallback(() => {
    setResults([]);
    setProgress(0);
  }, []);

  return {
    loading,
    results,
    progress,
    sendWhatsAppNotification,
    validatePhoneNumbers,
    clearResults
  };
};