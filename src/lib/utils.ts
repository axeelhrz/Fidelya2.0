import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely converts a Firestore Timestamp to a Date object
 * @param timestamp - The timestamp to convert (can be Timestamp, Date, string, or null/undefined)
 * @returns Date object or null if conversion fails
 */
export function safeTimestampToDate(
  timestamp: Date | { toDate?: () => Date; seconds?: number; nanoseconds?: number } | string | number | null | undefined
): Date | null {
  if (!timestamp) return null;
  
  try {
    // If it's already a Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }
    
    // If it's a Firestore Timestamp
    if (
      typeof timestamp === 'object' &&
      timestamp !== null &&
      typeof (timestamp as { toDate?: () => Date }).toDate === 'function'
    ) {
      return (timestamp as { toDate: () => Date }).toDate();
    }
    
    // If it's a string or number, try to create a Date
    if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // If it has seconds and nanoseconds (Firestore Timestamp-like object)
    if (timestamp && typeof timestamp.seconds === 'number') {
      return new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    }
    
    return null;
  } catch (error) {
    console.warn('Error converting timestamp to date:', error);
    return null;
  }
}

/**
 * Safely formats a Firestore Timestamp using date-fns format
 * @param timestamp - The timestamp to format
 * @param formatString - The format string for date-fns
 * @param options - Additional options for date-fns format
 * @returns Formatted date string or fallback text
 */
export function safeFormatTimestamp(
  timestamp: Date | { toDate?: () => Date; seconds?: number; nanoseconds?: number } | string | number | null | undefined, 
  formatString: string, 
  options?: Record<string, unknown>,
  fallback: string = 'No disponible'
): string {
  const date = safeTimestampToDate(timestamp);
  if (!date) return fallback;

  try {
    // Use format function from date-fns
    return format(date, formatString, options);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return fallback;
  }
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};