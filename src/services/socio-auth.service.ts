import { 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { 
  doc, 
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { COLLECTIONS, USER_STATES } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';
import { SocioFormData } from '@/types/socio';
import { membershipSyncService } from './membership-sync.service';
import { accountActivationEmailService } from './account-activation-email.service';

export interface CreateSocioAuthAccountResult {
  success: boolean;
  uid?: string;
  error?: string;
  emailSent?: boolean;
  emailError?: string;
  verificationEmailSent?: boolean;
  verificationEmailError?: string;
}

type SocioDocData = { [key: string]: unknown };

class SocioAuthService {

  /**
   * Crea una cuenta de Firebase Auth para un socio SIN INTERFERIR con la sesión del administrador
   * Usa Firebase Admin SDK server-side para evitar cambios de sesión
   * MEJORADO: No cierra la sesión del administrador
   */
  async createSocioAuthAccountServerSide(
    socioData: SocioFormData,
    asociacionId: string
  ): Promise<CreateSocioAuthAccountResult> {
    try {
      console.log('🔐 Creando cuenta de Firebase Auth server-side para socio:', socioData.email);

      // Validar que se proporcione una contraseña
      if (!socioData.password || socioData.password.length < 6) {
        throw new Error('Se requiere una contraseña de al menos 6 caracteres');
      }

      // Llamar al endpoint server-side para crear la cuenta
      const response = await fetch('/api/auth/create-socio-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: socioData.email.toLowerCase().trim(),
          password: socioData.password,
          displayName: socioData.nombre,
          asociacionId
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status}`);
      }

      const newUserUid = result.uid;
      console.log('✅ Cuenta de Firebase Auth creada server-side:', newUserUid);

      // Crear los documentos en Firestore usando batch
      const batch = writeBatch(db);

      // Documento en la colección users - PENDIENTE hasta verificación de email
      const userDocRef = doc(db, COLLECTIONS.USERS, newUserUid);
      const userData = {
        email: socioData.email.toLowerCase().trim(),
        nombre: socioData.nombre,
        role: 'socio',
        estado: USER_STATES.PENDIENTE, // PENDIENTE hasta verificación de email
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
        asociacionId: asociacionId, // Asignar asociación desde el inicio
        configuracion: {
          notificaciones: true,
          tema: 'light',
          idioma: 'es',
        },
      };

      batch.set(userDocRef, userData);

      // Documento en la colección socios - ACTIVO y AL_DIA desde el inicio
      const socioDocRef = doc(db, COLLECTIONS.SOCIOS, newUserUid);
      const socioDocData: SocioDocData = {
        nombre: socioData.nombre,
        email: socioData.email.toLowerCase().trim(),
        dni: socioData.dni || '',
        telefono: socioData.telefono || '',
        direccion: socioData.direccion || '',
        asociacionId: asociacionId, // Asignar asociación desde el inicio
        estado: 'activo', // ACTIVO desde el inicio
        estadoMembresia: 'al_dia', // AL_DIA desde el inicio - ESTO ES CLAVE
        fechaIngreso: serverTimestamp(),
        fechaVinculacion: serverTimestamp(), // Fecha de vinculación
        vinculadoPor: asociacionId, // Vinculado por la asociación
        beneficiosUsados: 0,
        validacionesRealizadas: 0,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
        hasAuthAccount: true, // Marcar que tiene cuenta de auth
        requiresEmailVerification: true, // NUEVO: Marcar que requiere verificación
      };

      // Agregar campos opcionales solo si tienen valor
      if (socioData.fechaNacimiento) {
        socioDocData.fechaNacimiento = socioData.fechaNacimiento;
      }
      if (socioData.fechaVencimiento) {
        socioDocData.fechaVencimiento = socioData.fechaVencimiento;
      }
      if (socioData.montoCuota !== undefined) {
        socioDocData.montoCuota = socioData.montoCuota;
      }
      if (socioData.numeroSocio) {
        socioDocData.numeroSocio = socioData.numeroSocio;
      }

      batch.set(socioDocRef, socioDocData);

      // Ejecutar el batch
      await batch.commit();
      console.log('✅ Documentos de Firestore creados exitosamente');

      // Verificar y sincronizar el estado de membresía después de la creación
      console.log('🔄 Verificando estado de membresía después de la creación...');
      try {
        await membershipSyncService.syncMembershipStatus(newUserUid);
        console.log('✅ Estado de membresía sincronizado correctamente');
      } catch (syncError) {
        console.warn('⚠️ Error sincronizando estado de membresía:', syncError);
        // No fallar la creación por errores de sincronización
      }

      // Enviar email de activación con credenciales
      console.log('📧 Enviando email de activación de cuenta...');
      let emailSent = false;
      let emailError: string | undefined;

      try {
        const emailResult = await accountActivationEmailService.sendAccountActivationEmailWithRetry(
          socioData.nombre,
          socioData.email.toLowerCase().trim(),
          socioData.password, // Enviar la contraseña temporal
          asociacionId,
          newUserUid, // NUEVO: Pasar el userId para generar token
          socioData.numeroSocio
        );

        emailSent = emailResult.success;
        if (!emailResult.success) {
          emailError = emailResult.error;
          console.warn('⚠️ Error enviando email de activación:', emailResult.error);
        } else {
          console.log('✅ Email de activación enviado exitosamente');
        }
      } catch (emailSendError) {
        emailError = emailSendError instanceof Error ? emailSendError.message : 'Error desconocido enviando email';
        console.error('❌ Error crítico enviando email de activación:', emailSendError);
      }

      console.log('✅ Cuenta de socio creada exitosamente SIN CERRAR sesión del administrador');

      // Enviar notificación automática "Creación de cuenta"
      try {
        await this.sendAccountCreationNotification(
          newUserUid,
          socioData.nombre,
          asociacionId,
          socioData.numeroSocio || 'SIN-NUMERO'
        );
      } catch (notifError) {
        console.warn('⚠️ Error enviando notificación de creación de cuenta:', notifError);
        // No fallar la creación por error de notificación
      }

      return {
        success: true,
        uid: newUserUid,
        emailSent,
        emailError,
        verificationEmailSent: result.verificationEmailSent,
        verificationEmailError: result.verificationEmailError
      };

    } catch (error) {
      console.error('❌ Error creando cuenta de socio server-side:', error);

      return {
        success: false,
        error: handleError(error, 'Create Socio Auth Account Server Side', false).message,
        emailSent: false,
        verificationEmailSent: false
      };
    }
  }

  /**
   * Genera una contraseña temporal segura
   */
  generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    
    // Asegurar que tenga al menos una mayúscula, una minúscula, un número y un símbolo
    password += 'ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 23)]; // Mayúscula
    password += 'abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random() * 23)]; // Minúscula  
    password += '23456789'[Math.floor(Math.random() * 8)]; // Número
    password += '!@#$%&*'[Math.floor(Math.random() * 7)]; // Símbolo
    
    // Completar hasta 12 caracteres
    for (let i = 4; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Enviar notificación automática de creación de cuenta
   */
  private async sendAccountCreationNotification(
    socioId: string,
    socioNombre: string,
    asociacionId: string,
    numeroSocio: string
  ): Promise<void> {
    try {
      console.log('📧 Enviando notificación automática de creación de cuenta...');

      // Importar servicios dinámicamente para evitar dependencias circulares
      const { notificationTemplatesService } = await import('./notification-templates.service');
      const { notificationQueueService } = await import('./notification-queue.service');
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      // Obtener nombre de la asociación
      const asociacionDoc = await getDoc(doc(db, 'asociaciones', asociacionId));
      const asociacionNombre = asociacionDoc.exists() 
        ? asociacionDoc.data().nombre || 'Tu Asociación'
        : 'Tu Asociación';

      // Buscar plantilla "Creación de cuenta"
      const templates = await notificationTemplatesService.getTemplates(false);
      const template = templates.find(t => t.name === 'Creación de cuenta' && t.isSystem);

      if (!template) {
        console.warn('⚠️ Plantilla "Creación de cuenta" no encontrada');
        return;
      }

      // Renderizar plantilla con variables
      const title = notificationTemplatesService.parseTemplate(template.title, {
        socio_nombre: socioNombre,
        asociacion_nombre: asociacionNombre,
        numero_socio: numeroSocio,
      });

      const message = notificationTemplatesService.parseTemplate(template.message, {
        socio_nombre: socioNombre,
        asociacion_nombre: asociacionNombre,
        numero_socio: numeroSocio,
      });

      // Crear datos de notificación
      const notificationData = {
        title,
        message,
        type: template.type,
        category: template.category,
        recipientIds: [socioId],
        metadata: {
          senderName: 'Sistema',
          recipientCount: 1,
          templateId: template.id,
          templateName: template.name,
          automatic: true,
          trigger: 'account_creation',
        },
      };

      // Importar notificationService para crear el documento
      const { notificationService } = await import('./notifications.service');
      const notificationId = await notificationService.createNotification(notificationData);

      // Encolar para envío
      await notificationQueueService.enqueueNotification(
        notificationId,
        [socioId],
        notificationData,
        { maxAttempts: 3 }
      );

      // Actualizar uso de plantilla
      await notificationTemplatesService.updateTemplateUsage(template.id);

      console.log('✅ Notificación de creación de cuenta encolada exitosamente');
    } catch (error) {
      console.error('❌ Error enviando notificación de creación de cuenta:', error);
      throw error;
    }
  }

  private isFirebaseAuthError(error: unknown): error is { code: string } {
    const e = error as { [key: string]: unknown };
    return typeof error === 'object' && error !== null && 'code' in e && typeof e['code'] === 'string';
  }

  /**
   * Verifica si un email ya está registrado en Firebase Auth
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      // Intentar crear un usuario temporal para verificar si el email existe
      // Este es un método indirecto ya que Firebase no tiene una API directa para esto
      // en el cliente
      const tempPassword = this.generateSecurePassword();
      
      try {
        await createUserWithEmailAndPassword(
          auth,
          email.toLowerCase().trim(),
          tempPassword
        );

        // Si se creó el usuario temporal, entonces el email NO existe en auth.
        // Limpiar el usuario temporal creado para no dejar cuentas huérfanas.
        try {
          if (auth.currentUser) {
            await auth.currentUser.delete();
          }
        } catch (cleanupError) {
          console.warn('Advertencia al limpiar usuario temporal:', cleanupError);
        }

        // Asegurarse de cerrar sesión del usuario temporal
        try {
          await firebaseSignOut(auth);
        } catch (signOutError) {
          console.warn('Advertencia al cerrar sesión del usuario temporal:', signOutError);
        }

        return false; // email no existe
      } catch (error: unknown) {
        if (this.isFirebaseAuthError(error) && error.code === 'auth/email-already-in-use') {
          return true;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error verificando email:', error);
      // En caso de error, asumir que el email podría existir para ser conservadores
      return true;
    }
  }

  /**
   * Elimina una cuenta de Firebase Authentication completamente
   * Esto permite que el email pueda ser reutilizado para crear una nueva cuenta
   */
  async deleteFirebaseAuthAccount(uid: string, asociacionId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Iniciando eliminación de cuenta de Firebase Auth para UID: ${uid}`);

      // Llamar al endpoint API que maneja la eliminación con Admin SDK
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid,
          asociacionId
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status}`);
      }

      console.log(`✅ Cuenta de Firebase Auth eliminada exitosamente: ${uid}`);
      return true;

    } catch (error) {
      console.error(`❌ Error eliminando cuenta de Firebase Auth para ${uid}:`, error);
      
      // En caso de error, intentar continuar con la eliminación de Firestore
      // para no dejar datos huérfanos
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.warn(`⚠️ Continuando con eliminación de Firestore a pesar del error de Auth: ${errorMessage}`);
      
      return false; // Retornar false para indicar que hubo un problema
    }
  }
}

// Export singleton instance
export const socioAuthService = new SocioAuthService();
export default socioAuthService;