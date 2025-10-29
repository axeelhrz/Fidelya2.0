import { AuthError } from 'firebase/auth';
import { FirestoreError } from 'firebase/firestore';

/**
 * Handles Firebase authentication and Firestore errors
 * and returns user-friendly error messages in Spanish
 */
export function handleFirebaseError(error: unknown): string {
  // Add debugging information
  console.error('🔥 Firebase Error Details:', {
    error,
    type: typeof error,
    code: error && typeof error === 'object' && 'code' in error ? error.code : 'unknown',
    message: error && typeof error === 'object' && 'message' in error ? error.message : 'unknown',
    stack: error && typeof error === 'object' && 'stack' in error ? error.stack : 'unknown'
  });

  // Handle Firebase Auth errors by checking for code property
  if (error && typeof error === 'object' && 'code' in error) {
    const firebaseError = error as { code: string; message: string };
    
    switch (firebaseError.code) {
      // Authentication errors
      case 'auth/user-not-found':
        return 'No existe una cuenta con este email. Verifica tu dirección de correo.';
      case 'auth/wrong-password':
      case 'auth/invalid-password':
        return 'La contraseña es incorrecta. Verifica tu contraseña e intenta nuevamente.';
      case 'auth/invalid-credential':
        return 'Las credenciales proporcionadas son inválidas. Verifica tu email y contraseña.';
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'El formato del email no es válido. Verifica tu dirección de correo.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
      case 'auth/requires-recent-login':
        return 'Por seguridad, debes iniciar sesión nuevamente para realizar esta acción.';
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con este email usando otro método de acceso.';
      case 'auth/operation-not-allowed':
        return 'Este método de autenticación no está habilitado.';
      case 'auth/invalid-verification-code':
        return 'El código de verificación es inválido.';
      case 'auth/invalid-verification-id':
        return 'El ID de verificación es inválido.';
      case 'auth/missing-verification-code':
        return 'Falta el código de verificación.';
      case 'auth/missing-verification-id':
        return 'Falta el ID de verificación.';
      case 'auth/credential-already-in-use':
        return 'Estas credenciales ya están en uso por otra cuenta.';
      case 'auth/invalid-continue-uri':
        return 'La URL de continuación es inválida.';
      case 'auth/missing-continue-uri':
        return 'Falta la URL de continuación.';
      case 'auth/unauthorized-continue-uri':
        return 'La URL de continuación no está autorizada.';
      case 'auth/missing-email':
        return 'El email es requerido.';
      case 'auth/missing-password':
        return 'La contraseña es requerida.';
      case 'auth/email-change-needs-verification':
        return 'El cambio de email requiere verificación.';
      case 'auth/internal-error':
        return 'Error interno del servidor. Intenta nuevamente.';
      case 'auth/invalid-api-key':
        return 'Error de configuración. Contacta al administrador.';
      case 'auth/app-deleted':
        return 'La aplicación ha sido eliminada. Contacta al administrador.';
      case 'auth/expired-action-code':
        return 'El código de acción ha expirado.';
      case 'auth/invalid-action-code':
        return 'El código de acción es inválido.';
      case 'auth/invalid-message-payload':
        return 'El mensaje es inválido.';
      case 'auth/invalid-sender':
        return 'El remitente es inválido.';
      case 'auth/invalid-recipient-email':
        return 'El email del destinatario es inválido.';
      case 'auth/missing-android-pkg-name':
        return 'Falta el nombre del paquete Android.';
      case 'auth/missing-continue-uri':
        return 'Falta la URL de continuación.';
      case 'auth/missing-ios-bundle-id':
        return 'Falta el ID del bundle iOS.';
      case 'auth/invalid-dynamic-link-domain':
        return 'El dominio del enlace dinámico es inválido.';
      case 'auth/argument-error':
        return 'Los argumentos proporcionados son inválidos.';
      case 'auth/invalid-persistence-type':
        return 'El tipo de persistencia es inválido.';
      case 'auth/unsupported-persistence-type':
        return 'El tipo de persistencia no es compatible.';
      case 'auth/invalid-oauth-provider':
        return 'El proveedor OAuth es inválido.';
      case 'auth/unauthorized-domain':
        return 'El dominio no está autorizado.';
      case 'auth/invalid-user-token':
        return 'El token del usuario es inválido.';
      case 'auth/user-token-expired':
        return 'El token del usuario ha expirado.';
      case 'auth/null-user':
        return 'No hay usuario autenticado.';
      case 'auth/app-not-authorized':
        return 'La aplicación no está autorizada.';
      case 'auth/invalid-user-import':
        return 'Error al importar usuario.';
      case 'auth/user-not-found':
        return 'Usuario no encontrado.';
      case 'auth/admin-restricted-operation':
        return 'Operación restringida para administradores.';
      case 'auth/captcha-check-failed':
        return 'La verificación CAPTCHA falló.';
      case 'auth/invalid-phone-number':
        return 'El número de teléfono es inválido.';
      case 'auth/missing-phone-number':
        return 'Falta el número de teléfono.';
      case 'auth/quota-exceeded':
        return 'Se ha excedido la cuota. Intenta más tarde.';
      
      // Firestore errors
      case 'firestore/permission-denied':
        return 'No tienes permisos para realizar esta acción.';
      case 'firestore/not-found':
        return 'El documento solicitado no existe.';
      case 'firestore/already-exists':
        return 'El documento ya existe.';
      case 'firestore/resource-exhausted':
        return 'Se ha excedido el límite de operaciones. Intenta más tarde.';
      case 'firestore/failed-precondition':
        return 'La operación no se puede completar en el estado actual.';
      case 'firestore/aborted':
        return 'La operación fue cancelada debido a un conflicto.';
      case 'firestore/out-of-range':
        return 'Los datos están fuera del rango permitido.';
      case 'firestore/unimplemented':
        return 'Esta operación no está implementada.';
      case 'firestore/internal':
        return 'Error interno del servidor.';
      case 'firestore/unavailable':
        return 'El servicio no está disponible temporalmente.';
      case 'firestore/data-loss':
        return 'Se ha perdido información. Contacta al soporte.';
      case 'firestore/unauthenticated':
        return 'Debes iniciar sesión para realizar esta acción.';
      case 'firestore/invalid-argument':
        return 'Los datos proporcionados son inválidos.';
      case 'firestore/deadline-exceeded':
        return 'La operación tardó demasiado tiempo. Intenta nuevamente.';
      case 'firestore/cancelled':
        return 'La operación fue cancelada.';
      
      default:
        console.error('🔥 Unhandled Firebase error code:', firebaseError.code);
        return `Error: ${firebaseError.code}. Intenta nuevamente o contacta al soporte.`;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const errorMessage = error.message;
    
    // Check for Firebase error patterns in the message
    if (errorMessage.includes('auth/email-already-in-use')) {
      return 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.';
    }
    if (errorMessage.includes('auth/wrong-password')) {
      return 'La contraseña es incorrecta. Verifica tu contraseña e intenta nuevamente.';
    }
    if (errorMessage.includes('auth/user-not-found')) {
      return 'No existe una cuenta con este email. Verifica tu dirección de correo.';
    }
    if (errorMessage.includes('auth/invalid-email')) {
      return 'El formato del email no es válido. Verifica tu dirección de correo.';
    }
    if (errorMessage.includes('auth/weak-password')) {
      return 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (errorMessage.includes('auth/too-many-requests')) {
      return 'Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente.';
    }
    if (errorMessage.includes('auth/network-request-failed')) {
      return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
    }
    
    // Check for common error patterns
    if (errorMessage.includes('network') || errorMessage.includes('Network')) {
      return 'Error de conexión. Verifica tu conexión a internet.';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      return 'La operación tardó demasiado tiempo. Intenta nuevamente.';
    }
    if (errorMessage.includes('permission') || errorMessage.includes('Permission')) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
      return 'Los datos proporcionados son inválidos.';
    }
    
    // Return the original message if it's user-friendly (in Spanish)
    if (errorMessage.includes('no encontrado') || 
        errorMessage.includes('inválido') || 
        errorMessage.includes('requerido') ||
        errorMessage.includes('contraseña') ||
        errorMessage.includes('email') ||
        errorMessage.includes('usuario')) {
      return errorMessage;
    }
    
    // Return the error message if it doesn't contain technical details
    if (!errorMessage.includes('Firebase:') && 
        !errorMessage.includes('Error (') && 
        !errorMessage.includes('auth/') &&
        !errorMessage.includes('firestore/')) {
      return errorMessage;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    if (error.includes('auth/email-already-in-use')) {
      return 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.';
    }
    return error;
  }

  console.error('🔥 Unknown error type:', typeof error, error);
  return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';
}

/**
 * Checks if an error is a Firebase Auth error
 */
export function isAuthError(error: unknown): error is AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('auth/')
  );
}

