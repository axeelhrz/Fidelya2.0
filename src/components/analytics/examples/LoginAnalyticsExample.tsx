/**
 * EJEMPLO DE USO DE GOOGLE ANALYTICS
 * 
 * Este archivo muestra cómo integrar eventos de Google Analytics
 * en un componente de autenticación.
 * 
 * Puedes usar este patrón en cualquier componente de tu aplicación.
 */

'use client';

import { event } from '@/lib/analytics';

// Ejemplo de función de login con tracking
export const handleLoginWithAnalytics = async (
  _email: string,
  userType: 'socio' | 'comercio' | 'asociacion'
) => {
  try {
    // Tu lógica de login aquí
    // const result = await signIn(email, password);
    
    // Rastrear login exitoso
    event({
      action: 'login',
      category: 'Authentication',
      label: `${userType} Login Success`,
    });

    // También puedes rastrear el tipo de usuario
    event({
      action: 'user_type',
      category: 'User',
      label: userType,
    });

    return { success: true };
  } catch (error) {
    // Rastrear error de login
    event({
      action: 'login_error',
      category: 'Authentication',
      label: `${userType} Login Failed`,
    });

    throw error;
  }
};

// Ejemplo de función de registro con tracking
export const handleRegisterWithAnalytics = async (
  _userData: { email: string; name: string },
  userType: 'socio' | 'comercio' | 'asociacion'
) => {
  try {
    // Tu lógica de registro aquí
    // const result = await createUser(userData);
    
    // Rastrear registro exitoso
    event({
      action: 'sign_up',
      category: 'Authentication',
      label: `${userType} Registration Success`,
    });

    return { success: true };
  } catch (error) {
    // Rastrear error de registro
    event({
      action: 'sign_up_error',
      category: 'Authentication',
      label: `${userType} Registration Failed`,
    });

    throw error;
  }
};

// Ejemplo de función de logout con tracking
export const handleLogoutWithAnalytics = async (
  userType: 'socio' | 'comercio' | 'asociacion'
) => {
  try {
    // Tu lógica de logout aquí
    // await signOut();
    
    // Rastrear logout
    event({
      action: 'logout',
      category: 'Authentication',
      label: `${userType} Logout`,
    });

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Ejemplo de rastreo de interacciones con formularios
export const trackFormInteraction = (
  formName: string,
  action: 'start' | 'complete' | 'abandon'
) => {
  event({
    action: `form_${action}`,
    category: 'Form',
    label: formName,
  });
};

// Ejemplo de rastreo de errores de validación
export const trackValidationError = (
  fieldName: string,
  errorType: string
) => {
  event({
    action: 'validation_error',
    category: 'Form',
    label: `${fieldName}: ${errorType}`,
  });
};

/**
 * EJEMPLO DE USO EN UN COMPONENTE:
 * 
 * import { handleLoginWithAnalytics } from '@/components/analytics/examples/LoginAnalyticsExample';
 * 
 * const LoginForm = () => {
 *   const handleSubmit = async (e) => {
 *     e.preventDefault();
 *     
 *     try {
 *       await handleLoginWithAnalytics(email, 'socio');
 *       // Redirigir al dashboard
 *     } catch (error) {
 *       // Mostrar error
 *     }
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       // Tu formulario aquí
 *     </form>
 *   );
 * };
 */
