/**
 * Phone Validator and Formatter for Argentina
 * Automatically adds +549 prefix for WhatsApp compatibility
 * 
 * Valid Argentine phone formats:
 * - Local: 1112345678 (10 digits, Buenos Aires)
 * - Local with 0: 01112345678 (11 digits with leading 0)
 * - With 54: 5491112345678 (12 digits)
 * - With +54: +5491112345678 (13 characters)
 * - With 9: 91112345678 (11 digits, mobile indicator)
 */

export interface PhoneValidationResult {
  isValid: boolean;
  formatted: string;
  original: string;
  error?: string;
}

/**
 * Clean phone number by removing all non-digit characters except +
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all characters except digits and +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Validate if input contains ONLY digits (after cleaning)
 * This ensures no special characters are present
 */
export function containsOnlyDigits(phone: string): boolean {
  if (!phone) return false;
  const cleaned = cleanPhoneNumber(phone);
  // After cleaning, should only have digits (no + sign)
  return /^\d+$/.test(cleaned);
}

/**
 * Validate if a phone number is valid for WhatsApp
 * Valid formats after formatting:
 * - +549XXXXXXXXXX where X are digits
 * - Total: +549 (4 chars) + 10-12 digits = 14-16 characters
 * - Argentina mobile: +549 + area code (2-4 digits) + number (6-8 digits)
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  if (!phone) return false;
  
  const cleaned = cleanPhoneNumber(phone);
  
  // Must start with +549 for Argentina
  if (!cleaned.startsWith('+549')) return false;
  
  // Extract digits after +549
  const digitsAfterPrefix = cleaned.substring(4);
  
  // Must contain ONLY digits
  if (!/^\d+$/.test(digitsAfterPrefix)) return false;
  
  // Must have exactly 10-12 digits after +549
  // Argentina mobile: area code (2-4 digits) + number (6-8 digits)
  const digitCount = digitsAfterPrefix.length;
  return digitCount >= 10 && digitCount <= 12;
}

/**
 * Format phone number for Argentina with +549 prefix
 * Handles multiple input formats:
 * - 1112345678 -> +5491112345678 (10 digits, Buenos Aires)
 * - 91112345678 -> +5491112345678 (11 digits with 9)
 * - 5491112345678 -> +5491112345678 (12 digits with 54)
 * - +5491112345678 -> +5491112345678 (already formatted)
 * - 01112345678 -> +5491112345678 (11 digits with leading 0)
 * - 3512345678 -> +54935112345678 (10 digits, Córdoba area)
 */
export function formatPhoneForArgentina(phone: string): string {
  if (!phone) return '';
  
  // Clean the phone number - remove all non-digits
  let cleaned = cleanPhoneNumber(phone);
  
  if (!cleaned) return '';
  
  // Remove leading + if exists
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Case 1: Already has full format (549XXXXXXXXXX) - 12 digits
  if (cleaned.startsWith('549') && cleaned.length >= 12 && cleaned.length <= 14) {
    return '+' + cleaned;
  }
  
  // Case 2: Has 54 prefix but missing 9 (54XXXXXXXXXX) - 11 digits
  if (cleaned.startsWith('54') && !cleaned.startsWith('549') && cleaned.length >= 11) {
    // Remove 54 and add 549
    return '+549' + cleaned.substring(2);
  }
  
  // Case 3: Starts with 9 (mobile indicator) - 9XXXXXXXXXX (11 digits)
  if (cleaned.startsWith('9') && cleaned.length >= 10 && cleaned.length <= 12) {
    return '+549' + cleaned.substring(1);
  }
  
  // Case 4: Starts with 0 (national format) - 01112345678 (11 digits)
  if (cleaned.startsWith('0') && cleaned.length >= 10 && cleaned.length <= 12) {
    // Remove leading 0
    cleaned = cleaned.substring(1);
    return '+549' + cleaned;
  }
  
  // Case 5: Just the local number without any prefix - 1112345678 (10 digits)
  if (cleaned.length >= 10 && cleaned.length <= 11 && !cleaned.startsWith('0') && !cleaned.startsWith('5') && !cleaned.startsWith('9')) {
    return '+549' + cleaned;
  }
  
  // Case 6: Invalid - too short or too long
  return '';
}

/**
 * Validate and format phone number for Argentina
 * Returns validation result with formatted number
 * 
 * Validation rules:
 * 1. Must contain ONLY digits (no special characters except +)
 * 2. Must be 10-12 digits (after removing formatting)
 * 3. Must be a valid Argentine phone number
 */
