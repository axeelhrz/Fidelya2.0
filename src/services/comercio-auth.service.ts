import { 
  createUserWithEmailAndPassword, 
  updateProfile,
  signOut as firebaseSignOut,
  getAuth
} from 'firebase/auth';
import { 
  initializeApp,
  deleteApp
} from 'firebase/app';
import { 
  doc, 
  serverTimestamp,
  writeBatch,
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
   * Crea una cuenta de Firebase Auth para un comercio usando una instancia secundaria
   * para mantener la sesión de la asociación activa
   */
  async createComercioAuthAccount(
    comercioData: ComercioFormData & { password: string },
    asociacionId: string
  ): Promise<CreateComercioAuthAccountResult> {
    // Verificar que hay un usuario actual (asociación) autenticado
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay una sesión de asociación activa');
    }

    let secondaryApp;
    
    try {
      console.log('🔐 Creando cuenta de Firebase Auth para comercio:', comercioData.email);
      console.log('🔐 Manteniendo sesión activa de asociación:', currentUser.email);

      // Validar que se proporcione una contraseña
      if (!comercioData.password || comercioData.password.length < 6) {
        throw new Error('Se requiere una contraseña de al menos 6 caracteres');
      }

      // Crear una instancia secundaria de Firebase para crear el usuario
      // sin afectar la sesión principal
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      // Crear una instancia temporal de Firebase
      const tempAppName = `temp-app-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, tempAppName);
      const secondaryAuth = getAuth(secondaryApp);

      console.log('🔧 Instancia secundaria de Firebase creada');

      // Crear la cuenta de Firebase Auth usando la instancia secundaria
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        comercioData.email.toLowerCase().trim(),
        comercioData.password
      );

      const newUser = userCredential.user;
      console.log('✅ Cuenta de Firebase Auth creada para comercio:', newUser.uid);

      // Actualizar el perfil del comercio
      await updateProfile(newUser, {
        displayName: comercioData.nombreComercio
      });

      // Crear los documentos en Firestore usando la instancia principal (no la secundaria)
      // para mantener consistencia con el resto de la aplicación
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

      // Ejecutar el batch para crear los documentos
      await batch.commit();
      console.log('✅ Documentos de Firestore creados exitosamente');

      // Cerrar la sesión en la instancia secundaria
      await firebaseSignOut(secondaryAuth);
      console.log('🔐 Sesión del comercio cerrada en instancia secundaria');

      // Limpiar la instancia secundaria
      await deleteApp(secondaryApp);
      console.log('🧹 Instancia secundaria de Firebase eliminada');

      // Verificar que la sesión principal sigue activa
      if (auth.currentUser && auth.currentUser.uid === currentUser.uid) {
        console.log('✅ Sesión de la asociación mantenida correctamente');
      } else {
        console.warn('⚠️ La sesión de la asociación pudo haberse visto afectada');
      }

      console.log('✅ Comercio creado exitosamente sin afectar la sesión de la asociación');

      return {
        success: true,
        uid: newUser.uid
      };

    } catch (error) {
      console.error('❌ Error creando cuenta de comercio:', error);
      
      // Limpiar la instancia secundaria en caso de error
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
          console.log('🧹 Instancia secundaria limpiada después del error');
        } catch (cleanupError) {
          console.error('❌ Error limpiando instancia secundaria:', cleanupError);
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
    let secondaryApp;
    
    try {
      // Crear una instancia temporal para verificar el email
      const firebaseConfig = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      };

      const tempAppName = `temp-check-${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, tempAppName);
      const secondaryAuth = getAuth(secondaryApp);

      const tempPassword = this.generateSecurePassword();
      
      try {
        await createUserWithEmailAndPassword(
          secondaryAuth,
          email.toLowerCase().trim(),
          tempPassword
        );

        // Si se creó el usuario temporal, entonces el email NO existe en auth.
        // Limpiar el usuario temporal creado para no dejar cuentas huérfanas.
        try {
          if (secondaryAuth.currentUser) {
            await secondaryAuth.currentUser.delete();
          }
        } catch (cleanupError) {
          console.warn('Advertencia al limpiar usuario temporal:', cleanupError);
        }

        // Cerrar sesión en la instancia temporal
        try {
          await firebaseSignOut(secondaryAuth);
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
    } finally {
      // Limpiar la instancia temporal
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (cleanupError) {
          console.error('Error limpiando instancia temporal:', cleanupError);
        }
      }
    }
  }
}

// Export singleton instance
export const comercioAuthService = new ComercioAuthService();
export default comercioAuthService;