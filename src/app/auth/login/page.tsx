'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Zap,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Key,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';
import { EmailVerification } from '@/components/auth/EmailVerification';

// Loading component for Suspense fallback
function LoginPageSkeleton() {
  return (
    <div className="scrollable-container bg-gradient-to-br from-sky-50 via-celestial-50 to-sky-100 min-h-screen relative overflow-hidden">
      <div className="relative z-10 min-h-screen flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-200 rounded-3xl mx-auto mb-6 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main login component that uses useSearchParams
function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, loading, error, clearError, resetPassword, checkEmailVerification } = useAuth();
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Trigger visibility for staggered animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check for verification success or reset success from URL params
  useEffect(() => {
    const verified = searchParams.get('verified');
    const reset = searchParams.get('reset');
    
    if (verified === 'true') {
      toast.success('¡Email verificado exitosamente! Ya puedes iniciar sesión.');
    }
    
    if (reset === 'true') {
      toast.success('Contraseña restablecida exitosamente. Inicia sesión con tu nueva contraseña.');
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      clearErrors();
      clearError();

      console.log('🔐 Login attempt for:', data.email);

      const response = await signIn(data.email, data.password, data.rememberMe);

      if (!response.success) {
        if (response.requiresEmailVerification) {
          setVerificationEmail(data.email);
          setShowEmailVerification(true);
          return;
        }
        
        setError('root', { message: response.error || 'Error al iniciar sesión' });
        return;
      }

      if (!response.user) {
        setError('root', { message: 'Error al obtener datos del usuario' });
        return;
      }

      console.log('🔐 Login successful for user:', response.user.nombre);
      toast.success(`¡Bienvenido, ${response.user.nombre}!`);
      
      // Redirect based on role
      const dashboardRoutes = {
        admin: '/dashboard/admin',
        asociacion: '/dashboard/asociacion',
        comercio: '/dashboard/comercio',
        socio: '/dashboard/socio',
      };
      
      const dashboardRoute = dashboardRoutes[response.user.role as keyof typeof dashboardRoutes] || '/dashboard';
      console.log('🔐 Redirecting to:', dashboardRoute);
      router.push(dashboardRoute);
      
    } catch (error: unknown) {
      console.error('🔐 Login error:', error);
      
      let message = 'Ha ocurrido un error inesperado. Intenta nuevamente.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        message = (error as { message: string }).message;
      }
      
      setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error('Ingresa tu email para recuperar la contraseña');
      return;
    }

    if (!resetEmail.includes('@')) {
      toast.error('Ingresa un email válido');
      return;
    }

    setIsResetting(true);
    try {
      console.log('🔐 Password reset attempt for:', resetEmail);
      
      // Use the resetPassword method from useAuth hook
      const response = await resetPassword(resetEmail.trim().toLowerCase());
      
      if (response.success) {
        toast.success('Enlace de recuperación enviado a tu email');
        setShowForgotPassword(false);
        setResetEmail('');
      } else {
        toast.error(response.error || 'Error al enviar el enlace de recuperación');
      }
    } catch (error: unknown) {
      console.error('🔐 Password reset error:', error);
      toast.error('Error al enviar el enlace de recuperación');
    } finally {
      setIsResetting(false);
    }
  };

  // Function to check email verification and retry login
  const handleCheckVerificationAndRetry = async () => {
    setIsCheckingVerification(true);
    try {
      const isVerified = await checkEmailVerification();
      
      if (isVerified) {
        toast.success('¡Email verificado! Intentando iniciar sesión...');
        
        // Get current form values and retry login
        const formData = getValues();
        await handleLogin(formData);
      } else {
        toast.error('El email aún no está verificado. Revisa tu bandeja de entrada.');
      }
    } catch (error) {
      console.error('🔐 Error checking verification:', error);
      toast.error('Error al verificar el estado del email');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  // Show email verification screen
  if (showEmailVerification) {
    return (
      <EmailVerification 
        email={verificationEmail}
        onBack={() => setShowEmailVerification(false)}
      />
    );
  }

  const securityFeatures = [
    { icon: Shield, text: 'Protección SSL', color: 'text-sky-600', bgColor: 'bg-sky-50' },
    { icon: CheckCircle, text: 'Verificado', color: 'text-celestial-600', bgColor: 'bg-celestial-50' },
    { icon: Clock, text: 'Acceso 24/7', color: 'text-sky-700', bgColor: 'bg-sky-100' },
  ];

  return (
    <div className="scrollable-container bg-gradient-to-br from-sky-50 via-celestial-50 to-sky-100 min-h-screen relative overflow-hidden">
      {/* Enhanced animated background elements - matching homepage */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      
      {/* More dynamic floating geometric shapes */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-sky-200/40 to-celestial-200/40 rounded-full blur-xl animate-float-gentle"></div>
      <div className="absolute bottom-32 right-32 w-48 h-48 bg-gradient-to-br from-celestial-200/30 to-sky-300/30 rounded-full blur-2xl animate-float-delay"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-sky-300/35 to-celestial-300/35 rounded-full blur-lg animate-float"></div>
      <div className="absolute top-1/4 right-20 w-16 h-16 bg-gradient-to-br from-celestial-400/40 to-sky-400/40 rounded-full blur-md animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-sky-300/30 to-celestial-400/30 rounded-full blur-lg animate-bounce-slow"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">
          {/* Enhanced Back Button */}
          <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              href="/"
              className="group inline-flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110 border border-white/20 hover:bg-white"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors duration-300" />
            </Link>
          </div>

          {/* Enhanced Header */}
          <div className={`text-center mb-8 transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.2s' }}>
            {/* Enhanced Logo - matching homepage style */}
            <Link href="/" className="inline-block mb-6 group">
              <div className="relative">
                <div className="flex items-center justify-center space-x-4">
                  <div className="relative group">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                      <Zap className="w-8 h-8 text-white transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-sky-500/30 to-celestial-500/30 rounded-3xl blur-lg animate-pulse-glow"></div>
                    <div className="absolute -inset-4 bg-gradient-to-br from-sky-400/20 to-celestial-400/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </div>
                  
                  {/* Enhanced brand name with fixed overflow and proper spacing */}
                  <div className="relative overflow-visible">
                    <h1 className="text-4xl md:text-5xl font-bold gradient-text font-playfair tracking-tight hover:scale-105 transition-transform duration-500 leading-none py-2">
                      Fidelya
                    </h1>
                  </div>
                </div>
              </div>
            </Link>

            <div className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '0.4s' }}>
              <h2 className="text-3xl font-bold text-slate-800 mb-2 font-jakarta">
                Bienvenido de vuelta
              </h2>
              <p className="text-slate-600 text-base leading-relaxed font-jakarta">
                Accede a tu cuenta y gestiona tu programa de fidelización
              </p>
            </div>
          </div>

          {/* Enhanced Login Form */}
          <div className={`relative transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`} style={{ transitionDelay: '0.6s' }}>
            {/* Glass effect background - matching homepage style */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-500">
              <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
                {/* Enhanced Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-jakarta">
                    Correo electrónico
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                      <input
                        {...register('email')}
                        type="email"
                        placeholder="tu@email.com"
                        disabled={loading}
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                          errors.email ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                  {errors.email && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm font-medium flex items-center space-x-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.email.message}</span>
                    </motion.p>
                  )}
                </div>

                {/* Enhanced Password Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2 font-jakarta">
                    Contraseña
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Tu contraseña"
                        disabled={loading}
                        className={`w-full pl-12 pr-12 py-4 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                          errors.password ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-300 p-1 rounded-lg hover:bg-slate-100"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {errors.password && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm font-medium flex items-center space-x-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.password.message}</span>
                    </motion.p>
                  )}
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      {...register('rememberMe')}
                      type="checkbox"
                      className="w-4 h-4 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 transition-all duration-300"
                    />
                    <span className="text-sm text-slate-600 group-hover:text-slate-800 transition-colors duration-300 font-jakarta">Recordarme</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    disabled={loading}
                    className="text-sky-600 hover:text-sky-700 font-semibold text-sm transition-colors duration-300 hover:underline font-jakarta"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                {/* Enhanced Forgot Password */}
                <AnimatePresence>
                  {showForgotPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="p-5 bg-sky-50/80 backdrop-blur-sm border border-sky-200/50 rounded-2xl shadow-lg"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                          <Key className="w-5 h-5 text-sky-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sky-900 text-sm font-jakarta">Recuperar Contraseña</h3>
                          <p className="text-sky-700 text-xs font-jakarta">Te enviaremos un enlace de recuperación</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            placeholder="tu@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            disabled={loading}
                            className="w-full pl-10 pr-4 py-3 border border-sky-300/50 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/90 text-sm font-medium"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={handlePasswordReset}
                            disabled={isResetting || !resetEmail || loading}
                            className="flex-1 bg-gradient-to-r from-sky-600 to-celestial-600 text-white py-2.5 px-4 rounded-xl hover:from-sky-700 hover:to-celestial-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                          >
                            {isResetting ? (
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Enviando...</span>
                              </div>
                            ) : (
                              'Enviar enlace'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(false);
                              setResetEmail('');
                            }}
                            className="px-4 py-2.5 text-slate-600 hover:text-slate-800 transition-colors duration-300 text-sm font-medium hover:bg-white/50 rounded-xl"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Enhanced Error Alert with verification check option */}
                <AnimatePresence>
                  {(errors.root || error) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="p-4 bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-2xl shadow-lg"
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <p className="text-red-800 font-medium text-sm font-jakarta flex-1">
                          {errors.root?.message || error}
                        </p>
                      </div>
                      
                      {/* Show verification check button if error mentions email verification */}
                      {((errors.root?.message || error || '').includes('verificar') || 
                        (errors.root?.message || error || '').includes('verification')) && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <button
                            type="button"
                            onClick={handleCheckVerificationAndRetry}
                            disabled={isCheckingVerification}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center space-x-2"
                          >
                            {isCheckingVerification ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>Verificando...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Ya verifiqué mi email</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Enhanced Submit Button - matching homepage style */}
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full bg-gradient-to-r from-sky-500 via-celestial-500 to-sky-600 text-white py-4 px-6 rounded-2xl font-semibold text-base shadow-2xl hover:shadow-sky-500/40 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-2 hover:scale-105 disabled:hover:scale-100 disabled:hover:translate-y-0 flex items-center justify-center space-x-3 relative overflow-hidden group"
                >
                  {/* Button shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-celestial-600 to-sky-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <span className="relative z-10">
                    {(isSubmitting || loading) ? (
                      <div className="flex items-center space-x-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Iniciando sesión...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <LogIn className="w-5 h-5" />
                        <span>Iniciar sesión</span>
                      </div>
                    )}
                  </span>
                </button>

                {/* Enhanced Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white/80 backdrop-blur-sm text-slate-500 font-semibold text-sm rounded-full border border-slate-200 font-jakarta">
                      ¿No tienes cuenta?
                    </span>
                  </div>
                </div>

                {/* Enhanced Register Button */}
                <Link href="/auth/register">
                  <button
                    type="button"
                    disabled={loading}
                    className="w-full border-2 border-sky-300/50 text-slate-700 py-4 px-6 rounded-2xl font-semibold text-base hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50/50 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:scale-105 disabled:hover:scale-100 disabled:hover:translate-y-0 flex items-center justify-center space-x-3 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Crear cuenta nueva</span>
                  </button>
                </Link>
              </form>

              {/* Enhanced Security Features */}
              <div className={`mt-8 p-5 bg-slate-50/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '0.8s' }}>
                <div className="flex justify-around items-center">
                  {securityFeatures.map((feature, index) => (
                    <div
                      key={index}
                      className="text-center group"
                      style={{ 
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `all 0.5s ease-out ${1 + index * 0.1}s`
                      }}
                    >
                      <div className={`w-12 h-12 rounded-2xl ${feature.bgColor} flex items-center justify-center mb-2 mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                        <feature.icon className={`w-5 h-5 ${feature.color}`} />
                      </div>
                      <p className="text-xs text-slate-600 font-semibold font-jakarta">{feature.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main exported component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginPageContent />
    </Suspense>
  );
}