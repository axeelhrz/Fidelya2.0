import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateEmailVerificationToken, isTokenExpired, isValidTokenFormat } from '@/lib/token-generator';
import { handleError } from '@/lib/error-handler';

const TOKENS_COLLECTION = 'emailVerificationTokens';

export interface EmailVerificationTokenData {
  token: string;
  userId: string;
  email: string;
  role: 'socio' | 'comercio' | 'asociacion';
  expiresAt: Date;
  createdAt: Date;
  used: boolean;
  usedAt?: Date;
}

export interface CreateTokenResult {
  success: boolean;
  token?: string;
  error?: string;
}

export interface ValidateTokenResult {
  success: boolean;
  userId?: string;
  email?: string;
  role?: 'socio' | 'comercio' | 'asociacion';
  error?: string;
  expired?: boolean;
  alreadyUsed?: boolean;
}

class EmailVerificationTokenService {
  
  /**
   * Crea un nuevo token de verificación de email
   */
  async createVerificationToken(
    userId: string,
    email: string,
    role: 'socio' | 'comercio' | 'asociacion',
    expirationHours: number = 48 // 48 horas por defecto
  ): Promise<CreateTokenResult> {
    try {
      console.log(`🔐 Creando token de verificación para: ${email} (${role})`);
      
      // Generar token único
      const { token, expiresAt } = generateEmailVerificationToken(expirationHours);
      
      // Guardar en Firestore
      const tokenDocRef = doc(db, TOKENS_COLLECTION, token);
      
      const tokenData = {
        token,
        userId,
        email: email.toLowerCase().trim(),
        role,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp(),
        used: false
      };
      
      await setDoc(tokenDocRef, tokenData);
      
      console.log(`✅ Token de verificación creado: ${token}`);
      console.log(`⏰ Expira en: ${expirationHours} horas`);
      
      return {
        success: true,
        token
      };
      
    } catch (error) {
      console.error('❌ Error creando token de verificación:', error);
      return {
        success: false,
        error: handleError(error, 'Create Verification Token', false).message
      };
    }
  }
  
  /**
   * Valida un token de verificación
   */
  async validateToken(token: string): Promise<ValidateTokenResult> {
    try {
      console.log(`🔍 Validando token: ${token}`);
      
      // Validar formato
      if (!isValidTokenFormat(token)) {
        console.warn('⚠️ Formato de token inválido');
        return {
          success: false,
          error: 'Formato de token inválido'
        };
      }
      
      // Buscar token en Firestore
      const tokenDocRef = doc(db, TOKENS_COLLECTION, token);
      const tokenDoc = await getDoc(tokenDocRef);
      
      if (!tokenDoc.exists()) {
        console.warn('⚠️ Token no encontrado');
        return {
          success: false,
          error: 'Token no encontrado o inválido'
        };
      }
      
      const tokenData = tokenDoc.data();
      
      // Verificar si ya fue usado
      if (tokenData.used) {
        console.warn('⚠️ Token ya fue usado');
        return {
          success: false,
          error: 'Este enlace ya fue utilizado',
          alreadyUsed: true
        };
      }
      
      // Verificar expiración
      const expiresAt = tokenData.expiresAt.toDate();
      if (isTokenExpired(expiresAt)) {
        console.warn('⚠️ Token expirado');
        return {
          success: false,
          error: 'Este enlace ha expirado. Solicita uno nuevo.',
          expired: true
        };
      }
      
      console.log(`✅ Token válido para usuario: ${tokenData.userId}`);
      
      return {
        success: true,
        userId: tokenData.userId,
        email: tokenData.email,
        role: tokenData.role
      };
      
    } catch (error) {
      console.error('❌ Error validando token:', error);
      return {
        success: false,
        error: handleError(error, 'Validate Token', false).message
      };
    }
  }
  
  /**
   * Marca un token como usado
   */
  async markTokenAsUsed(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`✓ Marcando token como usado: ${token}`);
      
      const tokenDocRef = doc(db, TOKENS_COLLECTION, token);
      const tokenDoc = await getDoc(tokenDocRef);
      
      if (!tokenDoc.exists()) {
        return {
          success: false,
          error: 'Token no encontrado'
        };
      }
      