/**
 * Checks if an error is a Firestore error
 */
export function isFirestoreError(error: unknown): error is FirestoreError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string' &&
    (error as { code: string }).code.startsWith('firestore/')
  );
}

/**
 * Enhanced error logging for debugging
 */
export function logAuthError(error: unknown, context: string): void {
  console.group(`🔐 Auth Error - ${context}`);
  console.error('Error object:', error);
  console.error('Error type:', typeof error);
  
  if (error && typeof error === 'object') {
    if ('code' in error) {
      console.error('Error code:', (error as { code: unknown }).code);
    }
    if ('message' in error) {
      console.error('Error message:', (error as { message: unknown }).message);
    }
    if ('stack' in error) {
      console.error('Stack trace:', (error as { stack: unknown }).stack);
    }
  }
  
  console.groupEnd();
}

/**
 * Utility function to extract Firebase error code from any error format
 */
export function extractFirebaseErrorCode(error: unknown): string | null {
  if (!error) return null;
  
  // Direct code property
  if (typeof error === 'object' && 'code' in error) {
    return (error as { code: string }).code;
  }
  
  // From error message
  if (error instanceof Error) {
    const match = error.message.match(/auth\/[\w-]+/);
    if (match) return match[0];
  }
  
  // From string
  if (typeof error === 'string') {
    const match = error.match(/auth\/[\w-]+/);
    if (match) return match[0];
  }
  
  return null;
}

/**
 * Simplified error handler that focuses on the most common cases
 */
export function getFirebaseErrorMessage(error: unknown): string {
  const errorCode = extractFirebaseErrorCode(error);
  
  if (errorCode) {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este email ya está registrado. Intenta iniciar sesión o usa otro email.';
      case 'auth/wrong-password':
      case 'auth/invalid-password':
        return 'La contraseña es incorrecta. Verifica tu contraseña e intenta nuevamente.';
      case 'auth/user-not-found':
        return 'No existe una cuenta con este email. Verifica tu dirección de correo.';
      case 'auth/invalid-email':
        return 'El formato del email no es válido. Verifica tu dirección de correo.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Espera unos minutos antes de intentar nuevamente.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu conexión a internet e intenta nuevamente.';
      case 'auth/invalid-credential':
        return 'Las credenciales proporcionadas son inválidas. Verifica tu email y contraseña.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
      default:
        return `Error de autenticación (${errorCode}). Intenta nuevamente.`;
    }
  }
  
  return handleFirebaseError(error);
}