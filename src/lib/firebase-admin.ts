import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Configuración de Firebase Admin SDK
const initializeFirebaseAdmin = () => {
  // Verificar si ya hay una app inicializada
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // En producción, usar variables de entorno para las credenciales
    const serviceAccount = {
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Verificar que las credenciales estén disponibles
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      console.warn('⚠️ Firebase Admin SDK credentials not found, using development mode');
      
      // En desarrollo, usar las credenciales del proyecto
      return initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
    }

    // Inicializar con credenciales completas
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    
    // Fallback: inicializar solo con project ID
    return initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
};

// Inicializar la app
const adminApp = initializeFirebaseAdmin();

// Exportar el servicio de autenticación
export const adminAuth = getAuth(adminApp);

// Función helper para verificar si Admin SDK está disponible
export const isAdminSDKAvailable = (): boolean => {
  try {
    return !!adminAuth && !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  } catch {
    return false;
  }
};

export default adminApp;