      await setDoc(tokenDocRef, {
        used: true,
        usedAt: serverTimestamp()
      }, { merge: true });
      
      console.log(`✅ Token marcado como usado`);
      
      return {
        success: true
      };
      
    } catch (error) {
      console.error('❌ Error marcando token como usado:', error);
      return {
        success: false,
        error: handleError(error, 'Mark Token As Used', false).message
      };
    }
  }
  
  /**
   * Elimina un token
   */
  async deleteToken(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Eliminando token: ${token}`);
      
      const tokenDocRef = doc(db, TOKENS_COLLECTION, token);
      await deleteDoc(tokenDocRef);
      
      console.log(`✅ Token eliminado`);
      
      return {
        success: true
      };
      
    } catch (error) {
      console.error('❌ Error eliminando token:', error);
      return {
        success: false,
        error: handleError(error, 'Delete Token', false).message
      };
    }
  }
  
  /**
   * Limpia tokens expirados (para mantenimiento)
   */
  async cleanupExpiredTokens(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      console.log('🧹 Limpiando tokens expirados...');
      
      const tokensRef = collection(db, TOKENS_COLLECTION);
      const now = Timestamp.now();
      
      const expiredQuery = query(
        tokensRef,
        where('expiresAt', '<', now)
      );
      
      const expiredTokens = await getDocs(expiredQuery);
      
      let deletedCount = 0;
      
      for (const tokenDoc of expiredTokens.docs) {
        await deleteDoc(tokenDoc.ref);
        deletedCount++;
      }
      
      console.log(`✅ ${deletedCount} tokens expirados eliminados`);
      
      return {
        success: true,
        deletedCount
      };
      
    } catch (error) {
      console.error('❌ Error limpiando tokens expirados:', error);
      return {
        success: false,
        deletedCount: 0,
        error: handleError(error, 'Cleanup Expired Tokens', false).message
      };
    }
  }
  
  /**
   * Obtiene un token por userId (para reenvío)
   */
  async getTokenByUserId(userId: string): Promise<EmailVerificationTokenData | null> {
    try {
      console.log(`🔍 Buscando token para usuario: ${userId}`);
      
      const tokensRef = collection(db, TOKENS_COLLECTION);
      const userTokensQuery = query(
        tokensRef,
        where('userId', '==', userId),
        where('used', '==', false)
      );
      
      const userTokens = await getDocs(userTokensQuery);
      
      if (userTokens.empty) {
        console.log('⚠️ No se encontró token activo para el usuario');
        return null;
      }
      
      // Obtener el token más reciente
      const tokenDoc = userTokens.docs[0];
      const tokenData = tokenDoc.data();
      
      return {
        token: tokenData.token,
        userId: tokenData.userId,
        email: tokenData.email,
        role: tokenData.role,
        expiresAt: tokenData.expiresAt.toDate(),
        createdAt: tokenData.createdAt.toDate(),
        used: tokenData.used,
        usedAt: tokenData.usedAt?.toDate()
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo token por userId:', error);
      return null;
    }
  }
  
  /**
   * Invalida todos los tokens de un usuario
   */
  async invalidateUserTokens(userId: string): Promise<{ success: boolean; invalidatedCount: number; error?: string }> {
    try {
      console.log(`🚫 Invalidando todos los tokens del usuario: ${userId}`);
      
      const tokensRef = collection(db, TOKENS_COLLECTION);
      const userTokensQuery = query(
        tokensRef,
        where('userId', '==', userId)
      );
      
      const userTokens = await getDocs(userTokensQuery);
      
      let invalidatedCount = 0;
      
      for (const tokenDoc of userTokens.docs) {
        await deleteDoc(tokenDoc.ref);
        invalidatedCount++;
      }
      
      console.log(`✅ ${invalidatedCount} tokens invalidados`);
      
      return {
        success: true,
        invalidatedCount
      };
      
    } catch (error) {
      console.error('❌ Error invalidando tokens del usuario:', error);
      return {
        success: false,
        invalidatedCount: 0,
        error: handleError(error, 'Invalidate User Tokens', false).message
      };
    }
  }
}

// Export singleton instance
export const emailVerificationTokenService = new EmailVerificationTokenService();
export default emailVerificationTokenService;
