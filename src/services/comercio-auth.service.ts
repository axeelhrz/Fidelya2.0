import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { 
  doc, 
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { COLLECTIONS, USER_STATES } from '@/lib/constants';
import { handleError } from '@/lib/error-handler';
import { ComercioFormData } from './comercio.service';

export interface CreateComercioAuthAccountResult {
  success: boolean;
  uid?: string;
  error?: string;
}

type ComercioDocData = { [key: string]: unknown };

class ComercioAuthService {
  /**
   * Crea una cuenta de Firebase Auth para un comercio
   */
  async createComercioAuthAccount(
    comercioData: ComercioFormData & { password: string },
    asociacionId: string
  ): Promise<CreateComercioAuthAccountResult> {
    // Guardar el usuario actual (admin) antes de crear la nueva cuenta
    const currentUser = auth.currentUser;
    
    try {
      console.log('🔐 Creando cuenta de Firebase Auth para comercio:', comercioData.email);

      // Validar que se proporcione una contraseña
      if (!comercioData.password || comercioData.password.length < 6) {
        throw new Error('Se requiere una contraseña de al menos 6 caracteres');
      }

      // Crear la cuenta de Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        comercioData.email.toLowerCase().trim(),
        comercioData.password
      );

      const newUser = userCredential.user;
      console.log('✅ Cuenta de Firebase Auth creada:', newUser.uid);

      // Actualizar el perfil del usuario con el nombre
      await updateProfile(newUser, {
        displayName: comercioData.nombreComercio
      });

      // Crear los documentos en Firestore usando batch
      const batch = writeBatch(db);

      // Documento en la colección users - ACTIVO desde el inicio
      const userDocRef = doc(db, COLLECTIONS.USERS, newUser.uid);
      const userData = {
        email: comercioData.email.toLowerCase().trim(),
        nombre: comercioData.nombreComercio,
        role: 'comercio',
        estado: USER_STATES.ACTIVO, // ACTIVO desde el inicio
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

      // Documento en la colección comercios - ACTIVO desde el inicio
      const comercioDocRef = doc(db, COLLECTIONS.COMERCIOS, newUser.uid);
      const comercioDocData: ComercioDocData = {
        nombreComercio: comercioData.nombreComercio,
        email: comercioData.email.toLowerCase().trim(),
        categoria: comercioData.categoria,
        asociacionesVinculadas: [asociacionId],
        estado: 'activo', // ACTIVO desde el inicio
        visible: true,
        beneficiosActivos: 0,
        validacionesRealizadas: 0,
        clientesAtendidos: 0,
        ingresosMensuales: 0,
        rating: 0,
        configuracion: comercioData.configuracion || {
          notificacionesEmail: true,
          notificacionesWhatsApp: false,
          autoValidacion: false,
          requiereAprobacion: true,
        },
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
        hasAuthAccount: true, // Marcar que tiene cuenta de auth
      };

      // Agregar campos opcionales solo si tienen valor
      if (comercioData.descripcion) {
        comercioDocData.descripcion = comercioData.descripcion;
      }
      if (comercioData.direccion) {
        comercioDocData.direccion = comercioData.direccion;
      }
      if (comercioData.telefono) {
        comercioDocData.telefono = comercioData.telefono;
      }
      if (comercioData.sitioWeb) {
        comercioDocData.sitioWeb = comercioData.sitioWeb;
      }
      if (comercioData.horario) {
        comercioDocData.horario = comercioData.horario;
      }
      if (comercioData.cuit) {
        comercioDocData.cuit = comercioData.cuit;
      }

      batch.set(comercioDocRef, comercioDocData);

      // Ejecutar el batch
      await batch.commit();
      console.log('✅ Documentos de Firestore creados exitosamente');

      // IMPORTANTE: Cerrar la sesión del comercio recién creado para restaurar la del admin
      await firebaseSignOut(auth);
      console.log('🔐 Sesión del comercio cerrada');

      // Esperar un momento para que Firebase procese el sign out
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('✅ Cuenta de comercio creada exitosamente');

      return {
        success: true,
        uid: newUser.uid
      };

    } catch (error) {
      console.error('❌ Error creando cuenta de comercio:', error);
      
      // Si se creó el usuario pero falló algo después, intentar limpiarlo
      if (auth.currentUser && auth.currentUser !== currentUser) {
        try {
          await auth.currentUser.delete();
          console.log('🧹 Usuario de Firebase Auth limpiado después del error');
        } catch (cleanupError) {
          console.error('❌ Error limpiando usuario después del fallo:', cleanupError);
        }
      }

      return {
        success: false,
        error: handleError(error, 'Create Comercio Auth Account', false).message
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
}

// Export singleton instance
export const comercioAuthService = new ComercioAuthService();
export default comercioAuthService;