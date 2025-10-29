/**
 * Generador de tokens cortos seguros para validación de email
 * Usa base62 para crear slugs cortos y no predecibles
 */

const BASE62_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Genera un token corto aleatorio usando base62
 * @param length Longitud del token (default: 10)
 * @returns Token corto seguro
 */
export function generateShortToken(length: number = 10): string {
  let token = '';
  
  // Usar crypto.getRandomValues para mayor seguridad
  if (typeof window !== 'undefined' && window.crypto) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      token += BASE62_CHARS[randomValues[i] % BASE62_CHARS.length];
    }
  } else {
    // Fallback para Node.js
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      token += BASE62_CHARS[randomBytes[i] % BASE62_CHARS.length];
    }
  }
  
  return token;
}

/**
 * Genera un token con timestamp para evitar colisiones
 * @returns Token único con timestamp
 */
export function generateUniqueToken(): string {
  const timestamp = Date.now().toString(36); // Base36 timestamp
  const random = generateShortToken(8); // 8 caracteres aleatorios
  return `${random}${timestamp}`;
}

/**
 * Valida el formato de un token
 * @param token Token a validar
 * @returns true si el token tiene formato válido
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Verificar longitud (entre 8 y 20 caracteres)
  if (token.length < 8 || token.length > 20) {
    return false;
  }
  
  // Verificar que solo contenga caracteres base62
  const base62Regex = /^[0-9A-Za-z]+$/;
  return base62Regex.test(token);
}

/**
 * Genera un token de verificación de email con expiración
 * @param expirationHours Horas hasta la expiración (default: 24)
 * @returns Objeto con token y fecha de expiración
 */
export function generateEmailVerificationToken(expirationHours: number = 24): {
  token: string;
  expiresAt: Date;
} {
  const token = generateUniqueToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expirationHours);
  
  return {
    token,
    expiresAt
  };
}

/**
 * Verifica si un token ha expirado
 * @param expiresAt Fecha de expiración
 * @returns true si el token ha expirado
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
