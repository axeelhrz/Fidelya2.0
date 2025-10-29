import { STORAGE_CONFIG, ERROR_MESSAGES, CORS_DEBUG } from './constants';

export interface CorsError extends Error {
  code?: string;
  status?: number;
  isCorsError?: boolean;
}

export class CorsHandler {
  private static logError(message: string, error?: unknown) {
    if (CORS_DEBUG.logErrors) {
      console.error(`🚫 CORS Handler: ${message}`, error);
    }
  }

  private static logInfo(message: string, data?: unknown) {
    if (CORS_DEBUG.logRequests) {
      console.info(`ℹ️ CORS Handler: ${message}`, data);
    }
  }

  private static logFallback(message: string, data?: unknown) {
    if (CORS_DEBUG.logFallbacks) {
      console.warn(`🔄 CORS Fallback: ${message}`, data);
    }
  }

  /**
   * Detect if an error is CORS-related
   */
  static isCorsError(error: unknown): boolean {
    if (!error) return false;

    interface ErrorWithMessage {
      message: string;
      toString(): string;
    }

    const hasMessage = (err: unknown): err is ErrorWithMessage =>
      typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string';

    const hasToString = (err: unknown): err is { toString(): string } =>
      typeof err === 'object' && err !== null && typeof (err as { toString?: unknown }).toString === 'function';

    const errorMessage = hasMessage(error)
      ? error.message.toLowerCase()
      : '';
    const errorString = hasToString(error)
      ? error.toString().toLowerCase()
      : '';

    const corsIndicators = [
      'cors',
      'cross-origin',
      'access-control-allow-origin',
      'preflight',
      'not allowed by access-control-allow-origin',
      'has been blocked by cors policy',
      'response to preflight request doesn\'t pass access control check',
    ];

    return corsIndicators.some(indicator => 
      errorMessage.includes(indicator) || errorString.includes(indicator)
    );
  }

  /**
   * Handle CORS errors with appropriate fallback strategies
   */
  static async handleCorsError<T>(
    operation: () => Promise<T>,
    fallbackOperation?: () => Promise<T>,
    operationName: string = 'Storage Operation'
  ): Promise<T | null> {
    try {
      this.logInfo(`Attempting ${operationName}`);
      const result = await operation();
      this.logInfo(`${operationName} completed successfully`);
      return result;
    } catch (error) {
      this.logError(`${operationName} failed`, error);

      if (this.isCorsError(error)) {
        this.logFallback(`CORS error detected in ${operationName}, attempting fallback`);

        if (fallbackOperation) {
          try {
            const fallbackResult = await fallbackOperation();
            this.logFallback(`Fallback ${operationName} completed successfully`);
            return fallbackResult;
          } catch (fallbackError) {
            this.logError(`Fallback ${operationName} also failed`, fallbackError);
            throw new Error(`${ERROR_MESSAGES.CORS_ERROR} - ${operationName} failed`);
          }
        } else {
          throw new Error(`${ERROR_MESSAGES.CORS_ERROR} - No fallback available for ${operationName}`);
        }
      } else {
        // Re-throw non-CORS errors
        throw error;
      }
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = STORAGE_CONFIG.maxRetries,
    baseDelay: number = STORAGE_CONFIG.retryDelay,
    operationName: string = 'Operation'
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logInfo(`${operationName} attempt ${attempt}/${maxRetries}`);
        const result = await operation();
        
        if (attempt > 1) {
          this.logInfo(`${operationName} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        this.logError(`${operationName} attempt ${attempt} failed`, error);

        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.logInfo(`Retrying ${operationName} in ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Create a timeout wrapper for operations
   */
  static withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number = STORAGE_CONFIG.uploadTimeout,
    operationName: string = 'Operation'
  ): Promise<T> {
    return Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${ERROR_MESSAGES.UPLOAD_TIMEOUT} - ${operationName}`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Get user-friendly error message
   */
  static getUserFriendlyMessage(error: unknown, operationName: string = 'operación'): string {
    const getMessage = (err: unknown): string | undefined => {
      if (typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        return (err as { message: string }).message;
      }
      return undefined;
    };

    if (!CORS_DEBUG.showUserFriendlyMessages) {
      return getMessage(error) || `Error en ${operationName}`;
    }

    if (this.isCorsError(error)) {
      return `Problema de configuración detectado. Se está usando un método alternativo para completar la ${operationName}.`;
    }

    const errorMessage = getMessage(error)?.toLowerCase() || '';

    if (errorMessage.includes('timeout')) {
      return `La ${operationName} está tomando más tiempo del esperado. Por favor, intenta nuevamente.`;
    }

    if (errorMessage.includes('network')) {
      return `Problema de conexión. Verifica tu internet e intenta nuevamente.`;
    }

    if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
      return `Se ha alcanzado el límite de almacenamiento. Contacta al administrador.`;
    }

    if (errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
      return `No tienes permisos para realizar esta ${operationName}.`;
    }

    return `Error inesperado en ${operationName}. Si el problema persiste, contacta al soporte técnico.`;
  }

  /**
   * Validate CORS configuration
   */
  static validateConfiguration(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check if origins are configured
    if (STORAGE_CONFIG.corsOrigins.length === 0) {
      issues.push('No CORS origins configured');
      recommendations.push('Add allowed origins to STORAGE_CONFIG.corsOrigins');
    }

    // Check for localhost origins in production
    if (process.env.NODE_ENV === 'production') {
      const hasLocalhostOrigins = STORAGE_CONFIG.corsOrigins.some(origin => 
        origin?.includes('localhost') || origin?.includes('127.0.0.1')
      );
      
      if (hasLocalhostOrigins) {
        issues.push('Localhost origins found in production');
        recommendations.push('Remove localhost origins from production CORS configuration');
      }
    }

    // Check Firebase configuration
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      issues.push('Firebase project ID not configured');
      recommendations.push('Set NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable');
    }

    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      recommendations.push('Consider setting NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET for explicit bucket configuration');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Log configuration status
   */
  static logConfigurationStatus(): void {
    const config = this.validateConfiguration();
    
    if (config.isValid) {
      console.log('✅ CORS configuration appears to be valid');
    } else {
      console.warn('⚠️ CORS configuration issues detected:');
      config.issues.forEach(issue => console.warn(`  - ${issue}`));
      
      if (config.recommendations.length > 0) {
        console.info('💡 Recommendations:');
        config.recommendations.forEach(rec => console.info(`  - ${rec}`));
      }
    }

    // Log current origins
    if (CORS_DEBUG.logRequests) {
      console.info('🌐 Configured CORS origins:', STORAGE_CONFIG.corsOrigins);
    }
  }
}

// Initialize configuration logging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  CorsHandler.logConfigurationStatus();
}

export default CorsHandler;
