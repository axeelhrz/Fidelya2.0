import { simpleNotificationService } from './simple-notifications.service';
import { COLLECTIONS } from '@/lib/constants';
import { configService } from '@/lib/config';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { handleError } from '@/lib/error-handler';
import { emailVerificationTokenService } from './email-verification-token.service';

export interface AccountActivationEmailData {
  socioName: string;
  socioEmail: string;
  temporaryPassword: string;
  asociacionName: string;
  asociacionEmail?: string;
  numeroSocio?: string;
  loginUrl: string;
  verificationToken?: string; // NUEVO: Token de verificación
  verificationUrl?: string; // NUEVO: URL completa con token
}

export interface ActivationEmailResult {
  success: boolean;
  error?: string;
}

class AccountActivationEmailService {
  
  /**
   * Genera el contenido del email de activación de cuenta
   * ACTUALIZADO: Ahora incluye link corto de verificación
   */
  private generateActivationEmailContent(data: AccountActivationEmailData): {
    subject: string;
    message: string;
  } {
    const subject = `¡Bienvenido a ${data.asociacionName}! - Activa tu cuenta en Fidelya`;
    
    // NUEVO: Priorizar link de verificación si está disponible
    const activationLink = data.verificationUrl || data.loginUrl;
    
    const message = `
¡Hola ${data.socioName}!

¡Te damos la bienvenida a **${data.asociacionName}**! 🎉

Tu cuenta en Fidelya ha sido creada exitosamente. 

${data.numeroSocio ? `👤 **Número de socio:** ${data.numeroSocio}\n` : ''}
📧 **Email:** ${data.socioEmail}

**🔐 ACTIVA TU CUENTA CON UN SOLO CLIC:**

Haz clic en el siguiente enlace para activar tu cuenta automáticamente:

🔗 **${activationLink}**

Este enlace es válido por 48 horas y solo puede usarse una vez.

---

**MÉTODO ALTERNATIVO - Activación manual:**

Si prefieres, también puedes activar tu cuenta manualmente usando estas credenciales:

🔑 **Contraseña temporal:** ${data.temporaryPassword}
🔗 **Acceder manualmente:** ${data.loginUrl}

**IMPORTANTE:** Por tu seguridad, te recomendamos cambiar tu contraseña temporal en tu primer acceso.

---

**¿Qué puedes hacer con tu cuenta?**
✅ Ver y usar beneficios exclusivos de tu asociación
✅ Validar descuentos con códigos QR
✅ Consultar tu historial de beneficios utilizados
✅ Mantener actualizada tu información personal

**¿Necesitas ayuda?**
Si tienes alguna pregunta o problema para acceder, puedes contactar a:
- Tu asociación: ${data.asociacionEmail || 'Contacta directamente con tu asociación'}
- Soporte técnico de Fidelya: soporte@fidelya.com.ar

¡Esperamos que disfrutes de todos los beneficios que **${data.asociacionName}** tiene para ti!

---
Saludos cordiales,
El equipo de Fidelya 💙

*Este es un email automático, por favor no respondas a esta dirección.*
    `.trim();

    return { subject, message };
  }

  /**
   * Genera la URL de verificación con token corto
   * NUEVO: Método para generar URL con token
   */
  private getVerificationUrl(token: string): string {
    const baseUrl = configService.getAuthUrl();
    return `${baseUrl}/auth/activate-account?t=${token}`;
  }

  /**
   * Obtiene información de la asociación
   * CORREGIDO: Usar nombreAsociacion en lugar de nombre
   */
  private async getAsociacionInfo(asociacionId: string): Promise<{
    nombre: string;
    email?: string;
  } | null> {
    try {
      console.log(`🔍 Obteniendo información de asociación: ${asociacionId}`);
      const asociacionDoc = await getDoc(doc(db, COLLECTIONS.ASOCIACIONES, asociacionId));
      
      if (!asociacionDoc.exists()) {
        console.warn(`❌ Asociación no encontrada: ${asociacionId}`);
        return null;
      }

      const data = asociacionDoc.data();
      console.log(`📋 Datos de asociación obtenidos:`, {
        nombreAsociacion: data.nombreAsociacion,
        nombre: data.nombre,
        email: data.email
      });

      // CORREGIDO: Usar nombreAsociacion como campo principal, con fallback a nombre
      const nombreAsociacion = data.nombreAsociacion || data.nombre || 'Tu Asociación';
      
      console.log(`✅ Nombre de asociación a usar: ${nombreAsociacion}`);

      return {
        nombre: nombreAsociacion,
        email: data.email
      };
    } catch (error) {
      console.error('❌ Error obteniendo información de asociación:', error);
      return null;
    }
  }

  /**
   * Genera la URL de login usando el servicio de configuración
   * Automáticamente maneja desarrollo vs producción
   */
  private getLoginUrl(): string {
    const baseUrl = configService.getAuthUrl();
    return `${baseUrl}/auth/login`;
  }

