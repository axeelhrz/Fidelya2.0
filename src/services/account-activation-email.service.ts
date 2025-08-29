import { simpleNotificationService } from './simple-notifications.service';
import { COLLECTIONS } from '@/lib/constants';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { handleError } from '@/lib/error-handler';

export interface AccountActivationEmailData {
  socioName: string;
  socioEmail: string;
  temporaryPassword: string;
  asociacionName: string;
  asociacionEmail?: string;
  numeroSocio?: string;
  loginUrl: string;
}

export interface ActivationEmailResult {
  success: boolean;
  error?: string;
}

class AccountActivationEmailService {
  
  /**
   * Genera el contenido del email de activación de cuenta
   */
  private generateActivationEmailContent(data: AccountActivationEmailData): {
    subject: string;
    message: string;
  } {
    const subject = `¡Bienvenido a ${data.asociacionName}! - Activa tu cuenta en Fidelya`;
    
    const message = `
¡Hola ${data.socioName}!

¡Te damos la bienvenida a ${data.asociacionName}! 🎉

Tu cuenta en Fidelya ha sido creada exitosamente. A continuación encontrarás tus credenciales de acceso:

📧 **Email:** ${data.socioEmail}
🔑 **Contraseña temporal:** ${data.temporaryPassword}
${data.numeroSocio ? `👤 **Número de socio:** ${data.numeroSocio}` : ''}

**IMPORTANTE:** Por tu seguridad, te recomendamos cambiar tu contraseña temporal en tu primer acceso.

🔗 **Accede a tu cuenta aquí:** ${data.loginUrl}

**¿Qué puedes hacer con tu cuenta?**
✅ Ver y usar beneficios exclusivos de tu asociación
✅ Validar descuentos con códigos QR
✅ Consultar tu historial de beneficios utilizados
✅ Mantener actualizada tu información personal

**¿Necesitas ayuda?**
Si tienes alguna pregunta o problema para acceder, puedes contactar a:
- Tu asociación: ${data.asociacionEmail || 'Contacta directamente con tu asociación'}
- Soporte técnico de Fidelya: soporte@fidelya.com

¡Esperamos que disfrutes de todos los beneficios que ${data.asociacionName} tiene para ti!

---
Saludos cordiales,
El equipo de Fidelya 💙

*Este es un email automático, por favor no respondas a esta dirección.*
    `.trim();

    return { subject, message };
  }

  /**
   * Obtiene información de la asociación
   */
  private async getAsociacionInfo(asociacionId: string): Promise<{
    nombre: string;
    email?: string;
  } | null> {
    try {
      const asociacionDoc = await getDoc(doc(db, COLLECTIONS.ASOCIACIONES, asociacionId));
      
      if (!asociacionDoc.exists()) {
        console.warn(`Asociación no encontrada: ${asociacionId}`);
        return null;
      }

      const data = asociacionDoc.data();
      return {
        nombre: data.nombre || 'Tu Asociación',
        email: data.email
      };
    } catch (error) {
      console.error('Error obteniendo información de asociación:', error);
      return null;
    }
  }

  /**
   * Genera la URL de login dinámicamente
   */
  private getLoginUrl(): string {
    // En el cliente (navegador), usar el dominio actual
    if (typeof window !== 'undefined') {
      return `${window.location.protocol}//${window.location.host}/auth/login`;
    }
    
    // En el servidor, usar variables de entorno o fallback
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return `${process.env.NEXT_PUBLIC_APP_URL}/auth/login`;
    }
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/auth/login`;
    }
    
    // Fallback para desarrollo
    return 'http://localhost:3001/auth/login';
  }

  /**
   * Envía el email de activación de cuenta a un nuevo socio
   */
  async sendAccountActivationEmail(
    socioName: string,
    socioEmail: string,
    temporaryPassword: string,
    asociacionId: string,
    numeroSocio?: string
  ): Promise<ActivationEmailResult> {
    try {
      console.log(`📧 Preparando email de activación para: ${socioName} (${socioEmail})`);

      // Obtener información de la asociación
      const asociacionInfo = await this.getAsociacionInfo(asociacionId);
      
      if (!asociacionInfo) {
        return {
          success: false,
          error: 'No se pudo obtener información de la asociación'
        };
      }

      // Preparar datos para el email
      const emailData: AccountActivationEmailData = {
        socioName,
        socioEmail,
        temporaryPassword,
        asociacionName: asociacionInfo.nombre,
        asociacionEmail: asociacionInfo.email,
        numeroSocio,
        loginUrl: this.getLoginUrl()
      };

      // Generar contenido del email
      const { subject, message } = this.generateActivationEmailContent(emailData);

      // Crear un destinatario temporal para el servicio de notificaciones
      const tempRecipient = {
        id: socioEmail,
        name: socioName,
        email: socioEmail,
        type: 'socio' as const
      };

      // Preparar datos de notificación
      const notificationData = {
        title: subject,
        message: message,
        type: 'info' as const,
        channels: ['email' as const],
        recipientIds: [socioEmail]
      };

      // Sobrescribir temporalmente el método getRecipients
      const originalGetRecipients = simpleNotificationService.getRecipients;
      simpleNotificationService.getRecipients = async () => [tempRecipient];

      try {
        // Crear y enviar la notificación
        const notificationId = await simpleNotificationService.createNotification(
          notificationData,
          'system-activation'
        );

        const result = await simpleNotificationService.sendNotification(
          notificationId,
          notificationData
        );

        // Restaurar el método original
        simpleNotificationService.getRecipients = originalGetRecipients;

        if (result.success && result.sentCount > 0) {
          console.log(`✅ Email de activación enviado exitosamente a: ${socioEmail}`);
          return {
            success: true
          };
        } else {
          console.error(`❌ Error enviando email de activación:`, result.errors);
          return {
            success: false,
            error: result.errors.length > 0 ? result.errors.join(', ') : 'Error desconocido al enviar email'
          };
        }

      } catch (sendError) {
        // Restaurar el método original en caso de error
        simpleNotificationService.getRecipients = originalGetRecipients;
        throw sendError;
      }

    } catch (error) {
      console.error('💥 Error crítico enviando email de activación:', error);
      handleError(error, 'Send Account Activation Email');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía email de activación con reintentos
   */
  async sendAccountActivationEmailWithRetry(
    socioName: string,
    socioEmail: string,
    temporaryPassword: string,
    asociacionId: string,
    numeroSocio?: string,
    maxRetries: number = 3
  ): Promise<ActivationEmailResult> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📧 Intento ${attempt}/${maxRetries} - Enviando email de activación a: ${socioEmail}`);
      
      const result = await this.sendAccountActivationEmail(
        socioName,
        socioEmail,
        temporaryPassword,
        asociacionId,
        numeroSocio
      );

      if (result.success) {
        if (attempt > 1) {
          console.log(`✅ Email enviado exitosamente en el intento ${attempt}`);
        }
        return result;
      }

      lastError = result.error || 'Error desconocido';
      
      if (attempt < maxRetries) {
        console.log(`⚠️ Intento ${attempt} falló, reintentando en 2 segundos...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.error(`❌ Todos los intentos fallaron. Último error: ${lastError}`);
    return {
      success: false,
      error: `Error después de ${maxRetries} intentos: ${lastError}`
    };
  }

  /**
   * Verifica el estado de configuración del servicio de email
   */
  getServiceStatus() {
    return simpleNotificationService.getServicesStatus();
  }
}

// Export singleton instance
export const accountActivationEmailService = new AccountActivationEmailService();
export default accountActivationEmailService;
