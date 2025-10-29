import { 
  signInWithEmailAndPassword, 
  deleteUser,
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface CleanupResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Utilidad para limpiar cuentas huérfanas de Firebase Auth
 * IMPORTANTE: Solo funciona si conoces la contraseña de la cuenta
 */
export class FirebaseAuthCleanup {
  
  /**
   * Elimina una cuenta de Firebase Auth si existe pero no está en Firestore
   * NOTA: Requiere la contraseña de la cuenta para autenticarse temporalmente
   */
  static async cleanupOrphanedAccount(email: string, password: string): Promise<CleanupResult> {
    const currentUser = auth.currentUser;
    
    try {
      console.log('🧹 Intentando limpiar cuenta huérfana:', email);
      
      // Intentar autenticar con la cuenta a eliminar
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );
      
      const userToDelete = userCredential.user;
      console.log('✅ Autenticado con cuenta a eliminar:', userToDelete.uid);
      
      // Eliminar la cuenta de Firebase Auth
      await deleteUser(userToDelete);
      console.log('🗑️ Cuenta eliminada de Firebase Auth');
      
      // Cerrar sesión
      await firebaseSignOut(auth);
      console.log('🔐 Sesión cerrada');
      
      return {
        success: true,
        message: `Cuenta ${email} eliminada exitosamente de Firebase Auth`
      };
      
    } catch (error: unknown) {
      console.error('❌ Error limpiando cuenta huérfana:', error);
      
      // Asegurarse de cerrar sesión en caso de error
      try {
        if (auth.currentUser && auth.currentUser !== currentUser) {
          await firebaseSignOut(auth);
        }
      } catch (signOutError) {
        console.error('Error cerrando sesión después del error:', signOutError);
      }
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        
        switch (firebaseError.code) {
          case 'auth/user-not-found':
            return {
              success: false,
              message: 'La cuenta no existe en Firebase Auth',
              error: 'Usuario no encontrado'
            };
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            return {
              success: false,
              message: 'Contraseña incorrecta',
              error: 'Credenciales inválidas'
            };
          case 'auth/too-many-requests':
            return {
              success: false,
              message: 'Demasiados intentos. Intenta más tarde.',
              error: 'Límite de intentos excedido'
            };
          default:
            return {
              success: false,
              message: 'Error desconocido al limpiar la cuenta',
              error: firebaseError.message
            };
        }
      }
      
      return {
        success: false,
        message: 'Error desconocido al limpiar la cuenta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * Verifica si una cuenta existe en Firebase Auth
   */
  static async checkAccountExists(email: string, password: string): Promise<{
    exists: boolean;
    uid?: string;
    message: string;
  }> {
    const currentUser = auth.currentUser;
    
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );
      
      const uid = userCredential.user.uid;
      
      // Cerrar sesión inmediatamente
      await firebaseSignOut(auth);
      
      return {
        exists: true,
        uid,
        message: `Cuenta existe en Firebase Auth con UID: ${uid}`
      };
      
    } catch (error: unknown) {
      // Asegurarse de cerrar sesión en caso de error
      try {
        if (auth.currentUser && auth.currentUser !== currentUser) {
          await firebaseSignOut(auth);
        }
      } catch (signOutError) {
        console.error('Error cerrando sesión después del error:', signOutError);
      }
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string };
        
        if (firebaseError.code === 'auth/user-not-found') {
          return {
            exists: false,
            message: 'La cuenta no existe en Firebase Auth'
          };
        }
        
        if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
          return {
            exists: true,
            message: 'La cuenta existe pero la contraseña es incorrecta'
          };
        }
      }
      
      return {
        exists: false,
        message: 'Error verificando la cuenta'
      };
    }
  }
}

export default FirebaseAuthCleanup;