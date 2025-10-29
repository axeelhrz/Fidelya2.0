import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInWithEmailAndPassword,
  updatePassword
} from 'firebase/auth';
import {
  doc,
  serverTimestamp,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { accountActivationEmailService } from './account-activation-email.service';
import { handleError } from '@/lib/error-handler';
import { getPasswordResetSettings } from '@/lib/firebase-auth-config';

export interface SocioInvitationData {
  socioId: string;
  nombre: string;
  email: string;
  asociacionId: string;
  numeroSocio?: string;
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
      const { socioId, nombre, email, asociacionId, numeroSocio } = invitationData;
      
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

      // 5. Enviar email de invitación usando el servicio especializado
      const emailResult = await accountActivationEmailService.sendAccountActivationEmailWithRetry(
        nombre,
        email.toLowerCase(),
        temporaryPassword,
        asociacionId,
        userCredential.user.uid,
        numeroSocio
      );

      if (!emailResult.success) {
        console.warn('⚠️ Email de activación falló, pero la cuenta fue creada:', emailResult.error);
        // No fallar completamente si el email falla, la cuenta ya fue creada
      }

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

      // Use the imported password reset settings
      const actionCodeSettings = getPasswordResetSettings();

      // Enviar reset de contraseña con configuración correcta
      await sendPasswordResetEmail(auth, socioData.email, actionCodeSettings);

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