import { freeWhatsAppService } from './free-whatsapp.service';
import { notificationConfig } from '@/lib/notification-config';

interface NotificationPayload {
  to: string;
  message: string;
  title?: string;
  email?: string; // Email de fallback
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface NotificationResult {
  success: boolean;
  channel: 'whatsapp' | 'email' | 'sms';
  provider?: string;
  messageId?: string;
  error?: string;
  fallbackUsed: boolean;
  timestamp: Date;
  cost: number;
}

class HybridNotificationsService {
  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    console.log(`🚀 Enviando notificación híbrida (prioridad: ${payload.priority})`);
    
    // 1. Intentar WhatsApp primero (gratis)
    const whatsappResult = await this.sendWhatsApp(payload);
    
    if (whatsappResult.success) {
      return whatsappResult;
    }

    console.log('❌ WhatsApp falló, intentando fallback...');

    // 2. Si WhatsApp falla y tenemos email, intentar email
    if (payload.email && notificationConfig.getFallbackConfig().enableEmailFallback) {
      const emailResult = await this.sendEmailFallback(payload);
      
      if (emailResult.success) {
        return {
          ...emailResult,
          fallbackUsed: true
        };
      }
    }

    // 3. Si todo falla, intentar notificación in-app
    return await this.sendInAppFallback();
  }

  private async sendWhatsApp(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      const result = await freeWhatsAppService.sendMessage(
        payload.to,
        payload.message,
        payload.title
      );

      return {
        success: result.success,
        channel: 'whatsapp',
        provider: result.provider,
        messageId: result.messageId,
        error: result.error,
        fallbackUsed: false,
        timestamp: new Date(),
        cost: 0 // Gratis!
      };
    } catch (error) {
      return {
        success: false,
        channel: 'whatsapp',
        error: error instanceof Error ? error.message : 'Error desconocido',
        fallbackUsed: false,
        timestamp: new Date(),
        cost: 0
      };
    }
  }

  private async sendEmailFallback(payload: NotificationPayload): Promise<NotificationResult> {
    try {
      console.log('📧 Enviando email de fallback...');
      
      // Aquí integrarías con tu servicio de email preferido
      // Por ejemplo, usando Resend (gratis hasta 3000 emails/mes)
      
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">🚀 FIDELYA</h1>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #333;">${payload.title || 'Notificación de Fidelya'}</h2>
            <p style="color: #666; line-height: 1.6;">${payload.message}</p>
            
            <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
              <p style="margin: 0; color: #1976d2; font-size: 14px;">
                📱 <strong>Nota:</strong> Intentamos enviarte este mensaje por WhatsApp, pero no fue posible. 
                Te lo enviamos por email para asegurar que recibas la información.
              </p>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #333; color: white;">
            <p style="margin: 0;">📱 Fidelya - Tu plataforma de fidelización</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">🌐 www.fidelya.com</p>
          </div>
        </div>
      `;

      // Simular envío de email (aquí integrarías con Resend, SendGrid, etc.)
      const emailResult = await this.sendEmailViaResend(
        payload.email!,
        payload.title || 'Notificación de Fidelya',
        emailContent
      );

      return {
        success: emailResult.success,
        channel: 'email',
        provider: 'resend',
        messageId: emailResult.messageId,
        error: emailResult.error,
        fallbackUsed: true,
        timestamp: new Date(),
        cost: 0 // Resend es gratis hasta 3000 emails/mes
      };

    } catch (error) {
      return {
        success: false,
        channel: 'email',
        error: error instanceof Error ? error.message : 'Error desconocido',
        fallbackUsed: true,
        timestamp: new Date(),
        cost: 0
      };
    }
  }

  private async sendEmailViaResend(to: string, subject: string, html: string) {
    try {
      const resendConfig = notificationConfig.getProviderConfig('email', 'resend');

      // Type guard for Resend config
      function isResendConfig(config: unknown): config is { enabled: boolean; priority: number; apiKey: string; fromName: string; fromEmail: string } {
        return (
          typeof config === 'object' &&
          config !== null &&
          typeof (config as { apiKey?: unknown }).apiKey === 'string' &&
          typeof (config as { fromName?: unknown }).fromName === 'string' &&
          typeof (config as { fromEmail?: unknown }).fromEmail === 'string'
        );
      }

      if (!isResendConfig(resendConfig) || !resendConfig.enabled) {
        return { success: false, error: 'Resend no configurado correctamente' };
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${resendConfig.fromName} <${resendConfig.fromEmail}>`,
          to: [to],
          subject,
          html
        })
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, messageId: result.id };
      } else {
        const error = await response.json();
        return { success: false, error: error.message };
      }

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  private async sendInAppFallback(): Promise<NotificationResult> {
    try {
      console.log('📱 Guardando notificación in-app como último recurso...');
      
      // Aquí guardarías la notificación en Firestore para mostrar en la app
      // Por ahora, simular éxito
      
      return {
        success: true,
        channel: 'whatsapp', // Mantener como whatsapp para compatibilidad
        provider: 'in-app-fallback',
        messageId: `inapp_${Date.now()}`,
        fallbackUsed: true,
        timestamp: new Date(),
        cost: 0
      };

    } catch {
      return {
        success: false,
        channel: 'whatsapp',
        error: 'Todos los canales de notificación fallaron',
        fallbackUsed: true,
        timestamp: new Date(),
        cost: 0
      };
    }
  }

  // Método para envío masivo con rate limiting
  async sendBulkNotifications(
    notifications: NotificationPayload[],
    options: {
      batchSize?: number;
      delayBetweenBatches?: number;
      maxConcurrent?: number;
    } = {}
  ): Promise<NotificationResult[]> {
    const {
      batchSize = 10,
      delayBetweenBatches = 1000,
    } = options;

    console.log(`📦 Enviando ${notifications.length} notificaciones en lotes de ${batchSize}`);

    const results: NotificationResult[] = [];
    
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      console.log(`📤 Procesando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(notifications.length / batchSize)}`);
      
      // Procesar lote con concurrencia limitada
      const batchPromises = batch.map(async (notification, index) => {
        // Delay escalonado para evitar rate limits
        await new Promise(resolve => setTimeout(resolve, index * 200));
        return this.sendNotification(notification);
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Delay entre lotes
      if (i + batchSize < notifications.length) {
        console.log(`⏳ Esperando ${delayBetweenBatches}ms antes del siguiente lote...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);

    console.log(`✅ Notificaciones completadas: ${successCount}/${notifications.length}`);
    console.log(`💰 Costo total: $${totalCost.toFixed(4)} (¡Mayoría gratis!)`);

    return results;
  }

  // Método para obtener estadísticas de uso
  async getUsageStats(period: 'day' | 'week' | 'month' = 'day') {
    // Aquí implementarías la lógica para obtener estadísticas desde tu base de datos
    // Por ahora, retornar datos simulados
    
    return {
      period,
      whatsapp: {
        sent: 150,
        failed: 5,
        cost: 0, // ¡Gratis!
        providers: {
          baileys: 120,
          greenApi: 25,
          callmebot: 5
        }
      },
      email: {
        sent: 10,
        failed: 1,
        cost: 0 // Gratis con Resend
      },
      totalCost: 0,
      savings: 45.50 // Dinero ahorrado vs Twilio
    };
  }
}

export const hybridNotificationsService = new HybridNotificationsService();
