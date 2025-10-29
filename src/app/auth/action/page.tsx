'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, checkActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { authService } from '@/services/auth.service';
import { toast } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Loading component for Suspense fallback
function AuthActionSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-celestial-50 to-sky-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-sky-100 rounded-2xl flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
            </div>
            <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 text-sky-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Cargando...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component that uses useSearchParams
function AuthActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [actionType, setActionType] = useState<string>('');

  useEffect(() => {
    const handleAuthAction = async () => {
      try {
        const mode = searchParams.get('mode');
        const oobCode = searchParams.get('oobCode');
        const continueUrl = searchParams.get('continueUrl');

        console.log('🔐 Auth action params:', { mode, oobCode: oobCode ? 'present' : 'missing', continueUrl });

        if (!mode || !oobCode) {
          throw new Error('Parámetros de verificación inválidos');
        }

        setActionType(mode);

        switch (mode) {
          case 'verifyEmail':
            await handleEmailVerification(oobCode);
            break;
          case 'resetPassword':
            await handlePasswordReset(oobCode);
            break;
          case 'recoverEmail':
            await handleEmailRecovery(oobCode);
            break;
          default:
            throw new Error(`Modo de acción no soportado: ${mode}`);
        }
      } catch (error) {
        console.error('🔐 Auth action error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Error desconocido');
        toast.error('Error al procesar la verificación');
      }
    };

    handleAuthAction();
  }, [searchParams, router]);

  const handleEmailVerification = async (oobCode: string) => {
    try {
      console.log('🔐 Starting email verification process...');
      
      // First, check if the action code is valid
      const info = await checkActionCode(auth, oobCode);
      console.log('🔐 Action code info:', info);

      // Apply the email verification
      await applyActionCode(auth, oobCode);
      console.log('🔐 Email verification code applied successfully');

      // If there's a current user, complete the verification process
      if (auth.currentUser) {
        console.log('🔐 Current user found, completing verification...');
        const result = await authService.completeEmailVerification(auth.currentUser);
        
        if (result.success) {
          console.log('🔐 Email verification completed successfully');
          setStatus('success');
          setMessage('¡Email verificado exitosamente! Tu cuenta está ahora activa.');
          toast.success('¡Email verificado exitosamente!');
          
          // Redirect to dashboard or login after a delay
          setTimeout(() => {
            if (result.user) {
              const dashboardRoutes = {
                admin: '/dashboard/admin',
                asociacion: '/dashboard/asociacion',
                comercio: '/dashboard/comercio',
                socio: '/dashboard/socio',
              };
              const dashboardRoute = dashboardRoutes[result.user.role as keyof typeof dashboardRoutes] || '/dashboard';
              router.push(dashboardRoute);
            } else {
              router.push('/auth/login?verified=true');
            }
          }, 3000);
        } else {
          throw new Error(result.error || 'Error al completar la verificación');
        }
      } else {
        // No current user, just mark as verified and redirect to login
        console.log('🔐 No current user, redirecting to login');
        setStatus('success');
        setMessage('¡Email verificado exitosamente! Ya puedes iniciar sesión.');
        toast.success('¡Email verificado exitosamente!');
        
        setTimeout(() => {
          router.push('/auth/login?verified=true');
        }, 3000);
      }
    } catch (error) {
      console.error('🔐 Email verification error:', error);
      
      let errorMessage = 'Error al verificar el email';
      
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        
        switch (firebaseError.code) {
          case 'auth/expired-action-code':
            errorMessage = 'El enlace de verificación ha expirado. Solicita uno nuevo.';
            break;
          case 'auth/invalid-action-code':
            errorMessage = 'El enlace de verificación es inválido. Solicita uno nuevo.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Esta cuenta ha sido deshabilitada.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'No se encontró la cuenta asociada a este enlace.';
            break;
          default:
            errorMessage = `Error de verificación: ${firebaseError.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const handlePasswordReset = async (oobCode: string) => {
    try {
      console.log('🔐 Password reset action detected');
      
      // For password reset, we need to redirect to a password reset form
      // with the oobCode as a parameter
      router.push(`/auth/reset-password?oobCode=${oobCode}`);
    } catch (error) {
      console.error('🔐 Password reset error:', error);
      throw new Error('Error al procesar el restablecimiento de contraseña');
    }
  };

  const handleEmailRecovery = async (oobCode: string) => {
    try {
      console.log('🔐 Email recovery action detected');
      
      // Apply the email recovery
      await applyActionCode(auth, oobCode);
      
      setStatus('success');
      setMessage('Email recuperado exitosamente');
      toast.success('Email recuperado exitosamente');
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error) {
      console.error('🔐 Email recovery error:', error);
      throw new Error('Error al recuperar el email');
    }
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'verifyEmail':
        return 'Verificación de Email';
      case 'resetPassword':
        return 'Restablecimiento de Contraseña';
      case 'recoverEmail':
        return 'Recuperación de Email';
      default:
        return 'Procesando Acción';
    }
  };

  const getActionDescription = () => {
    switch (actionType) {
      case 'verifyEmail':
        return status === 'loading' 
          ? 'Verificando tu dirección de email...' 
          : status === 'success'
          ? 'Tu email ha sido verificado exitosamente'
          : 'Error al verificar tu email';
      case 'resetPassword':
        return 'Redirigiendo para restablecer tu contraseña...';
      case 'recoverEmail':
        return status === 'loading'
          ? 'Recuperando tu email...'
          : status === 'success'
          ? 'Tu email ha sido recuperado exitosamente'
          : 'Error al recuperar tu email';
      default:
        return 'Procesando tu solicitud...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-celestial-50 to-sky-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              {status === 'loading' && (
                <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              )}
              {status === 'error' && (
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
              )}
            </div>
            
            <h1 className="text-2xl font-bold text-slate-800 mb-2">
              {getActionTitle()}
            </h1>
            
            <p className="text-slate-600">
              {getActionDescription()}
            </p>
          </div>

          {/* Status Content */}
          <div className="space-y-6">
            {status === 'loading' && (
              <div className="text-center">
                <div className="inline-flex items-center space-x-2 text-sky-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Procesando...</span>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
                  <p className="text-green-800 font-medium">
                    {message}
                  </p>
                </div>
                
                {actionType === 'verifyEmail' && (
                  <div className="text-sm text-slate-600">
                    <p>Serás redirigido automáticamente en unos segundos...</p>
                  </div>
                )}
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <p className="text-red-800 font-medium">
                    {message}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Link href="/auth/login">
                    <button className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3 px-4 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2">
                      <span>Ir a Iniciar Sesión</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  
                  {actionType === 'verifyEmail' && (
                    <Link href="/auth/register">
                      <button className="w-full border-2 border-slate-300 text-slate-700 py-3 px-4 rounded-2xl font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all duration-300">
                        Solicitar Nueva Verificación
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="text-center">
              <Link href="/" className="text-sky-600 hover:text-sky-700 font-semibold text-sm transition-colors duration-300">
                ← Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main exported component with Suspense boundary
export default function AuthActionPage() {
  return (
    <Suspense fallback={<AuthActionSkeleton />}>
      <AuthActionContent />
    </Suspense>
  );
}