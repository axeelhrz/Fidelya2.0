import { ActionCodeSettings } from 'firebase/auth';

/**
 * Firebase Auth Configuration for Email Actions
 * This file handles the proper configuration of Firebase Auth email actions
 * to prevent localhost redirects in production
 */

/**
 * Get the correct auth URL based on environment
 */
export const getAuthRedirectUrl = (): string => {
  // In production, always use the production domain
  if (process.env.NODE_ENV === 'production') {
    // Priority order for production URLs:
    // 1. Explicitly set app URL (remove trailing slash if present)
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
    }
    
    // 2. Vercel deployment URL
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    }
    
    // 3. Firebase Auth Domain (if it's a custom domain)
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    if (authDomain && !authDomain.includes('firebaseapp.com')) {
      return `https://${authDomain}`;
    }
    
    // 4. Fallback to main domain
    return 'https://fidelya2-0.vercel.app';
  }
  
  // In development, use localhost or configured URL
  const devUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  return devUrl.replace(/\/$/, ''); // Remove trailing slash
};

/**
 * Get email verification action code settings
 */
export const getEmailVerificationSettings = (): ActionCodeSettings => {
  const baseUrl = getAuthRedirectUrl();
  
  // Build the continue URL with proper encoding
  const continueUrl = `${baseUrl}/auth/login?verified=true`;
  const encodedContinueUrl = encodeURIComponent(continueUrl);
  
  return {
    // CRITICAL: Use /auth/action instead of /auth/login for proper handling
    url: `${baseUrl}/auth/action?continueUrl=${encodedContinueUrl}`,
    handleCodeInApp: false, // Important: Let Firebase handle the redirect
    iOS: {
      bundleId: 'com.fidelya.app'
    },
    android: {
      packageName: 'com.fidelya.app',
      installApp: false,
      minimumVersion: '1'
    }
    // Removed dynamicLinkDomain to use Firebase default
  };
};

/**
 * Get password reset action code settings
 */
export const getPasswordResetSettings = (): ActionCodeSettings => {
  const baseUrl = getAuthRedirectUrl();
  
  // Build the continue URL with proper encoding
  const continueUrl = `${baseUrl}/auth/login?reset=true`;
  const encodedContinueUrl = encodeURIComponent(continueUrl);
  
  return {
    url: `${baseUrl}/auth/action?continueUrl=${encodedContinueUrl}`,
    handleCodeInApp: false,
    iOS: {
      bundleId: 'com.fidelya.app'
    },
    android: {
      packageName: 'com.fidelya.app',
      installApp: false,
      minimumVersion: '1'
    }
  };
};

/**
 * Get account activation settings (for socio invitations)
 */
export const getAccountActivationSettings = (email?: string): ActionCodeSettings => {
  const baseUrl = getAuthRedirectUrl();
  
  // Build the URL with proper encoding
  let url = `${baseUrl}/auth/activate-account`;
  if (email) {
    url += `?email=${encodeURIComponent(email)}`;
  }
  
  return {
    url: url,
    handleCodeInApp: false,
    iOS: {
      bundleId: 'com.fidelya.app'
    },
    android: {
      packageName: 'com.fidelya.app',
      installApp: false,
      minimumVersion: '1'
    }
  };
};

/**
 * Validate Firebase Auth configuration
 */
export const validateFirebaseAuthConfig = (): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appUrl = getAuthRedirectUrl();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  
  // Check required environment variables
  if (!authDomain) {
    issues.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set');
  }
  
  if (!projectId) {
    issues.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set');
  }
  
  if (!apiKey) {
    issues.push('NEXT_PUBLIC_FIREBASE_API_KEY is not set');
  }
  
  // Check if auth domain matches expected pattern
  if (authDomain && !authDomain.includes(projectId || '')) {
    recommendations.push('Auth domain should match your Firebase project ID');
  }
  
  // Check production URL configuration
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_VERCEL_URL) {
      issues.push('No production URL configured (NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_VERCEL_URL)');
    }
    
    if (appUrl.includes('localhost')) {
      issues.push('Production environment is using localhost URL');
    }
  }
  
  // Recommendations for better configuration
  if (process.env.NODE_ENV === 'production') {
    recommendations.push('Ensure your domain is added to Firebase Auth authorized domains');
    recommendations.push('Configure custom email templates in Firebase Console');
    recommendations.push('Set up custom domain for better branding');
    recommendations.push('Enable rate-limiting protection in Firebase Console');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
};

/**
 * Log configuration for debugging
 */
export const logAuthConfig = (): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 Firebase Auth Configuration:');
    console.log('  - Auth URL:', getAuthRedirectUrl());
    console.log('  - Auth Domain:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
    console.log('  - Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    console.log('  - Environment:', process.env.NODE_ENV);
    console.log('  - API Key Present:', !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
    
    const validation = validateFirebaseAuthConfig();
    if (!validation.isValid) {
      console.warn('⚠️ Auth Configuration Issues:', validation.issues);
    }
    if (validation.recommendations.length > 0) {
      console.info('💡 Auth Configuration Recommendations:', validation.recommendations);
    }
  }
};

/**
 * Initialize auth configuration logging
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  logAuthConfig();
}