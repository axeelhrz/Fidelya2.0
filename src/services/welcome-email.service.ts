import { simpleNotificationService } from './simple-notifications.service';
import { configService } from '@/lib/config';
import { handleError } from '@/lib/error-handler';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/lib/constants';

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  userType: 'comercio' | 'asociacion';
  businessName: string;
  temporaryPassword?: string;
  loginUrl: string;
}

export interface WelcomeEmailResult {
  success: boolean;
  error?: string;
}

class WelcomeEmailService {
  
  /**
   * Obtiene el nombre correcto del negocio desde Firebase con reintentos
   */
  private async getBusinessNameFromFirebase(
    userType: 'comercio' | 'asociacion',
    userId: string,
    fallbackName: string,
    maxRetries: number = 3
  ): Promise<string> {
    let collectionName: string;
    let nameField: string;
    
    if (userType === 'asociacion') {
      collectionName = COLLECTIONS.ASOCIACIONES;
      nameField = 'nombreAsociacion';
    } else {
      collectionName = COLLECTIONS.COMERCIOS;
      nameField = 'nombreComercio';
    }

    // Intentar obtener el nombre con reintentos
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📋 Intento ${attempt}/${maxRetries} - Obteniendo nombre del ${userType} desde Firebase para usuario: ${userId}`);
        
        // Esperar un poco antes de cada intento (excepto el primero)
        if (attempt > 1) {
          const delay = attempt * 500; // 500ms, 1000ms, 1500ms
          console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        const docRef = doc(db, collectionName, userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const businessName = data[nameField];
          
          if (businessName && typeof businessName === 'string' && businessName.trim() !== '') {
            console.log(`✅ Nombre del ${userType} obtenido desde Firebase en intento ${attempt}: ${businessName}`);
            return businessName.trim();
          } else {
            console.warn(`⚠️ Intento ${attempt}: Campo ${nameField} no encontrado o vacío en Firebase`);
            
            // Si es el último intento, usar fallback
            if (attempt === maxRetries) {
              console.warn(`⚠️ Usando fallback después de ${maxRetries} intentos: ${fallbackName}`);
              return fallbackName;
            }
          }
        } else {
          console.warn(`⚠️ Intento ${attempt}: Documento del ${userType} no encontrado en Firebase`);
          
          // Si es el último intento, usar fallback
          if (attempt === maxRetries) {
            console.warn(`⚠️ Usando fallback después de ${maxRetries} intentos: ${fallbackName}`);
            return fallbackName;
          }
        }
      } catch (error) {
        console.error(`❌ Error en intento ${attempt} obteniendo nombre del ${userType}:`, error);
        
        // Si es el último intento, usar fallback
        if (attempt === maxRetries) {
          console.error(`❌ Usando fallback después de ${maxRetries} intentos fallidos: ${fallbackName}`);
          return fallbackName;
        }
      }
    }
    
    // Fallback por si acaso
    return fallbackName;
  }

  /**
   * Genera el contenido del email de bienvenida para comercios y asociaciones
   */
  private generateWelcomeEmailContent(data: WelcomeEmailData): {
    subject: string;
    message: string;
  } {
    const entityType = data.userType === 'comercio' ? 'Comercio' : 'Asociación';
    const subject = `¡Bienvenido a ${data.businessName}! - Tu cuenta en Fidelya está lista`;
    
    const message = `
¡Hola ${data.userName}!

¡Te damos la bienvenida a **${data.businessName}**! 🎉

Tu cuenta de ${entityType.toLowerCase()} en Fidelya ha sido creada exitosamente y está lista para usar.

📧 **Email:** ${data.userEmail}
${data.temporaryPassword ? `🔑 **Contraseña temporal:** ${data.temporaryPassword}` : ''}

${data.temporaryPassword ? '**IMPORTANTE:** Por tu seguridad, te recomendamos cambiar tu contraseña temporal en tu primer acceso.' : ''}

🔗 **Accede a tu cuenta aquí:** ${data.loginUrl}

**¿Qué puedes hacer con tu cuenta de ${entityType.toLowerCase()}?**
${data.userType === 'comercio' ? `
✅ Gestionar tus beneficios y promociones
✅ Validar códigos QR de socios
✅ Ver estadísticas de tus validaciones
✅ Administrar tu perfil comercial
✅ Recibir notificaciones de actividad
` : `
✅ Gestionar socios y comercios vinculados
✅ Crear y administrar beneficios
✅ Enviar notificaciones a tus miembros
✅ Ver reportes y estadísticas completas
✅ Configurar tu asociación
`}

**¿Necesitas ayuda?**
Si tienes alguna pregunta o problema para acceder, puedes contactar a:
- Soporte técnico de Fidelya: soporte@fidelya.com.ar

¡Esperamos que disfrutes de todas las funcionalidades que Fidelya tiene para ofrecerte!

---
Saludos cordiales,
El equipo de Fidelya 💙

*Este es un email automático, por favor no respondas a esta dirección.*
    `.trim();

    return { subject, message };
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
   * Envía el email de bienvenida a un nuevo comercio o asociación
   * ACTUALIZADO: Ahora lee el nombre correcto desde Firebase
   */
  async sendWelcomeEmail(
    userName: string,
    userEmail: string,
    userType: 'comercio' | 'asociacion',
    userId: string,
    fallbackBusinessName: string,
    temporaryPassword?: string
  ): Promise<WelcomeEmailResult> {
    try {
      console.log(`📧 Preparando email de bienvenida para: ${userName} (${userEmail})`);
      console.log(`🏢 Tipo: ${userType}, Usuario ID: ${userId}`);

      // NUEVO: Obtener el nombre correcto desde Firebase
      const businessName = await this.getBusinessNameFromFirebase(
        userType,
        userId,
        fallbackBusinessName
      );

      // Preparar datos para el email
      const emailData: WelcomeEmailData = {
        userName,
        userEmail,
        userType,
        businessName,
        temporaryPassword,
        loginUrl: this.getLoginUrl()
      };

      console.log(`🔗 URL de login generada: ${emailData.loginUrl}`);
      console.log(`🌍 Entorno: ${configService.isDevelopment() ? 'desarrollo' : 'producción'}`);
      console.log(`🏢 Nombre del negocio final: ${businessName}`);

      // Generar contenido del email
      const { subject, message } = this.generateWelcomeEmailContent(emailData);

      console.log(`📧 Contenido del email generado:`);
      console.log(`   📋 Subject: ${subject}`);
      console.log(`   📝 Message preview: ${message.substring(0, 200)}...`);

      // Crear un destinatario temporal para el servicio de notificaciones
      const tempRecipient = {
        id: userEmail,
        name: userName,
        email: userEmail,
        type: userType
      };

      // Preparar datos de notificación
      const notificationData = {
        title: subject,
        message: message,
        type: 'info' as const,
        channels: ['email' as const],
        recipientIds: [userEmail],
        businessName: businessName
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

      // Sobrescribir temporalmente el método sendEmail para usar el nombre correcto del negocio
      const originalSendEmail = simpleNotificationService['emailService'].sendEmail;
      simpleNotificationService['emailService'].sendEmail = async (to: string, subject: string, message: string) => {
        return originalSendEmail.call(simpleNotificationService['emailService'], to, subject, message);
      };

      try {
        // Crear y enviar la notificación
        const notificationId = await simpleNotificationService.createNotification(
          notificationData,
          `system-welcome-${userType}`
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
          console.log(`✅ Email de bienvenida enviado exitosamente a: ${userEmail}`);
          console.log(`🏢 Con nombre de negocio: ${businessName}`);
          return {
            success: true
          };
        } else {
          console.error(`❌ Error enviando email de bienvenida:`, result.errors);
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
      console.error('💥 Error crítico enviando email de bienvenida:', error);
      handleError(error, 'Send Welcome Email');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Envía email de bienvenida con reintentos
   * ACTUALIZADO: Nueva firma que incluye userId
   */
  async sendWelcomeEmailWithRetry(
    userName: string,
    userEmail: string,
    userType: 'comercio' | 'asociacion',
    userId: string,
    fallbackBusinessName: string,
    temporaryPassword?: string,
    maxRetries: number = 3
  ): Promise<WelcomeEmailResult> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📧 Intento ${attempt}/${maxRetries} - Enviando email de bienvenida a: ${userEmail}`);
      
      const result = await this.sendWelcomeEmail(
        userName,
        userEmail,
        userType,
        userId,
        fallbackBusinessName,
        temporaryPassword
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
export const welcomeEmailService = new WelcomeEmailService();
export default welcomeEmailService;