export function validateAndFormatPhone(phone: string): PhoneValidationResult {
  const original = phone;
  
  if (!phone || phone.trim() === '') {
    return {
      isValid: false,
      formatted: '',
      original,
      error: 'El número de teléfono es requerido'
    };
  }
  
  // Clean and check length - remove all non-digits first
  const cleaned = cleanPhoneNumber(phone);
  
  // Remove the + if it exists to count only digits
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  // Must have 10-12 digits (before adding +549)
  if (digitsOnly.length < 10 || digitsOnly.length > 12) {
    return {
      isValid: false,
      formatted: '',
      original,
      error: `El número debe tener entre 10 y 12 dígitos. Ingresaste ${digitsOnly.length} dígitos`
    };
  }
  
  // Format the phone
  const formatted = formatPhoneForArgentina(phone);
  
  // If formatting failed (returned empty string)
  if (!formatted) {
    return {
      isValid: false,
      formatted: '',
      original,
      error: 'Formato de teléfono inválido. Ejemplo válido: 1112345678 o +5491112345678'
    };
  }
  
  // Validate the formatted phone
  const isValid = isValidWhatsAppPhone(formatted);
  
  if (!isValid) {
    return {
      isValid: false,
      formatted,
      original,
      error: 'Número de teléfono argentino inválido. Debe ser un número móvil válido'
    };
  }
  
  return {
    isValid: true,
    formatted,
    original,
  };
}

/**
 * Format phone for display (human-readable)
 * +5491112345678 -> +54 9 11 1234-5678
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  const cleaned = cleanPhoneNumber(phone);
  
  // Must start with +549
  if (!cleaned.startsWith('+549')) {
    return phone; // Return as-is if not in expected format
  }
  
  // Remove +549 prefix
  const withoutPrefix = cleaned.substring(4);
  
  if (withoutPrefix.length < 10) {
    return phone; // Return as-is if too short
  }
  
  // Extract area code (2-4 digits) and number
  // Common area codes: 11 (Buenos Aires), 351 (Córdoba), 341 (Rosario), etc.
  let areaCode = '';
  let number = '';
  
  if (withoutPrefix.startsWith('11')) {
    // Buenos Aires: 11 + 8 digits
    areaCode = withoutPrefix.substring(0, 2);
    number = withoutPrefix.substring(2);
  } else if (withoutPrefix.length === 10) {
    // 3-digit area code + 7 digits
    areaCode = withoutPrefix.substring(0, 3);
    number = withoutPrefix.substring(3);
  } else {
    // 4-digit area code + 6 digits or other combinations
    areaCode = withoutPrefix.substring(0, Math.min(4, withoutPrefix.length - 6));
    number = withoutPrefix.substring(areaCode.length);
  }
  
  // Format number with hyphen
  if (number.length >= 4) {
    const firstPart = number.substring(0, number.length - 4);
    const lastPart = number.substring(number.length - 4);
    number = `${firstPart}-${lastPart}`;
  }
  
  return `+54 9 ${areaCode} ${number}`;
}

/**
 * Check if phone number is from Argentina
 */
export function isArgentinePhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = cleanPhoneNumber(phone);
  return cleaned.startsWith('+54') || cleaned.startsWith('54');
}

/**
 * Batch validate and format multiple phone numbers
 */
export function batchValidatePhones(phones: string[]): PhoneValidationResult[] {
  return phones.map(phone => validateAndFormatPhone(phone));
}

/**
 * Get phone validation regex for form validation
 */
export function getPhoneValidationRegex(): RegExp {
  // Matches +549 followed by 10-12 digits
  return /^\+549\d{10,12}$/;
}

/**
 * Format phone as user types (for real-time input formatting)
 */
export function formatPhoneOnInput(value: string, previousValue: string = ''): string {
  // If user is deleting, don't auto-format
  if (value.length < previousValue.length) {
    return value;
  }
  
  // Clean the input
  const cleaned = cleanPhoneNumber(value);
  
  // If empty, return empty
  if (!cleaned) return '';
  
  // If starts with +, keep it
  if (value.startsWith('+')) {
    return cleaned;
  }
  
  // Otherwise, start building the formatted version
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return '+54';
  if (cleaned.length === 3) return '+549';
  
  // Add the rest of the digits
  return '+549' + cleaned;
}

/**
 * Extract phone number from various text formats
 * Useful for parsing from messages or documents
 */
export function extractPhoneFromText(text: string): string | null {
  if (!text) return null;
  
  // Try to find phone patterns
  const patterns = [
    /\+549\d{10,12}/g, // +549XXXXXXXXXX
    /\+54\s*9\s*\d{2,4}\s*\d{6,8}/g, // +54 9 XX XXXXXXXX
    /549\d{10,12}/g, // 549XXXXXXXXXX
    /\b0?\d{2,4}[-\s]?\d{6,8}\b/g, // 011-12345678 or 011 12345678
  ];
  
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first match, formatted
      return formatPhoneForArgentina(matches[0]);
    }
  }
  
  return null;
}