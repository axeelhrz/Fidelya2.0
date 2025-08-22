import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';
import {
  doc,
  setDoc,
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { notificationService } from './notifications.service';
import { handleError } from '@/lib/error-handler';
import { NotificationFormData } from '@/types/notification';

export interface SocioInvitationData {
  socioId: string;
  nombre: string;
  email: string;
  asociacionId: string;
}

export interface InvitationResult {
  success: boolean;
  error?: string;
  temporaryPassword?: string;
}

class SocioInvitationService {

  /**
   * Crear cuenta de Firebase Auth para socio existente y enviar invitación
   */
  async inviteSocioToActivateAccount(invitationData: SocioInvitationData): Promise<InvitationResult> {
    try {
      const { socioId, nombre, email, asociacionId } = invitationData;
      
      // Generar contraseña temporal
      const temporaryPassword = this.generateTemporaryPassword();
      
      console.log('🔐 Creating Firebase Auth account for socio:', email);
      
      // 1. Crear cuenta de Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        temporaryPassword
      );

      // 2. Actualizar perfil con nombre
      await updateProfile(userCredential.user, {
        displayName: nombre
      });

      // 3. Crear documento en colección users
      const batch = writeBatch(db);
      
      const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
      batch.set(userDocRef, {
        email: email.toLowerCase(),
        nombre,
        role: 'socio',
        estado: 'pendiente', // Pendiente hasta que active la cuenta
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
        asociacionId,
        configuracion: {
          notificaciones: true,
          tema: 'light',
          idioma: 'es',
        },
        metadata: {
          creadoPorAdmin: true,
          requiereActivacion: true,
          contraseñaTemporal: true
        }
      });

      // 4. Actualizar documento del socio con el UID
      const socioDocRef = doc(db, COLLECTIONS.SOCIOS, socioId);
      batch.update(socioDocRef, {
        uid: userCredential.user.uid,
        estado: 'pendiente_activacion',
        cuentaCreada: true,
        actualizadoEn: serverTimestamp()
      });

      await batch.commit();

      // 5. Enviar email de invitación con instrucciones
      await this.sendActivationInvitation(email, nombre, temporaryPassword);

      // 6. Cerrar sesión del admin (para no interferir)
      await auth.signOut();

      console.log('✅ Socio invitation sent successfully:', socioId);

      return {
        success: true,
        temporaryPassword
      };

    } catch (error) {
      console.error('❌ Error inviting socio:', error);
      return {
        success: false,
        error: handleError(error, 'Invite Socio', false).message
      };
    }
  }

  /**
   * Enviar email de invitación con instrucciones de activación
   */
  private async sendActivationInvitation(
    email: string,
    nombre: string,
    temporaryPassword: string
  ): Promise<void> {
    try {
      const emailContent: NotificationFormData = {
        title: '¡Bienvenido! Activa tu cuenta de socio',
        message: `Hola ${nombre},

Se ha creado una cuenta para ti en nuestro sistema de socios. Para comenzar a disfrutar de todos los beneficios, necesitas activar tu cuenta.

DATOS DE ACCESO TEMPORAL:
• Email: ${email}
• Contraseña temporal: ${temporaryPassword}

PASOS PARA ACTIVAR TU CUENTA:

1. Haz clic en el botón "Activar Cuenta" de abajo
2. Inicia sesión con los datos temporales
3. Cambia tu contraseña por una de tu elección
4. ¡Listo! Ya puedes disfrutar de todos los beneficios

IMPORTANTE: Por seguridad, debes cambiar tu contraseña temporal en el primer inicio de sesión.`,
        type: 'info',
        priority: 'high',
        category: 'membership'
      };

      // Crear notificación en la base de datos
      const notificationRef = doc(db, COLLECTIONS.NOTIFICATIONS);
      await setDoc(notificationRef, {
        ...emailContent,
        recipients: [email],
        status: 'pending',
        creadoEn: serverTimestamp()
      });

      // Enviar email usando el servicio de notificaciones
      await notificationService.sendNotificationToUser(
        notificationRef.id,
        email, // Usar email como userId temporal
        emailContent
      );

    } catch (error) {
      console.error('Error sending activation invitation:', error);
      throw error;
    }
  }

  /**
   * Reenviar invitación de activación
   */
  async resendActivationInvitation(socioId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const socioDoc = await getDoc(doc(db, COLLECTIONS.SOCIOS, socioId));
      
      if (!socioDoc.exists()) {
        return {
          success: false,
          error: 'Socio no encontrado'
        };
      }

      const socioData = socioDoc.data();

      // Enviar reset de contraseña en lugar de nueva contraseña temporal
      await sendPasswordResetEmail(auth, socioData.email);

      console.log('✅ Activation invitation resent for socio:', socioId);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error resending activation invitation:', error);
      return {
        success: false,
        error: handleError(error, 'Resend Invitation', false).message
      };
    }
  }

  /**
   * Completar activación de cuenta (cambiar contraseña temporal)
   */
  async completeAccountActivation(
    email: string,
    temporaryPassword: string,
    newPassword: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // 1. Iniciar sesión con contraseña temporal
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase(),
        temporaryPassword
      );

      // 2. Cambiar contraseña
      await updatePassword(userCredential.user, newPassword);

      // 3. Actualizar estado del usuario
      const batch = writeBatch(db);
      
      const userDocRef = doc(db, COLLECTIONS.USERS, userCredential.user.uid);
      batch.update(userDocRef, {
        estado: 'activo',
        actualizadoEn: serverTimestamp(),
        'metadata.contraseñaTemporal': false,
        'metadata.requiereActivacion': false,
        'metadata.activadoEn': serverTimestamp()
      });

      // 4. Actualizar estado del socio
      const socioQuery = await getDoc(doc(db, COLLECTIONS.SOCIOS, userCredential.user.uid));
      if (socioQuery.exists()) {
        const socioDocRef = doc(db, COLLECTIONS.SOCIOS, userCredential.user.uid);
        batch.update(socioDocRef, {
          estado: 'activo',
          estadoMembresia: 'al_dia',
          actualizadoEn: serverTimestamp()
        });
      }

      await batch.commit();

      console.log('✅ Account activation completed for:', email);

      return {
        success: true
      };

    } catch (error) {
      console.error('Error completing account activation:', error);
      return {
        success: false,
        error: handleError(error, 'Complete Activation', false).message
      };
    }
  }

  /**
   * Verificar si un socio necesita activación
   */
  async checkActivationStatus(socioId: string): Promise<{
    needsActivation: boolean;
    hasAccount: boolean;
    email?: string;
  }> {
    try {
      const socioDoc = await getDoc(doc(db, COLLECTIONS.SOCIOS, socioId));
      
      if (!socioDoc.exists()) {
        return {
          needsActivation: false,
          hasAccount: false
        };
      }

      const socioData = socioDoc.data();
      const hasAccount = !!socioData.uid;
      const needsActivation = hasAccount && socioData.estado === 'pendiente_activacion';

      return {
        needsActivation,
        hasAccount,
        email: socioData.email
      };

    } catch (error) {
      console.error('Error checking activation status:', error);
      return {
        needsActivation: false,
        hasAccount: false
      };
    }
  }

  /**
   * Generar contraseña temporal segura
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Asegurar que tenga al menos una mayúscula, una minúscula y un número
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpper || !hasLower || !hasNumber) {
      return this.generateTemporaryPassword(); // Recursivo hasta obtener una válida
    }
    
    return password;
  }
}

// Export singleton instance
export const socioInvitationService = new SocioInvitationService();
export default socioInvitationService;