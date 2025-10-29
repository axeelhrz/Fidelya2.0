/**
 * Phone Validator and Formatter for Argentina
 * Automatically adds +549 prefix for WhatsApp compatibility
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
 * Validate if a phone number is valid for WhatsApp
 * Valid formats:
 * - +549XXXXXXXXXX (11-13 digits after +549)
 * - Must start with +549 for Argentina
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  if (!phone) return false;
  
  const cleaned = cleanPhoneNumber(phone);
  
  // Must start with +549 for Argentina
  if (!cleaned.startsWith('+549')) return false;
  
  // Total length should be between 14-16 characters (+549 + 10-12 digits)
  // Argentina mobile: +549 + area code (2-4 digits) + number (6-8 digits)
  const totalLength = cleaned.length;
  return totalLength >= 14 && totalLength <= 16;
}

/**
 * Format phone number for Argentina with +549 prefix
 * Handles multiple input formats:
 * - 1112345678 -> +5491112345678
 * - 91112345678 -> +5491112345678
 * - 5491112345678 -> +5491112345678
 * - +5491112345678 -> +5491112345678
 * - 011 1234-5678 -> +5491112345678
 * - (011) 1234-5678 -> +5491112345678
 */
export function formatPhoneForArgentina(phone: string): string {
  if (!phone) return '';
  
  // Clean the phone number
  let cleaned = cleanPhoneNumber(phone);
  
  // Remove leading + if exists
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  
  // Case 1: Already has full format (549XXXXXXXXXX)
  if (cleaned.startsWith('549') && cleaned.length >= 13) {
    return '+' + cleaned;
  }
  
  // Case 2: Has 54 prefix but missing 9 (54XXXXXXXXXX)
  if (cleaned.startsWith('54') && !cleaned.startsWith('549')) {
    // Check if next digit after 54 is 9 (area code starting with 9)
    if (cleaned.length >= 3 && cleaned[2] === '9') {
      // It's 54 + 9XX... so we need to insert 9 after 54
      return '+54' + '9' + cleaned.substring(2);
    }
    // Otherwise just add 9 after 54
    return '+549' + cleaned.substring(2);
  }
  
  // Case 3: Starts with 9 (mobile indicator) - 9XXXXXXXXXX
  if (cleaned.startsWith('9') && cleaned.length >= 11) {
    return '+549' + cleaned.substring(1);
  }
  
  // Case 4: Starts with 0 (national format) - 01112345678
  if (cleaned.startsWith('0')) {
    // Remove leading 0
    cleaned = cleaned.substring(1);
    
    // If next digit is also 0 (00), remove it too (international prefix)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    return '+549' + cleaned;
  }
  
  // Case 5: Just the local number without any prefix - 1112345678
  if (cleaned.length >= 10) {
    return '+549' + cleaned;
  }
  
  // Case 6: Short number (less than 10 digits) - might be incomplete
  if (cleaned.length > 0) {
    return '+549' + cleaned;
  }
  
  return '';
}

/**
 * Validate and format phone number for Argentina
 * Returns validation result with formatted number
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
  
  // Format the phone
  const formatted = formatPhoneForArgentina(phone);
  
  // Validate the formatted phone
  const isValid = isValidWhatsAppPhone(formatted);
  
  if (!isValid) {
    // Check specific error cases
    if (formatted.length < 14) {
      return {
        isValid: false,
        formatted,
        original,
        error: 'El número es demasiado corto. Debe tener al menos 10 dígitos'
      };
    }
    
    if (formatted.length > 16) {
      return {
        isValid: false,
        formatted,
        original,
        error: 'El número es demasiado largo'
      };
    }
    
    return {
      isValid: false,
      formatted,
      original,
      error: 'Formato de teléfono inválido para WhatsApp'
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
