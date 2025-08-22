import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useEmailVerification } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface EmailVerificationProps {
  onBack?: () => void;
  email?: string;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ 
  onBack, 
  email: propEmail 
}) => {
  const { email, resendVerification, checkVerification } = useEmailVerification();
  const [isResending, setIsResending] = useState(false);
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  const displayEmail = propEmail || email;

  // Trigger visibility for staggered animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleResendVerification = async () => {
    if (isResending) return;

    setIsResending(true);
    try {
      // First try without password
      const response = await resendVerification();
      
      // If it requires password, show password field
      if (!response.success && response.error?.includes('contraseña')) {
        setShowPasswordField(true);
        setIsResending(false);
        return;
      }
      
      if (response.success) {
        setLastSent(new Date());
        setShowPasswordField(false);
        setPassword('');
        toast.success('Email de verificación enviado');
      } else {
        toast.error(response.error || 'Error al enviar email');
      }
    } catch {
      toast.error('Error al enviar email de verificación');
    } finally {
      setIsResending(false);
    }
  };

  const handleResendWithPassword = async () => {
    if (isResending || !password.trim()) return;

    setIsResending(true);
    try {
      const response = await resendVerification(password);
      
      if (response.success) {
        setLastSent(new Date());
        setShowPasswordField(false);
        setPassword('');
        toast.success('Email de verificación enviado');
      } else {
        toast.error(response.error || 'Error al enviar email');
      }
    } catch {
      toast.error('Error al enviar email de verificación');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    try {
      const isVerified = await checkVerification();
      
      if (isVerified) {
        toast.success('¡Email verificado exitosamente! Redirigiendo...');
        
        // Redirect to login with verification success
        setTimeout(() => {
          window.location.href = '/auth/login?verified=true';
        }, 1500);
      } else {
        toast.error('El email aún no está verificado. Revisa tu bandeja de entrada.');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      toast.error('Error al verificar el estado del email');
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const canResend = !lastSent || (Date.now() - lastSent.getTime()) > 60000; // 1 minute

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
          {onBack && (
            <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <button
                onClick={onBack}
                className="group inline-flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110 border border-white/20 hover:bg-white"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors duration-300" />
              </button>
            </div>
          )}

          {/* Enhanced Header */}
          <div className={`text-center mb-8 transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.2s' }}>
            {/* Enhanced Logo - matching homepage style */}
            <Link href="/" className="inline-block mb-6 group">
              <div className="relative">
                <div className="flex items-center justify-center space-x-3">
                  <div className="relative group">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                      <Mail className="w-8 h-8 text-white transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="absolute -inset-2 bg-gradient-to-br from-sky-500/30 to-celestial-500/30 rounded-3xl blur-lg animate-pulse-glow"></div>
                    <div className="absolute -top-1 -right-1">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                      >
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                      </motion.div>
                    </div>
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
                Verifica tu email
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed font-jakarta">
                Hemos enviado un enlace de verificación a tu correo electrónico
              </p>
            </div>
          </div>

          {/* Enhanced Main Card */}
          <div className={`relative transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`} style={{ transitionDelay: '0.6s' }}>
            {/* Glass effect background - matching homepage style */}
            <div className="glass-card p-8 hover:scale-105 transition-all duration-500">
              
              {/* Email Display */}
              <div className="mb-8 p-5 bg-sky-50/80 backdrop-blur-sm rounded-2xl border border-sky-200/50 shadow-lg">
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-sky-500 to-celestial-500 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sky-700 font-jakarta">Email enviado a:</p>
                    <p className="text-sky-800 font-bold font-jakarta">{displayEmail}</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Instructions */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 font-jakarta">Sigue estos pasos:</h3>
                
                {[
                  { step: 1, text: 'Revisa tu bandeja de entrada y la carpeta de spam' },
                  { step: 2, text: 'Haz clic en el enlace "Verificar email" en el mensaje' },
                  { step: 3, text: 'Regresa aquí y verifica que tu email fue confirmado' }
                ].map((instruction, index) => (
                  <div 
                    key={instruction.step}
                    className="flex items-start space-x-4 group"
                    style={{ 
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                      transition: `all 0.5s ease-out ${0.8 + index * 0.1}s`
                    }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-sky-500 to-celestial-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-white text-sm font-bold">{instruction.step}</span>
                    </div>
                    <p className="text-slate-600 font-jakarta group-hover:text-slate-700 transition-colors duration-300 pt-1">
                      {instruction.text}
                    </p>
                  </div>
                ))}
              </div>

              {/* Check Verification Button */}
              <div className="mb-6">
                <button
                  onClick={handleCheckVerification}
                  disabled={isCheckingVerification}
                  className={`
                    w-full inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-500 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl font-jakarta
                    ${!isCheckingVerification
                      ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white hover:shadow-green-500/40 hover:-translate-y-1'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }
                  `}
                >
                  {isCheckingVerification ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Ya verifiqué mi email</span>
                    </>
                  )}
                </button>
              </div>

              {/* Enhanced Resend Section */}
              <div className="text-center mb-6">
                <p className="text-slate-600 mb-4 font-jakarta">
                  ¿No recibiste el email?
                </p>
                
                {/* Password Field - Show when needed */}
                {showPasswordField && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-4"
                  >
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña"
                        className="w-full px-4 py-3 pr-12 bg-white/90 backdrop-blur-sm border border-sky-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-300 font-jakarta"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && password.trim()) {
                            handleResendWithPassword();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 mt-2 font-jakarta">
                      Necesitamos tu contraseña para reenviar la verificación
                    </p>
                  </motion.div>
                )}
                
                {/* Resend Button */}
                {!showPasswordField ? (
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !canResend}
                    className={`
                      inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-500 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl font-jakarta
                      ${canResend && !isResending
                        ? 'bg-gradient-to-r from-sky-500 via-celestial-500 to-sky-600 text-white hover:shadow-sky-500/40 hover:-translate-y-1'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }
                    `}
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>Reenviar email</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleResendWithPassword}
                      disabled={isResending || !password.trim()}
                      className={`
                        w-full inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-500 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl font-jakarta
                        ${password.trim() && !isResending
                          ? 'bg-gradient-to-r from-sky-500 via-celestial-500 to-sky-600 text-white hover:shadow-sky-500/40 hover:-translate-y-1'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        }
                      `}
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-5 h-5" />
                          <span>Reenviar con contraseña</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowPasswordField(false);
                        setPassword('');
                      }}
                      className="text-sm text-slate-500 hover:text-slate-700 transition-colors duration-300 font-jakarta"
                    >
                      Cancelar
                    </button>
                  </div>
                )}

                {!canResend && lastSent && (
                  <p className="text-sm text-slate-500 mt-3 font-jakarta">
                    Puedes reenviar en {60 - Math.floor((Date.now() - lastSent.getTime()) / 1000)} segundos
                  </p>
                )}
              </div>

              {/* Enhanced Success State */}
              {lastSent && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-4 bg-green-50/90 backdrop-blur-sm border border-green-200/50 rounded-2xl flex items-center space-x-3 shadow-lg mb-6"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-green-800 font-semibold text-sm font-jakarta">Email enviado exitosamente</p>
                    <p className="text-green-600 text-sm font-jakarta">
                      Revisa tu bandeja de entrada
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Enhanced Help Section */}
              <div className="p-5 bg-sky-50/80 backdrop-blur-sm border border-sky-200/50 rounded-2xl shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sky-800 font-semibold text-sm mb-2 font-jakarta">
                      ¿Problemas con la verificación?
                    </p>
                    <p className="text-sky-700 text-sm font-jakarta leading-relaxed">
                      Contacta a soporte en{' '}
                      <a 
                        href="mailto:soporte@fidelya.com" 
                        className="font-semibold text-sky-600 hover:text-sky-700 underline transition-colors duration-300"
                      >
                        soporte@fidelya.com
                      </a>
                      {' '}si no recibes el email después de varios intentos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Enhanced Login Link */}
              <div className="text-center mt-6">
                <p className="text-slate-600 font-jakarta">
                  ¿Ya verificaste tu email?{' '}
                  <Link href="/auth/login" className="text-sky-600 hover:text-sky-700 font-semibold transition-colors duration-300 hover:underline">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};