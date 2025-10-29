import { toast } from 'react-hot-toast';
import { ERROR_MESSAGES } from './constants';

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: Date;
  userId?: string;
  action?: string;
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: AppError[] = [];

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: unknown, context?: string, showToast = true): AppError {
    const appError: AppError = {
      code: this.getErrorCode(error),
      message: this.getErrorMessage(error),
      details: error,
      timestamp: new Date(),
      action: context,
    };

    // Log error
    console.error(`[${context || 'Unknown'}] Error:`, appError);

    // Store error for debugging
    this.errors.push(appError);

    // Show toast notification
    if (showToast) {
      toast.error(appError.message);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(appError);
    }

    return appError;
  }

  private getErrorCode(error: unknown): string {
    if ((error as { code?: string })?.code) return (error as { code: string }).code;
    if (typeof error === 'object' && error !== null && 'name' in error && typeof (error as { name: unknown }).name === 'string') {
      return (error as { name: string }).name;
    }
    if (typeof error === 'object' && error !== null && 'status' in error) {
      return `HTTP_${(error as { status: number }).status}`;
    }
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(error: unknown): string {
    // Firebase Auth errors
    if (
      typeof error === 'object' &&
      error !== null &&
      Object.prototype.hasOwnProperty.call(error, 'code') &&
      typeof (error as { code?: unknown }).code === 'string' &&
      ((error as { code: string }).code).startsWith('auth/')
    ) {
      return this.getFirebaseAuthErrorMessage((error as { code: string }).code);
    }

    // Firebase Firestore errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code: unknown }).code === 'string' &&
      (error as { code: string }).code.startsWith('firestore/')
    ) {
      return this.getFirestoreErrorMessage((error as { code: string }).code);
    }

    // Network errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'NETWORK_ERROR'
    ) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // HTTP errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error
    ) {
      return this.getHttpErrorMessage((error as { status: number }).status);
    }

    // Custom app errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      return (error as { message: string }).message;
    }

    return ERROR_MESSAGES.SERVER_ERROR;
  }

  private getFirebaseAuthErrorMessage(code: string): string {
    const authErrors: Record<string, string> = {
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/invalid-credential': 'Credenciales inválidas',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
    };

    return authErrors[code] || 'Error de autenticación';
  }

  private getFirestoreErrorMessage(code: string): string {
    const firestoreErrors: Record<string, string> = {
      'firestore/permission-denied': ERROR_MESSAGES.UNAUTHORIZED,
      'firestore/not-found': ERROR_MESSAGES.NOT_FOUND,
      'firestore/already-exists': 'El documento ya existe',
      'firestore/resource-exhausted': 'Límite de recursos excedido',
      'firestore/failed-precondition': 'Condición previa fallida',
      'firestore/aborted': 'Operación abortada',
      'firestore/out-of-range': 'Valor fuera de rango',
      'firestore/unimplemented': 'Funcionalidad no implementada',
      'firestore/internal': ERROR_MESSAGES.SERVER_ERROR,
      'firestore/unavailable': 'Servicio temporalmente no disponible',
      'firestore/data-loss': 'Pérdida de datos detectada',
      'firestore/unauthenticated': 'Usuario no autenticado',
      'firestore/deadline-exceeded': 'Tiempo de espera agotado',
    };

    return firestoreErrors[code] || 'Error de base de datos';
  }

  private getHttpErrorMessage(status: number): string {
    const httpErrors: Record<number, string> = {
      400: ERROR_MESSAGES.VALIDATION_ERROR,
      401: ERROR_MESSAGES.UNAUTHORIZED,
      403: ERROR_MESSAGES.UNAUTHORIZED,
      404: ERROR_MESSAGES.NOT_FOUND,
      429: 'Demasiadas solicitudes. Intenta más tarde',
      500: ERROR_MESSAGES.SERVER_ERROR,
      502: 'Servidor no disponible',
      503: 'Servicio temporalmente no disponible',
      504: 'Tiempo de espera agotado',
    };

    return httpErrors[status] || ERROR_MESSAGES.SERVER_ERROR;
  }

  private sendToMonitoring(error: AppError): void {
    // Here you would send to your monitoring service
    // Example: Sentry, LogRocket, etc.
    console.log('Sending error to monitoring service:', error);
  }

  public getRecentErrors(limit = 10): AppError[] {
    return this.errors.slice(-limit);
  }

  public clearErrors(): void {
    this.errors = [];
  }

  // Utility methods for common error scenarios
  public handleNetworkError(context?: string): AppError {
    return this.handleError(
      { code: 'NETWORK_ERROR', message: ERROR_MESSAGES.NETWORK_ERROR },
      context
    );
  }

  public handleValidationError(message: string, context?: string): AppError {
    return this.handleError(
      { code: 'VALIDATION_ERROR', message },
      context
    );
  }

  public handleUnauthorizedError(context?: string): AppError {
    return this.handleError(
      { code: 'UNAUTHORIZED', message: ERROR_MESSAGES.UNAUTHORIZED },
      context
    );
  }

  public handleNotFoundError(resource: string, context?: string): AppError {
    return this.handleError(
      { code: 'NOT_FOUND', message: `${resource} no encontrado` },
      context
    );
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions
export const handleError = (error: unknown, context?: string, showToast = true) =>
  errorHandler.handleError(error, context, showToast);

export const handleNetworkError = (context?: string) =>
  errorHandler.handleNetworkError(context);

export const handleValidationError = (message: string, context?: string) =>
  errorHandler.handleValidationError(message, context);

export const handleUnauthorizedError = (context?: string) =>
  errorHandler.handleUnauthorizedError(context);

export const handleNotFoundError = (resource: string, context?: string) =>
  errorHandler.handleNotFoundError(resource, context);

// React hook for error handling
export const useErrorHandler = () => {
  return {
    handleError,
    handleNetworkError,
    handleValidationError,
    handleUnauthorizedError,
    handleNotFoundError,
    getRecentErrors: () => errorHandler.getRecentErrors(),
    clearErrors: () => errorHandler.clearErrors(),
  };
};
