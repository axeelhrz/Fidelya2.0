'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Mail,
  Lock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { socioInvitationService } from '@/services/socio-invitation.service';

// Loading component for Suspense fallback
function ActivateAccountSkeleton() {
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

// Main component that uses useSearchParams
function ActivateAccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Get email from URL params
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    
    // Trigger visibility for animations
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [searchParams]);

  const validateForm = () => {
    if (!email || !temporaryPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son requeridos');
      return false;
    }

    if (!email.includes('@')) {
      toast.error('Email inválido');
      return false;
    }

    if (newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const result = await socioInvitationService.completeAccountActivation(
        email,
        temporaryPassword,
        newPassword
      );

      if (result.success) {
        toast.success('¡Cuenta activada exitosamente!');
        
        // Redirect to login after success
        setTimeout(() => {
          router.push('/auth/login?activated=true');
        }, 2000);
      } else {
        toast.error(result.error || 'Error al activar la cuenta');
      }
    } catch (error) {
      console.error('Error activating account:', error);
      toast.error('Error inesperado al activar la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="scrollable-container bg-gradient-to-br from-sky-50 via-celestial-50 to-sky-100 min-h-screen relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-sky-200/40 to-celestial-200/40 rounded-full blur-xl animate-float-gentle"></div>
      <div className="absolute bottom-32 right-32 w-48 h-48 bg-gradient-to-br from-celestial-200/30 to-sky-300/30 rounded-full blur-2xl animate-float-delay"></div>
      <div className="absolute top-1/2 left-10 w-24 h-24 bg-gradient-to-br from-sky-300/35 to-celestial-300/35 rounded-full blur-lg animate-float"></div>
      <div className="absolute top-1/4 right-20 w-16 h-16 bg-gradient-to-br from-celestial-400/40 to-sky-400/40 rounded-full blur-md animate-pulse-glow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-br from-sky-300/30 to-celestial-400/30 rounded-full blur-lg animate-bounce-slow"></div>

      <div className="relative z-10 min-h-screen flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Link
              href="/auth/login"
              className="group inline-flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-110 border border-white/20 hover:bg-white"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors duration-300" />
            </Link>
          </div>

          {/* Header */}
          <div className={`text-center mb-8 transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '0.2s' }}>
            {/* Logo */}
            <Link href="/" className="inline-block mb-6 group">
              <div className="relative">
                <div className="flex items-center justify-center space-x-3">
                  <div className="relative group">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                      <Key className="w-8 h-8 text-white transition-transform duration-500 group-hover:scale-110" />
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
                Activa tu cuenta
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed font-jakarta">
                Cambia tu contraseña temporal para completar la activación
              </p>
            </div>
          </div>

          {/* Main Card */}
          <div className={`relative transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`} style={{ transitionDelay: '0.6s' }}>
            <div className="glass-card p-8 hover:scale-105 transition-all duration-500">
              
              <form onSubmit={handleActivateAccount} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-jakarta">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full pl-12 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-sky-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-300 font-jakarta"
                      required
                    />
                  </div>
                </div>

                {/* Temporary Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-jakarta">
                    Contraseña Temporal
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showTempPassword ? 'text' : 'password'}
                      value={temporaryPassword}
                      onChange={(e) => setTemporaryPassword(e.target.value)}
                      placeholder="Contraseña que recibiste por email"
                      className="w-full pl-12 pr-12 py-3 bg-white/90 backdrop-blur-sm border border-sky-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-300 font-jakarta"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowTempPassword(!showTempPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-300"
                    >
                      {showTempPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-jakarta">
                    Esta contraseña fue enviada a tu email
                  </p>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-jakarta">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-12 pr-12 py-3 bg-white/90 backdrop-blur-sm border border-sky-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-300 font-jakarta"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-300"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 font-jakarta">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite tu nueva contraseña"
                      className="w-full pl-12 pr-12 py-3 bg-white/90 backdrop-blur-sm border border-sky-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-all duration-300 font-jakarta"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1 font-jakarta flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Las contraseñas no coinciden
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !email || !temporaryPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className={`
                    w-full inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-500 transform hover:scale-105 disabled:hover:scale-100 shadow-lg hover:shadow-xl font-jakarta
                    ${!isLoading && email && temporaryPassword && newPassword && confirmPassword && newPassword === confirmPassword
                      ? 'bg-gradient-to-r from-sky-500 via-celestial-500 to-sky-600 text-white hover:shadow-sky-500/40 hover:-translate-y-1'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Activando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Activar Cuenta</span>
                    </>
                  )}
                </button>
              </form>

              {/* Help Section */}
              <div className="mt-8 p-5 bg-sky-50/80 backdrop-blur-sm border border-sky-200/50 rounded-2xl shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sky-800 font-semibold text-sm mb-2 font-jakarta">
                      ¿Problemas para activar tu cuenta?
                    </p>
                    <ul className="text-sky-700 text-sm font-jakarta leading-relaxed space-y-1">
                      <li>• Verifica que estés usando la contraseña temporal correcta</li>
                      <li>• Revisa tu email (incluyendo spam) para la contraseña</li>
                      <li>• Contacta a soporte en{' '}
                        <a 
                          href="mailto:soporte@fidelya.com" 
                          className="font-semibold text-sky-600 hover:text-sky-700 underline transition-colors duration-300"
                        >
                          soporte@fidelya.com
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Login Link */}
              <div className="text-center mt-6">
                <p className="text-slate-600 font-jakarta">
                  ¿Ya tienes una cuenta activa?{' '}
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
}

// Main exported component with Suspense boundary
export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<ActivateAccountSkeleton />}>
      <ActivateAccountContent />
    </Suspense>
  );
}