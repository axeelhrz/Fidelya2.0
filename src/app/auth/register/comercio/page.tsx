'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Store, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Globe, 
  FileText, 
  Eye, 
  EyeOff, 
  CheckCircle,
  AlertCircle,
  Sparkles,
  Clock,
  CreditCard
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { comercioRegisterSchema, type ComercioRegisterData } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';
import { EmailVerification } from '@/components/auth/EmailVerification';

export default function ComercioRegisterPage() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Trigger visibility for staggered animations
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useForm<ComercioRegisterData>({
    resolver: zodResolver(comercioRegisterSchema),
    defaultValues: {
      role: 'comercio',
      acceptTerms: false,
    }
  });

  const password = watch('password');

  const handleRegister = async (data: ComercioRegisterData) => {
    try {
      setIsSubmitting(true);
      clearErrors();

      console.log('🔐 Comercio registration attempt for:', data.email);

      const response = await signUp({
        email: data.email,
        password: data.password,
        nombre: data.nombre,
        role: 'comercio',
        telefono: data.telefono,
        additionalData: {
          nombreComercio: data.nombreComercio,
          categoria: data.categoria,
          descripcion: data.descripcion,
          direccion: data.direccion,
          horario: data.horario,
          sitioWeb: data.sitioWeb,
          cuit: data.cuit,
        }
      });

      if (!response.success) {
        setError('root', { message: response.error || 'Error al registrarse' });
        return;
      }

      if (response.requiresEmailVerification) {
        setRegistrationEmail(data.email);
        setShowEmailVerification(true);
        return;
      }

      console.log('🔐 Registration successful');
      toast.success('¡Registro exitoso! Bienvenido a Fidelya.');
      router.push('/dashboard/comercio');
      
    } catch (error: unknown) {
      console.error('🔐 Registration error:', error);
      
      let message = 'Ha ocurrido un error inesperado. Intenta nuevamente.';
      
      if (error && typeof error === 'object' && 'message' in error) {
        message = (error as { message: string }).message;
      }
      
      setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show email verification screen
  if (showEmailVerification) {
    return (
      <EmailVerification 
        email={registrationEmail}
        onBack={() => setShowEmailVerification(false)}
      />
    );
  }

  const categorias = [
    { value: 'restaurante', label: 'Restaurante' },
    { value: 'retail', label: 'Retail' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'salud', label: 'Salud' },
    { value: 'educacion', label: 'Educación' },
    { value: 'entretenimiento', label: 'Entretenimiento' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'automotriz', label: 'Automotriz' },
    { value: 'hogar', label: 'Hogar' },
    { value: 'otro', label: 'Otro' },
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

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Enhanced Back Button */}
        <div className={`mb-8 transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <Link
            href="/auth/register"
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
              <div className="flex items-center justify-center space-x-3">
                <div className="relative group">
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-500 via-celestial-500 to-sky-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-12 group-hover:rotate-0 transition-all duration-700 hover:scale-110">
                    <Store className="w-7 h-7 text-white transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-sky-500/30 to-celestial-500/30 rounded-3xl blur-lg animate-pulse-glow"></div>
                  <div className="absolute -top-1 -right-1">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-400" />
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
              Registro de Comercio
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed font-jakarta">
              Únete a nuestra red y atrae más clientes con beneficios exclusivos
            </p>
          </div>
        </div>

        {/* Enhanced Registration Form */}
        <div className={`relative transition-all duration-1200 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}`} style={{ transitionDelay: '0.6s' }}>
          {/* Glass effect background - matching homepage style */}
          <div className="glass-card p-8 hover:scale-105 transition-all duration-500">
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-slate-800 font-jakarta">Información Personal</h3>
                </div>

                {/* Name and Email Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Nombre Completo *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                        <input
                          {...register('nombre')}
                          type="text"
                          placeholder="Tu nombre completo"
                          disabled={loading}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                            errors.nombre ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                    {errors.nombre && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.nombre.message}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Correo Electrónico *
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
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
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
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                    Teléfono
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                      <input
                        {...register('telefono')}
                        type="tel"
                        placeholder="+54 9 11 1234-5678"
                        disabled={loading}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                          errors.telefono ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                  {errors.telefono && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm font-medium flex items-center space-x-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.telefono.message}</span>
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Business Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Store className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-slate-800 font-jakarta">Información del Comercio</h3>
                </div>

                {/* Business Name and Category Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Nombre del Comercio *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative">
                        <Store className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                        <input
                          {...register('nombreComercio')}
                          type="text"
                          placeholder="Nombre de tu comercio"
                          disabled={loading}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                            errors.nombreComercio ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                    {errors.nombreComercio && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.nombreComercio.message}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Categoría *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative">
                        <select
                          {...register('categoria')}
                          disabled={loading}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 font-medium appearance-none hover:border-sky-300 hover:shadow-lg ${
                            errors.categoria ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                          }`}
                        >
                          <option value="">Selecciona una categoría</option>
                          {categorias.map(categoria => (
                            <option key={categoria.value} value={categoria.value}>
                              {categoria.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {errors.categoria && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.categoria.message}</span>
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                    Descripción
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                      <textarea
                        {...register('descripcion')}
                        rows={3}
                        placeholder="Describe brevemente tu comercio..."
                        disabled={loading}
                        className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium resize-none hover:border-sky-300 hover:shadow-lg ${
                          errors.descripcion ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                  {errors.descripcion && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-600 text-sm font-medium flex items-center space-x-1"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{errors.descripcion.message}</span>
                    </motion.p>
                  )}
                </div>

                {/* Address and Hours Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Address */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Dirección
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                        <input
                          {...register('direccion')}
                          type="text"
                          placeholder="Dirección del comercio"
                          disabled={loading}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                            errors.direccion ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                    {errors.direccion && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.direccion.message}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* Hours */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Horario de Atención
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative">
                        <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                        <input
                          {...register('horario')}
                          type="text"
                          placeholder="Ej: Lun-Vie 9:00-18:00"
                          disabled={loading}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                            errors.horario ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                    {errors.horario && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.horario.message}</span>
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Website and CUIT Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Website */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Sitio Web
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                        <input
                          {...register('sitioWeb')}
                          type="url"
                          placeholder="https://tucomercio.com"
                          disabled={loading}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                            errors.sitioWeb ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                    {errors.sitioWeb && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.sitioWeb.message}</span>
                      </motion.p>
                    )}
                  </div>

                  {/* CUIT */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      CUIT
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                        <input
                          {...register('cuit')}
                          type="text"
                          placeholder="XX-XXXXXXXX-X"
                          disabled={loading}
                          className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                            errors.cuit ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                          }`}
                        />
                      </div>
                    </div>
                    {errors.cuit && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.cuit.message}</span>
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Lock className="w-5 h-5 text-sky-600" />
                  <h3 className="text-lg font-semibold text-slate-800 font-jakarta">Seguridad</h3>
                </div>

                {/* Password Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Contraseña *
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
                          className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
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

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 font-jakarta">
                      Confirmar Contraseña *
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-sky-500/20 to-celestial-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-sky-500 transition-colors duration-300" />
                        <input
                          {...register('confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirma tu contraseña"
                          disabled={loading}
                          className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all duration-300 bg-white/80 backdrop-blur-sm text-slate-800 placeholder-slate-400 font-medium hover:border-sky-300 hover:shadow-lg ${
                            errors.confirmPassword ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={loading}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-300 p-1 rounded-lg hover:bg-slate-100"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    {errors.confirmPassword && (
                      <motion.p 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-600 text-sm font-medium flex items-center space-x-1"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors.confirmPassword.message}</span>
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Enhanced Password Strength Indicator */}
                {password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 bg-sky-50/80 backdrop-blur-sm rounded-xl border border-sky-200/50"
                  >
                    <p className="text-sm font-medium text-slate-700 mb-2 font-jakarta">Fortaleza de la contraseña:</p>
                    <div className="space-y-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                              password.length >= level * 2
                                ? level <= 2 ? 'bg-red-400' : level === 3 ? 'bg-yellow-400' : 'bg-sky-400'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div className={`flex items-center space-x-2 transition-colors duration-300 ${password.length >= 8 ? 'text-sky-600' : ''}`}>
                          {password.length >= 8 ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-slate-300 rounded-full" />}
                          <span>Al menos 8 caracteres</span>
                        </div>
                        <div className={`flex items-center space-x-2 transition-colors duration-300 ${/[A-Z]/.test(password) ? 'text-sky-600' : ''}`}>
                          {/[A-Z]/.test(password) ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-slate-300 rounded-full" />}
                          <span>Una letra mayúscula</span>
                        </div>
                        <div className={`flex items-center space-x-2 transition-colors duration-300 ${/[a-z]/.test(password) ? 'text-sky-600' : ''}`}>
                          {/[a-z]/.test(password) ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-slate-300 rounded-full" />}
                          <span>Una letra minúscula</span>
                        </div>
                        <div className={`flex items-center space-x-2 transition-colors duration-300 ${/\d/.test(password) ? 'text-sky-600' : ''}`}>
                          {/\d/.test(password) ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 border border-slate-300 rounded-full" />}
                          <span>Un número</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <input
                    {...register('acceptTerms')}
                    type="checkbox"
                    disabled={loading}
                    className="w-5 h-5 text-sky-600 bg-gray-100 border-gray-300 rounded focus:ring-sky-500 focus:ring-2 mt-0.5 transition-all duration-300"
                  />
                  <span className="text-sm text-slate-600 leading-relaxed font-jakarta group-hover:text-slate-700 transition-colors duration-300">
                    Acepto los{' '}
                    <Link href="/terms" className="text-sky-600 hover:text-sky-700 font-medium underline transition-colors duration-300">
                      términos y condiciones
                    </Link>
                    {' '}y la{' '}
                    <Link href="/privacy" className="text-sky-600 hover:text-sky-700 font-medium underline transition-colors duration-300">
                      política de privacidad
                    </Link>
                    {' '}de Fidelya
                  </span>
                </label>
                {errors.acceptTerms && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm font-medium flex items-center space-x-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errors.acceptTerms.message}</span>
                  </motion.p>
                )}
              </div>

              {/* Enhanced Error Alert */}
              <AnimatePresence>
                {errors.root && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="p-4 bg-red-50/90 backdrop-blur-sm border border-red-200/50 rounded-2xl flex items-center space-x-3 shadow-lg"
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-red-800 font-medium text-sm font-jakarta">{errors.root.message}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Enhanced Submit Button - matching homepage style */}
              <button
                type="submit"
                disabled={isSubmitting || loading}
                className="w-full bg-gradient-to-r from-sky-500 via-celestial-500 to-sky-600 text-white py-4 px-6 rounded-2xl font-semibold text-base shadow-2xl hover:shadow-sky-500/40 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-2 hover:scale-105 disabled:hover:scale-100 disabled:hover:translate-y-0 flex items-center justify-center space-x-3 relative overflow-hidden group font-jakarta"
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-r from-sky-600 via-celestial-600 to-sky-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <span className="relative z-10">
                  {(isSubmitting || loading) ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creando cuenta...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Store className="w-5 h-5" />
                      <span>Crear Cuenta de Comercio</span>
                    </div>
                  )}
                </span>
              </button>

              {/* Enhanced Login Link */}
              <div className="text-center">
                <p className="text-slate-600 font-jakarta">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/auth/login" className="text-sky-600 hover:text-sky-700 font-semibold transition-colors duration-300 hover:underline">
                    Inicia sesión aquí
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

