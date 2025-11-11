/**
 * Rate Limiting Handler for Firebase Auth
 * Manages rate-limiting errors and provides intelligent retry strategies
 */

export interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfter?: number; // milliseconds
  message: string;
  canRetry: boolean;
}

export interface RateLimitConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRetries: 2,
  initialDelay: 2000, // 2 seconds
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2
};

class RateLimitHandler {
  private rateLimitCache = new Map<string, { timestamp: number; count: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  /**
   * Check if an error is a rate-limiting error
   */
  isRateLimitError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const errorCode = (error as { code?: string })?.code || '';
    const errorMessage = (error as { message?: string })?.message || '';

    return (
      errorCode === 'auth/too-many-requests' ||
      errorMessage.includes('too-many-requests') ||
      errorMessage.includes('Too many requests') ||
      errorMessage.includes('too many requests')
    );
  }

  /**
   * Get rate limit information from error
   */
  getRateLimitInfo(error: unknown): RateLimitInfo {
    const isRateLimited = this.isRateLimitError(error);

    if (!isRateLimited) {
      return {
        isRateLimited: false,
        message: 'No rate limit error',
        canRetry: true
      };
    }

    return {
      isRateLimited: true,
      retryAfter: 60000, // Firebase typically rate-limits for ~1 minute
      message: 'Se han enviado demasiadas solicitudes. Por favor, intenta de nuevo en unos minutos.',
      canRetry: false // Don't retry on rate-limiting, let user wait
    };
  }

  /**
   * Calculate backoff delay for retry
   */
  calculateBackoffDelay(attempt: number, config: RateLimitConfig = DEFAULT_CONFIG): number {
    const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  /**
   * Record a rate-limit event for tracking
   */
  recordRateLimitEvent(key: string): void {
    const now = Date.now();
    const existing = this.rateLimitCache.get(key);

    if (existing && now - existing.timestamp < this.CACHE_DURATION) {
      existing.count++;
    } else {
      this.rateLimitCache.set(key, { timestamp: now, count: 1 });
    }

    console.warn(`🚫 Rate-limit event recorded for ${key}. Count: ${this.rateLimitCache.get(key)?.count}`);
  }

  /**
   * Get rate-limit event count
   */
  getRateLimitEventCount(key: string): number {
    const existing = this.rateLimitCache.get(key);
    if (!existing) return 0;

    const now = Date.now();
    if (now - existing.timestamp > this.CACHE_DURATION) {
      this.rateLimitCache.delete(key);
      return 0;
    }

    return existing.count;
  }

  /**
   * Check if we should attempt retry based on error type
   */
  shouldRetry(error: unknown, attempt: number, maxRetries: number): boolean {
    // Never retry on rate-limiting
    if (this.isRateLimitError(error)) {
      return false;
    }

    // Retry on other errors if we haven't exceeded max retries
    return attempt < maxRetries;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: unknown): string {
    if (this.isRateLimitError(error)) {
      return 'Se han enviado demasiadas solicitudes. Por favor, espera unos minutos antes de intentar de nuevo. Revisa tu bandeja de entrada y carpeta de spam.';
    }

    const errorMessage = (error as { message?: string })?.message || '';
    const errorCode = (error as { code?: string })?.code || '';

    // Map common Firebase errors to user-friendly messages
    const errorMap: Record<string, string> = {
      'auth/invalid-api-key': 'Configuración de Firebase inválida. Contacta al administrador.',
      'auth/configuration-not-found': 'Configuración de Firebase no encontrada. Contacta al administrador.',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet e intenta de nuevo.',
      'auth/operation-not-allowed': 'Operación no permitida. Contacta al administrador.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/invalid-email': 'Email inválido.',
      'auth/email-already-in-use': 'Este email ya está registrado.'
    };

    return errorMap[errorCode] || errorMessage || 'Error desconocido. Por favor, intenta de nuevo.';
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.rateLimitCache.clear();
    console.log('🧹 Rate limit cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: Array<{ key: string; count: number }> } {
    const entries = Array.from(this.rateLimitCache.entries()).map(([key, value]) => ({
      key,
      count: value.count
    }));

    return {
      size: this.rateLimitCache.size,
      entries
    };
  }
}

// Export singleton instance
export const rateLimitHandler = new RateLimitHandler();
export default rateLimitHandler;