  /**
   * Envía el email de activación de cuenta a un nuevo socio
   * ACTUALIZADO: Ahora incluye link corto con token de verificación
   */
  async sendAccountActivationEmail(
    socioName: string,
    socioEmail: string,
    temporaryPassword: string,
    asociacionId: string,
    userId: string, // NUEVO: userId para generar token
    numeroSocio?: string
  ): Promise<ActivationEmailResult> {
    try {
      console.log(`📧 Preparando email de activación para: ${socioName} (${socioEmail})`);
      console.log(`🏢 Asociación ID: ${asociacionId}`);
      console.log(`👤 Usuario ID: ${userId}`);

      // Obtener información de la asociación
      const asociacionInfo = await this.getAsociacionInfo(asociacionId);
      
      if (!asociacionInfo) {
        console.error(`❌ No se pudo obtener información de la asociación: ${asociacionId}`);
        return {
          success: false,
          error: 'No se pudo obtener información de la asociación'
        };
      }

      console.log(`✅ Información de asociación obtenida:`, {
        nombre: asociacionInfo.nombre,
        email: asociacionInfo.email
      });

      // NUEVO: Generar token de verificación de email
      console.log(`🔐 Generando token de verificación de email...`);
      const tokenResult = await emailVerificationTokenService.createVerificationToken(
        userId,
        socioEmail,
        'socio',
        48 // 48 horas de expiración
      );

      if (!tokenResult.success || !tokenResult.token) {
        console.error(`❌ Error generando token de verificación:`, tokenResult.error);
        return {
          success: false,
          error: 'Error generando token de verificación'
        };
      }

      console.log(`✅ Token de verificación generado: ${tokenResult.token}`);

      // Preparar datos para el email con el link corto
      const emailData: AccountActivationEmailData = {
        socioName,
        socioEmail,
        temporaryPassword,
        asociacionName: asociacionInfo.nombre,
        asociacionEmail: asociacionInfo.email,
        numeroSocio,
        loginUrl: this.getLoginUrl(),
        verificationToken: tokenResult.token, // NUEVO: Incluir token
        verificationUrl: this.getVerificationUrl(tokenResult.token) // NUEVO: URL con token
      };

      console.log(`🔗 URL de activación generada: ${emailData.loginUrl}`);
      console.log(`🔗 URL de verificación con token: ${emailData.verificationUrl}`);
      console.log(`🌍 Entorno: ${configService.isDevelopment() ? 'desarrollo' : 'producción'}`);

      // Generar contenido del email
      const { subject, message } = this.generateActivationEmailContent(emailData);

      console.log(`📧 Contenido del email generado:`);
      console.log(`   📋 Subject: ${subject}`);
      console.log(`   📝 Message preview: ${message.substring(0, 200)}...`);

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
        recipientIds: [socioEmail],
        businessName: asociacionInfo.nombre // Usar el nombre correcto de la asociación
      };

      console.log(`📤 Datos de notificación preparados:`, {
        title: notificationData.title,
        messageLength: notificationData.message.length,
        channels: notificationData.channels,
        recipientIds: notificationData.recipientIds,
        businessName: notificationData.businessName
      });

      // Sobrescribir temporalmente el método getRecipients
      const originalGetRecipients = simpleNotificationService.getRecipients;
      simpleNotificationService.getRecipients = async () => [tempRecipient];

      // Sobrescribir temporalmente el método sendEmail para pasar el nombre de la asociación
      const originalSendEmail = simpleNotificationService['emailService'].sendEmail;
      simpleNotificationService['emailService'].sendEmail = async (to: string, subject: string, message: string) => {
        console.log(`📧 Enviando email con nombre de asociación: ${asociacionInfo.nombre}`);
        return originalSendEmail.call(simpleNotificationService['emailService'], to, subject, message, asociacionInfo.nombre);
      };

      try {
        // Crear y enviar la notificación
        const notificationId = await simpleNotificationService.createNotification(
          notificationData,
          'system-activation'
        );

        console.log(`📝 Notificación creada con ID: ${notificationId}`);

        const result = await simpleNotificationService.sendNotification(
          notificationId,
          notificationData
        );

        console.log(`📊 Resultado del envío:`, {
          success: result.success,
          sentCount: result.sentCount,
          failedCount: result.failedCount,
          errorsCount: result.errors.length
        });

        // Restaurar los métodos originales
        simpleNotificationService.getRecipients = originalGetRecipients;
        simpleNotificationService['emailService'].sendEmail = originalSendEmail;

        if (result.success && result.sentCount > 0) {
          console.log(`✅ Email de activación enviado exitosamente a: ${socioEmail}`);
          console.log(`🏢 Con nombre de asociación: ${asociacionInfo.nombre}`);
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
        // Restaurar los métodos originales en caso de error
        simpleNotificationService.getRecipients = originalGetRecipients;
        simpleNotificationService['emailService'].sendEmail = originalSendEmail;
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
   * ACTUALIZADO: Ahora requiere userId para generar token
   */
  async sendAccountActivationEmailWithRetry(
    socioName: string,
    socioEmail: string,
    temporaryPassword: string,
    asociacionId: string,
    userId: string, // NUEVO: userId requerido
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
        userId, // NUEVO: Pasar userId
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